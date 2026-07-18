import { createPrismaClient } from "../../../../packages/data/src/client";
import type { WorkspaceRoleKey } from "@prisma/client";

export type WorkspaceAdminMetadata = { id: string; name: string; slug: string };
export type WorkspaceMembershipLookup = (input: { workspaceId: string; userId: string }) => Promise<WorkspaceAdminMetadata | null>;
const allowedRoles = new Set<WorkspaceRoleKey>(["ADMIN", "WORKSPACE_MANAGER"]);
const prisma = createPrismaClient();

export async function resolveWorkspaceAdminMetadata(input: { workspaceId: string; userId: string }): Promise<WorkspaceAdminMetadata | null> {
  const membership = await prisma.workspaceMembership.findFirst({
    where: { workspaceId: input.workspaceId, userId: input.userId, status: "ACTIVE", roles: { some: { role: { in: [...allowedRoles] } } } },
    include: { workspace: { select: { id: true, name: true, slug: true } } }
  });
  return membership?.workspace ?? null;
}

export function createWorkspaceAdminLookup(records: Array<{ workspaceId: string; userId: string; status: string; roles: string[]; workspace: WorkspaceAdminMetadata }>): WorkspaceMembershipLookup {
  return async ({ workspaceId, userId }) => records.find((record) => record.workspaceId === workspaceId && record.userId === userId && record.status === "ACTIVE" && record.roles.some((role) => allowedRoles.has(role as WorkspaceRoleKey)))?.workspace ?? null;
}
