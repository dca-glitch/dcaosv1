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

## Isolation and rollback

- Server-side membership and Workspace scope are required; caller-supplied identifiers are never authority.
- Client-visible serialization remains deny-by-default and cannot expose prompts, provider internals, AI cost details, raw workflow runs, credentials, `storageKey`, or admin notes.
- P1.1 rollback is application rollback because it is additive and does not alter existing rows. Backfill, switch, and cleanup require their own reviewed rollback plans.

## Owner-authorized local execution gate (pre-execution)

**OWNER_EXECUTION_AUTHORIZED_LOCAL_ONLY / EXECUTION_PENDING_EVIDENCE**. Source is exactly `127.0.0.1:5434`; restore/rehearsal is exactly `127.0.0.1:5435`. A verified backup/restore precedes source mutation. The only mapping is one approved Tenant to one Workspace through unique FK-free `legacyTenantId`. The only role translations are `owner→ADMIN` and six approved `client→CLIENT_USER`; six no-role memberships are excluded and unchanged. `ClientUserAccess` remains mandatory per-Client authority. The first switch is `GET /api/admin/workspaces/:workspaceId`, allowing active ADMIN and WORKSPACE_MANAGER only; all other roles, missing/inactive membership, and cross-workspace access deny. The flag is default OFF and local-only after reconciliation. Any abort condition stops execution; automatic source overwrite, cleanup, remote environments, production/VPS, and Tellanic remain prohibited.
