# Security Boundary Audit — Post SEC-B1 Mega Block

**Date:** 2026-07-09  
**Scope:** Client Portal / admin API tenant boundaries after SEC-B1 fix. Read-only code audit; no live exploit execution.

**Related:** [`docs/runbooks/PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md`](../runbooks/PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md) · [`docs/STATUS.md`](../STATUS.md)

---

## Executive summary

| Severity | Count | Status |
|----------|-------|--------|
| BLOCKER | 1 | **FIXED** — SEC-B1 legacy `/api/v1/briefs` cross-tenant IDOR |
| HIGH | 1 | **FIXED** — SEC-H1 admin deliverables API returns raw `storageKey` |
| MEDIUM | 4 | Documented; separate blocks recommended |
| LOW | 2 | Documented |

---

## BLOCKER — SEC-B1 (FIXED)

**Finding:** Legacy `/api/v1/briefs` routes used `requireAuth` only. Owner/admin handlers queried by `clientId` or `briefId` without verifying the client belongs to the active tenant.

**Affected handlers (pre-fix):**

| Method | Path | Issue |
|--------|------|-------|
| GET | `/api/v1/briefs?clientId=` | Listed briefs for any client UUID |
| GET | `/api/v1/briefs/:id` | Returned any brief by ID |
| PATCH | `/api/v1/briefs/:id` | Updated any brief by ID |
| POST | `/api/v1/briefs/:id/submit` | Submitted any brief by ID |

**Safe paths (unchanged):** `GET /briefs/admin` already scoped by tenant; client-role paths used `ClientUserAccess` checks; `POST /briefs` create used `resolveCompanyIdForCreate` with tenant check.

**Fix:** `requireTenant` on router; `clientBelongsToTenant` / `briefBelongsToTenant` guards on all owner/admin read/write paths.

**Regression:** `apps/api/tests/integration/briefs-tenant-boundary.integration.test.ts`

---

## HIGH — H1: Admin deliverables expose `storageKey` (FIXED)

**Location:** `apps/api/src/core/core.runtime.ts` — `toAiDeliveryDeliverableSummary()` returned `storageKey` on `GET /api/v1/ai-delivery-projects/:id/deliverables`.

**Risk:** Internal bucket object keys visible to any authenticated owner/admin in tenant. Not a cross-tenant leak, but increased blast radius if admin session was compromised or logged.

**Fix (SEC-H1 block):** Removed the `storageKey` field from three response mappers/types in `apps/api/src/core/core.runtime.ts` and `apps/api/src/core/core.types.ts`, replacing it with a `hasDocument` boolean:

- `toAiDeliveryDeliverableSummary()` — admin deliverable list/detail (`AiDeliveryDeliverableSummary`)
- `toAiDeliveryArticleImageSummary()` — admin article image list/detail (`AiDeliveryArticleImageSummary`)
- `toAiDeliveryMonthlyReportSummary()` — admin monthly report detail (already had `hasDocument`; the redundant `storageKey` field was removed) (`AiDeliveryMonthlyReportSummary`)

`storageKey` is still fetched from Prisma internally (to compute `hasDocument`) but is no longer serialized in any list/summary JSON response. The intentional exception — admin-only, per-record `download-reference` handlers (`getAiDeliveryDeliverableDownloadReference`, `getAiDeliveryArticleImageDownloadReference`) — retains `storageKey` in its response alongside the signed `downloadUrl`, per the original recommendation below. `client-portal.runtime.ts` was audited and already excluded `storageKey` correctly (no change required there).

No provider-original-URL leak (e.g. raw Google Drive / WordPress URLs bypassing a safe wrapper) was found in `core.runtime.ts` during this pass; the only concrete finding was the `storageKey` field described above.

**Recommendation (original):** SEC-H1 block — strip `storageKey` from list/summary responses; keep `hasDocument` boolean; retain `storageKey` only on internal download-reference handlers.

**Regression coverage:** `apps/api/tests/integration/sec-h1-storage-key-leak.integration.test.ts` — asserts admin deliverable/article-image/monthly-report create, list, and detail responses never contain a `storageKey` field and correctly expose `hasDocument`; asserts client-portal project/deliverable/monthly-report responses never contain `storageKey`.

**Known follow-up (frontend, out of scope for SEC-H1 backend block):** `apps/web/src/pages/ai-delivery/AiDeliveryPage.tsx` currently reads `.storageKey` directly off deliverable/article-image records (e.g. to gate the "fetch download reference" action and to render "stored/not stored" status text). Since the API no longer returns that field, those specific UI checks will need a follow-up change to key off `hasDocument` instead. This is a functional (non-security) regression risk for the admin AI Delivery UI until that frontend follow-up lands; it does not reintroduce the storageKey leak.

---

## MEDIUM findings

### M1 — Portal work-summary overshare

**Status:** Needs spot-check. Client portal project surfaces should exclude internal ops fields. Existing smokes assert no `storageKey` in portal JSON. Re-verify `work-summary` route if added since last smoke.

### M2 — Delivery-summary internal ops leak

**Location:** `GET /api/v1/client-portal/projects/:projectId/delivery-summary`  
**Status:** Runtime uses `getClientPortalDeliverySummary` with narrowed selects in `client-portal.runtime.ts`. **Likely safe** — confirm with portal boundary smoke on each change.

### M3 — Owner role on portal approvals

**Status:** Owner users with `ClientUserAccess` may use portal approval routes. By design for operator testing; document that production client-facing accounts should use `client` role only.

### M4 — Workflow-briefs route-level role gap

**Location:** `apps/api/src/routes/workflow-briefs.ts` — uses `requireAuth` + `requireTenant` but no `requireRole` at router level; authorization delegated to runtime.  
**Status:** Runtime enforces tenant + client access. **Acceptable** if runtime tests cover client-role denial on mutating routes. Add explicit route-level `requireRole` only if a runtime gap is found.

### M5 — Email log PII

**Location:** `GET /api/v1/notifications/email-logs` — admin-only, tenant-scoped.  
**Status:** Expected for admin ops; ensure client role cannot reach this route (covered by `smoke:client-role-api-boundary:local`).

---

## LOW findings

- **L1:** Legacy `/briefs` still active in UI (`BriefPage`, `BriefPanelPage`, `ClientDashboardPage`, `ArchiveHubPage`). Not a vulnerability post-fix; consider deprecation path toward workflow-briefs.
- **L2:** `GET /briefs/admin` returns full brief records including `submittedById`. Admin-only; acceptable.

---

## Recommended next security blocks

1. **SEC-H1** — **FIXED.** Stripped `storageKey` from admin deliverable/article-image/monthly-report list/detail JSON; added regression test. Follow-up: update `AiDeliveryPage.tsx` to key off `hasDocument` instead of `storageKey` (frontend-only, not a security regression).
2. **SEC-M4** — Audit workflow-briefs mutating routes for client-role denial matrix.
3. **SEC-PORTAL** — Extend `smoke:puriva-client-portal-boundary:local` for delivery-summary field allowlist.
4. **SEC-DEPRECATE-BRIEFS** — Plan migration from legacy `/briefs` to workflow-briefs; 410 unused routes when UI migrated.
