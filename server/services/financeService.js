// ─────────────────────────────────────────────────────────────
//  DAB AI – Finance Service  (Stage 4)
//  Core financial calculations:
//    calculateCostPerLead()    CPL  = total_spend / leads_generated
//    calculateROAS()           ROAS = revenue / total_spend
//    calculateConversionRate() CR   = closed_deals / leads
//    calculateROI()            ROI  = (revenue - spend) / spend
//    updateCampaignFinance()   Persist full finance row to DB
// ─────────────────────────────────────────────────────────────
const { supabaseAdmin } = require('./supabaseClient');

// ── Safe maths ────────────────────────────────────────────────
const round2  = (n) => Math.round(n * 100) / 100;
const round4  = (n) => Math.round(n * 10000) / 10000;
const safeDivide = (a, b) => (b === 0 || !b ? 0 : a / b);

// ─────────────────────────────────────────────────────────────
//  Individual calculation functions (pure, testable)
// ─────────────────────────────────────────────────────────────

/** CPL = total_spend / leads_generated */
function calculateCostPerLead(total_spend, leads_generated) {
  return round2(safeDivide(Number(total_spend), Number(leads_generated)));
}

/** ROAS = revenue / total_spend  (e.g. 3.5 = $3.50 returned per $1 spent) */
function calculateROAS(total_revenue, total_spend) {
  return round4(safeDivide(Number(total_revenue), Number(total_spend)));
}

/** Conversion rate = closed_deals / leads  (as percentage) */
function calculateConversionRate(closed_deals, total_leads) {
  return round4(safeDivide(Number(closed_deals), Number(total_leads)) * 100);
}

/** ROI = (revenue - spend) / spend  (as percentage) */
function calculateROI(total_revenue, total_spend) {
  if (!total_spend || total_spend === 0) return 0;
  return round4(((Number(total_revenue) - Number(total_spend)) / Number(total_spend)) * 100);
}

/** Profit = revenue - spend */
function calculateProfit(total_revenue, total_spend) {
  return round2(Number(total_revenue) - Number(total_spend));
}

// ─────────────────────────────────────────────────────────────
//  Aggregate expenses for a campaign (from ad_expenses table)
// ─────────────────────────────────────────────────────────────
async function getCampaignSpend(campaignId, { start_date, end_date } = {}) {
  let query = supabaseAdmin
    .from('ad_expenses')
    .select('amount, date')
    .eq('campaign_id', campaignId);

  if (start_date) query = query.gte('date', start_date);
  if (end_date)   query = query.lte('date', end_date);

  const { data, error } = await query;
  if (error) throw error;

  return round2((data || []).reduce((s, r) => s + Number(r.amount || 0), 0));
}

// ─────────────────────────────────────────────────────────────
//  Aggregate revenue for a campaign (from revenue table)
// ─────────────────────────────────────────────────────────────
async function getCampaignRevenue(campaignId, { start_date, end_date } = {}) {
  let query = supabaseAdmin
    .from('revenue')
    .select('amount, date')
    .eq('campaign_id', campaignId);

  if (start_date) query = query.gte('date', start_date);
  if (end_date)   query = query.lte('date', end_date);

  const { data, error } = await query;
  if (error) throw error;

  return round2((data || []).reduce((s, r) => s + Number(r.amount || 0), 0));
}

