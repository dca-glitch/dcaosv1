# P2-B Owner Execution Gate

Status: `DOCS_ONLY_AUTHORIZED` / `EXECUTION_NOT_AUTHORIZED` / `PHASE_2_RUNTIME_NOT_STARTED`

This document is the fillable, future single-use owner execution-gate framework for Phase 2. It is a **documentation and governance** package only. It does **not** authorize product code changes, database access, snapshot creation or consumption, exporter execution, backup/restore, mutation, backfill, reconciliation execution, switch, cleanup, Phase 3, remote/staging/production/VPS, live OAuth or analytics implementation, secrets access, costs, legal/privacy actions, or Tellanic work.

Phase 1 remains **COMPLETE**. Phase 2 runtime remains **NOT_STARTED**. The P2-A offline validator is `IMPLEMENTATION_READY_AUTHORIZED` (synthetic fixtures only). The P2-A owner exporter remains `BUILD_ONLY_AUTHORIZED` / `EXECUTION_NOT_AUTHORIZED`. Filling this gate packet in the future still requires a separate explicit single-use owner authorization before any write package (P2-C).

## Scope and non-authorization

| In scope for this document | Out of scope / not authorized by this document |
|---|---|
| Gate field definitions and owner decision form | Real snapshot creation or consumption |
| Environment, evidence, abort, and rollback contracts | Database connection, Docker, Prisma migrate/apply |
| P2-C acceptance criteria (future) | Backfill execution (P2-C) |
| P2-D reconciliation/reviewer requirements (future) | Reconciliation execution (P2-D) |
| Explicit Phase 3 exclusion | Endpoint/flag/authority switch (Phase 3) |
| Machine-readable empty field schema | Any identifiers, PII, connection strings, or real hashes |

## Exact population selection

Future gate approval must record:

- Exactly one owner-selected active Tenant from local source `127.0.0.1:5434` (per V2-013 / P2-01).
- All of that Tenant’s active Clients, active TenantMemberships, and active ClientUserAccess records.
- Representation in an anonymized offline snapshot only: pseudonymous `selection.tenantLabel` and deterministic `selection.tenantSelectionHash` (SHA-256 of the label). Source IDs, names, e-mail addresses, PII, credentials, connection strings, and raw records are prohibited in the gate packet and evidence summaries committed to Git.

## Pseudonymous manifest and hash requirements

| Requirement | Rule |
|---|---|
| Schema | `DCA_OS_V2_P2_A_SNAPSHOT_V1` (or successor explicitly approved in the gate) |
| Manifest algorithm | `SHA-256` |
| Canonicalization | `SORTED_KEYS_AND_DECLARED_RECORD_ORDER_V1` (or successor explicitly approved) |
| Input identity | `manifest.inputSha256` must match the approved snapshot file byte-for-byte after canonicalization |
| Selection identity | `tenantSelectionHash` must equal SHA-256 of `tenantLabel` |
| Drift | Any manifest/hash mismatch aborts before write |

Do not paste real hashes or labels into this repository template. Record them only in the filled gate packet under the external evidence directory.

## Mapping version, role matrix, and no-role exception matrix

| Field | Required content |
|---|---|
| `mappingVersion` | Explicit version string for the approved Tenant/Client → Workspace mapping |
| `roleMatrix` | Approved Workspace role assignments for memberships that receive roles (must not invent roles outside `WorkspaceRoleKey`) |
| `noRoleExceptionMatrix` | Exactly six known no-role memberships classified `OWNER_REMEDIATION_REQUIRED`; `defaultRole: null`; `accessGranted: false` |
| New exceptions | Any new no-role or unknown-role case requires a **new** owner decision before the gate may be approved |

Broader legacy-role translation beyond the P1 local matrix and the six no-role exceptions remains **NOT_APPROVED** until a separate owner decision.

## ClientUserAccess and Workspace-derived-grants invariants

| Invariant | Required value |
|---|---|
| `ClientUserAccess` remains sole per-Client visibility authority | **Yes** (V2-019) |
| `accessInvariant.clientUserAccessCount` | Must match approved pre-write baseline |
| `accessInvariant.clientUserAccessSha256` | Must match approved pre-write baseline |
| `workspaceDerivedGrants` | **0** — Workspace membership must never widen client access |
| Mutation of `ClientUserAccess` during P2-C | **Forbidden** |

## Environment contract

| Role | Exact target |
|---|---|
| Source database | `127.0.0.1:5434` only |
| Isolated restore rehearsal | `127.0.0.1:5435` only |
| Remote / staging / production / VPS | **Forbidden** |

### Evidence path (one physical location)

| Host | Path |
|---|---|
| Windows | `C:\dcaosv1-p2-evidence` |
| WSL | `/mnt/c/dcaosv1-p2-evidence` |

These paths refer to the **same** directory. It is the single canonical future evidence store. It remains outside Git, with no cloud sync and no automatic deletion. Later deletion is an owner decision after Phase 2 closeout.

