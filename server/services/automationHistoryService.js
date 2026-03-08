// services/automationHistoryService.js — DAB AI v6.0
// Records every automation rule execution to automation_history

const { supabaseAdmin } = require('./supabaseClient');
const logger = require('./loggerService');

async function recordHistory({ ruleId, ruleName, triggerType, targetId, targetType, result, status = 'success', errorMsg = null }) {
  try {
    const { data, error } = await supabaseAdmin.from('automation_history').insert({
      rule_id:      ruleId   || null,
      rule_name:    ruleName || null,
      trigger_type: triggerType || null,
      target_id:    targetId   || null,
      target_type:  targetType || 'system',
      result:       result || {},
      status,
      error_msg:    errorMsg,
      created_at:   new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    logger.error('AUTOMATION_HISTORY', `Failed to record history: ${err.message}`);
    return null;
  }
}

async function getHistory({ ruleId, status, limit = 50, offset = 0 } = {}) {
  let q = supabaseAdmin.from('automation_history')
    .select('*, automation_rules(name, trigger_type)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (ruleId) q = q.eq('rule_id', ruleId);
  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function getHistoryStats() {
  const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data } = await supabaseAdmin.from('automation_history')
    .select('status, trigger_type')
    .gte('created_at', since7d);

  const total = (data || []).length;
  const byStatus = (data || []).reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
  const byTrigger = (data || []).reduce((a, r) => { a[r.trigger_type] = (a[r.trigger_type] || 0) + 1; return a; }, {});

  return { total_7d: total, by_status: byStatus, by_trigger: byTrigger };
}

module.exports = { recordHistory, getHistory, getHistoryStats };
