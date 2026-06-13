# DCA OS v1 Project Context

## Repository

- GitHub: `https://github.com/dca-glitch/dcaosv1`
- Local reference path: `C:\dcaosv1`
- Future URL: `system.digitalcubeagency.net`

## Product Definition

DCA OS v1 is the reusable SaaS operating system foundation for Digital Cube Agency. It is intended to become the shared platform layer for future DCA tools, dashboards, client portals, automations, AI workflows, finance modules, SEO modules, reports, and business operations.

## Current Role Split

- ChatGPT: architect, reviewer, implementation gatekeeper, cloud-side safe repo writer.
- Codex/cloud agent: execution layer for terminal-dependent tasks such as install, validation, builds, tests, migrations, and deployment.
- Human owner: approval gate for risky actions and local/cloud task запуск.

## Core Safety Rules

Do not perform these actions unless explicitly approved for the current block:

- no database migrations
- no `db push`
- no seed execution
- no production secrets
- no deployment
- no destructive refactors
- no broad package upgrades
- no `npm audit fix --force`
- no auth/security bypasses

## Approved Stack Direction

- React + Vite frontend
- TypeScript
- Node.js + Express backend
- PostgreSQL
- Prisma ORM
- npm workspaces
- GitHub Actions CI
- Tailwind/shadcn later only if approved
- VPS deployment later

## Workspace Structure

```text
apps/
  api/
  web/

packages/
  shared/
  data/
```

## Implemented Blocks

### Blocks 1-10 — Foundation

Implemented initial reusable SaaS foundation:

- root npm workspace structure
- API app skeleton
- Web app skeleton
- shared contracts package
- data package with Prisma schema foundation
- Express `/api/v1` boundary
- health routes
- response/error helpers
- reusable module contracts
- module registry foundation
- backend module pattern
- frontend module shell/list/detail/form patterns
- Prisma schema foundation for users, tenants, roles, permissions, modules, settings, and audit/activity logs

Commit:

```text
f7bf7b2 Initialize DCA OS v1 foundation
```

### Block 11 — Dependencies and Real Validation

Implemented dependency installation and real validation foundation:

- `package-lock.json`
- real TypeScript checks
- Vite build
- Prisma schema validation wrapper
- data package validation

Commit:

```text
769b5bb Add dependencies and real validation
```

### Block 12 — CI and Dependency Monitoring

Implemented safe cloud-side repo foundation:

- GitHub Actions CI workflow
- Dependabot npm monitoring

Commits:

```text
ce8db8f Add CI validation workflow
92445f7 Add npm dependency monitoring
```

## Current Known Risks

- `npm audit` previously reported 2 vulnerabilities: 1 moderate, 1 high.
- Do not run automatic force fixes.
- Audit should be handled through a targeted review block.
- GitHub Actions result should be checked after CI workflow commits.

## Next Recommended Blocks

1. CI result review and repair if needed.
2. Targeted npm audit review.
3. Local Docker/PostgreSQL planning.
4. Prisma Client strategy.
5. Database access layer.
6. Auth planning.
7. Auth implementation.
8. Tenant context foundation.
9. Users module MVP.

## Development Discipline

Use controlled block workflow:

```text
inspect -> report -> approve -> implement -> validate -> commit -> push
```

For safe documentation/config-only work, ChatGPT may commit directly through GitHub. For terminal-dependent tasks, use Codex/cloud or local PowerShell and paste validation output back for review.
