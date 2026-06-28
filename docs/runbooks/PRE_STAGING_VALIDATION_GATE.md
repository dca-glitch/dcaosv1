# Pre-Staging Validation Gate (Local Repo Closeout)

**Status:** Local-only operator gate. Does **not** deploy to VPS or run staging smoke.

**Purpose:** Confirm the local repository baseline before any future staging approval. PR #13 is already merged into `main`; this gate remains local-only and does not authorize VPS execution.

**Phase G context (2026-06-27):** G1 closed — staging host `staging.digitalcubeagency.net`; production `system.digitalcubeagency.net`; G4 **not approved**; DNS **not created**. Run long validation/smoke from **external PowerShell**, not inside Cursor agent sessions.

**Forbidden in this gate:** VPS login, Docker Compose apply, Caddy/DNS changes, staging migrations, production env, `smoke:mvp:staging` unless owner explicitly approves G4 and staging host access.

**Run location:** Use a local PowerShell terminal outside Cursor for `npm run validate` and `npm run smoke:pre-staging:local` (long-running). Cursor agents should not start API/Web servers or run full smoke suites during doc-only or UI-copy tasks.

Related:

- [`docs/deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md`](../deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md) — future VPS gate (separate approval)
- [`docs/STATUS_COMPLETION.md`](../STATUS_COMPLETION.md) — completion overview
- [`docs/runbooks/PURIVA_MVP_BLOCK_30_LOCAL_CLOSEOUT_INDEX.md`](./PURIVA_MVP_BLOCK_30_LOCAL_CLOSEOUT_INDEX.md) — Puriva MVP Blocks 7–30 map
- [`docs/runbooks/POST_MVP_PHASE_A_D_CLOSEOUT_INDEX.md`](./POST_MVP_PHASE_A_D_CLOSEOUT_INDEX.md) — Post-MVP Blocks 31–53 map
- [`docs/runbooks/POST_MVP_BLOCK_57_LOCAL_REPO_FINAL_CLOSEOUT.md`](./POST_MVP_BLOCK_57_LOCAL_REPO_FINAL_CLOSEOUT.md) — final local closeout
- [`docs/operator/post-merge-completion-status-20260627.md`](../operator/post-merge-completion-status-20260627.md) — current post-merge source of truth
- PR #13 — merged into `main` at `584e041bd85e8179e795a0e4621a0d9d8908e0b6`; merge does not mean production deployment

---

## Prerequisites

1. Local PostgreSQL running; API on `http://127.0.0.1:4000`.
2. `AUTH_SEED_TEST_PASSWORD` set (shell or `.env`; never commit).
3. Optional for Block 4 smoke: `CREDENTIAL_ENCRYPTION_MASTER_KEY` in `.env` + API restart.
4. Branch: `main` for the current post-merge baseline.

---

## One-command local gate

```powershell
cd C:\dcaosv1
npm.cmd run smoke:pre-staging:local
```

Runs `validate` then the approved local smoke suite (Puriva MVP Blocks 7–30, Post-MVP Blocks 31–53, architecture blocks 4–6, legacy sunset).

If `validate` fails with Prisma `EPERM` on Windows, run validate **before** starting dev API/Web, or stop the local API/`node.exe` process and rerun. See [`.github/instructions/validation.instructions.md`](../../.github/instructions/validation.instructions.md).

If smoke fails with HTTP **429**, restart the API and rerun (or use `smoke:pre-staging:local`, which restarts API before heavy smokes). Long smoke chains share a 300 req / 15 min in-memory limit per IP.

Focused E2E client delivery proof order: [`docs/runbooks/E2E_CLIENT_DELIVERY_SMOKE.md`](./E2E_CLIENT_DELIVERY_SMOKE.md).

---

## Manual sequence (same coverage as orchestrator)

