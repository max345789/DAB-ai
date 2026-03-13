// ─────────────────────────────────────────────────────────────
//  DAB AI – Express Server Entry Point  v6.0
//  Stage 1: Core API + Chat Agent
//  Stage 2: Lead Qualification + Follow-up Automation
//  Stage 3: Ad Campaign Generation + Analytics
//  Stage 4: Financial Intelligence + Optimization Engine
//  Stage 5: AI Orchestrator + Automation Engine + Integrations
//  Stage 6: Reports + Integration Connect/Disconnect
// ─────────────────────────────────────────────────────────────
// Always load backend env from server/.env even when started from repo root (PM2, Render, etc).
const path = require('path');
require('dotenv').config({ path: process.env.ENV_FILE || path.resolve(__dirname, '.env') });

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

// ── Routes (Stages 1-4) ───────────────────────────────────────
const chatRoutes      = require('./routes/chatRoutes');
const leadRoutes      = require('./routes/leadRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const campaignRoutes  = require('./routes/campaignRoutes');
const followupRoutes  = require('./routes/followupRoutes');
const meetingRoutes   = require('./routes/meetingRoutes');
const financeRoutes   = require('./routes/financeRoutes');

// ── Routes (Stage 5) ─────────────────────────────────────────
const authRoutes        = require('./routes/authRoutes');
const agentRoutes       = require('./routes/agentRoutes');
const automationRoutes  = require('./routes/automationRoutes');
const integrationRoutes = require('./routes/integrationRoutes');

// ── Routes (Stage 6) ─────────────────────────────────────────
const reportsRoutes     = require('./routes/reportsRoutes');
const systemRoutes      = require('./routes/systemRoutes');
const profileRoutes     = require('./routes/profileRoutes');

// ── Services ──────────────────────────────────────────────────
const { startTaskScheduler }  = require('./services/taskScheduler');
const { PROVIDER }            = require('./services/aiService');
const logger                  = require('./services/loggerService');
const { supabaseAdmin }       = require('./services/supabaseClient');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS Configuration ────────────────────────────────────────
// Production:  set ALLOWED_ORIGIN=https://app.yourdomain.com
// Multi-origin: comma-separated, e.g. https://app.yourdomain.com,https://staging.yourdomain.com
// Development: falls back to '*' when ALLOWED_ORIGIN is not set
const _allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
  : null;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (!_allowedOrigins) return callback(null, true);          // dev wildcard
    if (_allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' is not permitted`));
  },
  methods     : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials : true,
}));

