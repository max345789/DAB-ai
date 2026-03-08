// services/loggerService.js — DAB AI v5.0
// Central logging service: writes to system_logs table + console

const { supabaseAdmin } = require('./supabaseClient');

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = process.env.LOG_LEVEL || 'info';

function shouldLog(level) {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function fmt(level, category, message, meta) {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
  return `[${ts}] [${level.toUpperCase()}] [${category}] ${message}${metaStr}`;
}

async function writeLog(level, category, message, meta = null) {
  if (shouldLog(level)) {
    const line = fmt(level, category, message, meta);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }

  // Persist to DB (non-blocking)
  try {
    const now = new Date().toISOString();
    await supabaseAdmin.from('system_logs').insert({
      level,
      service:    category,   // legacy column
      category,               // v5 column
      message,
      metadata:   meta || null,  // legacy column
      meta:       meta || null,  // v5 column
      created_at: now,
      timestamp:  now            // legacy column
    });
  } catch (_) {
    // DB write failure must never crash the app
  }
}

const logger = {
  debug: (category, message, meta) => writeLog('debug', category, message, meta),
  info:  (category, message, meta) => writeLog('info',  category, message, meta),
  warn:  (category, message, meta) => writeLog('warn',  category, message, meta),
  error: (category, message, meta) => writeLog('error', category, message, meta),

  // Convenience wrappers
  agentDecision: (agentId, decision, context) =>
    writeLog('info', 'AGENT_DECISION', decision, { agentId, ...context }),

  taskEvent: (taskId, event, detail) =>
    writeLog('info', 'TASK_EVENT', event, { taskId, ...detail }),

  automationFired: (ruleId, ruleName, result) =>
    writeLog('info', 'AUTOMATION', `Rule fired: ${ruleName}`, { ruleId, result }),

  integrationCall: (service, action, status, detail) =>
    writeLog('info', 'INTEGRATION', `${service}.${action} → ${status}`, detail),

  authEvent: (userId, event, ip) =>
    writeLog('info', 'AUTH', event, { userId, ip }),
};

module.exports = logger;
