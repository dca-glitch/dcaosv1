# External Audit Brief

## Project Overview

DCA OS v1 is a reusable SaaS operating system foundation for Digital Cube Agency. The current MVP establishes local auth/session runtime, tenant context, module registry, read-only Team and Settings screens, and local smoke validation.

## Current MVP Scope

Implemented local MVP flows:

- Login and logout.
- Session context resolution.
- Active tenant membership context.
- Tenant switch.
- Module registry and tenant module enablement.
- Team read-only page.
- Settings read-only page.
- Local MVP smoke script.

Current modules:

- Core.
- User Settings.
- Finance Lite placeholder only.

## Architecture Summary

- `apps/api`: Express API with versioned routes under `/api/v1`.
- `apps/web`: React/Vite frontend shell.
- `packages/data`: Prisma schema, migrations, seed, and data-layer checks.
- `packages/shared`: shared module contracts, permissions, and API types.
- PostgreSQL is the planned database; local dev uses Docker on `127.0.0.1:5434`.

## Deployment Status

Current status is local only. No VPS deployment has been performed. No production database is connected. VPS staging is planned but blocked until deployment gate review, staging env preparation, migration plan approval, and smoke strategy are complete.

## Explicit Out Of Scope

- OAuth.
- Invite flow.
- Password reset.
- Billing.
- Marketplace.
- Finance Lite migration.
- Production deployment.
- Client access.

## Testing Evidence Available

- `npm.cmd run validate`.
- `npm.cmd run -w @dca-os-v1/data prisma:validate`.
- `npm.cmd run smoke:mvp:local`.
- GitHub CI is expected green for current pushed base.
- MVP readiness docs and VPS staging plan exist.

## Suggested Auditor Approach

- Code review of auth/session runtime and token handling.
- Threat model for API, frontend, database, and deployment boundary.
- Authentication review using OWASP Authentication guidance.
- Session management review using OWASP Session Management guidance.
- Authorization and route guard review using the authorization matrix.
- Tenant isolation review using the tenant isolation test plan.
- Deployment readiness review before VPS staging.
- SaaS multi-tenant data isolation and operational review before client access.
