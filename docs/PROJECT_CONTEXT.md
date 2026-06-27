# DCA OS Lite Project Context

## Repository

- GitHub: `https://github.com/dca-glitch/dcaosv1`
- Local reference path: `C:\dcaosv1`
- Production URL: `system.digitalcubeagency.net`

Post-merge status: PR #13 is merged into `main` at `584e041bd85e8179e795a0e4621a0d9d8908e0b6`; follow-up docs commit on `main` is `07b1f1668d11cdef42b195cfad189c4df645acc6`. Local `main` is synced and validated, and local pre-staging proof was accepted. No deploy, VPS migration, production restart, or release was performed. `system.digitalcubeagency.net` is a live production VPS target, not a confirmed staging target.

## Product Definition

DCA OS Lite is the reusable SaaS operating system foundation for Digital Cube Agency. It is the shared platform layer for DCA tools, dashboards, admin/operator workflows, finance modules, SEO/content operations, AI Delivery records, reports, and business operations.

**Approved operating model (2026-06-27):** each internet domain is one `Client` record; publication and analytics hang off Client; Digital Cube Agency LLC operates agency clients; own domains belong to independent companies that will use licensed tenant instances for Finance. **MVP 1:** Puriva client delivery — Client Portal MVP required now. See [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md).

Current state note: AI Delivery admin workflows are operator-primary. Client Access Admin UI foundation exists; Client Portal MVP is required for Puriva (client-safe visibility only). Implementation follows Puriva MVP delivery path and approved blocks 1–6 in [`docs/ROADMAP.md`](./ROADMAP.md).

## Current Role Split

- ChatGPT: scope controller, reviewer, task writer, and implementation gatekeeper.
- Codex/Copilot/local tooling: execution layer for sealed terminal-dependent tasks such as validation, builds, tests, and approved migrations.
- Human owner: approval gate for risky actions and local/cloud task execution.

## Core Safety Rules

Do not perform these actions unless explicitly approved for the current block:

- no unapproved database migrations
- no `db push`
- no seed execution
- no production secrets
- no deployment
- no VPS/production access
- no commit or push
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
- VPS/deployment only when explicitly approved; production is frozen by default

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

This section preserves early historical foundation blocks. The current local state has progressed beyond the initial skeleton and now includes local auth/session/tenant/module foundations, AI Delivery admin/operator foundations, and Email Notifications EN1.

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

- Production is frozen unless explicitly approved.
- Current `main` is 0% deployed to production; merge to `main` must not be described as production deployment.
- Client Portal MVP is required for Puriva delivery; advanced client actions (comments, magic links) remain phased.
- Email Notifications EN1 has provider defaults and Resend domain verification, but no API key and no real sending.
- EN2 event wiring remains paused until modules are stable.
- No AI calls, crawling, WordPress publish, GA/GSC, Resend sending, or production deployment has been added beyond approved foundations; Client Portal MVP delivery for Puriva is in scope per architecture doc.

## Current Completed AI Delivery / Email Foundation State

- AI Delivery project/brief foundation.
- Workflow run foundation.
- Deliverables foundation.
- Deliverable review data foundation.
- Deliverable review admin API.
- Deliverable review admin UI.
- Local deliverable review smoke script.
- Deliverable export/download admin actions.
- Operator summary, AI SEO foundation UI, and AI Content Production foundation UI.
- Email notification backend foundation EN1 only.

## Development Discipline

Use controlled block workflow:

```text
inspect -> report -> approve -> implement -> validate -> review -> commit/push/deploy only if explicitly approved
```

Use Windows PowerShell commands locally. Do not edit GitHub cloud directly, commit, push, deploy, or touch VPS/production unless explicitly approved after review.
