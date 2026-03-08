// ─────────────────────────────────────────────────────────────
//  DAB AI – Follow-Up Controller  (Stage 2)
//  POST /api/followup          – manual follow-up
//  GET  /api/followups         – list all
//  GET  /api/lead/:id/followups – by lead
//  PATCH /api/followup/:id     – update status
// ─────────────────────────────────────────────────────────────
const { supabaseAdmin }    = require('../services/supabaseClient');
const { generateFollowUp } = require('../services/aiService');
const { scheduleFollowUp } = require('../services/schedulerService');

// ─────────────────────────────────────────────────────────────
//  POST /api/followup  — manual or AI-generated
// ─────────────────────────────────────────────────────────────
async function createFollowUp(req, res, next) {
  try {
    const {
      lead_id,
      message         = null,
      channel         = 'email',
      scheduled_time  = null,    // ISO string; defaults to now+60s if not set
      delay_seconds   = 60,
      auto_generate   = false,   // if true → AI writes the message
    } = req.body;

    if (!lead_id) return res.status(400).json({ error: 'lead_id is required' });

    // Fetch lead for context
    const { data: lead, error: leadErr } = await supabaseAdmin
      .from('leads').select('*').eq('id', lead_id).single();
    if (leadErr || !lead) return res.status(404).json({ error: 'Lead not found' });

    // Build message
    let finalMessage = message;
    let subject      = null;

    if (!finalMessage || auto_generate) {
      const generated = await generateFollowUp(lead, lead.score_tier || 'warm');
      subject      = generated.subject;
      finalMessage = `Subject: ${generated.subject}\n\n${generated.message}`;
    }

    // Schedule time
    const scheduledAt = scheduled_time
      ? new Date(scheduled_time).toISOString()
      : new Date(Date.now() + delay_seconds * 1000).toISOString();

    const followup = await scheduleFollowUp(lead_id, finalMessage, {
      channel,
      delaySeconds: 0,           // time already computed above
      generatedBy : auto_generate ? 'ai' : 'manual',
    });

    // Override scheduled_time if provided
    await supabaseAdmin
      .from('followups')
      .update({ scheduled_time: scheduledAt })
      .eq('id', followup.id);

    // Log to conversation history
    await supabaseAdmin.from('conversation_history').insert({
      lead_id,
      role   : 'assistant',
      message: finalMessage,
      intent : 'followup_scheduled',
    });

    return res.status(201).json({
      success      : true,
      followup     : { ...followup, scheduled_time: scheduledAt },
      subject,
      message      : `Follow-up scheduled for ${new Date(scheduledAt).toLocaleString()}.`,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  GET /api/followups
// ─────────────────────────────────────────────────────────────
async function getFollowUps(req, res, next) {
  try {
    const { status, lead_id, limit = 50, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('followups')
      .select('*, leads(id, name, email, company)', { count: 'exact' })
      .order('scheduled_time', { ascending: true })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status)  query = query.eq('status', status);
    if (lead_id) query = query.eq('lead_id', lead_id);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, count, followups: data });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  GET /api/lead/:id/followups
// ─────────────────────────────────────────────────────────────
async function getLeadFollowUps(req, res, next) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('followups')
      .select('*')
      .eq('lead_id', id)
      .order('scheduled_time', { ascending: true });

    if (error) throw error;
    return res.status(200).json({ success: true, followups: data || [] });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  PATCH /api/followup/:id
// ─────────────────────────────────────────────────────────────
async function updateFollowUp(req, res, next) {
  try {
    const { id }  = req.params;
    const updates = req.body;
    delete updates.id;
    delete updates.createdat;

    const { data, error } = await supabaseAdmin
      .from('followups').update(updates).eq('id', id).select().single();
    if (error) throw error;
    if (!data)  return res.status(404).json({ error: 'Follow-up not found' });

    return res.status(200).json({ success: true, followup: data });
  } catch (err) {
    next(err);
  }
}

module.exports = { createFollowUp, getFollowUps, getLeadFollowUps, updateFollowUp };
