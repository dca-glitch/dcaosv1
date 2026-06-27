-- CreateTable
CREATE TABLE "ClientUserAccess" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientUserAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientUserAccess_tenantId_clientId_userId_key" ON "ClientUserAccess"("tenantId", "clientId", "userId");

-- CreateIndex
CREATE INDEX "ClientUserAccess_tenantId_idx" ON "ClientUserAccess"("tenantId");

-- CreateIndex
CREATE INDEX "ClientUserAccess_clientId_idx" ON "ClientUserAccess"("clientId");

-- CreateIndex
CREATE INDEX "ClientUserAccess_userId_idx" ON "ClientUserAccess"("userId");

-- CreateIndex
CREATE INDEX "ClientUserAccess_isArchived_idx" ON "ClientUserAccess"("isArchived");

-- CreateIndex
CREATE INDEX "ClientUserAccess_tenantId_clientId_idx" ON "ClientUserAccess"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "ClientUserAccess_tenantId_userId_idx" ON "ClientUserAccess"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "ClientUserAccess_tenantId_isArchived_idx" ON "ClientUserAccess"("tenantId", "isArchived");

-- AddForeignKey
ALTER TABLE "ClientUserAccess" ADD CONSTRAINT "ClientUserAccess_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientUserAccess" ADD CONSTRAINT "ClientUserAccess_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientUserAccess" ADD CONSTRAINT "ClientUserAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;