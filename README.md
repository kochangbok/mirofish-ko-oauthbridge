# MiroFish KO OAuth Bridge

[![Upstream: 666ghj/MiroFish](https://img.shields.io/badge/Upstream-666ghj%2FMiroFish-181717?logo=github)](https://github.com/666ghj/MiroFish)
[![Latest Release](https://img.shields.io/github/v/release/kochangbok/mirofish-ko-oauthbridge?display_name=tag)](https://github.com/kochangbok/mirofish-ko-oauthbridge/releases)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](./LICENSE)
[![Docs/UI](https://img.shields.io/badge/Docs%2FUI-KO%20%2F%20EN-7c3aed)](./README.ko.md)
[![Bridge](https://img.shields.io/badge/Bridge-Codex%20%7C%20Gemini-0f766e)](./codex-bridge/README.md)

English | [한국어](./README.ko.md)

> **One repo, one clone, one local run.**  
> This package bundles MiroFish, a local Codex OAuth bridge, bilingual docs/UI, and ready-to-upload scenario files.

This repository is a **single-repo public release** of:
- the MiroFish application
- a local `codex-bridge` that lets MiroFish run through **local OAuth-capable CLI providers**
- Korean / English usage guides and UI
- concrete scenario seed files and prompt examples

The goal is simple: **people only need this one repository**.

## Upstream attribution

This project is based on the original [MiroFish](https://github.com/666ghj/MiroFish) repository by **666ghj**.

> **Unofficial distribution notice**  
> This repository is an unofficial, locally modified all-in-one distribution. It is **not** the official MiroFish repository and is **not affiliated with or endorsed by** the original author.

Main additions in this distribution:
- local `codex-bridge` for Codex-first local runs plus an experimental Gemini path
- Korean / English UI and documentation work
- starter scenarios, richer prompt examples, and multi-file scenario packs
- public-release docs, validation notes, and provider design documents

## TL;DR

```bash
cp .env.example .env
npm install
./scripts/setup-public.sh
./scripts/run-all.sh
```

Then open:
- `http://localhost:3000`

What you still need:
- a successful local provider login (`codex login` by default, or a local Gemini CLI sign-in for the Gemini path)
- your own `ZEP_API_KEY`

### Gemini retest note

On **March 15, 2026**, the maintainer re-tested the Gemini path end-to-end after fixing a local Gemini config schema mismatch:
- direct headless Gemini CLI completion returned `GEMINI_BRIDGE_SMOKE_OK`
- the public bridge returned `GEMINI_PUBLIC_BRIDGE_OK`

See [Gemini auth retest notes (2026-03-15)](./docs/gemini-auth-retest-2026-03-15.md).

## Public Vercel dashboard

This repository now includes a separate `dashboard/` Next.js app for a **public report hub** with a password-protected admin submission page at `/simulationadmin`.

- public routes: `/`, `/reports/[reportId]`, `/requests/[requestId]`
- admin route: `/simulationadmin`
- persistence: GitHub-backed `dashboard-data/`
- execution model: Vercel hosts the dashboard; a local worker runs the actual MiroFish simulations

See [docs/public-dashboard-vercel.md](./docs/public-dashboard-vercel.md).

## Release materials

- [Release announcement (English)](./docs/release-announcement-en.md)
- [릴리즈 소개문 (한국어)](./docs/release-announcement-ko.md)
- [Clone-to-run validation checklist (English)](./docs/validation-checklist-en.md)
- [Clone 후 실행 검증 체크리스트 (한국어)](./docs/validation-checklist-ko.md)
- [Upstream PR draft (English)](./docs/upstream-pr-draft-en.md)
- [Upstream issue draft (English)](./docs/upstream-issue-draft-en.md)
- [Gemini OAuth bridge design](./docs/gemini-oauth-bridge-design.md)
- [Gemini auth retest notes (2026-03-15)](./docs/gemini-auth-retest-2026-03-15.md)
- [Provider interface design](./docs/provider-interface.md)
- [Provider matrix](./docs/provider-matrix.md)
- [Claude API key provider design](./docs/claude-api-key-provider-design.md)
- [AWS Bedrock provider design](./docs/aws-bedrock-provider-design.md)
- [Google Vertex provider design](./docs/google-vertex-provider-design.md)
- [Release notes (English)](./docs/release-notes-en.md)
- [릴리즈 노트 (한국어)](./docs/release-notes-ko.md)

## What makes this repo different

Instead of asking users to clone upstream MiroFish and a separate bridge project, this repository already includes:
- `frontend/` and `backend/` for MiroFish
- `codex-bridge/` for local OpenAI-compatible bridging with pluggable providers
- Korean UI work already included in the frontend
- docs and examples for first-time runs

## Screenshots

<table>
  <tr>
    <td width="50%"><img src="./docs/assets/home-ko.png" alt="Korean home screen" /></td>
    <td width="50%"><img src="./docs/assets/home-en.png" alt="English home screen" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Korean home screen</strong></td>
    <td align="center"><strong>English home screen</strong></td>
  </tr>
</table>

### Bridge playground UI

<img src="./docs/assets/bridge-playground.png" alt="Bridge playground UI" width="900" />

## Architecture

![Architecture diagram](./docs/assets/architecture.svg)

## Bridge provider options

- `BRIDGE_PROVIDER=codex` — default, recommended, currently the most proven path
- `BRIDGE_PROVIDER=gemini` — experimental local provider using Gemini CLI headless JSON mode
- `BRIDGE_PROVIDER=claude` — intentionally disabled in this public build
- provider-qualified model names are also supported, such as `codex:gpt-5.1-codex-mini` and `gemini:gemini-2.5-flash`

> **Why Claude is disabled here**  
> Anthropic documentation says that unless previously approved, third-party developers may not offer **claude.ai login or rate limits** for their own products. For that reason this public repository does not expose Claude OAuth as a selectable local bridge provider.

### Planned non-OAuth providers

These are design targets for operators who want API-key or cloud-authenticated paths instead of local OAuth sessions:

- [Provider matrix](./docs/provider-matrix.md)
- [Claude API key provider design](./docs/claude-api-key-provider-design.md)
- [AWS Bedrock provider design](./docs/aws-bedrock-provider-design.md)
- [Google Vertex provider design](./docs/google-vertex-provider-design.md)

## Quick start

### 1. Requirements
- Node.js 18+
- Python 3.11 or 3.12
- `uv`
- `codex` CLI for the default path, or Gemini CLI for the experimental Gemini path
- successful local provider login (`codex login` by default)
- your own `ZEP_API_KEY`

### 2. Prepare `.env`
```bash
cp .env.example .env
```

Then fill:
```env
LLM_API_KEY=local-oauth-bridge
LLM_BASE_URL=http://127.0.0.1:8787/v1
LLM_MODEL_NAME=gpt-5.1-codex-mini
ZEP_API_KEY=YOUR_ZEP_API_KEY_HERE
```

### 3. Install everything
```bash
npm install
npm run setup:public
```

Or:
```bash
./scripts/setup-public.sh
```

### 4. Start everything
```bash
PORT=8787 \
CODEX_MODEL=gpt-5.1-codex-mini \
CODEX_BRIDGE_WORKDIR=$(pwd) \
npm run dev:all
```

Or:
```bash
./scripts/run-all.sh
```

App URLs:
- frontend: `http://localhost:3000`
- backend: `http://localhost:5001`
- bridge root playground: `http://127.0.0.1:8787/`
- bridge health: `http://127.0.0.1:8787/health`

## Included starter scenarios

- **Strait of Hormuz / Korean market reaction**
- **Kakao open chat policy backlash**
- **Tesla Korea recall / brand trust shock**

See:
- `examples/scenarios/en/`
- `examples/scenarios/ko/`
- `examples/prompts/en/`
- `examples/prompts/ko/`
- `examples/packs/en/`
- `examples/packs/ko/`

Detailed packs currently included:
- `examples/packs/en/hormuz-korea-2026-03-15/`
- `examples/packs/en/kakao-openchat-policy-2026-03-15/`
- `examples/packs/en/tesla-korea-recall-2026-03-15/`
- `examples/packs/ko/hormuz-korea-2026-03-15/`
- `examples/packs/ko/kakao-openchat-policy-2026-03-15/`
- `examples/packs/ko/tesla-korea-recall-2026-03-15/`

## Recommended first run

1. start with `examples/scenarios/en/` or `examples/scenarios/ko/` for a quick first run
2. upload one seed file only
3. paste a matching prompt from `examples/prompts/...`
4. keep the first run short (small round count)
5. when you want a richer world state, move to `examples/packs/en/` or `examples/packs/ko/`
6. inspect Step4 report and Step5 follow-up interaction
7. compare the result with `docs/validation-checklist-en.md`

## Repository layout

- `frontend/`, `backend/` — main MiroFish app
- `codex-bridge/` — local OAuth-capable bridge with pluggable providers
- `docs/usage-guide-en.md` — English usage guide
- `docs/usage-guide-ko.md` — Korean usage guide
- `docs/release-announcement-en.md` — English release copy
- `docs/release-announcement-ko.md` — Korean release copy
- `docs/validation-checklist-en.md` — English run validation checklist
- `docs/validation-checklist-ko.md` — Korean run validation checklist
- `docs/assets/` — screenshots and architecture diagram
- `examples/scenarios/` — upload-ready scenario docs
- `examples/prompts/` — prompts by scenario and language
- `examples/packs/` — richer multi-file scenario packs
- `scripts/setup-public.sh` — install helper
- `scripts/run-all.sh` — launch bridge + backend + frontend
- `README-EN.md` — upstream English readme kept for reference
- `README-UPSTREAM-ZH.md` — upstream Chinese readme kept for reference

## Where to read more

- `docs/usage-guide-en.md`
- `docs/usage-guide-ko.md`
- `codex-bridge/README.md`
- `codex-bridge/README.ko.md`

## Important limitations

- this is **not** an official OpenAI API replacement
- the bridge is **local-only** and relies on your local provider login session
- public/serverless deployment with personal auth is **not recommended**
- Claude OAuth is intentionally disabled in the public bridge due to Anthropic provider-policy constraints for third-party products
- you still need a real `ZEP_API_KEY`

## Release flow

- source repo: `main`
- GitHub releases: [releases page](https://github.com/kochangbok/mirofish-ko-oauthbridge/releases)
- release notes source: `docs/release-notes-en.md`, `docs/release-notes-ko.md`

## License

This repository contains AGPL-licensed MiroFish code and derivative work, so it is distributed with the AGPL license text. See `LICENSE` and `NOTICE.md`.
