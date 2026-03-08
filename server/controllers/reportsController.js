// controllers/reportsController.js — DAB AI v6.0
// Reporting endpoints: daily summary, campaign reports, lead reports

const { supabaseAdmin } = require('../services/supabaseClient');
const logger = require('../services/loggerService');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

// ─── GET /api/reports/daily ───────────────────────────────────────────────────
// Returns a rolling daily summary for the last N days (default 30)
async function getDaily(req, res, next) {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 90);
    const since = daysAgo(days);

    // New leads per day
    const { data: leadsPerDay } = await supabaseAdmin
      .from('leads')
      .select('created_at')
      .gte('created_at', since + 'T00:00:00Z')
      .order('created_at', { ascending: true });

    // Campaign spend per day (from campaign_stats)
    const { data: spendPerDay } = await supabaseAdmin
      .from('campaign_stats')
      .select('date, spend, clicks, impressions, leads')
      .gte('date', since)
      .order('date', { ascending: true });

    // Finance per day
    const { data: financePerDay } = await supabaseAdmin
      .from('finance')
      .select('date, spend, revenue, cost_per_lead, roas')
      .gte('date', since)
      .order('date', { ascending: true });

    // Automation fires per day
    const { data: automationPerDay } = await supabaseAdmin
      .from('automation_history')
      .select('created_at, status')
      .gte('created_at', since + 'T00:00:00Z')
      .order('created_at', { ascending: true });

    // Aggregate leads by date
    const leadsByDate = {};
    (leadsPerDay || []).forEach(l => {
      const d = l.created_at.split('T')[0];
      leadsByDate[d] = (leadsByDate[d] || 0) + 1;
    });

    // Aggregate automation by date
    const automationByDate = {};
    (automationPerDay || []).forEach(a => {
      const d = a.created_at.split('T')[0];
      if (!automationByDate[d]) automationByDate[d] = { total: 0, success: 0, failed: 0 };
      automationByDate[d].total++;
      if (a.status === 'success') automationByDate[d].success++;
      else automationByDate[d].failed++;
    });

    // Aggregate spend by date
    const spendByDate = {};
    (spendPerDay || []).forEach(s => {
      const d = s.date;
      if (!spendByDate[d]) spendByDate[d] = { spend: 0, clicks: 0, impressions: 0, leads: 0 };
      spendByDate[d].spend       += parseFloat(s.spend || 0);
      spendByDate[d].clicks      += parseInt(s.clicks || 0);
      spendByDate[d].impressions += parseInt(s.impressions || 0);
      spendByDate[d].leads       += parseInt(s.leads || 0);
    });

    // Build unified daily timeline
    const allDates = new Set([
      ...Object.keys(leadsByDate),
      ...Object.keys(spendByDate),
      ...Object.keys(automationByDate),
      ...(financePerDay || []).map(f => f.date),
    ]);

    const timeline = Array.from(allDates).sort().map(date => ({
      date,
      new_leads:       leadsByDate[date]   || 0,
      ad_spend:        spendByDate[date]?.spend       || 0,
      clicks:          spendByDate[date]?.clicks      || 0,
      impressions:     spendByDate[date]?.impressions || 0,
      campaign_leads:  spendByDate[date]?.leads       || 0,
      automation_runs: automationByDate[date]?.total   || 0,
      automation_ok:   automationByDate[date]?.success || 0,
    }));

    // Totals
    const totals = timeline.reduce((acc, d) => ({
      total_new_leads:       acc.total_new_leads + d.new_leads,
      total_ad_spend:        acc.total_ad_spend  + d.ad_spend,
      total_clicks:          acc.total_clicks    + d.clicks,
      total_impressions:     acc.total_impressions + d.impressions,
      total_automation_runs: acc.total_automation_runs + d.automation_runs,
    }), { total_new_leads: 0, total_ad_spend: 0, total_clicks: 0, total_impressions: 0, total_automation_runs: 0 });

    res.json({
      period: { days, since, to: new Date().toISOString().split('T')[0] },
      totals,
      timeline,
    });
  } catch (err) { next(err); }
}

