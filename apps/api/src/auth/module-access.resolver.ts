import type { RequestContext } from "../types";
import type { ModuleAccessResolverResult } from "./types";

export function getModuleAccessResolverResult(
  context: RequestContext,
  moduleKey: string
): ModuleAccessResolverResult {
  if (context.actorType !== "USER") {
    return {
      state: "blocked",
      ok: false,
      moduleKey,
      message: "Module access resolver is blocked for non-user request contexts."
    };
  }

  if (!moduleKey) {
    return {
      state: "missing",
      ok: false,
      moduleKey,
      message: "Module access resolver requires a module key and remains skeleton-only."
    };
  }

  return {
    state: "allowed",
    ok: false,
    moduleKey,
    message: "Module access resolver remains skeleton-only and is not wired into enforcement."
  };
}

export function requireModuleAccessResolution(
  context: RequestContext,
  moduleKey: string
): ModuleAccessResolverResult {
  return getModuleAccessResolverResult(context, moduleKey);
}
