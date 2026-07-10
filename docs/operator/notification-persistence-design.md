# Notification Persistence + Inbox API Design (G167–G168)

**Status:** Design only (G159–G170 notifications lane, 2026-07-10). **No migration. No API implementation. No live email.**

**Purpose:** Implementation-ready design for user-scoped in-system notification persistence and admin/client inbox endpoints, using the expanded G159 taxonomy in `packages/shared/src/notification-events.ts`.

**Related:**

- Taxonomy / policy: `packages/shared/src/notification-events.ts`
- No-send adapter: `apps/api/src/notifications/email-no-send-adapter.ts`
- Operator plan: [`notifications-blocker-plan.md`](./notifications-blocker-plan.md)
- Email proof (no live claim): [`../runbooks/EMAIL_NOTIFICATIONS_PROOF.md`](../runbooks/EMAIL_NOTIFICATIONS_PROOF.md)
- EN1/EN2 contract: [`../email-notifications-contract.md`](../email-notifications-contract.md)

---

## 1. Why a new model is required

| Existing store | Suitable as user inbox? | Why not |
|----------------|-------------------------|---------|
| `EmailLog` | **No** | Outbound attempt log; admin-scoped; no unread/read; not client-safe |
| `AuditLog` | **No** | Compliance trail; not a notification inbox; may contain private audit metadata |
| G61 in-memory AI notification recorder | **No** | Dry-run / orchestrator only; not persisted |

**Conclusion:** Stage 1 in-system MVP needs a dedicated user-scoped notification table (or equivalent approved reuse). This document proposes that model. **Do not migrate until a separate schema-approved block.**

---

## 2. Proposed Prisma model (design only — do not migrate)

```prisma
enum InSystemNotificationStatus {
  UNREAD
  READ
  ARCHIVED
}

model InSystemNotification {
  id                 String                      @id @default(uuid())
  tenantId           String
  recipientUserId    String
  recipientRole      String                      // admin | client | owner_operator | system_log_only
  clientId           String?                     // required for client-scoped rows
  eventType          String                      // NotificationEventType
  severity           String                      // info | action_required | warning | blocked | critical
  title              String
  body               String?
  relatedEntityType  String
  relatedEntityId    String
  correlationId      String?
  status             InSystemNotificationStatus  @default(UNREAD)
  readAt             DateTime?
  createdAt          DateTime                    @default(now())
  /// Redacted JSON only — never secrets, storageKey, OAuth, stack, raw provider, private audit
  payloadJson        Json?

  tenant             Tenant                      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  // recipientUserId → User (or ClientUserAccess user) — exact FK TBD in schema block

  @@index([tenantId, recipientUserId, status, createdAt])
  @@index([tenantId, clientId, status, createdAt])
  @@index([tenantId, eventType, createdAt])
  @@index([correlationId])
}
```

### Field rules

- Persist **redacted** payload only (`redactNotificationPayload()` from shared).
- Never store `storageKey`, API keys, OAuth tokens, raw provider responses, stack traces, or private audit metadata.
- `system_log_only` rows may write to `AuditLog` instead of (or in addition to) this table; they must not appear in client inbox APIs.
- Email delivery remains a separate concern via `EmailLog` + no-send / future Resend path. Inbox rows must be creatable when `EMAIL_PROVIDER=local`.

### Migration gate (future)

- Requires explicit schema/migration approval per `AGENTS.md`.
- Dedicated `EmailTemplateKey` enum expansion remains a **separate** optional gate; typed catalog keys already map onto existing schema keys.

---

## 3. Write path (future implementation)

1. Domain handler emits a `NotificationBusinessEvent`.
2. `mapBusinessEventToNotification()` + `resolveNotificationRecipientPolicy()` + `resolveNotificationChannelPolicy()` decide roles/channels.
3. For each resolved recipient user:
   - If channel policy requires in-system → insert `InSystemNotification` (redacted payload).
   - If email required and not audit-only → call existing `sendEmailNotification` / no-send adapter (local → `SKIPPED`).
