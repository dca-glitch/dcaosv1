# Admin Operations and Recovery (Block 2)

**Status:** Read-only admin diagnostics before staging. No deploy, no live external calls.

Related:

- [`EXTERNAL_INTEGRATIONS_READINESS.md`](./EXTERNAL_INTEGRATIONS_READINESS.md)
- [`STAGING_READINESS.md`](./STAGING_READINESS.md)
- [`../operator/ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md)

---

## Admin surface

| Surface | Access | What it shows |
|---------|--------|---------------|
| Dashboard → **Operational readiness** | owner/admin | DB connectivity, Block 1 integration categories, recovery hints, manual closeout commands |
| Dashboard → **Operational audit events** | owner/admin | Filtered tenant audit feed (WordPress, publication, workflow, module) |
| Dashboard → **Recent Activity** (Delivery filter) | owner/admin | Delivery-related audit actions in the main feed |
| `GET /api/v1/admin/operations/summary` | owner/admin | JSON aggregate of the above (read-only) |
| `GET /api/v1/integrations/readiness` | owner/admin | Block 1 external integrations config shape |

Client users **cannot** access admin operations summary or integrations readiness endpoints.

---

## Local commands

```powershell
cd C:\dcaosv1
npm.cmd run validate
npm.cmd run smoke:admin-operations:local
```

Optional broader closeout (manual — results not stored at runtime):

```powershell
npm.cmd run smoke:production-readiness:local
```

Logs: orchestrator smokes write to `$env:TEMP` and open Notepad.

---

## What is checked at runtime

- Database connectivity (`probeDbReadiness`)
- External integrations config shape (AI provider, WordPress, R2, GA/GSC) — no live calls
- Recent operational audit events from `AuditLog` when present
- Static recovery hints and closeout command list

## What is not checked at runtime

- Last smoke PASS/FAIL (no durable closeout store — shows `manual_run_required`)
- MI handoff / client approval system events (may appear in AI Operations or email outbox only)
- Staging/production hosts
- Secret values or credential contents

---

## Recovery quick reference

| Symptom | First action |
|---------|----------------|
| `validate` failed | Stop on first failing workspace; read validate log in `$env:TEMP` |
| Prisma EPERM | Stop `C:\Program Files\nodejs\node.exe` only; retry validate once |
| Smoke failed after validate | Rerun single smoke; confirm API/web only if required |
| `missing_config` readiness | See ENV_READINESS_INVENTORY; restart API after env change |
| Integration `disabled` | Expected local default; enable only with owner gate |
| WordPress publish disabled | `WORDPRESS_PUBLISH_ENABLED` not true — draft prep stays local |
| R2 disabled | Bucket IO guarded; strict roundtrip needs explicit env + smoke flag |

Full hints are returned in `GET /admin/operations/summary` → `recoveryHints`.

---

## Smoke proof

`npm run smoke:admin-operations:local` proves:

- Admin can load operations summary without secret leakage
- Closeout status is `manual_run_required` (no fake green closeout)
- Client session cannot access `/admin/operations/summary` or `/integrations/readiness` when client credentials are available
