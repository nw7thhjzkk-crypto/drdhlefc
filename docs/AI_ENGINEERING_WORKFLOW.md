# AI engineering workflow — DR DHL Elite Fitness Club

## Agents

### Jules — PRIMARY IMPLEMENTATION AGENT

Use Jules for:

- major features
- architecture work
- database changes (forward-only migrations)
- security hardening
- integrations (real or explicitly “not configured”)
- tests
- substantial refactoring

**How to invoke (repository owner only):**

Comment on an issue:

```text
/jules <task description>
```

GitHub Actions workflow `.github/workflows/jules.yml` calls the official
`google-labs-code/jules-invoke@v1` action with `JULES_API_KEY` and
`automationMode: AUTO_CREATE_PR` (handled inside the official action).

Jules works in Google’s cloud VM against the connected GitHub source
`sources/github/nw7thhjzkk-crypto/drdhlefc` (must be connected in the Jules web UI).

Jules **creates a PR**. Jules does **not** merge.

### OpenCode — SECONDARY AGENT

Use OpenCode (`/oc` or `/opencode`) for:

- independent code review
- security review
- small fixes
- refactoring
- backup implementation when Jules is unavailable

OpenCode remains configured in `.github/workflows/opencode.yml` and is **not** replaced by Jules.

### GitHub Actions

- Orchestrates agent invocation
- Runs CI on pull requests
- Must never auto-merge product code

### Human

- Final review
- Merge authority

## Desired flow

```text
Task (owner)
  → Jules (/jules)
  → Implementation PR (AUTO_CREATE_PR)
  → CI
  → Review (human and/or OpenCode)
  → Remediation if necessary
  → Human approval
  → Merge
```

## Safety constraints

- Owner-only triggers for both Jules and OpenCode.
- `JULES_API_KEY` exists only as a GitHub Actions secret; workflows reference `${{ secrets.JULES_API_KEY }}` and never print it.
- No recursive Jules runs on `pull_request` synchronize events.
- No automatic production merges.
- Preserve migrations `000008` and `000009` unless a task explicitly requires otherwise.
- Follow root `AGENTS.md` for stack, RLS, financial atomicity, and secret handling.

## Prerequisites

1. Repository secret `JULES_API_KEY` configured.
2. GitHub app **Google Labs Jules** has access to this repository (connect via jules.google.com).
3. Base branch for Jules sessions: `scaffold-gymsmart-erp-9743545895368865022`.
