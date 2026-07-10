# Notification Taxonomy G493–G504 Closeout

**Status:** Complete (contracts + unit tests + design docs only). **No DB migration. No email send. No secrets in payloads.**

**Date:** 2026-07-10  
**Lane:** 3 — Notification taxonomy / event contracts  
**Branch baseline:** `main` @ `66dcb74` (work uncommitted unless owner approves)

## Scope

| Gate | Title | Result |
|------|-------|--------|
| G493 | Notification taxonomy coverage audit | DONE |
| G494 | Legacy alias compatibility tests | DONE |
| G495 | Event families (storage, budget, WordPress, reports, images) | DONE (typed contracts only) |
| G496 | Correlation / idempotency contract tests | DONE (design helpers only) |
| G497 | Payload redaction snapshots | DONE |
| G498 | Recipient / channel / severity policy tests | DONE |
| G499 | Notification event metadata builder | DONE |
| G500 | Audit metadata safe shape | DONE |
| G501 | Shared export surface | DONE (`export *` already covers new symbols) |
| G502 | Docs closeout | DONE |
| G503 | Future DB persistence proposal update | DONE (design only) |
| G504 | Lane validation (focused tests) | DONE |

## Source of truth

| Layer | Path |
|-------|------|
| Shared taxonomy + families + metadata/audit | `packages/shared/src/notification-events.ts` |
| Shared barrel | `packages/shared/src/index.ts` (existing `export * from "./notification-events"`) |
| Correlation / idempotency design | `apps/api/src/notifications/notification-correlation.ts` |
| Unit tests | `apps/api/src/notifications/notification-events.test.ts` |
| Persistence design | `docs/operator/notification-persistence-design.md` |
| Blocker plan | `docs/operator/notifications-blocker-plan.md` |

## Explicit non-ownership (do not edit from this lane)

- `apps/api/src/notifications/email-no-send-adapter*` (Lane 4)
- `apps/api/src/config/email.config*` (Lane 4)
- `apps/api/src/core/ai-budget-notification-mapping*` (Lane 13 — read-only)
- `apps/api/src/core/image-notification-mapping*` (Lane 8 — read-only)
- `docs/email-notifications-contract.md`, `docs/runbooks/EMAIL_NOTIFICATIONS_PROOF.md` (Lane 4)

## Acceptance checks

- No Prisma migration created or applied.
- No live email / Resend call.
- Redaction + safe snapshot + audit safe shape strip `storageKey`, API keys, OAuth tokens, stacks, private audit metadata.
- Correlation helpers remain `persistence: "design_only_no_migration"`.

## Focused validation (G504)

```powershell
cd C:\dcaosv1
node --import tsx --test apps/api/src/notifications/notification-events.test.ts
```

Do **not** run full `npm.cmd run validate` for this lane unless the owner requests it.

## Deferred proposals (G503)

| Item | Status |
|------|--------|
| `InSystemNotification` schema + migration | Deferred — needs N1a owner/schema gate |
| Inbox APIs + UI unread indicator | Deferred — blocked on schema |
| Dedicated `EmailTemplateKey` enum expansion | Deferred — separate schema gate |
| Persist `family` DB column | Deferred — derive from shared map until needed |
| Live Resend / E2E inbox proof | Deferred — owner-gated proof block |

## Confirmations

- Backend runtime notification send paths were not changed.
- Auth / Turnstile / VPS / deploy were not touched.
- No commit / push / deploy in this lane.

## Pre-staging closure follow-up (2026-07-10)

Safe taxonomy/mapping fixes applied outside this original closeout commit:

| Fix | Detail |
|-----|--------|
| Legacy alias severity parity | `client_deliverable_approved` severity aligned to canonical `content_approved` (`info`); G494 now asserts severity + launchCritical parity |
| Kill-switch mapping | `ai-budget-notification-mapping` maps `kill_switch_active` → `kill_switch` / `KILL_SWITCH`; kill switch checked before cap_reached; `cap_reached` severityHint is `blocked` |

**Still owner-gated / unwired:** runtime send paths still bypass taxonomy channel policy; correlation design not persisted; inbox schema; live email.