// ─── GET /api/reports/campaign ────────────────────────────────────────────────
// Returns per-campaign performance summary, optionally filtered by id/status/platform
async function getCampaign(req, res, next) {
  try {
    const { id, status, platform, limit = 50 } = req.query;

    // Base campaign query
    let campsQuery = supabaseAdmin
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (id)       campsQuery = campsQuery.eq('id', id);
    if (status)   campsQuery = campsQuery.eq('status', status);
    if (platform) campsQuery = campsQuery.eq('platform', platform);

    const { data: campaigns, error: campErr } = await campsQuery;
    if (campErr) throw campErr;

    const campIds = (campaigns || []).map(c => c.id);

    // Pull aggregated stats for those campaigns
    const { data: statsRows } = campIds.length
      ? await supabaseAdmin
          .from('campaign_stats')
          .select('campaign_id, spend, clicks, impressions, leads, conversions, date')
          .in('campaign_id', campIds)
      : { data: [] };

    // Pull lead counts per campaign
    const { data: leadCounts } = campIds.length
      ? await supabaseAdmin
          .from('leads')
          .select('campaign_id')
          .in('campaign_id', campIds)
      : { data: [] };

    // Pull finance rows per campaign
    const { data: financeRows } = campIds.length
      ? await supabaseAdmin
          .from('finance')
          .select('campaign_id, spend, revenue, cost_per_lead, roas')
          .in('campaign_id', campIds)
      : { data: [] };

    // Build lookup maps
    const statsMap = {};
    (statsRows || []).forEach(s => {
      if (!statsMap[s.campaign_id]) statsMap[s.campaign_id] = { spend: 0, clicks: 0, impressions: 0, campaign_leads: 0 };
      statsMap[s.campaign_id].spend        += parseFloat(s.spend || 0);
      statsMap[s.campaign_id].clicks       += parseInt(s.clicks || 0);
      statsMap[s.campaign_id].impressions  += parseInt(s.impressions || 0);
      statsMap[s.campaign_id].campaign_leads += parseInt(s.leads || 0);
    });

    const leadCountMap = {};
    (leadCounts || []).forEach(l => {
      leadCountMap[l.campaign_id] = (leadCountMap[l.campaign_id] || 0) + 1;
    });

    const financeMap = {};
    (financeRows || []).forEach(f => {
      if (!financeMap[f.campaign_id]) financeMap[f.campaign_id] = { spend: 0, revenue: 0 };
      financeMap[f.campaign_id].spend   += parseFloat(f.spend || 0);
      financeMap[f.campaign_id].revenue += parseFloat(f.revenue || 0);
    });

    const report = (campaigns || []).map(c => {
      const stats   = statsMap[c.id]   || {};
      const finance = financeMap[c.id] || {};
      const spend   = stats.spend || finance.spend || parseFloat(c.daily_budget || 0);
      const revenue = finance.revenue || 0;
      const leads   = leadCountMap[c.id] || stats.campaign_leads || 0;
      const roas    = spend > 0 ? (revenue / spend).toFixed(4) : '0.0000';
      const cpl     = leads > 0 ? (spend / leads).toFixed(2) : '0.00';

      return {
        id:           c.id,
        name:         c.name,
        platform:     c.platform,
        status:       c.status,
        daily_budget: c.daily_budget,
        created_at:   c.created_at || c.createdat,
        total_spend:     spend.toFixed(2),
        total_revenue:   revenue.toFixed(2),
        total_leads:     leads,
        total_clicks:    stats.clicks || 0,
        total_impressions: stats.impressions || 0,
        roas,
        cost_per_lead:   cpl,
      };
    });

    // Summary across all campaigns
    const summary = report.reduce((acc, c) => ({
      total_campaigns:  acc.total_campaigns + 1,
      total_spend:      acc.total_spend  + parseFloat(c.total_spend),
      total_revenue:    acc.total_revenue + parseFloat(c.total_revenue),
      total_leads:      acc.total_leads  + c.total_leads,
      total_clicks:     acc.total_clicks + c.total_clicks,
    }), { total_campaigns: 0, total_spend: 0, total_revenue: 0, total_leads: 0, total_clicks: 0 });

    summary.avg_roas = summary.total_spend > 0
      ? (summary.total_revenue / summary.total_spend).toFixed(4)
      : '0.0000';
    summary.avg_cpl = summary.total_leads > 0
      ? (summary.total_spend  / summary.total_leads).toFixed(2)
      : '0.00';

    res.json({ summary, campaigns: report, count: report.length });
  } catch (err) { next(err); }
}

