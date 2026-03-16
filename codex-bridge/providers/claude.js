function createClaudeProvider() {
  const reason = 'Claude OAuth is intentionally disabled in this public bridge. Anthropic documentation says third-party developers may not offer claude.ai login or rate limits for their products without prior approval. Use Anthropic API key, Bedrock, Vertex AI, or Azure AI Foundry directly instead.';

  return {
    name: 'claude',
    providerLabel: 'Claude Code',
    defaultModel: 'unsupported',
    unsupported: true,
    resolveModel(requestedModel) {
      return requestedModel || 'unsupported';
    },
    async runCompletion() {
      throw new Error(reason);
    },
    async getHealth() {
      return {
        cliAvailable: false,
        unsupported: true,
        reason,
      };
    },
    getStartupSummary() {
      return {
        authHint: 'unsupported in this public build',
        reason,
      };
    },
  };
}

module.exports = {
  createClaudeProvider,
};
