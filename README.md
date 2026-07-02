# DCA OS

Modular SaaS operating system for Digital Cube Agency (also referred to as DCA OS Lite in repo docs).

**System domains (approved):**

| Domain | Role |
|--------|------|
| `system.digitalcubeagency.net` | Final production login and DCA OS application location |
| `digitalcubeagency.net` | Public product website for DCA OS |
| `digitalcubeagency.com` | Public agency website / lead generation |

Canonical operating model: [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md).

Phase F local closeout (Blocks 58–77): [`docs/ROADMAP_LOCAL_COMPLETION_PHASE_F.md`](docs/ROADMAP_LOCAL_COMPLETION_PHASE_F.md).

Production URL:

```text
system.digitalcubeagency.net
```

Post-merge deployment note: PR #43 is merged into `main`, and local `main` is synced to `origin/main`. Current `main` is **not deployed** to production. `system.digitalcubeagency.net` remains a live production VPS target, not a confirmed staging target.

## Purpose

DCA OS is the shared platform foundation for Digital Cube Agency tools, dashboards, admin/operator workflows, finance modules, SEO/content operations, AI Delivery records, reporting modules, and Client Portal MVP delivery for agency clients.

The goal is to build reusable platform foundations once and then add future modules with less repeated work.

## Current Operating State

- Product name: **DCA OS** (DCA OS Lite in repo/package naming).
- **MVP 1:** Puriva client delivery (`puriva.id`) — see architecture doc.
- Work is local-first on Windows PowerShell from `C:\dcaosv1`.
- Production is frozen unless explicitly approved.
- Merge to `main` does not mean production deployment; current `main` deployed to production is 0%, confirmed staging target is 0%, and production deployment of current `main` is 0%.
- Do not deploy, touch VPS, push, or commit unless explicitly approved after review.
- ChatGPT acts as scope controller/reviewer/task writer; Codex/Copilot/local tooling executes sealed tasks.
- AI Delivery admin workflows remain operator-primary. **Client Portal MVP is required for Puriva** (client-safe visibility and human/client review before publication). Advanced portal features (magic links, full comment threads) remain phased.
- Current UI state is the compact Dark Nebula pass: full-system UI polish, AI Delivery workspace sectioning, Workflow Briefs detail cleanup, client-facing polish, dashboard audit feed smoke alignment, and client-only access to `#/client-portal`.
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
- advanced Client Portal actions beyond the MVP visibility path (public magic links, full interactive comment threads, approval/request-change actions)
- advanced Client Portal actions (public magic links, full interactive comment threads)

Note: AI Delivery and Market Intelligence admin foundations are present locally. Client Access Admin UI is closed; Client Portal MVP visibility path is merged and locally validated for Puriva. Live external provider integrations, advanced Client Portal actions, staging confirmation, and production deployment remain guarded gates. Clients must not see raw prompts, workflow runs, AI costs, credentials, or admin-only notes.

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

1. Keep foundational docs/rules aligned with Puriva MVP 1 and [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md).
2. Keep Client Portal MVP visibility for Puriva aligned with post-merge local validation proof without exposing internal AI workflow data.
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
