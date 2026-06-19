CREATE TABLE "AiDeliveryContentDraft" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiDeliveryProjectId" TEXT NOT NULL,
    "contentPlanItemId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "draftBody" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDeliveryContentDraft_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiDeliveryContentDraft_tenantId_idx" ON "AiDeliveryContentDraft"("tenantId");
CREATE INDEX "AiDeliveryContentDraft_tenantId_aiDeliveryProjectId_idx" ON "AiDeliveryContentDraft"("tenantId", "aiDeliveryProjectId");
CREATE INDEX "AiDeliveryContentDraft_tenantId_contentPlanItemId_idx" ON "AiDeliveryContentDraft"("tenantId", "contentPlanItemId");
CREATE INDEX "AiDeliveryContentDraft_tenantId_status_idx" ON "AiDeliveryContentDraft"("tenantId", "status");
CREATE INDEX "AiDeliveryContentDraft_tenantId_isArchived_idx" ON "AiDeliveryContentDraft"("tenantId", "isArchived");

ALTER TABLE "AiDeliveryContentDraft" ADD CONSTRAINT "AiDeliveryContentDraft_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiDeliveryContentDraft" ADD CONSTRAINT "AiDeliveryContentDraft_aiDeliveryProjectId_fkey" FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiDeliveryContentDraft" ADD CONSTRAINT "AiDeliveryContentDraft_contentPlanItemId_fkey" FOREIGN KEY ("contentPlanItemId") REFERENCES "AiDeliveryContentPlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;