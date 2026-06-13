import type { PrismaClient } from "@prisma/client";
import type { TenantContext } from "../types/context";

export async function listTenantSettings(
  _client: PrismaClient,
  _context: TenantContext
): Promise<never> {
  throw new Error("Setting repository not implemented");
}
