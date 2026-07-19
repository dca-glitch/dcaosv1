# Phase 2 Backfill and Reconciliation Discovery Report

**Mode:** DISCOVERY_ONLY / READ_ONLY_RUNTIME / DOCUMENTATION_OUTPUT_ONLY
**Verdict:** `P2-02_OWNER_DECISION_RECORDED; PHASE_2_NOT_STARTED`
**Baseline examined:** `main` at `db033bfb07f980c206c45c03208ba7b3bf42bb57`
**Phase 1:** COMPLETE; **Phase 2:** NOT_STARTED; **Phase 3:** NOT_STARTED

## 1. Executive verdict

Discovery is sufficient to preserve bounded owner decisions, but not to authorize implementation or execution. The canonical Phase 2 label, **Backfill and reconciliation**, overlaps in words with work completed under the tightly bounded P1.2b–P1.4b local gate. The completed P1 work is a single, fixed local population and explicitly did not start Phase 2. Owner decisions P2-01 and P2-02 are recorded; the P2-02 decision only keeps six no-role memberships excluded and untouched, classifies them as `OWNER_REMEDIATION_REQUIRED`, assigns no default role, grants no access, and makes no data or runtime change. The remaining role-policy, reconciliation, evidence, and execution authority remain unresolved.

`P2-02_OWNER_DECISION_RECORDED` means only that the disposition of the six no-role memberships is documented. It does **not** mean `READY_FOR_EXECUTION`, does not change Phase 2 status, and does not authorize a database, schema, flag, endpoint, remote, staging, production, VPS, Tellanic, or client-facing change.

## 2. Confirmed baseline and method

- Local `main` was clean and matched `origin/main` at `db033bfb07f980c206c45c03208ba7b3bf42bb57` before this report branch was created.
- Read sources: the authority chain in `AGENTS.md`, all seven requested Phase 1 canonical documents, the Phase 1 authorization matrix, Workspace schema/migrations, P1 tooling/tests, local endpoint implementation/tests, and Git history for PR #67, #68, and #69.
- Graphify-first query was used before broad code navigation.
- No `.env` file, secret, live OAuth, remote environment, production/VPS, staging, database connection, backup/restore, backfill, reconciliation execution, flag change, endpoint switch, or Tellanic content was accessed.
- **P2-01 writeback (2026-07-19):** the owner approves only a future P2-A population definition: exactly one existing active Tenant from local source `127.0.0.1:5434`, all of that Tenant's active Clients, active TenantMemberships, and active ClientUserAccess records. P2-A must use an anonymized offline snapshot with a deterministic population manifest/hash; it cannot connect to a database or mutate data.
- **P2-02 owner decision writeback:** the six active no-role memberships remain excluded and untouched, are classified `OWNER_REMEDIATION_REQUIRED`, receive no default role or access, and cause no data or runtime change. This is documentation-only; Phase 2 remains `NOT_STARTED`.
- The only targeted dynamic checks were unit tests that do not connect to a database: P1.2a (8 PASS), P1.3a (4 PASS), P1.4a (4 PASS), and execution/backup argument guards (2 PASS). An attempted Vitest invocation is not evidence against the API logic: these three API files use `node:test` and Vitest reported `No test suite found`; full repository validation remains the final validation gate for this report.

## 3. What Phase 1 already completed

The authoritative closeout in the canonical documents records:

- P1.1 and P1.2a–P1.4a COMPLETE.
- P1.2b–P1.4b COMPLETE **only for the approved local scope**.
- PR #67 merge `55baa03d39e85819ea257127b18bc8f9094701a0`, PR #68 merge `a8caea74b440e8fa9311e1c09ba24febd7f29a44`, and their merge/post-merge CI evidence PASS.
- Restore rehearsal on local `127.0.0.1:5435` PASS; source local `127.0.0.1:5434` migration, backfill, reconciliation, idempotent rerun, and endpoint permission/isolation proof PASS.
- One Workspace was created/bound through nullable, unique, FK-free `legacyTenantId`.
- Seven Workspace memberships were created: one `ADMIN` and six `CLIENT_USER`. Six active legacy memberships with no role were deliberately excluded, unchanged, and evidenced as exceptions.
- Client and `ClientUserAccess` population hashes were preserved. The endpoint and feature flag remain `LOCAL_ONLY`; Tenant/Client remains authoritative for per-Client scope.

