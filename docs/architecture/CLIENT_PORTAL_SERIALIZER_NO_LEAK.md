# Client Portal Serializer No-Leak Boundary

**Status:** Architecture note for G565–G569 (Lane 9).  
**Scope:** Client-facing JSON / download envelopes only.

Related:

- [`CLIENT_PORTAL_BOUNDARY.md`](./CLIENT_PORTAL_BOUNDARY.md)
- [`../runbooks/CLIENT_PORTAL_G565_G576_CLOSEOUT.md`](../runbooks/CLIENT_PORTAL_G565_G576_CLOSEOUT.md)
- Implementation: `apps/api/src/core/client-portal-serializer.ts`
- Runtime serializers: `apps/api/src/core/client-portal.runtime.ts`
- Forbidden-key helpers: `apps/api/src/core/client-portal-error-safety.ts`

---

## Rule

Client portal responses must never include:

| Category | Examples |
|---|---|
| Storage | `storageKey`, raw `tenants/...` object paths |
| Provider | `provider`, `providerMetadata` |
| Cost | `actualCostUsd`, `estimatedCostUsd`, `rawCost`, `costRows` |
| Workflow / queue | `workflowRunId`, `workflowRunStatus`, `jobQueueStatus`, `queueStatus`, `executionLog` |
| Audit / admin | `auditLog(s)`, `adminSummaryNotes`, `adminNotes` |
| Internal IDs | `miHandoffId`, `releasePackageId`, `structuredInputJson`, `promptScaffold` |

Allowed client substitutes:

- `exportUrl` / signed `downloadUrl` + `expiresSeconds`
- `hasDocument` (boolean derived from internal `storageKey`)
- Archive statuses only: deliverables `DELIVERED` \| `ACCEPTED`; monthly reports `FINAL` (non-archived)

---

## Helpers

| Helper | Role |
|---|---|
| `stripClientPortalForbiddenKeys` | Defensive omit of forbidden keys |
| `assertClientPortalSerializerNoLeak` | Assert + optional raw-fragment check |
| `toClientPortalSafeDownloadReference` | Build download envelope without echoing `storageKey` |
| `isClientPortalArchiveDeliverableStatus` | Archive status allowlist |
| `isClientPortalArchiveMonthlyReportStatus` | FINAL-only monthly archive |

Download handlers in `client-portal.runtime.ts` consume `storageKey` internally and return only the safe envelope.

---

## Tests

Focused unit coverage lives in `client-portal-serializer.test.ts` (G565–G569, G571–G572) and complementary error/UI tests (G570). Approval mutation policy depth remains Lane 10.
