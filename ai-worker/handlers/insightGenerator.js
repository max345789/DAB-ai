function insightGenerator(taskEnvelope) {
  const { payload = {} } = taskEnvelope;

  return {
    systemPrompt: [
      'You are DAB AI analytics insight worker.',
      'Analyze campaign, finance, or lead performance data and return actionable insights.',
    ].join(' '),
    userPrompt: JSON.stringify(payload, null, 2),
    maxTokens: payload.maxTokens || 900,
  };
}

module.exports = { insightGenerator };
