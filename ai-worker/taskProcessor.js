const os = require('os');
const { createSignedHeaders } = require('../ai-shared/security');
const { structuredLog } = require('../ai-shared/logging');
const { getTaskState, markTaskFailed, markTaskProcessing, updateWorkerHeartbeat } = require('../ai-queue/queue');
const { receiveResponse } = require('./claudeClient');
const { AI_TASKS } = require('../ai-shared/taskTypes');
const { chatHandler } = require('./handlers/chatHandler');
const { campaignGenerator } = require('./handlers/campaignGenerator');
const { leadAnalyzer } = require('./handlers/leadAnalyzer');
const { insightGenerator } = require('./handlers/insightGenerator');
const { automationAssistant } = require('./handlers/automationAssistant');

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:5001/api';
const SHARED_SECRET =
  process.env.CLAUDE_WORKER_KEY ||
  process.env.AI_RESULT_SECRET ||
  process.env.AI_GATEWAY_KEY ||
  (process.env.NODE_ENV === 'production' ? '' : 'dab-ai-local-worker-secret');

async function postResult(payload) {
  const rawBody = JSON.stringify(payload);
  const headers = createSignedHeaders(rawBody, SHARED_SECRET);

  const response = await fetch(`${BACKEND_API_URL}/ai/result`, {
    method: 'POST',
    headers,
    body: rawBody,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Backend result endpoint failed: ${response.status} ${text}`);
  }

  return response.json();
}

function decodeTask(taskEnvelope) {
  const { task, payload = {}, metadata = {} } = taskEnvelope;

  if (task === AI_TASKS.CHAT_HANDLER) {
    return chatHandler(taskEnvelope);
  }

  if (task === AI_TASKS.CAMPAIGN_GENERATOR || task === AI_TASKS.GENERATE_AD) {
    return campaignGenerator(taskEnvelope);
  }

  if (task === AI_TASKS.LEAD_ANALYZER || task === AI_TASKS.LEAD_SCORING) {
    return leadAnalyzer(taskEnvelope);
  }

  if (task === AI_TASKS.INSIGHT_GENERATOR || task === AI_TASKS.FINANCE_INSIGHT) {
    return insightGenerator(taskEnvelope);
  }

  if (task === AI_TASKS.AUTOMATION_ASSISTANT || task === AI_TASKS.AGENT_COMMAND || task === AI_TASKS.FOLLOW_UP) {
    return automationAssistant(taskEnvelope);
  }

  return {
    systemPrompt: [
      'You are the DAB AI worker runtime.',
      'Process the task accurately and return only the requested output.',
      'Prefer concise, production-safe output.',
    ].join(' '),
    userPrompt: JSON.stringify({ task, payload, metadata }, null, 2),
    maxTokens: payload.maxTokens || 900,
  };
}

async function processTask(job, workerId = `${os.hostname()}-${process.pid}`) {
  const envelope = job.data;
  const taskId = envelope.taskId;
  const current = await getTaskState(taskId);

  if (current?.status === 'completed') {
    structuredLog('ai-worker', 'AI_TASK_SKIPPED_DUPLICATE', {
      task_id: taskId,
      task: envelope.task,
      worker_id: workerId,
    });
    return current.result;
  }

  await markTaskProcessing(taskId, workerId);
  await updateWorkerHeartbeat(workerId, {
    status: 'processing',
    task_id: taskId,
    task: envelope.task,
  });

  structuredLog('ai-worker', 'AI_TASK_RECEIVED', {
    task_id: taskId,
    task: envelope.task,
    worker_id: workerId,
  });

  structuredLog('ai-worker', 'AI_TASK_PROCESSING', {
    task_id: taskId,
    task: envelope.task,
    worker_id: workerId,
  });

  try {
    const promptPayload = decodeTask(envelope);
    const result = await receiveResponse(promptPayload);

    await postResult({
      task_id: taskId,
      status: 'completed',
      result,
      task: envelope.task,
      worker_id: workerId,
    });

    structuredLog('ai-worker', 'AI_TASK_COMPLETED', {
      task_id: taskId,
      task: envelope.task,
      worker_id: workerId,
    });

    return result;
  } catch (error) {
    await markTaskFailed(taskId, {
      message: error.message,
      task: envelope.task,
      worker_id: workerId,
    });

    await postResult({
      task_id: taskId,
      status: 'failed',
      error: { message: error.message },
      task: envelope.task,
      worker_id: workerId,
    }).catch(() => {});

    structuredLog('ai-worker', 'AI_TASK_FAILED', {
      level: 'error',
      task_id: taskId,
      task: envelope.task,
      worker_id: workerId,
      error: error.message,
    });

    throw error;
  } finally {
    await updateWorkerHeartbeat(workerId, {
      status: 'active',
      task_id: '',
      task: '',
    });
  }
}

module.exports = {
  decodeTask,
  postResult,
  processTask,
};
