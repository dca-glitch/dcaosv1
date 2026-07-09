# Security Boundary Audit — Post SEC-B1 Mega Block

**Date:** 2026-07-09  
**Scope:** Client Portal / admin API tenant boundaries after SEC-B1 fix. Read-only code audit; no live exploit execution.

**Related:** [`docs/runbooks/PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md`](../runbooks/PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md) · [`docs/STATUS.md`](../STATUS.md)

---

## Executive summary

| Severity | Count | Status |
|----------|-------|--------|
| BLOCKER | 1 | **FIXED** — SEC-B1 legacy `/api/v1/briefs` cross-tenant IDOR |
| HIGH | 1 | **OPEN** — admin deliverables API returns raw `storageKey` |
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

## HIGH — H1: Admin deliverables expose `storageKey`

**Location:** `apps/api/src/core/core.runtime.ts` — `toAiDeliveryDeliverableSummary()` returns `storageKey` on `GET /api/v1/ai-delivery-projects/:id/deliverables`.

**Risk:** Internal bucket object keys visible to any authenticated owner/admin in tenant. Not a cross-tenant leak, but increases blast radius if admin session is compromised or logged.

**Recommendation:** SEC-H1 block — strip `storageKey` from list/summary responses; keep `hasDocument` boolean; retain `storageKey` only on internal download-reference handlers.

**Not fixed in this block** — scoped to SEC-B1 only.

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

1. **SEC-H1** — Strip `storageKey` from admin deliverable list/detail JSON; add regression test.
2. **SEC-M4** — Audit workflow-briefs mutating routes for client-role denial matrix.
3. **SEC-PORTAL** — Extend `smoke:puriva-client-portal-boundary:local` for delivery-summary field allowlist.
4. **SEC-DEPRECATE-BRIEFS** — Plan migration from legacy `/briefs` to workflow-briefs; 410 unused routes when UI migrated.
