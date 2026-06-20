# Email Notifications Backend Foundation Contract

Status: EN1 backend foundation only. EN2 event wiring remains paused until modules are stable.

## Purpose

The Email Notifications foundation provides a safe, general backend contract for recording outbound email notification attempts before any production email provider is enabled.

EN1 is persistence and runtime scaffolding only. It does not send real email.

Current state note: provider defaults exist and the Resend domain `notifications.digitalcubeagency.net` is verified. No `RESEND_API_KEY` has been added, no real sending is active, and no module events are wired to send notifications.

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

## Template keys

Only these template keys are part of the EN1 contract:

- `CLIENT_INVITE`
- `PASSWORD_RESET`
- `AI_DELIVERY_BRIEF_REQUEST`
- `AI_DELIVERY_REVIEW_REQUEST`
- `AI_DELIVERY_APPROVED`
- `INVOICE_ISSUED`

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
- `EMAIL_PROVIDER=resend` with `RESEND_API_KEY`: adapter-shaped only in EN1; logs `SKIPPED`; no email is sent.

The utility returns the email log id, final status, provider, provider message id, and error message. It does not expose secret values.

## Explicit exclusions

EN1 does not include:

- real email sending in local mode
- real Resend sending
- API keys or secrets in the repository
- UI
- Client Access behavior changes
- Client Portal behavior changes
- AI Delivery behavior changes
- invoice/task behavior changes
- bulk email
- marketing/newsletter email
- background queue
- cron or scheduled jobs
- EN2 event wiring
- VPS/deploy changes