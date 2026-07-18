-- P1.2b: additive, non-destructive legacy Tenant -> Workspace identity binding.
-- The unique nullable key makes the approved mapping idempotent without coupling
-- the future Workspace boundary to a legacy foreign key.
ALTER TABLE "Workspace" ADD COLUMN "legacyTenantId" TEXT;

CREATE UNIQUE INDEX "Workspace_legacyTenantId_key" ON "Workspace"("legacyTenantId");
