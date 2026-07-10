# Validation Command Guards

**Status:** G418 refresh (extends G225/G143). This is a docs-only reference for command ordering and refusal rules. It does not run validation, smoke, live calls, staging/prod probes, commits, pushes, or deploys.

**Primary sources:** [`.github/instructions/validation.instructions.md`](../../.github/instructions/validation.instructions.md), [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md), [`OPERATOR_RUNBOOK.md`](./OPERATOR_RUNBOOK.md), [`TEST_SMOKE_INVENTORY.md`](./TEST_SMOKE_INVENTORY.md), [`docs/security/SECURITY_CHECKLIST_G409.md`](../security/SECURITY_CHECKLIST_G409.md), [`LIVE_PROOF_APPROVAL_CHECKLIST.md`](./LIVE_PROOF_APPROVAL_CHECKLIST.md), and [`LOCAL_ONLY_PROOF_TAXONOMY.md`](./LOCAL_ONLY_PROOF_TAXONOMY.md).

---

## 1. Golden Order

Run from external Windows PowerShell at `C:\dcaosv1`:

```powershell
cd C:\dcaosv1
git diff --check
npm.cmd run validate
```

Only after `validate` passes, run a focused smoke appropriate to the change:

```powershell
npm.cmd run smoke:ai-delivery-reviews
```

For broader local proof, choose one of:

```powershell
npm.cmd run smoke:staging-readiness:local
npm.cmd run smoke:production-readiness:local
npm.cmd run smoke:pre-staging:local
```

---

## 2. Hard Guards

| Guard | Rule |
|---|---|
| PowerShell only | Use Windows PowerShell commands. Do not use bash, Unix paths, `&&`, or Unix-style pipes in operator instructions. |
| One command per line | Multi-step package scripts use `scripts/run-sequential.mjs`; operator command blocks should not chain with `&&`. Do not use `exit` in operator instruction blocks. |
| Validate before smoke | Always run `npm.cmd run validate` (or the scoped frontend check/build pair when docs/UI-only) before smoke. If validate fails, **stop**. Do not run smoke after a failed validate. |
| No smoke after validate fail | Re-run validate after fixing; only then choose a focused smoke. |
| No live proof without owner approval | Live AI, R2, GA/GSC, WordPress, email, image provider, staging/prod probes, VPS, Docker, Caddy, DNS, migrations, and deploys require explicit owner approval **before** the session. |
| Logs to temp / Notepad | Long validation or smoke runs log to `$env:TEMP` via `Tee-Object`, then open Notepad. Scrub secrets before sharing. |
| `.cursor/settings.json` untracked | Keep `.cursor/settings.json` untracked. Never `git add` it. Observed as `??` during G225; do not commit. |
| No services for docs-only | Do not start API or web for docs-only or static review blocks. |
| No broad stop-process | Do not use `Stop-Process -Name node`; stop only explicit PIDs when recovering from Prisma EPERM. |
| Secrets stay out | Never print, persist, commit, or infer secrets. Never read `.env` or credential files unless explicitly scoped by the human. |
| No commit/push | Commit and push require separate explicit approvals after validation/proof review. |

---

## 3. Prisma EPERM Recovery

Preferred prevention: run `npm.cmd run validate` before `npm.cmd run dev:api` or `npm.cmd run dev:web`.

If `prisma generate` fails with an EPERM lock on Windows:

```powershell
Get-Process -Name node | Select-Object Id, StartTime
Stop-Process -Id <PID1>, <PID2> -Force
npm.cmd run validate
```

Rules:

- Stop only the explicit locking process IDs.
- Retry validate once.
- If the same EPERM or validation failure persists, stop and report the exact error.
- Do not proceed to smoke after a failed validate.

---

## 4. Logging Pattern

Use `$env:TEMP` for long validation or smoke logs, then open Notepad:

```powershell
cd C:\dcaosv1
$log = Join-Path $env:TEMP "dca-validate-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
npm.cmd run validate 2>&1 | Tee-Object -FilePath $log
notepad $log
```

