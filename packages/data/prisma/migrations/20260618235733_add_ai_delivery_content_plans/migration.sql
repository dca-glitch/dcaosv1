-- CreateEnum
CREATE TYPE "AiDeliveryContentPlanStatus" AS ENUM ('DRAFT', 'CLIENT_REVIEW_REQUESTED', 'CLIENT_CHANGES_REQUESTED', 'CLIENT_APPROVED');

-- CreateEnum
CREATE TYPE "AiDeliveryContentPlanItemApprovalStatus" AS ENUM ('DRAFT', 'CLIENT_CHANGES_REQUESTED', 'CLIENT_APPROVED');

-- CreateTable
CREATE TABLE "AiDeliveryContentPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiDeliveryProjectId" TEXT NOT NULL,
    "status" "AiDeliveryContentPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "reviewRequestedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDeliveryContentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiDeliveryContentPlanItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contentPlanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetKeyword" TEXT,
    "contentType" TEXT NOT NULL DEFAULT 'article',
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "approvalStatus" "AiDeliveryContentPlanItemApprovalStatus",
    "clientComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDeliveryContentPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiDeliveryContentPlan_tenantId_idx" ON "AiDeliveryContentPlan"("tenantId");

-- CreateIndex
CREATE INDEX "AiDeliveryContentPlan_tenantId_status_idx" ON "AiDeliveryContentPlan"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AiDeliveryContentPlan_tenantId_aiDeliveryProjectId_idx" ON "AiDeliveryContentPlan"("tenantId", "aiDeliveryProjectId");

-- CreateIndex
CREATE INDEX "AiDeliveryContentPlanItem_tenantId_idx" ON "AiDeliveryContentPlanItem"("tenantId");

-- CreateIndex
CREATE INDEX "AiDeliveryContentPlanItem_tenantId_contentPlanId_idx" ON "AiDeliveryContentPlanItem"("tenantId", "contentPlanId");

-- CreateIndex
CREATE INDEX "AiDeliveryContentPlanItem_tenantId_sortOrder_idx" ON "AiDeliveryContentPlanItem"("tenantId", "sortOrder");

-- AddForeignKey
ALTER TABLE "AiDeliveryContentPlan" ADD CONSTRAINT "AiDeliveryContentPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryContentPlan" ADD CONSTRAINT "AiDeliveryContentPlan_aiDeliveryProjectId_fkey" FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryContentPlanItem" ADD CONSTRAINT "AiDeliveryContentPlanItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryContentPlanItem" ADD CONSTRAINT "AiDeliveryContentPlanItem_contentPlanId_fkey" FOREIGN KEY ("contentPlanId") REFERENCES "AiDeliveryContentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
