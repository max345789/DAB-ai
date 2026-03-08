// controllers/integrationController.js — DAB AI v5.0
// Integration management + per-service actions

const { supabaseAdmin } = require('../services/supabaseClient');
const logger = require('../services/loggerService');

// ─── Integration registry CRUD ────────────────────────────────────────────

// GET /api/integrations
async function getIntegrations(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin.from('integrations').select('*').order('createdat', { ascending: false });
    if (error) throw error;
    const safe = (data || []).map(({ credentials, ...rest }) => ({
      ...rest,
      service_name: rest.service_name || rest.platform,
      has_credentials: !!credentials
    }));
    res.json({ integrations: safe, count: safe.length });
  } catch (err) { next(err); }
}

// POST /api/integrations
async function createIntegration(req, res, next) {
  try {
    const { service_name, display_name, credentials = {}, config = {}, is_active = true } = req.body;
    if (!service_name) return res.status(400).json({ error: 'service_name is required' });
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from('integrations')
      .insert({
        service_name,
        platform:     service_name,
        display_name,
        credentials,
        config,
        is_active,
        status:    is_active ? 'active' : 'inactive',
        createdat: now,
        updatedat: now
      })
      .select().single();
    if (error) throw error;
    logger.info('INTEGRATION', `Integration created: ${service_name}`, { id: data.id });
    const { credentials: _, ...safe } = data;
    res.status(201).json({ ...safe, has_credentials: !!credentials });
  } catch (err) { next(err); }
}

// PUT /api/integrations/:id
async function updateIntegration(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin.from('integrations')
      .update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    const { credentials: _, ...safe } = data;
    res.json({ ...safe, has_credentials: !!data.credentials });
  } catch (err) { next(err); }
}

// DELETE /api/integrations/:id
async function deleteIntegration(req, res, next) {
  try {
    const { error } = await supabaseAdmin.from('integrations').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, deleted: req.params.id });
  } catch (err) { next(err); }
}

// ─── Per-service actions ──────────────────────────────────────────────────

// POST /api/integrations/meta/sync/:campaignId
async function syncMeta(req, res, next) {
  try {
    const { campaignId } = req.params;
    const { metaCampaignId } = req.body;
    if (!metaCampaignId) return res.status(400).json({ error: 'metaCampaignId required' });
    const { syncInsightsToCampaign } = require('../services/integrations/metaAdsService');
    const result = await syncInsightsToCampaign(campaignId, metaCampaignId);
    res.json({ success: true, insights: result });
  } catch (err) { next(err); }
}

// POST /api/integrations/google/sync/:campaignId
async function syncGoogle(req, res, next) {
  try {
    const { campaignId } = req.params;
    const { googleCampaignId } = req.body;
    if (!googleCampaignId) return res.status(400).json({ error: 'googleCampaignId required' });
    const { syncGooglePerformance } = require('../services/integrations/googleAdsService');
    const result = await syncGooglePerformance(campaignId, googleCampaignId);
    res.json({ success: true, performance: result });
  } catch (err) { next(err); }
}

// POST /api/integrations/whatsapp/send
async function sendWhatsAppMsg(req, res, next) {
  try {
    const { to, message } = req.body;
    if (!to || !message) return res.status(400).json({ error: 'to and message required' });
    const { sendWhatsApp } = require('../services/integrations/whatsappService');
    const result = await sendWhatsApp(to, message);
    res.json({ success: true, result });
  } catch (err) { next(err); }
}

// GET + POST /api/integrations/whatsapp/webhook
async function whatsappWebhook(req, res) {
  if (req.method === 'GET') {
    const { verifyWebhook } = require('../services/integrations/whatsappService');
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    const v = verifyWebhook(mode, token, challenge);
    if (v.valid) return res.send(v.challenge);
    return res.status(403).send('Forbidden');
  }
  // POST: incoming message
  const { parseWebhookEvent } = require('../services/integrations/whatsappService');
  const event = parseWebhookEvent(req.body);
  if (event) {
    logger.info('WHATSAPP', `Incoming from ${event.from}: ${event.text}`);
    // TODO: route to orchestrator if needed
  }
  res.sendStatus(200);
}

