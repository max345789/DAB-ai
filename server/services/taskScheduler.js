// services/taskScheduler.js — DAB AI v5.0
// Unified scheduler: consolidates all 4 cron jobs + processes agent_tasks queue

const cron = require('node-cron');
const { supabaseAdmin } = require('./supabaseClient');
const logger = require('./loggerService');

let isStarted = false;
const runningJobs = {};

// ─── Import sub-schedulers ─────────────────────────────────────────────────
function getFollowUpProcessor() { return require('./schedulerService').processPendingFollowUps; }
function getDailyFinanceJob()    { return require('./dailyFinanceJob').dailyFinanceUpdate; }

// ─── Process pending agent_tasks ──────────────────────────────────────────
async function processAgentTasks() {
  if (runningJobs.agentTasks) return;
  runningJobs.agentTasks = true;
  try {
    const now = new Date().toISOString();
    const { data: tasks } = await supabaseAdmin
      .from('agent_tasks')
      .select('*')
      .in('status', ['pending', 'scheduled'])
      .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
      .order('priority', { ascending: false })
      .limit(10);

    if (!tasks || tasks.length === 0) return;

    for (const task of tasks) {
      await supabaseAdmin.from('agent_tasks')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', task.id);

      try {
        let result = null;
        switch (task.agent_type) {
          case 'follow_up':
            result = await getFollowUpProcessor()();
            break;
          case 'finance':
            result = await getDailyFinanceJob()();
            break;
          case 'automation': {
            const { fireTrigger } = require('./automationEngine');
            result = await fireTrigger(task.task_type, task.payload?.targetId, task.payload?.context || {});
            break;
          }
          default:
            result = { skipped: true, reason: `No handler for agent_type: ${task.agent_type}` };
        }
        await supabaseAdmin.from('agent_tasks')
          .update({ status: 'completed', completed_at: new Date().toISOString(), result })
          .eq('id', task.id);

        logger.taskEvent(task.id, 'COMPLETED', { agentType: task.agent_type, taskType: task.task_type });
      } catch (err) {
        await supabaseAdmin.from('agent_tasks')
          .update({ status: 'failed', result: { error: err.message } })
          .eq('id', task.id);
        logger.error('TASK_SCHEDULER', `Task ${task.id} failed: ${err.message}`);
      }
    }
  } finally {
    runningJobs.agentTasks = false;
  }
}

// ─── Run automation rules on a schedule ───────────────────────────────────
async function runScheduledAutomations() {
  if (runningJobs.automations) return;
  runningJobs.automations = true;
  try {
    const { data: rules } = await supabaseAdmin
      .from('automation_rules')
      .select('*')
      .eq('trigger_type', 'schedule')
      .eq('is_active', true);

    if (!rules || rules.length === 0) return;

    const { fireTrigger } = require('./automationEngine');
    for (const rule of rules) {
      await fireTrigger('schedule', null, { rule });
    }
    logger.info('TASK_SCHEDULER', `Ran ${rules.length} scheduled automation rule(s)`);
  } finally {
    runningJobs.automations = false;
  }
}

// ─── Clean up old completed tasks ─────────────────────────────────────────
async function cleanupOldTasks() {
  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString(); // 7 days
  await supabaseAdmin.from('agent_tasks')
    .delete()
    .in('status', ['completed', 'failed'])
    .lt('created_at', cutoff);
  logger.info('TASK_SCHEDULER', 'Old tasks cleaned up');
}

// ─── Start all cron jobs ───────────────────────────────────────────────────
function startTaskScheduler() {
  if (isStarted) {
    logger.warn('TASK_SCHEDULER', 'Already running, skipping start');
    return;
  }
  isStarted = true;

  // Every 2 min: process follow-ups + agent task queue
  cron.schedule('*/2 * * * *', async () => {
    logger.debug('TASK_SCHEDULER', 'Follow-up & agent task sweep');
    await Promise.allSettled([
      getFollowUpProcessor()(),
      processAgentTasks()
    ]);
  });

  // Every 15 min: run scheduled automation rules
  cron.schedule('*/15 * * * *', async () => {
    logger.debug('TASK_SCHEDULER', 'Scheduled automations sweep');
    await runScheduledAutomations();
  });

  // Daily at 02:00 AM: finance update
  const financeCron = process.env.FINANCE_CRON || '0 2 * * *';
  cron.schedule(financeCron, async () => {
    logger.info('TASK_SCHEDULER', 'Daily finance job started');
    await getDailyFinanceJob()();
  });

  // Daily at 03:00 AM: cleanup old tasks
  cron.schedule('0 3 * * *', async () => {
    logger.info('TASK_SCHEDULER', 'Task cleanup started');
    await cleanupOldTasks();
  });

  logger.info('TASK_SCHEDULER', 'Unified scheduler started (4 cron jobs active)');
}

module.exports = { startTaskScheduler, processAgentTasks, runScheduledAutomations, cleanupOldTasks };
