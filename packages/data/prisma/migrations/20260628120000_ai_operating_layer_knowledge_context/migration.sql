-- CreateEnum
CREATE TYPE "AiKnowledgeScope" AS ENUM ('SYSTEM', 'CLIENT', 'PROJECT', 'INDUSTRY');

-- CreateEnum
CREATE TYPE "AiKnowledgeType" AS ENUM ('CLIENT_FACT', 'BRAND_VOICE', 'TARGET_AUDIENCE', 'PRODUCT_SERVICE', 'OFFER', 'COMPETITOR', 'RESEARCH_NOTE', 'MARKET_INSIGHT', 'SEO_KEYWORD_GROUP', 'CONTENT_EXAMPLE', 'IMAGE_STYLE', 'REPORT_INSIGHT', 'PERFORMANCE_LEARNING', 'FORBIDDEN_CLAIM', 'APPROVED_LINK', 'PROJECT_CONTEXT', 'INDUSTRY_NOTE');

-- CreateEnum
CREATE TYPE "AiKnowledgeStatus" AS ENUM ('RAW', 'REVIEWED', 'APPROVED', 'EXPIRED', 'ARCHIVED', 'REPLACED');

-- CreateEnum
CREATE TYPE "AiContextSnapshotStatus" AS ENUM ('PREVIEW', 'USED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "AiKnowledgeItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT,
    "aiDeliveryProjectId" TEXT,
    "scope" "AiKnowledgeScope" NOT NULL,
    "type" "AiKnowledgeType" NOT NULL,
    "status" "AiKnowledgeStatus" NOT NULL DEFAULT 'RAW',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT,
    "sourceType" TEXT,
    "sourceUrl" TEXT,
    "sourceDate" TIMESTAMP(3),
    "confidence" TEXT,
    "expiresAt" TIMESTAMP(3),
    "evergreen" BOOLEAN NOT NULL DEFAULT false,
    "allowedForPrompt" BOOLEAN NOT NULL DEFAULT false,
    "clientVisible" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "replacedById" TEXT,
    "createdByUserId" TEXT,
    "reviewedByUserId" TEXT,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiKnowledgeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiKnowledgeItemVersion" (
    "id" TEXT NOT NULL,
    "knowledgeItemId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT,
    "status" "AiKnowledgeStatus" NOT NULL,
    "allowedForPrompt" BOOLEAN NOT NULL,
    "clientVisible" BOOLEAN NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "changeReason" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiKnowledgeItemVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiContextSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT,
    "aiDeliveryProjectId" TEXT,
    "workflowRunId" TEXT,
    "purpose" TEXT NOT NULL,
    "status" "AiContextSnapshotStatus" NOT NULL DEFAULT 'PREVIEW',
    "contextHash" TEXT NOT NULL,
    "contextPreview" TEXT NOT NULL,
    "selectedSourcesJson" JSONB NOT NULL,
    "warningsJson" JSONB NOT NULL,
    "missingContextJson" JSONB NOT NULL,
    "tokenEstimate" INTEGER NOT NULL,
    "budgetJson" JSONB,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiContextSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiKnowledgeItem_tenantId_idx" ON "AiKnowledgeItem"("tenantId");

-- CreateIndex
CREATE INDEX "AiKnowledgeItem_tenantId_clientId_idx" ON "AiKnowledgeItem"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "AiKnowledgeItem_tenantId_aiDeliveryProjectId_idx" ON "AiKnowledgeItem"("tenantId", "aiDeliveryProjectId");

-- CreateIndex
CREATE INDEX "AiKnowledgeItem_tenantId_scope_status_idx" ON "AiKnowledgeItem"("tenantId", "scope", "status");

-- CreateIndex
CREATE INDEX "AiKnowledgeItem_tenantId_type_status_idx" ON "AiKnowledgeItem"("tenantId", "type", "status");

-- CreateIndex
CREATE INDEX "AiKnowledgeItem_tenantId_allowedForPrompt_idx" ON "AiKnowledgeItem"("tenantId", "allowedForPrompt");

-- CreateIndex
CREATE INDEX "AiKnowledgeItem_tenantId_status_idx" ON "AiKnowledgeItem"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AiKnowledgeItemVersion_knowledgeItemId_idx" ON "AiKnowledgeItemVersion"("knowledgeItemId");

-- CreateIndex
CREATE INDEX "AiKnowledgeItemVersion_knowledgeItemId_version_idx" ON "AiKnowledgeItemVersion"("knowledgeItemId", "version");

-- CreateIndex
CREATE INDEX "AiContextSnapshot_tenantId_idx" ON "AiContextSnapshot"("tenantId");

-- CreateIndex
CREATE INDEX "AiContextSnapshot_tenantId_clientId_idx" ON "AiContextSnapshot"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "AiContextSnapshot_tenantId_aiDeliveryProjectId_idx" ON "AiContextSnapshot"("tenantId", "aiDeliveryProjectId");

-- CreateIndex
CREATE INDEX "AiContextSnapshot_tenantId_workflowRunId_idx" ON "AiContextSnapshot"("tenantId", "workflowRunId");

-- CreateIndex
CREATE INDEX "AiContextSnapshot_tenantId_status_idx" ON "AiContextSnapshot"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AiContextSnapshot_tenantId_createdAt_idx" ON "AiContextSnapshot"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "AiKnowledgeItem" ADD CONSTRAINT "AiKnowledgeItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiKnowledgeItem" ADD CONSTRAINT "AiKnowledgeItem_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiKnowledgeItem" ADD CONSTRAINT "AiKnowledgeItem_aiDeliveryProjectId_fkey" FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiKnowledgeItem" ADD CONSTRAINT "AiKnowledgeItem_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "AiKnowledgeItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiKnowledgeItem" ADD CONSTRAINT "AiKnowledgeItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiKnowledgeItem" ADD CONSTRAINT "AiKnowledgeItem_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiKnowledgeItem" ADD CONSTRAINT "AiKnowledgeItem_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiKnowledgeItemVersion" ADD CONSTRAINT "AiKnowledgeItemVersion_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeItemId") REFERENCES "AiKnowledgeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiKnowledgeItemVersion" ADD CONSTRAINT "AiKnowledgeItemVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiContextSnapshot" ADD CONSTRAINT "AiContextSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiContextSnapshot" ADD CONSTRAINT "AiContextSnapshot_aiDeliveryProjectId_fkey" FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiContextSnapshot" ADD CONSTRAINT "AiContextSnapshot_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "AiDeliveryWorkflowRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiContextSnapshot" ADD CONSTRAINT "AiContextSnapshot_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
