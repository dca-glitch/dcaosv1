-- Puriva MVP: client product catalog + inquiry-only flow (no cart/checkout)

CREATE TYPE "ClientCatalogInquiryStatus" AS ENUM ('NEW', 'ACKNOWLEDGED', 'CLOSED');

CREATE TABLE "ClientCatalogProduct" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "priceLabel" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisibleInPortal" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientCatalogProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientCatalogInquiry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "productId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "message" TEXT NOT NULL,
    "status" "ClientCatalogInquiryStatus" NOT NULL DEFAULT 'NEW',
    "submittedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientCatalogInquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClientCatalogProduct_tenantId_idx" ON "ClientCatalogProduct"("tenantId");
CREATE INDEX "ClientCatalogProduct_tenantId_clientId_idx" ON "ClientCatalogProduct"("tenantId", "clientId");
CREATE INDEX "ClientCatalogProduct_tenantId_clientId_isArchived_idx" ON "ClientCatalogProduct"("tenantId", "clientId", "isArchived");
CREATE INDEX "ClientCatalogProduct_tenantId_clientId_isVisibleInPortal_idx" ON "ClientCatalogProduct"("tenantId", "clientId", "isVisibleInPortal");

CREATE INDEX "ClientCatalogInquiry_tenantId_idx" ON "ClientCatalogInquiry"("tenantId");
CREATE INDEX "ClientCatalogInquiry_tenantId_clientId_idx" ON "ClientCatalogInquiry"("tenantId", "clientId");
CREATE INDEX "ClientCatalogInquiry_tenantId_clientId_status_idx" ON "ClientCatalogInquiry"("tenantId", "clientId", "status");
CREATE INDEX "ClientCatalogInquiry_tenantId_productId_idx" ON "ClientCatalogInquiry"("tenantId", "productId");

ALTER TABLE "ClientCatalogProduct" ADD CONSTRAINT "ClientCatalogProduct_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientCatalogProduct" ADD CONSTRAINT "ClientCatalogProduct_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientCatalogInquiry" ADD CONSTRAINT "ClientCatalogInquiry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientCatalogInquiry" ADD CONSTRAINT "ClientCatalogInquiry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientCatalogInquiry" ADD CONSTRAINT "ClientCatalogInquiry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ClientCatalogProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
