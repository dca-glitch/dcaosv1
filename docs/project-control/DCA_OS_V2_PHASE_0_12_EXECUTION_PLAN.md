# DCA OS v2 Phase 0-12 Execution Plan

**Status:** Canonical sequence. Percentages represent verified implementation, not approved direction.

| Phase | Definition | Status | Implementation |
|---|---|---|---:|
| 0 | Private-agency charter, scope separation, and canonical authority | IMPLEMENTED | 100% |
| 0.5 | Read-only legacy inventory: current Tenant/Client/membership/role structures and existing isolation boundary | IMPLEMENTED | 100% |
| 0.6 | Migration sequence, authorization baseline, rollback boundary, and P1.1 acceptance criteria | IMPLEMENTED | 100% |
| 1 | Identity, tenancy, and Workspace foundation | IN_PROGRESS | 20% |
| 2 | Backfill and reconciliation | NOT_STARTED | 0% |
| 3 | Scoped authorization and endpoint switch | NOT_STARTED | 0% |
| 4 | Legacy cleanup after stable reconciliation | NOT_STARTED | 0% |
| 5-12 | Later bounded product packages and launch preparation | NOT_STARTED | 0% |

## Phase 1 readiness baseline

Phase 1 is ready only for **P1.1 expand-only** work. The P1.1 schema foundation is implemented; current `Tenant`, `TenantMembership`, `Role`, `Permission`, `Client`, and `ClientUserAccess` behavior remains authoritative at runtime. No Workspace behavior is client-visible or authoritative.

## Package order

1. **P1.1 — expand:** **IMPLEMENTED** — independent Workspace identity and membership structures, additive indexes, a Prisma migration, and focused isolation tests. No existing rows, endpoint behavior, sessions, or authorization paths change.
2. **P1.2a — preparation:** mapping validation and dry-run-only backfill tooling; no data mutation.
3. **P1.3a — preparation:** reconciliation comparison tooling, security/isolation proof, feature-flagged inactive paths, and rollback planning; no authoritative caller switch.
4. **P1.4a — preparation:** staging-rehearsal evidence and execution-gate packet only; no backfill, reconciliation execution, or switch.
5. **P1.2b–P1.4b — future execution gate:** actual backfill, reconciliation execution, and bounded authorization/data-path switch require approved mapping, dry-run and reconciliation evidence, backup/restore and rollback proof, security/isolation proof, staging rehearsal, and explicit owner acceptance. They must complete before Phase 2 begins.
6. **P1.5 — cleanup:** retire legacy structures only after stable reconciliation, rollback expiry, and separate review.

## P1.1 constraints and rollback

P1.1 may not access production/VPS, secrets, live Google OAuth/sync, or remote data. It must not backfill, switch, clean up, or destructively modify existing data. Its rollback is application rollback; later packages require their own reviewed rollback plans.
