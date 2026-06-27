# Post-MVP Phase C & D — Closeout Index

**Status:** Local operator gate index for Post-MVP Phase C (Blocks 43–46) and Phase D (Blocks 47–53). PR #13 is merged to `main`; VPS/staging execution still requires a confirmed staging target and separate owner approval.

**Purpose:** Single map of Phase C/D local smokes, runbooks, and pre-staging coverage for Post-MVP closeout review after Phase B (Blocks 40–42).

---

## One-command gate

```powershell
cd C:\dcaosv1
npm.cmd run smoke:pre-staging:local
```

See [`PRE_STAGING_VALIDATION_GATE.md`](./PRE_STAGING_VALIDATION_GATE.md).

Prior Post-MVP phases:

- Phase B index: Blocks 40–42 runbooks under `POST_MVP_BLOCK_40_*` through `POST_MVP_BLOCK_42_*`
- Phase A–D master index: [`POST_MVP_PHASE_A_D_CLOSEOUT_INDEX.md`](./POST_MVP_PHASE_A_D_CLOSEOUT_INDEX.md)
- Phase E deferred gates: [`POST_MVP_PHASE_E_DEFERRED_OWNER_GATES.md`](./POST_MVP_PHASE_E_DEFERRED_OWNER_GATES.md)
- Final closeout: [`POST_MVP_BLOCK_57_LOCAL_REPO_FINAL_CLOSEOUT.md`](./POST_MVP_BLOCK_57_LOCAL_REPO_FINAL_CLOSEOUT.md)
- Puriva MVP index: [`PURIVA_MVP_BLOCK_30_LOCAL_CLOSEOUT_INDEX.md`](./PURIVA_MVP_BLOCK_30_LOCAL_CLOSEOUT_INDEX.md)

---

## Phase C — Local gates and open probes (Blocks 43–46)

| Block | Topic | Runbook | Primary smoke | Strict env flag |
|-------|--------|---------|---------------|-----------------|
| 43 | Google Drive export live planning | `POST_MVP_BLOCK_43_*` | `smoke:google-drive-export-live:local` | `SMOKE_EXPECT_GOOGLE_DRIVE_LIVE=true` |
| 44 | Credential master key probe | `POST_MVP_BLOCK_44_*` | `smoke:credential-master-key-probe:local` | `SMOKE_EXPECT_CREDENTIAL_MASTER_KEY=true` |
| 45 | WordPress publish open gate | `POST_MVP_BLOCK_45_*` | `smoke:wordpress-publish:local` | `SMOKE_EXPECT_WORDPRESS_PUBLISH_ENABLED=true` |
| 46 | Tenant module enforce probe | `POST_MVP_BLOCK_46_*` | `smoke:tenant-module:local` | `SMOKE_EXPECT_TENANT_MODULE_ENFORCE=true` |

Phase C strict proofs require API restart with owner-provided env before setting the strict flag. Pre-staging keeps baseline (disabled/off) paths only.

---

## Phase D — Browser gates (Blocks 47–53)

| Block | Topic | Runbook | Primary smoke |
|-------|--------|---------|---------------|
| 47 | Monthly metrics import UI | `POST_MVP_BLOCK_47_*` | `smoke:monthly-metrics-import:browser` |
| 48 | Roles / permissions summary | `POST_MVP_BLOCK_48_*` | `smoke:roles-permissions:browser` |
| 49 | Module registry shell | `POST_MVP_BLOCK_49_*` | `smoke:module-registry:browser` |
| 50 | Settings backend binding | `POST_MVP_BLOCK_50_*` | `smoke:settings-backend:browser` |
| 51 | Audit activity feed | `POST_MVP_BLOCK_51_*` | `smoke:audit-activity:browser` |
| 52 | Dashboard data-backed metrics | `POST_MVP_BLOCK_52_*` | `smoke:dashboard-data-backed:browser` |
| 53 | Auth invite boundary copy | `POST_MVP_BLOCK_53_*` | `smoke:auth-invite-boundary:browser` |

Phase D browser smokes require local web on port **5173** and API on port **4000**.

---

## Optional strict Phase C sequence (owner/manual)

```powershell
cd C:\dcaosv1
# Block 43 — after Google service account env + API restart
$env:SMOKE_EXPECT_GOOGLE_DRIVE_LIVE = "true"
npm.cmd run smoke:google-drive-export-live:local
Remove-Item Env:SMOKE_EXPECT_GOOGLE_DRIVE_LIVE -ErrorAction SilentlyContinue

# Block 44 — after CREDENTIAL_ENCRYPTION_MASTER_KEY + API restart
$env:SMOKE_EXPECT_CREDENTIAL_MASTER_KEY = "true"
npm.cmd run smoke:credential-master-key-probe:local
Remove-Item Env:SMOKE_EXPECT_CREDENTIAL_MASTER_KEY -ErrorAction SilentlyContinue

# Block 45 — after WORDPRESS_PUBLISH_ENABLED=true + API restart
$env:SMOKE_EXPECT_WORDPRESS_PUBLISH_ENABLED = "true"
npm.cmd run smoke:wordpress-publish:local
Remove-Item Env:SMOKE_EXPECT_WORDPRESS_PUBLISH_ENABLED -ErrorAction SilentlyContinue

# Block 46 — after TENANT_MODULE_ENFORCEMENT=enforce + API restart
$env:SMOKE_EXPECT_TENANT_MODULE_ENFORCE = "true"
npm.cmd run smoke:tenant-module:local
Remove-Item Env:SMOKE_EXPECT_TENANT_MODULE_ENFORCE -ErrorAction SilentlyContinue
```

Restore `.env` defaults and restart API before running pre-staging baseline.

---

## Explicitly out of scope (owner gates)

- VPS/staging execution and `smoke:mvp:staging` before a real staging target is confirmed and explicitly approved
- Production Google service account, credential master key, WordPress live publish
- Production tenant module `enforce` without seeded entitlements
- Auth invite flows, password reset, Turnstile changes
- Schema/API contract changes without separate approval

---

## Pass criteria for Phase C & D closeout

- `npm run validate` — PASS
- `npm run smoke:pre-staging:local` — PASS (baseline paths for Blocks 43–53)
- All runbooks in this index present under `docs/runbooks/POST_MVP_BLOCK_43_*` through `POST_MVP_BLOCK_53_*`
- Optional strict Phase C proofs documented and runnable by owner when env is configured
- No secrets printed in smoke logs
