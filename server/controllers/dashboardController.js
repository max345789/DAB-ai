// controllers/dashboardController.js — DAB AI v6.0
// GET /api/dashboard/summary
// GET /api/dashboard/charts
// GET /api/dashboard/activity

const { supabaseAdmin } = require('../services/supabaseClient');

// ─── GET /api/dashboard/summary ───────────────────────────────
async function getSummary(req, res, next) {
  try {
    const { data: stats, error } = await supabaseAdmin
      .from('dashboard_stats').select('*').single();
    if (error) throw error;

    res.json({
      success: true,
      summary: {
        total_leads:      Number(stats.total_leads)         || 0,
        new_leads:        Number(stats.new_leads)           || 0,
        active_campaigns: Number(stats.active_campaigns)    || 0,
        ad_spend:         Number(stats.ad_spend)            || 0,
        meetings_booked:  Number(stats.meetings_booked)     || 0,
        total_chats:      Number(stats.total_chat_messages) || 0,
        running_tasks:    Number(stats.running_tasks)       || 0,
        tasks_today:      Number(stats.tasks_today)         || 0,
        active_rules:     Number(stats.active_rules)        || 0,
        monthly_revenue:  Number(stats.monthly_revenue)     || 0,
        avg_lead_score:   parseFloat(Number(stats.avg_lead_score).toFixed(1)) || 0,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (err) { next(err); }
}

// ─── GET /api/dashboard/charts ────────────────────────────────
async function getCharts(req, res, next) {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

    const [
      { data: leadsOverTime },
      { data: spendOverTime },
      { data: campaigns },
      { data: leads },
      { data: financeOverTime },
    ] = await Promise.all([
      supabaseAdmin.from('leads').select('createdat, score_tier').gte('createdat', since).order('createdat'),
      supabaseAdmin.from('campaign_stats').select('date, spend, clicks, impressions, leads').gte('date', since).order('date'),
      supabaseAdmin.from('campaigns').select('platform, status, daily_budget, leads_generated'),
      supabaseAdmin.from('leads').select('status, score_tier'),
      supabaseAdmin.from('finance').select('date, spend, revenue, roas, cost_per_lead').gte('date', since).order('date'),
    ]);

    // Leads grouped by day
    const leadsByDay = {};
    (leadsOverTime || []).forEach(l => {
      const day = l.createdat?.split('T')[0];
      if (day) leadsByDay[day] = (leadsByDay[day] || 0) + 1;
    });

    // Platform breakdown
    const platformMap = {};
    (campaigns || []).forEach(c => {
      const p = c.platform || 'other';
      if (!platformMap[p]) platformMap[p] = { platform: p, count: 0, budget: 0, leads: 0 };
      platformMap[p].count++;
      platformMap[p].budget += parseFloat(c.daily_budget || 0);
      platformMap[p].leads  += parseInt(c.leads_generated || 0);
    });

    // Status & tier distribution
    const statusDist = {};
    const tierDist   = {};
    (leads || []).forEach(l => {
      statusDist[l.status || 'new'] = (statusDist[l.status || 'new'] || 0) + 1;
      const t = l.score_tier || 'Unscored';
      tierDist[t] = (tierDist[t] || 0) + 1;
    });

    res.json({
      success: true,
      period_days: days,
      charts: {
        leads_over_time:        Object.entries(leadsByDay).map(([date, count]) => ({ date, count })).sort((a,b) => a.date.localeCompare(b.date)),
        spend_over_time:        (spendOverTime || []),
        finance_over_time:      (financeOverTime || []),
        platform_breakdown:     Object.values(platformMap),
        lead_status_distribution: Object.entries(statusDist).map(([status, count]) => ({ status, count })),
        lead_tier_distribution:   Object.entries(tierDist).map(([tier, count]) => ({ tier, count })),
      },
    });
  } catch (err) { next(err); }
}

// ─── GET /api/dashboard/activity ─────────────────────────────
async function getActivity(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const [
      { data: recentLeads },
      { data: recentCampaigns },
      { data: agentActivity },
      { data: automationHistory },
      { data: recentDecisions },
      { data: upcomingMeetings },
    ] = await Promise.all([
      supabaseAdmin.from('leads').select('id, name, email, status, score_tier, createdat')
        .order('createdat', { ascending: false }).limit(5),
      supabaseAdmin.from('campaigns').select('id, name, platform, status, createdat')
        .order('createdat', { ascending: false }).limit(5),
      supabaseAdmin.from('agent_activity').select('*')
        .order('created_at', { ascending: false }).limit(limit),
      supabaseAdmin.from('automation_history').select('*')
        .order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.from('agent_decisions')
        .select('decision_type, action_taken, confidence_score, created_at')
        .order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.from('meetings')
        .select('id, title, date, time, status')
        .eq('status', 'scheduled')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true }).limit(5),
    ]);

    res.json({
      success: true,
      activity: {
        recent_leads:       recentLeads       || [],
        recent_campaigns:   recentCampaigns   || [],
        agent_activity:     agentActivity     || [],
        automation_history: automationHistory || [],
        recent_decisions:   recentDecisions   || [],
        upcoming_meetings:  upcomingMeetings  || [],
      },
      generated_at: new Date().toISOString(),
    });
  } catch (err) { next(err); }
}

// Legacy single endpoint — keep for backward compat
async function getDashboard(req, res, next) {
  return getSummary(req, res, next);
}

module.exports = { getSummary, getCharts, getActivity, getDashboard };
