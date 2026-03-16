const { createCodexProvider } = require('./codex');
const { createGeminiProvider } = require('./gemini');
const { createClaudeProvider } = require('./claude');

const factories = {
  codex: createCodexProvider,
  gemini: createGeminiProvider,
  claude: createClaudeProvider,
};

function getSupportedProviders() {
  return Object.keys(factories);
}

function getDefaultProviderName(env = process.env) {
  return (env.BRIDGE_PROVIDER || 'codex').trim().toLowerCase();
}

function createProvider(providerName, env = process.env) {
  const factory = factories[providerName];

  if (!factory) {
    throw new Error(`Unsupported provider: ${providerName}. Supported providers: ${getSupportedProviders().join(', ')}`);
  }

  return factory(env);
}

function createProviderFromEnv(env = process.env) {
  return createProvider(getDefaultProviderName(env), env);
}

function splitProviderFromModel(model) {
  if (typeof model !== 'string' || !model.includes(':')) {
    return null;
  }

  const [candidateProvider, ...restParts] = model.split(':');
  const providerName = candidateProvider.trim().toLowerCase();

  if (!factories[providerName] || restParts.length === 0) {
    return null;
  }

  const strippedModel = restParts.join(':').trim();

  return {
    providerName,
    strippedModel,
  };
}

function resolveProviderSelection({ requestedProvider, model, env = process.env }) {
  const requestedName = typeof requestedProvider === 'string' && requestedProvider.trim()
    ? requestedProvider.trim().toLowerCase()
    : null;

  const parsedFromModel = splitProviderFromModel(model);
  const providerName = requestedName || parsedFromModel?.providerName || getDefaultProviderName(env);
  const provider = createProvider(providerName, env);
  const strippedModel = parsedFromModel ? parsedFromModel.strippedModel : model;

  return {
    provider,
    providerName,
    model: provider.resolveModel(strippedModel),
    modelWasProviderQualified: Boolean(parsedFromModel),
  };
}

module.exports = {
  createProvider,
  createProviderFromEnv,
  getDefaultProviderName,
  getSupportedProviders,
  resolveProviderSelection,
};
