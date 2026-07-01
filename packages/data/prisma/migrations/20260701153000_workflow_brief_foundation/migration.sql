-- Workflow brief foundation: enums, WorkflowBrief table, AI run/report models, production plan

-- CreateEnum
CREATE TYPE "WorkflowBriefSource" AS ENUM ('CLIENT_PORTAL', 'ADMIN_PANEL');

-- CreateEnum
CREATE TYPE "WorkflowBriefCreatedByRole" AS ENUM ('CLIENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "WorkflowBriefStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'READY_FOR_AI', 'AI_RUNNING', 'AI_RESULTS_READY', 'APPROVED_FOR_PRODUCTION', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AiBriefRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AiReportStatus" AS ENUM ('DRAFT', 'READY', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProductionPlanStatus" AS ENUM ('DRAFT', 'SENT_TO_CLIENT', 'APPROVED', 'CHANGES_REQUESTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BriefApprovalDecisionType" AS ENUM ('APPROVE', 'REJECT', 'REQUEST_CHANGES', 'SUBMIT', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "BriefApprovalTargetType" AS ENUM ('BRIEF', 'MI_REPORT', 'SEO_REPORT', 'PRODUCTION_PLAN');

-- CreateEnum
CREATE TYPE "BriefApprovalActorRole" AS ENUM ('CLIENT', 'ADMIN');

-- CreateTable
CREATE TABLE "WorkflowBrief" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "source" "WorkflowBriefSource" NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdByRole" "WorkflowBriefCreatedByRole" NOT NULL,
    "title" TEXT NOT NULL,
    "goal" TEXT,
    "businessContext" TEXT,
    "targetAudience" TEXT,
    "offerContext" TEXT,
    "locationContext" TEXT,
    "notes" TEXT,
    "structuredInputJson" JSONB,
    "status" "WorkflowBriefStatus" NOT NULL DEFAULT 'DRAFT',
    "adminReviewedAt" TIMESTAMP(3),
    "adminReviewedByUserId" TEXT,
    "aiRequestedAt" TIMESTAMP(3),
    "approvedForProductionAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiBriefRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "triggeredByUserId" TEXT NOT NULL,
    "status" "AiBriefRunStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "inputSnapshotJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiBriefRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMiReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "aiBriefRunId" TEXT NOT NULL,
    "status" "AiReportStatus" NOT NULL DEFAULT 'DRAFT',
    "summaryText" TEXT,
    "reportJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiMiReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSeoReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "aiBriefRunId" TEXT NOT NULL,
    "status" "AiReportStatus" NOT NULL DEFAULT 'DRAFT',
    "summaryText" TEXT,
    "reportJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSeoReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefApproval" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" "BriefApprovalActorRole" NOT NULL,
    "decisionType" "BriefApprovalDecisionType" NOT NULL,
    "targetType" "BriefApprovalTargetType" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BriefApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "aiDeliveryProjectId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "planJson" JSONB,
    "clientVisibleSnapshotJson" JSONB,
    "status" "ProductionPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "sentToClientAt" TIMESTAMP(3),
    "approvedByClientAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionPlan_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "AiDeliveryProject" ADD COLUMN "sourceBriefId" TEXT;

-- AlterTable
ALTER TABLE "AiDeliveryDeliverable" ADD COLUMN "briefId" TEXT;
ALTER TABLE "AiDeliveryDeliverable" ADD COLUMN "productionPlanId" TEXT;

-- CreateIndex
CREATE INDEX "WorkflowBrief_tenantId_idx" ON "WorkflowBrief"("tenantId");
CREATE INDEX "WorkflowBrief_tenantId_clientId_idx" ON "WorkflowBrief"("tenantId", "clientId");
CREATE INDEX "WorkflowBrief_tenantId_status_idx" ON "WorkflowBrief"("tenantId", "status");
CREATE INDEX "WorkflowBrief_tenantId_createdByUserId_idx" ON "WorkflowBrief"("tenantId", "createdByUserId");

CREATE INDEX "AiBriefRun_tenantId_idx" ON "AiBriefRun"("tenantId");
CREATE INDEX "AiBriefRun_tenantId_briefId_idx" ON "AiBriefRun"("tenantId", "briefId");
CREATE INDEX "AiBriefRun_tenantId_status_idx" ON "AiBriefRun"("tenantId", "status");

CREATE INDEX "AiMiReport_tenantId_idx" ON "AiMiReport"("tenantId");
CREATE INDEX "AiMiReport_tenantId_briefId_idx" ON "AiMiReport"("tenantId", "briefId");
CREATE INDEX "AiMiReport_tenantId_aiBriefRunId_idx" ON "AiMiReport"("tenantId", "aiBriefRunId");

CREATE INDEX "AiSeoReport_tenantId_idx" ON "AiSeoReport"("tenantId");
CREATE INDEX "AiSeoReport_tenantId_briefId_idx" ON "AiSeoReport"("tenantId", "briefId");
CREATE INDEX "AiSeoReport_tenantId_aiBriefRunId_idx" ON "AiSeoReport"("tenantId", "aiBriefRunId");

CREATE INDEX "BriefApproval_tenantId_idx" ON "BriefApproval"("tenantId");
CREATE INDEX "BriefApproval_tenantId_briefId_idx" ON "BriefApproval"("tenantId", "briefId");
CREATE INDEX "BriefApproval_tenantId_actorUserId_idx" ON "BriefApproval"("tenantId", "actorUserId");

CREATE INDEX "ProductionPlan_tenantId_idx" ON "ProductionPlan"("tenantId");
CREATE INDEX "ProductionPlan_tenantId_briefId_idx" ON "ProductionPlan"("tenantId", "briefId");
CREATE INDEX "ProductionPlan_tenantId_aiDeliveryProjectId_idx" ON "ProductionPlan"("tenantId", "aiDeliveryProjectId");

CREATE INDEX "AiDeliveryProject_tenantId_sourceBriefId_idx" ON "AiDeliveryProject"("tenantId", "sourceBriefId");

CREATE INDEX "AiDeliveryDeliverable_tenantId_briefId_idx" ON "AiDeliveryDeliverable"("tenantId", "briefId");
CREATE INDEX "AiDeliveryDeliverable_tenantId_productionPlanId_idx" ON "AiDeliveryDeliverable"("tenantId", "productionPlanId");

-- AddForeignKey
ALTER TABLE "WorkflowBrief" ADD CONSTRAINT "WorkflowBrief_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowBrief" ADD CONSTRAINT "WorkflowBrief_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkflowBrief" ADD CONSTRAINT "WorkflowBrief_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkflowBrief" ADD CONSTRAINT "WorkflowBrief_adminReviewedByUserId_fkey" FOREIGN KEY ("adminReviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiBriefRun" ADD CONSTRAINT "AiBriefRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiBriefRun" ADD CONSTRAINT "AiBriefRun_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "WorkflowBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiBriefRun" ADD CONSTRAINT "AiBriefRun_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AiMiReport" ADD CONSTRAINT "AiMiReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiMiReport" ADD CONSTRAINT "AiMiReport_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "WorkflowBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiMiReport" ADD CONSTRAINT "AiMiReport_aiBriefRunId_fkey" FOREIGN KEY ("aiBriefRunId") REFERENCES "AiBriefRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiSeoReport" ADD CONSTRAINT "AiSeoReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiSeoReport" ADD CONSTRAINT "AiSeoReport_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "WorkflowBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiSeoReport" ADD CONSTRAINT "AiSeoReport_aiBriefRunId_fkey" FOREIGN KEY ("aiBriefRunId") REFERENCES "AiBriefRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BriefApproval" ADD CONSTRAINT "BriefApproval_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BriefApproval" ADD CONSTRAINT "BriefApproval_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "WorkflowBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BriefApproval" ADD CONSTRAINT "BriefApproval_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductionPlan" ADD CONSTRAINT "ProductionPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductionPlan" ADD CONSTRAINT "ProductionPlan_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "WorkflowBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductionPlan" ADD CONSTRAINT "ProductionPlan_aiDeliveryProjectId_fkey" FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiDeliveryProject" ADD CONSTRAINT "AiDeliveryProject_sourceBriefId_fkey" FOREIGN KEY ("sourceBriefId") REFERENCES "WorkflowBrief"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiDeliveryDeliverable" ADD CONSTRAINT "AiDeliveryDeliverable_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "WorkflowBrief"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiDeliveryDeliverable" ADD CONSTRAINT "AiDeliveryDeliverable_productionPlanId_fkey" FOREIGN KEY ("productionPlanId") REFERENCES "ProductionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
