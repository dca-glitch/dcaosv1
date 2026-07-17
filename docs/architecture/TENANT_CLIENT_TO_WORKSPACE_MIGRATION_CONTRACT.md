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

## P1.1: initial expand-only package

P1.1 may add Workspace identity, membership, and role relation structures with additive indexes and a Prisma migration. It must not:

- update, delete, or backfill existing rows;
- change existing `Tenant`/`Client` foreign keys, endpoints, sessions, or runtime authorization;
- switch query, reporting, finance, integration, material, or search scope;
- access production/VPS, secrets, live Google OAuth/sync, or remote data.

## Preparation versus execution gate

P1.2a–P1.4a may prepare mapping validation, dry-run capability, reconciliation comparison tooling, feature-flagged inactive paths, authorization/isolation proof, rollback plans, and staging-rehearsal evidence. They must not backfill, execute reconciliation, switch an authoritative path, clean up legacy structures, or apply a database migration.

P1.2b–P1.4b are future execution-only packages. They require approved mapping, dry-run and clean reconciliation evidence, backup/restore and rollback proof, security/isolation proof, staging rehearsal, and explicit owner acceptance. `Tenant` and `Client` remain authoritative and no Workspace client-facing authority is activated until that gate passes.

## Isolation and rollback

- Server-side membership and Workspace scope are required; caller-supplied identifiers are never authority.
- Client-visible serialization remains deny-by-default and cannot expose prompts, provider internals, AI cost details, raw workflow runs, credentials, `storageKey`, or admin notes.
- P1.1 rollback is application rollback because it is additive and does not alter existing rows. Backfill, switch, and cleanup require their own reviewed rollback plans.
