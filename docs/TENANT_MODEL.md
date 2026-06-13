# Tenant Model

## Purpose

DCA OS v1 is intended to be multi-tenant.

A tenant represents a company, client, or operating unit inside the platform.

## Tenant Examples

Possible tenants:

- Digital Cube Agency
- DCA client company
- internal test company
- future product workspace

## Membership

Users access tenants through membership records.

A membership connects:

- user
- tenant
- role assignments through membership-bound roles
- status

Canonical design name: `TenantMembership`.

DB-1 implementation uses `TenantMembership` directly.

## Tenant Context

Most API requests should eventually execute inside a tenant context.

Tenant context should be resolved before business logic runs.

## Global Context

Some records are global by design.

Examples:

- module definitions
- global permission definitions
- system-level settings definitions

Global records must be clearly separated from tenant-owned records.

## Tenant-Owned Data

Tenant-owned data may include:

- projects
- clients
- contacts
- invoices
- bills
- reports
- settings values
- activity logs

## Module Entitlements

A tenant may have access to selected modules.

This supports future client plans and module-based product packaging.

## Future Tenant Middleware

Future backend middleware should resolve:

- authenticated user
- selected tenant
- active membership
- permission context
- module entitlement context

## Tenant Safety Rule

A feature is not complete until tenant ownership and tenant access rules are clear.

Tenant access rules should be derived from membership, not direct user role assignment.
