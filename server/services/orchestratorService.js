// services/orchestratorService.js — DAB AI v5.0
// Central AI agent coordinator: interprets commands, routes to sub-agents,
// schedules tasks, generates strategic decisions, logs all actions.

const { supabaseAdmin } = require('./supabaseClient');
const logger = require('./loggerService');

// ─── AI provider (same pattern as aiService.js) ───────────────────────────
let anthropic = null, openai = null;
let PROVIDER = 'fallback';
if (process.env.ANTHROPIC_API_KEY) {
  const Anthropic = require('@anthropic-ai/sdk');
  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  PROVIDER = 'anthropic';
} else if (process.env.OPENAI_API_KEY) {
  const OpenAI = require('openai');
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  PROVIDER = 'openai';
}

async function callAI(systemPrompt, userPrompt) {
  if (PROVIDER === 'anthropic') {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });
    return msg.content[0].text;
  }
  if (PROVIDER === 'openai') {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });
    return res.choices[0].message.content;
  }
  return null; // fallback handled by caller
}

// ─── Intent classification ────────────────────────────────────────────────
const INTENTS = {
  CREATE_CAMPAIGN:    ['create campaign', 'new campaign', 'launch ad', 'start campaign'],
  OPTIMIZE_CAMPAIGN:  ['optimize', 'improve campaign', 'boost performance', 'reduce cpl'],
  SCORE_LEAD:         ['score lead', 'qualify lead', 'lead score'],
  FOLLOW_UP:          ['follow up', 'send message', 'contact lead', 'reach out'],
  BOOK_MEETING:       ['book meeting', 'schedule meeting', 'set appointment'],
  FINANCE_REPORT:     ['roi', 'roas', 'revenue', 'profit', 'finance report', 'spend report'],
  SYSTEM_STATUS:      ['status', 'health check', 'system report', 'what is running'],
  AUTOMATION_LIST:    ['list rules', 'automation rules', 'active rules'],
  GENERAL:            []
};

function classifyIntent(command) {
  const lower = command.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENTS)) {
    if (keywords.some(kw => lower.includes(kw))) return intent;
  }
  return 'GENERAL';
}

// ─── Task creation helper ─────────────────────────────────────────────────
async function createTask({ agentType, taskType, priority = 'medium', payload = {}, scheduledFor = null, userId = null }) {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin.from('agent_tasks').insert({
    task_name:     taskType,
    task_type:     taskType,
    agent_type:    agentType,
    payload:       payload,
    status:        scheduledFor ? 'scheduled' : 'pending',
    scheduled_for: scheduledFor,
    created_by:    userId ? String(userId) : null,
    triggered_by:  agentType,
    createdat:     now,
    created_at:    now
  }).select().single();
  if (error) throw error;
  return data;
}

// ─── Decision logging helper ──────────────────────────────────────────────
async function logDecision({ taskId = null, agentType, decisionType, reasoning, action, confidence = 0.8, metadata = {} }) {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin.from('agent_decisions').insert({
    task_id:          taskId,
    agent_type:       agentType,
    decision_type:    decisionType,
    description:      reasoning,   // legacy column
    reasoning:        reasoning,   // v5 column
    action_taken:     action,
    confidence:       confidence,  // legacy column
    confidence_score: confidence,  // v5 column
    context:          metadata,    // legacy column
    metadata:         metadata,    // v5 column
    ai_generated:     PROVIDER !== 'fallback',
    timestamp:        now,         // legacy column
    created_at:       now
  }).select().single();
  if (error) throw error;
  return data;
}

// ─── Strategic decision generators ───────────────────────────────────────
async function generateStrategicPlan(context) {
  const system = `You are DAB AI, an autonomous marketing intelligence platform.
Given a business context, produce a concise 3-step strategic marketing plan.
Return JSON: { "plan": [{ "step": number, "action": string, "rationale": string, "priority": "high|medium|low" }], "summary": string }`;

  const raw = await callAI(system, JSON.stringify(context));
  if (raw) {
    try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); } catch (_) {}
  }
  return {
    plan: [
      { step: 1, action: 'Score and segment all new leads', rationale: 'Focus resources on high-value prospects', priority: 'high' },
      { step: 2, action: 'Launch targeted ad campaign for hot leads', rationale: 'Capitalize on warm pipeline', priority: 'high' },
      { step: 3, action: 'Review campaign ROAS and reallocate budget', rationale: 'Maximise return on ad spend', priority: 'medium' }
    ],
    summary: 'Prioritise lead conversion and campaign efficiency'
  };
}

