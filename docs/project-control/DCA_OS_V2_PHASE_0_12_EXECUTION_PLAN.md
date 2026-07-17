# DCA OS v2 Phase 0-12 Execution Plan

**Status:** Canonical sequence. Percentages represent verified implementation, not approved direction.

| Phase | Definition | Status | Implementation |
|---|---|---|---:|
| 0 | Private-agency charter, scope separation, and canonical authority | IMPLEMENTED | 100% |
| 0.5 | Read-only legacy inventory: current Tenant/Client/membership/role structures and existing isolation boundary | IMPLEMENTED | 100% |
| 0.6 | Migration sequence, authorization baseline, rollback boundary, and P1.1 acceptance criteria | IMPLEMENTED | 100% |
| 1 | Identity, tenancy, and Workspace foundation | APPROVED_DIRECTION_NOT_IMPLEMENTED | 0% |
| 2 | Backfill and reconciliation | NOT_STARTED | 0% |
| 3 | Scoped authorization and endpoint switch | NOT_STARTED | 0% |
| 4 | Legacy cleanup after stable reconciliation | NOT_STARTED | 0% |
| 5-12 | Later bounded product packages and launch preparation | NOT_STARTED | 0% |

## Phase 1 readiness baseline

Phase 1 is ready only for **P1.1 expand-only** work. Current `Tenant`, `TenantMembership`, `Role`, `Permission`, `Client`, and `ClientUserAccess` behavior remains authoritative at runtime. No Workspace behavior is implemented or client-visible.

## Package order

1. **P1.1 — expand:** add independent Workspace identity and membership structures, additive indexes, a Prisma migration, and focused isolation tests. No existing rows, endpoint behavior, sessions, or authorization paths change.
2. **P1.2 — backfill:** only after a deterministic local tool, reconciliation report, and separate review.
3. **P1.3 — reconciliation:** prove mapping completeness, uniqueness, membership treatment, and exceptions without switching callers.
4. **P1.4 — switch:** move one bounded path behind server-side deny-by-default workspace authorization and negative isolation tests.
5. **P1.5 — cleanup:** retire legacy structures only after stable reconciliation, rollback expiry, and separate review.

## P1.1 constraints and rollback

P1.1 may not access production/VPS, secrets, live Google OAuth/sync, or remote data. It must not backfill, switch, clean up, or destructively modify existing data. Its rollback is application rollback; later packages require their own reviewed rollback plans.
