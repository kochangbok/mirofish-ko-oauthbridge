const fs = require('fs/promises');
const fsSync = require('fs');
const os = require('os');
const path = require('path');
const { runCommand } = require('../lib/exec');

function createCodexProvider(env = process.env) {
  const bin = env.CODEX_BIN || 'codex';
  const defaultModel = env.CODEX_MODEL || 'gpt-5.1-codex-mini';
  const workdir = env.CODEX_BRIDGE_WORKDIR || process.cwd();
  const execTimeoutMs = Number(env.CODEX_EXEC_TIMEOUT_MS || 120000);

  return {
    name: 'codex',
    providerLabel: 'a local Codex OAuth session',
    defaultModel,
    workdir,
    resolveModel(requestedModel) {
      return typeof requestedModel === 'string' && requestedModel.trim() ? requestedModel.trim() : defaultModel;
    },
    async runCompletion({ prompt, model }) {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-bridge-'));
      const outputFile = path.join(tmpDir, 'last-message.txt');

      const args = [
        'exec',
        '--skip-git-repo-check',
        '--ephemeral',
        '-C',
        workdir,
        '-m',
        model,
        '-o',
        outputFile,
        prompt,
      ];

      try {
        const { stdout = '' } = await runCommand(bin, args, {
          timeoutMs: Number.isFinite(execTimeoutMs) && execTimeoutMs > 0 ? execTimeoutMs : undefined,
        });

        if (fsSync.existsSync(outputFile)) {
          const content = await fs.readFile(outputFile, 'utf8');
          return content.trim();
        }

        if (stdout.trim()) {
          return stdout.trim();
        }

        throw new Error('Codex CLI completed without writing a response payload.');
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    },
    async getHealth() {
      let cliAvailable = false;
      let loginStatus = 'unknown';

      try {
        await runCommand(bin, ['--version']);
        cliAvailable = true;
      } catch {
        cliAvailable = false;
      }

      try {
        const { stdout } = await runCommand(bin, ['login', 'status']);
        loginStatus = stdout.trim() || 'unknown';
      } catch {
        loginStatus = 'not logged in';
      }

      const credentialsPath = path.join(os.homedir(), '.codex');

      return {
        cliAvailable,
        loginStatus,
        credentialsDirectoryPresent: fsSync.existsSync(credentialsPath),
        workdir,
        execTimeoutMs,
      };
    },
    getStartupSummary() {
      const credentialsPath = path.join(os.homedir(), '.codex');
      return {
        bin,
        defaultModel,
        workdir,
        execTimeoutMs,
        authHint: fsSync.existsSync(credentialsPath) ? 'credentials directory present' : 'credentials directory missing',
      };
    },
  };
}

module.exports = {
  createCodexProvider,
};
