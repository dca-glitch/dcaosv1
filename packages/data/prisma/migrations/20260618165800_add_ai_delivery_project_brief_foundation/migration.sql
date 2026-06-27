-- CreateEnum
CREATE TYPE "AiDeliveryBriefStatus" AS ENUM ('DRAFT', 'CLIENT_INPUT_REQUESTED', 'CLIENT_SUBMITTED', 'REVISION_REQUESTED', 'CLIENT_REVISED', 'ADMIN_APPROVED');

-- CreateTable
CREATE TABLE "AiDeliveryProject" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "targetMonth" TIMESTAMP(3) NOT NULL,
    "plannedContentScopeNotes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDeliveryProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiDeliveryBrief" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiDeliveryProjectId" TEXT NOT NULL,
    "status" "AiDeliveryBriefStatus" NOT NULL DEFAULT 'DRAFT',
    "clientPriorities" TEXT,
    "productsServicesFocus" TEXT,
    "targetAudience" TEXT,
    "marketsCompetitors" TEXT,
    "notes" TEXT,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "revisionRequestedAt" TIMESTAMP(3),
    "revisedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDeliveryBrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiDeliveryProject_tenantId_idx" ON "AiDeliveryProject"("tenantId");

-- CreateIndex
CREATE INDEX "AiDeliveryProject_tenantId_isArchived_idx" ON "AiDeliveryProject"("tenantId", "isArchived");

-- CreateIndex
CREATE INDEX "AiDeliveryProject_tenantId_clientId_idx" ON "AiDeliveryProject"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "AiDeliveryProject_tenantId_projectId_idx" ON "AiDeliveryProject"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "AiDeliveryProject_tenantId_targetMonth_idx" ON "AiDeliveryProject"("tenantId", "targetMonth");

-- CreateIndex
CREATE UNIQUE INDEX "AiDeliveryBrief_aiDeliveryProjectId_key" ON "AiDeliveryBrief"("aiDeliveryProjectId");

-- CreateIndex
CREATE INDEX "AiDeliveryBrief_tenantId_idx" ON "AiDeliveryBrief"("tenantId");

-- CreateIndex
CREATE INDEX "AiDeliveryBrief_tenantId_status_idx" ON "AiDeliveryBrief"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AiDeliveryBrief_tenantId_aiDeliveryProjectId_idx" ON "AiDeliveryBrief"("tenantId", "aiDeliveryProjectId");

-- AddForeignKey
ALTER TABLE "AiDeliveryProject" ADD CONSTRAINT "AiDeliveryProject_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryProject" ADD CONSTRAINT "AiDeliveryProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryProject" ADD CONSTRAINT "AiDeliveryProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryBrief" ADD CONSTRAINT "AiDeliveryBrief_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryBrief" ADD CONSTRAINT "AiDeliveryBrief_aiDeliveryProjectId_fkey" FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
