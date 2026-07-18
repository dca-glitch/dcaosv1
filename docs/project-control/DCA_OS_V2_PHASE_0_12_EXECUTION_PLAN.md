# DCA OS v2 Phase 0-12 Execution Plan

**Status:** Canonical sequence. Percentages represent verified implementation, not approved direction.

| Phase | Definition | Status | Implementation |
|---|---|---|---:|
| 0 | Private-agency charter, scope separation, and canonical authority | IMPLEMENTED | 100% |
| 0.5 | Read-only legacy inventory: current Tenant/Client/membership/role structures and existing isolation boundary | IMPLEMENTED | 100% |
| 0.6 | Migration sequence, authorization baseline, rollback boundary, and P1.1 acceptance criteria | IMPLEMENTED | 100% |
| 1 | Identity, tenancy, and Workspace foundation | IN_PROGRESS (P1.1–P1.4a complete; future execution remains owner-gated) | 20% |
| 2 | Backfill and reconciliation | NOT_STARTED | 0% |
| 3 | Scoped authorization and endpoint switch | NOT_STARTED | 0% |
| 4 | Legacy cleanup after stable reconciliation | NOT_STARTED | 0% |
| 5-12 | Later bounded product packages and launch preparation | NOT_STARTED | 0% |

## Phase 1 readiness baseline

P1.1–P1.4a preparation is complete. P1.4a adds deterministic local sanitized rehearsal, evidence hashes, and a fail-closed execution-gate packet without reconciliation execution or authority switch. Its packet remains `EXECUTION_NOT_AUTHORIZED` / `OWNER_ACCEPTANCE_REQUIRED`. The next eligible work is only the future **P1.2b–P1.4b owner-critical execution gate**; Tenant/Client remains authoritative. Phase 1 stays at 20% because preparation does not implement execution.

## Package order

1. **P1.1 — expand:** **IMPLEMENTED** — independent Workspace identity and membership structures, additive indexes, a Prisma migration, and focused isolation tests. No existing rows, endpoint behavior, sessions, or authorization paths change.
2. **P1.2a — preparation:** **IMPLEMENTED** — deterministic validation of an explicit proposed Tenant/Client-to-Workspace mapping plus dry-run-only plan output from a sanitized local snapshot. It rejects missing, ambiguous, duplicate/collision, orphaned, unsupported, and membership/role-exception cases; no data mutation, backfill, or reconciliation is executed.
3. **P1.3a — preparation:** **IMPLEMENTED** — deterministic comparison, negative isolation checks, OFF-only flags, and rollback plan; no reconciliation, mutation, or authoritative caller switch.
4. **P1.4a — preparation:** **IMPLEMENTED** — deterministic local sanitized staging-like rehearsal, P1.2a/P1.3a orchestration, SHA-256 evidence manifest, and fail-closed packet. It never authorizes backfill, reconciliation, a switch, or P1.2b–P1.4b execution.
5. **P1.2b–P1.4b — future execution gate:** actual backfill, reconciliation execution, and bounded authorization/data-path switch require approved mapping, dry-run and reconciliation evidence, backup/restore and rollback proof, security/isolation proof, staging rehearsal, and explicit owner acceptance. They must complete before Phase 2 begins.
6. **P1.5 — cleanup:** retire legacy structures only after stable reconciliation, rollback expiry, and separate review.

## P1.1 constraints and rollback

P1.1 may not access production/VPS, secrets, live Google OAuth/sync, or remote data. It must not backfill, switch, clean up, or destructively modify existing data. Its rollback is application rollback; later packages require their own reviewed rollback plans.
