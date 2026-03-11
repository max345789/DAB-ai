const logger = require('../services/loggerService');
const { verifySignedPayload } = require('../../ai-shared/security');
const { requestAsyncTask } = require('../services/aiGatewayClient');
const {
  getQueueMetrics,
  getQueueStatus,
  getTaskState,
  markTaskCompleted,
  markTaskFailed,
} = require('../../ai-queue/queue');

const AI_RESULT_SECRET =
  process.env.CLAUDE_WORKER_KEY ||
  process.env.AI_RESULT_SECRET ||
  process.env.AI_GATEWAY_KEY ||
  (process.env.NODE_ENV === 'production' ? '' : 'dab-ai-local-worker-secret');

async function createRequest(req, res, next) {
  try {
    const queued = await requestAsyncTask({
      task: req.body.task,
      userId: req.body.user_id || null,
      payload: req.body.payload || {},
      metadata: req.body.metadata || {},
    });

    return res.status(202).json(queued);
  } catch (error) {
    if (error.status) {
      const match = error.message.match(/\{.*\}$/);
      if (match) {
        try {
          return res.status(error.status).json(JSON.parse(match[0]));
        } catch (_) {
          // fall through to generic status response
        }
      }
      return res.status(error.status).json({ error: error.message });
    }
    return next(error);
  }
}

async function receiveResult(req, res, next) {
  try {
    if (!AI_RESULT_SECRET) {
      return res.status(500).json({ error: 'AI result secret is not configured' });
    }

    const verification = verifySignedPayload(req.rawBody || JSON.stringify(req.body), req.headers, AI_RESULT_SECRET);
    if (!verification.ok) {
      return res.status(401).json({ error: verification.reason });
    }

    const { task_id: taskId, status, result = null, error = null, worker_id: workerId = null } = req.body;

    if (!taskId || !status) {
      return res.status(400).json({ error: 'task_id and status are required' });
    }

    if (status === 'completed') {
      await markTaskCompleted(taskId, result, { worker_id: workerId });
      await logger.taskEvent(taskId, 'ai_task_completed', { worker_id: workerId });
    } else {
      await markTaskFailed(taskId, error || { message: 'Task failed' }, { worker_id: workerId });
      await logger.taskEvent(taskId, 'ai_task_failed', { worker_id: workerId, error });
    }

    return res.json({ success: true, task_id: taskId, status });
  } catch (error) {
    return next(error);
  }
}

async function getStatus(_req, res, next) {
  try {
    return res.json(await getQueueStatus());
  } catch (error) {
    return next(error);
  }
}

async function getMetrics(_req, res, next) {
  try {
    return res.json(await getQueueMetrics());
  } catch (error) {
    return next(error);
  }
}

async function getTask(req, res, next) {
  try {
    const task = await getTaskState(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.json(task);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createRequest,
  getMetrics,
  getStatus,
  getTask,
  receiveResult,
};
