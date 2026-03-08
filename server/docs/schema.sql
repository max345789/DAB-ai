-- ═══════════════════════════════════════════════════════════════
--  DAB AI Platform  –  Canonical Database Schema
--  Tech: PostgreSQL via Supabase
--  Last updated: 2026-03-08
-- ═══════════════════════════════════════════════════════════════

-- ── USERS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role          TEXT NOT NULL DEFAULT 'user',   -- 'admin' | 'user' | 'viewer'
  createdat     TIMESTAMPTZ DEFAULT NOW()
);

-- ── CAMPAIGNS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  platform         TEXT,                       -- 'meta' | 'google' | 'tiktok' | 'manual'
  daily_budget     NUMERIC(12,2) DEFAULT 0,
  total_budget     NUMERIC(12,2) DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'draft', -- 'draft'|'active'|'paused'|'completed'
  goal             TEXT,                       -- 'leads' | 'conversions' | 'awareness'
  location         TEXT,
  target_audience  JSONB DEFAULT '{}',
  ctr              NUMERIC(6,4) DEFAULT 0,
  cpl              NUMERIC(10,2) DEFAULT 0,
  conversion_rate  NUMERIC(6,4) DEFAULT 0,
  leads_generated  INTEGER DEFAULT 0,
  spend_so_far     NUMERIC(12,2) DEFAULT 0,
  createdat        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status    ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_platform  ON campaigns(platform);

-- ── LEADS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  company     TEXT,
  source      TEXT,                             -- channel / utm_source
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'new',      -- 'new' | 'qualified' | 'meeting' | 'closed'
  score       INTEGER DEFAULT 0,               -- 0-100
  score_tier  TEXT,                            -- 'Hot' | 'Warm' | 'Cold'
  score_reason TEXT,
  message     TEXT,                            -- initial inquiry
  qualified_at TIMESTAMPTZ,
  createdat   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_status      ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_createdat   ON leads(createdat DESC);

-- ── ADS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ads (
  id          SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  headline    TEXT,
  description TEXT,
  cta         TEXT,
  targeting   JSONB DEFAULT '{}',
  platform    TEXT,
  status      TEXT DEFAULT 'draft',
  createdat   TIMESTAMPTZ DEFAULT NOW()
);

-- ── CAMPAIGN_STATS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_stats (
  id          SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  spend       NUMERIC(12,2) DEFAULT 0,
  clicks      INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  leads       INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  UNIQUE (campaign_id, date)
);

