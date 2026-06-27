# Staging Target Decision Template

**Status:** G1 approved — staging target documented. DNS creation deferred until after G1 and before G4 controlled VPS staging execution.

**Purpose:** Resolve whether `system.digitalcubeagency.net` is production-only, staging-only, or split (separate staging host). G1 decision is complete; use this document as the signed staging target reference for G4 and later blocks.

Do not paste secrets, passwords, or full `DATABASE_URL` values in this document.

---

## 1. Production URL (fixed product naming)

| Field | Value |
|-------|--------|
| Production product name | DCA OS Lite |
| Production URL (approved naming) | `https://system.digitalcubeagency.net` |
| Client access on production | Blocked until separate approval |

Production URL is unchanged by G1. Staging uses a separate host (§2).

---

## 2. Staging target — approved option

- [x] **Option A — Separate staging subdomain** (approved)
  Staging host: `https://staging.digitalcubeagency.net`
  Production remains `https://system.digitalcubeagency.net`.

- [ ] **Option B — Same host, pre-client validation window**
  Not selected.

- [ ] **Option C — Other host**
  Not selected.

### VPS strategy (approved)

| Field | Value |
|-------|--------|
| VPS | Same VPS as production |
| Safety requirement | Separate staging stack on that VPS (no shared runtime with production) |

---

## 3. Smoke and API base URL (approved)

| Field | Staging value |
|-------|----------------|
| Smoke URL | `https://staging.digitalcubeagency.net` |
| `MVP_SMOKE_API_BASE_URL` | `https://staging.digitalcubeagency.net/api/v1` |
| `smoke:mvp:staging` allowed host | `staging.digitalcubeagency.net` (must match §2 exactly) |
| Web origin | Same host as API (same-origin `/api/v1`) |

Local remains: `http://127.0.0.1:4000/api/v1` and `http://localhost:5173`.

---

## 4. Staging stack isolation (approved safety requirements)

Staging must use a **separate staging stack**. Required separation:

- [x] Separate staging containers
- [x] Separate staging `.env`
- [x] Separate Caddy route
- [x] Separate staging Postgres container
- [x] Separate Postgres volume
- [x] Separate staging DB / user / password
- [x] Separate AUTH / JWT / session secrets
- [x] Separate staging credential master key
- [x] R2 staging bucket **or** clearly separated staging prefix

### Data and credential boundaries (mandatory)

- [x] Staging must **not** use production DB credentials
- [x] Staging must **not** use production client data
- [x] Production API keys must **not** be reused unless separately approved for a specific live proof

### Database strategy (staging)

- [x] Separate PostgreSQL instance or database name on VPS (separate staging Postgres container + volume)
- [x] No production data import
- [x] No real client PII in staging seed
- [x] Migrations: Prisma only; no `db push`
- [x] Backup before first staging migration

Staging DB identifier (host/name only, no password): separate staging Postgres container on same VPS — DB name / user to be defined at G4 setup (not production credentials).

---

## 5. Runtime shape (from VPS pack — confirm at G4)

- [ ] Docker Compose on VPS (`dca_net`, `dca-caddy`, staging `dcaosv1-api`, staging `dcaosv1-postgres` — separate from production stack)
- [ ] App path: `/opt/dca/apps/dcaosv1/app` (or staging-specific path as defined in G4 pack)
- [ ] API internal port `4000`; no host bind on `:4000` (Finance Lite conflict)
- [ ] Optional debug bind: `127.0.0.1:4010:4000`
- [ ] Separate Caddy route for `staging.digitalcubeagency.net`

---

## 6. DNS subdomain timing (approved)

**Do not create DNS as part of G1 (this docs block).**

Create `staging.digitalcubeagency.net` **after G1 is documented** and **before G4 controlled VPS staging execution**.

When DNS is created (G4 prep, not G1):

| Field | Value |
|-------|--------|
| Type | `A` |
| Name | `staging` |
| Value | Current VPS IP |
| TTL | `300` |

---

## 7. Explicitly out of scope until later blocks

- Production deploy of current `main`
- Client Portal access for real Puriva users
- Live GA/GSC, Stripe, scraping, Revenue Hub, POD modules
- Schema or API changes
- DNS creation (deferred — see §6)
- VPS SSH, Caddy edits, container deploy (G4 only, with separate approval)

---

## 8. Owner sign-off (G1 approved)

| Field | Value |
|-------|--------|
| Decision date | 2026-06-27 |
| Approved by | Owner (G1 staging target decision) |
| Approved staging host | `https://staging.digitalcubeagency.net` |
| Approved smoke URL | `https://staging.digitalcubeagency.net` |
| VPS strategy | Same VPS as production; separate staging stack |
| Block G4 VPS execution approved? | **No** — separate G4 approval required |

### G4 controlled VPS staging execution — approver

| Field | Value |
|-------|--------|
| Owner approval for G4 controlled VPS staging execution | **Piotr only** |

**Approval statement (copy for G4 when ready):** see [`VPS_STAGING_EXECUTION_APPROVAL_PACK.md`](../deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md) § Approval Statement Template — use exact commit hash from `main` after Phase F merge.

---

## 9. After completion

1. Update [`docs/STATUS_COMPLETION.md`](../STATUS_COMPLETION.md) — “Confirmed staging target” row (follow-up docs PR if not yet updated).
2. Update Caddy draft in VPS pack to match `staging.digitalcubeagency.net` (docs-only PR before G4).
3. Create DNS `staging` A record per §6 before G4 VPS execution.
4. Proceed to Block G2 (merge) or G4 (VPS) per [`ROADMAP_POST_DEFERRED_PHASE_G.md`](../ROADMAP_POST_DEFERRED_PHASE_G.md).
