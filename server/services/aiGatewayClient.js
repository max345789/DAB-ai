const { AI_TASKS } = require('../../ai-shared/taskTypes');
const { validateAIRequestBody } = require('../../ai-shared/validation');
const { getTaskState, waitForTaskResult } = require('../../ai-queue/queue');
const { enqueueTask, enforceUserRateLimit } = require('../../ai-queue/queue');

const HAS_EXPLICIT_GATEWAY_URL = Object.prototype.hasOwnProperty.call(process.env, 'AI_GATEWAY_URL');
const AI_GATEWAY_URL = process.env.AI_GATEWAY_URL || 'http://localhost:4100';
const AI_GATEWAY_KEY =
  process.env.AI_GATEWAY_KEY ||
  (process.env.NODE_ENV === 'production' ? '' : 'dab-ai-local-gateway-key');

async function submitAITask({ task = AI_TASKS.MODEL_PROMPT, userId = null, payload = {}, metadata = {} }) {
  const validation = validateAIRequestBody({
    task,
    user_id: userId,
    payload,
    metadata,
  });

  if (!validation.ok) {
    throw new Error(validation.errors.join('; '));
  }

  // Embedded gateway mode:
  // If AI_GATEWAY_URL is not explicitly set, we treat the backend as the gateway and
  // enqueue directly into Redis. This avoids having to deploy a separate gateway service.
  if (!HAS_EXPLICIT_GATEWAY_URL || (process.env.AI_GATEWAY_EMBEDDED || '').toLowerCase() === 'true') {
    const rate = await enforceUserRateLimit(userId || 'anonymous', Number(process.env.AI_USER_HOURLY_LIMIT || 20));
    if (!rate.allowed) {
      const error = new Error(`AI task rate limit exceeded (max ${rate.limit}/hr)`);
      error.status = 429;
      throw error;
    }

    const queued = await enqueueTask({ task, userId, payload, metadata });
    return {
      task_id: queued.taskId,
      status: queued.status,
      queued_at: queued.createdAt,
      cached: queued.cached || false,
    };
  }

  if (!AI_GATEWAY_KEY) {
    throw new Error('AI gateway key is not configured');
  }

  const response = await fetch(`${AI_GATEWAY_URL}/ai/request`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-ai-gateway-key': AI_GATEWAY_KEY,
    },
    body: JSON.stringify({
      task,
      user_id: userId,
      payload,
      metadata,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`AI gateway request failed: ${response.status} ${text}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function requestAsyncTask({ task, userId = null, payload = {}, metadata = {} }) {
  return submitAITask({ task, userId, payload, metadata });
}

async function requestModelPrompt({ systemPrompt, userPrompt, maxTokens = 1024, userId = null, metadata = {} }) {
  const queued = await submitAITask({
    task: AI_TASKS.MODEL_PROMPT,
    userId,
    payload: { systemPrompt, userPrompt, maxTokens },
    metadata,
  });

  const taskState = await waitForTaskResult(queued.task_id, {
    timeoutMs: Number(process.env.AI_TASK_TIMEOUT_MS || 20_000),
  });

  if (!taskState) {
    throw new Error('AI task result not found');
  }

  if (taskState.status === 'failed') {
    throw new Error(taskState.error?.message || 'AI task failed');
  }

  if (taskState.status === 'timeout') {
    throw new Error('AI task timed out');
  }

  return taskState.result?.content || null;
}

module.exports = {
  AI_GATEWAY_URL,
  getTaskState,
  requestAsyncTask,
  requestModelPrompt,
  submitAITask,
};
