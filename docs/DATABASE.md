# Database

## Purpose

This document describes the planned database direction for DCA OS v1.

## Current Status

The project currently has a Prisma schema foundation and a separate database gate design document.

No database migration has been approved yet.

No application database access layer has been implemented yet.

See also:

- [Database Gate Design](./database/DATABASE_GATE_DESIGN.md)

The canonical tenant-access term for future implementation is `TenantMembership`, even though the current foundation schema still uses `TenantUser` as placeholder wording.

## Planned Database Engine

PostgreSQL is the planned database engine.

## Prisma Role

Prisma is the planned ORM and schema management tool.

The data package owns Prisma schema and database-related scripts.

## Core Data Areas

The foundation schema is expected to cover:

- users
- user profiles
- tenants or companies
- tenant memberships
- sessions
- roles
- permissions
- role permissions
- user roles
- modules
- tenant module access
- settings
- audit and activity logs

## Tenant Boundary

Tenant-owned records should include a tenant or company boundary.

Global records should be explicitly designed as global.

Tenant-scoped access must be derived from membership, not direct user role assignment, in the DB-1 design.

## Soft Delete Direction

Important business records should support soft deletion where appropriate.

Soft deletion should use a nullable deleted timestamp.

## Migration Discipline

Before the first migration:

- schema should be reviewed
- local PostgreSQL setup should be prepared
- shadow database plan should be prepared
- rollback notes should be written
- migration command should be approved

## Future Database Work

Future blocks should add:

- local PostgreSQL configuration
- environment example file
- Prisma Client strategy
- initial migration
- database access layer
- repository patterns
- tenant-aware query helpers

All implementation remains blocked until the database gate design is approved.
