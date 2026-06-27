-- CreateTable "MarketIntelligenceProject"
CREATE TABLE "MarketIntelligenceProject" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketIntelligenceProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable "MarketIntelligenceSource"
CREATE TABLE "MarketIntelligenceSource" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" TEXT,
    "sourceUrl" TEXT,
    "sourceNotes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketIntelligenceSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable "MarketIntelligenceResearchRun"
CREATE TABLE "MarketIntelligenceResearchRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resultSummary" TEXT,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketIntelligenceResearchRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable "MarketIntelligenceInsight"
CREATE TABLE "MarketIntelligenceInsight" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "reviewerNotes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketIntelligenceInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketIntelligenceProject_tenantId_idx" ON "MarketIntelligenceProject"("tenantId");

-- CreateIndex
CREATE INDEX "MarketIntelligenceProject_tenantId_status_idx" ON "MarketIntelligenceProject"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MarketIntelligenceProject_tenantId_isArchived_idx" ON "MarketIntelligenceProject"("tenantId", "isArchived");

-- CreateIndex
CREATE INDEX "MarketIntelligenceSource_tenantId_idx" ON "MarketIntelligenceSource"("tenantId");

-- CreateIndex
CREATE INDEX "MarketIntelligenceSource_tenantId_projectId_idx" ON "MarketIntelligenceSource"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "MarketIntelligenceSource_tenantId_isArchived_idx" ON "MarketIntelligenceSource"("tenantId", "isArchived");

-- CreateIndex
CREATE INDEX "MarketIntelligenceResearchRun_tenantId_idx" ON "MarketIntelligenceResearchRun"("tenantId");

-- CreateIndex
CREATE INDEX "MarketIntelligenceResearchRun_tenantId_projectId_idx" ON "MarketIntelligenceResearchRun"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "MarketIntelligenceResearchRun_tenantId_status_idx" ON "MarketIntelligenceResearchRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MarketIntelligenceInsight_tenantId_idx" ON "MarketIntelligenceInsight"("tenantId");

-- CreateIndex
CREATE INDEX "MarketIntelligenceInsight_tenantId_projectId_idx" ON "MarketIntelligenceInsight"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "MarketIntelligenceInsight_tenantId_status_idx" ON "MarketIntelligenceInsight"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MarketIntelligenceInsight_tenantId_isArchived_idx" ON "MarketIntelligenceInsight"("tenantId", "isArchived");

-- AddForeignKey
ALTER TABLE "MarketIntelligenceProject" ADD CONSTRAINT "MarketIntelligenceProject_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketIntelligenceSource" ADD CONSTRAINT "MarketIntelligenceSource_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketIntelligenceSource" ADD CONSTRAINT "MarketIntelligenceSource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "MarketIntelligenceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketIntelligenceResearchRun" ADD CONSTRAINT "MarketIntelligenceResearchRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketIntelligenceResearchRun" ADD CONSTRAINT "MarketIntelligenceResearchRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "MarketIntelligenceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketIntelligenceInsight" ADD CONSTRAINT "MarketIntelligenceInsight_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketIntelligenceInsight" ADD CONSTRAINT "MarketIntelligenceInsight_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "MarketIntelligenceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
