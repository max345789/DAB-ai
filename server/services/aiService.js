// ─────────────────────────────────────────────────────────────
//  DAB AI – AI Service  (Stage 2)
//  Handles: lead scoring, follow-up generation, meeting suggestions.
//  Supports Claude (Anthropic) + OpenAI with graceful rule fallback.
// ─────────────────────────────────────────────────────────────
const Anthropic = process.env.ANTHROPIC_API_KEY
  ? require('@anthropic-ai/sdk')
  : null;
const OpenAI = process.env.OPENAI_API_KEY
  ? require('openai')
  : null;

// ── Provider selection ────────────────────────────────────────
const PROVIDER = process.env.AI_PROVIDER ||
  (process.env.ANTHROPIC_API_KEY ? 'anthropic' :
   process.env.OPENAI_API_KEY    ? 'openai'    : 'fallback');

let anthropicClient = null;
let openaiClient    = null;

if (PROVIDER === 'anthropic' && Anthropic) {
  anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}
if (PROVIDER === 'openai' && OpenAI) {
  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ── Core AI call (provider-agnostic) ─────────────────────────
async function callAIProviderDirect(systemPrompt, userPrompt, opts = {}) {
  const maxTokens = Number(opts.maxTokens || 1024);

  try {
    if (PROVIDER === 'ollama') {
      const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
      const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          options: {
            // Rough analogue to max_tokens. Ollama uses num_predict.
            num_predict: maxTokens,
          },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Ollama error: ${response.status} ${text}`);
      }

      const data = await response.json();
      return data?.message?.content?.trim() || null;
    }

    if (PROVIDER === 'anthropic' && anthropicClient) {
      const msg = await anthropicClient.messages.create({
        model     : process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        system    : systemPrompt,
        messages  : [{ role: 'user', content: userPrompt }],
      });
      return msg.content?.[0]?.text?.trim() || null;
    }

    if (PROVIDER === 'openai' && openaiClient) {
      const completion = await openaiClient.chat.completions.create({
        model   : process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        max_tokens: maxTokens,
      });
      return completion.choices?.[0]?.message?.content?.trim() || null;
    }
  } catch (err) {
    console.warn('[aiService] provider call failed:', err.message);
  }

  return null; // triggers fallback behavior in caller
}

async function callAI(systemPrompt, userPrompt, opts = {}) {
  // Direct provider only (OpenAI/Anthropic/Ollama). Queue/gateway pipeline removed.
  return callAIProviderDirect(systemPrompt, userPrompt, opts);
}

function templateChatReply(message) {
  return `I can help with campaigns, leads, follow-ups, meetings, and finance.

You said: "${message}"

Tell me what you want next and I will execute it step by step.`;
}

async function generateChatReply(message) {
  const systemPrompt = `You are DAB AI, an autonomous marketing assistant.
Give concise, practical responses for campaign management, lead follow-up, scheduling, finance tracking, and automation.
If user asks for an action, return a direct action-oriented response in plain text.`;

  const reply = await callAI(systemPrompt, message, { maxTokens: 400 });
  if (reply) {
    return {
      reply,
      source: PROVIDER,
      used_fallback: false,
    };
  }

  return {
    reply: templateChatReply(message),
    source: 'fallback',
    used_fallback: true,
  };
}

// ─────────────────────────────────────────────────────────────
//  1. SCORE LEAD
// ─────────────────────────────────────────────────────────────

/** Rule-based fallback scoring */
function ruleBasedScore(lead) {
  let score = 20; // baseline

  // Budget signals
  const budget = (lead.budget || '').toString().toLowerCase();
  if (/\$?[5-9]\d{3,}/.test(budget) || /[5-9]k|[1-9]\d+k/.test(budget)) score += 30;
  else if (/\$?[1-4]\d{3,}/.test(budget) || /[1-4]k/.test(budget)) score += 15;

  // Company presence
  if (lead.company && lead.company.trim().length > 2) score += 15;

  // Message urgency keywords
  const msg = (lead.message || '').toLowerCase();
  const hotWords  = ['urgent', 'asap', 'immediately', 'today', 'this week', 'ready to start'];
  const warmWords = ['interested', 'looking for', 'need', 'want', 'considering'];
  if (hotWords.some(w  => msg.includes(w))) score += 25;
  else if (warmWords.some(w => msg.includes(w))) score += 10;

  // Email present = serious
  if (lead.email) score += 10;

  return Math.min(score, 100);
}

/**
 * scoreLead(lead) → { score: 0-100, tier: 'hot'|'warm'|'cold', reason: string }
 */
async function scoreLead(lead) {
  const systemPrompt = `You are a B2B sales qualification AI. 
Score this inbound lead from 0–100 based on:
- Budget size and specificity  
- Company legitimacy and size
- Message urgency and buying intent
- Contact completeness

Respond ONLY with valid JSON:
{"score": <integer 0-100>, "tier": "<hot|warm|cold>", "reason": "<one sentence explanation>"}

Scoring tiers:  hot = 80-100,  warm = 50-79,  cold = 0-49`;

  const userPrompt = `Lead details:
Name: ${lead.name || 'Unknown'}
Company: ${lead.company || 'Not provided'}
Email: ${lead.email || 'Not provided'}
Budget: ${lead.budget || 'Not provided'}
Source: ${lead.source || lead.channel || 'Unknown'}
Message: ${lead.message || 'No message provided'}`;

  try {
    const raw = await callAI(systemPrompt, userPrompt);
    if (raw) {
      const json = JSON.parse(raw.replace(/```json|```/g, '').trim());
      return {
        score : Math.max(0, Math.min(100, Number(json.score) || 0)),
        tier  : ['hot', 'warm', 'cold'].includes(json.tier) ? json.tier : scoreTier(json.score),
        reason: json.reason || 'AI-scored',
      };
    }
  } catch (err) {
    console.warn('[aiService] scoreLead AI failed, using rule fallback:', err.message);
  }

  // Rule-based fallback
  const score = ruleBasedScore(lead);
  return { score, tier: scoreTier(score), reason: 'Rule-based qualification score' };
}

function scoreTier(score) {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
}

// ─────────────────────────────────────────────────────────────
//  2. GENERATE FOLLOW-UP
// ─────────────────────────────────────────────────────────────

/**
 * generateFollowUp(lead, tier) → { subject: string, message: string }
 */
async function generateFollowUp(lead, tier = 'warm') {
  const toneMap = {
    hot : 'urgent, direct, and action-focused — they are ready to buy',
    warm: 'friendly, curious, and value-focused',
    cold: 'educational, low-pressure, and helpful',
  };

  const systemPrompt = `You are a marketing automation AI writing personalized follow-up emails.
Write in a ${toneMap[tier] || toneMap.warm} tone.
Keep the message under 120 words. Be specific to their details.
Respond ONLY with valid JSON: {"subject": "<email subject>", "message": "<full email body>"}`;

  const userPrompt = `Write a follow-up for:
Name: ${lead.name}
Company: ${lead.company || 'their business'}
Budget: ${lead.budget || 'not specified'}
Message they sent: ${lead.message || 'Expressed interest in our services'}
Lead tier: ${tier.toUpperCase()}`;

  try {
    const raw = await callAI(systemPrompt, userPrompt);
    if (raw) {
      const json = JSON.parse(raw.replace(/```json|```/g, '').trim());
      return { subject: json.subject, message: json.message };
    }
  } catch (err) {
    console.warn('[aiService] generateFollowUp AI failed, using template:', err.message);
  }

  // Template fallback
  return templateFollowUp(lead, tier);
}

function templateFollowUp(lead, tier) {
  const name = lead.name ? lead.name.split(' ')[0] : 'there';
  const templates = {
    hot: {
      subject: `Ready to get started, ${name}?`,
      message: `Hi ${name},\n\nI saw you're looking to move quickly — great news, we can get you started this week.\n\nDAB AI helps businesses like ${lead.company || 'yours'} generate and convert leads on autopilot.\n\nAre you free for a 15-minute call tomorrow? I'd love to show you exactly how it works.\n\nBest,\nDAB AI Team`,
    },
    warm: {
      subject: `Following up on your enquiry, ${name}`,
      message: `Hi ${name},\n\nThanks for reaching out! I wanted to follow up and see if you had any questions about how DAB AI can help ${lead.company || 'your business'}.\n\nWe specialise in AI-powered lead generation and follow-up automation.\n\nWould you like a quick demo this week?\n\nBest,\nDAB AI Team`,
    },
    cold: {
      subject: `A quick resource for ${lead.company || 'your business'}`,
      message: `Hi ${name},\n\nI noticed you enquired about our services. No pressure at all — I just wanted to share a quick case study showing how we helped a similar business grow 40% in 90 days.\n\nFeel free to reply if you have questions. I'm happy to help whenever the time is right.\n\nBest,\nDAB AI Team`,
    },
  };
  return templates[tier] || templates.warm;
}

// ─────────────────────────────────────────────────────────────
//  3. SUGGEST MEETING
// ─────────────────────────────────────────────────────────────

/**
 * suggestMeeting(lead) → { title, date, time, duration_mins, notes, location }
 */
async function suggestMeeting(lead) {
  // Calculate sensible default date (next business day)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1); // skip Sunday
  if (tomorrow.getDay() === 6) tomorrow.setDate(tomorrow.getDate() + 2); // skip Saturday
  const defaultDate = tomorrow.toISOString().split('T')[0];
  const defaultTime = '10:00:00';

  const systemPrompt = `You are a sales assistant scheduling discovery calls.
Based on the lead, suggest the best meeting type, agenda, and notes.
Respond ONLY with valid JSON:
{
  "title": "<meeting title>",
  "duration_mins": <30 or 60>,
  "notes": "<agenda/prep notes 2-3 sentences>",
  "location": "Video Call"
}`;

  const userPrompt = `Lead:
Name: ${lead.name}
Company: ${lead.company || 'Unknown'}
Budget: ${lead.budget || 'Not specified'}
Message: ${lead.message || 'None'}
Score tier: ${lead.score_tier || 'warm'}`;

  try {
    const raw = await callAI(systemPrompt, userPrompt);
    if (raw) {
      const json = JSON.parse(raw.replace(/```json|```/g, '').trim());
      return {
        title        : json.title        || 'Discovery Call',
        date         : defaultDate,
        time         : defaultTime,
        duration_mins: json.duration_mins || 30,
        notes        : json.notes        || '',
        location     : json.location     || 'Video Call',
      };
    }
  } catch (err) {
    console.warn('[aiService] suggestMeeting AI failed, using default:', err.message);
  }

  return {
    title        : `Discovery Call – ${lead.name}`,
    date         : defaultDate,
    time         : defaultTime,
    duration_mins: lead.score_tier === 'hot' ? 60 : 30,
    notes        : `Review ${lead.company || 'their'} requirements. Budget: ${lead.budget || 'TBD'}. Prepared from inbound message.`,
    location     : 'Video Call',
  };
}

// ─────────────────────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────────────────────
module.exports = {
  scoreLead,
  generateFollowUp,
  suggestMeeting,
  generateChatReply,
  scoreTier,
  PROVIDER,
  _callAI: callAI,
  callAI,
  callAIProviderDirect,
};
