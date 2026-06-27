import { resolveActiveRoles, resolveEffectivePermissions } from "../middlewares/authorization.middleware";
import { PERMISSION_KEYS, type PermissionKey } from "../security/permission-keys";
import type { AuthResolvedSessionContext } from "../auth/types";

export interface TenantAuthorizationSummary {
  roles: string[];
  effectivePermissions: PermissionKey[];
  permissionCatalog: PermissionKey[];
  inviteFlowEnabled: false;
  passwordResetFlowEnabled: false;
}

export function getTenantAuthorizationSummary(
  authSession: AuthResolvedSessionContext
): TenantAuthorizationSummary {
  return {
    roles: resolveActiveRoles(authSession),
    effectivePermissions: resolveEffectivePermissions(authSession),
    permissionCatalog: Object.values(PERMISSION_KEYS),
    inviteFlowEnabled: false,
    passwordResetFlowEnabled: false
  };
}
