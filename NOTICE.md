# Notice

This repository is a **single-repo public distribution** of a locally modified MiroFish setup.

## Upstream project
- Project: **MiroFish**
- Upstream repository: https://github.com/666ghj/MiroFish
- Original author: **666ghj**
- Upstream license: **AGPL-3.0**

## Distribution status
This repository is an **unofficial modified distribution** prepared by **kochangbok** on **2026-03-15** for local experimentation and easier onboarding.
It is **not** the official MiroFish repository and is **not affiliated with, endorsed by, or sponsored by** the original author.

## Copyright and license notes
- Original MiroFish code remains subject to the **AGPL-3.0** license.
- Existing upstream copyright, license, and attribution notices should be preserved.
- Modifications and added files in this distribution are also released under **AGPL-3.0** unless a file states otherwise.
- This notice is provided for attribution and clarification; it does **not** replace the full license text in `LICENSE`.

## Trademark / naming note
Names such as **MiroFish**, **Claude**, **Gemini**, **OpenAI**, and other product or company names may be trademarks of their respective owners. This repository does not grant any trademark rights.

## Main modifications in this distribution
- bundled the MiroFish frontend/backend and the local `codex-bridge` in one repository
- added Korean / English UI and documentation improvements
- added example scenarios, prompts, release documents, and helper scripts
- removed private local artifacts before public release

It includes:
- AGPL-licensed MiroFish application code
- a local `codex-bridge` used to route requests through `codex exec`
- Korean / English documentation
- scenario and prompt example files

## Removed before release
- `.env` files
- local auth tokens / cached credentials
- `node_modules/`
- `.git/` history from source repositories
- uploaded local project data under `backend/uploads/`
- runtime logs and private workspace artifacts

## Security note
The included `codex-bridge` is meant for **local experimentation only**. Do not deploy it to a public environment with personal Codex / ChatGPT credentials.
Claude OAuth is intentionally not exposed as a public bridge option in this repository because Anthropic documentation limits third-party products from offering claude.ai login or rate limits without prior approval.

## Warranty note
Except to the extent required by applicable law or the AGPL-3.0 license, this repository is provided **as is**, without warranties or conditions of any kind.
