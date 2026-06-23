# DCA Mode - Working Rules

## Scope model

- Every task is a sealed block with an explicit scope, allowed files, and forbidden areas.
- One next action at a time. No broad roadmap unless explicitly requested.
- Do not expand scope during execution. If new issues are discovered outside scope, report them - do not fix them.

## Role boundaries

| Role | Responsibility |
|---|---|
| ChatGPT | Planner, scope controller, reviewer, decision gate |
| Copilot CLI / cloud agent | Executor - implements the approved block only |
| Human | Approves commit and push separately |

The executor must not commit, push, or deploy without explicit human approval.

## Execution rules

- Read `AGENTS.md` and relevant `.github/instructions/` files before starting any block.
- Inspect existing types, interfaces, and contracts before writing any code.
- Keep diffs small. Prefer surgical changes over rewrites.
- Do not introduce new dependencies unless explicitly scoped.
- Do not change runtime behavior outside the scoped area.
- If a change requires touching app source, schema, migrations, or runtime config outside scope: stop and report.

## Budget and model discipline

Every block must declare a budget level before execution starts.

| Budget level | When to use |
|---|---|
| Low | Docs, scaffolding, UI polish, single-file changes |
| Medium | Backend changes, schema changes, multi-file refactors |
| High | Auth, payments, AI cost guardrails, provider integrations, cross-module work |

- Default budget is low for docs-only and single-file changes.
- Cloud agent execution is medium or high unless the block is explicitly docs-only.
- If a stronger model is used, the final report must state why.
- If the agent needs more autonomy or more files than scoped, it must stop and request scope approval from the human.
- Do not run broad repo search if the relevant files are already known.
- Do not start a parallel or multi-agent session unless explicitly approved in the block scope.

## Required final report

Every block execution must end with a report in this format:

1. **Files changed** - exact list with paths
2. **Behavior / scaffolding added** - what was implemented or created
3. **Backend / schema / provider / runtime changes** - explicit yes/no; describe if yes
4. **Validation results** - commands run and outcomes
5. **Smoke results or skipped tests** - what ran, what was skipped, and why
6. **Risk notes** - anything that could break or needs follow-up
7. **Git status** - output of `git status --short --branch`
8. **Confirm no commit / push / deploy**

## Decision model (for ChatGPT reviewer)

| Decision | Meaning |
|---|---|
| `KEEP` | Block is safe; proceed to commit/merge with human approval |
| `FIX` | Small correction needed before proceeding |
| `REVERT` | Undo the block; reason provided |
| `STOP` | Unsafe state or scope broken; do not proceed |

## Stop conditions

Stop immediately and report if any of the following are true:

- App source file would need to change outside scope
- Schema, migration, or Prisma file would need to change outside scope
- Package.json or lockfile would need to change outside scope
- Runtime or authentication behavior appears affected
- Secrets or credentials are needed
- GitHub Actions, hooks, or automations would be needed
- More files would change than the block allows
- The task becomes unsafe or broader than the approved block
