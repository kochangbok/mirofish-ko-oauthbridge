const fsSync = require('fs');
const os = require('os');
const path = require('path');
const { runCommand } = require('../lib/exec');
const { parseJsonPayload } = require('../lib/prompt');

function readGeminiLocalState() {
  const geminiDir = path.join(os.homedir(), '.gemini');
  const settingsPath = path.join(geminiDir, 'settings.json');
  const oauthPath = path.join(geminiDir, 'oauth_creds.json');

  const localState = {
    geminiConfigDirectoryPresent: fsSync.existsSync(geminiDir),
    settingsPathPresent: fsSync.existsSync(settingsPath),
    oauthCredentialsPresent: fsSync.existsSync(oauthPath),
    settingsAuthType: null,
    settingsSchema: 'unknown',
    oauthCredentialsExpired: null,
    oauthCredentialsExpiry: null,
  };

  try {
    if (localState.settingsPathPresent) {
      const settings = JSON.parse(fsSync.readFileSync(settingsPath, 'utf8'));
      const currentSelectedType = settings?.security?.auth?.selectedType ?? null;
      const legacySelectedType = settings?.selectedAuthType ?? null;

      localState.settingsAuthType = currentSelectedType || legacySelectedType;
      localState.settingsSchema = currentSelectedType
        ? 'current'
        : legacySelectedType
          ? 'legacy'
          : 'unknown';
    }
  } catch {
    localState.settingsSchema = 'unreadable';
  }

  try {
    if (localState.oauthCredentialsPresent) {
      const oauth = JSON.parse(fsSync.readFileSync(oauthPath, 'utf8'));
      const expiryMs = Number(oauth?.expiry_date);

      if (Number.isFinite(expiryMs)) {
        localState.oauthCredentialsExpiry = new Date(expiryMs).toISOString();
        localState.oauthCredentialsExpired = expiryMs <= Date.now();
      }
    }
  } catch {
    localState.oauthCredentialsExpiry = 'unreadable';
  }

  return localState;
}

function createGeminiProvider(env = process.env) {
  const bin = env.GEMINI_BIN || 'gemini';
  const defaultModel = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const workdir = env.CODEX_BRIDGE_WORKDIR || process.cwd();

  return {
    name: 'gemini',
    providerLabel: 'a local Gemini CLI session authenticated with Google',
    defaultModel,
    workdir,
    experimental: true,
    resolveModel(requestedModel) {
      return typeof requestedModel === 'string' && requestedModel.trim() ? requestedModel.trim() : defaultModel;
    },
    async runCompletion({ prompt, model }) {
      const args = ['-p', prompt, '--output-format', 'json'];

      if (model) {
        args.push('-m', model);
      }

      const { stdout } = await runCommand(bin, args, { cwd: workdir });
      return parseJsonPayload(stdout);
    },
    async getHealth() {
      let cliAvailable = false;
      let authMode = 'unknown';
      const localState = readGeminiLocalState();

      try {
        await runCommand(bin, ['--help']);
        cliAvailable = true;
      } catch {
        cliAvailable = false;
      }

      if (env.GEMINI_API_KEY) {
        authMode = 'gemini_api_key';
      } else if (env.GOOGLE_CLOUD_PROJECT || env.GOOGLE_GENAI_USE_VERTEXAI) {
        authMode = 'vertex_ai';
      } else {
        authMode = 'google_login_cached_locally_or_not_configured';
      }

      return {
        cliAvailable,
        experimental: true,
        authMode,
        workdir,
        ...localState,
        note: 'Gemini CLI supports Google sign-in on local machines and JSON headless mode. This bridge only reports safe local auth metadata and never returns credential contents.',
      };
    },
    getStartupSummary() {
      const localState = readGeminiLocalState();
      return {
        bin,
        defaultModel,
        workdir,
        authHint: env.GEMINI_API_KEY
          ? 'GEMINI_API_KEY detected'
          : 'expect local Gemini CLI Google sign-in or Vertex configuration',
        settingsAuthType: localState.settingsAuthType || 'unknown',
        settingsSchema: localState.settingsSchema,
        oauthCredentialsPresent: String(localState.oauthCredentialsPresent),
      };
    },
  };
}

module.exports = {
  createGeminiProvider,
};
