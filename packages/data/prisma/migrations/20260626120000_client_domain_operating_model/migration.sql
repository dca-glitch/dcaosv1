-- Client / domain operating model foundation (approved roadmap blocks 1-5)

CREATE TYPE "ClientKind" AS ENUM ('AGENCY_CLIENT', 'OWN_DOMAIN');
CREATE TYPE "ClientMigrationStatus" AS ENUM ('ACTIVE', 'PLANNED_LICENSEE_TENANT', 'MIGRATED');
CREATE TYPE "PublicationConnectorType" AS ENUM ('WORDPRESS');
CREATE TYPE "PublicationLogStatus" AS ENUM ('PREPARED', 'PROVIDER_DISABLED', 'PUBLISHED', 'FAILED');
CREATE TYPE "AnalyticsConnectionStatus" AS ENUM ('MANUAL', 'CONFIGURED', 'LIVE_DEFERRED');

ALTER TABLE "Client" ADD COLUMN "clientKind" "ClientKind" NOT NULL DEFAULT 'AGENCY_CLIENT';
ALTER TABLE "Client" ADD COLUMN "legalEntityName" TEXT;
ALTER TABLE "Client" ADD COLUMN "accountGroupName" TEXT;
ALTER TABLE "Client" ADD COLUMN "migrationStatus" "ClientMigrationStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX "Client_tenantId_clientKind_idx" ON "Client"("tenantId", "clientKind");
CREATE INDEX "Client_tenantId_migrationStatus_idx" ON "Client"("tenantId", "migrationStatus");

CREATE TABLE "PublicationTarget" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "connectorType" "PublicationConnectorType" NOT NULL DEFAULT 'WORDPRESS',
    "siteUrl" TEXT NOT NULL,
    "siteSlug" TEXT,
    "wordPressComSite" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationTarget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PublicationTargetCredential" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "publicationTargetId" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationTargetCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientAnalyticsProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "gscSiteUrl" TEXT,
    "ga4PropertyId" TEXT,
    "defaultSourceType" "MonthlyMetricSourceType" NOT NULL DEFAULT 'MANUAL',
    "connectionStatus" "AnalyticsConnectionStatus" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientAnalyticsProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PublicationLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "publicationTargetId" TEXT,
    "aiDeliveryProjectId" TEXT,
    "deliverableId" TEXT,
    "action" TEXT NOT NULL,
    "status" "PublicationLogStatus" NOT NULL,
    "siteUrlHost" TEXT,
    "externalPostId" TEXT,
    "actorUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MarketIntelligenceProject" ADD COLUMN "clientId" TEXT;

CREATE INDEX "MarketIntelligenceProject_tenantId_clientId_idx" ON "MarketIntelligenceProject"("tenantId", "clientId");

ALTER TABLE "MarketIntelligenceHandoff" ADD COLUMN "clientId" TEXT;

CREATE INDEX "MarketIntelligenceHandoff_tenantId_clientId_idx" ON "MarketIntelligenceHandoff"("tenantId", "clientId");

CREATE INDEX "PublicationTarget_tenantId_idx" ON "PublicationTarget"("tenantId");
CREATE INDEX "PublicationTarget_tenantId_clientId_idx" ON "PublicationTarget"("tenantId", "clientId");
CREATE INDEX "PublicationTarget_tenantId_clientId_isArchived_idx" ON "PublicationTarget"("tenantId", "clientId", "isArchived");
CREATE INDEX "PublicationTarget_tenantId_clientId_isDefault_idx" ON "PublicationTarget"("tenantId", "clientId", "isDefault");

CREATE UNIQUE INDEX "PublicationTargetCredential_publicationTargetId_key" ON "PublicationTargetCredential"("publicationTargetId");
CREATE INDEX "PublicationTargetCredential_tenantId_idx" ON "PublicationTargetCredential"("tenantId");
CREATE INDEX "PublicationTargetCredential_tenantId_publicationTargetId_idx" ON "PublicationTargetCredential"("tenantId", "publicationTargetId");

CREATE UNIQUE INDEX "ClientAnalyticsProfile_clientId_key" ON "ClientAnalyticsProfile"("clientId");
CREATE INDEX "ClientAnalyticsProfile_tenantId_idx" ON "ClientAnalyticsProfile"("tenantId");
CREATE INDEX "ClientAnalyticsProfile_tenantId_clientId_idx" ON "ClientAnalyticsProfile"("tenantId", "clientId");

CREATE INDEX "PublicationLog_tenantId_idx" ON "PublicationLog"("tenantId");
CREATE INDEX "PublicationLog_tenantId_clientId_idx" ON "PublicationLog"("tenantId", "clientId");
CREATE INDEX "PublicationLog_tenantId_deliverableId_idx" ON "PublicationLog"("tenantId", "deliverableId");
CREATE INDEX "PublicationLog_tenantId_createdAt_idx" ON "PublicationLog"("tenantId", "createdAt");

ALTER TABLE "PublicationTarget" ADD CONSTRAINT "PublicationTarget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicationTarget" ADD CONSTRAINT "PublicationTarget_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PublicationTargetCredential" ADD CONSTRAINT "PublicationTargetCredential_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicationTargetCredential" ADD CONSTRAINT "PublicationTargetCredential_publicationTargetId_fkey" FOREIGN KEY ("publicationTargetId") REFERENCES "PublicationTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicationTargetCredential" ADD CONSTRAINT "PublicationTargetCredential_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClientAnalyticsProfile" ADD CONSTRAINT "ClientAnalyticsProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientAnalyticsProfile" ADD CONSTRAINT "ClientAnalyticsProfile_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PublicationLog" ADD CONSTRAINT "PublicationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicationLog" ADD CONSTRAINT "PublicationLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicationLog" ADD CONSTRAINT "PublicationLog_publicationTargetId_fkey" FOREIGN KEY ("publicationTargetId") REFERENCES "PublicationTarget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MarketIntelligenceProject" ADD CONSTRAINT "MarketIntelligenceProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
