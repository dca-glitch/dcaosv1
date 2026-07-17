-- CreateEnum
CREATE TYPE "WorkspaceRoleKey" AS ENUM ('ADMIN', 'WORKSPACE_MANAGER', 'TEAM_MEMBER', 'CLIENT_MANAGER', 'CLIENT_USER');

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMembership" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMembershipRole" (
    "id" TEXT NOT NULL,
    "workspaceMembershipId" TEXT NOT NULL,
    "role" "WorkspaceRoleKey" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMembershipRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");
CREATE UNIQUE INDEX "WorkspaceMembership_workspaceId_userId_key" ON "WorkspaceMembership"("workspaceId", "userId");
CREATE UNIQUE INDEX "WorkspaceMembershipRole_workspaceMembershipId_role_key" ON "WorkspaceMembershipRole"("workspaceMembershipId", "role");
CREATE INDEX "WorkspaceMembership_workspaceId_idx" ON "WorkspaceMembership"("workspaceId");
CREATE INDEX "WorkspaceMembership_userId_idx" ON "WorkspaceMembership"("userId");
CREATE INDEX "WorkspaceMembership_status_idx" ON "WorkspaceMembership"("status");
CREATE INDEX "WorkspaceMembershipRole_workspaceMembershipId_idx" ON "WorkspaceMembershipRole"("workspaceMembershipId");
CREATE INDEX "WorkspaceMembershipRole_role_idx" ON "WorkspaceMembershipRole"("role");

-- AddForeignKey
ALTER TABLE "WorkspaceMembership" ADD CONSTRAINT "WorkspaceMembership_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMembership" ADD CONSTRAINT "WorkspaceMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMembershipRole" ADD CONSTRAINT "WorkspaceMembershipRole_workspaceMembershipId_fkey" FOREIGN KEY ("workspaceMembershipId") REFERENCES "WorkspaceMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
