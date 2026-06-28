# Staging Migration Procedure

## Purpose

Use this runbook to apply Prisma/database migrations safely in staging before any production promotion.

**G1 context (2026-06-27):** Approved staging host is `staging.digitalcubeagency.net` (separate stack on same VPS). Production remains `system.digitalcubeagency.net`. DNS for staging is **not created yet**; G4 VPS execution is **not approved**. Do not run this procedure until G4 owner approval and staging infrastructure exist.

## Scope

- Staging-only migration execution
- Backup-before-migration workflow
- Post-migration validation and evidence capture
- Production promotion gate after staging success

## Required approvals

- Staging migration: explicit human approval
- Production migration: explicit human approval and separate production gate

## Pre-migration checklist

- Confirm the target environment is staging
- Confirm the target is not the live production VPS at `system.digitalcubeagency.net` unless a separate explicit production approval exists
- Confirm the branch and commit to be deployed
- Confirm the migration list and expected schema impact
- Confirm a fresh backup exists
- Confirm rollback expectations are documented
- Confirm no secrets will be printed
- Confirm output will be captured to a timestamped log

## Confirm branch and commit

- Record the branch name
- Record the commit SHA
- Confirm the working tree matches the intended change

## Confirm migration list

- List the pending Prisma migrations
- Confirm no unrelated schema changes are included
- Confirm the migration order is expected

## Backup before migration

- Take a staging backup immediately before running migrations
- Keep the backup artifact and log with the change evidence
- Do not continue if the backup fails

## Migration execution template

Use placeholders only:

```powershell
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$migrationLog = "<log-path>\staging-migration-$timestamp.log"

prisma migrate deploy 2>&1 | Tee-Object -FilePath $migrationLog
```

## Prisma migration safety notes

- Run migrations in the approved environment only
- Do not guess at schema state
- Do not skip the pre-migration backup
- Do not run destructive commands unless the migration plan explicitly requires them and approval covers them
- Stop if Prisma reports an error, drift, or lock issue

## Post-migration validation checklist

- Confirm the migration completed successfully
- Confirm the application starts against the migrated schema
- Confirm core API health checks pass
- Confirm tenant-scoped flows still behave as expected
- Confirm no unexpected data loss occurred

## Smoke / health checks after successful migration only

- Run health checks only after migration success
- Run focused smoke only after validation passes
- Do not run smoke if migration failed

## Rollback / failure procedure

1. Stop the migration workflow.
2. Capture the error output.
3. Restore the pre-migration backup into staging if needed.
4. Re-evaluate the migration plan before retrying.
5. Do not promote to production until the failure is understood.

## Production promotion gate

- Production promotion requires separate explicit approval
- Production migration must not be treated as automatic after staging success
- Production deployment remains frozen unless explicitly approved

## Evidence required

- Branch name and commit SHA
- Backup artifact name
- Migration log path
- Post-migration validation notes
- Health/smoke results
- Approval reference

## STOP conditions

- Staging backup was not completed first
- The migration list is unclear
- The database target is unclear
- Any secret would need to be exposed
- Validation fails after migration
- Smoke fails after a successful migration
- Production/VPS action would be needed without explicit approval
