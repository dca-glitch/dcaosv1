# Client Portal Route / Surface Inventory

**Status:** Inventory for DCA OS Lite client portal (G206 / G339).
**Scope:** Route and surface map only — no smoke execution, no deploy.

Related:

- [`docs/architecture/CLIENT_PORTAL_BOUNDARY.md`](../architecture/CLIENT_PORTAL_BOUNDARY.md)
- [`docs/modules/CLIENT_PORTAL_PLAN.md`](../modules/CLIENT_PORTAL_PLAN.md)
- Router: `apps/api/src/routes/client-portal.ts`
- Web hash router: `apps/web/src/pages/client-portal/ClientPortalRouter.tsx`

---

## Web hash surfaces

| Hash | View | Notes |
|---|---|---|
| `#/client-portal` | Archive shell | Final deliverables + FINAL monthly reports |
| `#/monthly-reports` | Same archive shell | Alias into portal archive |
| `#/client-portal/pending-approvals` | Pending approvals list | Client approval inbox entry |
| `#/client-portal/briefs` | Legacy briefs page | `BriefPage` intake/status |
| `#/client-portal/deliverables/:id/approve` | Approval editor | Article + image review |
| `#/archive` | Separate archive hub | Not the portal shell |

---

## API routes (`/api/v1/client-portal`)

All require auth + tenant unless noted.

### Identity / projects

| Method | Path | Purpose |
|---|---|---|
| GET | `/my-client` | Primary client access summary |
| GET | `/projects` | Client-accessible AI delivery projects |
| GET | `/projects/:projectId` | Project summary |
| GET | `/projects/:projectId/delivery-summary` | Client-safe delivery summary |
| GET | `/projects/:projectId/release-package` | Finalized release package snapshot |
| GET | `/projects/:projectId/catalog-products` | Catalog products |
| POST | `/projects/:projectId/catalog-inquiries` | Catalog inquiry submit |

### Archive (final only)

| Method | Path | Purpose |
|---|---|---|
| GET | `/projects/:projectId/deliverables` | `DELIVERED` / `ACCEPTED` only |
| GET | `/projects/:projectId/deliverables/:deliverableId/download` | Signed download ref; no `storageKey` |
| GET | `/projects/:projectId/monthly-reports` | `FINAL` non-archived list |
| GET | `/projects/:projectId/monthly-reports/:reportId` | FINAL detail + work/performance summaries |
| GET | `/projects/:projectId/monthly-reports/:reportId/download` | Signed download ref; no `storageKey` |

### Approvals

| Method | Path | Purpose |
|---|---|---|
| GET | `/pending-approvals` | Pending approvals for allowed clients |
| GET | `/clients/:clientId/pending-approvals` | Scoped pending list |
| GET | `/deliverables/:deliverableId/for-approval` | Approval detail |
| PATCH | `/deliverables/:deliverableId/body` | Client body edit while pending |
| PATCH | `/deliverables/:deliverableId/metadata` | Client metadata edit while pending |
| GET | `/deliverables/:deliverableId/edit-history` | Client-visible edit history |
| PATCH | `/deliverables/:deliverableId/images/:imageId/approve` | Image approve |
| PATCH | `/deliverables/:deliverableId/images/:imageId/reject` | Image reject + reason |
| PATCH | `/deliverables/:deliverableId/images/:imageId/undo` | Undo image review |
| PATCH | `/deliverables/:deliverableId/approve` | Approve article |
| PATCH | `/deliverables/:deliverableId/reject` | Request changes / reject article |

---

## Ownership map (implementation)

| Concern | Primary files |
|---|---|
| Archive serializers / FINAL guards | `apps/api/src/core/client-portal.runtime.ts` |
| Approval runtime | `apps/api/src/core/client-portal-approval.runtime.ts` |
| Approval policy (pure) | `apps/api/src/core/client-portal-approval-policy.ts` |
| Error / payload safety | `apps/api/src/core/client-portal-error-safety.ts` |
| Edit runtime | `apps/api/src/core/client-portal-edit.runtime.ts` |
| Controllers | `apps/api/src/controllers/client-portal-approval.controller.ts` |
| Routes | `apps/api/src/routes/client-portal.ts` |
| Web API helpers | `apps/web/src/pages/client-portal/client-portal-api.ts` |

---

## Admin vs client route posture (G340)

| Surface family | Client token | Owner/admin token |
|---|---|---|
| `/api/v1/client-portal/projects*` archive + FINAL reports | Allowed when `ClientUserAccess` matches | Same access rules when membership includes client access; otherwise 403/404 |
| `/api/v1/client-portal/pending-approvals` + approval mutations | Allowed for client-only roles | Owner may list pending; approval/edit mutations return forbidden for owner/admin |
| `/api/v1/client-portal/deliverables/:id/approve|reject|images/*` | Client-only | Forbidden for owner/admin via approval helpers |
| Admin AI Delivery / workflow / storage / cost routes | 401/403 | Allowed per admin RBAC |

Hash surfaces under `#/client-portal*` are client-facing. `#/archive` remains a separate hub and must not be treated as a substitute for portal FINAL guards.
