// services/integrations/googleAdsService.js — DAB AI v5.0
// Google Ads integration — stub with real API shape

const { supabaseAdmin } = require('../supabaseClient');
const logger = require('../loggerService');

const GOOGLE_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const GOOGLE_CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID;
const GOOGLE_ACCESS_TOKEN = process.env.GOOGLE_ADS_ACCESS_TOKEN;

async function googleAdsRequest(resource, method = 'GET', body = null) {
  if (!GOOGLE_DEVELOPER_TOKEN || !GOOGLE_ACCESS_TOKEN) {
    logger.warn('GOOGLE_ADS', 'Google Ads credentials not configured — using mock response');
    return { mock: true, resource };
  }
  const url = `https://googleads.googleapis.com/v16/customers/${GOOGLE_CUSTOMER_ID}/${resource}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${GOOGLE_ACCESS_TOKEN}`,
      'developer-token': GOOGLE_DEVELOPER_TOKEN,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`Google Ads API error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function createGoogleCampaign({ name, budget, biddingStrategy = 'TARGET_CPA', targetCpa = 50 }) {
  logger.integrationCall('GOOGLE_ADS', 'createCampaign', 'sending', { name });
  const result = await googleAdsRequest('campaigns:mutate', 'POST', {
    operations: [{
      create: {
        name,
        status: 'PAUSED',
        advertisingChannelType: 'SEARCH',
        campaignBudget: `customers/${GOOGLE_CUSTOMER_ID}/campaignBudgets/${budget}`,
        biddingStrategyType: biddingStrategy
      }
    }]
  });
  logger.integrationCall('GOOGLE_ADS', 'createCampaign', 'success', result);
  return result;
}

async function getCampaignPerformance(googleCampaignId, startDate, endDate) {
  logger.integrationCall('GOOGLE_ADS', 'getPerformance', 'sending', { googleCampaignId });
  if (!GOOGLE_DEVELOPER_TOKEN) {
    return {
      impressions: 9800, clicks: 278, cost: 62.40,
      conversions: 18, ctr: 2.84, cpc: 0.22, mock: true
    };
  }
  const query = `
    SELECT campaign.id, campaign.name,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.conversions, metrics.ctr, metrics.average_cpc
    FROM campaign
    WHERE campaign.id = ${googleCampaignId}
      AND segments.date BETWEEN '${startDate}' AND '${endDate}'`;
  const result = await googleAdsRequest('googleAds:search', 'POST', { query });
  const row = result.results?.[0]?.metrics || {};
  return {
    impressions: parseInt(row.impressions || 0),
    clicks: parseInt(row.clicks || 0),
    cost: (parseInt(row.costMicros || 0) / 1e6),
    conversions: parseFloat(row.conversions || 0),
    ctr: parseFloat(row.ctr || 0),
    cpc: (parseInt(row.averageCpc || 0) / 1e6)
  };
}

async function syncGooglePerformance(campaignId, googleCampaignId) {
  const today = new Date().toISOString().split('T')[0];
  const week = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const perf = await getCampaignPerformance(googleCampaignId, week, today);
  const { upsertDailyStats } = require('../analyticsService');
  await upsertDailyStats(campaignId, {
    impressions: perf.impressions,
    clicks: perf.clicks,
    spend: perf.cost,
    conversions: Math.round(perf.conversions)
  });
  return perf;
}

module.exports = { createGoogleCampaign, getCampaignPerformance, syncGooglePerformance };
