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

## Unspecified items

Exact permission grants per role, Workspace lifecycle values beyond the initial additive foundation, and the first switched endpoint are **PENDING**. They must be specified and reviewed in their respective later packages; this does not block the expand-only foundation.

## Superseded direction

The prior broader SaaS and independent-licensee direction is superseded. Historical documents may preserve it as evidence but do not authorize new work.
