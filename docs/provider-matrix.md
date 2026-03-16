# Provider Matrix

This matrix compares the bridge's current providers with the planned **non-OAuth** provider designs.

## Summary table

| Provider | Auth model | Transport | Repo status | Best fit | Key config |
| --- | --- | --- | --- | --- | --- |
| `codex` | local Codex OAuth session | local CLI | implemented | local personal runs | `BRIDGE_PROVIDER=codex`, `CODEX_MODEL` |
| `gemini` | local Gemini login, `GEMINI_API_KEY`, or Vertex-related env on the local CLI side | local CLI | implemented, experimental | local experiments and Google-authenticated CLI usage | `BRIDGE_PROVIDER=gemini`, `GEMINI_MODEL` |
| `claude` | `claude.ai` OAuth/login | local CLI | intentionally blocked | none in this public build | n/a |
| `claude-api` | Anthropic API key | direct Anthropic HTTPS API | design only | operators who want a supported direct Claude path | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` |
| `bedrock` | AWS IAM / SSO / role / env credentials | AWS Bedrock Runtime | design only | AWS-centered teams and enterprise deployments | `AWS_REGION`, `BEDROCK_MODEL_ID` |
| `vertex` | Google Cloud ADC / service account / workload identity | direct Vertex AI API | design only | GCP-centered teams and centralized project billing | `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, `VERTEX_MODEL` |

## Design takeaways

### 1. CLI providers and direct API providers should not share the exact same request path
The current bridge is optimized for CLI providers that accept a flattened prompt. The planned direct API providers work better with structured chat messages.

### 2. Provider names should reflect auth reality
Using separate names such as `claude-api`, `bedrock`, and `vertex` prevents confusion with blocked or OAuth-only paths.

### 3. Operators should supply explicit model IDs
Do not hardcode a single "latest" model in docs or startup logic. Model availability and naming can change by provider, account, and region.

### 4. Health checks should be safe by default
All planned direct providers should avoid billable completion calls in `/health`. Health should confirm configuration shape, not spend tokens.

## Suggested rollout order
1. **`claude-api`**
   - simplest direct mapping from chat messages to a provider API
   - lowest cloud-platform coupling
2. **`bedrock`**
   - strong enterprise demand
   - auth story is robust but region/model access adds operational complexity
3. **`vertex`**
   - valuable for GCP users
   - more project/location/auth combinations and more overlap with the existing Google/Gemini story

## Related docs
- [Provider Interface Design](provider-interface.md)
- [Claude API Key Provider Design](claude-api-key-provider-design.md)
- [AWS Bedrock Provider Design](aws-bedrock-provider-design.md)
- [Google Vertex Provider Design](google-vertex-provider-design.md)
