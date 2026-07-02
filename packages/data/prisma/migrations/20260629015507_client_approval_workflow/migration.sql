-- CreateIndex
CREATE INDEX "AiDeliveryMonthlyMetricSnapshot_tenantId_aiDeliveryMonthlyR_idx" ON "AiDeliveryMonthlyMetricSnapshot"("tenantId", "aiDeliveryMonthlyReportId");

-- RenameIndex (idempotent: table/index for this rename is created later in
-- 20260629140000_client_approval_workflow; guard so replay order doesn't fail)
DO $$
BEGIN
  IF to_regclass('public."AiDeliveryDeliverableImageApproval_deliverableId_articleImageId"') IS NOT NULL
     AND to_regclass('public."AiDeliveryDeliverableImageApproval_deliverableId_articleIma_key"') IS NULL
  THEN
    ALTER INDEX "AiDeliveryDeliverableImageApproval_deliverableId_articleImageId"
    RENAME TO "AiDeliveryDeliverableImageApproval_deliverableId_articleIma_key";
  END IF;
END $$;

-- RenameIndex
ALTER INDEX "AiDeliveryMonthlyMetricSnapshot_tenantId_aiDeliveryMonthlyRepor" RENAME TO "AiDeliveryMonthlyMetricSnapshot_tenantId_aiDeliveryMonthlyR_key";

-- RenameIndex
ALTER INDEX "AiDeliveryMonthlyMetricSnapshot_tenantId_aiDeliveryProjectId_id" RENAME TO "AiDeliveryMonthlyMetricSnapshot_tenantId_aiDeliveryProjectI_idx";
