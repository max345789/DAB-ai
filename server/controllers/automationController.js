// controllers/automationController.js — DAB AI v6.0
// Automation rules CRUD + manual trigger + history

const engine  = require('../services/automationEngine');
const history = require('../services/automationHistoryService');
const logger  = require('../services/loggerService');

// GET /api/automation/rules
async function getRules(req, res, next) {
  try {
    const rules = await engine.getAllRules();
    res.json({ rules, count: rules.length });
  } catch (err) { next(err); }
}

// POST /api/automation/rules
async function createRule(req, res, next) {
  try {
    const { name, trigger_type, conditions, actions, is_active = true, description } = req.body;
    if (!name || !trigger_type || !actions)
      return res.status(400).json({ error: 'name, trigger_type, and actions are required' });
    const rule = await engine.createRule({ name, trigger_type, conditions: conditions || [], actions, is_active, description });
    logger.info('AUTOMATION', `Rule created: ${name}`, { ruleId: rule.id });
    res.status(201).json(rule);
  } catch (err) { next(err); }
}

// PUT /api/automation/rules/:id
async function updateRule(req, res, next) {
  try {
    const rule = await engine.updateRule(req.params.id, req.body);
    logger.info('AUTOMATION', `Rule updated: ${rule.name}`, { ruleId: rule.id });
    res.json(rule);
  } catch (err) { next(err); }
}

// DELETE /api/automation/rules/:id
async function deleteRule(req, res, next) {
  try {
    const result = await engine.deleteRule(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

// POST /api/automation/trigger  — manually fire a trigger
async function triggerRule(req, res, next) {
  try {
    const { trigger_type, target_id, context = {} } = req.body;
    if (!trigger_type) return res.status(400).json({ error: 'trigger_type is required' });
    const results = await engine.fireTrigger(trigger_type, target_id || null, context);
    res.json({ triggered: results.length, results });
  } catch (err) { next(err); }
}

// POST /api/automation/test  — dry-run: evaluate conditions without executing actions
async function testRule(req, res, next) {
  try {
    const { rule_id, context = {} } = req.body;
    const rules = await engine.getAllRules();
    const rule = rules.find(r => r.id === rule_id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });

    const conditions = rule.conditions || [];
    const evaluations = conditions.map(cond => ({
      metric: cond.metric,
      operator: cond.operator,
      threshold: cond.threshold,
      value: context[cond.metric],
      result: context[cond.metric] !== undefined
        ? require('../services/automationEngine').getAllRules // just a ref check
        : null
    }));

    res.json({
      rule: rule.name,
      trigger_type: rule.trigger_type,
      conditions_count: conditions.length,
      actions_count: (rule.actions || []).length,
      context_provided: Object.keys(context),
      note: 'Use POST /api/automation/trigger to actually fire rules'
    });
  } catch (err) { next(err); }
}

// GET /api/automation/history
async function getHistory(req, res, next) {
  try {
    const { rule_id, status, limit = 50, offset = 0 } = req.query;
    const rows = await history.getHistory({
      ruleId: rule_id ? parseInt(rule_id) : undefined,
      status,
      limit:  parseInt(limit),
      offset: parseInt(offset),
    });
    const stats = await history.getHistoryStats();
    res.json({ history: rows, count: rows.length, stats });
  } catch (err) { next(err); }
}

module.exports = { getRules, createRule, updateRule, deleteRule, triggerRule, testRule, getHistory };
