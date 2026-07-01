-- CreateEnum
CREATE TYPE "BriefType" AS ENUM ('MONTHLY', 'ADDITIONAL');

-- CreateEnum
CREATE TYPE "BriefStatus" AS ENUM ('DRAFT', 'AWAITING_CLIENT', 'SUBMITTED');

-- CreateTable
CREATE TABLE "Brief" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "briefNumber" INTEGER NOT NULL DEFAULT 0,
    "targetGroup" TEXT,
    "hubCount" INTEGER NOT NULL DEFAULT 0,
    "geoSeoCount" INTEGER NOT NULL DEFAULT 0,
    "lifestyleCount" INTEGER NOT NULL DEFAULT 0,
    "otherCount" INTEGER NOT NULL DEFAULT 0,
    "type" "BriefType" NOT NULL,
    "month" INTEGER,
    "year" INTEGER,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "BriefStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Brief_companyId_idx" ON "Brief"("companyId");

-- CreateIndex
CREATE INDEX "Brief_clientId_idx" ON "Brief"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Brief_clientId_type_month_year_key" ON "Brief"("clientId", "type", "month", "year");
