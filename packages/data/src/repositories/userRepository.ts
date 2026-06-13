import type { PrismaClient } from "@prisma/client";
import type { SystemContext, TenantContext } from "../types/context";

export async function getUserForTenantContext(
  _client: PrismaClient,
  _context: TenantContext
): Promise<never> {
  throw new Error("User repository not implemented");
}

export async function getUserForSystemContext(
  _client: PrismaClient,
  _context: SystemContext
): Promise<never> {
  throw new Error("User repository not implemented");
}
