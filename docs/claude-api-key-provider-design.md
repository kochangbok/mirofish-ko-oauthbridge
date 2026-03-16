# Claude API Key Provider Design

## Status
Design only. This document describes a **planned direct Anthropic API provider** for the bridge. It does **not** imply current implementation.

## Goal
Add a `claude-api` provider that uses an **Anthropic API key** instead of `claude.ai` OAuth or a local Claude desktop/browser session.

This gives the public bridge a supported Claude path without relying on third-party `claude.ai` login flows.

## Why a separate provider name
Keep the current `claude` provider blocked for `claude.ai` OAuth policy reasons, and introduce a new provider with an explicit auth model:

- `claude` -> blocked `claude.ai` OAuth/login path
- `claude-api` -> direct Anthropic API key path

That keeps operator intent clear and avoids silently changing the meaning of an existing provider name.

## Proposed bridge identity
- provider name: `claude-api`
- transport: direct HTTPS calls to the Anthropic Messages API
- auth: `x-api-key` header
- default behavior: non-streaming, text-only first pass

## Proposed configuration
```bash
BRIDGE_PROVIDER=claude-api
ANTHROPIC_API_KEY=<set locally only>
ANTHROPIC_MODEL=<supported-model-id>
# optional
ANTHROPIC_BASE_URL=https://api.anthropic.com
```

### Design notes
- Keep the Anthropic API version header pinned in code rather than forcing users to manage it in `.env`.
- Do not commit keys, sample keys, or masked-real keys into the repo.
- Let operators choose the model explicitly because model IDs and availability can change over time.

## Request mapping
Anthropic's Messages API is already message-based, so this provider should avoid the current lossy CLI prompt flattening path where possible.

### Input mapping
OpenAI-compatible request:
- `messages`
- `model`
- optional `max_tokens`
- optional `response_format`

Anthropic request:
- extract leading/system instructions into Anthropic `system`
- map user/assistant turns into Anthropic `messages`
- map `max_tokens` to Anthropic output token settings
- start with prompt-level JSON enforcement for `response_format.type == json_object`

### Output mapping
Normalize the Anthropic response into the existing OpenAI-style bridge envelope:
- first text block -> `choices[0].message.content`
- provider stop reason -> OpenAI-style `finish_reason`
- usage fields -> bridge `usage` when Anthropic returns them

## Suggested interface impact
This provider is a good reason to expand the provider contract beyond a single flattened `prompt` string.

Recommended direction:
- CLI providers (`codex`, `gemini`) may keep using `prompt`
- direct API providers (`claude-api`, `bedrock`, `vertex`) should receive raw `messages`

See `docs/provider-interface.md` for the suggested interface revision.

## Health and startup reporting
### `getHealth()` should report
- `apiKeyPresent: true|false`
- configured endpoint/base URL
- selected default model
- `unsupported: false`
- no raw secret values

### `getStartupSummary()` should report
- provider name
- endpoint
- default model
- auth hint such as `ANTHROPIC_API_KEY detected` or `ANTHROPIC_API_KEY missing`

## Security posture
- never log `ANTHROPIC_API_KEY`
- never echo auth headers in error output
- never write provider secrets into temp files
- keep health checks non-billable by default
- prefer environment variables over repo-stored config

## Error handling
Map common Anthropic failures to bridge-friendly errors:
- missing key -> configuration error
- 401/403 -> auth error
- 429 -> rate limit / quota error
- 5xx -> upstream provider error
- unsupported content block types -> clear "not yet supported" error

## Non-goals for the first pass
- streaming
- tool use / function calling
- image or file blocks
- prompt caching features
- message batches

## Likely repo touchpoints
- `codex-bridge/providers/` for a new provider module
- `codex-bridge/providers/index.js` for registration
- `codex-bridge/server.js` for passing structured request data
- `codex-bridge/lib/prompt.js` or a new adapter module for direct-API request shaping

## References
- Anthropic Messages API: https://docs.anthropic.com/en/api/messages
- Anthropic platform docs: https://docs.anthropic.com/
