// services/integrations/calendarService.js — DAB AI v5.0
// Calendar integration — Google Calendar or mock

const logger = require('../loggerService');

const GOOGLE_CALENDAR_TOKEN = process.env.GOOGLE_CALENDAR_TOKEN;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

async function calendarRequest(endpoint, method = 'GET', body = null) {
  if (!GOOGLE_CALENDAR_TOKEN) {
    logger.warn('CALENDAR', 'GOOGLE_CALENDAR_TOKEN not configured — using mock');
    return { mock: true, endpoint };
  }
  const base = 'https://www.googleapis.com/calendar/v3';
  const res = await fetch(`${base}/${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${GOOGLE_CALENDAR_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`Calendar API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// Book a meeting from a lead's meeting object
async function bookMeeting({ title, date, time, duration_mins = 30, location = '', notes = '', attendeeEmail = null }) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = (time || '10:00').split(':').map(Number);
  const startDt = new Date(year, month - 1, day, hour, minute);
  const endDt   = new Date(startDt.getTime() + duration_mins * 60000);

  const toISO = d => d.toISOString();

  const event = {
    summary: title,
    location,
    description: notes,
    start: { dateTime: toISO(startDt), timeZone: process.env.TZ || 'UTC' },
    end:   { dateTime: toISO(endDt),   timeZone: process.env.TZ || 'UTC' },
    reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 60 }] }
  };

  if (attendeeEmail) event.attendees = [{ email: attendeeEmail }];

  logger.integrationCall('CALENDAR', 'bookMeeting', 'sending', { title, date, time });

  if (!GOOGLE_CALENDAR_TOKEN) {
    const mockEvent = {
      id: `mock-${Date.now()}`,
      htmlLink: 'https://calendar.google.com',
      ...event,
      mock: true
    };
    logger.integrationCall('CALENDAR', 'bookMeeting', 'mock', { title });
    return mockEvent;
  }

  const result = await calendarRequest(
    `calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
    'POST',
    event
  );
  logger.integrationCall('CALENDAR', 'bookMeeting', 'success', { eventId: result.id, title });
  return result;
}

// List upcoming meetings
async function listUpcomingMeetings(maxResults = 10) {
  if (!GOOGLE_CALENDAR_TOKEN) {
    return { mock: true, items: [], message: 'Google Calendar not configured' };
  }
  const timeMin = encodeURIComponent(new Date().toISOString());
  return calendarRequest(
    `calendars/${encodeURIComponent(CALENDAR_ID)}/events?timeMin=${timeMin}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`
  );
}

// Cancel a meeting
async function cancelMeeting(eventId) {
  if (!GOOGLE_CALENDAR_TOKEN) {
    logger.warn('CALENDAR', `Mock cancel event ${eventId}`);
    return { mock: true, deleted: eventId };
  }
  await calendarRequest(
    `calendars/${encodeURIComponent(CALENDAR_ID)}/events/${eventId}`,
    'DELETE'
  );
  logger.integrationCall('CALENDAR', 'cancelMeeting', 'success', { eventId });
  return { deleted: eventId };
}

module.exports = { bookMeeting, listUpcomingMeetings, cancelMeeting };
