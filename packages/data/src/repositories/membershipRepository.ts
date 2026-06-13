import type { PrismaClient } from "@prisma/client";
import type { SystemContext, TenantContext } from "../types/context";

export async function listMembershipsForTenant(
  _client: PrismaClient,
  _context: TenantContext
): Promise<never> {
  throw new Error("Membership repository not implemented");
}

export async function getMembershipByUserId(
  _client: PrismaClient,
  _context: TenantContext | SystemContext,
  _userId: string
): Promise<never> {
  throw new Error("Membership repository not implemented");
}
