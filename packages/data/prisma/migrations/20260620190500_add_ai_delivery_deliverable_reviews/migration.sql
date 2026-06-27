-- CreateEnum
CREATE TYPE "AiDeliveryDeliverableReviewStatus" AS ENUM ('NOT_STARTED', 'ADMIN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "AiDeliveryDeliverableReview" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiDeliveryProjectId" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "workflowRunId" TEXT,
    "status" "AiDeliveryDeliverableReviewStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "reviewerName" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDeliveryDeliverableReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiDeliveryDeliverableReview_tenantId_idx" ON "AiDeliveryDeliverableReview"("tenantId");

-- CreateIndex
CREATE INDEX "AiDeliveryDeliverableReview_tenantId_aiDeliveryProjectId_idx" ON "AiDeliveryDeliverableReview"("tenantId", "aiDeliveryProjectId");

-- CreateIndex
CREATE INDEX "AiDeliveryDeliverableReview_tenantId_deliverableId_idx" ON "AiDeliveryDeliverableReview"("tenantId", "deliverableId");

-- CreateIndex
CREATE INDEX "AiDeliveryDeliverableReview_tenantId_workflowRunId_idx" ON "AiDeliveryDeliverableReview"("tenantId", "workflowRunId");

-- CreateIndex
CREATE INDEX "AiDeliveryDeliverableReview_tenantId_status_idx" ON "AiDeliveryDeliverableReview"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "AiDeliveryDeliverableReview" ADD CONSTRAINT "AiDeliveryDeliverableReview_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryDeliverableReview" ADD CONSTRAINT "AiDeliveryDeliverableReview_aiDeliveryProjectId_fkey" FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryDeliverableReview" ADD CONSTRAINT "AiDeliveryDeliverableReview_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "AiDeliveryDeliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryDeliverableReview" ADD CONSTRAINT "AiDeliveryDeliverableReview_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "AiDeliveryWorkflowRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;