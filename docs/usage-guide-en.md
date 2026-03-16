# Usage Guide (English)

This repository already contains both the MiroFish app and the local Codex OAuth bridge.

## 1. Requirements
- Node.js 18+
- Python 3.11 or 3.12
- `uv`
- `codex` CLI for the default path, or Gemini CLI for the experimental Gemini path
- successful local provider login (`codex login` by default)
- `ZEP_API_KEY`

## 2. Configure
```bash
cp .env.example .env
```

Example:
```env
LLM_API_KEY=local-oauth-bridge
LLM_BASE_URL=http://127.0.0.1:8787/v1
LLM_MODEL_NAME=gpt-5.1-codex-mini
ZEP_API_KEY=YOUR_ZEP_API_KEY_HERE
```

## 3. Install
```bash
npm install
npm run setup:public
```

Or:
```bash
./scripts/setup-public.sh
```

## 4. Run
```bash
PORT=8787 \
BRIDGE_PROVIDER=codex \
CODEX_MODEL=gpt-5.1-codex-mini \
CODEX_BRIDGE_WORKDIR=$(pwd) \
npm run dev:all
```

Or:
```bash
./scripts/run-all.sh
```

Experimental Gemini path:
```bash
PORT=8787 \
BRIDGE_PROVIDER=gemini \
GEMINI_MODEL=gemini-2.5-flash \
CODEX_BRIDGE_WORKDIR=$(pwd) \
npm run dev:all
```

## 5. Open
- frontend: `http://localhost:3000`
- backend: `http://localhost:5001`
- bridge root playground: `http://127.0.0.1:8787/`
- bridge health: `http://127.0.0.1:8787/health`

## 6. First test
1. choose one scenario file from `examples/scenarios/en/`
2. upload that file only
3. paste a matching prompt from `examples/prompts/en/`
4. run a short simulation first
5. inspect Step4 report and Step5 follow-up interaction

## 7. Notes
- the bridge is for local experimentation
- Codex is the default path; Gemini is experimental
- you still need a real Zep key
- keep the first run small

## 8. Provider selection shortcuts
- set `BRIDGE_PROVIDER=codex` or `BRIDGE_PROVIDER=gemini` before launch
- or set `LLM_MODEL_NAME` to a provider-qualified value such as `gemini:gemini-2.5-flash`
- visit the bridge root page (`/`) to inspect provider health and run a quick prompt
