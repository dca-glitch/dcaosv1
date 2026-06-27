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

export async function tenantModuleGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  const mode = getTenantModuleEnforcementMode();
  if (mode === "off") {
    next();
    return;
  }

  const moduleKey = resolveModuleKeyForPath(req.path);
  if (!moduleKey) {
    next();
    return;
  }

  const authSession = getAuthSession(res);
  const tenantId = authSession ? getActiveTenantId(authSession) : null;
  if (!tenantId) {
    next();
    return;
  }

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

  if (enabled) {
    next();
    return;
  }

  if (mode === "dry_run") {
    console.info(
      `[tenant-module dry_run] would block ${req.method} ${req.path} — module "${moduleKey}" not enabled for tenant`
    );
    next();
    return;
  }

  res.status(403).json(
    failure("MODULE_NOT_ENABLED", `Module "${moduleKey}" is not enabled for this tenant.`, {
      moduleKey
    })
  );
}
