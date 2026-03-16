# Gemini auth retest notes (2026-03-15)

## Goal
Verify that the experimental Gemini provider works in practice on the maintainer machine, not just in theory.

## What was blocking the first attempt
The installed Gemini CLI expected the selected auth type in:

```json
{
  "security": {
    "auth": {
      "selectedType": "oauth-personal"
    }
  }
}
```

But the local machine still had a legacy config shape that only stored:

```json
{
  "selectedAuthType": "oauth-personal"
}
```

That meant headless calls failed before the CLI even reached the cached-login flow.

## Fix applied on the maintainer machine
The local `~/.gemini/settings.json` was updated to the current nested shape, preserving the existing hooks section.

## Direct CLI retest
Command:

```bash
gemini -p "Return the exact string GEMINI_BRIDGE_SMOKE_OK and nothing else." --output-format json
```

Observed result:
- the CLI asked to continue to the auth page once
- after continuing, it reported `Loaded cached credentials.`
- the JSON response contained `GEMINI_BRIDGE_SMOKE_OK`

## Public bridge retest
Bridge startup:

```bash
cd codex-bridge
PORT=8788 \
BRIDGE_PROVIDER=gemini \
GEMINI_MODEL=gemini-2.5-flash \
CODEX_BRIDGE_WORKDIR=/absolute/path/to/this/repository \
npm start
```

OpenAI-compatible test request:

```bash
curl -s -X POST http://127.0.0.1:8788/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gemini:gemini-2.5-flash",
    "messages": [
      { "role": "user", "content": "Return the exact string GEMINI_PUBLIC_BRIDGE_OK and nothing else." }
    ]
  }'
```

Observed result:
- HTTP 200
- assistant content: `GEMINI_PUBLIC_BRIDGE_OK`

## Practical takeaway
- the experimental Gemini path is **real and working**
- the local machine still needs a valid Gemini login/cached-auth state
- if Gemini headless mode fails before login, inspect `~/.gemini/settings.json` for an outdated auth config shape

## Safety note
These notes intentionally omit all secret values and token contents. Only configuration shape and successful test strings are recorded.