## Immutable diff identity and approved artifact versions

Before any future P2-C write, the filled gate must record:

- Git commit SHA of the approved tooling/docs baseline used for the run
- Mapping version and role/exception matrix versions
- Snapshot schema version and `manifest.inputSha256`
- Pre-write backup SHA-256 (fresh; P1 backup SHA is **not** reusable as authority)
- Expected post-write Workspace / membership / role counts (population-specific; not copied from P1 constants as authority)
- Feature-flag posture: **OFF**
- Endpoint authority: **LOCAL_ONLY**

## Security, privacy, and independent review

| Control | Requirement |
|---|---|
| Secrets | Do not inspect, print, or embed `.env`, connection strings, credentials, or OAuth material in the gate packet |
| PII | Gate packet and Git-facing summaries use pseudonymous keys only |
| Deny-by-default | No Workspace membership may grant portal visibility |
| Client exposure | Clients must not see prompts, provider internals, AI costs, raw workflow runs, credentials, `storageKey`, or admin-only notes |
| Independent review | Every material code or policy diff requires a distinct read-only reviewer decision on the exact unchanged diff (`APPROVE_READ_ONLY` or `REQUEST_CHANGES`) plus green CI before eligible merge |
| Executor boundary | Cursor and Codex have equal repository autonomy for ordinary bounded work; **one executor owns one file area at a time** |

## Fresh backup, hash, and restore-rehearsal prerequisites

Before any future write (P2-C):

1. Create a **fresh** backup of the approved source population/environment.
2. Record backup SHA-256 in the filled gate packet (external evidence only).
3. Perform an isolated restore rehearsal on `127.0.0.1:5435` and record PASS.
4. Fail closed if backup, hash, or restore rehearsal fails.

The completed P1 backup SHA is historical local evidence only and must not authorize a new Phase 2 write.

## Drift checks, abort taxonomy, evidence preservation, no-cleanup

### Drift checks (pre-write and pre-commit of results)

- Target host/port mismatch
- Manifest/hash or selection-hash mismatch
- Unexpected tenant/client/membership/`ClientUserAccess` count or hash
- Active writer present
- Unexpected no-role or unknown-role exception
- Orphan, cross-tenant, or cross-workspace relation
- Any flag or endpoint-authority change requested or observed
- Any client-access expansion or internal-field exposure

### Abort taxonomy

Abort **before** a write (or stop immediately if detected mid-run), preserve evidence, and do **not** auto-cleanup when any of the following occurs:

| Code (illustrative) | Condition |
|---|---|
| `ABORT_TARGET` | Target ≠ approved localhost source/restore |
| `ABORT_MAPPING` | Missing, ambiguous, duplicate, or colliding mapping |
| `ABORT_DRIFT` | Active writer or population drift |
| `ABORT_EXCEPTION` | Unapproved role/no-role exception |
| `ABORT_RELATION` | Orphan or cross-tenant/cross-workspace relation |
| `ABORT_ACCESS` | `ClientUserAccess` count/hash change or `workspaceDerivedGrants ≠ 0` |
| `ABORT_AUTHORITY` | Flag/endpoint/authority change |
| `ABORT_PROOF` | Backup, restore rehearsal, reconciliation, idempotency, or negative isolation proof failure |
| `ABORT_EXPOSURE` | Client-facing access expansion or internal-field exposure |

### Evidence preservation and no-cleanup rule

On abort or failure: preserve all evidence artifacts under the canonical evidence directory. **No** automatic source overwrite, cleanup, deletion of legacy structures, or deletion of Workspace records is allowed as rollback or recovery. Only the owner decides resume or rollback.

## Owner-only resume / rollback decision form

Fill only under a future single-use owner authorization. Do not commit real identifiers to Git.

| Field | Value (owner fills externally) |
|---|---|
| `gateId` | Unique single-use gate identifier |
| `decision` | `RESUME` \| `ROLLBACK` \| `ABORT_HOLD` |
| `reason` | Short owner rationale |
| `rollbackProcedureRef` | Reference to the reviewed restore procedure used |
| `evidencePathConfirmed` | `C:\dcaosv1-p2-evidence` ↔ `/mnt/c/dcaosv1-p2-evidence` |
| `ownerSignoff` | Owner name/date (external record) |
| `runtimeAuthorityUnchanged` | Must remain `Tenant` / `Client` / `ClientUserAccess` |

Rollback restores only the approved target from the fresh backup and preserves audit/evidence artifacts. Tenant/Client/`ClientUserAccess` remain the operational fallback until a separately approved Phase 3 switch.

## P2-C execution acceptance criteria (future; not authorized now)

P2-C remains **NOT_STARTED** / **NOT_AUTHORIZED** until this gate is filled and single-use owner-approved. When authorized, acceptance requires:

