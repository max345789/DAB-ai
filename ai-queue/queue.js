const { createHash, randomUUID } = require('crypto');
const IORedis = require('ioredis');
const { Queue, QueueEvents } = require('bullmq');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const AI_QUEUE_NAME = process.env.AI_QUEUE_NAME || 'dab-ai-tasks';
const RESULT_QUEUE_NAME = process.env.AI_RESULT_QUEUE_NAME || 'dab-ai-results';
const FAILED_QUEUE_NAME = process.env.AI_FAILED_QUEUE_NAME || 'dab-ai-failed';
const TASK_TTL_SECONDS = Number(process.env.AI_TASK_TTL_SECONDS || 24 * 60 * 60);
const CACHE_TTL_SECONDS = Number(process.env.AI_CACHE_TTL_SECONDS || 60 * 60);
const RATE_LIMIT_WINDOW_SECONDS = Number(process.env.AI_RATE_LIMIT_WINDOW_SECONDS || 60 * 60);

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const queue = new Queue(AI_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: Number(process.env.AI_QUEUE_ATTEMPTS || 3),
    backoff: {
      type: 'exponential',
      delay: Number(process.env.AI_QUEUE_BACKOFF_MS || 1000),
    },
    removeOnComplete: 250,
    removeOnFail: 500,
  },
});

const resultQueue = new Queue(RESULT_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 250,
    removeOnFail: 250,
  },
});

const failedQueue = new Queue(FAILED_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 500,
    removeOnFail: 500,
  },
});

const queueEvents = new QueueEvents(AI_QUEUE_NAME, { connection });

function taskKey(taskId) {
  return `dab-ai:task:${taskId}`;
}

function workerKey(workerId) {
  return `dab-ai:worker:${workerId}`;
}

function cacheKey(fingerprint) {
  return `dab-ai:cache:${fingerprint}`;
}

function idempotencyKey(fingerprint) {
  return `dab-ai:idempotency:${fingerprint}`;
}

function rateLimitKey(userId) {
  return `dab-ai:rate:${userId}`;
}

function metricsKey() {
  return 'dab-ai:metrics';
}

