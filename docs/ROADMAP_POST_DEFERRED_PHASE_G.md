# Phase G — Post-Deferred / Staging & Owner Gates

**Status:** Active after Phase F local closeout (Blocks 58–77).

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
| **G1** | Staging target decision + VPS approval pack | docs + owner sign-off | No |
| **G2** | Merge Phase F → `main` re-smoke (if not done) | git only | No |
| **G3** | First-client practice run + confusion log | process | No |
| **G4** | Controlled VPS staging execution | infra | **Owner approval only** |
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
- `system.digitalcubeagency.net` is the **production** product URL; a **separate staging decision** is required before treating any host as staging (Block G1).

---

## Current block

**Block G1** — [`docs/runbooks/PHASE_G_BLOCK_1_STAGING_TARGET_AND_VPS_PACK.md`](./runbooks/PHASE_G_BLOCK_1_STAGING_TARGET_AND_VPS_PACK.md)
