-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "activeTenantMembershipId" TEXT;

-- CreateIndex
CREATE INDEX "Session_activeTenantMembershipId_idx" ON "Session"("activeTenantMembershipId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_activeTenantMembershipId_fkey" FOREIGN KEY ("activeTenantMembershipId") REFERENCES "TenantMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
