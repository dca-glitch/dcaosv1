# DCA OS v2 Decision Register

**Status:** Canonical product and implementation decisions for DCA OS v2.

| ID | Decision | Status | Implementation consequence |
|---|---|---|---|
| V2-001 | DCA OS v2 is a private Digital Cube Agency operations system, not a SaaS product. | DECIDED | No public signup, self-service tenant creation, subscription, marketplace, licensing, or independent-licensee work. |
| V2-002 | DCA OS and Tellanic OS are fully separate scopes. | DECIDED | DCA OS v2 work must not read, modify, or rely on Tellanic files or decisions. |
| V2-003 | `Workspace` becomes the primary boundary for data, authorization, reporting, costs, integrations, materials, and search. | DECIDED | Current `Tenant` and `Client` structures remain compatibility context until the governed migration completes. |
| V2-004 | Canonical Workspace roles are `Admin`, `Workspace Manager`, `Team Member`, `Client Manager`, and `Client User`. | DECIDED | Authorization is deny-by-default and server-side; existing tenant-role enforcement remains current until a later switch. |
| V2-005 | Migration order is expand -> backfill -> reconciliation -> switch -> cleanup. | DECIDED | P1.1 is expand-only; it cannot backfill, switch callers, clean up legacy structures, or perform destructive change. |
| V2-006 | Production/VPS, secrets, live Google OAuth/sync, and destructive migration remain outside this package. | DECIDED | Local non-production development and validation only. |
| V2-007 | P1.2a–P1.4a are preparation packages; owner-authorized P1.2b–P1.4b execute only within the declared local gate. | DECIDED | Local execution requires backup/restore, exact mapping, reconciliation, isolation, drift, and review evidence; no remote or global authority is allowed. |
| V2-008 | P1.1's Workspace schema foundation is complete through `PR #60` / `14b52f8b`. | DECIDED | The completed package is additive and expand-only; `Tenant` and `Client` remain authoritative, with no client-visible or authoritative Workspace runtime behavior. |
| V2-009 | P1.2a validates only explicit proposed mappings from a sanitized local snapshot and emits dry-run plan output. | DECIDED | The tool has no database client or apply mode; it rejects execution flags and unresolved mapping, collision, orphan, unsupported, and legacy membership/role cases. |
| V2-010 | P1.3a comparison and isolation preparation is snapshot-only and flags are OFF in that preparation package. | DECIDED | It cannot reconcile or mutate; rollback requirements are carried into the owner-authorized local execution gate. |
| V2-011 | P1.4a staging-like rehearsal is local, deterministic, and snapshot-only; the owner gate permitted the bounded local execution package after evidence passed. | DECIDED | P1.2b–P1.4b are COMPLETE for the approved localhost-only scope; endpoint authority and feature flag remain `LOCAL_ONLY`. |
| V2-012 | Owner authorized P1.2b–P1.4b only on local source/restore targets. | DECIDED | The completed local scope used source `127.0.0.1:5434`, restore `127.0.0.1:5435`, backup/restore, exact mapping/roles, and one local-only endpoint proof; it did not authorize remote, production, VPS, Tellanic, cleanup, or Phase 2 work. |
| V2-013 (P2-01) | Owner approves only the future Phase 2 P2-A population definition. | DECIDED | The future P2-A scope is exactly one existing active Tenant from local source `127.0.0.1:5434`, all of that Tenant's active Clients, active TenantMemberships, and active ClientUserAccess records. P2-A must consume only an anonymized offline snapshot with a deterministic population manifest/hash; it cannot connect to a database or mutate data. This does not implement P2-A, start Phase 2, decide the six no-role memberships, or authorize backup, backfill, reconciliation, execution, remote, staging, production, VPS, or Tellanic work. |

## Unspecified items

The first switched endpoint and grants are owner-decided and locally proven for this package: `GET /api/admin/workspaces/:workspaceId`, active ADMIN/WORKSPACE_MANAGER allow, and deny-by-default otherwise. Endpoint authority and feature flag remain `LOCAL_ONLY`.

## Superseded direction

The prior broader SaaS and independent-licensee direction is superseded. Historical documents may preserve it as evidence but do not authorize new work.
Owner-approved six no-role exception execution evidence is recorded as local-only; no remote or production authorization exists.
## Phase 1 closeout
P1.1 and P1.2a–P1.4a are COMPLETE; P1.2b–P1.4b are COMPLETE for the approved local scope. PR #67 merge commit is `55baa03d39e85819ea257127b18bc8f9094701a0`; PR #68 merge commit is `a8caea74b440e8fa9311e1c09ba24febd7f29a44`. Merge and post-merge CI PASS. Restore rehearsal, source migrations/backfill/reconciliation, idempotent rerun, and endpoint permission/isolation proof PASS; 1 Workspace, 7 memberships (1 ADMIN, 6 CLIENT_USER), six excluded no-role exceptions, and unchanged Client/UserAccess hashes are verified.
