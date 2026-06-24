# DCA Mode - Working Rules

## Gate and approval flow

Every task must follow the DCA gate format in project reports:

**GATE: KEEP/FIX/REVERT/STOP | agent: yes/no | budget: low/medium/high | mistakes: <count>**

### Core approval rules

- One scoped task only. No second block without explicit approval.
- No commit unless user approves commit after validation/proof.
- No push unless user separately approves push after commit.
- No deploy/merge/VPS/prod/Caddy/container work unless explicitly approved.
- Commit and push require separate, explicit approvals.

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

## Validation and smoke behavior

### Critical validation sequence

1. Run `npm.cmd run validate` before any smoke.
2. **Stop immediately on validation failure.** Do not run smoke after failed validation.
3. Run focused smoke only for changed area after validation passes.
4. If backend/API proof passes but UI fails, compare browser payload/form state against backend contract. Do not repeat login/session guessing.

### Focused smoke discipline

- Run focused smoke for the changed area only, not broad unrelated smoke unless requested.
- Do not modify smoke scripts unless the scoped task explicitly includes smoke coverage.

## PowerShell and log behavior

### Required PowerShell discipline

- Use Windows PowerShell only. No bash, no Unix paths.
- Any command output intended for user review **must** write to `$env:TEMP` log and open Notepad automatically.
- **Do not add `Read-Host` pauses** unless explicitly requested.
- **Do not use `exit`** in PowerShell snippets.
- **Do not close the user's PowerShell window.**
- Do not spam explanations around Notepad/log behavior.

### Log file pattern

```powershell
$log = Join-Path $env:TEMP "dcaos-task-name.log"
$out = @()
$out += "=== Section ==="
$out += (command output 2>&1)
[System.IO.File]::WriteAllLines($log, $out)
if (Test-Path $log) { notepad $log }
```

## Secrets and authentication behavior

### Critical secrets rules

- **Do not inspect `.env` files** unless explicitly scoped by the human.
- **Do not print, infer, search for, persist, or commit** secrets/passwords/API keys/tokens.
- Never write secrets into repo files, docs, prompts, logs, or GitHub issues.

### Local admin auth

- Local admin email is `admin@dca.local`.
- Use `$env:AUTH_SEED_TEST_PASSWORD` only for local auth proof.
- **Never print the password or auth token.**
- **Do not ask user for password if `$env:AUTH_SEED_TEST_PASSWORD` is already set** in the current session.

## File editing behavior

### Encoding discipline

- Avoid UTF-8 BOM on all source files.
- **Do not use `Set-Content -Encoding utf8`** on source/schema/config files.
- Use no-BOM writes:

```powershell
[System.IO.File]::WriteAllText($path, $text, [System.Text.UTF8Encoding]::new($false))
```

### Text replacement discipline

- For text replacements, use fail-hard Node script or exact targeted edit.
- **Do not loop fragile PowerShell replacements.**
- After editing, verify the intended text exists and forbidden text does not remain.

## Prisma and Windows behavior

### Windows EPERM handling

If Prisma EPERM occurs during validation:

1. List relevant node PIDs.
2. Stop only explicit process IDs with `Stop-Process -Id <PID>`.
3. **Do not blindly run `Stop-Process -Name node`.**
4. Retry validation once.
5. If it still fails, stop and report.

### Migration and environment handling

- If migration/env is needed, use existing repo-approved pattern without printing `DATABASE_URL` or secrets.
- Use safe migration script: `node scripts/run-migration-local.mjs <migration-name>`

## Budget and model discipline

Every block must declare a budget level before execution starts.

| Budget level | When to use |
|---|---|
| Low | Docs, scaffolding, UI polish, single-file changes |
| Medium | Backend changes, schema changes, multi-file refactors |
| High | Auth, payments, AI cost guardrails, provider integrations, cross-module work |

### Model selection policy

**Default to cheapest suitable model** for docs/simple fixes.

**Use Gemini Pro or Sonnet for:**
- Schema/migration work
- Auth/RBAC/security changes
- Provider/external integrations
- Secrets/credentials design
- Complex API/runtime/UI blocks
- Failed validation/smoke repair
- Contradictory findings
- Large repo comparison

**Important:** Copilot may not auto-switch models from prompt text. The agent must clearly state recommended model before starting demanding tasks.

### Autonomy and scope limits

- Default budget is low for docs-only and single-file changes.
- Cloud agent execution is medium or high unless the block is explicitly docs-only.
- If a stronger model is used, the final report must state why.
- If the agent needs more autonomy or more files than scoped, it must stop and request scope approval from the human.
- Do not run broad repo search if the relevant files are already known.
- Do not start a parallel or multi-agent session unless explicitly approved in the block scope.

## Loop control

### Stop conditions for loops

- If an edit/search repeats or the agent is not progressing, **stop and return status.**
- **Do not keep listing directories or rerunning the same search.**
- If a tool reports multiple matches, inspect a narrower range or ask for targeted context; **do not loop.**
- If the same file is being edited repeatedly without progress, stop and report the issue.

## Required final report

Every block execution must end with a report in this format:

**GATE: KEEP/FIX/REVERT/STOP | agent: yes/no | budget: low/medium/high | mistakes: <count>**

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
