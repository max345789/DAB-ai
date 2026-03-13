// ─────────────────────────────────────────────────────────────
//  DAB AI – Chat Controller
//  POST /api/chat
// ─────────────────────────────────────────────────────────────
const { supabaseAdmin }  = require('../services/supabaseClient');
const { processMessage, detectIntent } = require('../services/aiAgent');
const { generateChatReply } = require('../services/aiService');
const { logActivity } = require('../services/activityService');

const DISABLE_CHAT_FALLBACK = (process.env.DISABLE_CHAT_FALLBACK || '').toLowerCase() === 'true';

function isLeadCountQuestion(message) {
  const msg = message.toLowerCase();
  return msg.includes('how many leads') || msg.includes('lead count') || msg.includes('leads got');
}

async function getLeadCountsForMessage(message) {
  const now = Date.now();
  const last24hIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const last48hIso = new Date(now - 48 * 60 * 60 * 1000).toISOString();

  const msg = message.toLowerCase();
  const wantsToday = msg.includes('today');
  const wantsYesterday = msg.includes('yesterday');

  // Total leads (all time)
  const { count: totalCount, error: totalErr } = await supabaseAdmin
    .from('leads')
    .select('id', { count: 'exact', head: true });
  if (totalErr) throw totalErr;

  // Last 24h leads
  const { count: last24hCount, error: last24hErr } = await supabaseAdmin
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .gte('createdat', last24hIso);
  if (last24hErr) throw last24hErr;

  // Yesterday = 24h-48h bucket (best-effort, timezone-agnostic)
  let yesterdayCount = null;
  if (wantsYesterday) {
    const { count, error } = await supabaseAdmin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('createdat', last48hIso)
      .lt('createdat', last24hIso);
    if (error) throw error;
    yesterdayCount = count ?? 0;
  }

  if (wantsYesterday) {
    return `Yesterday leads (previous 24h window): ${yesterdayCount}\nTotal leads: ${totalCount ?? 0}`;
  }

  if (wantsToday) {
    return `Leads in the last 24 hours: ${last24hCount ?? 0}\nTotal leads: ${totalCount ?? 0}`;
  }

  return `Total leads: ${totalCount ?? 0}\nNew leads (last 24 hours): ${last24hCount ?? 0}`;
}

/**
 * POST /api/chat
 * Body: { message, user_id?, session_id? }
 */
async function chat(req, res, next) {
  try {
    const { message, user_id = null, session_id = null } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const cleanMessage = message.trim();

    // 0️⃣  Data-aware answers (avoid model calls when we can answer from DB)
    const intent = detectIntent(cleanMessage);
    if (intent === 'LEAD_REPORT' && isLeadCountQuestion(cleanMessage)) {
      const reply = await getLeadCountsForMessage(cleanMessage);
      const timestamp = new Date().toISOString();

      // Persist user message + assistant reply (best-effort)
      await supabaseAdmin.from('conversations').insert({
        user_id,
        session_id,
        message: cleanMessage,
        role: 'user',
        intent,
      });
      await supabaseAdmin.from('conversations').insert({
        user_id,
        session_id,
        message: reply,
        role: 'assistant',
        intent,
      });

      await logActivity({
        action: 'chat_message_processed',
        description: `Chat processed with intent ${intent}`,
        category: 'chat',
        targetType: 'conversation',
        metadata: { source: 'db', used_fallback: false },
        userId: user_id,
      });

      return res.status(200).json({
        success: true,
        intent,
        action: 'lead_count',
        reply,
        source: 'db',
        used_fallback: false,
        timestamp,
      });
    }

    // 1️⃣  Generate model reply first, with deterministic fallback
    const fallbackResponse = processMessage(cleanMessage);
    const aiResponse = await generateChatReply(cleanMessage);

    const agentResponse = {
      ...fallbackResponse,
      intent,
      reply: aiResponse.reply || fallbackResponse.reply,
      source: aiResponse.source,
      used_fallback: !!aiResponse.used_fallback,
      timestamp: new Date().toISOString(),
    };

    // 2️⃣  Persist user message
    const { error: userInsertErr } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id,
        session_id,
        message : cleanMessage,
        role    : 'user',
        intent  : agentResponse.intent,
      });

    if (userInsertErr) console.error('[chat] user insert error:', userInsertErr);

    // 3️⃣  Persist assistant reply
    const { error: asstInsertErr } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id,
        session_id,
        message : agentResponse.reply,
        role    : 'assistant',
        intent  : agentResponse.intent,
      });

    if (asstInsertErr) console.error('[chat] assistant insert error:', asstInsertErr);

    // 4️⃣  Best-effort activity log
    await logActivity({
      action     : 'chat_message_processed',
      description: `Chat processed with intent ${agentResponse.intent}`,
      category   : 'chat',
      targetType : 'conversation',
      metadata   : {
        source       : agentResponse.source,
        used_fallback: agentResponse.used_fallback,
      },
      userId     : user_id,
    });

    // Optional strict mode: surface provider failure instead of fallback
    if (DISABLE_CHAT_FALLBACK && agentResponse.used_fallback) {
      return res.status(503).json({
        error: 'AI provider unavailable',
        detail: 'Chat fallback disabled; check AI provider credentials/connectivity.',
        source: agentResponse.source,
      });
    }

    // 5️⃣  Return response
    return res.status(200).json({
      success : true,
      intent  : agentResponse.intent,
      action  : agentResponse.action,
      reply   : agentResponse.reply,
      source  : agentResponse.source,
      used_fallback: agentResponse.used_fallback,
      timestamp: agentResponse.timestamp,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/chat/history?user_id=&session_id=&limit=
 * Returns conversation history for a user / session.
 */
async function getChatHistory(req, res, next) {
  try {
    const { user_id, session_id, limit = 50 } = req.query;

    let query = supabaseAdmin
      .from('conversations')
      .select('*')
      .order('timestamp', { ascending: true })
      .limit(Number(limit));

    if (user_id)    query = query.eq('user_id',    user_id);
    if (session_id) query = query.eq('session_id', session_id);

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, count: data.length, conversations: data });
  } catch (err) {
    next(err);
  }
}

module.exports = { chat, getChatHistory };
