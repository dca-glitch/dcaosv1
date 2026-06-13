# Database

## Purpose

This document describes the planned database direction for DCA OS v1.

## Current Status

The project currently has a DB-1 Prisma schema and a separate database gate design document.

No database migration has been approved yet.

No application database access layer has been implemented yet.

See also:

- [Database Gate Design](./database/DATABASE_GATE_DESIGN.md)
- [DB-1 Prisma Schema Plan](./database/DB_1_PRISMA_SCHEMA_PLAN.md)

The canonical tenant-access term is `TenantMembership`.

## Planned Database Engine

PostgreSQL is the planned database engine.

## Prisma Role

Prisma is the planned ORM and schema management tool.

The data package owns Prisma schema and database-related scripts.

## Core Data Areas

The DB-1 schema covers:

- users
- tenants
- tenant memberships
- roles
- permissions
- role permissions
- membership roles
- module definitions
- tenant module access
- tenant settings
- audit logs

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
- local PostgreSQL setup should be prepared and dev-only
- shadow database plan should be prepared
- rollback notes should be written
- migration command should be approved

## Local Development Database

The current local setup plan is a dev-only PostgreSQL container on `127.0.0.1:5434`.

The placeholder `DATABASE_URL` and local compose file should stay dev-only and must not point at production infrastructure.

## Future Database Work

Future blocks should add:

- local PostgreSQL configuration
- environment example file
- Prisma Client strategy
- initial migration
- database access layer
- repository patterns
- tenant-aware query helpers

Runtime application database implementation remains blocked until the database gate design is approved.
