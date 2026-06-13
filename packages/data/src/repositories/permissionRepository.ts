import type { PrismaClient } from "@prisma/client";
import type { SystemContext } from "../types/context";

export async function listPermissions(
  _client: PrismaClient,
  _context: SystemContext
): Promise<never> {
  throw new Error("Permission repository not implemented");
}
