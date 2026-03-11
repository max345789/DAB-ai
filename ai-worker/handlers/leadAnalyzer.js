function leadAnalyzer(taskEnvelope) {
  const { payload = {} } = taskEnvelope;

  return {
    systemPrompt: [
      'You are DAB AI lead analysis worker.',
      'Assess lead quality, intent, urgency, and next-step recommendations.',
      'Return concise operational output that sales automation can use immediately.',
    ].join(' '),
    userPrompt: JSON.stringify(payload, null, 2),
    maxTokens: payload.maxTokens || 800,
  };
}

module.exports = { leadAnalyzer };
