# DCA OS v1 - Auth Migration Execution Plan

This document captures the future local migration sequence for auth-related DB work.

No migration is run in this block.

## 1. Pre-Migration Commands

Run in order only after the local database is approved:

```powershell
cd C:\dcaosv1
git status --short --branch
npm.cmd run -w @dca-os-v1/data prisma:validate
npm.cmd run -w @dca-os-v1/data check
```

## 2. Future Migration Command

Do not run yet:

```powershell
npm.cmd run -w @dca-os-v1/data prisma:migrate:dev -- --name auth_foundation
```

## 3. Post-Migration Commands

Run after reviewing the generated migration:

```powershell
npm.cmd run check
npm.cmd run build
npm.cmd run -w @dca-os-v1/data prisma:validate
npm.cmd run -w @dca-os-v1/data check
npm.cmd run -w @dca-os-v1/data check:data-layer
npm.cmd run -w @dca-os-v1/api check:auth-skeleton
git diff --check
```

## 4. Migration Review

- inspect the generated migration SQL
- confirm no production DB was touched
- confirm only the local DB was used

## 5. Rollback / Reset

- keep rollback local-only
- use a reset strategy only after explicit approval
- do not document destructive production actions
- no production rollback is needed because production DB does not exist yet

## 6. Status

This is planning only. The command above is not approved in this block.