This is evidence of a bounded local migration rehearsal and execution, not evidence of broader Workspace authority, remote readiness, a complete role translation policy, or a Phase 2 start.

## 4. Exact Phase 2 delta scope

### Completed P1 local package

`packages/data/scripts/p1-execution-local.mjs` is deliberately a one-population tool. It contains an approved local tenant binding, seven named membership slots, expected Client and `ClientUserAccess` SHA-256 population hashes, expected active counts, and a six-no-role exception count. Its target guard only accepts localhost source `5434` or restore `5435`; its write path is explicit, serializable, and idempotent through Workspace and membership-role upserts.

### Canonical Phase 2

The execution plan says **Phase 2 — Backfill and reconciliation — NOT_STARTED — 0%**. P2-01 resolves the future P2-A population boundary and P2-02 resolves the six no-role disposition. The remaining Phase 2 scope is still limited to these unresolved questions:

1. the P2-01-approved one-active-Tenant local population, represented only in a future offline snapshot;
2. durable reconciliation of the per-Client relationship while `ClientUserAccess` remains the authority; or
3. a future owner-approved scope beyond P2-01/P2-02.

P2-01 does not imply any execution scope beyond its population definition. Phase 2 still requires a new evidence contract and must not reuse P1's hard-coded identifiers or infer authority from the fact that P1's local execution passed.

### Phase 3 boundary

Phase 2 ends with reconciled data and immutable evidence while keeping existing runtime authority unchanged. Phase 3 begins only when a separately reviewed package proposes scoped authorization or an endpoint switch. In particular, the following are **Phase 3, not Phase 2**:

- enabling or broadening Workspace authority;
- changing `WORKSPACE_LOCAL_ENDPOINT_ENABLED` or the local-only predicate;
- switching any client/admin read or write path to Workspace scope;
- granting access from Workspace membership instead of tenant-role and `ClientUserAccess` checks;
- changing client serialization, public/client portal visibility, search, reporting, finance, integrations, or material scope.

The existing local endpoint, `GET /api/admin/workspaces/:workspaceId`, is a P1 proof path only. It remains default-off outside `NODE_ENV=development`, demands `127.0.0.1:5434`, and allows only active `ADMIN` or `WORKSPACE_MANAGER`. It must not be promoted or treated as a Phase 2 switch.

## 5. Code, schema, tooling, flags, and evidence inventory

| Area | Current asset | Reuse value | Boundary |
|---|---|---|---|
| Schema | `Workspace`, `WorkspaceMembership`, `WorkspaceMembershipRole`, additive migrations, unique `legacyTenantId` | Model and uniqueness constraints | No schema change is authorized; `legacyTenantId` remains FK-free and nullable. |
| P1 mapping | `p1-2a-mapping-dry-run.mjs` | Deterministic sanitized-snapshot validation | Read-only; rejects execution flags; current role exceptions block a generic mapping. |
| P1 reconciliation preparation | `p1-3a-reconciliation-preparation.mjs` | Expected-state comparison, isolation exception taxonomy, rollback template | Read-only; both flags hard-coded OFF; it is not live reconciliation. |
| P1 rehearsal packet | `p1-4a-staging-rehearsal-gate-packet.mjs` | Sanitized evidence manifest, exact diff identity, fail-closed checks | Preparation only; no authority to execute Phase 2. |
| P1 local execution | `p1-execution-local.mjs` | Transactional/idempotent pattern, local-target guard, drift/hash checks, abort vocabulary | Scope is hard-coded to the completed P1 population; cannot safely become a generic Phase 2 runner. |
| Backup/restore rehearsal | `p1-local-backup-rehearsal.mjs` | Existing restore and evidence shape | Explicitly forbidden in this discovery; any future use needs a separate owner gate. |
| Endpoint proof | `workspace-local-endpoint.config.ts`, `workspace-admin.*` | Default-off and deny-by-default test pattern | `LOCAL_ONLY`; no Phase 2 authority change. |
| Existing client scope | `ClientUserAccess` schema/runtime/tests | Preserve per-Client access hashes and negative access proof | Remains current per-Client authorization; Workspace membership cannot replace it in Phase 2. |
| Evidence | PR #67/#68 closeout, local backup SHA-256, restoration/migration/reconciliation/idempotency/isolation results | Baseline/provenance and expected proof format | Historical local evidence is not approval for a new population or environment. |

