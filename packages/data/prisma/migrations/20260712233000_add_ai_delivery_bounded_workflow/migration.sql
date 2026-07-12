-- CreateEnum
CREATE TYPE "AiDeliveryBoundedWorkflowState" AS ENUM (
    'CONTENT_APPROVED',
    'IMAGE_REQUEST_STARTED',
    'IMAGE_PREVIEW_READY',
    'WAITING_FOR_IMAGE_APPROVAL',
    'IMAGE_APPROVED',
    'WORDPRESS_REQUEST_STARTED',
    'WORDPRESS_DRAFT_CREATED',
    'EMAIL_REQUEST_STARTED',
    'EMAIL_SENT',
    'COMPLETED',
    'FAILED_BEFORE_EXTERNAL_CALL',
    'AMBIGUOUS_IMAGE',
    'AMBIGUOUS_WORDPRESS',
    'AMBIGUOUS_EMAIL',
    'BLOCKED'
);

-- AlterTable
ALTER TABLE "AiDeliveryArticleImage"
ADD COLUMN "provider" TEXT,
ADD COLUMN "providerModel" TEXT,
ADD COLUMN "correlationId" TEXT,
ADD COLUMN "contentType" TEXT,
ADD COLUMN "width" INTEGER,
ADD COLUMN "height" INTEGER,
ADD COLUMN "byteLength" INTEGER,
ADD COLUMN "sha256" TEXT,
ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "estimatedCostUsd" DECIMAL(12,6),
ADD COLUMN "actualCostUsd" DECIMAL(12,6),
ADD COLUMN "generatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AiDeliveryBoundedWorkflowRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiDeliveryProjectId" TEXT NOT NULL,
    "contentDraftId" TEXT NOT NULL,
    "publicationTargetId" TEXT,
    "articleImageId" TEXT,
    "wordpressAttemptId" TEXT,
    "emailLogId" TEXT,
    "initiatedByUserId" TEXT,
    "workflowType" TEXT NOT NULL DEFAULT 'CONTENT_TO_WORDPRESS_DRAFT',
    "state" "AiDeliveryBoundedWorkflowState" NOT NULL DEFAULT 'CONTENT_APPROVED',
    "stateVersion" INTEGER NOT NULL DEFAULT 0,
    "imageIdempotencyKey" TEXT NOT NULL,
    "storageIdempotencyKey" TEXT NOT NULL,
    "wordpressIdempotencyKey" TEXT NOT NULL,
    "emailIdempotencyKey" TEXT NOT NULL,
    "imageProviderRequestId" TEXT,
    "imageCorrelationId" TEXT,
    "storageKey" TEXT,
    "wordpressPostId" TEXT,
    "emailProviderMessageId" TEXT,
    "imageRequestCount" INTEGER NOT NULL DEFAULT 0,
    "storageUploadCount" INTEGER NOT NULL DEFAULT 0,
    "wordpressRequestCount" INTEGER NOT NULL DEFAULT 0,
    "emailRequestCount" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "safeError" TEXT,
    "imageRequestStartedAt" TIMESTAMP(3),
    "imagePreviewReadyAt" TIMESTAMP(3),
    "imageApprovedAt" TIMESTAMP(3),
    "wordpressRequestStartedAt" TIMESTAMP(3),
    "wordpressDraftCreatedAt" TIMESTAMP(3),
    "emailRequestStartedAt" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDeliveryBoundedWorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiDeliveryBoundedWorkflowRun_articleImageId_key"
ON "AiDeliveryBoundedWorkflowRun"("articleImageId");

CREATE UNIQUE INDEX "AiDeliveryBoundedWorkflowRun_wordpressAttemptId_key"
ON "AiDeliveryBoundedWorkflowRun"("wordpressAttemptId");

CREATE UNIQUE INDEX "AiDeliveryBoundedWorkflowRun_emailLogId_key"
ON "AiDeliveryBoundedWorkflowRun"("emailLogId");

CREATE UNIQUE INDEX "AiDeliveryBoundedWorkflowRun_tenantId_contentDraftId_workflowType_key"
ON "AiDeliveryBoundedWorkflowRun"("tenantId", "contentDraftId", "workflowType");

CREATE INDEX "AiDeliveryBoundedWorkflowRun_tenantId_state_idx"
ON "AiDeliveryBoundedWorkflowRun"("tenantId", "state");

CREATE INDEX "AiDeliveryBoundedWorkflowRun_tenantId_aiDeliveryProjectId_idx"
ON "AiDeliveryBoundedWorkflowRun"("tenantId", "aiDeliveryProjectId");

CREATE INDEX "AiDeliveryBoundedWorkflowRun_tenantId_publicationTargetId_idx"
ON "AiDeliveryBoundedWorkflowRun"("tenantId", "publicationTargetId");

-- AddForeignKey
ALTER TABLE "AiDeliveryBoundedWorkflowRun"
ADD CONSTRAINT "AiDeliveryBoundedWorkflowRun_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiDeliveryBoundedWorkflowRun"
ADD CONSTRAINT "AiDeliveryBoundedWorkflowRun_aiDeliveryProjectId_fkey"
FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiDeliveryBoundedWorkflowRun"
ADD CONSTRAINT "AiDeliveryBoundedWorkflowRun_contentDraftId_fkey"
FOREIGN KEY ("contentDraftId") REFERENCES "AiDeliveryContentDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiDeliveryBoundedWorkflowRun"
ADD CONSTRAINT "AiDeliveryBoundedWorkflowRun_publicationTargetId_fkey"
FOREIGN KEY ("publicationTargetId") REFERENCES "PublicationTarget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiDeliveryBoundedWorkflowRun"
ADD CONSTRAINT "AiDeliveryBoundedWorkflowRun_articleImageId_fkey"
FOREIGN KEY ("articleImageId") REFERENCES "AiDeliveryArticleImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiDeliveryBoundedWorkflowRun"
ADD CONSTRAINT "AiDeliveryBoundedWorkflowRun_wordpressAttemptId_fkey"
FOREIGN KEY ("wordpressAttemptId") REFERENCES "WordPressDraftLiveAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiDeliveryBoundedWorkflowRun"
ADD CONSTRAINT "AiDeliveryBoundedWorkflowRun_emailLogId_fkey"
FOREIGN KEY ("emailLogId") REFERENCES "EmailLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiDeliveryBoundedWorkflowRun"
ADD CONSTRAINT "AiDeliveryBoundedWorkflowRun_initiatedByUserId_fkey"
FOREIGN KEY ("initiatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
