# DCA OS Lite - Copilot Operating Model

## Overview

This document describes how AI coding agents are used in DCA OS Lite. It covers the two primary loops, role boundaries, cost controls, and human gate points.

---

## Level 2 - Repository memory

Repository memory is stored in:

- `AGENTS.md` - project overview, stack, commands, role boundaries, safety rules
- `.github/copilot-instructions.md` - repo-wide Copilot instructions (auto-loaded by Copilot CLI and GitHub Copilot)
- `.github/instructions/*.instructions.md` - scoped instruction files for modes and modules
- `.github/agents/*.agent.md` - custom agent instruction files

These files are loaded automatically by Copilot CLI and GitHub Copilot cloud agents. They reduce repeated human instructions.

---

## Level 3 - Issue -> agent -> branch/PR factory

The intended loop for structured delivery:

```
GitHub Issue (ai-block.yml form)
  -> ChatGPT reviews and approves scope
    -> Copilot CLI or cloud agent executes block
      -> Agent produces branch + diff + final report
        -> Human reviews diff and final report
          -> Human commits and pushes
            -> PR opened against target branch
              -> ChatGPT or human reviews PR
                -> KEEP / FIX / REVERT / STOP decision
                  -> Human merges
```

---

## Local Copilot CLI loop

Use for: quick focused blocks, short diffs, single-module work.

```
1. ChatGPT produces scoped block prompt
2. Human pastes prompt into Copilot CLI
3. Agent executes on C:\dcaosv1 (Windows PowerShell)
4. Agent runs: git diff --check -> npm.cmd run validate -> smoke (if required)
5. Agent produces final report
6. Human reviews diff and report
7. Human runs: git add -> git commit -> git push (separately, with approval)
```

---

## GitHub issue/PR loop (cloud agent)

Use for: larger blocks, multi-file work, async execution.

```
1. Human opens GitHub Issue using ai-block.yml form
2. ChatGPT reviews scope and approves
3. Human assigns issue to Copilot cloud agent (or triggers manually)
4. Cloud agent creates branch, implements block, opens PR
5. PR template auto-fills: files changed, validation, smoke, risk notes
6. ChatGPT or human reviews PR
7. Human merges with explicit approval
```

---

## When to use local CLI vs cloud agent

| Scenario | Use |
|---|---|
| Short focused block, 1-5 files | Local Copilot CLI |
| Scaffolding / docs only | Local Copilot CLI |
| Complex multi-file implementation | Cloud agent |
| Async / background execution needed | Cloud agent |
| Requires full repo context at scale | Cloud agent |

---

## Cost control rules

- No autonomous AI agents that incur LLM cost run without explicit per-block approval.
- Admin controls all AI workflow runs in the AI Delivery module.
- No background polling, scheduled agents, or auto-triggered generation pipelines unless explicitly scoped.
- Cost guardrails and input guardrails in `AI_WORKFLOW_RESULT_V1` are preserved unless explicitly changed.

---

## Human gate points

| Gate | Required |
|---|---|
| Block scope approval | ChatGPT reviews and approves before execution |
| Validation pass | Agent must pass validate before smoke |
| Diff review | Human reviews before commit |
| Commit | Human runs `git commit` explicitly |
| Push | Human runs `git push` explicitly - separate approval |
| Merge | Human merges PR explicitly |
| Deploy | Human deploys explicitly - never triggered by agent |

---

## Copilot Max operating rules

### Model and execution defaults

- Local Copilot CLI is the default for small focused blocks (1-5 files, docs, UI polish).
- Cloud agent is for async issue-to-PR work only, after scope is fully defined in an ai-block.yml issue.
- Use Auto/default model first for low and medium risk work.
- Escalate to a stronger model only after discovery shows architectural risk or after repeated failed fixes.
- If a stronger model is used, the final report must state the reason.

### Parallelism and autonomy limits

- Do not run multiple agents on overlapping files.
- Do not let a cloud agent start without a completed ai-block.yml issue scope.
- Do not start a long autonomous session without explicit human approval.
- Do not use parallel, fleet, or multi-agent execution unless it is explicitly listed in the block scope.

### Human gate points (required for every block)

1. Scope approval - ChatGPT or human approves before execution starts
2. Validation proof - agent must show validate passed before smoke
3. Diff review - human reviews all changed files before commit
4. Commit approval - human runs git commit explicitly
5. Push approval - human runs git push separately and explicitly
6. Deploy approval - human deploys explicitly; agents never trigger deploy

### Cost minimization practices

- Write short prompts. Rely on repo memory files instead of repeating context in each prompt.
- Scope allowed files exactly. Avoid open-ended "change what you need" instructions.
- Keep diffs small. One block per session.
- Run focused smokes only (smoke:ai-delivery-reviews before smoke:local or smoke:browser).
- Avoid unnecessary browser/screenshot work unless UI changed.
- Avoid broad repo search when exact file paths are already known.
- Do not start exploratory sessions without a clear allowed-files list.

---

## Local execution discipline

- Work from `C:\dcaosv1` only. Do not navigate outside the repo.
- Use the repo map in `.github/copilot-instructions.md` before searching.
- Start API or web only when validation, smoke, or browser proof requires it.
- Do not inspect `.env` files or search for secrets or credentials.
- If a secret is needed, stop and ask the human to provide it as a temporary process environment variable.
- Use temporary env vars only when the human explicitly provides them in the session.
- No production, VPS, deploy, or remote server actions without explicit human scope and approval.

---

## Deferred - not yet enabled

The following are planned but not yet implemented:

- GitHub Actions CI pipeline
- Pre-commit or pre-push hooks
- Automated PR assignment to cloud agent
- Third-party agent router
- Automated deployment from CI
- Slack or notification automation

These will be added in future blocks when explicitly scoped and approved.
