# DCA OS Lite

DCA OS Lite is the internal agency operating system for Digital Cube Agency. It combines the platform foundation for admin/operator workflows, client-safe portal surfaces, AI Delivery records, reporting, and future modules.

## Current production state

- Production clean-state reset: **PASS**.
- Interactive production admin login: **verified**.
- Password auth works; Turnstile is **temporarily disabled** in production.
- Production is healthy and remains frozen for further mutations unless explicitly approved.
- The remaining owner-facing work is normal company settings and first-client setup in the production UI.
- Production deploy was **not repeated** during the reset resume.
- Green CI baseline for the reset: commit `e36758b06594f35c252ccf1cfed69bcccfd78b79` (`29229779236`, success).

Authoritative current-state sources:

- [`docs/STATUS.md`](docs/STATUS.md)
- [`docs/operator/PRODUCTION_CLEAN_STATE_RESET_2026-07-13.md`](docs/operator/PRODUCTION_CLEAN_STATE_RESET_2026-07-13.md)
- [`docs/project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](docs/project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md)
- [`docs/operator/README.md`](docs/operator/README.md)

## Repository layout

```text
apps/
  api/      Node.js + Express API
  web/      React + Vite frontend

packages/
  shared/   Shared TypeScript contracts
  data/     Prisma schema and database tooling

docs/       Architecture, operator, runbook, and status documentation
```

## Local development

From the repository root:

```powershell
npm.cmd run dev:api
npm.cmd run dev:web
```

Local URLs:

- API health: `http://localhost:4000/api/v1/health`
- Web app: `http://localhost:5173`

## Validation

```powershell
npm.cmd run validate
```

## Environments

| Environment | URL | Notes |
|---|---|---|
| Local | `http://localhost:5173` / `http://localhost:4000` | Primary development target |
| Staging | `https://staging.digitalcubeagency.net` | Documented in staging runbooks; treat as separate from production |
| Production | `https://system.digitalcubeagency.net` | Healthy; clean-state reset complete; login verified; Turnstile temporarily disabled |

## Architecture and setup

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md)
- [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md)
- [`docs/ROADMAP.md`](docs/ROADMAP.md)
- [`docs/STATUS_COMPLETION.md`](docs/STATUS_COMPLETION.md)

## Operator and project-control docs

- [`docs/operator/README.md`](docs/operator/README.md)
- [`docs/operator/OPERATOR_RUNBOOK.md`](docs/operator/OPERATOR_RUNBOOK.md)
- [`docs/operator/PRODUCTION_CLEAN_STATE_RESET_2026-07-13.md`](docs/operator/PRODUCTION_CLEAN_STATE_RESET_2026-07-13.md)
- [`docs/operator/deferred-scope-register.md`](docs/operator/deferred-scope-register.md)
- [`docs/project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](docs/project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md)
- [`docs/runbooks/STAGING_READINESS.md`](docs/runbooks/STAGING_READINESS.md)
- [`docs/runbooks/PRODUCTION_DEPLOYMENT.md`](docs/runbooks/PRODUCTION_DEPLOYMENT.md)
- [`docs/runbooks/PRODUCTION_ROLLBACK.md`](docs/runbooks/PRODUCTION_ROLLBACK.md)
- [`docs/runbooks/PRODUCTION_SAFETY_CHECKLIST.md`](docs/runbooks/PRODUCTION_SAFETY_CHECKLIST.md)

## Working model

- Development: use local commands and validate before smoke.
- Staging: follow the staging runbooks and approval gates.
- Production: treat production as live, healthy, and frozen for further mutations unless explicitly approved.
- Deferred / future capabilities: keep platform-neutral and separate from current production operations.

## Deferred and future capabilities

The repository intentionally keeps several capabilities gated or deferred, including live provider integrations, full client-launch workflows, and any production mutation beyond explicitly approved work. Follow the authoritative status and deferred-scope documents before planning new work.
