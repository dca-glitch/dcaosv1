# Database Gate

Status: design-only allowed. Planning docs are approved.

Approved now:

* DB-1 Prisma schema
* validation-only schema checks
* placeholder environment documentation
* local PostgreSQL dev setup
* database design review and planning docs
* TenantMembership canonical naming and membership-bound role direction
* DB-1 Prisma schema planning document
* DB-1 schema security review
* DB-1 Prisma relation and constraint review
* migration readiness plan
* API runtime DB integration skeleton plan
* DB readiness and health planning
* internal bootstrap planning
* seed strategy planning
* local-only DB-1 seed implementation

Blocked now:

* migrations
* `db push`
* database connection from runtime code
* seed scripts
* generated client dependency changes for production use
* runtime API DB integration
* protected DB-backed routes
* production bootstrap execution
* unsafe local seed execution

Required before implementation:

* confirm the target PostgreSQL environment
* confirm migration ownership and rollout path
* confirm whether any seed data is ever needed
* approve [Database Gate Design](../database/DATABASE_GATE_DESIGN.md)
* review [DB-1 Prisma Schema Plan](../database/DB_1_PRISMA_SCHEMA_PLAN.md)
* confirm DB-1 will not use `UserRole` for tenant access

Current review status:

* DB-1 schema reviewed and valid
* local migration created and reviewed
* migrations beyond local dev remain blocked
* runtime database access remains blocked
* Phase 7 planning docs are allowed without runtime DB changes
* local-only seed implementation is allowed when guarded by safety checks
