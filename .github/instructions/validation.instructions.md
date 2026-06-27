# Validation Rules

## Step 1 - Whitespace check

```powershell
cd C:\dcaosv1
git diff --check
```

Fix any trailing-whitespace or mixed-EOL issues before proceeding.

## Step 2 - Full validate

```powershell
cd C:\dcaosv1
npm.cmd run validate
```

- If validate fails for any reason: **stop. Do not run smoke.**
- Report the failure output to the human.

### Known Windows / Prisma EPERM exception

If `prisma generate` fails with an EPERM file-lock error:

1. List relevant `node.exe` process IDs: `Get-Process -Name node | Select-Object Id, StartTime`
2. Stop only explicit process IDs: `Stop-Process -Id <PID1>, <PID2> -Force`
3. **Do not use `Stop-Process -Name node`** - this can kill unrelated processes
4. Retry validation: `npm.cmd run validate`
5. Retry once only. If validate still fails after one retry, stop and report.

## Step 3 - Focused smoke (only after validate passes)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:ai-delivery-reviews
```

## Step 4 - Local smoke (only after validate passes)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:local
```

## Step 5 - Browser smoke (only after validate passes)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:browser
```

## Logging long-running output for human review

When a command produces output that should be reviewed by the human:

```powershell
npm.cmd run validate 2>&1 | Tee-Object -FilePath "$env:TEMP\dca-validate.log"
notepad "$env:TEMP\dca-validate.log"
```

Use PowerShell commands only. Do not use bash, Unix pipes, or Unix redirects.

## Service startup rules

- Do not start API or web for docs-only or scaffolding-only changes.
- Start API or web only when smoke or browser proof requires it.
- API: `npm.cmd run dev:api` from `C:\dcaosv1`
- Web: `npm.cmd run dev:web` from `C:\dcaosv1`
- If local smoke needs readiness confirmation, check API health: `http://localhost:4000/api/v1/health`
- Stop `node.exe` only for Prisma EPERM recovery or before a fresh local smoke startup.
- Never run smoke after a failed validate.

## Local admin auth for smoke

- Local smoke and auth commands may use `$env:AUTH_SEED_TEST_PASSWORD` for the local admin account (`admin@dca.local`).
- Do not ask the human for the local admin password if `$env:AUTH_SEED_TEST_PASSWORD` already exists in the session.
- Do not print the value of `$env:AUTH_SEED_TEST_PASSWORD`.
- If the variable is missing, stop and ask the human to set it as a temporary local environment variable.

## Rules summary

- **Never run smoke after a failed validate.**
- Never skip `git diff --check`.
- Never use `bash`, `sh`, or Unix-style commands on this repo.
- Prefer `npm.cmd` over `npm` on Windows to avoid path resolution issues.
- **If backend/API proof passes but UI fails, compare browser payload/form state against backend contract. Do not repeat login/session guessing.**

## Loop control

- If the same command fails repeatedly, stop and report the issue.
- Do not retry the same approach more than twice without changing strategy.
- If validation fails and the fix is not obvious, stop and ask for guidance.
