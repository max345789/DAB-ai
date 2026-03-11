function campaignGenerator(taskEnvelope) {
  const { payload = {} } = taskEnvelope;

  return {
    systemPrompt: [
      'You are DAB AI campaign generation worker.',
      'Generate ad strategy, headlines, descriptions, targeting, and CTA in strict JSON when possible.',
    ].join(' '),
    userPrompt: JSON.stringify(payload, null, 2),
    maxTokens: payload.maxTokens || 1400,
  };
}

module.exports = { campaignGenerator };
