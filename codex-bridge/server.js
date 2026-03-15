const express = require('express');
const fs = require('fs/promises');
const fsSync = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const app = express();
app.use(express.json({ limit: '4mb' }));

const PORT = Number(process.env.PORT || 8787);
const CODEX_BIN = process.env.CODEX_BIN || 'codex';
const DEFAULT_MODEL = process.env.CODEX_MODEL || 'gpt-5.1-codex-mini';
const CODEX_WORKDIR = process.env.CODEX_BRIDGE_WORKDIR || process.cwd();

let busy = false;

function buildPrompt(messages, opts = {}) {
  const header = [
    'You are acting as a best-effort OpenAI-compatible chat completion bridge for a third-party app.',
    'Return ONLY the final answer for the assistant turn.',
    'Do not mention Codex, CLI internals, or bridge implementation details unless the user explicitly asks.',
  ];

  if (opts.jsonMode) {
    header.push(
      'IMPORTANT: Return a valid JSON object only.',
      'Do not wrap the JSON in markdown fences.',
      'Do not add explanations before or after the JSON.'
    );
  }

  if (typeof opts.maxTokens === 'number' && Number.isFinite(opts.maxTokens)) {
    header.push(`Try to stay within roughly ${opts.maxTokens} output tokens.`);
  }

  const body = messages
    .map((msg, idx) => {
      const role = (msg.role || 'user').toUpperCase();
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content ?? '');
      return `[#${idx + 1} ${role}]\n${content}`;
    })
    .join('\n\n');

  return `${header.join('\n')}\n\nConversation:\n\n${body}\n\nNow produce the assistant response for the last turn.`;
}

function makeResponse({ model, content }) {
  const created = Math.floor(Date.now() / 1000);
  return {
    id: `chatcmpl_${crypto.randomUUID().replace(/-/g, '')}`,
    object: 'chat.completion',
    created,
    model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}

async function runCodex({ prompt, model }) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-bridge-'));
  const outputFile = path.join(tmpDir, 'last-message.txt');

  const args = [
    'exec',
    '--skip-git-repo-check',
    '--ephemeral',
    '-C',
    CODEX_WORKDIR,
    '-m',
    model,
    '-o',
    outputFile,
    prompt,
  ];

  try {
    await execFileAsync(CODEX_BIN, args, {
      maxBuffer: 10 * 1024 * 1024,
      env: process.env,
    });

    const content = await fs.readFile(outputFile, 'utf8');
    return content.trim();
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

app.get('/health', async (_req, res) => {
  let codexAvailable = false;
  let loginStatus = 'unknown';

  try {
    await execFileAsync(CODEX_BIN, ['--version'], { env: process.env });
    codexAvailable = true;
  } catch {
    codexAvailable = false;
  }

  try {
    const { stdout } = await execFileAsync(CODEX_BIN, ['login', 'status'], { env: process.env });
    loginStatus = stdout.trim() || 'unknown';
  } catch {
    loginStatus = 'not logged in';
  }

  res.json({
    ok: true,
    busy,
    codexAvailable,
    loginStatus,
    workdir: CODEX_WORKDIR,
    defaultModel: DEFAULT_MODEL,
  });
});

app.post('/v1/chat/completions', async (req, res) => {
  const { messages, model, stream, response_format, max_tokens } = req.body || {};

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

  if (busy) {
    return res.status(503).json({
      error: {
        message: 'Bridge is busy. This prototype handles one request at a time.',
        type: 'server_error',
      },
    });
  }

  busy = true;

  try {
    const prompt = buildPrompt(messages, {
      jsonMode: response_format && response_format.type === 'json_object',
      maxTokens: max_tokens,
    });

    const resolvedModel = typeof model === 'string' && model.trim() ? model.trim() : DEFAULT_MODEL;
    const content = await runCodex({ prompt, model: resolvedModel });
    res.json(makeResponse({ model: resolvedModel, content }));
  } catch (error) {
    res.status(500).json({
      error: {
        message: error.message || 'Bridge execution failed.',
        type: 'server_error',
      },
    });
  } finally {
    busy = false;
  }
});

app.listen(PORT, () => {
  const loginStatus = fsSync.existsSync(path.join(os.homedir(), '.codex')) ? 'credentials directory present' : 'credentials directory missing';
  console.log(`codex-bridge listening on http://127.0.0.1:${PORT}`);
  console.log(`workdir=${CODEX_WORKDIR}`);
  console.log(`defaultModel=${DEFAULT_MODEL}`);
  console.log(`codexAuth=${loginStatus}`);
});
