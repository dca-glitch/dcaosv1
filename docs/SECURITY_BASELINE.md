# Security Baseline

This repository is in a medium-security foundation-hardening phase.

Approved now:

* workspace validation
* build validation
* Prisma schema validation only
* CI checks that do not require secrets or database services
* placeholder environment documentation
* local PostgreSQL dev setup planning and dev-only config
* documentation-only auth, tenant, RBAC, bootstrap, and DB planning
* local-only guarded DB-1 seed execution
* frontend protected-shell planning and placeholder components
* controlled password auth strategy planning and skeleton work after gate review
* auth runtime preparation planning and boundary constants before real auth implementation
* password helper foundation and session helper foundation without runtime auth
* auth context middleware skeleton
* tenant access resolver skeleton
* permission resolver skeleton
* module access resolver skeleton
* auth implementation preflight gate
* auth audit write strategy
* database runtime gate

Blocked now:

* real authentication
* password/session/JWT handling
* real database persistence
* migrations
* `db push`
* deployment
* direct user-bound tenant roles in DB-1
* real auth runtime before Auth Gate approval
* runtime tenant middleware
* runtime RBAC middleware
* runtime tenant access resolution
* runtime permission resolution
* runtime module entitlement resolution
* runtime API DB integration
* unsafe local seed execution

Rules for contributors:

* Do not add production secrets to the repository.
* Do not commit real `.env` files.
* Do not wire runtime code to a real database yet.
* Keep validation commands non-destructive.
* Keep tenant access and audit rules append-only or review-gated in design docs before implementation.
