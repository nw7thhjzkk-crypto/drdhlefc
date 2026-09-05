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
`google-labs-code/jules-action@v1.0.0` action with `JULES_API_KEY` and
`automationMode: AUTO_CREATE_PR` (handled inside the official action).

Jules works in Google’s cloud VM against the connected GitHub source
`sources/github/nw7thhjzkk-crypto/drdhlefc` (must be connected in the Jules web UI).

Jules **creates a PR**. Merge is handled by the guarded auto-merge pipeline when eligible.

### OpenCode — SECONDARY AGENT / INDEPENDENT REVIEWER

Use OpenCode (`/oc` or `/opencode`) for:

- independent code review
- security review
- small fixes
- refactoring
- backup implementation when Jules is unavailable

OpenCode remains configured in `.github/workflows/opencode.yml` and is **not** replaced by Jules.

### GitHub Actions

- Orchestrates agent invocation
- Runs **CI** (lint, typecheck, build)
- Guarded **auto-merge** for eligible Jules PRs only

### Human

- Final authority for high-risk changes
- Resolves blocked auto-merges
- Repo settings (enable **Allow auto-merge**)

## Autonomous production flow

```text
YOU
  → /jules <task>
  → Jules (AUTO_CREATE_PR)
  → PR authored by google-labs-jules[bot]
  → CI (lint + typecheck + build)
  → (optional) OpenCode /oc review by owner
  → security/quality gates
  → automatic merge (squash) when eligible
  → main (scaffold-gymsmart-erp-9743545895368865022)
```

## Auto-merge eligibility

A PR is eligible **only if all** of the following hold:

1. Author is **`google-labs-jules[bot]`** (Jules workflow product).
2. Head repository is **this repo** (not a fork).
3. Base branch is **`scaffold-gymsmart-erp-9743545895368865022`**.
4. PR is **not a draft**.
5. PR is **mergeable** (no conflicts).
6. **CI** job `lint-typecheck-build` is **success** for the head SHA.
7. **No high-risk paths** are modified (see below).

Anything else is **not** auto-merged.

### High-risk paths (fail closed)

Auto-merge is **blocked** if the PR changes any of:

- `supabase/migrations/000008_security_hardening.sql`
- `supabase/migrations/000009_store_atomicity_and_membership_financial.sql`
- `.github/workflows/**`
- `AGENTS.md`
- `opencode.json`

These require human review.

### What stops auto-merge

- Non-Jules author
- Fork PR
- Draft PR
- Merge conflicts
- Failed/missing CI
- High-risk path changes
- Repository **Allow auto-merge** disabled

## OpenCode independent review — current limitation

OpenCode is **comment-triggered** (`/oc`) and optimized for interactive agent sessions.
It does **not** currently publish a reliable machine-readable `OPENCODE_REVIEW: PASS|FAIL`
check that the merge gate can hard-require without fragile log scraping.

Therefore:

- Auto-merge **does not pretend** OpenCode is a required status check.
- Owners **should** run `/oc` review on Jules PRs for security-sensitive work.
- Security still **fails closed** via high-risk path blocking + CI.

Do not invent a fake OpenCode PASS status.

## Recursion prevention

- Jules workflow triggers only on **owner** `/jules` issue comments (not on `pull_request`).
- OpenCode triggers only on **owner** `/oc` comments.
- Auto-merge does **not** invoke Jules or OpenCode.
- OpenCode remediation commits from non-Jules authors do **not** enter Jules auto-merge.

## CI gates (what exists today)

From `package.json` and `.github/workflows/ci.yml`:

| Gate | Status |
|------|--------|
| lint (`npm run lint`) | **Required in CI** |
| typecheck (`tsc --noEmit`) | **Required in CI** |
| production build (`npm run build`) | **Required in CI** |
| unit/integration/RLS/financial test suites | **Not present as npm scripts** — do not claim they pass |

When real test scripts are added later, CI should be extended and become part of the merge gate.

## Prerequisites

1. Secret `JULES_API_KEY` configured.
2. Google Labs Jules GitHub app connected to this repository.
3. Repository setting **Allow auto-merge** enabled.
4. Base branch: `scaffold-gymsmart-erp-9743545895368865022`.

## Safety constraints

- Owner-only triggers for Jules and OpenCode.
- Secrets only via GitHub Actions secrets; never printed.
- No recursive agent loops.
- Prefer **do not merge** over unsafe automatic merging.
- Preserve migrations `000008` and `000009` unless a task explicitly requires otherwise.
- Follow root `AGENTS.md`.
