// ─────────────────────────────────────────────────────────────
//  DAB AI – Campaign Generator Service  (Stage 3)
//  generateAdCampaign() → 3 headlines, 3 descriptions, 1 CTA,
//  audience targeting. Saves all ads to the database.
// ─────────────────────────────────────────────────────────────
const { supabaseAdmin } = require('./supabaseClient');
const { callAI } = require('./aiService');

// ─────────────────────────────────────────────────────────────
//  Rule-based fallback ad generator
// ─────────────────────────────────────────────────────────────
function ruleBasedAdGenerator({ service, target_audience, budget, location, platform }) {
  const loc    = location    || 'your area';
  const aud    = target_audience || 'business owners';
  const plat   = platform    || 'Meta';
  const svc    = service     || 'our services';
  const budStr = budget      ? `$${budget}/day` : 'flexible budget';

  return {
    headlines: [
      `Transform Your ${svc} with AI — Free Trial`,
      `${aud} in ${loc}: Automate Your Marketing Today`,
      `Stop Losing Leads — Let AI Follow Up For You`,
    ],
    descriptions: [
      `DAB AI captures leads, qualifies them automatically, and follows up — so you close more deals without extra work. Perfect for ${aud}.`,
      `Join hundreds of ${aud} using AI to grow faster. Our platform runs 24/7, books meetings, and tracks every dollar you spend.`,
      `Get more from your ${budStr} ad spend. DAB AI generates campaigns, nurtures leads, and shows you exactly what's working.`,
    ],
    cta: 'Get Started Free',
    targeting: {
      platform,
      audience_description: `${aud} in ${loc}, aged 25-55, interested in marketing, business growth, automation`,
      interests     : ['Marketing', 'Business Automation', 'Lead Generation', 'CRM'],
      age_range     : '25-55',
      locations     : [loc],
      daily_budget  : budget || 50,
      bid_strategy  : 'Lowest cost',
    },
    quality_scores: [8.2, 7.9, 7.5],
  };
}

// ─────────────────────────────────────────────────────────────
//  Main: generateAdCampaign()
// ─────────────────────────────────────────────────────────────
/**
 * generateAdCampaign(params, campaignId)
 * @param {object} params - { service, target_audience, budget, location, platform, goal }
 * @param {number} campaignId - ID of the parent campaign row
 * @returns {object} - { ads: [], targeting: {}, summary: string }
 */
async function generateAdCampaign(params, campaignId) {
  const {
    service        = 'marketing services',
    target_audience= 'business owners',
    budget         = 50,
    location       = 'United States',
    platform       = 'meta',
    goal           = 'leads',
  } = params;

  const systemPrompt =
    `You are an expert digital advertising copywriter and media buyer.
Generate high-converting ad content for a ${platform.toUpperCase()} campaign.
Goal: ${goal}. Keep copy concise, benefit-led, and action-oriented.

Respond ONLY with this exact JSON structure:
{
  "headlines": ["<headline 1>","<headline 2>","<headline 3>"],
  "descriptions": ["<desc 1 max 90 chars>","<desc 2 max 90 chars>","<desc 3 max 90 chars>"],
  "cta": "<single CTA text>",
  "targeting": {
    "audience_description": "<who to target>",
    "interests": ["<interest 1>","<interest 2>","<interest 3>","<interest 4>"],
    "age_range": "<e.g. 25-54>",
    "locations": ["<location>"],
    "daily_budget": <number>,
    "bid_strategy": "<e.g. Lowest cost>"
  },
  "quality_scores": [<score 1>,<score 2>,<score 3>],
  "summary": "<one sentence campaign strategy>"
}`;

  const userPrompt =
    `Generate ads for:
Service/Product: ${service}
Target Audience: ${target_audience}
Daily Budget: $${budget}
Location: ${location}
Platform: ${platform}
Campaign Goal: ${goal}`;

  let generated = null;
  let aiGenerated = false;
  const aiProvider = process.env.AI_GATEWAY_ENABLED === 'false'
    ? (process.env.AI_PROVIDER || 'fallback')
    : 'gateway';

  try {
    const raw = await callAI(systemPrompt, userPrompt, {
      maxTokens: 1500,
      metadata: { feature: 'campaign_generator', campaignId },
    });
    if (raw) {
      generated = JSON.parse(raw.replace(/```json|```/g, '').trim());
      aiGenerated = true;
    }
  } catch (err) {
    console.warn('[CampaignGenerator] AI failed, using rule-based fallback:', err.message);
  }

  // Fallback
  if (!generated) {
    generated = ruleBasedAdGenerator({ service, target_audience, budget, location, platform });
  }

  // ── Save ads to database ──────────────────────────────────
  const savedAds = [];
  if (campaignId) {
    const adRows = generated.headlines.map((headline, i) => ({
      campaign_id      : campaignId,
      headline,
      description      : generated.descriptions[i] || generated.descriptions[0],
      cta              : generated.cta,
      audience         : generated.targeting?.audience_description,
      platform,
      variant_index    : i + 1,
      status           : 'draft',
      performance_score: generated.quality_scores?.[i] || 7.5,
    }));

    const { data, error } = await supabaseAdmin
      .from('ads')
      .insert(adRows)
      .select();

    if (error) {
      console.error('[CampaignGenerator] DB insert error:', error.message);
    } else {
      savedAds.push(...(data || []));
    }

    // Update campaign with targeting data
    await supabaseAdmin
      .from('campaigns')
      .update({
        target_audience: generated.targeting?.audience_description || target_audience,
        updatedat      : new Date().toISOString(),
      })
      .eq('id', campaignId);
  }

  return {
    ads      : savedAds.length ? savedAds : generated.headlines.map((h, i) => ({
      headline     : h,
      description  : generated.descriptions[i],
      cta          : generated.cta,
      variant_index: i + 1,
      quality_score: generated.quality_scores?.[i],
    })),
    targeting: generated.targeting,
    summary  : generated.summary || `AI-generated ${platform} campaign targeting ${target_audience}.`,
    platform,
    ai_generated: aiGenerated,
    ai_provider: aiGenerated ? aiProvider : 'fallback',
  };
}

module.exports = { generateAdCampaign };
