# Email Notifications Backend Foundation Contract

Status: EN1 backend notification scaffolding is complete. EN2 now includes a schema-free platform AuditLog writer foundation. G159–G170 and G249–G268 expanded the pure notification taxonomy, recipient/channel/severity policy, payload redaction + safe snapshots, typed template catalog, legacy alias map, correlation/idempotency design, and no-send adapter edge coverage. **G505–G516** hardened email config (disabled / missing / live-deferred), no-send adapter contract, template catalogue completeness, missing-template safety, recipient + template-variable redaction, and launch-critical / admin-only email matrices. Real provider sending remains inactive by default. **Local v1 in-app inbox** (`InAppNotification` + admin/client list/mark-read APIs + shell panel) is implemented; write path must redact `payloadJson` via `redactNotificationPayload` (see `apps/api/src/notifications/in-app-notifications.service.ts`). Live Resend / staging delivery proof remains owner-gated. Historical design notes: `docs/operator/notification-persistence-design.md`.

## Purpose

The Email Notifications foundation provides a safe, general backend contract for recording outbound email notification attempts before any production email provider is enabled.

EN1 is persistence and runtime scaffolding only. It does not send real email.

Current state note: provider defaults exist and the Resend domain `notifications.digitalcubeagency.net` is verified. No `RESEND_API_KEY` has been added, no real sending is active, and no module events are wired to send notifications. Platform audit events now write to `AuditLog`; `EmailLog` remains non-sending notification scaffolding only.

## Environment configuration

Locked local defaults:

```text
EMAIL_PROVIDER=local
EMAIL_FROM_ADDRESS=no-reply@notifications.digitalcubeagency.net
EMAIL_REPLY_TO=admin@digitalcubeagency.net
```

Future provider value:

```text
EMAIL_PROVIDER=resend
```

`RESEND_API_KEY` is read only from the runtime environment as a presence check. The key must not be committed, hardcoded, printed, or requested.

G505 live-send authorization (names only; never commit values):

```text
EMAIL_LIVE_SEND_AUTHORIZED=true
```

Without this exact value, a keyed Resend config is **live-deferred**: `sendingEnabled=false`, `localNoSend=true`, `liveSendDeferred=true`. No network call is made.

## Template keys

Only these **schema** template keys are part of the EN1 contract (Prisma `EmailTemplateKey`):

- `CLIENT_INVITE`
- `PASSWORD_RESET`
- `AI_DELIVERY_BRIEF_REQUEST`
- `AI_DELIVERY_REVIEW_REQUEST`
- `AI_DELIVERY_APPROVED`
- `INVOICE_ISSUED`

G166 adds a **typed logical catalog** in `packages/shared/src/notification-events.ts` (`TYPED_NOTIFICATION_TEMPLATE_CATALOG`) for:

- `CLIENT_APPROVAL_REQUIRED`
- `CONTENT_CHANGES_REQUESTED`
- `IMAGE_REPLACEMENT_READY`
- `MONTHLY_REPORT_AVAILABLE`
- `WORDPRESS_DRAFT_PREPARED`
- `INTEGRATION_PROOF_FAILED`
- `BUDGET_CAP_BLOCKED`

Those typed keys are **not** schema enum values. Until a schema gate adds dedicated keys, they map onto the existing schema keys above (typically `AI_DELIVERY_REVIEW_REQUEST` or `AI_DELIVERY_BRIEF_REQUEST`). Do not claim dedicated template keys exist in the database.

## Email log persistence

`EmailLog` records notification attempts with:

- `id`
- `tenantId` nullable for system-level flows such as password reset
- `recipientEmail`
- `subject`
- `templateKey`
- `status`
- `relatedModule` nullable
- `relatedEntityId` nullable
- `providerMessageId` nullable
- `errorMessage` nullable
- `createdAt`
- `sentAt` nullable

Statuses:

- `QUEUED`
- `SENT`
- `FAILED`
- `SKIPPED`

## Safe send behavior

The backend utility `sendEmailNotification` logs an `EmailLog` record for every call.

