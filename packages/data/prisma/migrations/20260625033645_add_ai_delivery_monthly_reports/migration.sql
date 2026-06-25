-- CreateEnum
CREATE TYPE "AiDeliveryMonthlyReportStatus" AS ENUM ('DRAFT', 'ADMIN_REVIEW', 'FINAL', 'ARCHIVED');

-- CreateTable
CREATE TABLE "AiDeliveryMonthlyReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiDeliveryProjectId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "AiDeliveryMonthlyReportStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "adminSummaryNotes" TEXT,
    "recommendationsText" TEXT,
    "exportUrl" TEXT,
    "storageKey" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDeliveryMonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiDeliveryMonthlyReport_tenantId_aiDeliveryProjectId_key" ON "AiDeliveryMonthlyReport"("tenantId", "aiDeliveryProjectId");

-- CreateIndex
CREATE INDEX "AiDeliveryMonthlyReport_tenantId_idx" ON "AiDeliveryMonthlyReport"("tenantId");

-- CreateIndex
CREATE INDEX "AiDeliveryMonthlyReport_tenantId_status_idx" ON "AiDeliveryMonthlyReport"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AiDeliveryMonthlyReport_tenantId_clientId_idx" ON "AiDeliveryMonthlyReport"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "AiDeliveryMonthlyReport_tenantId_isArchived_idx" ON "AiDeliveryMonthlyReport"("tenantId", "isArchived");

-- AddForeignKey
ALTER TABLE "AiDeliveryMonthlyReport" ADD CONSTRAINT "AiDeliveryMonthlyReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryMonthlyReport" ADD CONSTRAINT "AiDeliveryMonthlyReport_aiDeliveryProjectId_fkey" FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryMonthlyReport" ADD CONSTRAINT "AiDeliveryMonthlyReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
