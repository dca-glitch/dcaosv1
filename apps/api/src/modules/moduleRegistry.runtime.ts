import type { AppModuleContract } from "@dca-os-v1/shared";
import type { Prisma } from "@prisma/client";
import { moduleRegistry } from "@dca-os-v1/shared";
import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AuthResolvedSessionContext, AuthTenantMembershipSummary } from "../auth/types";
import { AUDIT_EVENTS } from "../security/audit-events";
import { recordPlatformAuditEvent } from "../security/audit-log.service";
import type { ModuleListItem } from "../services/moduleService";

export interface TenantModuleSummary extends ModuleListItem {
  enabled: boolean;
  tenantModuleId?: string;
  tenantModuleStatus?: string;
}

export interface ModuleRegistryResponse {
  modules: ModuleListItem[];
}

export interface TenantModulesResponse {
  currentMembership: AuthTenantMembershipSummary;
  modules: TenantModuleSummary[];
}

export interface TenantModuleMutationResponse {
  currentMembership: AuthTenantMembershipSummary;
  module: TenantModuleSummary;
}

type PrismaTx = Prisma.TransactionClient;

type TenantModuleLookup = {
  id: string;
  status: string;
  moduleDefinition: {
    key: string;
    name: string;
    description: string | null;
    status: string;
  };
};

const prisma = createPrismaClient();

function toModuleListItem(moduleDefinition: AppModuleContract): ModuleListItem {
  return {
    key: moduleDefinition.metadata.key,
    name: moduleDefinition.metadata.name,
    description: moduleDefinition.metadata.description,
    status: moduleDefinition.metadata.status,
    version: moduleDefinition.metadata.version
  };
}

function getActiveTenantId(authSession: AuthResolvedSessionContext): string | null {
  return authSession.tenantContext.activeMembership?.tenantId ?? null;
}

function getSharedModule(moduleKey: string): AppModuleContract | null {
  return moduleRegistry[moduleKey] ?? null;
}

function toPrismaModuleStatus(status: string): "PLANNED" | "ACTIVE" | "DEPRECATED" | "RETIRED" {
  if (status === "planned") {
    return "PLANNED";
  }

  return "ACTIVE";
}

function toTenantModuleSummary(
  moduleDefinition: AppModuleContract,
  tenantModule?: TenantModuleLookup
): TenantModuleSummary {
  const base = toModuleListItem(moduleDefinition);
  return {
    ...base,
    enabled: tenantModule?.status === "ACTIVE",
    ...(tenantModule ? { tenantModuleId: tenantModule.id, tenantModuleStatus: tenantModule.status } : {})
  };
}

async function ensureModuleDefinition(tx: PrismaTx, moduleDefinition: AppModuleContract) {
  return tx.moduleDefinition.upsert({
    where: {
      key: moduleDefinition.metadata.key
    },
    update: {
      name: moduleDefinition.metadata.name,
      description: moduleDefinition.metadata.description,
      status: toPrismaModuleStatus(moduleDefinition.metadata.status)
    },
    create: {
      key: moduleDefinition.metadata.key,
      name: moduleDefinition.metadata.name,
      description: moduleDefinition.metadata.description,
      status: toPrismaModuleStatus(moduleDefinition.metadata.status)
    }
  });
}

async function listTenantModuleLookups(tx: PrismaTx, tenantId: string): Promise<TenantModuleLookup[]> {
  return tx.tenantModule.findMany({
    where: {
      tenantId
    },
    orderBy: {
      createdAt: "asc"
    },
    select: {
      id: true,
      status: true,
      moduleDefinition: {
        select: {
          key: true,
          name: true,
          description: true,
          status: true
        }
      }
    }
  });
}

export function listAvailableModules(): ModuleRegistryResponse {
  return {
    modules: Object.values(moduleRegistry).map(toModuleListItem)
  };
}

