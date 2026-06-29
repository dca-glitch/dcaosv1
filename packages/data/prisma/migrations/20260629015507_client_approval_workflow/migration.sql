-- CreateIndex
CREATE INDEX "AiDeliveryMonthlyMetricSnapshot_tenantId_aiDeliveryMonthlyR_idx" ON "AiDeliveryMonthlyMetricSnapshot"("tenantId", "aiDeliveryMonthlyReportId");

-- RenameIndex
ALTER INDEX "AiDeliveryDeliverableImageApproval_deliverableId_articleImageId" RENAME TO "AiDeliveryDeliverableImageApproval_deliverableId_articleIma_key";

-- RenameIndex
ALTER INDEX "AiDeliveryMonthlyMetricSnapshot_tenantId_aiDeliveryMonthlyRepor" RENAME TO "AiDeliveryMonthlyMetricSnapshot_tenantId_aiDeliveryMonthlyR_key";

-- RenameIndex
ALTER INDEX "AiDeliveryMonthlyMetricSnapshot_tenantId_aiDeliveryProjectId_id" RENAME TO "AiDeliveryMonthlyMetricSnapshot_tenantId_aiDeliveryProjectI_idx";
