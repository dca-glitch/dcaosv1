# Local / Pre-Staging Smoke Matrix

**Status:** Operator reference. Consolidates smoke script requirements without duplicating full runbooks.

Related:

- [`PRE_STAGING_VALIDATION_GATE.md`](./PRE_STAGING_VALIDATION_GATE.md) — one-command gate
- [`PRE_STAGING_CLIENT_DELIVERY_READINESS.md`](./PRE_STAGING_CLIENT_DELIVERY_READINESS.md) — focused client delivery proof
- [`E2E_CLIENT_DELIVERY_SMOKE.md`](./E2E_CLIENT_DELIVERY_SMOKE.md) — admin E2E chain
- [`../operator/ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md) — env vars

---

## Blocks 1–2 — readiness / operations (post–Block 4 baseline)

Fast config and boundary proof after `validate`. No live external calls.

| Command | Proves | Does not prove |
|---------|--------|----------------|
| `npm.cmd run smoke:external-integrations-readiness:local` | AI/WP/R2/GA-GSC config shape; negative cases; fetch guard (no network) | Live provider, publish, R2 IO, OAuth/sync |
| `npm.cmd run smoke:admin-operations:local` | Admin operations summary loads; no secret leakage; client 403 on admin endpoints | Last smoke PASS store; staging/production |
| `node scripts/smoke-client-approval-happy-path-local.mjs` | Pending approvals, editor, approve/reject, admin boundary, `CLIENT_REVIEW_DEFERRED` | Staging deploy; live publish |
| `npm.cmd run smoke:production-readiness:local` | Orchestrated validate + revenue chain + MI + handoff + portal + monthly reports | Staging/production deploy; live integrations |

Optional API probe for Block 1: `$env:SMOKE_PROBE_EXTERNAL_INTEGRATIONS_API = "true"`.

Runbooks: [`EXTERNAL_INTEGRATIONS_READINESS.md`](./EXTERNAL_INTEGRATIONS_READINESS.md), [`ADMIN_OPERATIONS_RECOVERY.md`](./ADMIN_OPERATIONS_RECOVERY.md), [`../operator/OPERATOR_RUNBOOK.md`](../operator/OPERATOR_RUNBOOK.md).

---

## Block A — focused pre-staging subset

Minimum smoke set before staging GO / NO-GO discussion (see [`STAGING_READINESS.md`](./STAGING_READINESS.md)):

| Order | Command |
|-------|---------|
| 0 | `npm.cmd run validate` |
| 1 | `npm.cmd run smoke:puriva-client-portal-boundary:local` |
| 2 | `npm.cmd run smoke:ai-delivery-reviews` |
| 3 | `npm.cmd run smoke:ai-seo-content-plan-pdf` |
| 4 | `npm.cmd run smoke:ai-knowledge-context` |
| 5 | `npm.cmd run smoke:client-portal-monthly-report:browser` |
| 6 | `npm.cmd run smoke:monthly-report:browser` |
| 7 | `npm.cmd run smoke:monthly-report:mi-context` |

Optional broader gates: `smoke:pre-staging:local` (full orchestrator), `smoke:puriva-readiness:local` (Puriva chain).

---

## Orchestrator (Block B)

`npm.cmd run smoke:staging-readiness:local` runs the Block A minimum subset via [`scripts/staging-readiness-local.ps1`](../../scripts/staging-readiness-local.ps1):

- `validate` (with Prisma EPERM retry — Program Files `node.exe` only)
- Block A smokes § above in order
- Logs to `$env:TEMP`; opens Notepad; stop on first failure
- `-List` dry mode; `-IncludeOptional` / `-IncludeFullGates` for extended packs

Full catalog below. `smoke:pre-staging:local` remains the full local repo closeout gate.

---

## Local validation order (recommended)

Run from `C:\dcaosv1` in external PowerShell. Stop on first failure.

| Step | Command | API | Web | `AUTH_SEED_TEST_PASSWORD` |
|------|---------|-----|-----|---------------------------|
| 0 | `npm.cmd run check` or `npm.cmd run validate` | No | No | No |
| 1 | Start `dev:api` + `dev:web` when smokes need live services | Yes | Browser smokes | — |
| 2 | `npm.cmd run smoke:pre-staging:local` | Yes (orchestrator restarts) | Yes (auto-start 5173) | **Yes** |

Focused subsets:

| Goal | Commands |
|------|----------|
| Client delivery only | See [`PRE_STAGING_CLIENT_DELIVERY_READINESS.md`](./PRE_STAGING_CLIENT_DELIVERY_READINESS.md) |
| Admin E2E chain | See [`E2E_CLIENT_DELIVERY_SMOKE.md`](./E2E_CLIENT_DELIVERY_SMOKE.md) |
| Staging post-deploy (G4 only) | `npm.cmd run smoke:mvp:staging` with HTTPS staging URL — **not local** |

---

## Operational caveats

### Prisma EPERM (Windows)

Run `validate` **before** starting dev API/Web, or stop the dev `node.exe` locking `query_engine-windows.dll.node`. See [`.github/instructions/validation.instructions.md`](../../.github/instructions/validation.instructions.md).

### HTTP 429 (local API rate limit)

In-memory limit: 300 requests / 15 minutes per IP. Long smoke chains may hit 429.

**Recovery:** Restart local API (`npm.cmd run dev:api`), or use `smoke:pre-staging:local` (restarts API before heavy sections), or space runs across sessions.

---

## Smoke categories

### API-only (no Web dev server)

| Script | Primary proof |
|--------|---------------|
| `smoke:local` | API health, auth basics |
| `smoke:mvp:local` | Auth, tenant, modules, finance baseline |
| `smoke:client-portal:local` | Client archive API, access guards, forbidden fields, `#/client-portal` archive behavior |
| `smoke:client-access:local` | Admin grant/revoke, client bounds |
| `smoke:ai-market-intelligence` | MI project, sources, run, insight, handoff, AI Delivery apply; client-linked MI project + client context carried through handoff (`clientId` proof) |
| `smoke:ai-operations:local` | AI Operations runs list/detail, gateway filter, MI research run create+execute+list+detail via AI Operations endpoints |
| `smoke:ai-knowledge-context` | Knowledge base approved/allowedForPrompt selection, injection sanitization, tenant/client/project isolation, AiDelivery workflow-run context attachment, WorkflowBriefs MI/SEO AI-run knowledge metadata (Blocks 5A/6A), admin-only route gating |
| `smoke:ai-delivery-reviews` | Content plan, drafts, images, deliverables, WP draft prep |
| `smoke:ai-seo-content-plan-pdf` | Content plan PDF export + private storage (admin-only; accepts 503 locally) |
| `smoke:monthly-report:local` | Admin report lifecycle, document handoff |
| `smoke:monthly-report:pdf` | PDF generation path |
| `smoke:monthly-report:mi-context` | MI context admin + client non-exposure |
| `smoke:monthly-report:metrics` | Metrics snapshot API |
| `smoke:google-drive-export` | Export handoff contract (guarded) |
| `smoke:email-outbox:local` | Read-only outbox |
| `smoke:credential-encryption:local` | Encryption roundtrip |
| `smoke:r2-byte-roundtrip:local` | R2 disabled guard (+ optional roundtrip) |
| `smoke:wordpress-publish:local` | Publish disabled / PublicationLog |
| `smoke:tenant-module:local` | Module route map |
| `smoke:tenant-module:dry-run-probe` | dry_run probe |
| `smoke:tenant-module:phase-f-local` | Phase F enforce checklist |
| `smoke:openrouter-guarded:local` | Local deterministic gateway |
| `smoke:google-drive-export-live:local` | Live export planning (guarded) |
| `smoke:credential-master-key-probe:local` | Master key probe |
| `smoke:post-mvp-readonly-apis:local` | Read-only API closeout |
| `smoke:legacy-wordpress-sunset:local` | Legacy WP config sunset |
| `smoke:external-integrations-readiness:local` | Block 1 config-shape only; no live calls |
| `smoke:admin-operations:local` | Block 2 admin summary + client boundary |
| `smoke:production-readiness:local` | Orchestrated closeout pack (validate + broad smokes) |
| `smoke:staging-readiness:local` | Block A minimum subset orchestrator |

### Browser (requires Web on `:5173`)

| Script | Primary proof |
|--------|---------------|
| `smoke:browser` | Login shell |
| `smoke:client-portal:browser` | Portal archive UI |
| `smoke:client-portal:signed-out:browser` | Signed-out shell |
| `smoke:client-portal:edge-cases:browser` | Edge cases |
| `smoke:client-portal:sparse-delivery:browser` | Sparse delivery |
| `smoke:client-portal:populated-delivery:browser` | Populated delivery + forbidden HTML |
| `smoke:client-portal:access-revoke:browser` | Revoke UX |
| `smoke:client-portal:empty-archive:browser` | Empty archive |
| `smoke:client-portal:project-filter:browser` | Project filter |
| `smoke:client-portal-monthly-report:browser` | FINAL-only reports in UI |
| `smoke:client-access:browser` | Client Access admin UI |
| `smoke:client-hub:*:browser` | Hub catalog, publication log, edge cases |
| `smoke:client-domain:browser` | Client domain regression |
| `smoke:mi-operator:browser` | MI operator shell |
| `smoke:ai-delivery-workflow:browser` | AI Delivery workflow UI |
| `smoke:content-plan-review:browser` | Deferred client review message |
| `smoke:content-draft-review:browser` | Deferred client review message |
| `smoke:finance-admin:browser` | Finance admin sanity |
| `smoke:monthly-report:browser` | Admin monthly report modal |
| `smoke:monthly-metrics-import:browser` | Metrics import UI |
| `smoke:roles-permissions:browser` | Roles summary |
| `smoke:module-registry:browser` | Module registry |
| `smoke:settings-team:browser` | Settings/Team shell |
| `smoke:settings-backend:browser` | Settings backend binding |
| `smoke:audit-activity:browser` | Audit activity |
| `smoke:dashboard:audit-feed:browser` | Dashboard audit feed (aligned to compact Dark Nebula UI) |
| `smoke:dashboard-data-backed:browser` | Dashboard metrics |
| `smoke:auth-invite-boundary:browser` | Invite boundary copy |
| `smoke:puriva-client-portal-boundary:local` | Puriva client-safe boundary: archive/monthly-report list+detail+download/release-package/deliverable field safety, `performanceSummary` provenance (`sourceType` allowed), legacy `/briefs` compatibility scan, admin-only WorkflowBriefs path denial, MI/SEO reportJson sanitization, Production Plan Review boundary (Blocks 4G/4B) |
| `smoke:ai-operations:browser` | AI Operations Console UI: list/empty state, MI source filter control, CSV export button, run detail modal, admin-only nav (not client-reachable) |
| `smoke:client-hub:catalog-inquiry:browser` | Client Hub catalog + portal-submitted inquiry visibility, admin acknowledge flow |
| `smoke:client-hub:edge-cases:browser` | Client Hub empty publication targets, legacy WP sunset, archived-client read-only hub |
| `smoke:client-domain:browser` | Client domain regression (dashboard → Clients → Add Client → Client Hub sections) restored after G30 stale-selector fixes; local/admin proof now passable and covers Clients flow, Client Hub catalog/publication sections, and MI client picker usage in local admin workflows. No staging/live claim. |

### Staging-only (G4 — not local)

| Script | Requirement |
|--------|-------------|
| `smoke:mvp:staging` | Explicit `MVP_SMOKE_API_BASE_URL=https://staging.digitalcubeagency.net/api/v1`, HTTPS, staging credentials |
| `smoke:staging-security-baseline` | Remote/live only; **refuses by default** unless `DCA_SMOKE_REMOTE_TARGET=staging`. Optional production health probe requires `DCA_SMOKE_ALLOW_PRODUCTION_HEALTH_PROBE=1`. Not part of local default gate or `smoke:staging-readiness:local` |

---

## Environment requirements summary

| Requirement | Smokes affected |
|-------------|-----------------|
| **`AUTH_SEED_TEST_PASSWORD`** | Nearly all authenticated smokes |
| **`AUTH_SEED_TEST_EMAIL`** | Optional; default `admin@dca.local` |
| **`AUTH_SEED_TESTER_*`** | Optional cross-tenant proof in `smoke:client-portal:local`, `smoke:mvp:local` |
| **Local API `:4000`** | All smokes except `check`/`validate` |
| **Local Web `:5173`** | All `*:browser` smokes |
| **Optional R2 env** | Strict roundtrip in `smoke:r2-byte-roundtrip:local` only |
| **Optional provider env** | Manual open-gate probes only (see ENV inventory) |

---

## Orchestrator

`npm.cmd run smoke:pre-staging:local` runs the full matrix in [`scripts/smoke-pre-staging-local.ps1`](../../scripts/smoke-pre-staging-local.ps1):

- Runs `validate` first
- Restarts API with `TENANT_MODULE_ENFORCEMENT=off`
- Restarts API before rate-limit-heavy browser sections
- Ensures Web dev server for browser smokes
- Does **not** deploy or touch VPS

Manual sequence equivalent: [`PRE_STAGING_VALIDATION_GATE.md`](./PRE_STAGING_VALIDATION_GATE.md) § Manual sequence.

---

## Package script existence

All scripts referenced in this matrix are defined in root [`package.json`](../../package.json) under `smoke:*`. If a doc references a missing script, fix the doc or add the script minimally — do not rename existing scripts without cause.