CREATE INDEX IF NOT EXISTS idx_campaign_stats_campaign_id ON campaign_stats(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_stats_date        ON campaign_stats(date DESC);

-- ── AUTOMATION_RULES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_rules (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  rule_name       TEXT,                        -- legacy alias
  trigger_type    TEXT NOT NULL,               -- 'lead_created'|'lead_scored'|'daily'|'schedule'
  trigger         TEXT,                        -- legacy alias
  conditions      JSONB DEFAULT '[]',          -- [{ metric, operator, threshold }]
  condition       TEXT,                        -- legacy text alias
  actions         JSONB DEFAULT '[]',          -- [{ type, params }]
  action          TEXT,                        -- legacy alias
  action_config   TEXT,                        -- legacy alias
  is_active       BOOLEAN DEFAULT TRUE,
  status          TEXT DEFAULT 'active',       -- legacy alias
  description     TEXT,
  priority        INTEGER DEFAULT 1,
  runs_count      INTEGER DEFAULT 0,
  last_triggered  TIMESTAMPTZ,
  last_run_at     TIMESTAMPTZ,                 -- legacy alias
  createdat       TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUTOMATION_HISTORY ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_history (
  id           SERIAL PRIMARY KEY,
  rule_id      INTEGER REFERENCES automation_rules(id) ON DELETE SET NULL,
  rule_name    TEXT,
  trigger_type TEXT,
  target_id    INTEGER,
  target_type  TEXT,                           -- 'lead' | 'campaign' | 'system'
  result       JSONB DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'success', -- 'success' | 'failed' | 'skipped'
  error_msg    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_history_rule_id    ON automation_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_history_created_at ON automation_history(created_at DESC);

-- ── MEETINGS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetings (
  id          SERIAL PRIMARY KEY,
  lead_id     INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  title       TEXT,
  date        DATE,
  time        TIME,
  duration_mins INTEGER DEFAULT 30,
  status      TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled'|'completed'|'cancelled'
  location    TEXT,
  notes       TEXT,
  calendar_event_id TEXT,
  createdat   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_lead_id ON meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date    ON meetings(date);

-- ── AGENT_ACTIVITY ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_activity (
  id          SERIAL PRIMARY KEY,
  action      TEXT NOT NULL,
  description TEXT,
  category    TEXT DEFAULT 'general',
  target_id   INTEGER,
  target_type TEXT,
  metadata    JSONB DEFAULT '{}',
  user_id     INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_activity_created_at ON agent_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activity_category   ON agent_activity(category);

-- ── AGENT_TASKS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_tasks (
  id            SERIAL PRIMARY KEY,
  task_name     TEXT,
  task_type     TEXT NOT NULL,
  agent_type    TEXT DEFAULT 'orchestrator',
  status        TEXT NOT NULL DEFAULT 'pending', -- 'pending'|'running'|'completed'|'failed'|'scheduled'
  payload       JSONB DEFAULT '{}',
  result        JSONB,
  error_msg     TEXT,
  triggered_by  TEXT,
  created_by    TEXT,
  scheduled_for TIMESTAMPTZ,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  duration_ms   INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  createdat     TIMESTAMPTZ DEFAULT NOW()        -- legacy alias
);

-- ── AGENT_DECISIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_decisions (
  id               SERIAL PRIMARY KEY,
  task_id          INTEGER,
  agent_type       TEXT DEFAULT 'orchestrator',
  decision_type    TEXT,
  description      TEXT,
  reasoning        TEXT,
  action_taken     TEXT,
  action_result    TEXT,
  confidence       NUMERIC(5,4) DEFAULT 0.8,    -- legacy
  confidence_score NUMERIC(5,4) DEFAULT 0.8,    -- v5
  impact           TEXT,
  context          JSONB DEFAULT '{}',           -- legacy
  metadata         JSONB DEFAULT '{}',           -- v5
  ai_generated     BOOLEAN DEFAULT FALSE,
  timestamp        TIMESTAMPTZ DEFAULT NOW(),    -- legacy
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── FINANCE ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS finance (
  id            SERIAL PRIMARY KEY,
  campaign_id   INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  spend         NUMERIC(12,2) DEFAULT 0,
  revenue       NUMERIC(12,2) DEFAULT 0,
  cost_per_lead NUMERIC(10,2) DEFAULT 0,
  roas          NUMERIC(8,4)  DEFAULT 0,
  leads_count   INTEGER DEFAULT 0,
  conversions   INTEGER DEFAULT 0,
  date          DATE DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (campaign_id, date)
);

CREATE INDEX IF NOT EXISTS idx_finance_campaign_id ON finance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_finance_date        ON finance(date DESC);

-- ── INTEGRATIONS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integrations (
  id            SERIAL PRIMARY KEY,
  userid        INTEGER,
  service_name  TEXT,
  platform      TEXT,                           -- legacy alias
  display_name  TEXT,
  status        TEXT DEFAULT 'inactive',        -- legacy: 'active'|'inactive'
  is_active     BOOLEAN DEFAULT FALSE,          -- v5
  credentials   JSONB DEFAULT '{}',
  config        JSONB DEFAULT '{}',
  connected_at  TIMESTAMPTZ,
  last_sync     TIMESTAMPTZ,
  error_msg     TEXT,
  createdat     TIMESTAMPTZ DEFAULT NOW(),
  updatedat     TIMESTAMPTZ DEFAULT NOW()
);

-- ── SYSTEM_LOGS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_logs (
  id        SERIAL PRIMARY KEY,
  level     TEXT NOT NULL,                      -- 'debug'|'info'|'warn'|'error'
  service   TEXT,
  category  TEXT,
  message   TEXT NOT NULL,
  metadata  JSONB,
  meta      JSONB,
  user_id   INTEGER,
  ip        TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_level      ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);

-- ── CONVERSATIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id         SERIAL PRIMARY KEY,
  lead_id    INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  user_id    INTEGER,
  role       TEXT NOT NULL DEFAULT 'user',      -- 'user' | 'assistant'
  message    TEXT NOT NULL,
  intent     TEXT,
  createdat  TIMESTAMPTZ DEFAULT NOW()
);

-- ── FOLLOWUPS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS followups (
  id           SERIAL PRIMARY KEY,
  lead_id      INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  subject      TEXT,
  message      TEXT NOT NULL,
  channel      TEXT DEFAULT 'email',            -- 'email'|'whatsapp'|'sms'
  status       TEXT DEFAULT 'scheduled',        -- 'scheduled'|'sent'|'failed'
  scheduled_at TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  attempts     INTEGER DEFAULT 0,
  createdat    TIMESTAMPTZ DEFAULT NOW()
);

-- ── DASHBOARD VIEW ─────────────────────────────────────────────
DROP VIEW IF EXISTS dashboard_stats;

CREATE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*)    FROM leads)                                              AS total_leads,
  (SELECT COUNT(*)    FROM leads WHERE createdat >= NOW() - INTERVAL '24h')    AS new_leads,
  (SELECT COUNT(*)    FROM campaigns WHERE status = 'active')                  AS active_campaigns,
  (SELECT COALESCE(SUM(spend), 0) FROM campaign_stats
     WHERE date >= CURRENT_DATE - INTERVAL '30 days')                          AS ad_spend,
  (SELECT COUNT(*)    FROM meetings WHERE status = 'scheduled')                AS meetings_booked,
  (SELECT COUNT(*)    FROM conversations)                                      AS total_chat_messages,
  (SELECT COUNT(*)    FROM agent_tasks WHERE status = 'running')               AS running_tasks,
  (SELECT COUNT(*)    FROM agent_tasks
     WHERE created_at >= NOW() - INTERVAL '24h')                               AS tasks_today,
  (SELECT COUNT(*)    FROM automation_rules WHERE is_active = TRUE)             AS active_rules,
  (SELECT COALESCE(SUM(revenue), 0) FROM finance
     WHERE date >= CURRENT_DATE - INTERVAL '30 days')                          AS monthly_revenue,
  (SELECT COALESCE(AVG(score), 0) FROM leads WHERE score IS NOT NULL)          AS avg_lead_score;
