import type { RequestContext } from "../types";
import type { PermissionResolverResult } from "./types";

export function getPermissionResolverResult(
  context: RequestContext,
  permissionKey: string
): PermissionResolverResult {
  if (context.actorType !== "USER") {
    return {
      state: "blocked",
      ok: false,
      permissionKey,
      message: "Permission resolver is blocked for non-user request contexts."
    };
  }

  if (!permissionKey) {
    return {
      state: "missing",
      ok: false,
      permissionKey,
      message: "Permission resolver requires a permission key and remains skeleton-only."
    };
  }

  return {
    state: "allowed",
    ok: false,
    permissionKey,
    message: "Permission resolver remains skeleton-only and is not wired into enforcement."
  };
}

export function requirePermissionResolution(
  context: RequestContext,
  permissionKey: string
): PermissionResolverResult {
  return getPermissionResolverResult(context, permissionKey);
}