// ─── Main orchestrator entry point ────────────────────────────────────────
async function processCommand(command, userId = null, context = {}) {
  const intent = classifyIntent(command);
  logger.info('ORCHESTRATOR', `Command received: "${command}"`, { intent, userId });

  let task, decision, reply, subAgentResult = null;

  // Create a master task record
  task = await createTask({
    agentType: 'orchestrator',
    taskType: intent,
    priority: 'high',
    payload: { command, context },
    userId
  });

  // Route to appropriate sub-agent logic
  switch (intent) {
    case 'CREATE_CAMPAIGN': {
      const plan = await generateStrategicPlan({ goal: 'campaign creation', command, ...context });
      reply = `Campaign strategy ready. ${plan.summary}`;
      subAgentResult = plan;
      break;
    }
    case 'OPTIMIZE_CAMPAIGN': {
      const { optimizeCampaigns } = require('./optimizationService');
      const suggestions = await optimizeCampaigns();
      reply = `Optimization complete. Generated ${suggestions.length} suggestion(s).`;
      subAgentResult = { suggestions };
      break;
    }
    case 'FINANCE_REPORT': {
      const { getPlatformFinanceSummary } = require('./financeService');
      const summary = await getPlatformFinanceSummary();
      reply = `Finance summary: Revenue $${summary.total_revenue || 0}, Spend $${summary.total_spend || 0}, ROAS ${summary.avg_roas || 0}x`;
      subAgentResult = summary;
      break;
    }
    case 'SYSTEM_STATUS': {
      const { data: tasks } = await supabaseAdmin
        .from('agent_tasks').select('status').gte('created_at', new Date(Date.now() - 86400000).toISOString());
      const statusCount = (tasks || []).reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});
      reply = `System active. Tasks last 24h: ${JSON.stringify(statusCount)}`;
      subAgentResult = statusCount;
      break;
    }
    case 'GENERAL':
    default: {
      const system = 'You are DAB AI, a marketing automation assistant. Answer concisely.';
      const aiReply = await callAI(system, command);
      reply = aiReply || 'I can help with campaigns, leads, follow-ups, and financial reports. What would you like to do?';
      break;
    }
  }

  // Log the decision
  decision = await logDecision({
    taskId: task.id,
    agentType: 'orchestrator',
    decisionType: intent,
    reasoning: `Command: "${command}" → classified as ${intent}`,
    action: reply,
    confidence: 0.85,
    metadata: { subAgentResult }
  });

  // Mark task complete
  await supabaseAdmin.from('agent_tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString(), result: { reply } })
    .eq('id', task.id);

  logger.agentDecision('orchestrator', reply, { intent, taskId: task.id });

  return { intent, reply, taskId: task.id, decisionId: decision.id, result: subAgentResult };
}

// ─── Get recent agent activity ────────────────────────────────────────────
async function getAgentActivity(limit = 20) {
  const { data: tasks } = await supabaseAdmin
    .from('agent_tasks')
    .select('*, agent_decisions(*)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return tasks || [];
}

async function getAgentStats() {
  const since24h = new Date(Date.now() - 86400000).toISOString();
  const [{ data: tasks }, { data: decisions }] = await Promise.all([
    supabaseAdmin.from('agent_tasks').select('status, agent_type').gte('created_at', since24h),
    supabaseAdmin.from('agent_decisions').select('decision_type, confidence_score').gte('created_at', since24h)
  ]);

  const byStatus = (tasks || []).reduce((a, t) => { a[t.status] = (a[t.status] || 0) + 1; return a; }, {});
  const avgConf = decisions && decisions.length
    ? (decisions.reduce((s, d) => s + (d.confidence_score || 0), 0) / decisions.length).toFixed(2)
    : 0;

  return {
    tasks_24h: (tasks || []).length,
    by_status: byStatus,
    decisions_24h: (decisions || []).length,
    avg_confidence: parseFloat(avgConf),
    provider: PROVIDER
  };
}

module.exports = { processCommand, createTask, logDecision, getAgentActivity, getAgentStats };
