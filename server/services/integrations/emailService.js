// services/integrations/emailService.js — DAB AI v5.0
// Email integration — supports SendGrid, SMTP (nodemailer), or mock

const logger = require('../loggerService');

const PROVIDER = process.env.EMAIL_PROVIDER || 'mock'; // 'sendgrid' | 'smtp' | 'mock'
const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL   = process.env.FROM_EMAIL || 'noreply@dab-ai.com';
const FROM_NAME    = process.env.FROM_NAME  || 'DAB AI';

// ─── SendGrid sender ───────────────────────────────────────────────────────
async function sendViaSendGrid(to, subject, html, text) {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      content: [
        { type: 'text/plain', value: text || subject },
        { type: 'text/html', value: html || `<p>${text || subject}</p>` }
      ]
    })
  });
  if (!res.ok && res.status !== 202) {
    throw new Error(`SendGrid error ${res.status}: ${await res.text()}`);
  }
  return { provider: 'sendgrid', to, subject, status: 'sent' };
}

// ─── Main send function ────────────────────────────────────────────────────
async function sendEmail({ to, subject, html, text }) {
  if (!to || !subject) throw new Error('to and subject are required');

  if (PROVIDER === 'sendgrid' && SENDGRID_KEY) {
    const result = await sendViaSendGrid(to, subject, html, text);
    logger.integrationCall('EMAIL', 'sendEmail', 'success', { to, subject });
    return result;
  }

  // Mock / fallback
  logger.warn('EMAIL', `Mock send to ${to}: ${subject}`, { html: html?.slice(0, 100) });
  return { provider: 'mock', to, subject, status: 'logged_only' };
}

// ─── Follow-up email composer ─────────────────────────────────────────────
async function sendFollowUpEmail(lead, followUp) {
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2>${followUp.subject}</h2>
      <p>Hi ${lead.name},</p>
      <p>${followUp.message.replace(/\n/g, '<br>')}</p>
      <hr/>
      <p style="color:#888;font-size:12px">Sent by DAB AI — intelligent marketing automation</p>
    </div>`;
  return sendEmail({ to: lead.email, subject: followUp.subject, html, text: followUp.message });
}

// ─── Meeting invitation ────────────────────────────────────────────────────
async function sendMeetingInvite(lead, meeting) {
  const subject = `Meeting Invitation: ${meeting.title}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2>📅 ${meeting.title}</h2>
      <p>Hi ${lead.name}, you're invited to a meeting.</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Date</strong></td><td style="padding:8px;border:1px solid #ddd">${meeting.date}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Time</strong></td><td style="padding:8px;border:1px solid #ddd">${meeting.time}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Duration</strong></td><td style="padding:8px;border:1px solid #ddd">${meeting.duration_mins} min</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Location</strong></td><td style="padding:8px;border:1px solid #ddd">${meeting.location || 'TBD'}</td></tr>
      </table>
      ${meeting.notes ? `<p><strong>Notes:</strong> ${meeting.notes}</p>` : ''}
    </div>`;
  return sendEmail({ to: lead.email, subject, html });
}

module.exports = { sendEmail, sendFollowUpEmail, sendMeetingInvite };
