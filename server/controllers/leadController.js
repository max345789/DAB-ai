// ─────────────────────────────────────────────────────────────
//  DAB AI – Lead Controller  (Stage 2 — with scoring + follow-up)
//  POST /api/lead  |  GET /api/leads  |  GET /api/lead/:id  |  PATCH /api/lead/:id
// ─────────────────────────────────────────────────────────────
const { supabaseAdmin }             = require('../services/supabaseClient');
const { scoreLead }                 = require('../services/aiService');
const { scheduleFollowUp }          = require('../services/schedulerService');
const { generateFollowUp }          = require('../services/aiService');
const { logActivity }               = require('../services/activityService');

// ── Helpers ───────────────────────────────────────────────────
function toTierLabel(tier) {
  return { hot: '🔥 Hot', warm: '🌤 Warm', cold: '🧊 Cold' }[tier] || tier;
}

// ─────────────────────────────────────────────────────────────
//  POST /api/lead
//  Full Stage 2 pipeline: create → score → schedule follow-up
// ─────────────────────────────────────────────────────────────
async function createLead(req, res, next) {
  try {
    const {
      name,
      email   = null,
      phone   = null,
      company = null,
      budget  = null,
      message = null,
      source  = 'manual',
      channel = source || 'manual',
      status  = 'new',
      userid  = null,
      // optional overrides
      followup_delay_secs,
      skip_followup = false,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    // ── Step 1: Create lead ───────────────────────────────────
    const { data: lead, error: leadErr } = await supabaseAdmin
      .from('leads')
      .insert({
        name: name.trim(), email, phone, company,
        budget, message, source, channel, status, userid,
      })
      .select()
      .single();

    if (leadErr) throw leadErr;

    // ── Step 2: Score the lead (async, non-blocking on error) ─
    let scoring = null;
    try {
      scoring = await scoreLead(lead);
      await supabaseAdmin
        .from('leads')
        .update({
          leadscore   : scoring.score,
          score       : scoring.score,
          score_tier  : scoring.tier,
          score_reason: scoring.reason,
          qualified_at: new Date().toISOString(),
          updatedat   : new Date().toISOString(),
        })
        .eq('id', lead.id);

      lead.score       = scoring.score;
      lead.score_tier  = scoring.tier;
      lead.score_reason= scoring.reason;
    } catch (scoreErr) {
      console.warn('[leadController] Scoring error (non-fatal):', scoreErr.message);
    }

    // ── Step 3: Save to conversation_history ─────────────────
    if (message) {
      await supabaseAdmin
        .from('conversation_history')
        .insert({
          lead_id: lead.id,
          role   : 'user',
          message,
          intent : 'inbound_lead',
        })
        .select();
    }

    // ── Step 4: Generate + schedule follow-up ────────────────
    let followup = null;
    if (!skip_followup) {
      try {
        const tier     = scoring?.tier || 'warm';
        const generated= await generateFollowUp(lead, tier);
        const fullMsg  = `Subject: ${generated.subject}\n\n${generated.message}`;

        followup = await scheduleFollowUp(lead.id, fullMsg, {
          channel    : 'email',
          delaySeconds: followup_delay_secs || Number(process.env.FOLLOWUP_DELAY_SECS || 60),
          generatedBy: 'ai',
        });
      } catch (fuErr) {
        console.warn('[leadController] Follow-up schedule error (non-fatal):', fuErr.message);
      }
    }

    await logActivity({
      action     : 'lead_created',
      description: `Lead created: ${lead.name}`,
      category   : 'lead',
      targetId   : lead.id,
      targetType : 'lead',
      metadata   : {
        source: lead.source || source,
        score: scoring?.score ?? null,
        score_tier: scoring?.tier ?? null,
        followup_scheduled: !!followup,
      },
      userId     : userid,
    });

    return res.status(201).json({
      success : true,
      lead,
      scoring : scoring
        ? { score: scoring.score, tier: toTierLabel(scoring.tier), reason: scoring.reason }
        : null,
      followup_scheduled: followup
        ? { id: followup.id, scheduled_at: followup.scheduled_time }
        : null,
      message: `Lead created. Score: ${scoring ? toTierLabel(scoring.tier) + ' (' + scoring.score + ')' : 'pending'}.`,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  GET /api/leads
// ─────────────────────────────────────────────────────────────
async function getLeads(req, res, next) {
  try {
    const { status, tier, limit = 50, offset = 0, userid, archived = 0 } = req.query;

    let query = supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('archived', Number(archived))
      .order('createdat', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) query = query.eq('status', status);
    if (tier)   query = query.eq('score_tier', tier);
    if (userid) query = query.eq('userid', userid);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, count, leads: data });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  GET /api/lead/:id  (with followups, meetings, history)
// ─────────────────────────────────────────────────────────────
async function getLead(req, res, next) {
  try {
    const { id } = req.params;

    const [leadRes, followupsRes, meetingsRes, historyRes] = await Promise.all([
      supabaseAdmin.from('leads').select('*').eq('id', id).single(),
      supabaseAdmin.from('followups').select('*').eq('lead_id', id).order('scheduled_time'),
      supabaseAdmin.from('meetings').select('*').eq('lead_id', id).order('date'),
      supabaseAdmin.from('conversation_history').select('*').eq('lead_id', id)
        .order('timestamp', { ascending: true }).limit(50),
    ]);

    if (leadRes.error) throw leadRes.error;
    if (!leadRes.data) return res.status(404).json({ error: 'Lead not found' });

    return res.status(200).json({
      success     : true,
      lead        : leadRes.data,
      followups   : followupsRes.data  || [],
      meetings    : meetingsRes.data   || [],
      conversation: historyRes.data    || [],
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  PATCH /api/lead/:id
// ─────────────────────────────────────────────────────────────
async function updateLead(req, res, next) {
  try {
    const { id }  = req.params;
    const updates = { ...req.body, updatedat: new Date().toISOString() };
    delete updates.id;
    delete updates.createdat;

    const { data, error } = await supabaseAdmin
      .from('leads').update(updates).eq('id', id).select().single();

    if (error) throw error;
    if (!data)  return res.status(404).json({ error: 'Lead not found' });

    await logActivity({
      action     : 'lead_updated',
      description: `Lead updated: ${data.name}`,
      category   : 'lead',
      targetId   : data.id,
      targetType : 'lead',
      metadata   : { updated_fields: Object.keys(req.body || {}) },
      userId     : data.userid || null,
    });

    return res.status(200).json({ success: true, lead: data });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  POST /api/lead/:id/rescore  (manual re-score trigger)
// ─────────────────────────────────────────────────────────────
async function rescoreLead(req, res, next) {
  try {
    const { id } = req.params;
    const { data: lead, error } = await supabaseAdmin
      .from('leads').select('*').eq('id', id).single();
    if (error || !lead) return res.status(404).json({ error: 'Lead not found' });

    const scoring = await scoreLead(lead);
    await supabaseAdmin
      .from('leads')
      .update({
        leadscore   : scoring.score,
        score       : scoring.score,
        score_tier  : scoring.tier,
        score_reason: scoring.reason,
        qualified_at: new Date().toISOString(),
        updatedat   : new Date().toISOString(),
      })
      .eq('id', id);

    await logActivity({
      action     : 'lead_rescored',
      description: `Lead re-scored: ${lead.name}`,
      category   : 'lead',
      targetId   : Number(id),
      targetType : 'lead',
      metadata   : { score: scoring.score, score_tier: scoring.tier, reason: scoring.reason },
      userId     : lead.userid || null,
    });

    return res.status(200).json({
      success: true,
      lead_id: id,
      scoring: { score: scoring.score, tier: toTierLabel(scoring.tier), reason: scoring.reason },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createLead, getLeads, getLead, updateLead, rescoreLead };
