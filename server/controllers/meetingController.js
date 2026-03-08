// ─────────────────────────────────────────────────────────────
//  DAB AI – Meeting Controller  (Stage 2)
//  POST  /api/meeting           – create meeting
//  GET   /api/meetings          – list all
//  GET   /api/lead/:id/meetings – by lead
//  PATCH /api/meeting/:id       – update status
// ─────────────────────────────────────────────────────────────
const { supabaseAdmin }  = require('../services/supabaseClient');
const { suggestMeeting } = require('../services/aiService');

// ─────────────────────────────────────────────────────────────
//  POST /api/meeting
// ─────────────────────────────────────────────────────────────
async function createMeeting(req, res, next) {
  try {
    const {
      lead_id,
      title,
      date,
      time,
      duration_mins = 30,
      notes         = null,
      location      = 'Video Call',
      meeting_link  = null,
      auto_suggest  = false,  // if true → AI fills title/notes/duration
    } = req.body;

    if (!lead_id) return res.status(400).json({ error: 'lead_id is required' });

    // Fetch lead
    const { data: lead, error: leadErr } = await supabaseAdmin
      .from('leads').select('*').eq('id', lead_id).single();
    if (leadErr || !lead) return res.status(404).json({ error: 'Lead not found' });

    let meetingData = { title, date, time, duration_mins, notes, location };

    // If auto_suggest or missing required fields, use AI
    if (auto_suggest || !date || !time) {
      const suggestion = await suggestMeeting(lead);
      meetingData = {
        title        : title         || suggestion.title,
        date         : date          || suggestion.date,
        time         : time          || suggestion.time,
        duration_mins: duration_mins || suggestion.duration_mins,
        notes        : notes         || suggestion.notes,
        location     : location      || suggestion.location,
      };
    }

    if (!meetingData.date || !meetingData.time) {
      return res.status(400).json({ error: 'date and time are required (or use auto_suggest: true)' });
    }

    const { data: meeting, error } = await supabaseAdmin
      .from('meetings')
      .insert({
        lead_id,
        title        : meetingData.title,
        date         : meetingData.date,
        time         : meetingData.time,
        duration_mins: meetingData.duration_mins,
        notes        : meetingData.notes,
        location     : meetingData.location,
        meeting_link,
        status       : 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;

    // Update lead status to 'booked'
    await supabaseAdmin
      .from('leads')
      .update({ status: 'booked', updatedat: new Date().toISOString() })
      .eq('id', lead_id)
      .eq('status', 'new');  // only if still 'new'

    // Log to conversation history
    await supabaseAdmin.from('conversation_history').insert({
      lead_id,
      role   : 'assistant',
      message: `Meeting scheduled: "${meeting.title}" on ${meeting.date} at ${meeting.time}`,
      intent : 'meeting_booked',
    });

    // Build confirmation message
    const confirmMsg =
      `✅ Meeting confirmed!\n\n` +
      `📅 ${meeting.title}\n` +
      `🗓  ${meeting.date} at ${meeting.time}\n` +
      `⏱  ${meeting.duration_mins} minutes\n` +
      `📍 ${meeting.location}\n` +
      (meeting.notes ? `\n📝 Notes: ${meeting.notes}` : '') +
      `\n\nCalendar invite will be sent to ${lead.email || lead.name}.`;

    return res.status(201).json({
      success            : true,
      meeting,
      confirmation_message: confirmMsg,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  GET /api/meetings
// ─────────────────────────────────────────────────────────────
async function getMeetings(req, res, next) {
  try {
    const { status, lead_id, limit = 50, offset = 0, upcoming } = req.query;

    let query = supabaseAdmin
      .from('meetings')
      .select('*, leads(id, name, email, company)', { count: 'exact' })
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status)   query = query.eq('status', status);
    if (lead_id)  query = query.eq('lead_id', lead_id);
    if (upcoming === 'true') query = query.gte('date', new Date().toISOString().split('T')[0]);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, count, meetings: data });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  GET /api/lead/:id/meetings
// ─────────────────────────────────────────────────────────────
async function getLeadMeetings(req, res, next) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('meetings').select('*').eq('lead_id', id).order('date');
    if (error) throw error;
    return res.status(200).json({ success: true, meetings: data || [] });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  PATCH /api/meeting/:id
// ─────────────────────────────────────────────────────────────
async function updateMeeting(req, res, next) {
  try {
    const { id }  = req.params;
    const updates = { ...req.body, updatedat: new Date().toISOString() };
    delete updates.id;
    delete updates.createdat;

    // Handle status side-effects
    if (updates.status === 'confirmed') updates.confirmed_at = new Date().toISOString();
    if (updates.status === 'cancelled') updates.cancelled_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('meetings').update(updates).eq('id', id).select().single();
    if (error) throw error;
    if (!data)  return res.status(404).json({ error: 'Meeting not found' });

    return res.status(200).json({ success: true, meeting: data });
  } catch (err) {
    next(err);
  }
}

module.exports = { createMeeting, getMeetings, getLeadMeetings, updateMeeting };
