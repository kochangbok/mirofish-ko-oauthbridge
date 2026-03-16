# Google Vertex Provider Design

## Status
Design only. This document describes a **planned Google Vertex AI provider** for the bridge. It does **not** imply current implementation.

## Goal
Add a `vertex` provider that sends bridge requests to **Vertex AI** using Google Cloud authentication rather than local OAuth-style CLI state.

This path is useful for teams that want project-scoped access control, service accounts, workload identity, or centralized billing through Google Cloud.

## Proposed bridge identity
- provider name: `vertex`
- transport: direct Vertex AI API calls, preferably through the Google Gen AI SDK configured for Vertex AI
- auth: Google Cloud authentication (ADC / service account / workload identity)
- default behavior: non-streaming, text-only first pass

## Proposed configuration
```bash
BRIDGE_PROVIDER=vertex
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=<gcp-project-id>
GOOGLE_CLOUD_LOCATION=<vertex-location>
VERTEX_MODEL=<vertex-model-id>

# optional local-development auth path
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
```

### Design notes
- Keep Vertex separate from the existing `gemini` CLI path even though both may ultimately reach Google-hosted models.
- Prefer ADC/service-account auth for the first implementation so the provider boundary stays clear:
  - `gemini` -> local CLI / Gemini-side auth story
  - `vertex` -> Google Cloud project auth story
- Let operators supply the exact model ID because model names and regional availability change.

## SDK direction
The current repo already hints at Vertex mode through `GOOGLE_GENAI_USE_VERTEXAI`, so the cleanest first design is:
- use the Google Gen AI SDK in Vertex mode
- pass project + location explicitly
- keep raw REST as a fallback option, not the first implementation target

## Request mapping
OpenAI-compatible request:
- `messages`
- `model`
- optional `max_tokens`
- optional `response_format`

Vertex request:
- convert leading system messages into `systemInstruction`
- map chat turns into Vertex `contents`
- use request model override when present, otherwise `VERTEX_MODEL`
- map `max_tokens` to provider generation config where available
- start JSON mode with prompt-level enforcement; consider provider-native schema features later

## Output mapping
Normalize Vertex results into the current bridge envelope:
- first accepted text candidate -> `choices[0].message.content`
- candidate finish reason -> OpenAI-style `finish_reason`
- usage / token metadata -> bridge `usage` when available
- safety-block outcomes -> explicit bridge error or empty-content guardrail, not silent success

## Health and startup reporting
### `getHealth()` should report
- project configured or missing
- location configured or missing
- model configured or missing
- whether Vertex mode is enabled
- whether Google auth appears resolvable
- no credential contents

### `getStartupSummary()` should report
- provider name
- project
- location
- default model
- auth hint such as `ADC/service account expected` or `GOOGLE_APPLICATION_CREDENTIALS detected`

## Security posture
- never write service-account JSON into the repo
- never log bearer tokens
- prefer ADC, workload identity, or short-lived credentials in managed environments
- keep billable generation calls out of default health checks

## Operational caveats
- model availability differs by region
- project permissions and enabled APIs matter
- safety filters may return blocked or truncated outputs
- response structures can differ across SDK versions and model families

## Error handling
Map common failures cleanly:
- missing project/location/model -> configuration error
- missing ADC/service-account auth -> auth/configuration error
- permission denied -> authorization error
- quota exhausted / rate limits -> retryable provider error
- safety block / filtered response -> explicit provider policy error

## Non-goals for the first pass
- streaming
- multimodal input
- tool use / function calling
- provider-native schema enforcement
- automatic region fallback

## Likely repo touchpoints
- `codex-bridge/providers/` for a new provider module
- `codex-bridge/providers/index.js` for registration
- `codex-bridge/server.js` for structured request passing
- `docs/provider-interface.md` for the direct-API provider contract update

## References
- Gemini / Vertex AI auth and examples: https://googleapis.github.io/js-genai/release_docs/index.html
- Google Cloud auth setup guidance: https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal
