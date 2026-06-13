import type { PrismaClient } from "@prisma/client";
import type { AuditWriteContext } from "../types/context";
import { appendAuditLog, type AuditLogWriteInput } from "../repositories/auditLogRepository";

export async function recordAuditEvent(
  client: PrismaClient,
  context: AuditWriteContext,
  input: AuditLogWriteInput
): Promise<never> {
  return appendAuditLog(client, context, input);
}

export async function recordTenantAuditEvent(
  client: PrismaClient,
  context: AuditWriteContext,
  input: AuditLogWriteInput
): Promise<never> {
  if (!context.tenantId) {
    throw new Error("Tenant audit events require tenantId");
  }

  return appendAuditLog(client, context, input);
}
