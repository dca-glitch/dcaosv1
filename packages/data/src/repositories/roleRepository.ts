import type { PrismaClient } from "@prisma/client";
import type { SystemContext, TenantContext } from "../types/context";

export async function listRolesForTenant(
  _client: PrismaClient,
  _context: TenantContext
): Promise<never> {
  throw new Error("Role repository not implemented");
}

export async function listRolesForSystem(
  _client: PrismaClient,
  _context: SystemContext
): Promise<never> {
  throw new Error("Role repository not implemented");
}