// ─── GET /api/reports/leads ───────────────────────────────────────────────────
// Returns lead pipeline report — counts by status and score tier, recent leads, conversion funnel
async function getLeads(req, res, next) {
  try {
    const days  = Math.min(parseInt(req.query.days) || 30, 90);
    const since = daysAgo(days);

    // All leads (within window if requested)
    let leadsQuery = supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (req.query.days) leadsQuery = leadsQuery.gte('created_at', since + 'T00:00:00Z');

    const { data: leads, error: leadsErr } = await leadsQuery;
    if (leadsErr) throw leadsErr;

    const allLeads = leads || [];

    // Count by status
    const byStatus = allLeads.reduce((acc, l) => {
      const s = l.status || 'new';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    // Count by score tier
    const byTier = allLeads.reduce((acc, l) => {
      const t = l.score_tier || (l.score >= 70 ? 'Hot' : l.score >= 40 ? 'Warm' : 'Cold') || 'Unknown';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

    // Average score
    const scored = allLeads.filter(l => l.score != null);
    const avg_score = scored.length
      ? (scored.reduce((s, l) => s + parseFloat(l.score), 0) / scored.length).toFixed(1)
      : null;

    // Conversion funnel
    const funnel = {
      new:              byStatus['new']                || 0,
      contacted:        byStatus['contacted']          || 0,
      qualified:        byStatus['qualified']          || 0,
      meeting_scheduled: byStatus['meeting_scheduled'] || 0,
      closed:           byStatus['closed']             || 0,
    };

    // Leads by source campaign
    const byCampaign = allLeads.reduce((acc, l) => {
      const cid = l.campaign_id || 'direct';
      acc[cid] = (acc[cid] || 0) + 1;
      return acc;
    }, {});

    // New leads per day (last N days)
    const leadsPerDay = allLeads.reduce((acc, l) => {
      const d = (l.created_at || '').split('T')[0];
      if (d) acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});

    const timeline = Object.entries(leadsPerDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, new_leads: count }));

    res.json({
      period: { days, since, to: new Date().toISOString().split('T')[0] },
      summary: {
        total_leads:        allLeads.length,
        avg_score:          avg_score ? parseFloat(avg_score) : null,
        qualified_leads:    (byStatus['qualified'] || 0) + (byStatus['meeting_scheduled'] || 0) + (byStatus['closed'] || 0),
        conversion_rate:    allLeads.length > 0
          ? ((funnel.closed / allLeads.length) * 100).toFixed(1) + '%'
          : '0.0%',
      },
      by_status:   byStatus,
      by_tier:     byTier,
      funnel,
      by_campaign: byCampaign,
      timeline,
      recent_leads: allLeads.slice(0, 20).map(l => ({
        id:          l.id,
        name:        l.name,
        email:       l.email,
        company:     l.company,
        status:      l.status,
        score:       l.score,
        score_tier:  l.score_tier,
        campaign_id: l.campaign_id,
        created_at:  l.created_at || l.createdat,
      })),
    });
  } catch (err) { next(err); }
}

module.exports = { getDaily, getCampaign, getLeads };