```powershell
cd C:\dcaosv1
npm.cmd run validate
npm.cmd run smoke:local
npm.cmd run smoke:mvp:local
npm.cmd run smoke:client-portal:local
npm.cmd run smoke:client-access:local
npm.cmd run smoke:browser
npm.cmd run smoke:dashboard:audit-feed:browser
npm.cmd run smoke:settings-team:browser
npm.cmd run smoke:content-plan-review:browser
npm.cmd run smoke:content-draft-review:browser
npm.cmd run smoke:finance-admin:browser
npm.cmd run smoke:client-access:browser
npm.cmd run smoke:client-portal:browser
npm.cmd run smoke:client-portal:signed-out:browser
npm.cmd run smoke:client-portal:edge-cases:browser
npm.cmd run smoke:client-portal:sparse-delivery:browser
npm.cmd run smoke:client-portal:populated-delivery:browser
npm.cmd run smoke:client-portal:access-revoke:browser
npm.cmd run smoke:client-portal:empty-archive:browser
npm.cmd run smoke:client-hub:catalog-inquiry:browser
npm.cmd run smoke:client-hub:publication-log:browser
npm.cmd run smoke:client-portal:project-filter:browser
npm.cmd run smoke:client-domain:browser
npm.cmd run smoke:client-portal-monthly-report:browser
npm.cmd run smoke:ai-market-intelligence
npm.cmd run smoke:mi-operator:browser
npm.cmd run smoke:ai-delivery-workflow:browser
npm.cmd run smoke:monthly-metrics-import:browser
npm.cmd run smoke:roles-permissions:browser
npm.cmd run smoke:module-registry:browser
npm.cmd run smoke:settings-backend:browser
npm.cmd run smoke:audit-activity:browser
npm.cmd run smoke:dashboard-data-backed:browser
npm.cmd run smoke:auth-invite-boundary:browser
npm.cmd run smoke:google-drive-export
npm.cmd run smoke:monthly-report:mi-context
npm.cmd run smoke:monthly-report:local
npm.cmd run smoke:monthly-report:pdf
npm.cmd run smoke:monthly-report:metrics
npm.cmd run smoke:monthly-report:browser
npm.cmd run smoke:ai-delivery-reviews
npm.cmd run smoke:email-outbox:local
npm.cmd run smoke:credential-encryption:local
npm.cmd run smoke:r2-byte-roundtrip:local
npm.cmd run smoke:wordpress-publish:local
npm.cmd run smoke:tenant-module:local
npm.cmd run smoke:tenant-module:dry-run-probe
npm.cmd run smoke:openrouter-guarded:local
npm.cmd run smoke:google-drive-export-live:local
npm.cmd run smoke:credential-master-key-probe:local
npm.cmd run smoke:post-mvp-readonly-apis:local
npm.cmd run smoke:legacy-wordpress-sunset:local
```

Optional open-gate WordPress probe (restart API with `WORDPRESS_PUBLISH_ENABLED=true`):

```powershell
$env:SMOKE_EXPECT_WORDPRESS_PUBLISH_ENABLED = "true"
npm.cmd run smoke:wordpress-publish:local
```

Optional tenant module enforce probe (restart API with `TENANT_MODULE_ENFORCEMENT=enforce`):

```powershell
$env:SMOKE_EXPECT_TENANT_MODULE_ENFORCE = "true"
npm.cmd run smoke:tenant-module:local
```

See block operator docs under `docs/security/`.

---

## Pass criteria

- `validate` — PASS (check + build all workspaces)
- All default local smokes — PASS
- No secrets printed in logs
- Local `main` synced to `origin/main`

---

## Current accepted local closeout

- PR #13 merged to `main`: **100%**.
- Local `main` validation: **100%**, passed after Windows Prisma DLL lock cleanup.
- Local pre-staging proof: **95% accepted**.
- Full pre-staging reached final Finance admin browser smoke.
- Finance admin browser smoke initially hit local HTTP **429** admin login/rate-limit.
- After `restore-local-admin` and API/Web restart, isolated Finance browser smoke passed.
- No deploy, VPS migration, production restart, or release was performed.
- G1 staging target: `staging.digitalcubeagency.net` (production: `system.digitalcubeagency.net`; DNS not created; G4 not approved).

## After local closeout (owner decision — not this gate)

1. G1 staging target is confirmed: `staging.digitalcubeagency.net` (production remains `system.digitalcubeagency.net`).
2. Create DNS `staging` A record during G4 prep only — **not created yet**.
3. Approve Block G4 VPS/staging execution pack separately — **not approved today**.
4. Deploy exact commit to staging stack on VPS after G4 approval.
5. Run `npm run smoke:mvp:staging` against `https://staging.digitalcubeagency.net/api/v1`.
6. Block 4/5/6 prod env gates on staging.

Local repo work can be **complete** while G4 VPS execution remains **not approved** and production remains **frozen**.