- `EMAIL_PROVIDER=local`: logs `SKIPPED`; no email is sent.
- `EMAIL_PROVIDER=resend` without `RESEND_API_KEY`: logs `FAILED`; no email is sent.
- `EMAIL_PROVIDER=resend` with `RESEND_API_KEY` but without `EMAIL_LIVE_SEND_AUTHORIZED=true`: logs `SKIPPED` (live-deferred); no email is sent (G505).
- `EMAIL_PROVIDER=resend` with `RESEND_API_KEY` and `EMAIL_LIVE_SEND_AUTHORIZED=true`: only then may the Resend adapter path run — still requires a separate owner-approved live proof block (G515 deferred).
- Missing / unknown template key: logs `SKIPPED`; no email is sent (G508).

The utility returns the email log id, final status, provider, provider message id, and error message. It does not expose secret values.

Outbox status (`getEmailNotificationOutboxStatus`) exposes `sendingEnabled`, `localNoSend`, `liveSendDeferred`, and `liveProofRequired` without serializing secrets.

## EN2 schema-free platform audit foundation

EN2 currently adds a schema-free platform audit foundation without enabling provider delivery, queues, background jobs, or Client Portal behavior.

Canonical event trail:

- `AuditLog` is the canonical append-only platform event trail.
- `EmailLog` remains EN1 notification scaffolding and is not the source of truth for platform audit history.

Currently wired platform actions:

- auth logout
- tenant switch
- tenant settings update
- module enable
- module disable

Current EN2 scope notes:

- audit writes use the existing `AuditLog` model only
- no schema or migration changes were required for this slice
- no email provider send path is triggered by these audit writes
- no queue, background job, cron, or Client Portal behavior is enabled

## Local non-sending proof

Local proof completed with a reversible module action:

- selected action: enable `finance-lite`, then restore the original disabled state
- observed result: one `AuditLog` row for `module.enabled`
- populated fields observed: `tenantId`, `actorType`, `actorUserId`, `entityType`, `entityId`, and metadata with module context
- local state was restored after the proof
- `EmailLog` rows created during the proof: `0`
- no provider/send path was triggered

## G159–G170 / G249–G268 pure notification foundation (no persistence)

Shared module `packages/shared/src/notification-events.ts` (version `NOTIFICATION_EVENTS_V2`) provides:

- Expanded `NotificationEventType` taxonomy (content/image/approval/report/integration/budget/storage/WordPress events, plus legacy G94–G102 aliases)
- Legacy alias map + `resolveNotificationLegacyAlias()` (G250)
- Recipient policy helper: admin / client / owner-operator / system-log-only
- Channel policy: in-system required; email for launch-critical non-audit events; audit-only for internal proof; local no-send
- Severity scale: `info` / `action_required` / `warning` / `blocked` / `critical`
- Payload redaction helper excluding secrets, `storageKey`, raw provider responses, OAuth tokens, stack traces, private audit metadata
- `buildNotificationPayloadSnapshot()` allowlisted safe snapshot (G255)
- Typed template catalog mapped onto schema-safe keys
- `buildNotificationAuditMetadata()` for safe audit metadata (boolean key presence only)

API modules:

- `apps/api/src/notifications/email-no-send-adapter.ts` — skipped attempts only; no provider call; no API key required (G506)
- `apps/api/src/notifications/email-template-catalog.ts` — schema/typed catalogue completeness + launch-critical / admin-only matrices (G507–G508, G511–G512)
- `apps/api/src/notifications/email-redaction.ts` — recipient + template-variable redaction (G509–G510)
- `apps/api/src/notifications/notification-correlation.ts` — correlation/idempotency **design** keys only (G257); no migration
- `apps/api/src/config/email.config.ts` — disabled-safe / live-deferred safety shape (G264 / G505)

In-app persistence (local v1): Prisma `InAppNotification` + `in-app-notifications.service.ts` (upsert/list/mark-read). Payload redaction on write is mandatory. Historical design doc: `docs/operator/notification-persistence-design.md`.

Lane closeout: `docs/runbooks/EMAIL_NO_SEND_G505_G516_CLOSEOUT.md`.

## Explicit exclusions

EN1 does not include:

- real email sending in local mode
- real Resend sending
- API keys or secrets in the repository
- Client Access behavior changes beyond existing inbox surfaces
- AI Delivery behavior changes
- invoice/task behavior changes
- bulk email
- marketing/newsletter email
- background queue
- cron or scheduled jobs
- real provider delivery from EN2 audit events
- VPS/deploy changes
- staging/production live email proof (owner-gated separately)