// ─────────────────────────────────────────────────────────────
//  Full finance calculation for a single campaign
// ─────────────────────────────────────────────────────────────
async function computeCampaignFinance(campaignId) {
  const [
    campaignRes,
    statsRes,
    leadsClosedRes,
  ] = await Promise.all([
    supabaseAdmin.from('campaigns')
      .select('spend_so_far, leads_generated, name')
      .eq('id', campaignId).single(),
    supabaseAdmin.from('campaign_stats')
      .select('spend, leads_generated, conversions')
      .eq('campaign_id', campaignId),
    supabaseAdmin.from('leads')
      .select('id, status')
      .eq('status', 'closed'),
  ]);

  if (campaignRes.error) throw campaignRes.error;

  // Aggregate from campaign_stats (source of truth for spend/leads)
  const statsAgg = (statsRes.data || []).reduce((a, r) => ({
    spend          : a.spend           + Number(r.spend           || 0),
    leads_generated: a.leads_generated + Number(r.leads_generated || 0),
    conversions    : a.conversions     + Number(r.conversions     || 0),
  }), { spend: 0, leads_generated: 0, conversions: 0 });

  // Fallback to campaigns.spend_so_far if no stats rows yet
  const total_spend  = statsAgg.spend || Number(campaignRes.data.spend_so_far || 0);
  const total_leads  = statsAgg.leads_generated || Number(campaignRes.data.leads_generated || 0);
  const closed_deals = statsAgg.conversions;

  // Revenue from revenue table
  const total_revenue = await getCampaignRevenue(campaignId);

  return {
    campaign_id    : Number(campaignId),
    total_spend    : round2(total_spend),
    total_revenue  : round2(total_revenue),
    total_leads,
    closed_deals,
    cost_per_lead  : calculateCostPerLead(total_spend, total_leads),
    conversion_rate: calculateConversionRate(closed_deals, total_leads),
    roas           : calculateROAS(total_revenue, total_spend),
    roi            : calculateROI(total_revenue, total_spend),
    profit         : calculateProfit(total_revenue, total_spend),
  };
}

// ─────────────────────────────────────────────────────────────
//  Persist computed finance to campaign_finance table
// ─────────────────────────────────────────────────────────────
async function updateCampaignFinance(campaignId) {
  const metrics = await computeCampaignFinance(campaignId);

  const { data, error } = await supabaseAdmin
    .from('campaign_finance')
    .upsert(
      { ...metrics, last_updated: new Date().toISOString() },
      { onConflict: 'campaign_id' }
    )
    .select().single();

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────
//  Platform-wide finance summary
// ─────────────────────────────────────────────────────────────
async function getPlatformFinanceSummary({ start_date, end_date } = {}) {
  // Total spend from ad_expenses
  let expQuery = supabaseAdmin.from('ad_expenses').select('amount');
  if (start_date) expQuery = expQuery.gte('date', start_date);
  if (end_date)   expQuery = expQuery.lte('date', end_date);
  const { data: expData } = await expQuery;
  const total_spend = round2((expData || []).reduce((s, r) => s + Number(r.amount || 0), 0));

  // Fallback: use campaigns table if no expense rows yet
  let effectiveSpend = total_spend;
  if (effectiveSpend === 0) {
    const { data: camps } = await supabaseAdmin.from('campaigns').select('spend_so_far');
    effectiveSpend = round2((camps || []).reduce((s, c) => s + Number(c.spend_so_far || 0), 0));
  }

  // Total revenue
  let revQuery = supabaseAdmin.from('revenue').select('amount');
  if (start_date) revQuery = revQuery.gte('date', start_date);
  if (end_date)   revQuery = revQuery.lte('date', end_date);
  const { data: revData } = await revQuery;
  const total_revenue = round2((revData || []).reduce((s, r) => s + Number(r.amount || 0), 0));

  // Total leads & closed deals
  const { data: allLeads } = await supabaseAdmin.from('leads').select('status');
  const total_leads  = (allLeads || []).length;
  const closed_deals = (allLeads || []).filter(l => l.status === 'closed').length;

  return {
    total_spend    : effectiveSpend,
    total_revenue,
    total_leads,
    closed_deals,
    cost_per_lead  : calculateCostPerLead(effectiveSpend, total_leads),
    conversion_rate: calculateConversionRate(closed_deals, total_leads),
    roas           : calculateROAS(total_revenue, effectiveSpend),
    roi            : calculateROI(total_revenue, effectiveSpend),
    profit         : calculateProfit(total_revenue, effectiveSpend),
    active_campaigns: (await supabaseAdmin.from('campaigns').select('id').eq('status','active')).data?.length || 0,
    computed_at    : new Date().toISOString(),
  };
}

module.exports = {
  calculateCostPerLead,
  calculateROAS,
  calculateConversionRate,
  calculateROI,
  calculateProfit,
  computeCampaignFinance,
  updateCampaignFinance,
  getPlatformFinanceSummary,
  getCampaignSpend,
  getCampaignRevenue,
};
