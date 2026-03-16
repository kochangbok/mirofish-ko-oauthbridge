# Clone-to-Run Validation Checklist (English)

Use this checklist to verify that a fresh clone of this repository can be prepared and launched successfully.

## 1. Environment
- [ ] `node --version` shows Node.js 18+
- [ ] `python --version` shows Python 3.11 or 3.12
- [ ] `uv --version` works
- [ ] `codex --help` works
- [ ] `codex login` has already completed on this machine

## 2. Fresh clone
- [ ] `git clone https://github.com/kochangbok/mirofish-ko-oauthbridge.git`
- [ ] `cd mirofish-ko-oauthbridge`
- [ ] `cp .env.example .env`
- [ ] set a real `ZEP_API_KEY` in `.env`

## 3. Install
- [ ] `npm install`
- [ ] `./scripts/setup-public.sh`
- [ ] no install step exits with an error

## 4. Run
- [ ] `./scripts/run-all.sh`
- [ ] frontend responds at `http://localhost:3000`
- [ ] backend responds at `http://localhost:5001`
- [ ] bridge health responds at `http://127.0.0.1:8787/health`

## 5. App smoke test
- [ ] open the home screen
- [ ] confirm Korean / English switch is visible and changes text
- [ ] upload one example file from `examples/scenarios/en/` or `examples/scenarios/ko/`
- [ ] paste a matching example prompt from `examples/prompts/`
- [ ] start a small first run
- [ ] verify Step4 report appears
- [ ] verify Step5 interaction UI opens

## 6. Public-safety check before sharing your fork
- [ ] `.env` is not committed
- [ ] no API key appears in `git diff`
- [ ] no login session files are added
- [ ] no runtime logs or uploaded private documents are tracked
