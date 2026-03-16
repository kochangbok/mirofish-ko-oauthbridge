const express = require('express');
const { buildPrompt, makeResponse } = require('./lib/prompt');
const { renderIndexPage } = require('./lib/ui');
const {
  createProvider,
  createProviderFromEnv,
  getDefaultProviderName,
  getSupportedProviders,
  resolveProviderSelection,
} = require('./providers');

const app = express();
app.use(express.json({ limit: '4mb' }));

const PORT = Number(process.env.PORT || 8787);
const maxConcurrent = Math.max(1, Number(process.env.BRIDGE_MAX_CONCURRENCY || 2));
const supportedProviders = getSupportedProviders();
const defaultProviderName = getDefaultProviderName(process.env);
const defaultProvider = createProviderFromEnv(process.env);

let activeJobs = 0;
let queueDepth = 0;
const pendingJobs = [];

function dequeueAndRunNext() {
  while (activeJobs < maxConcurrent && pendingJobs.length > 0) {
    const nextJob = pendingJobs.shift();
    activeJobs += 1;
    queueDepth = pendingJobs.length;
    nextJob();
  }
}

function enqueueCompletion(taskFactory) {
  return new Promise((resolve, reject) => {
    const run = async () => {
      try {
        const result = await taskFactory();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        activeJobs = Math.max(0, activeJobs - 1);
        queueDepth = pendingJobs.length;
        dequeueAndRunNext();
      }
    };

    pendingJobs.push(run);
    queueDepth = pendingJobs.length;
    dequeueAndRunNext();
  });
}

async function collectProviderHealth(providerName) {
  const provider = createProvider(providerName, process.env);
  const providerHealth = await provider.getHealth();
  const providerAvailable = Boolean(
    providerHealth.providerAvailable ?? providerHealth.cliAvailable ?? providerHealth.codexAvailable
  );
  const queueDepth = Number.isFinite(providerHealth.queueDepth) ? providerHealth.queueDepth : 0;

  return {
    provider: provider.name,
    defaultModel: provider.defaultModel,
    ...providerHealth,
    providerAvailable,
    codexAvailable: Boolean(
      providerHealth.codexAvailable ?? (provider.name === 'codex' ? providerAvailable : false)
    ),
    queueDepth,
  };
}

app.get('/', (_req, res) => {
  res.type('html').send(renderIndexPage({ defaultProviderName, supportedProviders }));
});

app.get('/providers', async (_req, res) => {
  const providers = [];
  for (const providerName of supportedProviders) {
    providers.push(await collectProviderHealth(providerName));
  }

  res.json({
    ok: true,
    busy: activeJobs > 0,
    activeJobs,
    maxConcurrent,
    defaultProvider: defaultProviderName,
    providers,
  });
});

app.get('/health', async (req, res) => {
  const requestedProvider = typeof req.query.provider === 'string' ? req.query.provider : defaultProviderName;
  const providerHealth = await collectProviderHealth(requestedProvider.toLowerCase());

  res.json({
    ok: true,
    busy: activeJobs > 0,
    activeJobs,
    maxConcurrent,
    supportedProviders,
    defaultProvider: defaultProviderName,
    ...providerHealth,
  });
});

app.post('/v1/chat/completions', async (req, res) => {
  const { messages, model, provider: requestedProvider, stream, response_format, max_tokens } = req.body || {};

  if (stream) {
    return res.status(400).json({
      error: {
        message: 'Streaming is not supported by this bridge yet.',
        type: 'invalid_request_error',
      },
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: {
        message: 'messages must be a non-empty array.',
        type: 'invalid_request_error',
      },
    });
  }

  try {
    const { response, bridgeMeta } = await enqueueCompletion(async () => {
      const selection = resolveProviderSelection({
        requestedProvider,
        model,
        env: process.env,
      });

      const prompt = buildPrompt(messages, {
        providerLabel: selection.provider.providerLabel,
        jsonMode: response_format && response_format.type === 'json_object',
        maxTokens: max_tokens,
      });

      const content = await selection.provider.runCompletion({ prompt, model: selection.model });
      const response = makeResponse({ model: selection.model, content });

      return {
        response,
        bridgeMeta: {
          provider: selection.providerName,
          defaultProvider: defaultProviderName,
          modelWasProviderQualified: selection.modelWasProviderQualified,
        },
      };
    });

    response.bridge = bridgeMeta;
    res.json(response);
  } catch (error) {
    const statusCode = error.code === 'ETIMEDOUT' ? 504 : 500;
    res.status(statusCode).json({
      error: {
        message: error.message || 'Bridge execution failed.',
        type: error.code === 'ETIMEDOUT' ? 'timeout_error' : 'server_error',
      },
    });
  }
});

app.listen(PORT, () => {
  const startup = defaultProvider.getStartupSummary();
  console.log(`codex-bridge listening on http://127.0.0.1:${PORT}`);
  console.log(`defaultProvider=${defaultProvider.name}`);
  console.log(`supportedProviders=${supportedProviders.join(',')}`);
  console.log(`defaultModel=${defaultProvider.defaultModel}`);
  console.log(`maxConcurrent=${maxConcurrent}`);
  Object.entries(startup).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
});
