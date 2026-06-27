-- Add Market Intelligence handoff reference to monthly reports (admin-only internal context)
ALTER TABLE "AiDeliveryMonthlyReport" ADD COLUMN "miHandoffId" TEXT;
ALTER TABLE "AiDeliveryMonthlyReport" ADD COLUMN "miContextDraft" TEXT;

-- FK constraint with SetNull on delete (if the handoff is deleted, the report loses the reference but keeps the draft)
ALTER TABLE "AiDeliveryMonthlyReport" ADD CONSTRAINT "AiDeliveryMonthlyReport_miHandoffId_fkey"
  FOREIGN KEY ("miHandoffId") REFERENCES "MarketIntelligenceHandoff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Index for handoff reference lookups
CREATE INDEX "AiDeliveryMonthlyReport_tenantId_miHandoffId_idx" ON "AiDeliveryMonthlyReport"("tenantId", "miHandoffId");
