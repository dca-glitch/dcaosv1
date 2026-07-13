-- AlterTable
ALTER TABLE "Client" ADD COLUMN "operatingPackKey" TEXT;

-- CreateIndex
CREATE INDEX "Client_tenantId_operatingPackKey_idx" ON "Client"("tenantId", "operatingPackKey");
