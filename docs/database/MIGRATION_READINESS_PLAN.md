# DCA OS v1 - Migration Readiness Plan

## 1. Executive Summary

No migration is approved yet.

This plan defines prerequisites only. The DB-1 schema validates, local PostgreSQL setup still needs approval, and production migration is far later.

## 2. Migration Principles

- keep migrations small
- review the schema diff before every migration
- do not run production migrations without backup/restore thinking
- start local first
- stage before production later
- do not use `db push` for production-like environments
- name migrations clearly
- keep rollback and recovery notes with each migration step

## 3. Pre-Migration Checklist

- schema security review passed
- relation/constraint review passed
- local PostgreSQL setup approved
- `DATABASE_URL` is placeholder-only for planning
- migration command approved
- backup strategy is not needed for an empty local dev database, but is required before production use
- no production DB is connected
- human approval is recorded

## 4. Local Migration Plan Later

Future command sequence only, not approved yet:

1. configure local `DATABASE_URL`
2. run `prisma migrate dev` with a reviewed name
3. run `prisma validate`
4. inspect the generated migration
5. run workspace checks

## 5. Migration Naming Convention

Recommended first name:

- `init_db1_foundation`

## 6. Rollback / Recovery Plan

Local dev:

- reset the local database only if that is explicitly approved

Production later:

- back up before migration
- test restore before production use
- document rollback expectations

## 7. CI Considerations

CI should remain validate-only until a database service is explicitly added to the pipeline.

## 8. Explicitly Forbidden Until Approval

- `prisma migrate`
- `prisma db push`
- production database URL
- deployment migration
- seed work against real data

## 9. Human Approval Required

- local PostgreSQL setup
- migration command approval
- backup and rollback policy
- production rollout policy later

## 10. Recommended Next Step

Approve local PostgreSQL development planning next.

