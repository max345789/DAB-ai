const { AI_TASKS } = require('../../ai-shared/taskTypes');
const { validateAIRequestBody } = require('../../ai-shared/validation');
const { getTaskState, waitForTaskResult } = require('../../ai-queue/queue');

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
