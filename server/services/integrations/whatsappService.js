// services/integrations/whatsappService.js — DAB AI v5.0
// WhatsApp Business API integration (Meta Cloud API)

const logger = require('../loggerService');

const WA_PHONE_ID    = process.env.WA_PHONE_NUMBER_ID;
const WA_TOKEN       = process.env.WA_ACCESS_TOKEN;
const WA_API_BASE    = 'https://graph.facebook.com/v19.0';
const WA_VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN || 'dab-ai-webhook';

async function sendWhatsApp(to, message) {
  if (!WA_PHONE_ID || !WA_TOKEN) {
    logger.warn('WHATSAPP', 'WhatsApp credentials not configured — message not sent', { to, preview: message.slice(0, 50) });
    return { mock: true, to, status: 'simulated' };
  }
  const phone = to.replace(/\D/g, '');
  const url = `${WA_API_BASE}/${WA_PHONE_ID}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message }
    })
  });
  if (!res.ok) {
    const err = await res.text();
    logger.error('WHATSAPP', `Send failed: ${err}`, { to });
    throw new Error(`WhatsApp error: ${err}`);
  }
  const result = await res.json();
  logger.integrationCall('WHATSAPP', 'sendMessage', 'success', { to: phone, messageId: result.messages?.[0]?.id });
  return result;
}

async function sendTemplateMessage(to, templateName, languageCode = 'en_US', components = []) {
  if (!WA_PHONE_ID || !WA_TOKEN) {
    logger.warn('WHATSAPP', `Template ${templateName} not sent — no credentials`);
    return { mock: true, to, template: templateName };
  }
  const phone = to.replace(/\D/g, '');
  const res = await fetch(`${WA_API_BASE}/${WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: { name: templateName, language: { code: languageCode }, components }
    })
  });
  if (!res.ok) throw new Error(`WhatsApp template error: ${await res.text()}`);
  return res.json();
}

// Webhook verification (GET)
function verifyWebhook(mode, token, challenge) {
  if (mode === 'subscribe' && token === WA_VERIFY_TOKEN) {
    return { valid: true, challenge };
  }
  return { valid: false };
}

// Parse incoming webhook event (POST)
function parseWebhookEvent(body) {
  try {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const message = changes?.messages?.[0];
    if (!message) return null;
    return {
      from: message.from,
      messageId: message.id,
      timestamp: message.timestamp,
      type: message.type,
      text: message.text?.body || null,
      contact: changes?.contacts?.[0]?.profile?.name || null
    };
  } catch (_) {
    return null;
  }
}

module.exports = { sendWhatsApp, sendTemplateMessage, verifyWebhook, parseWebhookEvent };