## 6. Anonymized data state and exceptions

The following values are static evidence constraints in the completed P1 runner, not a fresh database inspection in this discovery:

| Item | Anonymized/count-only state |
|---|---|
| Approved P1 tenant population | 1 active tenant |
| Active Client population protected by P1 hash | 789; SHA-256 recorded in the P1 runner, not reproduced here |
| Active `ClientUserAccess` population protected by P1 hash | 279; SHA-256 recorded in the P1 runner, not reproduced here |
| Active legacy tenant memberships | 13 |
| P1 migrated Workspace memberships | 7: 1 `ADMIN`, 6 `CLIENT_USER` |
| Excluded active no-role membership exceptions | 6; deliberately not translated; classified `OWNER_REMEDIATION_REQUIRED` |
| Preserved access distribution check | 35 active Client User grants and 244 active owner grants |

No personal names, e-mail addresses, raw user IDs, client IDs, tenant IDs, connection strings, or raw records appear in this report. A future approved preparation package should derive new counts and salted/approved evidence hashes from a sanitized snapshot, not copy the P1 constants.

## 7. Current authority and security boundaries

- **Tenant/Client:** remain runtime authority. Existing reads, writes, sessions, foreign keys, and tenant-role enforcement do not change in Phase 2.
- **Workspace:** a data foundation plus bounded local proof. It is not the runtime authority for client scope, search, reporting, finance, integrations, materials, or general API access.
- **`ClientUserAccess`:** continues to govern per-Client portal visibility. Active membership alone must not make a Client User see a Client, project, deliverable, report, prompt, provider metadata, costs, credentials, `storageKey`, or admin note.
- **Flags:** P1 preparation flags are OFF. The endpoint is enabled only with development mode, an explicit true flag, and exact local source database target.
- **Endpoint:** only `GET /api/admin/workspaces/:workspaceId` was proven, and only as local `ADMIN`/`WORKSPACE_MANAGER` metadata access with deny-by-default responses. There is no approved general Workspace routing surface.

## 8. Client-safety and cross-workspace risks

1. Translating a no-role legacy membership into any Workspace role would create access without a current legacy-role basis.
2. Mapping `CLIENT_USER` memberships without retaining unchanged `ClientUserAccess` could widen a user from explicit per-Client access to all Clients in a Workspace.
3. A tenant-to-workspace mapping collision, duplicate slug, orphaned Client, or cross-tenant `ClientUserAccess` link could cause cross-workspace association.
4. Activating an endpoint or flag while reconciliation is incomplete can make an otherwise correct data backfill into an authorization switch.
5. Reusing P1's fixed expected counts/hashes for a new population would create false assurance and can conceal drift.
6. A multi-role translation without an owner-approved precedence/effective-permission model can grant administrative capability to client-facing users.
7. Any client serializer that starts reading Workspace relations before a Phase 3 isolation package risks exposing internal fields even if route-level checks pass.

