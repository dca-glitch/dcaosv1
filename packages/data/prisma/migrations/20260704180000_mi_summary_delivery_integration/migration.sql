-- MI Mega Block 2: link finalized MI summaries to AI Delivery and monthly reports
ALTER TABLE "MarketIntelligenceSummary" ADD COLUMN "aiDeliveryProjectId" TEXT;
ALTER TABLE "MarketIntelligenceSummary" ADD COLUMN "appliedAt" TIMESTAMP(3);

ALTER TABLE "MarketIntelligenceSummary" ADD CONSTRAINT "MarketIntelligenceSummary_aiDeliveryProjectId_fkey"
  FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "MarketIntelligenceSummary_tenantId_aiDeliveryProjectId_idx"
  ON "MarketIntelligenceSummary"("tenantId", "aiDeliveryProjectId");

ALTER TABLE "AiDeliveryMonthlyReport" ADD COLUMN "miSummaryId" TEXT;

ALTER TABLE "AiDeliveryMonthlyReport" ADD CONSTRAINT "AiDeliveryMonthlyReport_miSummaryId_fkey"
  FOREIGN KEY ("miSummaryId") REFERENCES "MarketIntelligenceSummary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AiDeliveryMonthlyReport_tenantId_miSummaryId_idx"
  ON "AiDeliveryMonthlyReport"("tenantId", "miSummaryId");
