const os = require('os');
const path = require('path');

process.env.AI_WORKER_MODE = 'true';
require('dotenv').config({ path: process.env.AI_ENV_FILE || path.resolve(__dirname, '../server/.env') });

const { Worker } = require('bullmq');

const { AI_QUEUE_NAME, connection, moveTaskToFailedQueue, updateWorkerHeartbeat } = require('../ai-queue/queue');
const { structuredLog } = require('../ai-shared/logging');
const { processTask } = require('./taskProcessor');

const WORKER_ID = process.env.AI_WORKER_ID || `${os.hostname()}-${process.pid}`;

const heartbeat = setInterval(() => {
  updateWorkerHeartbeat(WORKER_ID, { status: 'active' }).catch(() => {});
}, 30_000);

const worker = new Worker(
  AI_QUEUE_NAME,
  async job => processTask(job, WORKER_ID),
  {
    connection,
    concurrency: Number(process.env.AI_WORKER_CONCURRENCY || 2),
  }
);

worker.on('ready', () => {
  updateWorkerHeartbeat(WORKER_ID, { status: 'active' }).catch(() => {});
  structuredLog('ai-worker', 'WORKER_READY', {
    worker_id: WORKER_ID,
    queue: AI_QUEUE_NAME,
    redis_url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  });
});

worker.on('failed', async (job, error) => {
  const attemptsAllowed = job.opts?.attempts || Number(process.env.AI_QUEUE_ATTEMPTS || 3);
  const attemptsMade = (job.attemptsMade || 0) + 1;

  if (attemptsMade >= attemptsAllowed) {
    await moveTaskToFailedQueue(job.data.taskId, {
      task: job.data.task,
      user_id: job.data.userId || null,
      error: error.message,
      attempts_made: attemptsMade,
    });
  }
});

worker.on('error', error => {
  structuredLog('ai-worker', 'WORKER_ERROR', {
    level: 'error',
    worker_id: WORKER_ID,
    error: error.message,
  });
});

process.on('SIGINT', async () => {
  clearInterval(heartbeat);
  await worker.close();
  process.exit(0);
});

module.exports = worker;
