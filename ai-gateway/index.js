const path = require('path');
require('dotenv').config({ path: process.env.AI_ENV_FILE || path.resolve(__dirname, '../server/.env') });

const express = require('express');
const rateLimit = require('express-rate-limit');

const { enqueueTask, enforceUserRateLimit, getQueueMetrics, getQueueStatus, getTaskState } = require('../ai-queue/queue');
const { structuredLog } = require('../ai-shared/logging');
const { verifySignedPayload } = require('../ai-shared/security');
const { validateAIRequestBody } = require('../ai-shared/validation');

const app = express();
const PORT = Number(process.env.AI_GATEWAY_PORT || 4100);
const AI_GATEWAY_KEY =
  process.env.AI_GATEWAY_KEY ||
  (process.env.NODE_ENV === 'production' ? '' : 'dab-ai-local-gateway-key');
const AI_RESULT_SECRET =
  process.env.CLAUDE_WORKER_KEY ||
  process.env.AI_RESULT_SECRET ||
  process.env.AI_GATEWAY_KEY ||
  (process.env.NODE_ENV === 'production' ? '' : 'dab-ai-local-worker-secret');
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:5001/api';

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString();
  },
}));
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.AI_GATEWAY_RATE_LIMIT || 120),
  standardHeaders: true,
  legacyHeaders: false,
}));

function verifyGatewayKey(req, res, next) {
  if (!AI_GATEWAY_KEY) {
    return res.status(500).json({ error: 'AI gateway key is not configured' });
  }

  if (req.header('x-ai-gateway-key') !== AI_GATEWAY_KEY) {
    return res.status(401).json({ error: 'Invalid gateway API key' });
  }

  return next();
}

app.get('/', async (_req, res) => {
  const status = await getQueueStatus();
  return res.json({
    status: 'ok',
    service: 'dab-ai-gateway',
    time: new Date().toISOString(),
    ...status,
  });
});

app.get('/ai/status', verifyGatewayKey, async (_req, res) => {
  return res.json(await getQueueStatus());
});

app.get('/ai/metrics', verifyGatewayKey, async (_req, res) => {
  return res.json(await getQueueMetrics());
});

app.get('/ai/task/:taskId', verifyGatewayKey, async (req, res) => {
  const task = await getTaskState(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  return res.json(task);
});

app.post('/ai/request', verifyGatewayKey, async (req, res) => {
  try {
    const validation = validateAIRequestBody(req.body || {});
    if (!validation.ok) {
      return res.status(400).json({ error: validation.errors.join('; ') });
    }

    const { task, user_id: userId = null, payload = {}, metadata = {} } = req.body || {};
    const rate = await enforceUserRateLimit(userId || req.ip, Number(process.env.AI_USER_HOURLY_LIMIT || 20));
    if (!rate.allowed) {
      return res.status(429).json({
        error: 'AI task rate limit exceeded',
        detail: `Max ${rate.limit} AI tasks per user per hour`,
        reset_in_seconds: rate.ttl,
      });
    }

    const queued = await enqueueTask({ task, userId, payload, metadata });

    structuredLog('ai-gateway', 'AI_TASK_RECEIVED', {
      task_id: queued.taskId,
      task,
      user_id: userId,
    });

    return res.status(202).json({
      task_id: queued.taskId,
      status: queued.status,
      queued_at: queued.createdAt,
      cached: queued.cached || false,
    });
  } catch (error) {
    structuredLog('ai-gateway', 'AI_TASK_FAILED', {
      level: 'error',
      error: error.message,
    });

    return res.status(500).json({
      error: 'Could not queue AI task',
      detail: error.message,
    });
  }
});

app.post('/ai/result', async (req, res) => {
  try {
    if (!AI_RESULT_SECRET) {
      return res.status(500).json({ error: 'AI result secret is not configured' });
    }

    const verification = verifySignedPayload(req.rawBody || JSON.stringify(req.body), req.headers, AI_RESULT_SECRET);
    if (!verification.ok) {
      return res.status(401).json({ error: verification.reason });
    }

    const response = await fetch(`${BACKEND_API_URL}/ai/result`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-signature': req.headers['x-signature'] || '',
        'x-timestamp': req.headers['x-timestamp'] || '',
      },
      body: req.rawBody || JSON.stringify(req.body),
    });

    const text = await response.text();
    return res.status(response.status).type('application/json').send(text);
  } catch (error) {
    return res.status(500).json({
      error: 'Could not forward AI result',
      detail: error.message,
    });
  }
});

app.listen(PORT, () => {
  structuredLog('ai-gateway', 'SERVICE_STARTED', {
    port: PORT,
    redis_url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  });
});
