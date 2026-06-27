# Phase G — Post-Deferred / Staging & Owner Gates

**Status:** Active after Phase F local closeout (Blocks 58–77). **Block G1 closed** (2026-06-27).

**Purpose:** Close deferred **owner and environment gates** in order — without batching schema, API, UI, or production deploy in one block.

**Prerequisite:** Phase F merged to `main` and `npm run smoke:pre-staging:local` PASS on `main`.

Related:

- [`docs/operator/deferred-scope-register.md`](./operator/deferred-scope-register.md)
- [`docs/runbooks/POST_MVP_PHASE_E_DEFERRED_OWNER_GATES.md`](./runbooks/POST_MVP_PHASE_E_DEFERRED_OWNER_GATES.md)
- [`docs/runbooks/PHASE_G_POST_DEFERRED_CLOSEOUT_INDEX.md`](./runbooks/PHASE_G_POST_DEFERRED_CLOSEOUT_INDEX.md)

---

## Implementation order (one block at a time)

| Block | Name | Layer | Deploy? |
|-------|------|-------|---------|
| **G1** | Staging target decision + VPS approval pack | docs + owner sign-off | No — **closed** |
| **G2** | Merge Phase F → `main` re-smoke (if not done) | git only | No |
| **G3** | First-client practice run + confusion log | process | No |
| **G4** | Controlled VPS staging execution | infra | **Owner approval only — not approved** |
| **G5** | Staging env keys (credential master, R2) | env + smoke | Staging only |
| **G6** | `smoke:mvp:staging` + HTTPS browser QA | smoke | Staging only |
| **G7** | Tenant module `enforce` on staging | env + smoke | Staging only |
| **G8+** | Live proofs (WP, Google, email, OpenRouter) | per deferred item | Staging first |
| **G9** | Production deploy | infra | **Separate owner approval** |

Each block: inspect → implement → validate → owner approval → commit (separate push approval).

---

## Rules (unchanged from AGENTS.md)

- No VPS, DNS, Caddy, Docker, or production actions unless explicitly approved for that block.
- No schema / migration / API / auth changes in Phase G Blocks G1–G3.
- Staging must not use production DB credentials or client data.
- `system.digitalcubeagency.net` is the **production** product URL.
- **Staging host (G1 approved):** `staging.digitalcubeagency.net` — same VPS as production, **separate staging stack** (containers, env, DB, Caddy route, secrets).
- DNS for staging is **not created yet**; create before G4 execution only.
- **G4 VPS execution is not approved.**

---

## G1 outcome (closed)

| Field | Value |
|-------|--------|
| Staging host | `https://staging.digitalcubeagency.net` |
| Production URL | `https://system.digitalcubeagency.net` |
| VPS strategy | Same VPS; separate staging stack |
| G4 approved? | **No** |
| DNS created? | **No** (deferred until G4 prep) |

Reference: [`docs/operator/staging-target-decision-template.md`](./operator/staging-target-decision-template.md)

---

## Current block

**Block G2** — merge Phase F → `main` re-smoke (if not done), then **G3** first-client practice run. **G4** remains blocked until separate owner approval.
