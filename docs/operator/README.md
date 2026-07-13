# Operator Documentation Index

Status: Plain-language documentation set for admins, client delivery, and readiness planning.

**Primary entry points (Block 4):**

- [`../STATUS.md`](../STATUS.md) — **source of truth** for current state, blocks, readiness, staging gates, deferred items
- [`OPERATOR_RUNBOOK.md`](./OPERATOR_RUNBOOK.md) — consolidated validation, smoke, recovery, staging/production prerequisites, commit/push and secret policy
- [`ENV_READINESS_INVENTORY.md`](./ENV_READINESS_INVENTORY.md) — env variable names by category (no values)

## For Daily Admin Use

- `admin-operator-manual.md` — simple guide for how an admin should use the system day to day.
- `client-delivery-sop.md` — step-by-step process for monthly client delivery.
- `first-client-next-actions.md` — short first-client practice run list.

## For Planning And Readiness

- [`../STATUS_COMPLETION.md`](../STATUS_COMPLETION.md) — percentage completion by area/module (local MVP vs production vs deferred).
- `pre-production-readiness-checklist.md` — checklist before production or live client access.
- `deferred-scope-register.md` — list of features intentionally not active yet.
- `module-completion-matrix.md` — plain-language status of each system area/module.
- `first-client-dry-run-checklist.md` — controlled admin dry-run checklist.

## Technical Runbooks (detailed)

- [`../runbooks/STAGING_READINESS.md`](../runbooks/STAGING_READINESS.md) — pre-staging GO/NO-GO pack
- [`../runbooks/PRE_STAGING_VALIDATION_GATE.md`](../runbooks/PRE_STAGING_VALIDATION_GATE.md) — one-command local gate
- [`../runbooks/LOCAL_SMOKE_MATRIX.md`](../runbooks/LOCAL_SMOKE_MATRIX.md) — smoke catalog and what each proves
- [`../runbooks/EXTERNAL_INTEGRATIONS_READINESS.md`](../runbooks/EXTERNAL_INTEGRATIONS_READINESS.md) — Block 1 config-only readiness
- [`../runbooks/ADMIN_OPERATIONS_RECOVERY.md`](../runbooks/ADMIN_OPERATIONS_RECOVERY.md) — Block 2 admin operations recovery

## For GitHub-First Work

- `chatgpt-github-operating-model.md` — GitHub-first operating model.
- `github-first-task-selection.md` — guide for Mode A, Mode B, and local deferral.
- `github-proof-checklist.md` — proof rules for GitHub-side work.
- `github-first-reporting-standard.md` — reporting format for GitHub-first work.

## Current Operating Position

DCA OS Lite supports **controlled local/admin MVP** work on `main` (baseline at sweep time: `66dcb74`). Current production state is healthy and in clean-state reset PASS; interactive admin login is verified; Turnstile is temporarily disabled; Puriva Launch remains blocked; and further production mutations require explicit approval.

**Truth labels (do not upgrade):** Launch readiness **NO**. Puriva Launch **BLOCKED**. Live provider / WordPress / GA/GSC / R2 / staging / production live proofs are **not** claimed.

It is not automatically approved for production deployment, staging deploy, or live client portal rollout.

**Pre-staging / further env work:** Historical G46d/G47 staging PASS does not authorize new staging mutation or live integration enablement; fresh explicit owner approval required before any staging/VPS/production or live-proof session.

## Admin Rule

The admin controls the process. AI helps prepare research, plans, drafts, images, summaries, and handoff material, but the admin reviews and decides what becomes final.

## Client Rule

Clients should see client-safe final work only (Client Portal MVP required for Puriva).

The Client Portal is not an approval/comment system in the MVP visibility scope; human/client review before publication is handled through the approved delivery workflow.

## Production Rule

Production, VPS, live client access, live provider sending, and live external integrations need a separate approval block before use.