## 9. Technical gaps

- P2-01 defines the population boundary, but no canonical machine-readable input contract, tenant-selection rule, snapshot-creation procedure, or deterministic manifest/hash schema exists.
- P2-02 provides an approved disposition for the six no-role exceptions, but no broader role-translation policy exists for any role or case beyond P1's one owner and six client cases.
- No generic, parameterized execution runner exists; P1 runner is intentionally hard-coded and cannot be widened safely.
- No Phase 2 reconciliation invariants define completeness across Tenant, Client, `TenantMembership`, `ClientUserAccess`, Workspace, and WorkspaceMembership relationships.
- No Phase 2 evidence schema specifies input hashes, output hashes, row-level anomaly classification, retention, reviewer identity, or acceptable drift window.
- P2-01 does not authorize any non-local environment; remote, staging, production, and VPS remain prohibited. A future environment decision would require separate owner authorization.
- No approved backup/restore/rollback runbook exists for a new Phase 2 population; P1 proof cannot be replayed as authorization.
- No endpoint-by-endpoint inventory declares which future reads remain strictly Phase 3; only one local proof endpoint exists.

## 10. Business and governance gaps

- P2-01 selects the future P2-A population category but not the tenant identity, execution scope, or authority to read/create the snapshot.
- P2-02 resolves the six known no-role memberships as excluded, untouched, and `OWNER_REMEDIATION_REQUIRED`; no default role or access is authorized. Any broader legacy-role translation policy remains unapproved.
- It is unapproved whether Client Users receive a Workspace membership for every relevant client relationship, and what that membership can ever mean while per-Client scope remains authoritative.
- The owner has not approved a Phase 2 environment posture; remote/staging is not implied and remains prohibited.
- The acceptable completeness threshold, anomaly disposition SLA, and rollback decision authority are undefined.

## 11. Owner decisions required before any Phase 2 package

1. P2-01 is decided: future P2-A covers exactly one existing active local-source Tenant and all of its active Clients, TenantMemberships, and ClientUserAccess records, represented only in an anonymized offline snapshot with deterministic manifest/hash.
2. **P2-02 is decided:** keep the six no-role exceptions excluded and untouched as `OWNER_REMEDIATION_REQUIRED`; infer no default role and grant no access. Any broader legacy-role translation matrix remains open.
3. Confirm the tenant-selection and snapshot-creation authority for P2-A. Remote/staging/production/VPS remain prohibited and are not included by P2-01.
4. Define Phase 2 completeness: required mappings, allowed nulls, tolerated anomalies, hash/count rules, and who accepts exceptions.
5. Confirm that `ClientUserAccess` remains unchanged and authoritative for client-safe visibility throughout Phase 2.
6. Approve the backup, restore rehearsal, rollback owner, abort authority, and evidence retention requirements for the selected population.
7. Confirm the Phase 3 handoff criterion: reconciled data alone must not enable a flag or endpoint; a separate authorization/switch proposal is required.

## 12. Proposed smallest safe Phase 2 packages

These are proposals only. None is authorized by this report.

1. **P2-A — preparation/dry-run:** use the P2-01-approved one-active-Tenant population only through an anonymized offline snapshot; create the deterministic population manifest/hash, validate deterministic tenant-to-workspace mappings, classify all exceptions, and prove the runner has no database client or apply mode. P2-01 does not implement or authorize this package.
2. **P2-B — owner execution gate:** submit the exact population, mapping, role exception decisions, expected reconciliation invariant set, immutable diff identity, backup/restore plan, target environment, security review, abort conditions, and rollback owner. The gate must be explicit and single-use.
3. **P2-C — execution:** only after P2-B approval, run a parameterized but fail-closed backfill against the approved target. It must use a serializable transaction, idempotent upserts, active-writer/drift guards, and zero authority/flag/endpoint changes.
4. **P2-D — reconciliation evidence:** independently compare source legacy records and created Workspace records; verify completeness, uniqueness, exception disposition, unchanged `ClientUserAccess` hashes, idempotent rerun, and negative cross-workspace evidence. Record a reviewer decision. Do not start Phase 3.

