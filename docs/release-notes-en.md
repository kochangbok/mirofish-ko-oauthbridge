# Release Notes (English)

## Release summary
This release turns the public all-in-one repo into a more complete starter kit:
- the local bridge now has a **re-tested Gemini path**
- the README now surfaces **bridge screenshots, provider docs, and release links**
- the examples section now includes **three richer multi-file scenario packs**

## Highlights

### 1. Gemini path re-tested successfully
- fixed a local Gemini config-schema mismatch on the maintainer machine
- confirmed direct headless Gemini CLI success: `GEMINI_BRIDGE_SMOKE_OK`
- confirmed bridge completion success: `GEMINI_PUBLIC_BRIDGE_OK`
- added `docs/gemini-auth-retest-2026-03-15.md`

### 2. Bridge UX/docs improvements
- added a bridge playground screenshot to:
  - `README.md`
  - `README.ko.md`
  - `codex-bridge/README.md`
  - `codex-bridge/README.ko.md`
- added clearer release/distribution badges in the root README files

### 3. Non-OAuth provider design docs
- `docs/provider-matrix.md`
- `docs/claude-api-key-provider-design.md`
- `docs/aws-bedrock-provider-design.md`
- `docs/google-vertex-provider-design.md`

### 4. Richer example materials
Quick-start examples were expanded, and detailed packs were added for:
- Strait of Hormuz / Korean market
- Kakao Open Chat policy backlash
- Tesla Korea recall / brand trust shock

Detailed packs now exist in both Korean and English under:
- `examples/packs/ko/`
- `examples/packs/en/`

## Validation note
The following checks were run in the maintainer environment:
- frontend build: **success**
- `codex-bridge` Node syntax checks: **success**
- Gemini bridge health endpoint: **success**
- Gemini bridge completion test: **success**

## Recommended next step for users
1. clone the repo
2. fill `.env`
3. start with a quick scenario under `examples/scenarios/`
4. move to `examples/packs/` when you want a richer world state
