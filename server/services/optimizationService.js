// ─────────────────────────────────────────────────────────────
//  DAB AI – Optimization Engine  (Stage 4)
//  optimizeCampaigns()  — evaluates rules against live metrics
//                          and generates AI-powered suggestions.
// ─────────────────────────────────────────────────────────────
const { supabaseAdmin }        = require('./supabaseClient');
const { computeCampaignFinance } = require('./financeService');

// ── Rule evaluator ────────────────────────────────────────────
function evaluate(metricValue, operator, threshold) {
  const v = Number(metricValue);
  const t = Number(threshold);
  switch (operator) {
    case 'gt' : return v >  t;
    case 'gte': return v >= t;
    case 'lt' : return v <  t;
    case 'lte': return v <= t;
    case 'eq' : return v === t;
    default   : return false;
  }
}

// ── Action labels ────────────────────────────────────────────
const ACTION_PRIORITY = {
  pause             : 'high',
  alert             : 'high',
  increase_budget   : 'medium',
  change_targeting  : 'medium',
  decrease_budget   : 'low',
};

// ─────────────────────────────────────────────────────────────
//  AI insight generator
// ─────────────────────────────────────────────────────────────
async function generateAIInsight(campaign, metrics, rule, suggestion) {
  const PROVIDER = process.env.AI_PROVIDER ||
    (process.env.ANTHROPIC_API_KEY ? 'anthropic' :
     process.env.OPENAI_API_KEY    ? 'openai'    : 'fallback');

  const systemPrompt =
    `You are a performance marketing AI analyst. Write ONE clear, actionable insight 
(max 40 words) explaining what the data shows and what to do. Be specific with numbers.
Do NOT use markdown. Write as a plain sentence.`;

  const userPrompt =
    `Campaign: "${campaign.name}" | Platform: ${campaign.platform}
Metric: ${rule.metric} = ${metrics[rule.metric] ?? 'N/A'}
Rule triggered: ${rule.rule_name}
Suggested action: ${suggestion}
CPL: $${metrics.cost_per_lead} | ROAS: ${metrics.roas}x | Leads: ${metrics.total_leads}`;

  try {
    if (PROVIDER === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      const Anthropic = require('@anthropic-ai/sdk');
      const client    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg       = await client.messages.create({
        model     : process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        system    : systemPrompt,
        messages  : [{ role: 'user', content: userPrompt }],
      });
      return msg.content[0].text.trim();
    }

    if (PROVIDER === 'openai' && process.env.OPENAI_API_KEY) {
      const OpenAI = require('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const res    = await client.chat.completions.create({
        model    : process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages : [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        max_tokens: 100,
      });
      return res.choices[0].message.content.trim();
    }
  } catch (err) {
    console.warn('[OptimizationService] AI insight failed:', err.message);
  }

  // Rule-based fallback insight
  return buildFallbackInsight(campaign, metrics, rule);
}

function buildFallbackInsight(campaign, metrics, rule) {
  const map = {
    pause: `"${campaign.name}" has a CPL of $${metrics.cost_per_lead}, above the $${rule.threshold} threshold. Consider pausing and revising the targeting to reduce wasted spend.`,
    alert: `"${campaign.name}" flagged: ${rule.metric} is ${metrics[rule.metric] ?? 'N/A'} (threshold: ${rule.threshold}). Review performance and adjust.`,
    increase_budget: `"${campaign.name}" shows strong ${rule.metric} of ${metrics[rule.metric] ?? 'N/A'}. Consider increasing daily budget by ${rule.action_value || 20}% to capture more leads.`,
    change_targeting: `"${campaign.name}" hasn't generated leads in ${rule.threshold}+ days. Try refreshing audience targeting or creative to improve reach.`,
  };
  return map[rule.action] || `Optimization triggered for "${campaign.name}": ${rule.rule_name}.`;
}

// ─────────────────────────────────────────────────────────────
//  Build suggestion text from rule + metrics
// ─────────────────────────────────────────────────────────────
function buildSuggestionText(rule, campaign, metrics) {
  switch (rule.action) {
    case 'pause':
      return `Pause "${campaign.name}" — CPL ($${metrics.cost_per_lead}) exceeds $${rule.threshold} threshold.`;
    case 'increase_budget': {
      const pct   = rule.action_value || 20;
      const newBudget = Math.round((campaign.daily_budget || campaign.budget || 50) * (1 + pct / 100));
      return `Increase "${campaign.name}" daily budget by ${pct}% to $${newBudget} — strong ${rule.metric} of ${Number(metrics[rule.metric] || 0).toFixed(2)}.`;
    }
    case 'change_targeting':
      return `Refresh audience targeting for "${campaign.name}" — no leads generated in ${rule.threshold}+ days.`;
    case 'alert':
      return `Alert: "${campaign.name}" — ${rule.rule_name}. Current ${rule.metric}: ${Number(metrics[rule.metric] || 0).toFixed(4)}.`;
    default:
      return `Review "${campaign.name}": ${rule.rule_name}.`;
  }
}

