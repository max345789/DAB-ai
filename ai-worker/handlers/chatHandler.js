function chatHandler(taskEnvelope) {
  const { payload = {} } = taskEnvelope;

  return {
    systemPrompt: [
      'You are DAB AI, the platform chat agent.',
      'Reply with concise, practical marketing operations guidance.',
      'If the user asks for an action, respond with the direct result or recommendation only.',
    ].join(' '),
    userPrompt: JSON.stringify(payload, null, 2),
    maxTokens: payload.maxTokens || 600,
  };
}

module.exports = { chatHandler };
