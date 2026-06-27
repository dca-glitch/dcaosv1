# Phase G Block 1 — Staging Target Decision + VPS Approval Pack

**GATE:** KEEP | scope: docs + owner decision only | deploy: forbidden | schema/API/auth: forbidden

**Status:** Closed (2026-06-27). Staging host documented; G4 not approved.

---

## Goal

Prepare controlled staging execution **without** VPS login, migration, or deploy. Block G1 produces a signed staging target decision and confirms the repo-side VPS approval pack is understood.

---

## Prerequisites

- Phase F Blocks 58–77 complete on branch `feature/local-closeout-blocks-58-77` (or merged to `main`).
- Local gate PASS: `npm run validate` and `npm run smoke:pre-staging:local`.
- Owner has read [`deferred-scope-register.md`](../operator/deferred-scope-register.md) § Production And Deployment.

---

## Steps (operator / owner)

### Step 1 — Resolve staging vs production host

Legacy draft docs ([`VPS_STAGING_EXECUTION_APPROVAL_PACK.md`](../deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md)) reference `system.digitalcubeagency.net` as a smoke host. [`STATUS_COMPLETION.md`](../STATUS_COMPLETION.md) states that URL is the **live production target**, not a confirmed staging host.

**Action:** Complete [`staging-target-decision-template.md`](../operator/staging-target-decision-template.md) §2 (pick Option A, B, or C).

### Step 2 — Review VPS execution pack (read-only)

Read in order:

1. [`VPS_STAGING_EXECUTION_APPROVAL_PACK.md`](../deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md)
2. [`VPS_STAGING_DEPLOYMENT_PLAN.md`](../deployment/VPS_STAGING_DEPLOYMENT_PLAN.md)
3. [`STAGING_MIGRATION_PROCEDURE.md`](./STAGING_MIGRATION_PROCEDURE.md)

Confirm understanding of:

- Docker Compose layout (`dcaosv1-api`, `dcaosv1-postgres`, `dca_net`, `dca-caddy`)
- Migration gate (Prisma only; backup first; stop on destructive reset)
- Secrets on server only; never commit or print values
- Staging smoke: `npm run smoke:mvp:staging` with `MVP_SMOKE_API_BASE_URL` pointing at **approved staging host** only
- Client access remains blocked through G4/G6

### Step 3 — Record decision in repo (docs PR)

After template completion:

- Update `STATUS_COMPLETION.md` row “Confirmed staging target” when host is chosen.
- If staging host ≠ `system.digitalcubeagency.net`, note follow-up doc patch for VPS pack Caddy example (Block G1 follow-up or G4 prep — docs only).

### Step 4 — Do not execute in Block G1

Forbidden in this block:

- VPS SSH, Caddy edits, DNS, firewall
- `prisma migrate` on any remote DB
- Production or staging deploy
- Package installs
- Application source changes

---

## Validation (Block G1)

| Check | Command / action | Expected |
|-------|------------------|----------|
| Local repo gate | `npm run validate` | PASS |
| Local pre-staging | `npm run smoke:pre-staging:local` | PASS (on Phase F baseline) |
| Staging template | Owner-filled §7 sign-off | Complete |
| VPS pack reviewed | Checklist in Step 2 | Acknowledged |

No `smoke:mvp:staging` in G1 — requires live staging host from Step 1.

---

## Done when

- Staging target decision template is completed (§7 signed).
- Owner can state: staging URL, production URL, and that G4 is not yet approved OR is approved with exact commit hash.
- Team agrees next block: **G2** (merge Phase F) if not on `main`, then **G3** (practice run), then **G4** (VPS execution) only after separate approval.

---

## Stop conditions

- Staging host still ambiguous (Option B not explicitly acknowledged if using production hostname).
- Owner wants production deploy before staging smoke — stop; defer to Block G9.
- Any request to run migrations or touch VPS in the same block as this doc — stop.

---

## Related

- Phase G index: [`PHASE_G_POST_DEFERRED_CLOSEOUT_INDEX.md`](./PHASE_G_POST_DEFERRED_CLOSEOUT_INDEX.md)
- Roadmap: [`ROADMAP_POST_DEFERRED_PHASE_G.md`](../ROADMAP_POST_DEFERRED_PHASE_G.md)
