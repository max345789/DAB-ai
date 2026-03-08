// ─────────────────────────────────────────────────────────────
//  DAB AI – Campaign Controller  (Stage 3 — full rewrite)
//  POST   /api/campaign
//  GET    /api/campaigns
//  GET    /api/campaign/:id
//  POST   /api/campaign/generate
//  PATCH  /api/campaign/:id
//  POST   /api/campaign/:id/stats
// ─────────────────────────────────────────────────────────────
const { supabaseAdmin }        = require('../services/supabaseClient');
const { generateAdCampaign }   = require('../services/campaignGeneratorService');
const {
  calculateCampaignStats,
  upsertDailyStats,
  getCampaignTimeline,
} = require('../services/analyticsService');

// ─────────────────────────────────────────────────────────────
//  POST /api/campaign
// ─────────────────────────────────────────────────────────────
async function createCampaign(req, res, next) {
  try {
    const {
      name, platform = 'meta', target_audience = null,
      budget = 0, daily_budget = 0, total_budget = 0,
      goal = 'leads', status = 'draft', location = null,
      start_date = null, end_date = null, userid = null,
    } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .insert({
        name: name.trim(), platform, target_audience,
        budget: budget || daily_budget || 0,
        daily_budget: daily_budget || budget || 0,
        total_budget,
        goal, status, location, start_date, end_date, userid,
      })
      .select().single();

    if (error) throw error;
    return res.status(201).json({ success: true, campaign: data });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
//  POST /api/campaign/generate   ← MUST be before /:id routes
//  AI-powered ad content generator
// ─────────────────────────────────────────────────────────────
async function generateCampaign(req, res, next) {
  try {
    const {
      name, service, target_audience, budget = 50,
      location = 'United States', platform = 'meta',
      goal = 'leads', auto_create = true, userid = null,
    } = req.body;

    if (!service) return res.status(400).json({ error: 'service is required' });

    // Optionally auto-create the campaign row first
    let campaign = null;
    if (auto_create) {
      const { data, error } = await supabaseAdmin
        .from('campaigns')
        .insert({
          name        : name || `${service} — ${platform} Campaign`,
          platform,
          target_audience,
          budget,
          daily_budget: budget,
          goal,
          location,
          status      : 'draft',
          userid,
        })
        .select().single();
      if (error) throw error;
      campaign = data;
    }

    // Run AI generator
    const result = await generateAdCampaign(
      { service, target_audience, budget, location, platform, goal },
      campaign?.id || null
    );

    return res.status(201).json({
      success : true,
      campaign,
      ads     : result.ads,
      targeting: result.targeting,
      summary : result.summary,
      message : `Generated ${result.ads.length} ad variant(s) for "${name || service}".`,
    });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
//  GET /api/campaigns
//  Returns campaigns with summary metrics
// ─────────────────────────────────────────────────────────────
async function getCampaigns(req, res, next) {
  try {
    const { status, platform, limit = 50, offset = 0, userid } = req.query;

    let query = supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        ads(count),
        campaign_stats(spend, leads_generated, clicks, impressions)
      `, { count: 'exact' })
      .order('createdat', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status)   query = query.eq('status',   status);
    if (platform) query = query.eq('platform', platform);
    if (userid)   query = query.eq('userid',   userid);

    const { data, error, count } = await query;
    if (error) throw error;

    // Enrich each campaign with aggregated metrics
    const campaigns = (data || []).map(c => {
      const statsRows = c.campaign_stats || [];
      const agg = statsRows.reduce((a, r) => {
        a.spend           += Number(r.spend           || 0);
        a.leads_generated += Number(r.leads_generated || 0);
        a.clicks          += Number(r.clicks          || 0);
        a.impressions     += Number(r.impressions     || 0);
        return a;
      }, { spend: 0, leads_generated: 0, clicks: 0, impressions: 0 });

      return {
        ...c,
        campaign_stats: undefined,
        summary_metrics: {
          total_spend    : agg.spend,
          leads_generated: agg.leads_generated,
          ctr            : agg.impressions > 0
            ? parseFloat(((agg.clicks / agg.impressions) * 100).toFixed(2)) : 0,
          cpl            : agg.leads_generated > 0
            ? parseFloat((agg.spend / agg.leads_generated).toFixed(2)) : 0,
        },
      };
    });

    return res.status(200).json({ success: true, count, campaigns });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
//  GET /api/campaign/:id   (full detail: ads + stats + timeline)
// ─────────────────────────────────────────────────────────────
async function getCampaign(req, res, next) {
  try {
    const { id }   = req.params;
    const { days = 30 } = req.query;

    const [campRes, adsRes, statsRes, timelineData] = await Promise.all([
      supabaseAdmin.from('campaigns').select('*').eq('id', id).single(),
      supabaseAdmin.from('ads').select('*').eq('campaign_id', id).order('variant_index'),
      calculateCampaignStats(id),
      getCampaignTimeline(id, Number(days)),
    ]);

    if (campRes.error) throw campRes.error;
    if (!campRes.data) return res.status(404).json({ error: 'Campaign not found' });

    return res.status(200).json({
      success    : true,
      campaign   : campRes.data,
      ads        : adsRes.data || [],
      performance: statsRes,
      timeline   : timelineData,
    });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
//  PATCH /api/campaign/:id
// ─────────────────────────────────────────────────────────────
async function updateCampaign(req, res, next) {
  try {
    const { id }  = req.params;
    const updates = { ...req.body, updatedat: new Date().toISOString() };
    delete updates.id; delete updates.createdat;

    const { data, error } = await supabaseAdmin
      .from('campaigns').update(updates).eq('id', id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Campaign not found' });

    return res.status(200).json({ success: true, campaign: data });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
//  POST /api/campaign/:id/stats
//  Ingest a day's stats (from ad platform webhook / manual)
// ─────────────────────────────────────────────────────────────
async function ingestStats(req, res, next) {
  try {
    const { id } = req.params;
    const stats  = await upsertDailyStats(Number(id), req.body);
    const totals = await calculateCampaignStats(Number(id));

    return res.status(200).json({
      success        : true,
      daily_stats    : stats,
      campaign_totals: totals,
      message        : `Stats recorded for campaign #${id}. CTR: ${totals.ctr}%, CPL: $${totals.cpl}`,
    });
  } catch (err) { next(err); }
}

module.exports = {
  createCampaign,
  generateCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  ingestStats,
};