export async function listCurrentTenantModules(
  authSession: AuthResolvedSessionContext
): Promise<TenantModulesResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  const activeMembership = authSession.tenantContext.activeMembership;
  if (!tenantId || !activeMembership) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const tenantModules = await listTenantModuleLookups(tx, tenantId);
    const tenantModulesByKey = new Map(
      tenantModules.map((tenantModule) => [tenantModule.moduleDefinition.key, tenantModule])
    );

    return {
      currentMembership: activeMembership,
      modules: Object.values(moduleRegistry).map((moduleDefinition) =>
        toTenantModuleSummary(moduleDefinition, tenantModulesByKey.get(moduleDefinition.metadata.key))
      )
    };
  });
}

export async function enableCurrentTenantModule(
  authSession: AuthResolvedSessionContext,
  moduleKey: string
): Promise<TenantModuleMutationResponse | "MODULE_NOT_FOUND" | null> {
  const tenantId = getActiveTenantId(authSession);
  const activeMembership = authSession.tenantContext.activeMembership;
  const moduleDefinition = getSharedModule(moduleKey);
  if (!moduleDefinition) {
    return "MODULE_NOT_FOUND";
  }

  if (!tenantId || !activeMembership) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const persistedModuleDefinition = await ensureModuleDefinition(tx, moduleDefinition);
    const tenantModule = await tx.tenantModule.upsert({
      where: {
        tenantId_moduleDefinitionId: {
          tenantId,
          moduleDefinitionId: persistedModuleDefinition.id
        }
      },
      update: {
        status: "ACTIVE"
      },
      create: {
        tenantId,
        moduleDefinitionId: persistedModuleDefinition.id,
        status: "ACTIVE"
      },
      select: {
        id: true,
        status: true,
        moduleDefinition: {
          select: {
            key: true,
            name: true,
            description: true,
            status: true
          }
        }
      }
    });

    await recordPlatformAuditEvent(
      {
        tenantId,
        actorUserId: authSession.user.id,
        action: AUDIT_EVENTS.moduleEnabled,
        entityType: "tenant_module",
        entityId: tenantModule.id,
        metadata: {
          moduleKey: moduleDefinition.metadata.key,
          tenantModuleStatus: tenantModule.status
        }
      },
      tx
    );

    return {
      currentMembership: activeMembership,
      module: toTenantModuleSummary(moduleDefinition, tenantModule)
    };
  });
}

export async function disableCurrentTenantModule(
  authSession: AuthResolvedSessionContext,
  moduleKey: string
): Promise<TenantModuleMutationResponse | "MODULE_NOT_FOUND" | null> {
  const tenantId = getActiveTenantId(authSession);
  const activeMembership = authSession.tenantContext.activeMembership;
  const moduleDefinition = getSharedModule(moduleKey);
  if (!moduleDefinition) {
    return "MODULE_NOT_FOUND";
  }

  if (!tenantId || !activeMembership) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const persistedModuleDefinition = await ensureModuleDefinition(tx, moduleDefinition);
    const tenantModule = await tx.tenantModule.upsert({
      where: {
        tenantId_moduleDefinitionId: {
          tenantId,
          moduleDefinitionId: persistedModuleDefinition.id
        }
      },
      update: {
        status: "RETIRED"
      },
      create: {
        tenantId,
        moduleDefinitionId: persistedModuleDefinition.id,
        status: "RETIRED"
      },
      select: {
        id: true,
        status: true,
        moduleDefinition: {
          select: {
            key: true,
            name: true,
            description: true,
            status: true
          }
        }
      }
    });

    await recordPlatformAuditEvent(
      {
        tenantId,
        actorUserId: authSession.user.id,
        action: AUDIT_EVENTS.moduleDisabled,
        entityType: "tenant_module",
        entityId: tenantModule.id,
        metadata: {
          moduleKey: moduleDefinition.metadata.key,
          tenantModuleStatus: tenantModule.status
        }
      },
      tx
    );

    return {
      currentMembership: activeMembership,
      module: toTenantModuleSummary(moduleDefinition, tenantModule)
    };
  });
}
