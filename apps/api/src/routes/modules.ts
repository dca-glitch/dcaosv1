import { Router } from "express";
import {
  disableCurrentTenantModule,
  enableCurrentTenantModule,
  getModuleDefinition,
  listCurrentTenantEnabledModules,
  listModuleDefinitions
} from "../controllers/moduleController";
import { requirePermission, requireTenant } from "../middlewares";
import { requireAuth } from "../middlewares/auth.middleware";
import { PERMISSION_KEYS } from "../security/permission-keys";

export function createModuleRouter() {
  const router = Router();

  router.get("/", listModuleDefinitions);
  router.get("/current", requireAuth, requireTenant, listCurrentTenantEnabledModules);
  router.post(
    "/current/:moduleKey/enable",
    requireAuth,
    requireTenant,
    requirePermission(PERMISSION_KEYS.modulesManage),
    enableCurrentTenantModule
  );
  router.post(
    "/current/:moduleKey/disable",
    requireAuth,
    requireTenant,
    requirePermission(PERMISSION_KEYS.modulesManage),
    disableCurrentTenantModule
  );
  router.get("/:key", getModuleDefinition);

  return router;
}
