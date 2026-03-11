function automationAssistant(taskEnvelope) {
  const { payload = {} } = taskEnvelope;

  return {
    systemPrompt: [
      'You are DAB AI automation assistant.',
      'Review trigger, condition, and action data and produce a safe automation recommendation or execution summary.',
    ].join(' '),
    userPrompt: JSON.stringify(payload, null, 2),
    maxTokens: payload.maxTokens || 800,
  };
}

module.exports = { automationAssistant };
