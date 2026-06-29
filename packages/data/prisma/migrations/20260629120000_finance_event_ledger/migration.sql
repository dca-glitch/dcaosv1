-- CreateEnum
CREATE TYPE "FinanceEventType" AS ENUM ('REVENUE', 'COST');

-- CreateEnum
CREATE TYPE "FinanceEventSource" AS ENUM ('INVOICE', 'BILL', 'DELIVERY', 'MANUAL', 'SYSTEM');

-- CreateTable
CREATE TABLE "FinanceEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "FinanceEventType" NOT NULL,
    "source" "FinanceEventSource" NOT NULL,
    "sourceEntityId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "clientId" TEXT,
    "projectId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceMonthlySnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "totalRevenueCents" INTEGER NOT NULL DEFAULT 0,
    "totalCostCents" INTEGER NOT NULL DEFAULT 0,
    "profitCents" INTEGER NOT NULL DEFAULT 0,
    "marginPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reportStorageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceMonthlySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueAttribution" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "financeEventId" TEXT NOT NULL,
    "deliveryId" TEXT,
    "clientId" TEXT,
    "projectId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceEvent_tenantId_type_timestamp_idx" ON "FinanceEvent"("tenantId", "type", "timestamp");

-- CreateIndex
CREATE INDEX "FinanceEvent_tenantId_clientId_idx" ON "FinanceEvent"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "FinanceEvent_tenantId_projectId_idx" ON "FinanceEvent"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "FinanceEvent_tenantId_timestamp_idx" ON "FinanceEvent"("tenantId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceEvent_tenantId_source_sourceEntityId_key" ON "FinanceEvent"("tenantId", "source", "sourceEntityId");

-- CreateIndex
CREATE INDEX "FinanceMonthlySnapshot_tenantId_month_idx" ON "FinanceMonthlySnapshot"("tenantId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceMonthlySnapshot_tenantId_month_key" ON "FinanceMonthlySnapshot"("tenantId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueAttribution_financeEventId_key" ON "RevenueAttribution"("financeEventId");

-- CreateIndex
CREATE INDEX "RevenueAttribution_tenantId_deliveryId_idx" ON "RevenueAttribution"("tenantId", "deliveryId");

-- CreateIndex
CREATE INDEX "RevenueAttribution_tenantId_clientId_idx" ON "RevenueAttribution"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "RevenueAttribution_tenantId_projectId_idx" ON "RevenueAttribution"("tenantId", "projectId");

-- AddForeignKey
ALTER TABLE "FinanceEvent" ADD CONSTRAINT "FinanceEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEvent" ADD CONSTRAINT "FinanceEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEvent" ADD CONSTRAINT "FinanceEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceMonthlySnapshot" ADD CONSTRAINT "FinanceMonthlySnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueAttribution" ADD CONSTRAINT "RevenueAttribution_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueAttribution" ADD CONSTRAINT "RevenueAttribution_financeEventId_fkey" FOREIGN KEY ("financeEventId") REFERENCES "FinanceEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueAttribution" ADD CONSTRAINT "RevenueAttribution_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueAttribution" ADD CONSTRAINT "RevenueAttribution_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
