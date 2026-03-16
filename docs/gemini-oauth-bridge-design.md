# Gemini OAuth Bridge Design

## Objective
Add an **experimental local Gemini-backed provider** to the existing OpenAI-compatible bridge so MiroFish can run through a locally authenticated Gemini CLI session.

## Why Gemini is a good candidate
Based on the official Gemini CLI docs:
- Gemini CLI supports **Sign in with Google** on a local machine.
- Google-authenticated credentials are **cached locally for future sessions**.
- Gemini CLI supports **headless mode** with `-p/--prompt`.
- Headless mode supports `--output-format json`, which is ideal for a bridge.

## Command shape
The bridge uses this general pattern:

```bash
gemini -p "<prompt>" --output-format json -m <model>
```

The JSON output is normalized into the same OpenAI-style response envelope already used by MiroFish.

## Environment variables
```bash
BRIDGE_PROVIDER=gemini
GEMINI_BIN=gemini
GEMINI_MODEL=gemini-2.5-flash
CODEX_BRIDGE_WORKDIR=/absolute/path/to/repo
```

## Authentication assumptions
This public repository treats Gemini in this order:
1. local Google sign-in through Gemini CLI
2. `GEMINI_API_KEY`
3. Vertex AI / Google Cloud env-based auth

The bridge does **not** attempt to expose or export cached Google credentials. It only invokes the local CLI already configured on the user's machine.

## Limitations
- experimental path in this repository
- exact cached-login state is not introspected
- still one request at a time
- model names may change over time; pass the desired model explicitly when needed

## Suggested future work
- add optional JSON schema validation/retry for Gemini responses
- expose provider capability metadata in `/health`
- add provider-specific smoke tests guarded by CLI availability


## Maintainer retest result on 2026-03-15
The Gemini path was re-tested end-to-end on the maintainer machine for this repository:

1. the local `~/.gemini/settings.json` was migrated from a legacy top-level `selectedAuthType` shape to the current `security.auth.selectedType` shape expected by the installed CLI
2. a direct headless Gemini CLI completion succeeded and returned `GEMINI_BRIDGE_SMOKE_OK`
3. the public bridge was then started with `BRIDGE_PROVIDER=gemini`
4. an OpenAI-compatible `POST /v1/chat/completions` call succeeded and returned `GEMINI_PUBLIC_BRIDGE_OK`

This confirms that:
- the Gemini bridge wiring works in practice
- the local Google-sign-in/cached-auth state is still a prerequisite
- older local Gemini settings may need a one-time schema migration or re-login

See `docs/gemini-auth-retest-2026-03-15.md` for the exact retest notes.
