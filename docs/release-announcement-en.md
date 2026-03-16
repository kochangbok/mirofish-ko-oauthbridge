# Release Announcement (English)

## Title
MiroFish KO OAuth Bridge: run MiroFish locally with Codex OAuth, bilingual UI, and starter scenarios

## Short version
This release packages the MiroFish app, a local Codex OAuth bridge, Korean/English documentation, Korean/English UI updates, and upload-ready scenario files into one public repository.

## Highlights
- **One repo only**: users no longer need to clone upstream MiroFish and a separate bridge project.
- **Local Codex OAuth bridge**: run MiroFish through a local OpenAI-compatible bridge backed by `codex login`.
- **Bilingual docs and UI**: Korean and English guides, examples, and translated interface support.
- **Starter scenarios**: realistic sample scenario files and prompts for first-run experiments.
- **Public-safe structure**: secrets, tokens, runtime logs, and private local artifacts are excluded.

## Good fit for
- people who want to test MiroFish without wiring a separate API stack first
- users comparing Korean and English prompt flows
- researchers who want scenario seed files for sentiment / narrative simulation

## Notes
- You still need your own `ZEP_API_KEY`.
- This bridge is for **local use**, not for public serverless hosting.
- `codex login` must already be working on your machine.
