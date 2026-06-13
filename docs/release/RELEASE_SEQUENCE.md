# Release Sequence

## Phase 1 - Foundation

- workspace
- validation
- CI
- dependency monitoring
- docs
- module strategy

## Phase 2 - Database

- Database Runtime Gate
- local PostgreSQL approval/setup
- Prisma migration approval
- seed/bootstrap approval
- data access runtime boundary

## Phase 3 - Auth

- auth runtime implementation
- session persistence
- login/logout/me
- middleware
- tenant/RBAC/module runtime
- admin reset
- frontend auth

## Rule

Complete the Database Runtime Gate and its prerequisite steps before any real auth runtime implementation.

## Phase 4 - Tenant Context

- active tenant
- membership checks
- tenant-aware API context

## Phase 5 - Platform Modules

- team access
- settings
- activity
- overview metrics

## Phase 6 - Business Modules

- company records
- work management
- contacts
- reports
- billing area

## Phase 7 - Automation Modules

- planning queue
- knowledge base
- SEO module
- portal foundation
- AI workflow foundation

## Rule

Complete each phase through its gate before moving to risky implementation.