// ── Global Middleware ─────────────────────────────────────────
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString();
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Health / Route Map ────────────────────────────────────────
app.get('/', (_req, res) => res.json({
  status      : 'ok',
  service     : 'DAB AI Backend',
  version     : '6.0.0',
  ai_provider : PROVIDER,
  stages: {
    1: 'Core API, Chat Agent',
    2: 'Lead Qualification + Follow-up Automation',
    3: 'Ad Campaign Generation + Analytics',
    4: 'Financial Intelligence + Optimization Engine',
    5: 'AI Orchestrator + Automation Engine + Integrations',
    6: 'Reports + Integration Connect/Disconnect',
  },
  endpoints: {
    auth: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/me',
    ],
    agent: [
      'GET  /api/agent/status',
      'GET  /api/agent/tasks',
      'GET  /api/agent/decisions',
      'POST /api/agent/command',
      'GET  /api/agent/activity',
      'GET  /api/agent/stats',
      'POST /api/agent/tasks',
      'GET  /api/agent/logs',
    ],
    automation: [
      'GET    /api/automation/rules',
      'POST   /api/automation/rule',
      'POST   /api/automation/rules',
      'PUT    /api/automation/rules/:id',
      'DELETE /api/automation/rules/:id',
      'GET    /api/automation/history',
      'POST   /api/automation/trigger',
      'POST   /api/automation/test',
    ],
    integrations: [
      'GET  /api/integrations',
      'POST /api/integrations',
      'PUT  /api/integrations/:id',
      'DELETE /api/integrations/:id',
      'POST /api/integration/connect',
      'POST /api/integration/disconnect',
      'POST /api/integrations/meta/sync/:campaignId',
      'POST /api/integrations/google/sync/:campaignId',
      'POST /api/integrations/whatsapp/send',
      'GET  /api/integrations/whatsapp/webhook',
      'POST /api/integrations/email/send',
      'POST /api/integrations/calendar/book',
      'GET  /api/integrations/calendar/upcoming',
    ],
    reports: [
      'GET /api/reports/daily',
      'GET /api/reports/campaign',
      'GET /api/reports/leads',
    ],
    dashboard : [
      'GET /api/dashboard/summary',
      'GET /api/dashboard/charts',
      'GET /api/dashboard/activity',
      'GET /api/dashboard',
    ],
    chat      : ['POST /api/chat', 'GET /api/chat/history'],
    leads     : ['POST /api/lead', 'GET /api/leads', 'GET /api/lead/:id',
                 'PATCH /api/lead/:id', 'POST /api/lead/:id/rescore'],
    followups : ['POST /api/followup', 'GET /api/followups', 'PATCH /api/followup/:id'],
    meetings  : ['POST /api/meeting', 'GET /api/meetings', 'PATCH /api/meeting/:id'],
    campaigns : ['POST /api/campaign', 'GET /api/campaigns', 'GET /api/campaign/:id',
                 'POST /api/campaign/generate', 'PATCH /api/campaign/:id',
                 'POST /api/campaign/:id/stats'],
    finance   : ['GET /api/finance/summary', 'GET /api/campaign/:id/finance',
                 'POST /api/finance/expense', 'POST /api/finance/revenue',
                 'GET /api/finance/optimizations', 'POST /api/finance/optimize',
                 'POST /api/finance/optimization/:id/apply', 'POST /api/finance/daily-update'],
    system    : ['GET /system/health', 'GET /system/metrics'],
  },
  time: new Date().toISOString(),
}));

// ── Health Check (public — no auth required) ──────────────────
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'unknown';
  try {
    const { error } = await supabaseAdmin.from('users').select('id').limit(1);
    dbStatus = error ? 'error' : 'connected';
  } catch (_e) {
    dbStatus = 'unreachable';
  }
  const healthy = dbStatus === 'connected';
  res.status(healthy ? 200 : 503).json({
    status  : healthy ? 'ok' : 'degraded',
    db      : dbStatus,
    version : '6.0.0',
    uptime  : Math.floor(process.uptime()) + 's',
    time    : new Date().toISOString(),
  });
});

app.use(systemRoutes);

// ── API Routes (Public + Core) ────────────────────────────────
// Note: auth-protected routers are mounted after public routes
// so they don't block non-auth endpoints (frontend has no auth yet).
app.use('/api', authRoutes);
app.use('/api', chatRoutes);
app.use('/api', leadRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', campaignRoutes);
app.use('/api', followupRoutes);
app.use('/api', meetingRoutes);
app.use('/api', financeRoutes);
app.use('/api', profileRoutes);

// ── API Routes (Auth-protected) ───────────────────────────────
app.use('/api', agentRoutes);
app.use('/api', automationRoutes);
app.use('/api', integrationRoutes);
app.use('/api', reportsRoutes);

// ── 404 Fallback ──────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global Error Handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error('SERVER', err.message, { stack: err.stack?.split('\n')[1] });
  res.status(err.status || 500).json({
    error  : err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  DAB AI v6.0 running on http://localhost:${PORT}`);
  console.log(`   AI Provider : ${PROVIDER}`);
  console.log(`   ENV         : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Stages      : 1 → 6 active\n`);

  // Start unified task scheduler (replaces individual Stage 2 + Stage 4 schedulers)
  startTaskScheduler();
});

module.exports = app;
