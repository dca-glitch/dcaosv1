-- CreateTable
CREATE TABLE "MarketIntelligenceHandoff" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "marketSummary" TEXT,
    "competitorSummary" TEXT,
    "audienceSignals" JSONB,
    "opportunities" JSONB,
    "risks" JSONB,
    "recommendedActions" JSONB,
    "sourceNote" TEXT,
    "targetClientName" TEXT,
    "targetMonth" TEXT,
    "handoffStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketIntelligenceHandoff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketIntelligenceHandoff_tenantId_idx" ON "MarketIntelligenceHandoff"("tenantId");

-- CreateIndex
CREATE INDEX "MarketIntelligenceHandoff_tenantId_projectId_idx" ON "MarketIntelligenceHandoff"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "MarketIntelligenceHandoff_tenantId_insightId_idx" ON "MarketIntelligenceHandoff"("tenantId", "insightId");

-- CreateIndex
CREATE INDEX "MarketIntelligenceHandoff_tenantId_handoffStatus_idx" ON "MarketIntelligenceHandoff"("tenantId", "handoffStatus");

-- CreateIndex
CREATE INDEX "MarketIntelligenceHandoff_tenantId_isArchived_idx" ON "MarketIntelligenceHandoff"("tenantId", "isArchived");

-- AddForeignKey
ALTER TABLE "MarketIntelligenceHandoff" ADD CONSTRAINT "MarketIntelligenceHandoff_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketIntelligenceHandoff" ADD CONSTRAINT "MarketIntelligenceHandoff_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "MarketIntelligenceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketIntelligenceHandoff" ADD CONSTRAINT "MarketIntelligenceHandoff_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "MarketIntelligenceInsight"("id") ON DELETE CASCADE ON UPDATE CASCADE;
