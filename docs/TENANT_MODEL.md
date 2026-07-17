# Legacy Tenant Compatibility Model

## Purpose

DCA OS v2 is a private Agency Operations System for Digital Cube Agency. This document describes the current `Tenant` implementation as a compatibility boundary; it does not define future SaaS direction.

Canonical operating model: [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md).

## What is a tenant?

| Tenant type | Example | Role |
|-------------|---------|------|
| **Current legacy Tenant** | Digital Cube Agency | Current organizational compatibility boundary used by runtime and data |
| **Target Workspace** | Internal Brand or External Client | Future primary boundary, introduced by Phase 1 expand-only work |

**Internet domains are not tenants.** Each domain is a **`Client`** record inside a tenant.

## Tenant examples

**Today:**

- **Digital Cube Agency LLC** — one tenant for agency operations and system operation

There are no future independent licensee tenants. Existing names, fields, modules, and migrations that use Tenant/licensee wording are legacy implementation context until safely retired.

## Client vs tenant

| Concept | Represents |
|---------|------------|
| `Tenant` | Current organizational compatibility boundary |
| `Client` | One operational domain or agency client unit (`clientKind`: `AGENCY_CLIENT` \| `OWN_DOMAIN`) |

Do not confuse CRM `Client` with the target `Workspace`. External companies served by DCA are current `Client` records and will reconcile to `EXTERNAL_CLIENT` Workspaces; no public tenant creation or licensee conversion is planned.

## Finance boundary

| Tenant | Finance scope |
|--------|----------------|
| Digital Cube Agency LLC | Invoices/bills for **agency clients** (`AGENCY_CLIENT`) only |
| Licensee tenant | Finance for that legal entity's own domains — **not** in DCA LLC tenant |

Own-domain assets (`OWN_DOMAIN`) must not post invoices in DCA LLC Finance. They migrate to the licensee company's tenant.

## Membership

Users access tenants through membership records.

A membership connects:

- user
- tenant
- role assignments through membership-bound roles
- status

Canonical design name: `TenantMembership`.

DB-1 implementation uses `TenantMembership` directly.

## Approved role set (MVP)

| Role | Scope |
|------|-------|
| `owner` | Full admin in tenant |
| `admin` | Full operational admin in tenant |
| `client` | Client Portal only; scoped by `ClientUserAccess` per Client |

Granular per-module permission expansion is deferred. Client portal access is **per Client (domain)**, not per project.

## Tenant context

Most API requests should execute inside a tenant context.

Tenant context should be resolved before business logic runs.

## Global context

Some records are global by design.

Examples:

- module definitions
- global permission definitions
- system-level settings definitions

Global records must be clearly separated from tenant-owned records.

## Tenant-owned data

Tenant-owned data may include:

- clients (domains / agency clients)
- projects
- invoices (scoped per tenant finance rules above)
- bills
- reports
- settings values
- activity logs
- publication targets and encrypted credentials (per client, tenant-scoped storage)

## Module entitlements

A tenant may have access to selected modules via `TenantModule`.

This supports:

- DCA LLC enabling AI Delivery, Finance, Market Intelligence internally
- Licensees enabling only licensed modules (e.g. Finance + AI Delivery)

**Enforcement:** middleware `requireTenantModule` is designed; full API enforcement is deferred to implementation block 6 (see roadmap).

## Future tenant middleware

Backend middleware should resolve:

- authenticated user
- selected tenant
- active membership
- role (`owner` \| `admin` \| `client`)
- module entitlement context (when block 6 is active)
- client portal scope (`ClientUserAccess`) when role is `client`

## Tenant safety rule

A feature is not complete until tenant ownership and tenant access rules are clear.

Tenant access rules should be derived from membership and `ClientUserAccess`, not from arbitrary client-supplied IDs.

The binding transition rules are in [`architecture/TENANT_CLIENT_TO_WORKSPACE_MIGRATION_CONTRACT.md`](./architecture/TENANT_CLIENT_TO_WORKSPACE_MIGRATION_CONTRACT.md).
