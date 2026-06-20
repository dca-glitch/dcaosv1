-- CreateEnum
CREATE TYPE "AiDeliveryWorkflowRunStatus" AS ENUM ('DRAFT', 'READY', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "AiDeliveryWorkflowRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiDeliveryProjectId" TEXT NOT NULL,
    "status" "AiDeliveryWorkflowRunStatus" NOT NULL DEFAULT 'DRAFT',
    "adminNotes" TEXT,
    "resultPlaceholder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDeliveryWorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiDeliveryWorkflowRun_tenantId_idx" ON "AiDeliveryWorkflowRun"("tenantId");

-- CreateIndex
CREATE INDEX "AiDeliveryWorkflowRun_tenantId_aiDeliveryProjectId_idx" ON "AiDeliveryWorkflowRun"("tenantId", "aiDeliveryProjectId");

-- CreateIndex
CREATE INDEX "AiDeliveryWorkflowRun_tenantId_status_idx" ON "AiDeliveryWorkflowRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AiDeliveryWorkflowRun_createdAt_idx" ON "AiDeliveryWorkflowRun"("createdAt");

-- AddForeignKey
ALTER TABLE "AiDeliveryWorkflowRun" ADD CONSTRAINT "AiDeliveryWorkflowRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryWorkflowRun" ADD CONSTRAINT "AiDeliveryWorkflowRun_aiDeliveryProjectId_fkey" FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;