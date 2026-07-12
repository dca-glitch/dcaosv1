import type { InAppNotificationStatus, Prisma } from "@prisma/client";
import { redactNotificationPayload } from "@dca-os-v1/shared";
import { createPrismaClient } from "../../../../packages/data/src/client";

const prisma = createPrismaClient();

type PrismaClientLike = Prisma.TransactionClient | ReturnType<typeof createPrismaClient>;

export type InAppRecipientRole = "admin" | "client" | "owner_operator";
export type InAppNotificationSeverity =
  | "info"
  | "action_required"
  | "warning"
  | "blocked"
  | "critical";

export interface InAppNotificationWriteInput {
  tenantId: string;
  recipientUserId: string;
  recipientRole: InAppRecipientRole;
  clientId?: string | null;
  eventType: string;
  severity: InAppNotificationSeverity;
  title: string;
  body?: string | null;
  relatedEntityType: string;
  relatedEntityId: string;
  actionKey?: string | null;
  correlationId?: string | null;
  payloadJson?: Prisma.InputJsonValue | null;
}

export interface InAppNotificationListItem {
  id: string;
  tenantId: string;
  recipientUserId: string;
  recipientRole: string;
  clientId: string | null;
  eventType: string;
  severity: string;
  title: string;
  body: string | null;
  relatedEntityType: string;
  relatedEntityId: string;
  status: InAppNotificationStatus;
  readAt: string | null;
  createdAt: string;
}

interface InAppNotificationScopeInput {
  tenantId: string;
  recipientUserId: string;
  recipientRoles: readonly InAppRecipientRole[];
  clientIds?: readonly string[] | null;
}

export interface ListInAppNotificationsInput extends InAppNotificationScopeInput {
  status?: InAppNotificationStatus | "ALL";
  limit?: number;
}

export interface ListInAppNotificationsResult {
  notifications: InAppNotificationListItem[];
  unreadCount: number;
}

export type MarkInAppNotificationReadResult = "updated" | "already_read" | "not_found";

