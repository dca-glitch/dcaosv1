/**
 * G257 — Correlation / idempotency design helpers (no migration, no persistence).
 *
 * These pure helpers define how future InSystemNotification + EmailLog rows should
 * correlate and dedupe. They do not write to the database.
 */

import type { NotificationEventType } from "@dca-os-v1/shared";

export const NOTIFICATION_CORRELATION_DESIGN_VERSION = "NOTIFICATION_CORRELATION_DESIGN_V1";

export interface NotificationCorrelationInput {
  tenantId: string;
  eventType: NotificationEventType;
  relatedEntityType: string;
  relatedEntityId: string;
  /** Optional recipient scope for per-user inbox dedupe. */
  recipientUserId?: string | null;
  /** Optional client scope. */
  clientId?: string | null;
  /** Optional stable business action key (e.g. status transition). */
  actionKey?: string | null;
}

export interface NotificationCorrelationDesign {
  version: typeof NOTIFICATION_CORRELATION_DESIGN_VERSION;
  /** Opaque correlation id for linking inbox row + EmailLog + AuditLog. */
  correlationId: string;
  /** Stable idempotency key for future unique constraint (design only). */
  idempotencyKey: string;
  /** Recommended uniqueness scope for a future @@unique. */
  uniquenessScope: "tenant_event_entity_recipient_action";
  /** Explicit: no DB write / migration in this helper. */
  persistence: "design_only_no_migration";
}

function normalizePart(value: string | null | undefined, fallback = "_"): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed.replace(/\s+/g, "_");
}

/**
 * Build a deterministic correlation + idempotency design shape.
 * Safe for unit tests and future write-path planning. Does not touch Prisma.
 */
export function buildNotificationCorrelationDesign(
  input: NotificationCorrelationInput
): NotificationCorrelationDesign {
  const tenantId = normalizePart(input.tenantId, "tenant");
  const eventType = normalizePart(input.eventType, "event");
  const relatedEntityType = normalizePart(input.relatedEntityType, "entity");
  const relatedEntityId = normalizePart(input.relatedEntityId, "id");
  const recipientUserId = normalizePart(input.recipientUserId, "broadcast");
  const clientId = normalizePart(input.clientId, "noclient");
  const actionKey = normalizePart(input.actionKey, "default");

  const idempotencyKey = [
    tenantId,
    eventType,
    relatedEntityType,
    relatedEntityId,
    recipientUserId,
    clientId,
    actionKey
  ].join("|");

  // Correlation id is a stable hash-like token derived from the idempotency key
  // without introducing crypto deps — sufficient for design/tests.
  const correlationId = `corr_${simpleStableHash(idempotencyKey)}`;

  return {
    version: NOTIFICATION_CORRELATION_DESIGN_VERSION,
    correlationId,
    idempotencyKey,
    uniquenessScope: "tenant_event_entity_recipient_action",
    persistence: "design_only_no_migration"
  };
}

function simpleStableHash(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Design note for future schema (do not migrate here):
 * @@unique([tenantId, eventType, relatedEntityType, relatedEntityId, recipientUserId, actionKey])
 * plus optional correlationId index shared with EmailLog / AuditLog metadata.
 */
export const NOTIFICATION_IDEMPOTENCY_SCHEMA_NOTE =
  "Future InSystemNotification should unique on tenant+event+entity+recipient+action; correlationId links EmailLog/AuditLog. No migration in G257.";
