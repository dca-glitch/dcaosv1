# Database Gate

Status: design-only allowed.

Approved now:

* Prisma schema foundation
* validation-only schema checks
* placeholder environment documentation
* database design review and planning docs
* TenantMembership canonical naming and membership-bound role direction
* DB-1 Prisma schema planning document

Blocked now:

* migrations
* `db push`
* database connection from runtime code
* seed scripts
* generated client dependency changes for production use

Required before implementation:

* confirm the target PostgreSQL environment
* confirm migration ownership and rollout path
* confirm whether any seed data is ever needed
* approve [Database Gate Design](../database/DATABASE_GATE_DESIGN.md)
* review [DB-1 Prisma Schema Plan](../database/DB_1_PRISMA_SCHEMA_PLAN.md)
* confirm DB-1 will not use `UserRole` for tenant access
