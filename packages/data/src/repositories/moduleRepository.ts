import type { PrismaClient } from "@prisma/client";
import type { SystemContext, TenantContext } from "../types/context";

export async function listModuleDefinitions(
  _client: PrismaClient,
  _context: SystemContext
): Promise<never> {
  throw new Error("Module repository not implemented");
}

export async function listTenantModules(
  _client: PrismaClient,
  _context: TenantContext
): Promise<never> {
  throw new Error("Module repository not implemented");
}
