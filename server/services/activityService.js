// services/activityService.js — DAB AI v6.0
// Records agent_activity for every significant system action

const { supabaseAdmin } = require('./supabaseClient');

async function logActivity({ action, description, category = 'general', targetId = null, targetType = null, metadata = {}, userId = null }) {
  try {
    const { data, error } = await supabaseAdmin.from('agent_activity').insert({
      action,
      description,
      category,
      target_id:   targetId,
      target_type: targetType,
      metadata,
      user_id:     userId,
      created_at:  new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[ACTIVITY]', err.message);
    return null;
  }
}

async function getRecentActivity(limit = 50, category = null) {
  let q = supabaseAdmin.from('agent_activity')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (category) q = q.eq('category', category);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

module.exports = { logActivity, getRecentActivity };
