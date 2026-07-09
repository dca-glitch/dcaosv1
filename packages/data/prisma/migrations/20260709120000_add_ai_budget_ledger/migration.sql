-- CreateEnum
CREATE TYPE "AiBudgetLedgerStatus" AS ENUM ('PREVIEW', 'PLANNED', 'BLOCKED', 'SKIPPED', 'COMPLETED');

-- CreateTable
CREATE TABLE "AiBudgetLedgerEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT,
    "aiDeliveryProjectId" TEXT,
    "workflowRunId" TEXT,
    "periodKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "taskType" TEXT,
    "agentRole" TEXT,
    "estimatedCostUsd" DECIMAL(10,4) NOT NULL,
    "actualCostUsd" DECIMAL(10,4),
    "status" "AiBudgetLedgerStatus" NOT NULL DEFAULT 'PREVIEW',
    "liveProviderCalled" BOOLEAN NOT NULL DEFAULT false,
    "orchestratorVersion" TEXT,
    "stepReference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiBudgetLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiBudgetLedgerEntry_tenantId_clientId_periodKey_idx" ON "AiBudgetLedgerEntry"("tenantId", "clientId", "periodKey");

-- CreateIndex
CREATE INDEX "AiBudgetLedgerEntry_tenantId_periodKey_idx" ON "AiBudgetLedgerEntry"("tenantId", "periodKey");

-- CreateIndex
CREATE INDEX "AiBudgetLedgerEntry_tenantId_workflowRunId_idx" ON "AiBudgetLedgerEntry"("tenantId", "workflowRunId");

-- CreateIndex
CREATE INDEX "AiBudgetLedgerEntry_tenantId_status_createdAt_idx" ON "AiBudgetLedgerEntry"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiBudgetLedgerEntry_tenantId_workflowRunId_stepReference_key" ON "AiBudgetLedgerEntry"("tenantId", "workflowRunId", "stepReference");

-- AddForeignKey
ALTER TABLE "AiBudgetLedgerEntry" ADD CONSTRAINT "AiBudgetLedgerEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiBudgetLedgerEntry" ADD CONSTRAINT "AiBudgetLedgerEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiBudgetLedgerEntry" ADD CONSTRAINT "AiBudgetLedgerEntry_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "AiDeliveryWorkflowRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
