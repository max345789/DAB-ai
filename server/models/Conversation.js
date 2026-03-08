// ─────────────────────────────────────────────────────────────
//  DAB AI – Conversation Model (schema reference + helper)
// ─────────────────────────────────────────────────────────────
const { supabaseAdmin } = require('../services/supabaseClient');

const TABLE = 'conversations';

const Conversation = {
  ROLES: ['user', 'assistant'],

  async save({ user_id, session_id, message, role, intent }) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert({ user_id, session_id, message, role, intent })
      .select().single();
    if (error) throw error;
    return data;
  },

  async getBySession(session_id, limit = 50) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .eq('session_id', session_id)
      .order('timestamp', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async getByUser(user_id, limit = 100) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .eq('user_id', user_id)
      .order('timestamp', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },
};

module.exports = Conversation;