4. Always keep `AuditLog` / `EmailLog` semantics unchanged: audit ≠ inbox ≠ email attempt.

---

## 4. Inbox API design (G168) — design only

Prefer design-only until the model above exists. **Do not implement these routes without the schema.**

### 4.1 Admin / owner-operator inbox

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/notifications/inbox` | List notifications for current admin/owner user |
| `GET` | `/api/v1/notifications/inbox/unread` | Unread-only list + unread count |
| `POST` | `/api/v1/notifications/inbox/:id/read` | Mark one notification read |
| `POST` | `/api/v1/notifications/inbox/read-all` | Mark all unread as read (tenant + user scoped) |

**Auth:** admin / owner roles only. Tenant-scoped. Never return another user's rows.

**Query params (list):** `status=UNREAD|READ|ALL`, `limit`, `cursor`, optional `eventType`, optional `clientId`.

**Response item (safe shape):**

```json
{
  "id": "uuid",
  "eventType": "admin_alert_after_client_action",
  "severity": "action_required",
  "title": "Client requested changes",
  "body": "…",
  "clientId": "client_1",
  "relatedEntityType": "aiDeliveryDeliverable",
  "relatedEntityId": "deliverable_1",
  "status": "UNREAD",
  "createdAt": "ISO-8601",
  "readAt": null,
  "payload": {}
}
```

### 4.2 Client inbox (final-deliverable scoped)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/client-portal/notifications` | Client-visible notifications for the authenticated client user |
| `GET` | `/api/v1/client-portal/notifications/unread` | Unread list + count |
| `POST` | `/api/v1/client-portal/notifications/:id/read` | Mark read |

**Auth:** client portal session with `ClientUserAccess`.

**Hard scope rules:**

- Filter `recipientUserId = current user` AND `clientId = session client`.
- Allow only client-facing event types (e.g. `client_approval_needed`, `image_set_ready`, `monthly_report_available`, legacy `article_ready_for_client_review`).
- Exclude admin/ops/audit-only events (`external_proof_failed`, `storage_proof_failed`, `budget_cap_blocked`, etc.).
- **Final-deliverable scoping:** when `relatedEntityType` is a deliverable/image/report, verify the entity is in a client-visible state (sent for review / FINAL / published). Do not expose draft-only admin work.
- Strip any residual sensitive keys via `redactNotificationPayload()` before serialize.

### 4.3 Explicit non-goals for first API slice

- No public/magic-link notification endpoints
- No mark-read by email click tracking
- No live Resend requirement for inbox CRUD
- No replacing `GET /api/v1/notifications/email-logs` (admin outbox remains separate)

---

## 5. Severity + channel reminders (already implemented as pure helpers)

| Concern | Helper | Status |
|---------|--------|--------|
| Recipient roles | `resolveNotificationRecipientPolicy` | Pure, unit-tested |
| Channels | `resolveNotificationChannelPolicy` | Pure, unit-tested |
| Severity | `NotificationSeverity` on definitions | Pure, unit-tested |
| Redaction | `redactNotificationPayload` | Pure, unit-tested |
| Typed templates | `TYPED_NOTIFICATION_TEMPLATE_CATALOG` | Catalog only; schema reuse |

---

## 6. Suggested future gate sequence

| Gate | Work | Depends on |
|------|------|------------|
| N1a | Schema migration for `InSystemNotification` | Owner/schema approval |
| N1b | Write helpers on existing domain triggers (no live email) | N1a |
| N1c | Admin + client inbox list/unread/mark-read APIs | N1a |
| N1d | Minimal UI unread indicator | N1c |
| N2 | Owner-gated live Resend proof | Separate approval |

---

## 7. Confirmations for this design block

- No Prisma migration was created or applied.
- No inbox routes were implemented.
- No live email was sent or claimed.
- Persistence remains the primary launch blocker for in-system claims.
