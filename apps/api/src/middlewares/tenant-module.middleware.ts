import type { NextFunction, Request, Response } from "express";
import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AuthResolvedSessionContext } from "../auth/types";
import {
  getTenantModuleEnforcementMode,
  resolveModuleKeyForPath
} from "../modules/tenant-module-route-map";
import { failure } from "../utils/responses";

const prisma = createPrismaClient();

function getAuthSession(res: Response): AuthResolvedSessionContext | null {
  return (res.locals.authSession as AuthResolvedSessionContext | undefined) ?? null;
}

function getActiveTenantId(authSession: AuthResolvedSessionContext): string | null {
  return authSession.tenantContext.activeMembership?.tenantId ?? null;
}

async function isTenantModuleEnabled(tenantId: string, moduleKey: string): Promise<boolean> {
  const enabled = await prisma.tenantModule.findFirst({
    where: {
      tenantId,
      status: "ACTIVE",
      moduleDefinition: {
        key: moduleKey
      }
    },
    select: { id: true }
  });

  return enabled !== null;
}

function denyModuleAccess(res: Response, moduleKey: string): void {
  res.status(403).json(
    failure("MODULE_NOT_ENABLED", `Module "${moduleKey}" is not enabled for this tenant.`, {
      moduleKey
    })
  );
}

function logDryRun(req: Request, moduleKey: string): void {
  console.info(
    `[tenant-module dry_run] would block ${req.method} ${req.path} — module "${moduleKey}" not enabled for tenant`
  );
}

async function enforceTenantModule(
  req: Request,
  res: Response,
  next: NextFunction,
  moduleKey: string
): Promise<void> {
  const mode = getTenantModuleEnforcementMode();
  if (mode === "off") {
    next();
    return;
  }

  const authSession = getAuthSession(res);
  const tenantId = authSession ? getActiveTenantId(authSession) : null;
  if (!tenantId) {
    next();
    return;
  }

  const enabled = await isTenantModuleEnabled(tenantId, moduleKey);
  if (enabled) {
    next();
    return;
  }

  if (mode === "dry_run") {
    logDryRun(req, moduleKey);
    next();
    return;
  }

  denyModuleAccess(res, moduleKey);
}

export function createTenantModuleGuard(moduleKey: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    enforceTenantModule(req, res, next, moduleKey);
}

export async function tenantModuleGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  const moduleKey = resolveModuleKeyForPath(req.path);
  if (!moduleKey) {
    next();
    return;
  }
  await enforceTenantModule(req, res, next, moduleKey);
}
