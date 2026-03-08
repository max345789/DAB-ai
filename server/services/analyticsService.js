// ─────────────────────────────────────────────────────────────
//  DAB AI – Campaign Analytics Service  (Stage 3)
//  calculateCampaignStats(), getAggregateStats()
// ─────────────────────────────────────────────────────────────
const { supabaseAdmin } = require('./supabaseClient');

// ── Safe division helper ──────────────────────────────────────
const safeDivide = (a, b, decimals = 4) =>
  b === 0 ? 0 : parseFloat((a / b).toFixed(decimals));

// ─────────────────────────────────────────────────────────────
//  calculateCampaignStats(campaignId)
//  Aggregates all campaign_stats rows for one campaign and
//  writes the computed metrics back to the campaigns table.
// ─────────────────────────────────────────────────────────────
async function calculateCampaignStats(campaignId) {
  // Fetch all daily stat rows for this campaign
  const { data: rows, error } = await supabaseAdmin
    .from('campaign_stats')
    .select('*')
    .eq('campaign_id', campaignId);

  if (error) throw error;

  // Aggregate totals
  const totals = (rows || []).reduce((acc, row) => {
    acc.spend           += Number(row.spend           || 0);
    acc.leads_generated += Number(row.leads_generated || 0);
    acc.clicks          += Number(row.clicks          || 0);
    acc.impressions     += Number(row.impressions     || 0);
    acc.conversions     += Number(row.conversions     || 0);
    return acc;
  }, { spend: 0, leads_generated: 0, clicks: 0, impressions: 0, conversions: 0 });

  // Derived KPIs
  const ctr             = safeDivide(totals.clicks,          totals.impressions) * 100;
  const cpl             = safeDivide(totals.spend,           totals.leads_generated, 2);
  const conversion_rate = safeDivide(totals.conversions,     totals.clicks) * 100;
  const cpc             = safeDivide(totals.spend,           totals.clicks, 2);
  const cpm             = totals.impressions > 0
    ? safeDivide(totals.spend * 1000, totals.impressions, 2)
    : 0;

  const metrics = {
    ...totals,
    ctr            : parseFloat(ctr.toFixed(2)),
    cpl            : parseFloat(cpl.toFixed(2)),
    conversion_rate: parseFloat(conversion_rate.toFixed(2)),
    cpc,
    cpm,
    stat_days      : rows?.length || 0,
  };

  // Write aggregates back to campaigns row
  await supabaseAdmin
    .from('campaigns')
    .update({
      spend_so_far    : totals.spend,
      impressions     : totals.impressions,
      clicks          : totals.clicks,
      leads_generated : totals.leads_generated,
      ctr             : metrics.ctr,
      cpl             : metrics.cpl,
      conversion_rate : metrics.conversion_rate,
      last_stats_at   : new Date().toISOString(),
      updatedat       : new Date().toISOString(),
    })
    .eq('id', campaignId);

  return metrics;
}

// ─────────────────────────────────────────────────────────────
//  upsertDailyStats(campaignId, statsPayload)
//  Inserts or updates a daily stats row (one per campaign per day)
// ─────────────────────────────────────────────────────────────
async function upsertDailyStats(campaignId, payload = {}) {
  const date = payload.date || new Date().toISOString().split('T')[0];
  const row  = {
    campaign_id    : campaignId,
    date,
    spend          : Number(payload.spend          || 0),
    leads_generated: Number(payload.leads_generated|| 0),
    clicks         : Number(payload.clicks         || 0),
    impressions    : Number(payload.impressions    || 0),
    conversions    : Number(payload.conversions    || 0),
  };

  // Compute derived fields
  row.ctr             = parseFloat((safeDivide(row.clicks,      row.impressions) * 100).toFixed(2));
  row.cpl             = parseFloat(safeDivide(row.spend,        row.leads_generated, 2).toFixed(2));
  row.conversion_rate = parseFloat((safeDivide(row.conversions, row.clicks) * 100).toFixed(2));

  const { data, error } = await supabaseAdmin
    .from('campaign_stats')
    .upsert(row, { onConflict: 'campaign_id,date' })
    .select()
    .single();

  if (error) throw error;

  // Re-calculate and persist campaign totals
  await calculateCampaignStats(campaignId);

  return data;
}

// ─────────────────────────────────────────────────────────────
//  getAggregateStats(filters)
//  Cross-campaign roll-up for the dashboard / finance summary
// ─────────────────────────────────────────────────────────────
async function getAggregateStats({ start_date, end_date, platform } = {}) {
  let query = supabaseAdmin
    .from('campaign_stats')
    .select('spend, leads_generated, clicks, impressions, conversions, campaign_id');

  if (start_date) query = query.gte('date', start_date);
  if (end_date)   query = query.lte('date', end_date);

  if (platform) {
    // Join through campaigns table to filter by platform
    query = supabaseAdmin
      .from('campaign_stats')
      .select('spend, leads_generated, clicks, impressions, conversions, campaigns!inner(platform)')
      .eq('campaigns.platform', platform);
    if (start_date) query = query.gte('date', start_date);
    if (end_date)   query = query.lte('date', end_date);
  }

  const { data, error } = await query;
  if (error) throw error;

  const agg = (data || []).reduce((acc, row) => {
    acc.spend           += Number(row.spend           || 0);
    acc.leads_generated += Number(row.leads_generated || 0);
    acc.clicks          += Number(row.clicks          || 0);
    acc.impressions     += Number(row.impressions     || 0);
    acc.conversions     += Number(row.conversions     || 0);
    return acc;
  }, { spend: 0, leads_generated: 0, clicks: 0, impressions: 0, conversions: 0 });

  return {
    ...agg,
    ctr            : parseFloat((safeDivide(agg.clicks, agg.impressions) * 100).toFixed(2)),
    cpl            : parseFloat(safeDivide(agg.spend, agg.leads_generated, 2).toFixed(2)),
    conversion_rate: parseFloat((safeDivide(agg.conversions, agg.clicks) * 100).toFixed(2)),
    cpc            : parseFloat(safeDivide(agg.spend, agg.clicks, 2).toFixed(2)),
    cpm            : agg.impressions > 0
      ? parseFloat(safeDivide(agg.spend * 1000, agg.impressions, 2).toFixed(2))
      : 0,
  };
}

// ─────────────────────────────────────────────────────────────
//  getCampaignTimeline(campaignId, days?)
//  Returns daily stat rows for charting
// ─────────────────────────────────────────────────────────────
async function getCampaignTimeline(campaignId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabaseAdmin
    .from('campaign_stats')
    .select('date, spend, leads_generated, clicks, impressions, ctr, cpl')
    .eq('campaign_id', campaignId)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}

module.exports = {
  calculateCampaignStats,
  upsertDailyStats,
  getAggregateStats,
  getCampaignTimeline,
  safeDivide,
};
