import type { RequestContext } from "../types";
import type { PermissionKey } from "./permission-keys";

export function getPermissionSet(context: RequestContext): ReadonlySet<string> {
  if (context.actorType !== "USER") {
    return new Set<string>();
  }

  return new Set(context.permissions);
}

export function hasPermission(context: RequestContext, permissionKey: PermissionKey): boolean {
  return getPermissionSet(context).has(permissionKey);
}

export function requirePermissionForContext(
  context: RequestContext,
  permissionKey: PermissionKey
): { allowed: boolean; reason?: string } {
  if (hasPermission(context, permissionKey)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Missing required permission."
  };
}

export function denyByDefault(): false {
  return false;
}
