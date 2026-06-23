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

```powershell
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
npm.cmd run validate
```

Retry once only. If validate still fails after one retry, stop and report.

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

## Rules summary

- Never run smoke after a failed validate.
- Never skip `git diff --check`.
- Never use `bash`, `sh`, or Unix-style commands on this repo.
- Prefer `npm.cmd` over `npm` on Windows to avoid path resolution issues.