- Exact approved population, mapping version, role matrix, exception matrix, and environment match the gate
- Serializable transaction; idempotent upserts; active-writer and drift guards
- Expected Workspace memberships/roles exactly match the approved matrix
- Unapproved/no-role records remain untouched and classified
- `ClientUserAccess` count/hash unchanged; `workspaceDerivedGrants = 0`
- Zero authority, feature-flag, or endpoint changes
- Idempotent rerun produces zero additional Workspace/membership/role rows and identical evidence summaries

## P2-D reconciliation, invariants, and reviewer requirements (future; not authorized now)

P2-D remains **NOT_STARTED** / **NOT_AUTHORIZED** until after successful P2-C. When authorized:

- Independently compare source legacy records and created Workspace records
- Verify completeness, uniqueness, exception disposition, unchanged `ClientUserAccess` hashes, idempotent rerun, and negative cross-workspace evidence
- Record an independent reviewer decision on the exact unchanged recon evidence
- **Must not** start Phase 3

## Explicit Phase 3 exclusion

The following remain **Phase 3**, not Phase 2, and are **NOT_AUTHORIZED** by this gate:

- Enabling or broadening Workspace authority beyond the existing local proof endpoint
- Changing `WORKSPACE_LOCAL_ENDPOINT_ENABLED` or the local-only predicate
- Switching any client/admin read or write path to Workspace scope
- Granting access from Workspace membership instead of tenant-role and `ClientUserAccess` checks
- Changing client serialization, portal visibility, search, reporting, finance, integrations, or material scope

Existing local proof endpoint `GET /api/admin/workspaces/:workspaceId` remains `LOCAL_ONLY` and must not be promoted by Phase 2.

## Machine-readable gate packet field schema

Empty schema for a future filled packet stored **only** under the external evidence directory. No real data. No snapshot template containing identifiers.

```text
gatePacketVersion: "DCA_OS_V2_P2_B_GATE_V1"
status: "UNFILLED" | "OWNER_APPROVED_SINGLE_USE" | "CONSUMED" | "ABORTED" | "ROLLED_BACK"
authorization: "EXECUTION_NOT_AUTHORIZED_UNTIL_OWNER_SINGLE_USE"
phase2Runtime: "NOT_STARTED"
population:
  tenantLabel: ""                    # pseudonymous only
  tenantSelectionHash: ""            # SHA-256 of label; fill externally
  mappingVersion: ""
  roleMatrixVersion: ""
  noRoleExceptionMatrixVersion: ""
environment:
  sourceHostPort: "127.0.0.1:5434"
  restoreHostPort: "127.0.0.1:5435"
  remoteStagingProductionVps: "FORBIDDEN"
evidence:
  windowsPath: "C:\\dcaosv1-p2-evidence"
  wslPath: "/mnt/c/dcaosv1-p2-evidence"
  samePhysicalLocation: true
  cloudSync: false
  automaticDeletion: false
artifacts:
  toolingCommitSha: ""
  snapshotSchemaVersion: ""
  manifestInputSha256: ""
  backupSha256: ""
  restoreRehearsal: "PENDING" | "PASS" | "FAIL"
invariants:
  clientUserAccessCount: null        # integer; fill externally; never commit real value to Git
  clientUserAccessSha256: ""
  workspaceDerivedGrants: 0
  featureFlags: "OFF"
  endpointAuthority: "LOCAL_ONLY"
  runtimeAuthority: "Tenant/Client/ClientUserAccess"
securityReview:
  reviewerDecision: ""               # APPROVE_READ_ONLY | REQUEST_CHANGES
  reviewerIdentity: ""
  exactDiffSha: ""
abort:
  taxonomyRef: "P2_B_OWNER_EXECUTION_GATE.md#abort-taxonomy"
  evidencePreserved: true
  noAutomaticCleanup: true
ownerDecision:
  gateId: ""
  decision: ""                       # RESUME | ROLLBACK | ABORT_HOLD
  reason: ""
  ownerSignoff: ""
phase3: "EXCLUDED"
p2c: "NOT_AUTHORIZED"
p2d: "NOT_AUTHORIZED"
```

## Related authority

- Decision Register: V2-013–V2-027 (P2 population, P2-A, posture, analytics direction, autonomy, evidence path, this gate)
- Discovery: [`../discovery/PHASE_2_BACKFILL_RECONCILIATION_DISCOVERY_REPORT.md`](../discovery/PHASE_2_BACKFILL_RECONCILIATION_DISCOVERY_REPORT.md)
- P2-A offline foundation: [`P2_A_OFFLINE_FOUNDATION.md`](./P2_A_OFFLINE_FOUNDATION.md)
- P2-A exporter (build-only): [`P2_A_OWNER_LOCAL_EXPORTER.md`](./P2_A_OWNER_LOCAL_EXPORTER.md)
- Migration contract: [`../architecture/TENANT_CLIENT_TO_WORKSPACE_MIGRATION_CONTRACT.md`](../architecture/TENANT_CLIENT_TO_WORKSPACE_MIGRATION_CONTRACT.md)
- Operator runbook §2.6: [`../operator/OPERATOR_RUNBOOK.md`](../operator/OPERATOR_RUNBOOK.md)