// ─────────────────────────────────────────────────────────────
//  Compute lead-gap days (days since last lead from this campaign)
// ─────────────────────────────────────────────────────────────
async function getLeadGapDays(campaignId) {
  // leads attributed to campaign via source or metadata (we use latest from campaign_stats)
  const { data } = await supabaseAdmin
    .from('campaign_stats')
    .select('date, leads_generated')
    .eq('campaign_id', campaignId)
    .gt('leads_generated', 0)
    .order('date', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return 999; // never had a lead

  const lastDate = new Date(data[0].date);
  const today    = new Date();
  return Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
}

// ─────────────────────────────────────────────────────────────
//  Main: optimizeCampaigns(campaignIds?)
//  Runs rules against all (or specified) active campaigns.
// ─────────────────────────────────────────────────────────────
async function optimizeCampaigns(campaignIds = null) {
  // Fetch active rules
  const { data: rules, error: ruleErr } = await supabaseAdmin
    .from('optimization_rules')
    .select('*')
    .eq('status', 'active')
    .order('priority');
  if (ruleErr) throw ruleErr;
  if (!rules?.length) return { suggestions: [], message: 'No active rules.' };

  // Fetch campaigns to evaluate
  let campQuery = supabaseAdmin.from('campaigns').select('*').eq('status', 'active');
  if (campaignIds?.length) campQuery = campQuery.in('id', campaignIds);
  const { data: campaigns, error: campErr } = await campQuery;
  if (campErr) throw campErr;
  if (!campaigns?.length) return { suggestions: [], message: 'No active campaigns.' };

  const newSuggestions = [];
  const processed      = [];

  for (const campaign of campaigns) {
    // Compute finance metrics
    let metrics;
    try {
      metrics = await computeCampaignFinance(campaign.id);
    } catch {
      metrics = { cost_per_lead: 0, roas: 0, conversion_rate: 0, total_leads: 0 };
    }

    // Get lead gap
    const lead_gap_days = await getLeadGapDays(campaign.id);
    const evalMetrics   = { ...metrics, lead_gap_days };

    for (const rule of rules) {
      const metricVal = evalMetrics[rule.metric];
      if (metricVal === undefined) continue;

      if (!evaluate(metricVal, rule.operator, rule.threshold)) continue;

      // Check if same suggestion already exists and is pending
      const { data: existing } = await supabaseAdmin
        .from('optimization_suggestions')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('rule_id', rule.id)
        .eq('status', 'pending')
        .limit(1);

      if (existing?.length) continue; // skip duplicate pending suggestion

      const suggestionText = buildSuggestionText(rule, campaign, evalMetrics);
      const aiInsight      = await generateAIInsight(campaign, evalMetrics, rule, suggestionText);

      const { data: saved } = await supabaseAdmin
        .from('optimization_suggestions')
        .insert({
          campaign_id  : campaign.id,
          rule_id      : rule.id,
          suggestion   : suggestionText,
          action       : rule.action,
          action_value : rule.action_value,
          priority     : ACTION_PRIORITY[rule.action] || 'medium',
          status       : 'pending',
          metric_value : metricVal,
          metric_name  : rule.metric,
          ai_insight   : aiInsight,
        })
        .select().single();

      if (saved) newSuggestions.push(saved);
    }

    processed.push({ campaign_id: campaign.id, name: campaign.name, metrics: evalMetrics });
  }

  console.log(`[OptimizationService] Evaluated ${campaigns.length} campaign(s), generated ${newSuggestions.length} suggestion(s).`);

  return {
    campaigns_evaluated: campaigns.length,
    suggestions_created: newSuggestions.length,
    suggestions        : newSuggestions,
    processed,
  };
}

// ─────────────────────────────────────────────────────────────
//  applySuggestion(suggestionId)
//  Executes the action recommended by a suggestion
// ─────────────────────────────────────────────────────────────
async function applySuggestion(suggestionId) {
  const { data: sug, error } = await supabaseAdmin
    .from('optimization_suggestions').select('*').eq('id', suggestionId).single();
  if (error || !sug) throw new Error('Suggestion not found');

  const { data: campaign } = await supabaseAdmin
    .from('campaigns').select('*').eq('id', sug.campaign_id).single();
  if (!campaign) throw new Error('Campaign not found');

  let actionResult = {};

  switch (sug.action) {
    case 'pause':
      await supabaseAdmin.from('campaigns')
        .update({ status: 'paused', updatedat: new Date().toISOString() })
        .eq('id', campaign.id);
      actionResult = { applied: 'paused campaign' };
      break;

    case 'increase_budget': {
      const pct       = Number(sug.action_value || 20);
      const curBudget = Number(campaign.daily_budget || campaign.budget || 50);
      const newBudget = Math.round(curBudget * (1 + pct / 100) * 100) / 100;
      await supabaseAdmin.from('campaigns')
        .update({ daily_budget: newBudget, budget: newBudget, updatedat: new Date().toISOString() })
        .eq('id', campaign.id);
      actionResult = { applied: `budget increased to $${newBudget}/day` };
      break;
    }

    case 'alert':
    case 'change_targeting':
      actionResult = { applied: `${sug.action} logged — manual review required` };
      break;

    default:
      actionResult = { applied: 'logged' };
  }

  await supabaseAdmin.from('optimization_suggestions')
    .update({ status: 'applied', applied_at: new Date().toISOString() })
    .eq('id', suggestionId);

  return { suggestion: sug, ...actionResult };
}

module.exports = {
  optimizeCampaigns,
  applySuggestion,
  generateAIInsight,
};
