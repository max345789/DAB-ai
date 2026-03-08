// ─────────────────────────────────────────────────────────────
//  DAB AI – Follow-Up Scheduler  (Stage 2)
//  Uses node-cron to process pending follow-ups on a schedule.
//
//  Workflow:
//    Every 2 minutes → query followups WHERE status='pending'
//    AND scheduled_time <= NOW()
//    → "send" each (log + mark sent + update lead stats)
//    → In production: swap _dispatchFollowUp() for email/SMS API
// ─────────────────────────────────────────────────────────────
const cron          = require('node-cron');
const { supabaseAdmin } = require('./supabaseClient');

// ── Config ────────────────────────────────────────────────────
const BATCH_SIZE       = parseInt(process.env.FOLLOWUP_BATCH_SIZE  || '20',  10);
const CRON_SCHEDULE    = process.env.FOLLOWUP_CRON                 || '*/2 * * * *';
const MAX_ATTEMPTS     = parseInt(process.env.FOLLOWUP_MAX_ATTEMPTS|| '3',   10);
const FOLLOWUP_DELAY_S = parseInt(process.env.FOLLOWUP_DELAY_SECS  || '60',  10);

let isRunning = false; // prevent overlap

// ─────────────────────────────────────────────────────────────
//  Dispatch: replace this body with email/SMS in production
// ─────────────────────────────────────────────────────────────
async function _dispatchFollowUp(followup, lead) {
  // TODO: plug in Resend / SendGrid / Twilio here
  console.log(
    `[Scheduler] 📨  Dispatching follow-up #${followup.id} ` +
    `→ Lead: "${lead?.name || followup.lead_id}" ` +
    `| Channel: ${followup.channel} | Attempt: ${followup.attempt_count + 1}`
  );
  console.log(`[Scheduler] Message preview: ${followup.message.substring(0, 80)}...`);

  // Simulate success (replace with real API call result)
  return { success: true, channel: followup.channel };
}

// ─────────────────────────────────────────────────────────────
//  Core processor
// ─────────────────────────────────────────────────────────────
async function processPendingFollowUps() {
  if (isRunning) return;
  isRunning = true;

  let processed = 0;
  let failed    = 0;

  try {
    // Fetch due follow-ups
    const { data: followups, error: fetchErr } = await supabaseAdmin
      .from('followups')
      .select('*, leads(id, name, email, phone, company, channel)')
      .eq('status', 'pending')
      .lte('scheduled_time', new Date().toISOString())
      .lt('attempt_count', MAX_ATTEMPTS)
      .order('scheduled_time', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchErr) {
      console.error('[Scheduler] DB fetch error:', fetchErr.message);
      return;
    }

    if (!followups || followups.length === 0) return; // nothing to do

    console.log(`[Scheduler] Processing ${followups.length} pending follow-up(s)...`);

    for (const followup of followups) {
      try {
        const lead = followup.leads;

        // Increment attempt counter immediately (prevents double-send on crash)
        await supabaseAdmin
          .from('followups')
          .update({ attempt_count: followup.attempt_count + 1 })
          .eq('id', followup.id);

        const result = await _dispatchFollowUp(followup, lead);

        if (result.success) {
          // Mark as sent
          await supabaseAdmin
            .from('followups')
            .update({
              status   : 'sent',
              sent_time: new Date().toISOString(),
            })
            .eq('id', followup.id);

          // Update lead stats
          await supabaseAdmin
            .from('leads')
            .update({
              lastfollowupat: new Date().toISOString(),
              followupcount : (lead?.followupcount || 0) + 1,
              status        : lead?.status === 'new' ? 'contacted' : lead?.status,
              updatedat     : new Date().toISOString(),
            })
            .eq('id', followup.lead_id);

          processed++;
        } else {
          throw new Error('Dispatch returned failure');
        }
      } catch (sendErr) {
        failed++;
        const newAttempts = followup.attempt_count + 1;

        await supabaseAdmin
          .from('followups')
          .update({
            status   : newAttempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
            error_msg: sendErr.message,
          })
          .eq('id', followup.id);

        console.error(`[Scheduler] ❌ Follow-up #${followup.id} failed:`, sendErr.message);
      }
    }

    if (processed > 0 || failed > 0) {
      console.log(`[Scheduler] ✅ Done — sent: ${processed}, failed: ${failed}`);
    }
  } catch (err) {
    console.error('[Scheduler] Unexpected error:', err.message);
  } finally {
    isRunning = false;
  }
}

// ─────────────────────────────────────────────────────────────
//  Schedule a new follow-up (called from leadController)
// ─────────────────────────────────────────────────────────────
async function scheduleFollowUp(leadId, message, options = {}) {
  const {
    channel       = 'email',
    delaySeconds  = FOLLOWUP_DELAY_S,
    generatedBy   = 'ai',
  } = options;

  const scheduledAt = new Date(Date.now() + delaySeconds * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from('followups')
    .insert({
      lead_id       : leadId,
      message,
      channel,
      status        : 'pending',
      scheduled_time: scheduledAt,
      generated_by  : generatedBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────
//  Start the cron job
// ─────────────────────────────────────────────────────────────
function startScheduler() {
  if (!cron.validate(CRON_SCHEDULE)) {
    console.error(`[Scheduler] Invalid cron: "${CRON_SCHEDULE}"`);
    return;
  }
  cron.schedule(CRON_SCHEDULE, processPendingFollowUps, {
    timezone: process.env.TZ || 'UTC',
  });
  console.log(`[Scheduler] ✅  Follow-up scheduler started (${CRON_SCHEDULE})`);
  // Also run immediately on boot
  processPendingFollowUps();
}

module.exports = { startScheduler, scheduleFollowUp, processPendingFollowUps };
