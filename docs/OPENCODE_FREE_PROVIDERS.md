# OpenCode free provider routing (GitHub Actions)

## Status after hang investigation (run 33956133789)

### Root cause
The smoke run stayed on **Run OpenCode** for a long time because:

1. The workflow had **no `timeout-minutes`**, so GitHub would not fail-fast.
2. Primary model `opencode/big-pickle` can **stall waiting on provider auth/response** when Zen is not usable.
3. `@shutovks/opencode-model-fallback` is an **external npm plugin**. OpenCode plugin resolution/load is **not proven reliable** inside `anomalyco/opencode/github@v1.18.29`, and OpenCode has known classes of **plugin-load hangs**. The plugin was removed from the deterministic path.

### What was fixed
- Job-level `timeout-minutes: 15` (fail-fast).
- Removed external fallback plugin from `opencode.json`.
- Kept free-provider secret env wiring.

### Secrets referenced by the workflow (values never printed)
| Secret | Referenced? |
|--------|-------------|
| `OPENCODE_API_KEY` | Yes |
| `OPENROUTER_API_KEY` | Yes |
| `GROQ_API_KEY` | Yes |
| `GEMINI_API_KEY` | Yes (maps to `GOOGLE_GENERATIVE_AI_API_KEY` too) |

Referenced does **not** mean configured. Empty secrets still inject empty env vars.

### Realistic free routing today
With the GitHub Action, **one model ID is selected per run** (`with.model`). Multi-provider automatic failover inside a single hung session is **not reliable** without a proven Action-native mechanism.

Practical approach:
1. Set `OPENCODE_API_KEY` for Zen free primary `opencode/big-pickle`.
2. If Zen is unavailable, change the workflow model to a free model whose key you have (OpenRouter/Groq/Gemini).
3. Rely on `timeout-minutes` so a bad lane fails in minutes, not hours.

### Providers we will not use
- Leaked keys, IP rotation, WARP, proxy quota evasion.

### Security
- Owner-only `/oc` gate retained.
- `use_github_token: true`, `share: false`.
- No app/RLS/migration changes.
