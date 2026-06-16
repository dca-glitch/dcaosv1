-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'REVOLUT_BANK', 'WISE_BANK', 'REVOLUT_CARD', 'WISE_CARD', 'CARD_PROCESSOR', 'OTHER');

-- CreateEnum
CREATE TYPE "CreditNoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'VOIDED');

-- AlterEnum
BEGIN;
CREATE TYPE "InvoiceStatus_new" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOIDED', 'UNCOLLECTIBLE');
ALTER TABLE "Invoice" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE "InvoiceStatus_new" USING (
  CASE
    WHEN "status"::text = 'SENT' THEN 'ISSUED'
    WHEN "status"::text = 'CANCELLED' THEN 'VOIDED'
    WHEN "status"::text = 'OVERDUE' THEN 'ISSUED'
    ELSE "status"::text
  END::"InvoiceStatus_new"
);
ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "InvoiceStatus_old";
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_projectId_fkey";

-- AlterTable
ALTER TABLE "CompanyProfile" ADD COLUMN     "creditNotePrefix" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "invoicePrefix" TEXT,
ADD COLUMN     "invoiceTemplateKey" TEXT NOT NULL DEFAULT 'classic',
ADD COLUMN     "tenantId" TEXT;

DO $$
DECLARE
  profile_count INTEGER;
  tenant_count INTEGER;
  selected_tenant_id TEXT;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM "CompanyProfile";

  IF profile_count > 0 THEN
    SELECT COUNT(*) INTO tenant_count FROM "Tenant";

    IF tenant_count <> 1 THEN
      RAISE EXCEPTION 'Cannot backfill CompanyProfile.tenantId safely: expected exactly one Tenant when CompanyProfile rows exist, found %', tenant_count;
    END IF;

    SELECT "id" INTO selected_tenant_id FROM "Tenant" ORDER BY "createdAt" ASC LIMIT 1;

    UPDATE "CompanyProfile"
    SET "tenantId" = selected_tenant_id
    WHERE "tenantId" IS NULL;
  END IF;
END $$;

ALTER TABLE "CompanyProfile" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "clientId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "statusReason" TEXT,
ADD COLUMN     "uncollectibleAt" TIMESTAMP(3),
ADD COLUMN     "voidedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitPriceCents" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoicePayment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "amountIssuedCents" INTEGER NOT NULL,
    "amountReceivedCents" INTEGER NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditNote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "creditNoteNumber" TEXT NOT NULL,
    "status" "CreditNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "documentUrl" TEXT,
    "documentStorageKey" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "documentType" TEXT,
    "documentDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "documentStorageKey" TEXT NOT NULL,
    "uploadedByUserId" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceItem_tenantId_idx" ON "InvoiceItem"("tenantId");

-- CreateIndex
CREATE INDEX "InvoiceItem_tenantId_isArchived_idx" ON "InvoiceItem"("tenantId", "isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceItem_tenantId_name_key" ON "InvoiceItem"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "InvoicePayment_invoiceId_key" ON "InvoicePayment"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoicePayment_tenantId_idx" ON "InvoicePayment"("tenantId");

-- CreateIndex
CREATE INDEX "InvoicePayment_tenantId_invoiceId_idx" ON "InvoicePayment"("tenantId", "invoiceId");

-- CreateIndex
CREATE INDEX "InvoicePayment_tenantId_paymentDate_idx" ON "InvoicePayment"("tenantId", "paymentDate");

-- CreateIndex
CREATE INDEX "CreditNote_tenantId_idx" ON "CreditNote"("tenantId");

-- CreateIndex
CREATE INDEX "CreditNote_tenantId_invoiceId_idx" ON "CreditNote"("tenantId", "invoiceId");

-- CreateIndex
CREATE INDEX "CreditNote_tenantId_status_idx" ON "CreditNote"("tenantId", "status");

-- CreateIndex
CREATE INDEX "CreditNote_tenantId_isArchived_idx" ON "CreditNote"("tenantId", "isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_tenantId_creditNoteNumber_key" ON "CreditNote"("tenantId", "creditNoteNumber");

-- CreateIndex
CREATE INDEX "ProjectDocument_tenantId_idx" ON "ProjectDocument"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectDocument_tenantId_projectId_idx" ON "ProjectDocument"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "ProjectDocument_tenantId_isArchived_idx" ON "ProjectDocument"("tenantId", "isArchived");

-- CreateIndex
CREATE INDEX "ProjectDocument_tenantId_documentDate_idx" ON "ProjectDocument"("tenantId", "documentDate");

-- CreateIndex
CREATE INDEX "CompanyProfile_tenantId_idx" ON "CompanyProfile"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_tenantId_key" ON "CompanyProfile"("tenantId");

-- AddForeignKey
ALTER TABLE "CompanyProfile" ADD CONSTRAINT "CompanyProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

