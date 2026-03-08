// services/automationEngine.js — DAB AI v6.0
// Trigger → Condition → Action automation rules engine

const { supabaseAdmin } = require('./supabaseClient');
const logger = require('./loggerService');
const { recordHistory } = require('./automationHistoryService');

// ─── Condition evaluator ──────────────────────────────────────────────────
function evaluate(value, operator, threshold) {
  const v = parseFloat(value), t = parseFloat(threshold);
  switch (operator) {
    case 'gt':  case '>':  return v > t;
    case 'gte': case '>=': return v >= t;
    case 'lt':  case '<':  return v < t;
    case 'lte': case '<=': return v <= t;
    case 'eq':  case '==': return v === t;
    case 'neq': case '!=': return v !== t;
    case 'contains': return String(value).toLowerCase().includes(String(threshold).toLowerCase());
    default: return false;
  }
}

// ─── Action executors ─────────────────────────────────────────────────────
async function executeAction(action, target, params, context) {
  switch (action) {
    case 'pause_campaign': {
      await supabaseAdmin.from('campaigns').update({ status: 'paused' }).eq('id', target);
      logger.info('AUTOMATION', `Campaign ${target} paused`);
      return { success: true, action, target };
    }
    case 'resume_campaign': {
      await supabaseAdmin.from('campaigns').update({ status: 'active' }).eq('id', target);
      logger.info('AUTOMATION', `Campaign ${target} resumed`);
      return { success: true, action, target };
    }
    case 'increase_budget': {
      const pct = parseFloat(params?.percentage || 10);
      const { data: camp } = await supabaseAdmin.from('campaigns').select('daily_budget').eq('id', target).single();
      if (camp) {
        const newBudget = parseFloat(camp.daily_budget || 0) * (1 + pct / 100);
        await supabaseAdmin.from('campaigns').update({ daily_budget: newBudget.toFixed(2) }).eq('id', target);
        logger.info('AUTOMATION', `Campaign ${target} budget increased ${pct}% → $${newBudget.toFixed(2)}`);
      }
      return { success: true, action, target };
    }
    case 'decrease_budget': {
      const pct = parseFloat(params?.percentage || 10);
      const { data: camp } = await supabaseAdmin.from('campaigns').select('daily_budget').eq('id', target).single();
      if (camp) {
        const newBudget = Math.max(1, parseFloat(camp.daily_budget || 0) * (1 - pct / 100));
        await supabaseAdmin.from('campaigns').update({ daily_budget: newBudget.toFixed(2) }).eq('id', target);
        logger.info('AUTOMATION', `Campaign ${target} budget decreased ${pct}% → $${newBudget.toFixed(2)}`);
      }
      return { success: true, action, target };
    }
    case 'score_lead': {
      const { scoreLead } = require('./aiService');
      const { data: lead } = await supabaseAdmin.from('leads').select('*').eq('id', target).single();
      if (lead) {
        const score = await scoreLead(lead);
        await supabaseAdmin.from('leads').update({
          score: score.score, score_tier: score.tier, score_reason: score.reason,
          qualified_at: new Date().toISOString()
        }).eq('id', target);
        logger.info('AUTOMATION', `Lead ${target} scored: ${score.tier} (${score.score})`);
      }
      return { success: true, action, target };
    }
    case 'send_followup': {
      const { generateFollowUp } = require('./aiService');
      const { scheduleFollowUp } = require('./schedulerService');
      const { data: lead } = await supabaseAdmin.from('leads').select('*').eq('id', target).single();
      if (lead) {
        const followUp = await generateFollowUp(lead, lead.score_tier || 'Warm');
        await scheduleFollowUp(target, followUp.message, { subject: followUp.subject, delaySeconds: 0 });
        logger.info('AUTOMATION', `Follow-up queued for lead ${target}`);
      }
      return { success: true, action, target };
    }
    case 'notify': {
      const message = params?.message || `Automation alert: ${action} on ${target}`;
      logger.warn('AUTOMATION', `NOTIFY: ${message}`, { target, context });
      // TODO: replace with real notification (email/slack/webhook)
      return { success: true, action: 'notify', message };
    }
    case 'log_event': {
      const msg = params?.message || `Automation event on ${target}`;
      await logger.info('AUTOMATION', msg, { target, params, context });
      return { success: true, action: 'log_event', message: msg };
    }
    default:
      logger.warn('AUTOMATION', `Unknown action: ${action}`);
      return { success: false, error: `Unknown action: ${action}` };
  }
}

