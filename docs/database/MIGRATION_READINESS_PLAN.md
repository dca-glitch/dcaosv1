# DCA OS v1 - Migration Readiness Plan

## 1. Gate scope and current status

This document is the migration-readiness and rollback gate for pre-staging.

- Scope reviewed: tenant/module entitlement behavior, AI budget ledger, monthly-report dependencies, email log foundation, and in-app notifications.
- Evidence basis: full relevant Prisma migration history in `packages/data/prisma/migrations/*`.
- Execution boundary: **no staging/prod/remote database mutation was performed** during this gate.
- Rollback truth: Prisma `migrate deploy` is one-way for applied migrations; there is **no automatic Prisma rollback**.

## 2. Relevant migration history and classification

| Order | Migration | Primary area | Classification | Readiness notes |
| --- | --- | --- | --- | --- |
| 20260613102310 | `init_db1_foundation` | Tenant, membership, role/permission, `ModuleDefinition`, `TenantModule` | Constraint-enforcing | Establishes entitlement core with unique and FK constraints (`TenantModule_tenantId_moduleDefinitionId_key`, module FKs). |
| 20260614015356 | `add_session_active_tenant_membership` | Session tenant context | Additive | Adds nullable `Session.activeTenantMembershipId`, index, FK `ON DELETE SET NULL`; existing sessions remain compatible. |
| 20260619091000 | `add_client_user_access` | Client boundary scoping | Constraint-enforcing | Adds `ClientUserAccess` with tenant/client/user uniqueness and tenant/client/user FKs. |
| 20260620050000 | `add_ai_delivery_workflow_runs` | AI workflow runtime | Additive | Adds `AiDeliveryWorkflowRun` and indexes/FKs needed later by budget ledger references. |
| 20260621063828 | `add_ai_workflow_execution_schema_foundation` | AI workflow execution lifecycle | Additive | Adds enum value `FAILED` and nullable execution fields; no backfill requirement. |
| 20260620165200 | `add_email_notifications_foundation` | Notification/email audit baseline | Additive | Adds `EmailLog`, status/template enums, indexes, and nullable tenant FK. |
| 20260625033645 | `add_ai_delivery_monthly_reports` | Monthly reports | Constraint-enforcing | Adds `AiDeliveryMonthlyReport` with unique tenant+project and tenant/project/client FKs. |
| 20260625132121 | `add_ai_delivery_monthly_metric_snapshots` | Monthly metric snapshots | Constraint-enforcing | Adds one-snapshot-per-report uniqueness and report/project/user FKs. |
| 20260626040000 | `monthly_report_mi_context` | Monthly report MI handoff linkage | Additive | Adds nullable `miHandoffId` + `miContextDraft`, FK `ON DELETE SET NULL`, and lookup index. |
| 20260629120000 | `finance_event_ledger` | Finance ledger baseline | Constraint-enforcing | Adds finance ledger tables with uniqueness (`tenantId,source,sourceEntityId`) and strict tenant-linked FKs. |
| 20260629140000 | `client_approval_workflow` | Client review flow for deliverables/images | Constraint-enforcing | Adds review statuses and image approval table with unique deliverable+image key and FKs. |
| 20260704180000 | `mi_summary_delivery_integration` | Monthly report + MI summary linkage | Additive | Adds nullable summary linkage columns/FKs/indexes; existing rows remain valid. |
| 20260709120000 | `add_ai_budget_ledger` | AI budget ledger | Constraint-enforcing | Adds `AiBudgetLedgerEntry`, DECIMAL(10,4) costs, uniqueness on tenant+workflowRun+stepReference, and workflow/client FKs (`SET NULL`). |
| 20260711115000 | `add_in_app_notifications` | In-app notification inbox persistence | Constraint-enforcing | Adds `InAppNotification` + status enum, dedupe unique index, inbox query indexes, and tenant/user/client FKs. |

### Classification summary

- Additive: 6
- Constraint-enforcing: 8
- Backfill-required: 0
- Destructive: 0

## 3. Existing-row compatibility audit

Compatibility is acceptable for existing rows in this scoped history because:

