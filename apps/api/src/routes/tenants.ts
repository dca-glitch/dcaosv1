import { Router } from "express";
import {
  getCurrentTenant,
  getCurrentTenantAuthorizationSummaryHandler,
  getTenantMember,
  getTenantSettings,
  listTenantMembers,
  listTenants,
  switchCurrentTenant,
  updateTenantSettings
} from "../controllers/tenantController";
import { requireAuth } from "../middlewares/auth.middleware";
import { requirePermission, requireRole, requireTenant } from "../middlewares";
import { PERMISSION_KEYS } from "../security/permission-keys";

export function createTenantRouter() {
  const router = Router();

  router.get("/", requireAuth, listTenants);
  router.get("/current", requireAuth, requireTenant, getCurrentTenant);
  router.post("/current/switch", requireAuth, switchCurrentTenant);
  router.get(
    "/current/members",
    requireAuth,
    requireTenant,
    requirePermission(PERMISSION_KEYS.usersRead),
    listTenantMembers
  );
  router.get(
    "/current/members/:membershipId",
    requireAuth,
    requireTenant,
    requirePermission(PERMISSION_KEYS.usersRead),
    getTenantMember
  );
  router.get(
    "/current/settings",
    requireAuth,
    requireTenant,
    requirePermission(PERMISSION_KEYS.settingsRead),
    getTenantSettings
  );
  router.patch(
    "/current/settings",
    requireAuth,
    requireTenant,
    requirePermission(PERMISSION_KEYS.settingsUpdate),
    updateTenantSettings
  );
  router.get(
    "/current/authorization-summary",
    requireAuth,
    requireTenant,
    requireRole("owner", "admin"),
    getCurrentTenantAuthorizationSummaryHandler
  );

  return router;
}
