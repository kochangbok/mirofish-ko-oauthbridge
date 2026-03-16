# AWS Bedrock Provider Design

## Status
Design only. This document describes a **planned AWS Bedrock provider** for the bridge. It does **not** imply current implementation.

## Goal
Add a `bedrock` provider that can send bridge requests through **Amazon Bedrock** using standard AWS authentication instead of local OAuth-style CLI sessions.

This is the enterprise-friendly path for teams that already manage model access through AWS accounts, IAM roles, SSO, or short-lived credentials.

## Proposed bridge identity
- provider name: `bedrock`
- transport: AWS SDK for JavaScript v3 against Bedrock Runtime
- auth: AWS credential provider chain + SigV4 signing
- preferred API shape: **Converse** for chat-style requests

## Proposed configuration
```bash
BRIDGE_PROVIDER=bedrock
AWS_REGION=<aws-region>
BEDROCK_MODEL_ID=<account-enabled-model-id-or-inference-profile>

# optional standard AWS auth inputs
AWS_PROFILE=<profile-name>
AWS_ACCESS_KEY_ID=<set locally only>
AWS_SECRET_ACCESS_KEY=<set locally only>
AWS_SESSION_TOKEN=<temporary-session-token>
```

### Design notes
- Prefer the normal AWS credential chain rather than inventing a bridge-specific secret format.
- Treat `BEDROCK_MODEL_ID` as operator-supplied because access differs by account and region.
- Accept `AWS_DEFAULT_REGION` as a fallback if `AWS_REGION` is unset.

## Why Converse first
Bedrock's Converse API fits this bridge better than raw provider-specific payloads because it is message-oriented and reduces per-model request-shape branching.

### First-pass approach
1. use Converse for chat-capable models
2. keep streaming out of scope
3. defer `InvokeModel` fallback until a real unsupported-model need appears

## Request mapping
OpenAI-compatible request:
- `messages`
- `model`
- optional `max_tokens`
- optional `response_format`

Bedrock request:
- OpenAI `messages` -> Bedrock `messages`
- leading system instructions -> Bedrock `system`
- `model` -> resolved `BEDROCK_MODEL_ID` or request override
- `max_tokens` -> Bedrock inference config where supported
- JSON mode -> prompt-level enforcement first, provider-native structured output later

## Output mapping
Normalize Bedrock results back into the existing bridge envelope:
- assistant text content -> `choices[0].message.content`
- provider stop reason -> OpenAI-style `finish_reason`
- token usage -> bridge `usage` when returned
- preserve provider metadata only in a small bridge debug section if needed

## Health and startup reporting
### `getHealth()` should report
- region present/missing
- model ID present/missing
- whether AWS credentials appear resolvable
- credential source if the SDK exposes it safely
- no raw access keys or session tokens

### `getStartupSummary()` should report
- provider name
- region
- configured model ID
- auth hint such as `AWS profile configured`, `environment credentials detected`, or `AWS credentials not resolved`

## Security posture
- do not persist AWS credentials in repo files
- do not log SigV4 headers
- prefer IAM roles, SSO, or short-lived session credentials over long-lived keys
- keep health checks non-billable by default

## Operational caveats
- model access is account- and region-dependent
- some models may require an inference profile or explicit access enablement
- regional availability differs
- Bedrock response shapes vary slightly by model family even with Converse

## Error handling
Map common failures cleanly:
- missing region/model -> configuration error
- missing credentials -> auth/configuration error
- access denied -> authorization error
- throttling -> rate limit / retryable error
- model not enabled in region -> clear operator action error

## Non-goals for the first pass
- streaming
- cross-region routing logic
- tool use / function calling
- multimodal payloads
- per-model custom payload adapters

## Likely repo touchpoints
- `codex-bridge/providers/` for a new provider module
- `codex-bridge/providers/index.js` for registration
- `codex-bridge/server.js` for structured request passing
- `docs/provider-interface.md` for the direct-API provider contract update

## References
- Amazon Bedrock Converse API docs: https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference-call.html
- AWS SDK/auth environment variables: https://docs.aws.amazon.com/sdkref/latest/guide/environment-variables.html
