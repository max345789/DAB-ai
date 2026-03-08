// services/integrations/metaAdsService.js — DAB AI v5.0
// Meta Ads (Facebook/Instagram) integration — stub with real API shape

const { supabaseAdmin } = require('../supabaseClient');
const logger = require('../loggerService');

const META_API_BASE = 'https://graph.facebook.com/v19.0';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

// Helper: make authenticated Meta API call
async function metaRequest(endpoint, method = 'GET', body = null) {
  if (!ACCESS_TOKEN) {
    logger.warn('META_ADS', 'META_ACCESS_TOKEN not configured — using mock response');
    return { mock: true, endpoint };
  }
  const url = `${META_API_BASE}/${endpoint}${endpoint.includes('?') ? '&' : '?'}access_token=${ACCESS_TOKEN}`;
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// Create a Meta ad campaign
async function createMetaCampaign({ name, objective = 'CONVERSIONS', status = 'PAUSED', dailyBudget = 5000 }) {
  logger.integrationCall('META_ADS', 'createCampaign', 'sending', { name, objective });
  const result = await metaRequest(`act_${AD_ACCOUNT_ID}/campaigns`, 'POST', {
    name,
    objective,
    status,
    daily_budget: Math.round(dailyBudget * 100), // cents
    special_ad_categories: []
  });
  logger.integrationCall('META_ADS', 'createCampaign', 'success', result);
  return result;
}

// Get campaign insights (impressions, clicks, spend, conversions)
async function getCampaignInsights(metaCampaignId, datePreset = 'last_7d') {
  logger.integrationCall('META_ADS', 'getInsights', 'sending', { metaCampaignId, datePreset });
  const fields = 'impressions,clicks,spend,actions,ctr,cpc,cpm,reach';
  const result = await metaRequest(`${metaCampaignId}/insights?fields=${fields}&date_preset=${datePreset}`);

  if (result.mock) {
    return {
      impressions: 12500,
      clicks: 354,
      spend: 87.50,
      ctr: 2.83,
      cpc: 0.25,
      cpm: 7.00,
      conversions: 22,
      mock: true
    };
  }
  const d = result.data?.[0] || {};
  return {
    impressions: parseInt(d.impressions || 0),
    clicks: parseInt(d.clicks || 0),
    spend: parseFloat(d.spend || 0),
    ctr: parseFloat(d.ctr || 0),
    cpc: parseFloat(d.cpc || 0),
    cpm: parseFloat(d.cpm || 0),
    conversions: (d.actions || []).find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0
  };
}

// Sync Meta insights → campaign_stats
async function syncInsightsToCampaign(campaignId, metaCampaignId) {
  const insights = await getCampaignInsights(metaCampaignId);
  const { upsertDailyStats } = require('../analyticsService');
  await upsertDailyStats(campaignId, {
    impressions: insights.impressions,
    clicks: insights.clicks,
    spend: insights.spend,
    conversions: insights.conversions
  });
  logger.integrationCall('META_ADS', 'syncInsights', 'success', { campaignId, metaCampaignId });
  return insights;
}

module.exports = { createMetaCampaign, getCampaignInsights, syncInsightsToCampaign };
