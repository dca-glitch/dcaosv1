# DCA OS Lite — Agent Instructions

## Project identity

This repository contains DCA OS v1 / DCA OS Lite.

Current approved product UI direction:

`DCA OS v1 / Lite — Approved Dark Nebula Product UI Direction`

Before frontend UI work, read:

- `docs/ui/DARK_NEBULA_PRODUCT_UI_DIRECTION.md`

## Approved UI direction

Dark Nebula is the approved target product UI/UX system.

It is not a simple CSS skin.

All current and future frontend modules must use the shared Dark Nebula product UI language:

- app shell
- sidebar navigation
- page headers
- dashboard panels
- metric cards
- entity cards
- section panels
- status badges
- forms
- modals
- action bars
- empty states
- loading states
- error states
- responsive layout

Future modules must not invent their own visual system.

If a new UI pattern is needed, create a reusable frontend component or shared CSS class first.

## Frontend module rule

Every new DCA OS module should be implemented through the shared UI foundation first, then module-specific content second.

Recommended reusable patterns:

- `PageHeader`
- `MetricCard`
- `EntityCard`
- `SectionPanel`
- `StatusBadge`
- `EmptyState`
- `FormModal`
- `ActionBar`
- shared button classes
- shared form field classes
- shared badge classes

If these components do not exist yet, create small frontend-only reusable components in an appropriate frontend location such as:

- `apps/web/src/components/ui/`

or extend existing shared frontend components.

## Hard safety boundaries

Do not change backend logic unless explicitly approved.

Do not change database schema unless explicitly approved.

Do not change Prisma migrations unless explicitly approved.

Do not change API contracts unless explicitly approved.

Do not change authentication behavior unless explicitly approved.

Do not change Turnstile behavior unless explicitly approved.

Do not reset or inspect passwords.

Do not modify secrets.

Do not run migrations unless explicitly approved.

Do not deploy unless explicitly approved.

Do not touch VPS unless explicitly approved.

Do not touch production unless explicitly approved.

## Production naming

The deployed production system should be referred to as:

`DCA OS Lite`

Public production URL:

`system.digitalcubeagency.net`

Do not perform production or VPS actions unless explicitly instructed.

## Preferred frontend validation commands

For frontend UI work, run:

```powershell
cd C:\dcaosv1
npm run -w @dca-os-v1/web check
npm run -w @dca-os-v1/web build
```

Optional only when safe and expected:

```powershell
npm run validate
```

Do not run migrations as part of frontend UI work.

## Local auth/dev blocker rule

If local login or post-login browser QA is blocked by local auth/dev seed/runtime issues:

- do not fix auth
- do not debug backend
- do not change DB
- report the blocker clearly
- continue only with frontend-safe validation if possible

Recommended report wording:

`Post-login browser QA blocked by local auth/dev env. Frontend check/build completed.`

## Branch strategy

Use feature branches for implementation work.

Do not work directly on `main` for runtime implementation changes.

Recommended branch for approved Dark Nebula frontend implementation:

`feature/dark-nebula-product-ui-phase-1`

Documentation-only commits may be made separately when explicitly requested.

## Final report required

Every agent must report:

1. Branch name
2. Files changed
3. Commits created
4. Validation commands and results
5. Manual QA result
6. Known blockers
7. Remaining polish items
8. Confirmation that backend/API/auth/schema/VPS/deploy were not touched

## Stop conditions

Stop and report immediately if:

- backend/API/schema changes appear necessary
- auth or Turnstile behavior appears affected
- package installation seems necessary
- build fails for an unrelated reason
- local auth/dev env blocks post-login QA
- scope becomes unsafe
- merge conflict cannot be resolved safely

## Future Codex/Cline prompt starter

Future agent prompts should start with:

```text
Read AGENTS.md first.
Read docs/ui/DARK_NEBULA_PRODUCT_UI_DIRECTION.md second.
Follow both documents strictly.
```

This keeps approved UI direction and production safety rules stored at repository level, not only in chat memory.

## DCA OS Lite AI Delivery / Cost-Control Rules

- New modules start with read-only inspection.
- Codex must work one block/layer at a time.
- Prompts must include GATE with mode, scope, max commands, max file reads, allowed files, forbidden files, validation rule, commit rule, deploy rule, and stop condition.
- No broad schema + API + UI prompts.
- No generated mass rewrite scripts.
- No deployment or commits without explicit user approval.
- For AI Delivery Build Block 1, implementation order is docs guardrails, schema/migration only, backend only, frontend only.
- Use term “monthly content plan,” not “package.”
- Client archive is read-only.
- No public approval links in MVP.

---

## Copilot CLI / Cloud Agent Workflow

### Repo

- Path: `C:\dcaosv1`
- Active branch convention: `feature/*`
- OS: Windows - PowerShell only

### Stack

| Layer | Technology |
|---|---|
| `apps/web` | React + Vite + TypeScript |
| `apps/api` | Node.js + Express |
| `packages/data` | Prisma + PostgreSQL |
| `packages/shared` | Shared TypeScript |

### Local start commands

```powershell
# API
cd C:\dcaosv1
npm.cmd run dev:api   # http://localhost:4000

# Web
cd C:\dcaosv1
npm.cmd run dev:web   # http://localhost:5173
```

### Validation commands

```powershell
cd C:\dcaosv1
git diff --check
npm.cmd run validate
```

### Smoke commands

```powershell
npm.cmd run smoke:ai-delivery-reviews
npm.cmd run smoke:local
npm.cmd run smoke:browser
```

### Role boundaries

| Role | Responsibility |
|---|---|
| ChatGPT | Planner, scope controller, reviewer, decision gate |
| Copilot CLI / cloud agent | Executor - implements approved block only |
| Human | Approves commit and push |

### Safety rules

- No commit, push, or deploy without explicit human approval.
- No app source changes unless explicitly scoped.
- No schema / migration changes unless explicitly approved.
- No package installs unless explicitly scoped.
- No secrets or credentials in any output or file.
- Stop on validation failure. Do not run smoke after a failed validate.

### Final report format

Every block must end with:

1. Files changed
2. Exact behavior / scaffolding added
3. Backend / schema / provider / runtime changes - yes/no; describe if yes
4. Validation results
5. Smoke results or skipped tests and why
6. Risk notes
7. Git status
8. Confirm no commit / push / deploy

### Agent instruction files

| File | Purpose |
|---|---|
| `.github/copilot-instructions.md` | Repo-wide Copilot instructions |
| `.github/instructions/dca-mode.instructions.md` | Working rules and decision model |
| `.github/instructions/validation.instructions.md` | Validation order and commands |
| `.github/instructions/ai-delivery.instructions.md` | AI Delivery module rules |
| `.github/agents/dca-planner.agent.md` | Planning / discovery agent |
| `.github/agents/dca-implementation.agent.md` | Implementation agent |
| `.github/agents/dca-reviewer.agent.md` | Review agent |
| `docs/ai-delivery/copilot-operating-model.md` | Operating model overview |
