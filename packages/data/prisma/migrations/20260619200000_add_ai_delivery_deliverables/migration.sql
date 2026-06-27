-- CreateEnum
CREATE TYPE "AiDeliveryDeliverableDeliveryType" AS ENUM ('CONTENT_PACKAGE', 'ARTICLE_DRAFT', 'ARTICLE_IMAGE', 'CLIENT_HANDOFF', 'OTHER');

-- CreateEnum
CREATE TYPE "AiDeliveryDeliverableStatus" AS ENUM ('DRAFT', 'READY', 'DELIVERED', 'REVISION_REQUESTED', 'ACCEPTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "AiDeliveryDeliverable" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiDeliveryProjectId" TEXT NOT NULL,
    "contentDraftId" TEXT,
    "articleImageId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deliveryType" "AiDeliveryDeliverableDeliveryType" NOT NULL DEFAULT 'CONTENT_PACKAGE',
    "status" "AiDeliveryDeliverableStatus" NOT NULL DEFAULT 'DRAFT',
    "exportUrl" TEXT,
    "storageKey" TEXT,
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDeliveryDeliverable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiDeliveryDeliverable_tenantId_idx" ON "AiDeliveryDeliverable"("tenantId");

-- CreateIndex
CREATE INDEX "AiDeliveryDeliverable_tenantId_aiDeliveryProjectId_idx" ON "AiDeliveryDeliverable"("tenantId", "aiDeliveryProjectId");

-- CreateIndex
CREATE INDEX "AiDeliveryDeliverable_tenantId_status_idx" ON "AiDeliveryDeliverable"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AiDeliveryDeliverable_tenantId_isArchived_idx" ON "AiDeliveryDeliverable"("tenantId", "isArchived");

-- CreateIndex
CREATE INDEX "AiDeliveryDeliverable_tenantId_contentDraftId_idx" ON "AiDeliveryDeliverable"("tenantId", "contentDraftId");

-- CreateIndex
CREATE INDEX "AiDeliveryDeliverable_tenantId_articleImageId_idx" ON "AiDeliveryDeliverable"("tenantId", "articleImageId");

-- AddForeignKey
ALTER TABLE "AiDeliveryDeliverable" ADD CONSTRAINT "AiDeliveryDeliverable_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryDeliverable" ADD CONSTRAINT "AiDeliveryDeliverable_aiDeliveryProjectId_fkey" FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryDeliverable" ADD CONSTRAINT "AiDeliveryDeliverable_contentDraftId_fkey" FOREIGN KEY ("contentDraftId") REFERENCES "AiDeliveryContentDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryDeliverable" ADD CONSTRAINT "AiDeliveryDeliverable_articleImageId_fkey" FOREIGN KEY ("articleImageId") REFERENCES "AiDeliveryArticleImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
