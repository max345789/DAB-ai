// ─────────────────────────────────────────────────────────────
//  DAB AI – Finance Controller  (Stage 4)
//  GET  /api/finance/summary
//  GET  /api/campaign/:id/finance
//  POST /api/campaign/budget
//  POST /api/finance/expense
//  POST /api/finance/revenue
//  GET  /api/finance/optimizations
//  POST /api/finance/optimize
//  POST /api/finance/optimization/:id/apply
// ─────────────────────────────────────────────────────────────
const { supabaseAdmin }         = require('../services/supabaseClient');
const {
  getPlatformFinanceSummary,
  updateCampaignFinance,
  computeCampaignFinance,
  calculateCostPerLead,
  calculateROAS,
  calculateConversionRate,
} = require('../services/financeService');
const {
  optimizeCampaigns,
  applySuggestion,
} = require('../services/optimizationService');
const { dailyFinanceUpdate } = require('../services/dailyFinanceJob');

// ─────────────────────────────────────────────────────────────
//  GET /api/finance/summary
// ─────────────────────────────────────────────────────────────
async function getFinanceSummary(req, res, next) {
  try {
    const { start_date, end_date } = req.query;
    const summary = await getPlatformFinanceSummary({ start_date, end_date });

    // Enrich with top-performing campaign
    const { data: topCamp } = await supabaseAdmin
      .from('campaign_finance')
      .select('campaign_id, roas, total_revenue, campaigns(name, platform)')
      .order('roas', { ascending: false })
      .limit(1)
      .single();

    return res.status(200).json({
      success          : true,
      finance_summary  : summary,
      top_campaign     : topCamp || null,
      formatted: {
        total_spend    : `$${summary.total_spend.toLocaleString()}`,
        total_revenue  : `$${summary.total_revenue.toLocaleString()}`,
        cost_per_lead  : `$${summary.cost_per_lead}`,
        roas           : `${summary.roas}x`,
        roi            : `${summary.roi}%`,
        profit         : `$${summary.profit.toLocaleString()}`,
        conversion_rate: `${summary.conversion_rate}%`,
      },
    });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
//  GET /api/campaign/:id/finance
// ─────────────────────────────────────────────────────────────
async function getCampaignFinance(req, res, next) {
  try {
    const { id } = req.params;

    // Fetch or compute
    let finRow = null;
    const { data: existing } = await supabaseAdmin
      .from('campaign_finance')
      .select('*')
      .eq('campaign_id', id)
      .single();

    if (existing) {
      // Check if stale (older than 1 hour)
      const age = Date.now() - new Date(existing.last_updated).getTime();
      finRow = age > 3600000 ? await updateCampaignFinance(id) : existing;
    } else {
      finRow = await updateCampaignFinance(id);
    }

    // Pending suggestions for this campaign
    const { data: suggestions } = await supabaseAdmin
      .from('optimization_suggestions')
      .select('*')
      .eq('campaign_id', id)
      .eq('status', 'pending')
      .order('createdat', { ascending: false })
      .limit(5);

    // Expense breakdown
    const { data: expenses } = await supabaseAdmin
      .from('ad_expenses')
      .select('amount, date, expense_type, platform')
      .eq('campaign_id', id)
      .order('date', { ascending: false })
      .limit(10);

    return res.status(200).json({
      success      : true,
      finance      : finRow,
      suggestions  : suggestions || [],
      recent_expenses: expenses  || [],
      formatted    : {
        cost_per_lead  : `$${finRow.cost_per_lead}`,
        roas           : `${finRow.roas}x`,
        roi            : `${finRow.roi}%`,
        profit         : `$${finRow.profit}`,
        conversion_rate: `${finRow.conversion_rate}%`,
      },
    });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
//  POST /api/campaign/budget
// ─────────────────────────────────────────────────────────────
async function updateBudget(req, res, next) {
  try {
    const { campaign_id, new_budget, budget_type = 'daily' } = req.body;
    if (!campaign_id || !new_budget) {
      return res.status(400).json({ error: 'campaign_id and new_budget are required' });
    }

    const field = budget_type === 'total' ? 'total_budget' : 'daily_budget';
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .update({
        [field] : Number(new_budget),
        budget  : budget_type === 'daily' ? Number(new_budget) : undefined,
        updatedat: new Date().toISOString(),
      })
      .eq('id', campaign_id)
      .select().single();

    if (error) throw error;
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    return res.status(200).json({
      success: true,
      campaign,
      message: `${budget_type === 'total' ? 'Total' : 'Daily'} budget updated to $${new_budget}.`,
    });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
//  POST /api/finance/expense   — log an ad expense
// ─────────────────────────────────────────────────────────────
async function logExpense(req, res, next) {
  try {
    const { campaign_id, amount, date, platform, description, expense_type } = req.body;
    if (!campaign_id || !amount) {
      return res.status(400).json({ error: 'campaign_id and amount are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('ad_expenses')
      .insert({ campaign_id, amount: Number(amount), date: date || new Date().toISOString().split('T')[0], platform, description, expense_type })
      .select().single();

    if (error) throw error;

    // Trigger finance recalc async
    updateCampaignFinance(campaign_id).catch(e =>
      console.warn('[financeController] async finance update error:', e.message)
    );

    return res.status(201).json({ success: true, expense: data });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
//  POST /api/finance/revenue   — log revenue from a deal
// ─────────────────────────────────────────────────────────────
async function logRevenue(req, res, next) {
  try {
    const { lead_id, campaign_id, amount, date, source, notes } = req.body;
    if (!amount) return res.status(400).json({ error: 'amount is required' });

    const { data, error } = await supabaseAdmin
      .from('revenue')
      .insert({ lead_id, campaign_id, amount: Number(amount), date: date || new Date().toISOString().split('T')[0], source, notes })
      .select().single();

    if (error) throw error;

    // Mark lead as closed
    if (lead_id) {
      await supabaseAdmin.from('leads')
        .update({ status: 'closed', updatedat: new Date().toISOString() })
        .eq('id', lead_id);
    }

    // Trigger finance recalc
    if (campaign_id) {
      updateCampaignFinance(campaign_id).catch(() => {});
    }

    return res.status(201).json({ success: true, revenue: data, message: `Revenue of $${amount} logged.` });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
//  GET /api/finance/optimizations
// ─────────────────────────────────────────────────────────────
async function getOptimizations(req, res, next) {
  try {
    const { status = 'pending', campaign_id, priority, limit = 20 } = req.query;

    let query = supabaseAdmin
      .from('optimization_suggestions')
      .select('*, campaigns(id, name, platform, status)', { count: 'exact' })
      .order('createdat', { ascending: false })
      .limit(Number(limit));

    if (status)      query = query.eq('status', status);
    if (campaign_id) query = query.eq('campaign_id', campaign_id);
    if (priority)    query = query.eq('priority', priority);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, count, optimizations: data });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
//  POST /api/finance/optimize  — trigger optimization engine
// ─────────────────────────────────────────────────────────────
async function runOptimization(req, res, next) {
  try {
    const { campaign_ids } = req.body;
    const result = await optimizeCampaigns(campaign_ids || null);
    return res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
//  POST /api/finance/optimization/:id/apply
// ─────────────────────────────────────────────────────────────
async function applyOptimization(req, res, next) {
  try {
    const { id }   = req.params;
    const result   = await applySuggestion(Number(id));
    return res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
//  POST /api/finance/daily-update  — manual trigger for daily job
// ─────────────────────────────────────────────────────────────
async function triggerDailyUpdate(req, res, next) {
  try {
    // Run async, respond immediately
    dailyFinanceUpdate().catch(e =>
      console.error('[financeController] daily update error:', e.message)
    );
    return res.status(202).json({
      success: true,
      message: 'Daily finance update triggered. Check server logs for progress.',
    });
  } catch (err) { next(err); }
}

module.exports = {
  getFinanceSummary,
  getCampaignFinance,
  updateBudget,
  logExpense,
  logRevenue,
  getOptimizations,
  runOptimization,
  applyOptimization,
  triggerDailyUpdate,
};
