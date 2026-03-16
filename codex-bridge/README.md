# codex-bridge

A minimal OpenAI-compatible `chat.completions` bridge with **pluggable local providers**.

## Supported providers
- `codex` — default and recommended
- `gemini` — experimental local provider
- `claude` — intentionally disabled in this public build

## Run inside this all-in-one repo
```bash
cd codex-bridge
npm install
PORT=8787 \
BRIDGE_PROVIDER=codex \
CODEX_MODEL=gpt-5.1-codex-mini \
CODEX_BRIDGE_WORKDIR=/absolute/path/to/this/repository \
npm start
```

### Experimental Gemini path
```bash
cd codex-bridge
npm install
PORT=8787 \
BRIDGE_PROVIDER=gemini \
GEMINI_MODEL=gemini-2.5-flash \
CODEX_BRIDGE_WORKDIR=/absolute/path/to/this/repository \
npm start
```

## Why it exists
MiroFish expects an OpenAI-compatible API. This bridge lets MiroFish talk to a **local OAuth-capable CLI session** instead.

## Endpoints
- `GET /` — local provider playground UI
- `GET /providers` — health summary for all providers
- `GET /health` — health for the default or requested provider
- `POST /v1/chat/completions`

Provider selection can be driven by `BRIDGE_PROVIDER`, a per-request JSON field named `provider`, or a provider-qualified model such as `gemini:gemini-2.5-flash`.

## Design docs
- `../docs/provider-interface.md`
- `../docs/gemini-oauth-bridge-design.md`
- `../docs/gemini-auth-retest-2026-03-15.md`
- `../docs/provider-matrix.md`
- `../docs/claude-api-key-provider-design.md`
- `../docs/aws-bedrock-provider-design.md`
- `../docs/google-vertex-provider-design.md`

## Playground screenshot

![Bridge playground UI](../docs/assets/bridge-playground.png)

## Limitations
- no streaming
- prototype concurrency
- local use only
- Claude OAuth is intentionally disabled in the public build because Anthropic docs restrict third-party products from offering `claude.ai` login/rate limits without prior approval
