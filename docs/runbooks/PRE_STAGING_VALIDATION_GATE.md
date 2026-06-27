# Pre-Staging Validation Gate (Local Repo Closeout)

**Status:** Local-only operator gate. Does **not** deploy to VPS or run staging smoke.

**Purpose:** Confirm the feature branch is ready for owner review and future staging approval (PR #13). Run on `C:\dcaosv1` before asking for VPS execution.

**Forbidden in this gate:** VPS login, Docker Compose apply, Caddy/DNS changes, staging migrations, production env, `smoke:mvp:staging` unless owner explicitly approves staging host access.

Related:

- [`docs/deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md`](../deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md) — future VPS gate (separate approval)
- [`docs/STATUS_COMPLETION.md`](../STATUS_COMPLETION.md) — completion overview
- PR #13 — merge blocked until owner approves staging

---

## Prerequisites

1. Local PostgreSQL running; API on `http://127.0.0.1:4000`.
2. `AUTH_SEED_TEST_PASSWORD` set (shell or `.env`; never commit).
3. Optional for Block 4 smoke: `CREDENTIAL_ENCRYPTION_MASTER_KEY` in `.env` + API restart.
4. Branch: `feature/ai-delivery-project-brief-foundation`.

---

## One-command local gate

```powershell
cd C:\dcaosv1
npm.cmd run smoke:pre-staging:local
```

Runs `validate` then the approved local smoke suite (MVP, portal, browser, blocks 4–6, legacy sunset).

If `validate` fails with Prisma `EPERM` on Windows, stop the local API process and rerun.

If smoke fails with HTTP **429** on login, restart the API and rerun (or use `smoke:pre-staging:local`, which restarts API before heavy smokes).

---

## Manual sequence (same coverage)

```powershell
cd C:\dcaosv1
npm.cmd run validate
npm.cmd run smoke:local
npm.cmd run smoke:mvp:local
npm.cmd run smoke:client-portal:local
npm.cmd run smoke:client-domain:browser
npm.cmd run smoke:client-portal-monthly-report:browser
npm.cmd run smoke:ai-delivery-reviews
npm.cmd run smoke:credential-encryption:local
npm.cmd run smoke:wordpress-publish:local
npm.cmd run smoke:tenant-module:local
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
- Git branch pushed; PR #13 reflects latest commit

---

## After local closeout (owner decision — not this gate)

1. Approve VPS staging execution pack.
2. Deploy exact commit to staging host.
3. Run `npm run smoke:mvp:staging` against HTTPS staging API.
4. Block 4/5/6 prod env gates on staging.
5. Merge PR #13 after staging QA.

Local repo work can be **complete** while VPS/staging remains **paused** by owner choice.
