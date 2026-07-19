# P2-A Owner-Run Local Exporter

Status: `BUILD_ONLY_AUTHORIZED` / `EXECUTION_NOT_AUTHORIZED`

## Purpose and module boundary

The owner-run exporter is a future, separate module that may create an already anonymized P2-A snapshot only after a new explicit single-use owner authorization. It must never be imported by, or add database capability to, `p2-a-offline-foundation.mjs`; the validator remains pure file/input validation with no database client or execution path.

This decision authorizes implementation, synthetic/mocked tests, documentation, review, CI, and merge only. It does not authorize execution, database access, Docker, a real snapshot, secret inspection, migrations, schema changes, backfill, reconciliation, runtime/flag/endpoint changes, dependency updates, remote/staging/production/VPS/Tellanic activity, or Phase 3.

## Future execution contract

The disabled-by-default tool must require an explicit, single-use owner authorization before it can begin any database work. It must accept only the exact local source target `127.0.0.1:5434`, reject a missing target and every other host, port, URL, or environment, and reject apply, write, mutate, backfill, reconcile, switch, cleanup, or access-widening modes. Any future database session must use read-only semantics.

Its only permitted output is one `DCA_OS_V2_P2_A_SNAPSHOT_V1` JSON file under `C:\dcaosv1-p2-evidence`, containing only pseudonymous keys and approved P2-A fields. The exporter derives deterministic pseudonymous keys, selection hash, manifest/hash, mappings, `ClientUserAccess` count/hash invariant, and exactly six `OWNER_REMEDIATION_REQUIRED` no-role exceptions. It excludes source IDs, names, e-mail addresses, PII, credentials, connection strings, and raw records. It must not print connection material or source data.

## Required build proof

All development and tests use synthetic or mocked fixtures only. Negative tests must prove rejection of non-local/missing targets, write/apply modes, missing owner authorization, prohibited output fields, unknown no-role exceptions, and any attempt to widen Client access.

## Current build proof

The separate disabled exporter module is implemented with injected population input only; it does not open a database connection during the build package. Run its synthetic test suite with:

```text
npm run -w @dca-os-v1/data test:p2-a:owner-exporter
```

The owner-run command remains disabled and exits before any database operation. A future execution authorization is still required.
