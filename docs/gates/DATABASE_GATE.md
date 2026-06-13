# Database Gate

Status: design-only allowed.

Approved now:

* Prisma schema foundation
* validation-only schema checks
* placeholder environment documentation

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
