# DCA OS v2 Phase 0-12 Execution Plan

**Status:** Canonical sequence. Percentages represent verified implementation, not approved direction.

| Phase | Definition | Status | Implementation |
|---|---|---|---:|
| 0 | Private-agency charter, scope separation, and canonical authority | IMPLEMENTED | 100% |
| 0.5 | Read-only legacy inventory: current Tenant/Client/membership/role structures and existing isolation boundary | IMPLEMENTED | 100% |
| 0.6 | Migration sequence, authorization baseline, rollback boundary, and P1.1 acceptance criteria | IMPLEMENTED | 100% |
| 1 | Identity, tenancy, and Workspace foundation | COMPLETE (P1.1–P1.4b) | 100% |
| 2 | Backfill and reconciliation | NOT_STARTED | 0% |
| 3 | Scoped authorization and endpoint switch | NOT_STARTED | 0% |
| 4 | Legacy cleanup after stable reconciliation | NOT_STARTED | 0% |
| 5-12 | Later bounded product packages and launch preparation | NOT_STARTED | 0% |

## Phase 1 readiness baseline

P1.1 and P1.2a–P1.4a are COMPLETE. P1.2b–P1.4b are COMPLETE for the approved local scope: restore rehearsal PASS on `127.0.0.1:5435`; source `127.0.0.1:5434` migrations, backfill, reconciliation, idempotent rerun, and endpoint permission/isolation proof PASS. The result is 1 Workspace and 7 memberships (1 ADMIN, 6 CLIENT_USER), with six no-role exceptions excluded and Client/UserAccess hashes unchanged. Tenant/Client remains authoritative for per-Client scope; endpoint authority and feature flag remain `LOCAL_ONLY`.

## Phase 2 owner-decision baseline

`PHASE_2=NOT_STARTED`; `OWNER_DECISIONS=P2-A_IMPLEMENTATION_READY_AUTHORIZED`; `P2_01_POPULATION=APPROVED`; `P2_02_NO_ROLE_DISPOSITION=DECIDED`. P2-A is implementation-ready under seven owner decisions: a later owner-provided anonymized offline file only; exactly one owner-selected active Tenant represented by pseudonymous label/hash only; external evidence at `C:\dcaosv1-p2-evidence` with no cloud sync or automatic deletion; fail-closed deterministic completeness and exception handling; unchanged `ClientUserAccess` count/hash as sole per-Client authority; future P2-B/C localhost-only posture with isolated restore, fresh backup/hash, restore rehearsal, and owner-controlled resume/rollback; and P2-D reconciliation never starting Phase 3. Codex never creates a snapshot or connects to a database. This writeback and its tests use synthetic fixtures only; no snapshot is requested, created, processed, or consumed. The six known no-role memberships remain `OWNER_REMEDIATION_REQUIRED` with no default role/access, new exceptions require a new owner decision, flags remain OFF, and Tenant/Client/ClientUserAccess remain runtime authority. This authorizes only offline implementation-ready validation, not snapshot creation, database access, mutation, backfill, reconciliation execution, switch, cleanup, remote/staging/production/VPS, or Phase 3 work.

## Package order

1. **P1.1 — expand:** **IMPLEMENTED** — independent Workspace identity and membership structures, additive indexes, a Prisma migration, and focused isolation tests. No existing rows, endpoint behavior, sessions, or authorization paths change.
2. **P1.2a — preparation:** **IMPLEMENTED** — deterministic validation of an explicit proposed Tenant/Client-to-Workspace mapping plus dry-run-only plan output from a sanitized local snapshot. It rejects missing, ambiguous, duplicate/collision, orphaned, unsupported, and membership/role-exception cases; no data mutation, backfill, or reconciliation is executed.
3. **P1.3a — preparation:** **IMPLEMENTED** — deterministic comparison, negative isolation checks, OFF-only flags, and rollback plan; no reconciliation, mutation, or authoritative caller switch.
4. **P1.4a — preparation:** **IMPLEMENTED** — deterministic local sanitized staging-like rehearsal, P1.2a/P1.3a orchestration, SHA-256 evidence manifest, and fail-closed packet. It never authorizes backfill, reconciliation, a switch, or P1.2b–P1.4b execution.
5. **P1.2b–P1.4b — owner-authorized local execution gate:** **COMPLETE for the approved local scope** — approved mapping, backup/restore, rehearsal, drift, source migration/backfill/reconciliation, idempotent rerun, exact-diff review, and endpoint permission/isolation proof passed. Endpoint authority and feature flag remain `LOCAL_ONLY`; Phase 2 does not begin from this closeout.
6. **Future cleanup:** retire legacy structures only after stable reconciliation, rollback expiry, and separate review; this is not a remaining Phase 1 criterion and is not authorized by this closeout.

## P1.1 constraints and rollback

P1.1 may not access production/VPS, secrets, live Google OAuth/sync, or remote data. It must not backfill, switch, clean up, or destructively modify existing data. Its rollback is application rollback; later packages require their own reviewed rollback plans.

## P1.2b–P1.4b local execution closeout

P1.2b–P1.4b are COMPLETE for the approved local scope. The completed sequence used verified backup/restore and rehearsal on `127.0.0.1:5435`, drift controls, source `127.0.0.1:5434`, reconciliation, and the local-only endpoint proof. Scope is unique `legacyTenantId`, 1 Workspace, 1 ADMIN, 6 CLIENT_USER memberships, 6 excluded no-role memberships, and unchanged per-Client ClientUserAccess. Endpoint permission/isolation proof PASS: active ADMIN/WORKSPACE_MANAGER allow and every other role or workspace denies. Endpoint authority and feature flag remain `LOCAL_ONLY`.

## Phase 1 closeout

All Phase 1 criteria P1.1 through P1.4b are complete and evidenced. PR #67 merge commit is `55baa03d39e85819ea257127b18bc8f9094701a0`; PR #68 merge commit is `a8caea74b440e8fa9311e1c09ba24febd7f29a44`. Merge and post-merge CI PASS. Phase 2 remains out of scope.
