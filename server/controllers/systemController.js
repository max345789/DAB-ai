const { supabaseAdmin } = require('../services/supabaseClient');

async function getDatabaseHealth() {
  try {
    const { error } = await supabaseAdmin.from('users').select('id').limit(1);
    return error ? 'error' : 'connected';
  } catch (_error) {
    return 'unreachable';
  }
}

async function getSystemHealth(_req, res, next) {
  try {
    const database = await getDatabaseHealth();

    const healthy = database === 'connected';

    return res.status(healthy ? 200 : 503).json({
      backend: 'ok',
      database,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
}

async function getSystemMetrics(_req, res, next) {
  try {
    return res.json({
      queue_length: 0,
      tasks_processing: 0,
      tasks_failed: 0,
      workers_active: 0,
      average_task_time: 0,
      last_worker_ping: null,
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
