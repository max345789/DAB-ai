// ─────────────────────────────────────────────────────────────
//  DAB AI – AI Agent Core  (Stage 2 — extended)
//  Handles: intent detection, chat responses, and AI agent functions.
//  Stage 2 adds: generateFollowUp(), scoreLead(), suggestMeeting()
// ─────────────────────────────────────────────────────────────
const {
  scoreLead        : _scoreLead,
  generateFollowUp : _generateFollowUp,
  suggestMeeting   : _suggestMeeting,
} = require('./aiService');

// ─────────────────────────────────────────────────────────────
//  Intent Detection
// ─────────────────────────────────────────────────────────────
const INTENTS = {
  CREATE_AD   : ['create ad', 'new ad', 'run ad', 'make ad', 'launch campaign', 'new campaign'],
  FOLLOW_UP   : ['follow up', 'followup', 'follow-up', 'send follow', 'check in', 'reach out'],
  BOOK_MEETING: ['book meeting', 'schedule meeting', 'set meeting', 'book call', 'schedule call'],
  SCORE_LEAD  : ['score lead', 'qualify lead', 'lead score', 'rate this lead', 'how good is'],
  LEAD_REPORT : ['show leads', 'lead report', 'how many leads', 'list leads', 'lead stats'],
  AD_SPEND    : ['ad spend', 'spending', 'budget', 'how much spent', 'campaign cost'],
};

function detectIntent(message) {
  const msg = message.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENTS)) {
    if (keywords.some((kw) => msg.includes(kw))) return intent;
  }
  return 'GENERAL';
}

// ─────────────────────────────────────────────────────────────
//  Chat Response Builders
// ─────────────────────────────────────────────────────────────
const responses = {
  CREATE_AD(msg) {
    const platform = msg.includes('google') ? 'Google Ads'
                   : msg.includes('tiktok') ? 'TikTok Ads'
                   : 'Meta (Facebook/Instagram)';
    return {
      intent : 'CREATE_AD', platform,
      reply  : `Here's your ad campaign suggestion for **${platform}**:\n\n` +
               `📣 **Headline:** "Transform Your Business with DAB AI"\n` +
               `📝 **Body:** Reach ideal customers, capture quality leads, follow up automatically.\n` +
               `🎯 **CTA:** "Get Started Free"\n` +
               `💰 **Budget:** $50/day\n` +
               `👥 **Audience:** Business owners, 25-55, interested in automation.\n\n` +
               `Want me to create this campaign?`,
      action : 'suggest_campaign',
    };
  },

  FOLLOW_UP() {
    return {
      intent : 'FOLLOW_UP',
      reply  : `I'll generate a personalised follow-up. Use **POST /api/followup** with:\n\n` +
               `\`{ "lead_id": <id>, "auto_generate": true }\`\n\n` +
               `The AI will write a message based on their score tier (Hot/Warm/Cold) and context.`,
      action : 'send_followup',
    };
  },

  BOOK_MEETING() {
    return {
      intent : 'BOOK_MEETING',
      reply  : `I can book a meeting! Use **POST /api/meeting** with:\n\n` +
               `\`{ "lead_id": <id>, "auto_suggest": true }\`\n\n` +
               `The AI will suggest the meeting title, duration, and agenda based on lead context.\n\n` +
               `Or provide: \`date\`, \`time\`, \`title\`, \`notes\` manually.`,
      action : 'book_meeting',
    };
  },

  SCORE_LEAD() {
    return {
      intent : 'SCORE_LEAD',
      reply  : `Lead scoring runs automatically on every \`POST /api/lead\`.\n\n` +
               `**Tiers:**\n` +
               `• 🔥 Hot (80-100) — High intent, ready to buy\n` +
               `• 🌤 Warm (50-79) — Interested, needs nurturing\n` +
               `• 🧊 Cold (0-49) — Early stage, long-term nurture\n\n` +
               `To re-score a lead: \`POST /api/lead/:id/rescore\``,
      action : 'view_score',
    };
  },

  LEAD_REPORT() {
    return {
      intent : 'LEAD_REPORT',
      reply  : `Your leads are tracked with full qualification:\n\n` +
               `• \`GET /api/leads\` — all leads\n` +
               `• \`GET /api/leads?tier=hot\` — hot leads only\n` +
               `• \`GET /api/leads?status=new\` — filter by status\n` +
               `• \`GET /api/lead/:id\` — full lead with follow-ups, meetings & conversation`,
      action : 'view_leads',
    };
  },

  AD_SPEND() {
    return {
      intent : 'AD_SPEND',
      reply  : `Tracking ad spend across all campaigns. Check **GET /api/dashboard** for totals, or **GET /api/campaigns** for per-campaign breakdown.`,
      action : 'view_spend',
    };
  },

  GENERAL(msg) {
    return {
      intent : 'GENERAL',
      reply  : `I'm DAB AI — your intelligent marketing agent. I can:\n\n` +
               `• 📣 **Create Ads** — "create ad on Meta"\n` +
               `• 📞 **Follow Up** — "send follow-up to lead"\n` +
               `• 📅 **Book Meetings** — "book a meeting"\n` +
               `• 🎯 **Score Leads** — "score this lead"\n` +
               `• 📊 **Lead Reports** — "show me my leads"\n` +
               `• 💰 **Ad Spend** — "what's my ad spend?"\n\n` +
               `You said: "${msg}"\n\nHow can I help you grow?`,
      action : 'general',
    };
  },
};

// ─────────────────────────────────────────────────────────────
//  Main chat processor
// ─────────────────────────────────────────────────────────────
function processMessage(userMessage) {
  const intent  = detectIntent(userMessage);
  const handler = responses[intent] || responses.GENERAL;
  return { ...handler(userMessage), timestamp: new Date().toISOString() };
}

// ─────────────────────────────────────────────────────────────
//  Agent Functions (Stage 2) — thin wrappers around aiService
// ─────────────────────────────────────────────────────────────

/**
 * scoreLead(leadData)
 * → { score: 0-100, tier: 'hot'|'warm'|'cold', reason: string }
 */
async function scoreLead(leadData) {
  return _scoreLead(leadData);
}

/**
 * generateFollowUp(lead, tier?)
 * → { subject: string, message: string }
 */
async function generateFollowUp(lead, tier = 'warm') {
  return _generateFollowUp(lead, tier);
}

/**
 * suggestMeeting(lead)
 * → { title, date, time, duration_mins, notes, location }
 */
async function suggestMeeting(lead) {
  return _suggestMeeting(lead);
}

// ─────────────────────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────────────────────
module.exports = {
  processMessage,
  detectIntent,
  // Stage 2 agent functions
  scoreLead,
  generateFollowUp,
  suggestMeeting,
};