function toNullableString(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeActionKey(value: string | null | undefined): string {
  return value?.trim() || "default";
}

function buildIdempotencyKey(input: InAppNotificationWriteInput): string {
  const clientId = toNullableString(input.clientId) ?? "noclient";
  return [
    input.tenantId,
    input.eventType,
    input.relatedEntityType,
    input.relatedEntityId,
    input.recipientUserId,
    normalizeActionKey(input.actionKey),
    clientId
  ].join("|");
}

function toListItem(notification: {
  id: string;
  tenantId: string;
  recipientUserId: string;
  recipientRole: string;
  clientId: string | null;
  eventType: string;
  severity: string;
  title: string;
  body: string | null;
  relatedEntityType: string;
  relatedEntityId: string;
  status: InAppNotificationStatus;
  readAt: Date | null;
  createdAt: Date;
}): InAppNotificationListItem {
  return {
    id: notification.id,
    tenantId: notification.tenantId,
    recipientUserId: notification.recipientUserId,
    recipientRole: notification.recipientRole,
    clientId: notification.clientId,
    eventType: notification.eventType,
    severity: notification.severity,
    title: notification.title,
    body: notification.body,
    relatedEntityType: notification.relatedEntityType,
    relatedEntityId: notification.relatedEntityId,
    status: notification.status,
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
    createdAt: notification.createdAt.toISOString()
  };
}

function buildScopeWhere(input: InAppNotificationScopeInput): Prisma.InAppNotificationWhereInput {
  return {
    tenantId: input.tenantId,
    recipientUserId: input.recipientUserId,
    recipientRole: { in: [...input.recipientRoles] },
    ...(input.clientIds ? { clientId: { in: [...input.clientIds] } } : {})
  };
}

function resolveListLimit(input: number | undefined): number {
  if (typeof input !== "number" || !Number.isFinite(input)) {
    return 25;
  }
  const rounded = Math.floor(input);
  if (rounded < 1) return 1;
  if (rounded > 100) return 100;
  return rounded;
}

/**
 * Persist only redacted payload JSON — never secrets, storageKey, OAuth tokens,
 * stack traces, or raw provider responses (shared G163 contract).
 */
export function toPersistedInAppPayloadJson(
  payloadJson: Prisma.InputJsonValue | null | undefined
): Prisma.InputJsonValue | undefined {
  if (payloadJson === null || payloadJson === undefined) {
    return undefined;
  }
  return redactNotificationPayload(payloadJson) as Prisma.InputJsonValue;
}

export async function upsertInAppNotification(
  input: InAppNotificationWriteInput,
  client: PrismaClientLike = prisma
) {
  const actionKey = normalizeActionKey(input.actionKey);
  const clientId = toNullableString(input.clientId);
  const body = toNullableString(input.body);
  const correlationId = toNullableString(input.correlationId);
  const idempotencyKey = buildIdempotencyKey(input);
  const payloadJson = toPersistedInAppPayloadJson(input.payloadJson);

  return client.inAppNotification.upsert({
    where: {
      tenantId_eventType_relatedEntityType_relatedEntityId_recipientUserId_actionKey: {
        tenantId: input.tenantId,
        eventType: input.eventType,
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
        recipientUserId: input.recipientUserId,
        actionKey
      }
    },
    update: {
      title: input.title.trim(),
      body,
      severity: input.severity,
      recipientRole: input.recipientRole,
      clientId,
      correlationId,
      idempotencyKey,
      payloadJson
    },
    create: {
      tenantId: input.tenantId,
      recipientUserId: input.recipientUserId,
      recipientRole: input.recipientRole,
      clientId,
      eventType: input.eventType,
      severity: input.severity,
      title: input.title.trim(),
      body,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      actionKey,
      correlationId,
      idempotencyKey,
      payloadJson
    }
  });
}

export async function listTenantAdminRecipientUserIds(
  tenantId: string,
  client: PrismaClientLike = prisma
): Promise<string[]> {
  const rows = await client.user.findMany({
    where: {
      memberships: {
        some: {
          tenantId,
          status: "ACTIVE",
          membershipRoles: {
            some: {
              role: { key: { in: ["owner", "admin"] }, status: "ACTIVE" }
            }
          }
        }
      }
    },
    select: { id: true }
  });
  return [...new Set(rows.map((row) => row.id))];
}

export async function listTenantClientRecipientUserIds(
  tenantId: string,
  clientId: string,
  client: PrismaClientLike = prisma
): Promise<string[]> {
  const rows = await client.clientUserAccess.findMany({
    where: { tenantId, clientId, isArchived: false },
    select: { userId: true }
  });
  return [...new Set(rows.map((row) => row.userId))];
}

export async function listClientAccessClientIdsForUser(
  tenantId: string,
  userId: string,
  client: PrismaClientLike = prisma
): Promise<string[]> {
  const rows = await client.clientUserAccess.findMany({
    where: { tenantId, userId, isArchived: false },
    select: { clientId: true }
  });
  return [...new Set(rows.map((row) => row.clientId))];
}

export async function createAdminInAppNotifications(
  input: Omit<InAppNotificationWriteInput, "recipientRole" | "recipientUserId">,
  client: PrismaClientLike = prisma
): Promise<number> {
  const recipientUserIds = await listTenantAdminRecipientUserIds(input.tenantId, client);
  for (const recipientUserId of recipientUserIds) {
    await upsertInAppNotification(
      {
        ...input,
        recipientRole: "admin",
        recipientUserId
      },
      client
    );
  }
  return recipientUserIds.length;
}

export async function createClientInAppNotifications(
  input: Omit<InAppNotificationWriteInput, "recipientRole" | "recipientUserId" | "clientId"> & {
    clientId: string;
  },
  client: PrismaClientLike = prisma
): Promise<number> {
  const recipientUserIds = await listTenantClientRecipientUserIds(input.tenantId, input.clientId, client);
  for (const recipientUserId of recipientUserIds) {
    await upsertInAppNotification(
      {
        ...input,
        recipientRole: "client",
        recipientUserId
      },
      client
    );
  }
  return recipientUserIds.length;
}

export async function listInAppNotifications(
  input: ListInAppNotificationsInput,
  client: PrismaClientLike = prisma
): Promise<ListInAppNotificationsResult> {
  if (input.clientIds && input.clientIds.length === 0) {
    return { notifications: [], unreadCount: 0 };
  }

  const scopeWhere = buildScopeWhere(input);
  const where: Prisma.InAppNotificationWhereInput = {
    ...scopeWhere,
    ...(input.status && input.status !== "ALL" ? { status: input.status } : {})
  };

  const [notifications, unreadCount] = await Promise.all([
    client.inAppNotification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: resolveListLimit(input.limit),
      select: {
        id: true,
        tenantId: true,
        recipientUserId: true,
        recipientRole: true,
        clientId: true,
        eventType: true,
        severity: true,
        title: true,
        body: true,
        relatedEntityType: true,
        relatedEntityId: true,
        status: true,
        readAt: true,
        createdAt: true
      }
    }),
    client.inAppNotification.count({
      where: {
        ...scopeWhere,
        status: "UNREAD"
      }
    })
  ]);

  return {
    notifications: notifications.map(toListItem),
    unreadCount
  };
}

export async function markInAppNotificationRead(
  input: InAppNotificationScopeInput & { notificationId: string },
  client: PrismaClientLike = prisma
): Promise<MarkInAppNotificationReadResult> {
  if (input.clientIds && input.clientIds.length === 0) {
    return "not_found";
  }

  const existing = await client.inAppNotification.findFirst({
    where: {
      id: input.notificationId,
      ...buildScopeWhere(input)
    },
    select: {
      id: true,
      status: true
    }
  });

  if (!existing) {
    return "not_found";
  }

  if (existing.status === "READ") {
    return "already_read";
  }

  await client.inAppNotification.update({
    where: { id: existing.id },
    data: {
      status: "READ",
      readAt: new Date()
    }
  });

  return "updated";
}

export async function markAllInAppNotificationsRead(
  input: InAppNotificationScopeInput,
  client: PrismaClientLike = prisma
): Promise<number> {
  if (input.clientIds && input.clientIds.length === 0) {
    return 0;
  }

  const result = await client.inAppNotification.updateMany({
    where: {
      ...buildScopeWhere(input),
      status: "UNREAD"
    },
    data: {
      status: "READ",
      readAt: new Date()
    }
  });

  return result.count;
}
