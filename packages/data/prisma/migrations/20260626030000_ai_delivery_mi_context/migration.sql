-- Add optional AI Delivery project linkage to MarketIntelligenceHandoff
ALTER TABLE "MarketIntelligenceHandoff" ADD COLUMN "aiDeliveryProjectId" TEXT;

-- Index for efficient lookup of handoffs linked to an AI Delivery project
CREATE INDEX "MarketIntelligenceHandoff_tenantId_aiDeliveryProjectId_idx"
  ON "MarketIntelligenceHandoff" ("tenantId", "aiDeliveryProjectId");

-- Foreign key: nullable, set null on delete
ALTER TABLE "MarketIntelligenceHandoff"
  ADD CONSTRAINT "MarketIntelligenceHandoff_aiDeliveryProjectId_fkey"
  FOREIGN KEY ("aiDeliveryProjectId")
  REFERENCES "AiDeliveryProject"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
