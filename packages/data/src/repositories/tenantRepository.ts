import type { PrismaClient } from "@prisma/client";
import type { SystemContext, TenantContext } from "../types/context";

export async function getTenantForCurrentContext(
  _client: PrismaClient,
  _context: TenantContext
): Promise<never> {
  throw new Error("Tenant repository not implemented");
}

export async function listTenantsForSystem(
  _client: PrismaClient,
  _context: SystemContext
): Promise<never> {
  throw new Error("Tenant repository not implemented");
}