// POST /api/integrations/email/send
async function sendEmailMsg(req, res, next) {
  try {
    const { to, subject, html, text } = req.body;
    if (!to || !subject) return res.status(400).json({ error: 'to and subject required' });
    const { sendEmail } = require('../services/integrations/emailService');
    const result = await sendEmail({ to, subject, html, text });
    res.json({ success: true, result });
  } catch (err) { next(err); }
}

// POST /api/integrations/calendar/book
async function bookCalendarMeeting(req, res, next) {
  try {
    const { title, date, time, duration_mins, location, notes, attendeeEmail } = req.body;
    if (!title || !date || !time) return res.status(400).json({ error: 'title, date, time required' });
    const { bookMeeting } = require('../services/integrations/calendarService');
    const result = await bookMeeting({ title, date, time, duration_mins, location, notes, attendeeEmail });
    res.json({ success: true, event: result });
  } catch (err) { next(err); }
}

// GET /api/integrations/calendar/upcoming
async function getUpcomingMeetings(req, res, next) {
  try {
    const { maxResults = 10 } = req.query;
    const { listUpcomingMeetings } = require('../services/integrations/calendarService');
    const result = await listUpcomingMeetings(parseInt(maxResults));
    res.json(result);
  } catch (err) { next(err); }
}

// POST /api/integration/connect
async function connect(req, res, next) {
  try {
    const { platform, credentials = {}, config = {}, display_name } = req.body;
    if (!platform) return res.status(400).json({ error: 'platform is required' });

    const now = new Date().toISOString();

    // Upsert by platform name — if already exists, reconnect
    const { data: existing } = await supabaseAdmin
      .from('integrations')
      .select('id')
      .eq('service_name', platform)
      .maybeSingle();

    let result;
    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('integrations')
        .update({
          credentials,
          config,
          is_active: true,
          status:    'active',
          updatedat: now,
          connected_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
      logger.info('INTEGRATION', `Integration reconnected: ${platform}`, { id: result.id });
    } else {
      const { data, error } = await supabaseAdmin
        .from('integrations')
        .insert({
          service_name:  platform,
          platform,
          display_name:  display_name || platform,
          credentials,
          config,
          is_active:     true,
          status:        'active',
          createdat:     now,
          updatedat:     now,
          connected_at:  now,
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
      logger.info('INTEGRATION', `Integration connected: ${platform}`, { id: result.id });
    }

    const { credentials: _, ...safe } = result;
    res.json({ success: true, connected: true, integration: { ...safe, has_credentials: true } });
  } catch (err) { next(err); }
}

// POST /api/integration/disconnect
async function disconnect(req, res, next) {
  try {
    const { platform, id } = req.body;
    if (!platform && !id) return res.status(400).json({ error: 'platform or id is required' });

    const now = new Date().toISOString();
    let query = supabaseAdmin
      .from('integrations')
      .update({ is_active: false, status: 'inactive', credentials: {}, updatedat: now })
      .select('id, service_name, status');

    if (id)       query = query.eq('id', id);
    else          query = query.eq('service_name', platform);

    const { data, error } = await query;
    if (error) throw error;

    const target = id || platform;
    logger.info('INTEGRATION', `Integration disconnected: ${target}`);
    res.json({ success: true, disconnected: true, updated: data?.length || 0 });
  } catch (err) { next(err); }
}

module.exports = {
  getIntegrations, createIntegration, updateIntegration, deleteIntegration,
  connect, disconnect,
  syncMeta, syncGoogle,
  sendWhatsAppMsg, whatsappWebhook,
  sendEmailMsg,
  bookCalendarMeeting, getUpcomingMeetings
};