function serializeTaskState(taskState) {
  const output = {};

  for (const [key, value] of Object.entries(taskState)) {
    if (value === undefined) continue;
    output[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }

  return output;
}

function parseTaskState(raw = {}) {
  if (!raw || Object.keys(raw).length === 0) return null;

  const parsed = { ...raw };
  const jsonFields = ['payload', 'metadata', 'result', 'error', 'meta'];

  for (const field of jsonFields) {
    if (!parsed[field]) continue;
    try {
      parsed[field] = JSON.parse(parsed[field]);
    } catch (_) {
      // keep string values untouched
    }
  }

  return parsed;
}

function buildTaskFingerprint({ task, userId = null, payload = {}, metadata = {} }) {
  return createHash('sha256')
    .update(JSON.stringify({ task, userId, payload, metadata }))
    .digest('hex');
}

async function persistTaskState(taskId, taskState) {
  await connection.hset(taskKey(taskId), serializeTaskState(taskState));
  await connection.expire(taskKey(taskId), TASK_TTL_SECONDS);
}

async function getCachedTaskByFingerprint(fingerprint) {
  const cachedTaskId = await connection.get(idempotencyKey(fingerprint));
  if (!cachedTaskId) return null;
  return getTaskState(cachedTaskId);
}

async function getCachedResult(fingerprint) {
  const raw = await connection.get(cacheKey(fingerprint));
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

async function setCachedResult(fingerprint, value) {
  await connection.set(cacheKey(fingerprint), JSON.stringify(value), 'EX', CACHE_TTL_SECONDS);
}

async function registerTaskFingerprint(fingerprint, taskId) {
  await connection.set(idempotencyKey(fingerprint), taskId, 'EX', TASK_TTL_SECONDS);
}

async function enqueueTask({ task, userId = null, payload = {}, metadata = {} }) {
  const fingerprint = buildTaskFingerprint({ task, userId, payload, metadata });
  const cachedResult = await getCachedResult(fingerprint);

  if (cachedResult) {
    return {
      taskId: cachedResult.task_id,
      status: 'completed',
      createdAt: cachedResult.created_at,
      cached: true,
      result: cachedResult.result,
    };
  }

  const existing = await getCachedTaskByFingerprint(fingerprint);
  if (existing && ['queued', 'processing', 'completed'].includes(existing.status)) {
    return {
      taskId: existing.task_id,
      status: existing.status,
      createdAt: existing.created_at,
      cached: existing.status === 'completed',
      result: existing.result || null,
    };
  }

  const taskId = randomUUID();
  const now = new Date().toISOString();

  const state = {
    task_id: taskId,
    task,
    user_id: userId || '',
    status: 'queued',
    payload,
    metadata,
    fingerprint,
    created_at: now,
    updated_at: now,
  };

  await persistTaskState(taskId, state);
  await registerTaskFingerprint(fingerprint, taskId);

  await queue.add(task, {
    taskId,
    task,
    userId,
    payload,
    metadata,
    fingerprint,
  }, { jobId: taskId });

  return { taskId, status: 'queued', createdAt: now, cached: false };
}

async function markTaskProcessing(taskId, workerId) {
  const current = await getTaskState(taskId);
  const now = new Date().toISOString();

  if (current?.status === 'completed') {
    return current;
  }

  const next = {
    ...current,
    status: 'processing',
    worker_id: workerId,
    updated_at: now,
    started_at: current?.started_at || now,
  };

  await persistTaskState(taskId, next);
  return next;
}

async function recordTaskMetric(status, durationMs = 0) {
  const payload = {
    completed_count: status === 'completed' ? 1 : 0,
    failed_count: status === 'failed' ? 1 : 0,
    total_duration_ms: Math.max(0, Math.round(durationMs || 0)),
  };

  await connection.hincrby(metricsKey(), 'completed_count', payload.completed_count);
  await connection.hincrby(metricsKey(), 'failed_count', payload.failed_count);
  await connection.hincrby(metricsKey(), 'total_duration_ms', payload.total_duration_ms);
}

async function pushResultEvent(taskId, payload) {
  await resultQueue.add('task_result', {
    taskId,
    ...payload,
    timestamp: new Date().toISOString(),
  });
}

async function pushFailedEvent(taskId, payload) {
  await failedQueue.add('failed_task', {
    taskId,
    ...payload,
    timestamp: new Date().toISOString(),
  });
}

async function markTaskCompleted(taskId, result, meta = {}) {
  const current = await getTaskState(taskId);
  const now = new Date().toISOString();
  const durationMs = current?.started_at
    ? Date.now() - new Date(current.started_at).getTime()
    : 0;

  const next = {
    ...current,
    status: 'completed',
    result,
    meta,
    updated_at: now,
    completed_at: now,
  };

  await persistTaskState(taskId, next);
  await recordTaskMetric('completed', durationMs);
  await pushResultEvent(taskId, { status: 'completed', result, meta });

  if (current?.fingerprint) {
    await setCachedResult(current.fingerprint, next);
  }

  return next;
}

async function markTaskFailed(taskId, error, meta = {}) {
  const current = await getTaskState(taskId);
  const now = new Date().toISOString();
  const durationMs = current?.started_at
    ? Date.now() - new Date(current.started_at).getTime()
    : 0;

  const next = {
    ...current,
    status: 'failed',
    error: typeof error === 'string' ? { message: error } : error,
    meta,
    updated_at: now,
    failed_at: now,
  };

  await persistTaskState(taskId, next);
  await recordTaskMetric('failed', durationMs);
  await pushResultEvent(taskId, { status: 'failed', error: next.error, meta });

  return next;
}

async function moveTaskToFailedQueue(taskId, payload) {
  await pushFailedEvent(taskId, payload);
}

async function getTaskState(taskId) {
  const raw = await connection.hgetall(taskKey(taskId));
  return parseTaskState(raw);
}

async function waitForTaskResult(taskId, opts = {}) {
  const timeoutMs = Number(opts.timeoutMs || 20_000);
  const intervalMs = Number(opts.intervalMs || 250);
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const state = await getTaskState(taskId);
    if (state && ['completed', 'failed'].includes(state.status)) {
      return state;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  return {
    task_id: taskId,
    status: 'timeout',
  };
}

async function updateWorkerHeartbeat(workerId, fields = {}) {
  const now = new Date().toISOString();
  const payload = serializeTaskState({
    worker_id: workerId,
    last_seen: now,
    ...fields,
  });

  await connection.hset(workerKey(workerId), payload);
  await connection.expire(workerKey(workerId), 90);
}

async function listActiveWorkers() {
  const keys = await connection.keys(workerKey('*'));
  if (keys.length === 0) return [];

  const workers = await Promise.all(keys.map(key => connection.hgetall(key)));
  return workers.map(parseTaskState).filter(Boolean);
}

async function getQueueMetrics() {
  const rawMetrics = await connection.hgetall(metricsKey());
  const completedCount = Number(rawMetrics.completed_count || 0);
  const failedCount = Number(rawMetrics.failed_count || 0);
  const totalDurationMs = Number(rawMetrics.total_duration_ms || 0);
  const averageTaskTimeMs = completedCount + failedCount > 0
    ? Math.round(totalDurationMs / (completedCount + failedCount))
    : 0;

  const workers = await listActiveWorkers();

  return {
    queue_size: await queue.count(),
    average_task_time_ms: averageTaskTimeMs,
    worker_health: workers.map(worker => ({
      worker_id: worker.worker_id,
      status: worker.status,
      last_seen: worker.last_seen,
    })),
    failed_tasks_count: failedCount,
    last_worker_ping: workers.reduce((latest, worker) => {
      if (!worker.last_seen) return latest;
      if (!latest) return worker.last_seen;
      return worker.last_seen > latest ? worker.last_seen : latest;
    }, null),
  };
}

async function getQueueStatus() {
  const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');
  const workers = await listActiveWorkers();
  const metrics = await getQueueMetrics();

  return {
    queue_name: AI_QUEUE_NAME,
    queue_length: counts.waiting || 0,
    tasks_processing: counts.active || 0,
    tasks_delayed: counts.delayed || 0,
    tasks_failed: counts.failed || 0,
    tasks_completed: counts.completed || 0,
    workers_active: workers.length,
    last_worker_ping: metrics.last_worker_ping,
    workers,
  };
}

async function enforceUserRateLimit(userId, limit = 20) {
  const key = rateLimitKey(userId || 'anonymous');
  const current = await connection.incr(key);
  if (current === 1) {
    await connection.expire(key, RATE_LIMIT_WINDOW_SECONDS);
  }

  const ttl = await connection.ttl(key);
  return {
    allowed: current <= limit,
    current,
    limit,
    ttl,
  };
}

module.exports = {
  AI_QUEUE_NAME,
  RESULT_QUEUE_NAME,
  FAILED_QUEUE_NAME,
  REDIS_URL,
  connection,
  queue,
  queueEvents,
  resultQueue,
  failedQueue,
  buildTaskFingerprint,
  enqueueTask,
  enforceUserRateLimit,
  getCachedResult,
  getQueueMetrics,
  getQueueStatus,
  getTaskState,
  markTaskCompleted,
  markTaskFailed,
  markTaskProcessing,
  moveTaskToFailedQueue,
  updateWorkerHeartbeat,
  waitForTaskResult,
};
