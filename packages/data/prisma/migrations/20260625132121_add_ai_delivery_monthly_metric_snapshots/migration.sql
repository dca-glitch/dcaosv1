-- CreateEnum
CREATE TYPE "MonthlyMetricSourceType" AS ENUM ('MANUAL', 'CSV_IMPORT', 'GA4', 'GSC', 'HYBRID');

-- CreateEnum
CREATE TYPE "MonthlyMetricSnapshotStatus" AS ENUM ('DRAFT', 'IMPORTED', 'APPROVED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "AiDeliveryMonthlyMetricSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiDeliveryProjectId" TEXT NOT NULL,
    "aiDeliveryMonthlyReportId" TEXT NOT NULL,
    "targetMonth" TEXT NOT NULL,
    "sourceType" "MonthlyMetricSourceType" NOT NULL DEFAULT 'MANUAL',
    "status" "MonthlyMetricSnapshotStatus" NOT NULL DEFAULT 'DRAFT',
    "gscClicks" INTEGER,
    "gscImpressions" INTEGER,
    "gscAverageCtr" DOUBLE PRECISION,
    "gscAveragePosition" DOUBLE PRECISION,
    "ga4Sessions" INTEGER,
    "ga4Users" INTEGER,
    "ga4PageViews" INTEGER,
    "notes" TEXT,
    "importedByUserId" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDeliveryMonthlyMetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiDeliveryMonthlyMetricSnapshot_tenantId_aiDeliveryMonthlyReportId_key" ON "AiDeliveryMonthlyMetricSnapshot"("tenantId", "aiDeliveryMonthlyReportId");

-- CreateIndex
CREATE INDEX "AiDeliveryMonthlyMetricSnapshot_tenantId_idx" ON "AiDeliveryMonthlyMetricSnapshot"("tenantId");

-- CreateIndex
CREATE INDEX "AiDeliveryMonthlyMetricSnapshot_tenantId_aiDeliveryProjectId_idx" ON "AiDeliveryMonthlyMetricSnapshot"("tenantId", "aiDeliveryProjectId");

-- CreateIndex
CREATE INDEX "AiDeliveryMonthlyMetricSnapshot_tenantId_targetMonth_idx" ON "AiDeliveryMonthlyMetricSnapshot"("tenantId", "targetMonth");

-- CreateIndex
CREATE INDEX "AiDeliveryMonthlyMetricSnapshot_tenantId_status_idx" ON "AiDeliveryMonthlyMetricSnapshot"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "AiDeliveryMonthlyMetricSnapshot" ADD CONSTRAINT "AiDeliveryMonthlyMetricSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryMonthlyMetricSnapshot" ADD CONSTRAINT "AiDeliveryMonthlyMetricSnapshot_aiDeliveryProjectId_fkey" FOREIGN KEY ("aiDeliveryProjectId") REFERENCES "AiDeliveryProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryMonthlyMetricSnapshot" ADD CONSTRAINT "AiDeliveryMonthlyMetricSnapshot_aiDeliveryMonthlyReportId_fkey" FOREIGN KEY ("aiDeliveryMonthlyReportId") REFERENCES "AiDeliveryMonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryMonthlyMetricSnapshot" ADD CONSTRAINT "AiDeliveryMonthlyMetricSnapshot_importedByUserId_fkey" FOREIGN KEY ("importedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDeliveryMonthlyMetricSnapshot" ADD CONSTRAINT "AiDeliveryMonthlyMetricSnapshot_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
