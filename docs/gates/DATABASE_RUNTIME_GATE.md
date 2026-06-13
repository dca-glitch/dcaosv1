# Database Runtime Gate

Status: not yet approved for runtime database wiring.

This gate is the next step after database design and local PostgreSQL planning. It exists to keep runtime database work separate from design-only schema and auth planning.

## Approved Prerequisites

- DB-1 schema design reviewed
- local PostgreSQL planning exists
- migration readiness planning exists
- data access layer planning exists
- auth audit write strategy planned

## Required Before Runtime Database Wiring

1. Human Owner approves local DB start.
2. Start local PostgreSQL.
3. Confirm local DB health.
4. Human Owner approves first local migration.
5. Run migration.
6. Review generated migration.
7. Human Owner approves seed/bootstrap.
8. Run seed/bootstrap.
9. Create data access runtime boundary.
10. Resume real auth runtime.

## Not Approved Here

- migrations
- `db push`
- runtime API DB connection
- seed execution
- protected DB-backed routes
- auth runtime implementation

## Recommendation

Complete the runtime gate before any real login, session persistence, or tenant-aware DB access work begins.
