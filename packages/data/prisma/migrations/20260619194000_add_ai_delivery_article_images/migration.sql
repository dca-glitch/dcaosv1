-- CreateTable
CREATE TABLE "AiDeliveryArticleImage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiDeliveryProjectId" TEXT NOT NULL,
    "contentDraftId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "styleNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "previewImageUrl" TEXT,
    "finalImageUrl" TEXT,
    "storageKey" TEXT,
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDeliveryArticleImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiDeliveryArticleImage_tenantId_idx" ON "AiDeliveryArticleImage"("tenantId");

-- CreateIndex
CREATE INDEX "AiDeliveryArticleImage_tenantId_aiDeliveryProjectId_idx" ON "AiDeliveryArticleImage"("tenantId", "aiDeliveryProjectId");

-- CreateIndex
CREATE INDEX "AiDeliveryArticleImage_tenantId_contentDraftId_idx" ON "AiDeliveryArticleImage"("tenantId", "contentDraftId");

-- CreateIndex
CREATE INDEX "AiDeliveryArticleImage_tenantId_status_idx" ON "AiDeliveryArticleImage"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AiDeliveryArticleImage_tenantId_isArchived_idx" ON "AiDeliveryArticleImage"("tenantId", "isArchived");

-- AddForeignKey
ALTER TABLE "AiDeliveryArticleImage" ADD CONSTRAINT "AiDeliveryArticleImage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryArticleImage" ADD CONSTRAINT "AiDeliveryArticleImage_aiDeliveryProjectId_fkey" FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryArticleImage" ADD CONSTRAINT "AiDeliveryArticleImage_contentDraftId_fkey" FOREIGN KEY ("contentDraftId") REFERENCES "AiDeliveryContentDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;