## 13. Proposed acceptance criteria

For an owner-approved P2 package, all criteria must be met before closeout:

- Exact P2-01 population selection, deterministic snapshot manifest/hash, mapping version, role matrix, and environment are recorded and match the approved input.
- Sanitized dry-run is deterministic and returns zero unaccepted blockers.
- Every binding is unique; no Workspace maps to multiple tenants; no duplicate or slug collision occurs.
- All expected Workspace memberships and roles exactly match the approved matrix; all unapproved/no-role records remain untouched and classified.
- `ClientUserAccess` count/hash and client-scope invariants are unchanged unless a separately approved package says otherwise.
- Reconciliation reports zero orphan, cross-tenant, cross-workspace, missing membership, invalid role, or unauthorized-access findings.
- Rerun is idempotent: zero additional Workspace, membership, or role records and identical evidence summaries.
- Feature flags remain OFF and endpoint authority remains `LOCAL_ONLY`.
- Independent exact-diff review, validation, and the approved evidence gate pass.

## 14. Abort conditions

Abort before a write, and preserve evidence without cleanup, when any of the following occurs:

- target differs from the approved local target or an unapproved remote/staging/production/VPS target is detected;
- missing, ambiguous, duplicate, or collision mapping;
- active writer/drift check fails;
- unexpected tenant, client, membership, role, `ClientUserAccess`, or hash/count state;
- any no-role or legacy-role exception lacks explicit owner disposition;
- orphaned or cross-tenant/cross-workspace relation;
- backup/restore rehearsal, reconciliation, idempotency, or negative isolation proof fails;
- any flag/endpoint authority change is requested or observed;
- a client-facing access expansion, raw internal-field exposure, or authorization fallback is detected.

## 15. Rollback requirements

- P2 execution requires a fresh, approved, encrypted-at-rest-as-applicable backup and an isolated verified restore rehearsal for the exact selected population/environment; no P1 backup may be reused as authority.
- Rollback must be a reviewed, tested procedure that restores only the approved target and preserves audit/evidence artifacts.
- No automatic source overwrite, cleanup, deletion of legacy structures, or deletion of Workspace records is allowed as rollback.
- Tenant/Client and `ClientUserAccess` remain the operational fallback authority until a separately approved Phase 3 switch.
- Any partial execution, drift, or reconciliation mismatch requires stop, evidence preservation, return to existing runtime authority, and owner review.

## 16. Recommended next safe package

**P2-A, owner-approved preparation/dry-run only.** Its sole deliverable should be a sanitized, parameterized Phase 2 population and mapping contract plus deterministic exception classification. It should not connect to a database, create a migration, alter schema, write Workspace records, perform reconciliation execution, toggle flags, or alter endpoint authority. The output should be a decision packet for P2-B, not an execution authorization.

## 17. Explicit safety flags

```text
DISCOVERY_ONLY=YES
PHASE_2=NOT_STARTED
OWNER_DECISIONS=IN_PROGRESS
P2_01_POPULATION=APPROVED
P2_02_NO_ROLE_DISPOSITION=DECIDED
DATA_MUTATION=NO
BACKFILL_EXECUTED=NO
RECONCILIATION_EXECUTED=NO
WORKSPACE_AUTHORITY_CHANGED=NO
FEATURE_FLAGS_CHANGED=NO
ENDPOINT_AUTHORITY_CHANGED=NO
PHASE_2_STARTED=NO
SCHEMA_CHANGED=NO
BACKUP_RESTORE_EXECUTED=NO
PRODUCTION_VPS_TOUCHED=NO
REMOTE_DATABASE_TOUCHED=NO
TELLANIC_TOUCHED=NO
```
