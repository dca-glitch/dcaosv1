-- DropIndex
DROP INDEX IF EXISTS "AiDeliveryContentPlan_tenantId_aiDeliveryProjectId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "AiDeliveryContentPlan_tenantId_aiDeliveryProjectId_key" ON "AiDeliveryContentPlan"("tenantId", "aiDeliveryProjectId");