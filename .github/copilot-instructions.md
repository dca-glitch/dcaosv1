# DCA OS Lite - Copilot Repository Instructions

## Stack

| Layer | Technology |
|---|---|
| `apps/web` | React + Vite + TypeScript |
| `apps/api` | Node.js + Express |
| `packages/data` | Prisma + PostgreSQL |
| `packages/shared` | Shared TypeScript |

- Repo path: `C:\dcaosv1`
- OS: Windows only - PowerShell only. No bash, no Unix paths.
- Local API: `http://localhost:4000`
- Local web: `http://localhost:5173`

## Working rules

- Make small, sealed diffs scoped to the approved block only.
- Do not change app source code or runtime behavior unless explicitly scoped.
- Do not commit, push, or deploy without explicit human approval.
- Do not install packages unless explicitly scoped.
- Do not run migrations unless explicitly approved.
- Inspect TypeScript interfaces and types before referencing fields. Do not use fields that do not exist.
- If backend/API works but UI fails, compare browser payload and form state against the backend contract before changing either side.
- Avoid UTF-8 BOM. Do not use `Set-Content -Encoding utf8` on source files or schema files.
- Avoid fragile PowerShell string-replacement loops on structured files.
- Keep final reports factual. No marketing language. No unsupported claims.

## Validation order

Run in this exact order. Stop on first failure.

1. `git diff --check`
2. `npm.cmd run validate`
3. `npm.cmd run smoke:ai-delivery-reviews` - only after validate passes
4. `npm.cmd run smoke:local` - only after validate passes
5. `npm.cmd run smoke:browser` - only after validate passes

**Never run smoke after a failed validate.**

### Known Windows / Prisma EPERM

If `prisma generate` fails with EPERM during validate:
1. Stop `node.exe` processes.
2. Retry `npm.cmd run validate` once.
3. If it still fails, stop and report. Do not proceed.

## Role model

- **ChatGPT** - planner, scope controller, reviewer, decision gate.
- **Copilot CLI / cloud agent** - executor only. Must not make scope decisions independently.

## Copilot Max / AI credit policy

- Default to Auto/model auto-selection for normal docs, UI polish, and small scoped changes.
- Use a stronger or more expensive model only when the block explicitly involves:
  - architecture decisions
  - auth or security changes
  - provider integrations
  - AI cost guardrail changes
  - transactions or data integrity
  - repeated failed fixes
  - cross-module refactors
- Do not use broad repo exploration unless the exact files are unknown and cannot be inferred.
- Prefer inspecting exact known files first before any search.
- Keep prompts short by relying on repo memory files instead of repeating context.
- Do not start long autonomous sessions without explicit human approval.
- Do not use parallel, fleet, or multi-agent execution unless explicitly scoped in the block.
- For cloud-agent work, require a GitHub Issue created from ai-block.yml with:
  - clear allowed files
  - forbidden areas
  - stop conditions
  - validation requirements
  - final report checklist
- Do not hard-code subscription prices, credit limits, or plan claims in repo files.

## Reference files

- `AGENTS.md` - agent-facing project overview and safety rules
- `.github/instructions/dca-mode.instructions.md` - detailed working rules
- `.github/instructions/validation.instructions.md` - validation rules
- `.github/instructions/ai-delivery.instructions.md` - AI Delivery module rules
- `docs/ai-delivery/copilot-operating-model.md` - operating model
