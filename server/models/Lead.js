// ─────────────────────────────────────────────────────────────
//  DAB AI – Lead Model  (schema reference + helper)
// ─────────────────────────────────────────────────────────────
const { supabaseAdmin } = require('../services/supabaseClient');

const TABLE = 'leads';

const Lead = {
  /**
   * All valid status transitions for a lead.
   * new → contacted → qualified → booked → closed | lost
   */
  STATUSES: ['new', 'contacted', 'qualified', 'booked', 'closed', 'lost'],

  /** Find by id */
  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from(TABLE).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  /** Create a lead */
  async create(payload) {
    const { data, error } = await supabaseAdmin
      .from(TABLE).insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  /** Update a lead */
  async update(id, updates) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update({ ...updates, updatedat: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  /** Count leads by status */
  async countByStatus() {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('status', { count: 'exact', head: false });
    if (error) throw error;
    return data.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});
  },
};

module.exports = Lead;
