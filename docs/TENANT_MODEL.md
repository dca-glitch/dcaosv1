# Tenant Model

## Purpose

DCA OS v1 is intended to be multi-tenant.

A tenant represents a **SaaS workspace / licensee instance** — not a single internet domain.

Canonical operating model: [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md).

## What is a tenant?

| Tenant type | Example | Role |
|-------------|---------|------|
| **Operator / licensor** | Digital Cube Agency LLC | Runs DCA OS for agency clients; licenses OS to other companies |
| **Licensee** (future) | Independent company owning own-domain brands | Separate tenant; Finance and modules per license agreement |

**Internet domains are not tenants.** Each domain is a **`Client`** record inside a tenant.

## Tenant examples

**Today:**

- **Digital Cube Agency LLC** — one tenant for agency operations and system operation

**Future:**

- **Spółka A Sp. z o.o.** — licensee tenant (one independent company per own domain or grouped per legal entity after migration)
- Each licensee uses modules licensed from Digital Cube Agency LLC via `TenantModule`

## Client vs tenant

| Concept | Represents |
|---------|------------|
| `Tenant` | Company/workspace using DCA OS (DCA LLC or licensee) |
| `Client` | One operational domain or agency client unit (`clientKind`: `AGENCY_CLIENT` \| `OWN_DOMAIN`) |

Do not confuse CRM `Client` with “client company as tenant.” External companies served by DCA are `Client` records with `clientKind = AGENCY_CLIENT` inside the DCA LLC tenant unless they later become OS licensees themselves.

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

## Changelog

| Date | Change |
|------|--------|
| 2026-06-26 | Aligned with CLIENT_DOMAIN_OPERATING_MODEL: tenant = licensee workspace; Client = domain; finance separation; role set |
