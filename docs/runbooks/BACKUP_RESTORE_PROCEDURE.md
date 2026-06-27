# PostgreSQL Backup / Restore Procedure

## Purpose

Use this runbook to protect staging and production PostgreSQL data before any migration, deploy, or other high-risk change.

## Scope

- Staging backups before migration rehearsal
- Production backups before any explicitly approved restore or maintenance action
- Restore verification in staging before production consideration

## Non-goals

- No live execution from this document
- No secret storage in the repo
- No destructive commands without explicit approval
- No production/VPS action unless the human explicitly approves it

## Required approvals

- Backup on production: explicit human approval
- Restore on staging: explicit human approval
- Restore on production: explicit human approval and emergency-only gate

## Pre-backup checklist

- Confirm the target environment: staging or production
- Confirm the branch, commit, and intended change
- Confirm the maintenance window or change approval
- Confirm the database target and backup destination
- Confirm enough disk space for the backup artifact
- Confirm output will be written to a timestamped log
- Confirm no secrets will be printed into logs

## Backup command template

Use placeholders only:

```powershell
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "<backup-path>\pg-backup-$timestamp.sql"
$logPath = "<log-path>\pg-backup-$timestamp.log"

pg_dump --format=plain --no-owner --no-privileges --file $backupPath "<DATABASE_URL>" 2>&1 |
  Tee-Object -FilePath $logPath
```

## Recommended log capture

- Write command output to a timestamped log file
- Keep the log alongside the backup artifact
- Do not include passwords, tokens, or connection strings in the log

## Backup artifact naming

Use a consistent format such as:

- `pg-backup-<environment>-<timestamp>.sql`
- `pg-backup-<environment>-<timestamp>.log`

## Storage, encryption, and access control

- Store backups outside the application repository
- Restrict access to approved operators only
- Encrypt at rest if the storage system supports it
- Do not upload backup artifacts to public locations
- Retain the backup chain only as long as required by policy

## Restore procedure

### Restore into staging first

1. Confirm the backup artifact is readable and complete.
2. Confirm the staging database target is correct.
3. Restore into staging before any production consideration.
4. Capture output to a timestamped log.
5. Verify the restored data matches the expected snapshot.

### Restore command template

```powershell
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$restoreLog = "<log-path>\pg-restore-$timestamp.log"

psql "<DATABASE_URL>" -f "<backup-path>\pg-backup-<environment>-<timestamp>.sql" 2>&1 |
  Tee-Object -FilePath $restoreLog
```

## Restore verification checklist

- Confirm the restore completed without fatal errors
- Confirm the application can connect to the restored database
- Confirm core tables and seed records are present
- Confirm the expected tenant and module data are intact
- Confirm no unexpected schema drift appeared
- Confirm smoke or validation only runs after restore success

## Production restore emergency gate

- Production restore is emergency-only
- Require explicit human approval before execution
- Confirm the incident, impact, and rollback plan first
- Confirm staging restore has already been proven when possible
- Stop immediately if the backup is incomplete, unreadable, or unverified

## RTO / RPO placeholders

- **RTO:** `<RTO-target>`
- **RPO:** `<RPO-target>`

## Evidence to attach to deployment notes

- Backup timestamp
- Backup artifact name
- Restore log path
- Restore verification notes
- Approval reference

## STOP conditions

- Any credential or secret would need to be exposed
- The backup destination is unknown
- The target database is unclear
- The backup artifact cannot be validated
- The restore would bypass staging
- Production restore approval has not been granted
- The change requires touching VPS or production without explicit approval
