# DCA OS v1 Roadmap

## Current Status

DCA OS v1 has a clean reusable foundation, dependency lockfile, real validation, CI, dependency monitoring, and project context documentation.

## Completed

- Block 0: repository initialization and identity verification
- Blocks 1-10: initial SaaS foundation
- Block 11: dependencies and real validation
- Block 12: CI validation and dependency monitoring foundation

## Next Controlled Blocks

### Block 13 — CI Result Review and Repair

Goal: confirm GitHub Actions CI passes and repair workflow/code only if CI fails.

Allowed:

- inspect CI result
- fix CI-only issues
- fix small validation errors

Not allowed:

- no migrations
- no database connection
- no deployment
- no feature work

### Block 14 — Targeted Dependency Audit Review

Goal: inspect the npm audit findings and decide safe targeted upgrades.

Allowed:

- run `npm audit`
- inspect vulnerability path
- propose targeted upgrade plan
- apply only safe patch/minor updates if clearly isolated

Not allowed:

- no `npm audit fix --force`
- no broad dependency replacement
- no package manager switch

### Block 15 — Local PostgreSQL Planning

Goal: plan local PostgreSQL setup without applying migrations.

Deliverables:

- Docker Compose plan
- database names
- user names
- shadow database plan
- `.env.example` only

Not allowed:

- no database connection from app
- no migrations
- no seeds

### Block 16 — Prisma Client Strategy

Goal: define controlled Prisma Client installation/generation strategy.

Deliverables:

- package boundary decision
- generated client location decision
- scripts plan
- validation approach

Not allowed:

- no migrations unless separately approved
- no application DB integration yet

### Block 17 — Database Access Layer

Goal: add a safe backend data access abstraction after Prisma Client strategy is approved.

Deliverables:

- database client module
- repository/service boundary
- error normalization
- no feature persistence yet unless approved

### Block 18 — Auth Planning

Goal: design auth before implementation.

Deliverables:

- controlled login model
- session model
- password hashing strategy
- cookie/session security rules
- tenant membership resolution
- permission evaluation model
- password reset and lockout plan

### Block 19 — Auth Implementation MVP

Goal: implement controlled local auth MVP.

Scope depends on Block 18 approval.

### Block 20 — Tenant Context Foundation

Goal: every API request can resolve tenant context safely.

### Block 21 — Users Module MVP

Goal: implement reusable users module using approved auth and tenant context.

### Block 22 — Roles and Permissions MVP

Goal: implement reusable role/permission foundation.

### Block 23 — Module Registry MVP

Goal: implement runtime module registry and tenant module entitlement checks.

### Block 24 — Settings MVP

Goal: implement platform and tenant settings foundation.

### Block 25 — Audit/Activity MVP

Goal: record important user/system events.

### Block 26 — Dashboard MVP

Goal: render tenant-aware dashboard cards from module registry.

### Block 27 — Projects Module MVP

Goal: first reusable business module after platform foundation.

## Release Gates

### Foundation Gate

Required before DB/auth work:

- CI passing
- dependency audit reviewed
- validation scripts stable
- project context docs updated

### Database Gate

Required before first migration:

- PostgreSQL setup approved
- Prisma Client strategy approved
- schema reviewed
- rollback plan documented

### Auth Gate

Required before auth implementation:

- controlled login model approved
- session model approved
- password hashing approved
- cookie strategy approved
- tenant membership rules approved
- permission rules approved

### Deployment Gate

Required before VPS deployment:

- local validation passing
- environment variable map complete
- database backup/rollback plan
- Caddy/domain plan
- deployment checklist