1. New columns on existing tables are nullable and/or have safe defaults:
   - `Session.activeTenantMembershipId` nullable.
   - `AiDeliveryMonthlyReport.miHandoffId`, `miContextDraft`, `miSummaryId` nullable.
   - `AiDeliveryWorkflowRun.executionError`, `executionLog`, `startedAt`, `finishedAt` nullable.
   - Approval workflow additions (`bodyContent`, `clientRejectionReason`, `tags`, `category`, `scheduledPublishAt`) are nullable or defaulted.
2. New enums only add values; no enum value removals/renames in scoped migrations.
3. No scoped migration drops a table/column/index or rewrites existing data in place.
4. Numeric precision for AI budget ledger is explicit (`DECIMAL(10,4)` for estimated/actual USD).
5. Timestamp behavior is explicit:
   - `createdAt` defaults to `CURRENT_TIMESTAMP`.
   - `updatedAt` is non-null and application-maintained.

## 4. Ordering, keys, constraints, and index readiness

1. Ordering dependencies are valid:
   - Entitlement base (`init_db1_foundation`) precedes all tenant/module behavior.
   - Workflow run creation precedes AI budget ledger FK reference.
   - Monthly report creation precedes metric snapshot and MI-link migrations.
2. FK behavior is compatible with rollback/app downgrade safety expectations:
   - `SET NULL` used where linked entities may disappear (`Session.activeTenantMembershipId`, budget ledger optional links, monthly report MI links, in-app optional `clientId`).
   - `CASCADE` used for strict tenant-owned data.
3. Uniqueness constraints that matter operationally:
   - Tenant module entitlement uniqueness by tenant+module.
   - AI budget ledger dedupe by tenant+workflowRun+stepReference.
   - In-app notification dedupe by tenant/event/entity/recipient/action.
4. Index readiness:
   - Tenant-scope and status/time indexes exist for entitlement checks, inbox reads, and ledger queries.
   - No scoped migration removes required indexes.

## 5. Backup, rollback, restore, and forward-fix gate

## Backup prerequisites (must pass before staging apply)

1. Fresh pre-migration backup artifact captured for the target staging database.
2. Backup integrity verified (artifact readable + checksum/size sanity + restore rehearsal to non-prod target).
3. Verification snapshot recorded for key tables:
   - `Tenant`, `ModuleDefinition`, `TenantModule`
   - `ClientUserAccess`
   - `AiDeliveryWorkflowRun`, `AiBudgetLedgerEntry`
   - `AiDeliveryMonthlyReport`, `AiDeliveryMonthlyMetricSnapshot`
   - `EmailLog`, `InAppNotification`

## Application rollback and database rollback policy

1. **No automatic Prisma rollback claim**: `migrate deploy` does not generate down-migrations.
2. If migration fails before full apply: stop rollout, keep app at pre-change release, inspect migration log.
3. If schema applies but app behavior fails:
   - first attempt app rollback only when schema remains backward-compatible;
   - otherwise perform database restore from verified pre-migration backup.
4. Forward-fix is preferred when:
   - no data loss occurred,
   - issue is isolated and reversible by a new additive migration,
   - restore blast radius is higher than a controlled corrective migration.

## Restore triggers

Restore is triggered when any of the following occur post-apply:

- data corruption or missing rows in entitlement/ledger/notification/report tables,
- unrecoverable constraint failures impacting tenant-critical flows,
- incompatible app rollback with already-applied schema,
- failed forward-fix attempt inside approved recovery window.

## Abort conditions (do not run staging migration)

- backup missing, unverified, or restore rehearsal failed;
- migration ordering/target database is ambiguous;
- pending migration includes destructive or backfill-required change without an approved execution/backfill plan;
- unresolved drift/lock/error from Prisma migrate state;
- rollback owner and restore procedure are not assigned.

## 6. Staging preflight assumptions

The staging migration run may proceed only if all assumptions hold:

1. Correct target is confirmed as staging (never production by default).
2. Branch/SHA and migration set are frozen and reviewed.
3. Pending migrations exactly match this reviewed history (or this document is refreshed).
4. Backup + restore verification evidence is attached to the staging run.
5. Post-apply validation + full smoke matrix are prepared, and smoke is gated on validation success.
