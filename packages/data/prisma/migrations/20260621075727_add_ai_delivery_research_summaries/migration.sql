-- CreateEnum
CREATE TYPE "AiDeliveryResearchSummaryStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'FINALIZED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "AiDeliveryResearchSummary" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiDeliveryProjectId" TEXT NOT NULL,
    "workflowRunId" TEXT,
    "title" TEXT NOT NULL,
    "status" "AiDeliveryResearchSummaryStatus" NOT NULL DEFAULT 'DRAFT',
    "summaryText" TEXT NOT NULL,
    "keyFindings" TEXT,
    "audienceInsights" TEXT,
    "competitorInsights" TEXT,
    "keywordOpportunities" TEXT,
    "contentRecommendations" TEXT,
    "briefRevisionNotes" TEXT,
    "sourceNotes" TEXT,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDeliveryResearchSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiDeliveryResearchSummary_tenantId_idx" ON "AiDeliveryResearchSummary"("tenantId");

-- CreateIndex
CREATE INDEX "AiDeliveryResearchSummary_tenantId_aiDeliveryProjectId_idx" ON "AiDeliveryResearchSummary"("tenantId", "aiDeliveryProjectId");

-- CreateIndex
CREATE INDEX "AiDeliveryResearchSummary_tenantId_workflowRunId_idx" ON "AiDeliveryResearchSummary"("tenantId", "workflowRunId");

-- CreateIndex
CREATE INDEX "AiDeliveryResearchSummary_tenantId_status_idx" ON "AiDeliveryResearchSummary"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "AiDeliveryResearchSummary" ADD CONSTRAINT "AiDeliveryResearchSummary_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryResearchSummary" ADD CONSTRAINT "AiDeliveryResearchSummary_aiDeliveryProjectId_fkey" FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryResearchSummary" ADD CONSTRAINT "AiDeliveryResearchSummary_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "AiDeliveryWorkflowRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
