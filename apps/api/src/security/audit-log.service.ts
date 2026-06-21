import type { AuditActorType, Prisma } from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AuditEventName } from "./audit-events";

type PrismaClientLike = Prisma.TransactionClient | ReturnType<typeof createPrismaClient>;

const prisma = createPrismaClient();
const AUDIT_METADATA_SUMMARY_KEYS = new Set([
  "moduleKey",
  "tenantModuleStatus",
  "previousTenantId",
  "currentTenantId",
  "selectedTenantId",
  "tenantMembershipId",
  "previousName",
  "nextName"
]);

type AuditMetadataSummaryValue = string | number | boolean | null;

export interface RecordPlatformAuditEventInput {
  tenantId?: string | null;
  actorType?: AuditActorType;
  actorUserId?: string | null;
  action: AuditEventName | string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ListTenantAuditLogsFilters {
  tenantId: string;
  actorUserId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  limit: number;
}

export interface TenantAuditLogListItem {
  id: string;
  tenantId: string;
  actorType: AuditActorType;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  metadataSummary: Record<string, AuditMetadataSummaryValue> | null;
}

export interface TenantAuditLogListResponse {
  auditLogs: TenantAuditLogListItem[];
}

function toNullableString(value: string | null | undefined): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function isJsonObject(value: Prisma.JsonValue | null | undefined): value is Prisma.JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toMetadataSummaryValue(value: Prisma.JsonValue | undefined): AuditMetadataSummaryValue | undefined {
  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return undefined;
}

function summarizeAuditMetadata(
  metadata: Prisma.JsonValue | null | undefined
): Record<string, AuditMetadataSummaryValue> | null {
  if (!isJsonObject(metadata)) {
    return null;
  }

  const summaryEntries = Object.entries(metadata).flatMap(([key, value]) => {
    if (!AUDIT_METADATA_SUMMARY_KEYS.has(key)) {
      return [];
    }

    const summaryValue = toMetadataSummaryValue(value);
    return summaryValue === undefined ? [] : [[key, summaryValue] as const];
  });

  return summaryEntries.length > 0 ? Object.fromEntries(summaryEntries) : null;
}

export async function recordPlatformAuditEvent(
  input: RecordPlatformAuditEventInput,
  client: PrismaClientLike = prisma
): Promise<boolean> {
  try {
    await client.auditLog.create({
      data: {
        tenantId: toNullableString(input.tenantId),
        actorType: input.actorType ?? (input.actorUserId ? "USER" : "SYSTEM"),
        actorUserId: toNullableString(input.actorUserId),
        action: input.action.trim(),
        entityType: input.entityType.trim(),
        entityId: toNullableString(input.entityId),
        metadata: input.metadata === undefined ? undefined : input.metadata,
        ipAddress: toNullableString(input.ipAddress),
        userAgent: toNullableString(input.userAgent)
      }
    });
    return true;
  } catch {
    return false;
  }
}

export async function listTenantAuditLogs(
  filters: ListTenantAuditLogsFilters,
  client: PrismaClientLike = prisma
): Promise<TenantAuditLogListResponse> {
  const createdAtFilter: Prisma.DateTimeFilter = {};
  if (filters.createdAfter) {
    createdAtFilter.gte = filters.createdAfter;
  }
  if (filters.createdBefore) {
    createdAtFilter.lte = filters.createdBefore;
  }

  const auditLogs = await client.auditLog.findMany({
    where: {
      tenantId: filters.tenantId,
      ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.entityId ? { entityId: filters.entityId } : {}),
      ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {})
    },
    orderBy: {
      createdAt: "desc"
    },
    take: filters.limit,
    select: {
      id: true,
      tenantId: true,
      actorType: true,
      actorUserId: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true
    }
  });

  return {
    auditLogs: auditLogs.map((auditLog) => ({
      id: auditLog.id,
      tenantId: auditLog.tenantId ?? filters.tenantId,
      actorType: auditLog.actorType,
      actorUserId: auditLog.actorUserId,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      createdAt: auditLog.createdAt.toISOString(),
      metadataSummary: summarizeAuditMetadata(auditLog.metadata)
    }))
  };
}
