// ─────────────────────────────────────────────────────────────
//  DAB AI – Daily Finance Job  (Stage 4)
//  Runs on a cron schedule to:
//    1. Recalculate & persist campaign_finance for all campaigns
//    2. Run the optimization engine
//    3. Log a summary
//
//  Default: every day at 02:00 AM server time
//  Override: FINANCE_CRON env var
// ─────────────────────────────────────────────────────────────
const cron               = require('node-cron');
const { supabaseAdmin }  = require('./supabaseClient');
const { updateCampaignFinance, getPlatformFinanceSummary } = require('./financeService');
const { optimizeCampaigns }  = require('./optimizationService');

const FINANCE_CRON = process.env.FINANCE_CRON || '0 2 * * *'; // daily at 02:00
let isRunning      = false;

// ─────────────────────────────────────────────────────────────
//  dailyFinanceUpdate()  — exported so it can be called manually
// ─────────────────────────────────────────────────────────────
async function dailyFinanceUpdate() {
  if (isRunning) {
    console.log('[DailyFinance] Already running — skipped.');
    return;
  }
  isRunning = true;

  const startTime = Date.now();
  console.log(`\n[DailyFinance] 🏦 Starting daily finance update — ${new Date().toISOString()}`);

  let campaignsUpdated = 0;
  let errors           = 0;
  let suggestionsCreated = 0;

  try {
    // ── Step 1: Fetch all non-deleted campaigns ───────────────
    const { data: campaigns, error: campErr } = await supabaseAdmin
      .from('campaigns')
      .select('id, name, status')
      .neq('status', 'deleted');

    if (campErr) throw campErr;

    if (!campaigns?.length) {
      console.log('[DailyFinance] No campaigns to process.');
      return;
    }

    console.log(`[DailyFinance] Processing ${campaigns.length} campaign(s)...`);

    // ── Step 2: Update campaign_finance for each ──────────────
    for (const campaign of campaigns) {
      try {
        await updateCampaignFinance(campaign.id);
        campaignsUpdated++;
        console.log(`[DailyFinance]   ✅ ${campaign.name} (#${campaign.id}) — finance updated`);
      } catch (err) {
        errors++;
        console.error(`[DailyFinance]   ❌ ${campaign.name} (#${campaign.id}):`, err.message);
      }
    }

    // ── Step 3: Run optimization engine ──────────────────────
    try {
      const result = await optimizeCampaigns();
      suggestionsCreated = result.suggestions_created || 0;
      if (suggestionsCreated > 0) {
        console.log(`[DailyFinance] 💡 Generated ${suggestionsCreated} optimization suggestion(s)`);
        result.suggestions.forEach(s => {
          console.log(`   → [${s.priority?.toUpperCase()}] ${s.suggestion}`);
        });
      }
    } catch (optErr) {
      console.error('[DailyFinance] Optimization engine error:', optErr.message);
    }

    // ── Step 4: Platform summary log ─────────────────────────
    const summary = await getPlatformFinanceSummary();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n[DailyFinance] 📊 Platform Summary:`);
    console.log(`   Total Spend   : $${summary.total_spend}`);
    console.log(`   Total Revenue : $${summary.total_revenue}`);
    console.log(`   ROAS          : ${summary.roas}x`);
    console.log(`   CPL           : $${summary.cost_per_lead}`);
    console.log(`   Conv Rate     : ${summary.conversion_rate}%`);
    console.log(`   Profit        : $${summary.profit}`);
    console.log(`[DailyFinance] ✅ Done in ${elapsed}s — updated: ${campaignsUpdated}, errors: ${errors}, suggestions: ${suggestionsCreated}\n`);

  } catch (err) {
    console.error('[DailyFinance] Fatal error:', err.message);
  } finally {
    isRunning = false;
  }
}

// ─────────────────────────────────────────────────────────────
//  startDailyFinanceJob()  — called from index.js
// ─────────────────────────────────────────────────────────────
function startDailyFinanceJob() {
  if (!cron.validate(FINANCE_CRON)) {
    console.error(`[DailyFinance] Invalid cron expression: "${FINANCE_CRON}"`);
    return;
  }

  cron.schedule(FINANCE_CRON, dailyFinanceUpdate, {
    timezone: process.env.TZ || 'UTC',
  });

  console.log(`[DailyFinance] ✅  Daily finance job scheduled (${FINANCE_CRON})`);
}

module.exports = { startDailyFinanceJob, dailyFinanceUpdate };
