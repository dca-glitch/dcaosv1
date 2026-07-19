# Tenant/Client to Workspace Migration Contract

**Status:** Canonical safety contract for the DCA OS v2 Workspace transition.

## Scope and compatibility

DCA OS v2 is a private agency operations system and remains fully separate from Tellanic OS. `Workspace` is the future primary boundary. Current `Tenant`, `TenantMembership`, `Role`, `Permission`, `Client`, and `ClientUserAccess` models remain compatibility structures until a later verified switch.

## Mandatory sequence

1. **Expand** — add independent, additive structures only. Existing reads, writes, sessions, foreign keys, and authorization stay unchanged.
2. **Backfill** — create mappings only after a deterministic local tool, reconciliation report, and separate review.
3. **Reconciliation** — prove mapping completeness, uniqueness, role treatment, and exceptions before Workspace becomes an authority.
4. **Switch** — move one bounded path only with server-side deny-by-default scope enforcement and negative isolation tests.
5. **Cleanup** — retire compatibility structures only after stable reconciliation, rollback expiry, and separate review.

## P1.1: completed expand-only package

P1.1 completed in `PR #60` / `14b52f8b` with Workspace identity, membership, and role relation structures, additive indexes, and a Prisma migration. It did not:

- update, delete, or backfill existing rows;
- change existing `Tenant`/`Client` foreign keys, endpoints, sessions, or runtime authorization;
- switch query, reporting, finance, integration, material, or search scope;
- access production/VPS, secrets, live Google OAuth/sync, or remote data.

## Preparation versus execution gate

P1.2a is complete: it validates only an explicit proposed Tenant/Client-to-Workspace mapping from a sanitized local snapshot and emits deterministic dry-run plan output. It rejects missing, ambiguous, duplicate/collision, orphaned, unsupported, and legacy membership/role-exception cases. It has no database client or apply mode and cannot mutate data, execute a backfill or reconciliation, switch an authoritative path, clean up legacy structures, or apply a database migration.

P1.3a is complete: snapshot-only comparison validates expected-state shape and unique workspace records, then detects expected-state conflicts, cross-workspace membership, missing membership, and invalid roles. Its flags are OFF and it records a future rollback plan. It does not reconcile, mutate, switch authority, or change runtime behavior.

P1.4a remains deterministic sanitized preparation evidence. The owner-approved local execution gate supersedes its preparation-only authorization boundary for P1.2b–P1.4b, limited to the declared localhost targets and still fail-closed on evidence, drift, mapping, restore, reconciliation, and isolation errors.

P1.2b–P1.4b are the owner-authorized local execution package. They require approved mapping, clean reconciliation evidence, backup/restore and rollback proof, security/isolation proof, and local rehearsal before source mutation. `Tenant` and `Client` remain authoritative until the bounded endpoint switch passes.

## Phase 2 P2-01/P2-02 owner decision boundary

P2-01 approves only the population definition for a future P2-A preparation/dry-run: exactly one existing active Tenant from local source `127.0.0.1:5434`, all of that Tenant's active Clients, active TenantMemberships, and active ClientUserAccess records. P2-A must work only from an anonymized offline snapshot with a deterministic population manifest/hash. It cannot connect to a database, mutate data, activate Workspace authority, change ClientUserAccess, alter feature flags or endpoint authority, or begin Phase 2 execution.

P2-02 is decided by owner writeback: the six active TenantMembership records with no role remain excluded and untouched, are classified `OWNER_REMEDIATION_REQUIRED`, receive no default role or access, and cause no data or runtime change. This completes P2-02 documentation only. Phase 2 runtime remains `NOT_STARTED`; no backfill, reconciliation, switch, cleanup, database access, or other data operation is authorized.

## P2-A implementation-ready owner decisions

The owner authorizes a P2-A implementation-ready offline validator/consumer with these boundaries: (1) the owner prepares the anonymized offline snapshot outside Codex; Codex only validates/consumes an owner-provided file and never connects to a database; (2) the owner designates exactly one active Tenant before snapshot creation, represented only by a pseudonymous selection label and deterministic hash with no source IDs, names, PII, credentials, or raw records; (3) snapshot/evidence remain outside Git at `C:\dcaosv1-p2-evidence`, with no cloud sync or automatic deletion, and the owner decides later deletion after Phase 2 closeout; (4) completeness is fail-closed, requiring deterministic manifest/hash and complete mappings, with every unexpected absence, collision, orphan, cross-tenant link, or unknown role stopping the package; the six known no-role memberships are expected `OWNER_REMEDIATION_REQUIRED` and new exceptions require a new owner decision; (5) `ClientUserAccess` remains unchanged and is the sole per-Client visibility authority, with count/hash preserved and Workspace membership never widening access; (6) any future P2-B/C preparation is limited to localhost source `127.0.0.1:5434` and isolated restore `127.0.0.1:5435`, with fresh backup/hash and successful restore rehearsal before a separately authorized write, and owner-only resume/rollback; remote/staging/production/VPS remain forbidden; (7) P2-D reconciliation never starts Phase 3, flags remain OFF, endpoint authority remains `LOCAL_ONLY`, and Tenant/Client/ClientUserAccess remain runtime authority until separate owner approval. This authorizes implementation-ready documentation and offline validation only, not snapshot creation, database access, mutation, backfill, reconciliation execution, switch, cleanup, or Phase 3.

## Isolation and rollback

- Server-side membership and Workspace scope are required; caller-supplied identifiers are never authority.
- Client-visible serialization remains deny-by-default and cannot expose prompts, provider internals, AI cost details, raw workflow runs, credentials, `storageKey`, or admin notes.
- P1.1 rollback is application rollback because it is additive and does not alter existing rows. Backfill, switch, and cleanup require their own reviewed rollback plans.

## Phase 1 local execution closeout (authoritative)

P1.1 and P1.2a–P1.4a are COMPLETE; P1.2b–P1.4b are COMPLETE for the approved local scope. `PR #67` merged at `55baa03d39e85819ea257127b18bc8f9094701a0` and `PR #68` merged at `a8caea74b440e8fa9311e1c09ba24febd7f29a44`; merge and post-merge CI PASS. Backup/restore rehearsal PASS on `127.0.0.1:5435`; source `127.0.0.1:5434` migrations, backfill, reconciliation, and idempotent rerun PASS. The approved mapping produced 1 Workspace and 7 memberships (1 ADMIN, 6 CLIENT_USER); six no-role exceptions remain excluded and Client/UserAccess hashes are unchanged. `GET /api/admin/workspaces/:workspaceId` permission/isolation proof PASS: active ADMIN and WORKSPACE_MANAGER allow, and every other role or workspace denies. Endpoint authority and feature flag remain `LOCAL_ONLY`; automatic source overwrite, cleanup, remote environments, production/VPS, Tellanic, and Phase 2 remain prohibited.
