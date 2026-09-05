# OpenCode free provider routing (GitHub Actions)

This repository routes `/oc` automation through **legitimate free model lanes** so ERP coding does not depend on a paid Gemini plan.

## Architecture

```text
GitHub comment (/oc)
  → GitHub Actions (owner-only)
    → anomalyco/opencode/github@v1.18.29
      → primary model: opencode/big-pickle (Zen free)
      → @shutovks/opencode-model-fallback on 429/quota/transient errors
        → Zen free alternates
        → OpenRouter :free models (if OPENROUTER_API_KEY set)
        → Groq free tier (if GROQ_API_KEY set)
        → Google Gemini free tier (if GEMINI_API_KEY set) — last resort
```

No IP rotation, no proxy evasion, no third-party leaked keys.

## Fallback order (configured in `opencode.json`)

1. `opencode/big-pickle` — OpenCode Zen free / limited-time free coding model
2. `opencode/nemotron-3-ultra-free` — Zen free
3. `opencode/mimo-v2.5-free` — Zen free
4. `openrouter/cohere/north-mini-code:free` — OpenRouter free coding model
5. `openrouter/nvidia/nemotron-3-super-120b-a12b:free` — OpenRouter free
6. `openrouter/openrouter/free` — OpenRouter free models router
7. `groq/openai/gpt-oss-120b` — Groq free tier
8. `groq/llama-3.3-70b-versatile` — Groq free tier
9. `google/gemini-3.6-flash` — Google free tier only (strict quotas; last resort)

## GitHub Actions secrets (all optional except as noted)

| Secret | Required? | How to obtain (legal / free signup) |
|--------|-----------|-------------------------------------|
| `OPENCODE_API_KEY` | Recommended | OpenCode Zen account; free models can run at $0 balance |
| `OPENROUTER_API_KEY` | Recommended | https://openrouter.ai/keys — free `:free` models, no card required |
| `GROQ_API_KEY` | Recommended | https://console.groq.com/keys — free tier, no card required |
| `GEMINI_API_KEY` | Optional | Google AI Studio free tier — **last resort only** (tight daily quotas) |

`GITHUB_TOKEN` is provided automatically by Actions.

**Never commit API keys.** Reference them only as `${{ secrets.* }}` in the workflow.

## Documented limitations (honest)

| Lane | Typical free limits | Notes |
|------|---------------------|-------|
| OpenCode Zen free | Provider-defined; can change; may be IP/account limited | Best first lane for agent coding when available |
| OpenRouter `:free` | Often ~20 RPM and ~50 req/day without credits; higher after optional one-time credit purchase | Model catalog rotates; prefer coding-oriented IDs |
| Groq free | Model-specific RPM/RPD (e.g. tens of RPM; hundreds–thousands RPD) | Excellent latency; context/TPM limits apply |
| Google Gemini free | Strict per-model daily quotas (we already hit these) | Not suitable as sole production coding lane |

**This is not unlimited continuous coding.** It is **$0** with **rate limits**. Multiple independent free lanes reduce the chance that one quota blocks all work.

## Providers / approaches we will NOT use

- Leaked or scraped API keys from public repos
- IP-rotation / WARP / residential proxy quota evasion
- Paid Gemini as a required primary path
- Hardcoded secrets in workflow or source

## Validation checklist

- [x] Workflow still owner-only (`nw7thhjzkk-crypto` + `/oc`)
- [x] `use_github_token: true`
- [x] `share: "false"`
- [x] No unnecessary `id-token` permission
- [x] Secrets only via Actions env mapping
- [x] App code / migrations `000008` / `000009` untouched

After secrets are added, smoke-test with a read-only `/oc` comment before production implementation tasks.
