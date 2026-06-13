import type { PrismaClient } from "@prisma/client";
import type { AuditWriteContext } from "../types/context";

export interface AuditLogWriteInput {
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export async function appendAuditLog(
  _client: PrismaClient,
  _context: AuditWriteContext,
  _input: AuditLogWriteInput
): Promise<never> {
  throw new Error("Audit log repository not implemented");
}
