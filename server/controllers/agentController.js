// controllers/agentController.js — DAB AI v6.0
// Agent orchestrator endpoints

const orchestrator   = require('../services/orchestratorService');
const logger         = require('../services/loggerService');
const { supabaseAdmin } = require('../services/supabaseClient');
const { getRecentActivity } = require('../services/activityService');

// POST /api/agent/command
async function command(req, res, next) {
  try {
    const { command: cmd, context = {} } = req.body;
    if (!cmd) return res.status(400).json({ error: 'command is required' });
    const userId = req.user?.userId || null;
    const result = await orchestrator.processCommand(cmd, userId, context);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

// GET /api/agent/activity
async function activity(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const data = await orchestrator.getAgentActivity(limit);
    res.json({ activity: data, count: data.length });
  } catch (err) { next(err); }
}

// GET /api/agent/stats
async function stats(req, res, next) {
  try {
    const data = await orchestrator.getAgentStats();
    res.json(data);
  } catch (err) { next(err); }
}

// GET /api/agent/tasks
async function getTasks(req, res, next) {
  try {
    const { status, agent_type, limit = 50 } = req.query;
    let query = supabaseAdmin.from('agent_tasks').select('*').order('created_at', { ascending: false }).limit(parseInt(limit));
    if (status) query = query.eq('status', status);
    if (agent_type) query = query.eq('agent_type', agent_type);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ tasks: data, count: data.length });
  } catch (err) { next(err); }
}

// POST /api/agent/tasks
async function createTask(req, res, next) {
  try {
    const { agentType, taskType, priority, payload, scheduledFor } = req.body;
    if (!agentType || !taskType) return res.status(400).json({ error: 'agentType and taskType required' });
    const task = await orchestrator.createTask({
      agentType, taskType, priority: priority || 'medium',
      payload: payload || {}, scheduledFor: scheduledFor || null,
      userId: req.user?.userId
    });
    res.status(201).json(task);
  } catch (err) { next(err); }
}

// GET /api/agent/decisions
async function getDecisions(req, res, next) {
  try {
    const { limit = 20, agent_type } = req.query;
    let query = supabaseAdmin.from('agent_decisions').select('*').order('created_at', { ascending: false }).limit(parseInt(limit));
    if (agent_type) query = query.eq('agent_type', agent_type);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ decisions: data, count: data.length });
  } catch (err) { next(err); }
}

// GET /api/agent/logs
async function getLogs(req, res, next) {
  try {
    const { level, category, limit = 100 } = req.query;
    let query = supabaseAdmin.from('system_logs').select('*').order('created_at', { ascending: false }).limit(parseInt(limit));
    if (level) query = query.eq('level', level);
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ logs: data, count: data.length });
  } catch (err) { next(err); }
}

// GET /api/agent/status  — spec endpoint
async function getStatus(req, res, next) {
  try {
    const agentStats = await orchestrator.getAgentStats();

    // Running / queued tasks
    const { data: runningTasks } = await supabaseAdmin
      .from('agent_tasks')
      .select('id, task_type, agent_type, status, created_at')
      .in('status', ['running', 'pending'])
      .order('created_at', { ascending: false })
      .limit(10);

    // Last 5 decisions
    const { data: lastDecisions } = await supabaseAdmin
      .from('agent_decisions')
      .select('decision_type, action_taken, confidence_score, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // Recent agent activity
    const recentActivity = await getRecentActivity(10);

    res.json({
      status: 'active',
      provider:        agentStats.provider,
      tasks_24h:       agentStats.tasks_24h,
      decisions_24h:   agentStats.decisions_24h,
      avg_confidence:  agentStats.avg_confidence,
      by_task_status:  agentStats.by_status,
      running_tasks:   runningTasks   || [],
      last_decisions:  lastDecisions  || [],
      recent_activity: recentActivity || [],
      timestamp: new Date().toISOString(),
    });
  } catch (err) { next(err); }
}

module.exports = { command, activity, stats, getStatus, getTasks, createTask, getDecisions, getLogs };
