const { connection, getQueueMetrics, getQueueStatus } = require('../../ai-queue/queue');
const { supabaseAdmin } = require('../services/supabaseClient');

const AI_GATEWAY_URL = process.env.AI_GATEWAY_URL || 'http://localhost:4100';

async function getGatewayHealth() {
  try {
    const response = await fetch(`${AI_GATEWAY_URL}/`, { method: 'GET' });
    return response.ok ? 'ok' : 'down';
  } catch (_error) {
    return 'down';
  }
}

async function getDatabaseHealth() {
  try {
    const { error } = await supabaseAdmin.from('users').select('id').limit(1);
    return error ? 'error' : 'connected';
  } catch (_error) {
    return 'unreachable';
  }
}

async function getRedisHealth() {
  try {
    const result = await connection.ping();
    return result === 'PONG' ? 'ok' : 'error';
  } catch (_error) {
    return 'error';
  }
}

async function getWorkerHealth() {
  const queueStatus = await getQueueStatus();
  if (!queueStatus.last_worker_ping) {
    return 'missing';
  }

  const ageMs = Date.now() - new Date(queueStatus.last_worker_ping).getTime();
  return ageMs <= 90_000 ? 'alive' : 'stale';
}

async function getSystemHealth(_req, res, next) {
  try {
    const [gateway, redis, database, worker] = await Promise.all([
      getGatewayHealth(),
      getRedisHealth(),
      getDatabaseHealth(),
      getWorkerHealth(),
    ]);

    const healthy =
      gateway === 'ok' &&
      redis === 'ok' &&
      database === 'connected' &&
      worker === 'alive';

    return res.status(healthy ? 200 : 503).json({
      backend: 'ok',
      gateway,
      redis,
      worker,
      database,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
}

async function getSystemMetrics(_req, res, next) {
  try {
    const [queueStatus, queueMetrics] = await Promise.all([
      getQueueStatus(),
      getQueueMetrics(),
    ]);

    return res.json({
      queue_length: queueStatus.queue_length,
      tasks_processing: queueStatus.tasks_processing,
      tasks_failed: queueStatus.tasks_failed,
      workers_active: queueStatus.workers_active,
      average_task_time: queueMetrics.average_task_time_ms,
      last_worker_ping: queueStatus.last_worker_ping,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getSystemHealth,
  getSystemMetrics,
};
