# DCA OS Lite

Reusable SaaS operating system foundation for Digital Cube Agency.

Production URL:

```text
system.digitalcubeagency.net
```

## Purpose

DCA OS Lite is the shared platform foundation for Digital Cube Agency tools, dashboards, admin/operator workflows, finance modules, SEO/content operations, AI Delivery records, reporting modules, and future controlled client review flows.

The goal is to build reusable platform foundations once and then add future modules with less repeated work.

## Current Operating State

- Product name: DCA OS Lite.
- Work is local-first on Windows PowerShell from `C:\dcaosv1`.
- Production is frozen unless explicitly approved.
- Do not deploy, touch VPS, push, or commit unless explicitly approved after review.
- ChatGPT acts as scope controller/reviewer/task writer; Codex/Copilot/local tooling executes sealed tasks.
- AI Delivery is currently admin/operator-side. Client Access / Client Portal is intentionally postponed until admin/operator modules are stable.
- Repeatable scripts are required for stability, regression, smoke, or workflow validation work.

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
- PostgreSQL
- GitHub Actions CI

## Current Foundation

The repository currently includes:

- API application and versioned `/api/v1` boundary
- Web application with shared Dark Nebula UI direction
- Shared contracts package
- Data package with Prisma schema and migrations
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
- Local auth/session/tenant/module foundations
- AI Delivery project/brief, workflow run, deliverables, deliverable review data/API/admin UI, and local review smoke foundations
- Email notification backend foundation EN1 only

## Intentionally Not Implemented Yet

The current foundation intentionally avoids:

- `db push` against shared/staging/production databases
- unapproved migrations or seed execution
- production deployment or production data changes
- production secrets
- payment flows
- real external provider execution (local deterministic/bounded AI only)
- crawling
- WordPress publishing integration (draft preparation foundation exists; full integration gated)
- GA/GSC integration
- Resend sending or API key handling
- active Client Portal / Client Access workflows

Note: AI Delivery project/brief/workflow/deliverable/review admin foundation is present but local/admin-only. Market Intelligence research/insight admin foundation is present but local/admin-only. Real external provider integrations, Client Portal, and production deployment remain guarded gates.

These areas will be implemented in controlled future blocks.

## Local Validation

From the repository root:

```powershell
cd C:\dcaosv1
npm.cmd run validate
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
inspect -> report -> implement -> validate -> review -> explicit approval -> commit/push/deploy only if approved
```

Terminal-dependent work should be handled by Codex/Copilot/local PowerShell through sealed tasks. Do not edit GitHub cloud directly, commit, push, deploy, or touch VPS/production unless explicitly approved.

## Next Planned Areas

1. Keep foundational docs/rules aligned with current local-first decisions.
2. Stabilize admin/operator AI Delivery modules before client-facing review work.
3. Keep Email Notifications at EN1 until EN2 event wiring is explicitly resumed.
4. Continue using repeatable local validation and smoke scripts for stability/regression work.

## DCA OS Lite production operating target

Before any production-related Codex/Cline/VPS/database/deployment task, read:

docs/ops/DCA_OS_LITE_OPERATING_TARGETS.md

Important:
- Production VPS: deploy@system.digitalcubeagency.net
- Expected hostname: DCA01
- Production API container: dcaosv1-api
- Production DB container: dcaosv1-postgres
- Do not use local Windows Docker context as production.
- Read-only first.
- No deletes, migrations, deploys, or restarts without explicit approval.
- Production remains frozen unless explicitly approved.
