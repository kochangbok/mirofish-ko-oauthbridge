# Provider Interface Design

This repository now treats the local OAuth bridge as a **provider-based adapter layer**.

## Goal
Keep the MiroFish-facing API stable (`/v1/chat/completions`) while allowing different local CLI-backed providers behind the bridge.

## Contract
Each provider exposes the following shape:

```js
{
  name: string,
  providerLabel: string,
  defaultModel: string,
  resolveModel(requestedModel): string,
  runCompletion({ prompt, model }): Promise<string>,
  getHealth(): Promise<object>,
  getStartupSummary(): object,
}
```

## Current providers
- `codex` — fully implemented, recommended default
- `gemini` — experimental local provider using Gemini CLI headless JSON mode
- `claude` — intentionally blocked in this public build

## Selection
You can select a provider in three ways:

### A. Default process-level provider
Use the `BRIDGE_PROVIDER` environment variable:

```bash
BRIDGE_PROVIDER=codex
BRIDGE_PROVIDER=gemini
BRIDGE_PROVIDER=claude
```

### B. Per-request provider override
Send a JSON field named `provider` to `/v1/chat/completions`:

```json
{
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "messages": [{ "role": "user", "content": "Hello" }]
}
```

### C. Provider-qualified model name
Prefix the model name with the provider:

```text
codex:gpt-5.1-codex-mini
gemini:gemini-2.5-flash
```

This is especially useful when the calling app can control the model field but not add custom bridge fields.

## Why this shape
- keeps the HTTP surface compatible with MiroFish
- isolates provider-specific CLI flags and auth assumptions
- makes future providers easier to add without touching app-facing routes
- allows policy-based rejection for providers that should not be exposed publicly

## Notes on unsupported providers
A provider can exist in the registry but still return a deliberate error. This is used for `claude` in the public repository because the public packaging should respect provider policy constraints.

## Playground UI
The bridge root (`/`) now serves a small local UI that shows provider health and lets you send a quick test prompt through the OpenAI-compatible endpoint.


## Interface pressure from direct API providers
Current providers are optimized for CLI-backed execution and a single flattened `prompt` string. That is acceptable for `codex` and the current `gemini` path, but it is a weak fit for direct API providers such as Anthropic, Bedrock, and Vertex AI.

### Suggested v2 provider contract
```js
{
  name: string,
  providerLabel: string,
  defaultModel: string,
  mode: "cli" | "api",
  resolveModel(requestedModel): string,
  runCompletion({
    prompt,        // CLI providers
    messages,      // direct API providers
    model,
    responseFormat,
    maxTokens,
  }): Promise<{
    content: string,
    finishReason?: string,
    usage?: object,
  }>,
  getHealth(): Promise<object>,
  getStartupSummary(): object,
}
```

### Why this matters
- preserves system / user / assistant roles without flattening
- makes JSON-mode handling less provider-specific
- keeps CLI providers working without forcing a big-bang rewrite
- gives planned direct providers a clear extension point

## Planned non-OAuth providers
These providers are **design targets**, not current implementation claims:

- `claude-api` — direct Anthropic API key provider ([design](claude-api-key-provider-design.md))
- `bedrock` — AWS Bedrock provider ([design](aws-bedrock-provider-design.md))
- `vertex` — Google Vertex AI provider ([design](google-vertex-provider-design.md))
- comparison table: [Provider Matrix](provider-matrix.md)
