-- Market Intelligence core execution: admin findings + deterministic summaries

CREATE TABLE "MarketIntelligenceFinding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "researchRunId" TEXT,
    "sourceId" TEXT,
    "findingCategory" TEXT NOT NULL,
    "findingText" TEXT NOT NULL,
    "priority" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketIntelligenceFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketIntelligenceSummary" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "clientId" TEXT,
    "title" TEXT NOT NULL,
    "summaryText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sourceNotes" TEXT,
    "integrationContext" JSONB,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketIntelligenceSummary_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketIntelligenceFinding_tenantId_idx" ON "MarketIntelligenceFinding"("tenantId");
CREATE INDEX "MarketIntelligenceFinding_tenantId_projectId_idx" ON "MarketIntelligenceFinding"("tenantId", "projectId");
CREATE INDEX "MarketIntelligenceFinding_tenantId_isArchived_idx" ON "MarketIntelligenceFinding"("tenantId", "isArchived");
CREATE INDEX "MarketIntelligenceFinding_tenantId_findingCategory_idx" ON "MarketIntelligenceFinding"("tenantId", "findingCategory");

CREATE INDEX "MarketIntelligenceSummary_tenantId_idx" ON "MarketIntelligenceSummary"("tenantId");
CREATE INDEX "MarketIntelligenceSummary_tenantId_projectId_idx" ON "MarketIntelligenceSummary"("tenantId", "projectId");
CREATE INDEX "MarketIntelligenceSummary_tenantId_clientId_idx" ON "MarketIntelligenceSummary"("tenantId", "clientId");
CREATE INDEX "MarketIntelligenceSummary_tenantId_status_idx" ON "MarketIntelligenceSummary"("tenantId", "status");
CREATE INDEX "MarketIntelligenceSummary_tenantId_isArchived_idx" ON "MarketIntelligenceSummary"("tenantId", "isArchived");

ALTER TABLE "MarketIntelligenceFinding" ADD CONSTRAINT "MarketIntelligenceFinding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketIntelligenceFinding" ADD CONSTRAINT "MarketIntelligenceFinding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "MarketIntelligenceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketIntelligenceFinding" ADD CONSTRAINT "MarketIntelligenceFinding_researchRunId_fkey" FOREIGN KEY ("researchRunId") REFERENCES "MarketIntelligenceResearchRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketIntelligenceFinding" ADD CONSTRAINT "MarketIntelligenceFinding_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "MarketIntelligenceSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MarketIntelligenceSummary" ADD CONSTRAINT "MarketIntelligenceSummary_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketIntelligenceSummary" ADD CONSTRAINT "MarketIntelligenceSummary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "MarketIntelligenceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketIntelligenceSummary" ADD CONSTRAINT "MarketIntelligenceSummary_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
