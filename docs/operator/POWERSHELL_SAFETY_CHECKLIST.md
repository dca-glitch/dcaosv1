# PowerShell Safety Checklist (G657)

**Status:** Operator command-discipline checklist for Windows PowerShell. G657 for G469–G708 ultra-block on baseline `66dcb74`. Docs-only.

**Hard rules:** PowerShell only; **one command per line**; no `&&` chaining in operator instruction blocks; **no smoke after failed validate**; never print secrets; keep `.cursor/settings.json` untracked.

Related: [`VALIDATION_COMMAND_GUARDS.md`](./VALIDATION_COMMAND_GUARDS.md) · [`OPERATOR_RUNBOOK.md`](./OPERATOR_RUNBOOK.md) · [`.github/instructions/validation.instructions.md`](../../.github/instructions/validation.instructions.md)

---

## 1. Shell and path

| Rule | Detail |
|---|---|
| Shell | External Windows PowerShell only |
| Repo root | Always `cd C:\dcaosv1` before package scripts |
| Package runner | Prefer `npm.cmd run <script>` on Windows |
| No bash | Do not use Unix paths, bash, or Unix-style pipes in operator docs |
| One command per line | Do not chain with `&&`; multi-step package scripts use `scripts/run-sequential.mjs` |
| No `exit` in instruction blocks | Avoid `exit` in copy-paste operator snippets |

---

## 2. Validate / smoke order

```powershell
cd C:\dcaosv1
git diff --check
npm.cmd run validate
```

Only after validate PASS:

```powershell
npm.cmd run smoke:external-integrations-readiness:local
```

| Guard | Action |
|---|---|
| Validate failed | Stop. Fix. Re-validate. **No smoke.** |
| Docs-only block | No API/web start unless owner asks; `git diff --check` minimum |
| Services | Start `dev:api` / `dev:web` only when a scoped smoke needs them, and only after validate PASS |

---

## 3. Logging

```powershell
cd C:\dcaosv1
$log = Join-Path $env:TEMP "dca-validate-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
npm.cmd run validate 2>&1 | Tee-Object -FilePath $log
notepad $log
```

- Scrub passwords, tokens, cookies, session hashes, full `DATABASE_URL`, and provider secrets before sharing.
- Prefer `$env:TEMP` over repo paths for long logs.

---

## 4. Prisma EPERM (Windows)

Preferred: validate **before** starting `dev:api` / `dev:web`.

If EPERM on `query_engine-windows.dll.node`:

```powershell
Get-Process -Name node | Select-Object Id, StartTime
Stop-Process -Id <PID1>, <PID2> -Force
npm.cmd run validate
```

- Stop **explicit PIDs only** — never `Stop-Process -Name node`.
- Retry validate once; if same failure persists, stop and report.

---

## 5. Secrets and untracked files

| Rule | Detail |
|---|---|
| Never print | `$env:AUTH_SEED_TEST_PASSWORD`, API keys, `DATABASE_URL` values |
| Never commit | `.env`, `.env.local`, credential files |
| `.cursor/settings.json` | Must remain **untracked**; never `git add`; leave as `??` |
| Env inventory | Names only — [`ENV_READINESS_INVENTORY.md`](./ENV_READINESS_INVENTORY.md) |

---

## 6. Staging / production remote commands

| Script / action | Guard |
|---|---|
| `smoke:mvp:staging` | Explicit approved staging API base URL + owner approval |
| `smoke:staging-security-baseline` | `DCA_SMOKE_REMOTE_TARGET=staging` + owner approval |
| `bootstrap:staging-admin` | Staging target + write-mode confirmation; never CI/local default |
| Production deploy / migration | Refuse while production readiness is **NO** |

Historical G46d/G47 PASS is **not** standing authorization.

---

## 7. Commit / push

- Commit and push require **separate** explicit human approvals.
- Do not run commit/push from this checklist alone.
- Exclude `.cursor/settings.json` from any staging area.

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**