Before sharing logs, verify that they do not contain passwords, tokens, cookies, session hashes, full `DATABASE_URL` values, or provider secrets.

---

## 5. Local Service Rules

| Service | Command | When allowed |
|---|---|---|
| API | `npm.cmd run dev:api` | Only when a local API smoke or browser proof needs it, and only after validate passes. |
| Web | `npm.cmd run dev:web` | Only when a browser smoke needs it, and only after validate passes. |

If local auth/dev seed/runtime issues block post-login QA, do not debug auth or change DB unless explicitly scoped. Report: `Post-login browser QA blocked by local auth/dev env. Frontend check/build completed.`

---

## 6. Staging / Production Command Boundaries

### Staging

Staging has historical G46d/G47 PASS proof, but future staging refreshes are not implied. Any staging command that touches remote target, VPS, DB, Docker, Caddy, DNS, migrations, bootstrap write mode, or staging live integration proof requires fresh explicit owner approval.

Guarded staging smoke scripts:

- `npm.cmd run smoke:mvp:staging` requires explicit approved staging API base URL.
- `npm.cmd run smoke:staging-security-baseline` requires `DCA_SMOKE_REMOTE_TARGET=staging`.

### Production

Production readiness remains **NO**. G49 public read-only probes are recorded as PASS, but formal G49 closure is pending the owner sentence. G50 production deploy is not executed. No production commands are allowed in a validation block unless the owner explicitly approves a production gate.

---

## 7. Recommended Validation by Change Type

| Change type | Minimum local proof |
|---|---|
| Docs-only operator/security update | `git diff --check`; optionally no runtime validation if no source changed and owner accepts docs-only proof. |
| Frontend UI leaf change | `git diff --check`, `npm.cmd run -w @dca-os-v1/web check`, `npm.cmd run -w @dca-os-v1/web build`. |
| Backend/API/runtime change | `git diff --check`, `npm.cmd run validate`, focused API smoke. |
| Shared cross-module change | `git diff --check`, `npm.cmd run validate`, targeted unit/integration tests, then focused smokes. |
| Pre-staging discussion | `git diff --check`, `npm.cmd run validate`, `npm.cmd run smoke:staging-readiness:local`. |
| Broad local closeout | `git diff --check`, `npm.cmd run validate`, `npm.cmd run smoke:production-readiness:local` or `npm.cmd run smoke:pre-staging:local`. |

Docs-only G138-G144 and G223-G227 did not run commands or smokes because the user requested no live calls and no commit; this document records the command guards for future execution.

---

## 8. G418 Quick Refusal Card

| Situation | Action |
|---|---|
| Validate failed | Stop. Fix. Re-validate. No smoke. |
| Owner has not approved live proof | Do not call providers, buckets, OAuth, WordPress HTTP, or email send. See [`LIVE_PROOF_APPROVAL_CHECKLIST.md`](./LIVE_PROOF_APPROVAL_CHECKLIST.md). |
| Docs-only block | No API/web start; `git diff --check` is enough unless owner asks for validate. |
| Log file may contain secrets | Do not paste into chat/PR; redact first. |
| `.cursor/settings.json` appears in `git status` | Leave untracked; exclude from any commit. |
| Staging/prod remote smoke requested without approval | Refuse; cite historical PASS is not standing authorization. See [`STAGING_GUARD_SWEEP.md`](../security/STAGING_GUARD_SWEEP.md). |
| Local smoke described as production/launch proof | Refuse; use [`LOCAL_ONLY_PROOF_TAXONOMY.md`](./LOCAL_ONLY_PROOF_TAXONOMY.md) labels. |
| Production deploy / migration requested | Refuse while production readiness is **NO** ([`PRODUCTION_FREEZE_SWEEP.md`](../security/PRODUCTION_FREEZE_SWEEP.md)). |

---

## 9. G409–G428 lane note

Docs-only security/operator refresh plus optional tiny unit tests. No live calls. Production freeze remains explicit. Puriva Launch remains **BLOCKED**. Preferred security checklist: [`SECURITY_CHECKLIST_G409.md`](../security/SECURITY_CHECKLIST_G409.md).
