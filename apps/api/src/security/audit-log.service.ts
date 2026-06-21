import type { AuditActorType, Prisma } from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AuditEventName } from "./audit-events";

type PrismaClientLike = Prisma.TransactionClient | ReturnType<typeof createPrismaClient>;

const prisma = createPrismaClient();

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

function toNullableString(value: string | null | undefined): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
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
