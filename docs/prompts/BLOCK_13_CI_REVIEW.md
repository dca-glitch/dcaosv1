# Block 13 Prompt — CI Result Review and Repair

## Role

Act as senior implementation agent under architect supervision.

## Repository

```text
https://github.com/dca-glitch/dcaosv1
```

## Objective

Review the GitHub Actions CI result and repair only CI or validation issues if needed.

## Scope

Allowed:

- inspect latest GitHub Actions CI result
- inspect failing logs
- run local validation commands
- fix small CI or validation errors
- update workflow only if required
- update scripts only if required

Not allowed:

- no migrations
- no database connection
- no seed files
- no auth implementation
- no deployment
- no feature modules
- no broad dependency upgrades
- no forced audit repair

## Validation Commands

Run:

```text
npm ci
npm run check
npm run build
npm run -w @dca-os-v1/data prisma:validate
npm run -w @dca-os-v1/data check
```

## Required Report

Report:

1. CI run reviewed
2. failing step if any
3. root cause
4. files changed
5. validation results
6. confirmations that no blocked actions were performed
7. recommended next block
