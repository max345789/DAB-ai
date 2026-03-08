// ─────────────────────────────────────────────────────────────
//  DAB AI – Chat Controller
//  POST /api/chat
// ─────────────────────────────────────────────────────────────
const { supabaseAdmin }  = require('../services/supabaseClient');
const { processMessage } = require('../services/aiAgent');

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

    // 1️⃣  Process message through AI agent
    const agentResponse = processMessage(message.trim());

    // 2️⃣  Persist user message
    const { error: userInsertErr } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id,
        session_id,
        message : message.trim(),
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

    // 4️⃣  Return response
    return res.status(200).json({
      success : true,
      intent  : agentResponse.intent,
      action  : agentResponse.action,
      reply   : agentResponse.reply,
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
