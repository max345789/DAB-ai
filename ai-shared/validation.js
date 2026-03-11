const { AI_TASKS, AI_TASK_VALUES } = require('./taskTypes');

function validateAIRequestBody(body = {}) {
  const errors = [];

  if (!body.task || typeof body.task !== 'string') {
    errors.push('task is required');
  } else if (!AI_TASK_VALUES.includes(body.task)) {
    errors.push(`task must be one of: ${AI_TASK_VALUES.join(', ')}`);
  }

  if (body.user_id !== undefined && body.user_id !== null && typeof body.user_id !== 'string') {
    errors.push('user_id must be a string when provided');
  }

  if (body.payload !== undefined && (body.payload === null || typeof body.payload !== 'object' || Array.isArray(body.payload))) {
    errors.push('payload must be an object');
  }

  if (body.metadata !== undefined && (body.metadata === null || typeof body.metadata !== 'object' || Array.isArray(body.metadata))) {
    errors.push('metadata must be an object');
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

module.exports = {
  AI_TASKS,
  validateAIRequestBody,
};
