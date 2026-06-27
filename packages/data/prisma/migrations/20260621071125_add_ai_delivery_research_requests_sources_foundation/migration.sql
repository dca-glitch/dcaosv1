-- CreateEnum
CREATE TYPE "AiDeliveryResearchRequestStatus" AS ENUM ('DRAFT', 'READY', 'IN_REVIEW', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AiDeliveryResearchSourceStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AiDeliveryResearchSourceType" AS ENUM ('WEBSITE', 'DOCUMENT', 'OTHER');

-- CreateTable
CREATE TABLE "AiDeliveryResearchRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiDeliveryProjectId" TEXT NOT NULL,
    "workflowRunId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requestType" TEXT,
    "status" "AiDeliveryResearchRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDeliveryResearchRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiDeliveryResearchSource" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiDeliveryProjectId" TEXT NOT NULL,
    "researchRequestId" TEXT,
    "workflowRunId" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "sourceTitle" TEXT,
    "sourceType" "AiDeliveryResearchSourceType" NOT NULL DEFAULT 'WEBSITE',
    "status" "AiDeliveryResearchSourceStatus" NOT NULL DEFAULT 'PROPOSED',
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDeliveryResearchSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiDeliveryResearchRequest_tenantId_idx" ON "AiDeliveryResearchRequest"("tenantId");

-- CreateIndex
CREATE INDEX "AiDeliveryResearchRequest_tenantId_aiDeliveryProjectId_idx" ON "AiDeliveryResearchRequest"("tenantId", "aiDeliveryProjectId");

-- CreateIndex
CREATE INDEX "AiDeliveryResearchRequest_tenantId_workflowRunId_idx" ON "AiDeliveryResearchRequest"("tenantId", "workflowRunId");

-- CreateIndex
CREATE INDEX "AiDeliveryResearchRequest_tenantId_status_idx" ON "AiDeliveryResearchRequest"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AiDeliveryResearchSource_tenantId_idx" ON "AiDeliveryResearchSource"("tenantId");

-- CreateIndex
CREATE INDEX "AiDeliveryResearchSource_tenantId_aiDeliveryProjectId_idx" ON "AiDeliveryResearchSource"("tenantId", "aiDeliveryProjectId");

-- CreateIndex
CREATE INDEX "AiDeliveryResearchSource_tenantId_researchRequestId_idx" ON "AiDeliveryResearchSource"("tenantId", "researchRequestId");

-- CreateIndex
CREATE INDEX "AiDeliveryResearchSource_tenantId_workflowRunId_idx" ON "AiDeliveryResearchSource"("tenantId", "workflowRunId");

-- CreateIndex
CREATE INDEX "AiDeliveryResearchSource_tenantId_status_idx" ON "AiDeliveryResearchSource"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "AiDeliveryResearchRequest" ADD CONSTRAINT "AiDeliveryResearchRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryResearchRequest" ADD CONSTRAINT "AiDeliveryResearchRequest_aiDeliveryProjectId_fkey" FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryResearchRequest" ADD CONSTRAINT "AiDeliveryResearchRequest_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "AiDeliveryWorkflowRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryResearchSource" ADD CONSTRAINT "AiDeliveryResearchSource_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryResearchSource" ADD CONSTRAINT "AiDeliveryResearchSource_aiDeliveryProjectId_fkey" FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryResearchSource" ADD CONSTRAINT "AiDeliveryResearchSource_researchRequestId_fkey" FOREIGN KEY ("researchRequestId") REFERENCES "AiDeliveryResearchRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryResearchSource" ADD CONSTRAINT "AiDeliveryResearchSource_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "AiDeliveryWorkflowRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
