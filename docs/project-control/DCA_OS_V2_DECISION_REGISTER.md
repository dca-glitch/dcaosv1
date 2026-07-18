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
| V2-007 | P1.2a–P1.4a are preparation-only; P1.2b–P1.4b execute backfill, reconciliation, and switch only after a future owner-critical gate. | DECIDED | Preparation may produce mappings, dry runs, proofs, flags, and rollback plans, but must not mutate data or activate Workspace authority. |
| V2-008 | P1.1's Workspace schema foundation is complete through `PR #60` / `14b52f8b`. | DECIDED | The completed package is additive and expand-only; `Tenant` and `Client` remain authoritative, with no client-visible or authoritative Workspace runtime behavior. |
| V2-009 | P1.2a validates only explicit proposed mappings from a sanitized local snapshot and emits dry-run plan output. | DECIDED | The tool has no database client or apply mode; it rejects execution flags and unresolved mapping, collision, orphan, unsupported, and legacy membership/role cases. |
| V2-010 | P1.3a comparison and isolation preparation is snapshot-only and flags are permanently OFF in this package. | DECIDED | It cannot reconcile, mutate, or grant Workspace authority; rollback remains a future execution-gate plan. |

## Unspecified items

Exact permission grants per role, Workspace lifecycle values beyond the initial additive foundation, and the first switched endpoint are **PENDING**. They must be specified and reviewed in their respective later packages; this does not block the expand-only foundation.

## Superseded direction

The prior broader SaaS and independent-licensee direction is superseded. Historical documents may preserve it as evidence but do not authorize new work.
