# OpenCode free provider routing (GitHub Actions)

## Non-interactive permissions (required for CI)

OpenCode defaults `permission.external_directory` to **`ask`**.

In GitHub Actions there is no human to approve prompts. If the agent touches a
path outside the checked-out worktree (commonly `/home/runner/.npm/_logs/*`
after an npm failure), the session waits until `timeout-minutes` cancels the job.

Project `opencode.json` therefore sets:

- in-repo tools: `edit` / `bash` / `read` / search tools allowed
- `question`: deny (no interactive Q&A in CI)
- `external_directory`: allow only runner paths needed for npm/OpenCode cache/temp;
  deny all other external paths

This is **not** global filesystem access.

## Free provider secrets

| Secret | Role |
|--------|------|
| `OPENCODE_API_KEY` | Zen free primary |
| `OPENROUTER_API_KEY` | OpenRouter `:free` |
| `GROQ_API_KEY` | Groq free |
| `GEMINI_API_KEY` | Optional last resort |

Never commit secret values. Workflow maps secrets to env only.

## Fail-fast

Workflow job uses `timeout-minutes: 15` so a stalled provider cannot hang for hours.

## Not used

- `@shutovks/opencode-model-fallback` (removed; not in active `opencode.json`)
- IP rotation / quota evasion / leaked keys
