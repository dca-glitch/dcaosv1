import type { RequestHandler } from "express";
import { ApiError } from "../middleware/errorMiddleware";
import { getModule } from "../services/moduleService";
import {
  moduleInvalidFailure,
  moduleNotFoundFailure,
  moduleTenantContextInvalidFailure,
  success
} from "../utils/responses";
import type { AuthSessionLocals } from "../auth/types";
import {
  disableCurrentTenantModule as disableCurrentTenantModuleRuntime,
  enableCurrentTenantModule as enableCurrentTenantModuleRuntime,
  listAvailableModules,
  listCurrentTenantModules
} from "../modules/moduleRegistry.runtime";

function getAuthSession(resLocals: unknown) {
  return (resLocals as AuthSessionLocals | undefined)?.authSession;
}

function getModuleKey(reqParams: unknown): string {
  const params = reqParams as { key?: unknown; moduleKey?: unknown };
  const moduleKey = typeof params.moduleKey === "string" ? params.moduleKey : params.key;
  return typeof moduleKey === "string" ? moduleKey.trim() : "";
}

export const listModuleDefinitions: RequestHandler = (_req, res) => {
  res.json(success(listAvailableModules()));
};

export const getModuleDefinition: RequestHandler = (req, res, next) => {
  const moduleDefinition = getModule(req.params.key);

  if (!moduleDefinition) {
    next(new ApiError(404, "MODULE_NOT_FOUND", "Module definition was not found."));
    return;
  }

  res.json(success(moduleDefinition));
};

export const listCurrentTenantEnabledModules: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession?.tenantContext.activeMembership) {
    res.status(403).json(moduleTenantContextInvalidFailure());
    return;
  }

  try {
    const response = await listCurrentTenantModules(authSession);
    if (!response) {
      res.status(403).json(moduleTenantContextInvalidFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "module-registry-skeleton" }));
  } catch {
    res.status(500).json(moduleInvalidFailure());
  }
};

export const enableCurrentTenantModule: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession?.tenantContext.activeMembership) {
    res.status(403).json(moduleTenantContextInvalidFailure());
    return;
  }

  const moduleKey = getModuleKey(req.params);
  if (!moduleKey) {
    res.status(400).json(moduleInvalidFailure());
    return;
  }

  try {
    const response = await enableCurrentTenantModuleRuntime(authSession, moduleKey);
    if (response === "MODULE_NOT_FOUND") {
      res.status(404).json(moduleNotFoundFailure());
      return;
    }

    if (!response) {
      res.status(403).json(moduleTenantContextInvalidFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "module-registry-skeleton" }));
  } catch {
    res.status(500).json(moduleInvalidFailure());
  }
};

export const disableCurrentTenantModule: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession?.tenantContext.activeMembership) {
    res.status(403).json(moduleTenantContextInvalidFailure());
    return;
  }

  const moduleKey = getModuleKey(req.params);
  if (!moduleKey) {
    res.status(400).json(moduleInvalidFailure());
    return;
  }

  try {
    const response = await disableCurrentTenantModuleRuntime(authSession, moduleKey);
    if (response === "MODULE_NOT_FOUND") {
      res.status(404).json(moduleNotFoundFailure());
      return;
    }

    if (!response) {
      res.status(403).json(moduleTenantContextInvalidFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "module-registry-skeleton" }));
  } catch {
    res.status(500).json(moduleInvalidFailure());
  }
};
