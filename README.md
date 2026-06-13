# DCA OS v1

Reusable SaaS operating system foundation for Digital Cube Agency.

Future production URL:

```text
system.digitalcubeagency.net
```

## Purpose

DCA OS v1 is the shared platform foundation for future Digital Cube Agency tools, dashboards, client portals, automations, finance modules, SEO modules, AI modules, reporting modules, and operational workflows.

The goal is to build reusable platform foundations once and then add future modules with less repeated work.

## Repository

```text
GitHub: https://github.com/dca-glitch/dcaosv1
Local reference path: C:\dcaosv1
```

## Workspace Structure

```text
apps/
  api/      Node.js and Express API
  web/      React and Vite frontend

packages/
  shared/   Shared TypeScript contracts
  data/     Prisma schema and database tooling

docs/        Architecture and implementation documentation
.github/     CI and dependency monitoring configuration
```

## Current Stack

- npm workspaces
- TypeScript
- React
- Vite
- Node.js
- Express
- Prisma
- PostgreSQL planned
- GitHub Actions CI

## Current Foundation

The repository currently includes:

- API application skeleton
- Web application skeleton
- Shared contracts package
- Data package with Prisma schema foundation
- Versioned API boundary
- Health route foundation
- Response helper foundation
- Error middleware foundation
- Reusable module framework
- Frontend module page patterns
- Real TypeScript and Vite validation
- Prisma schema validation
- CI workflow
- Dependency monitoring
- Project documentation

## Intentionally Not Implemented Yet

The current foundation intentionally avoids:

- database migrations
- database push commands
- seed execution
- real authentication
- production deployment
- production secrets
- tenant runtime enforcement
- feature persistence
- payment flows
- AI runtime integration

These areas will be implemented in controlled future blocks.

## Local Validation

From the repository root:

```powershell
cd C:\dcaosv1
npm.cmd run check
npm.cmd run build
npm.cmd run -w @dca-os-v1/data prisma:validate
npm.cmd run -w @dca-os-v1/data check
```

PowerShell may block `npm` through execution policy. Use `npm.cmd` on Windows.

## CI Validation

GitHub Actions runs:

```text
npm ci
npm run check
npm run build
npm run -w @dca-os-v1/data prisma:validate
npm run -w @dca-os-v1/data check
```

## Documentation Index

- `docs/PROJECT_CONTEXT.md`
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/MODULE_SYSTEM.md`
- `docs/DATABASE.md`
- `docs/TENANT_MODEL.md`
- `docs/DEPLOYMENT_PLAN.md`
- `docs/AI_MODULES.md`

## Development Rule

Use controlled implementation blocks:

```text
inspect -> report -> implement -> validate -> commit -> push
```

Terminal-dependent work should be handled by Codex/cloud or local PowerShell. Safe documentation and small repository configuration may be edited directly in GitHub.

## Next Planned Areas

1. CI result review
2. Dependency audit review
3. Local PostgreSQL planning
4. Prisma Client strategy
5. Database access layer
6. Auth planning
7. Auth implementation
8. Tenant context foundation
9. Users module MVP
10. Roles and permissions MVP