// ─── Resolve metric value from context ───────────────────────────────────
function resolveMetric(metricKey, context) {
  // context can be a flat object with metric values
  return context[metricKey] !== undefined ? context[metricKey] : null;
}

// ─── Check and fire rules for a given trigger ─────────────────────────────
async function fireTrigger(triggerType, targetId, context = {}) {
  const { data: rules, error } = await supabaseAdmin
    .from('automation_rules')
    .select('*')
    .eq('trigger_type', triggerType)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error || !rules || rules.length === 0) return [];

  const results = [];

  for (const rule of rules) {
    try {
      // Evaluate conditions
      let conditionsMet = true;
      const conditions = rule.conditions || [];
      for (const cond of conditions) {
        const value = resolveMetric(cond.metric, context);
        if (value === null) continue; // skip unknown metrics
        if (!evaluate(value, cond.operator, cond.threshold)) {
          conditionsMet = false;
          break;
        }
      }

      if (!conditionsMet) continue;

      // Execute actions
      const actions = rule.actions || [];
      const actionResults = [];
      for (const act of actions) {
        const result = await executeAction(act.type, targetId, act.params || {}, context);
        actionResults.push(result);
      }

      // Log the rule firing
      logger.automationFired(rule.id, rule.name, actionResults);

      // Update last_triggered + runs_count
      await supabaseAdmin.from('automation_rules')
        .update({
          last_triggered: new Date().toISOString(),
          last_run_at:    new Date().toISOString(),
          runs_count:     (rule.runs_count || 0) + 1
        })
        .eq('id', rule.id);

      // Persist to automation_history
      await recordHistory({
        ruleId:      rule.id,
        ruleName:    rule.name,
        triggerType: triggerType,
        targetId:    targetId,
        targetType:  context?.targetType || 'system',
        result:      { actions: actionResults },
        status:      'success',
      });

      results.push({ ruleId: rule.id, ruleName: rule.name, fired: true, actions: actionResults });
    } catch (err) {
      logger.error('AUTOMATION', `Rule ${rule.id} failed: ${err.message}`, { ruleId: rule.id });

      await recordHistory({
        ruleId:      rule.id,
        ruleName:    rule.name,
        triggerType: triggerType,
        targetId:    targetId,
        result:      {},
        status:      'failed',
        errorMsg:    err.message,
      });

      results.push({ ruleId: rule.id, fired: false, error: err.message });
    }
  }

  return results;
}

// ─── CRUD helpers ─────────────────────────────────────────────────────────
async function getAllRules() {
  const { data, error } = await supabaseAdmin.from('automation_rules').select('*').order('createdat', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function createRule(payload) {
  const now = new Date().toISOString();
  const insert = {
    name:         payload.name,
    rule_name:    payload.name,          // legacy column
    trigger_type: payload.trigger_type,
    trigger:      payload.trigger_type,  // legacy column
    conditions:   payload.conditions || [],
    condition:    JSON.stringify(payload.conditions || []),  // legacy text column
    actions:      payload.actions || [],
    action:       payload.actions?.[0]?.type || '',          // legacy text column
    action_config: JSON.stringify(payload.actions || []),    // legacy text column
    is_active:    payload.is_active !== false,
    status:       payload.is_active !== false ? 'active' : 'inactive',
    description:  payload.description || null,
    priority:     1,
    runs_count:   0,
    createdat:    now
  };
  const { data, error } = await supabaseAdmin.from('automation_rules').insert(insert).select().single();
  if (error) throw error;
  return data;
}

async function updateRule(id, payload) {
  const { data, error } = await supabaseAdmin.from('automation_rules').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function deleteRule(id) {
  const { error } = await supabaseAdmin.from('automation_rules').delete().eq('id', id);
  if (error) throw error;
  return { deleted: id };
}

module.exports = { fireTrigger, executeAction, getAllRules, createRule, updateRule, deleteRule };
