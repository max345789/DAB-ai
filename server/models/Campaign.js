// ─────────────────────────────────────────────────────────────
//  DAB AI – Campaign Model (schema reference + helper)
// ─────────────────────────────────────────────────────────────
const { supabaseAdmin } = require('../services/supabaseClient');

const TABLE = 'campaigns';

const Campaign = {
  PLATFORMS : ['meta', 'google', 'tiktok', 'other'],
  STATUSES  : ['draft', 'active', 'paused', 'completed'],

  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from(TABLE).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabaseAdmin
      .from(TABLE).insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update({ ...updates, updatedat: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  /** Increment ad spend for a campaign */
  async addSpend(id, amount) {
    const { data: current } = await supabaseAdmin
      .from(TABLE).select('spend_so_far').eq('id', id).single();
    const newSpend = (current?.spend_so_far || 0) + Number(amount);
    return Campaign.update(id, { spend_so_far: newSpend });
  },

  /** Total spend across all campaigns */
  async totalSpend() {
    const { data, error } = await supabaseAdmin
      .from(TABLE).select('spend_so_far');
    if (error) throw error;
    return data.reduce((sum, row) => sum + (row.spend_so_far || 0), 0);
  },
};

module.exports = Campaign;
