# Staging Target Decision Template

**Status:** Owner must complete before Block G4 (VPS staging execution).

**Purpose:** Resolve whether `system.digitalcubeagency.net` is production-only, staging-only, or split (separate staging host). Until this is signed, treat staging target as **unconfirmed (0%)**.

Do not paste secrets, passwords, or full `DATABASE_URL` values in this document.

---

## 1. Production URL (fixed product naming)

| Field | Value |
|-------|--------|
| Production product name | DCA OS Lite |
| Production URL (approved naming) | `https://system.digitalcubeagency.net` |
| Client access on production | Blocked until separate approval |

---

## 2. Staging target — pick one option

Check **one** option and fill the host:

- [ ] **Option A — Separate staging subdomain** (recommended)  
  Staging host: `https://___________________________`  
  Production remains `system.digitalcubeagency.net`.

- [ ] **Option B — Same host, pre-client validation window**  
  Use `system.digitalcubeagency.net` for controlled operator validation **before** client access; document rollback and no production client data.  
  Acknowledged risk: host serves dual role until prod cutover is explicit.

- [ ] **Option C — Other host**  
  Staging host: `https://___________________________`  
  Notes: _______________________________________________

---

## 3. Smoke and API base URL (after decision)

| Field | Staging value |
|-------|----------------|
| `MVP_SMOKE_API_BASE_URL` | `https://<staging-host>/api/v1` |
| `smoke:mvp:staging` allowed host | Must match §2 exactly |
| Web origin | Same host as API (same-origin `/api/v1`) |

Local remains: `http://127.0.0.1:4000/api/v1` and `http://localhost:5173`.

---

## 4. Database strategy (staging)

- [ ] Separate PostgreSQL instance or database name on VPS
- [ ] No production data import
- [ ] No real client PII in staging seed
- [ ] Migrations: Prisma only; no `db push`
- [ ] Backup before first staging migration

Staging DB identifier (host/name only, no password): ___________________________

---

## 5. Runtime shape (from VPS pack — confirm)

- [ ] Docker Compose on VPS (`dca_net`, `dca-caddy`, `dcaosv1-api`, `dcaosv1-postgres`)
- [ ] App path: `/opt/dca/apps/dcaosv1/app`
- [ ] API internal port `4000`; no host bind on `:4000` (Finance Lite conflict)
- [ ] Optional debug bind: `127.0.0.1:4010:4000`

---

## 6. Explicitly out of scope until later blocks

- Production deploy of current `main`
- Client Portal access for real Puriva users
- Live GA/GSC, Stripe, scraping, Revenue Hub, POD modules
- Schema or API changes

---

## 7. Owner sign-off

| Field | Value |
|-------|--------|
| Decision date | |
| Approved by | |
| Approved staging host | |
| Approved smoke URL | |
| Block G4 VPS execution approved? | Yes / No (separate from this template) |

**Approval statement (copy for G4 when ready):** see [`VPS_STAGING_EXECUTION_APPROVAL_PACK.md`](../deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md) § Approval Statement Template — use exact commit hash from `main` after Phase F merge.

---

## 8. After completion

1. Update [`docs/STATUS_COMPLETION.md`](../STATUS_COMPLETION.md) — “Confirmed staging target” row.
2. If Option A or C: update Caddy draft in VPS pack to match chosen host (docs-only PR).
3. Proceed to Block G2 (merge) or G4 (VPS) per [`ROADMAP_POST_DEFERRED_PHASE_G.md`](../ROADMAP_POST_DEFERRED_PHASE_G.md).
