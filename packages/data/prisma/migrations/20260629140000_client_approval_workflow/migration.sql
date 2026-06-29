-- Client portal article approval workflow

CREATE TYPE "ArticleImageApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TYPE "AiDeliveryDeliverableStatus" ADD VALUE 'PENDING_CLIENT_REVIEW';
ALTER TYPE "AiDeliveryDeliverableStatus" ADD VALUE 'APPROVED_BY_CLIENT';

ALTER TABLE "AiDeliveryDeliverable" ADD COLUMN "bodyContent" TEXT;
ALTER TABLE "AiDeliveryDeliverable" ADD COLUMN "clientRejectionReason" TEXT;

CREATE TABLE "AiDeliveryDeliverableImageApproval" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "articleImageId" TEXT NOT NULL,
    "status" "ArticleImageApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDeliveryDeliverableImageApproval_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiDeliveryDeliverableImageApproval_deliverableId_articleImageId_key" ON "AiDeliveryDeliverableImageApproval"("deliverableId", "articleImageId");
CREATE INDEX "AiDeliveryDeliverableImageApproval_tenantId_idx" ON "AiDeliveryDeliverableImageApproval"("tenantId");
CREATE INDEX "AiDeliveryDeliverableImageApproval_tenantId_deliverableId_idx" ON "AiDeliveryDeliverableImageApproval"("tenantId", "deliverableId");
CREATE INDEX "AiDeliveryDeliverableImageApproval_tenantId_articleImageId_idx" ON "AiDeliveryDeliverableImageApproval"("tenantId", "articleImageId");
CREATE INDEX "AiDeliveryDeliverableImageApproval_tenantId_status_idx" ON "AiDeliveryDeliverableImageApproval"("tenantId", "status");

ALTER TABLE "AiDeliveryDeliverableImageApproval" ADD CONSTRAINT "AiDeliveryDeliverableImageApproval_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "AiDeliveryDeliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiDeliveryDeliverableImageApproval" ADD CONSTRAINT "AiDeliveryDeliverableImageApproval_articleImageId_fkey" FOREIGN KEY ("articleImageId") REFERENCES "AiDeliveryArticleImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
