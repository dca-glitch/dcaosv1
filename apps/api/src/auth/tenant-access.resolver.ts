import type { RequestContext, TenantRequestContext } from "../types";
import type { TenantAccessResolverResult } from "./types";
import { getTenantSelectionResult, hasTenantSelection } from "./tenant-selection";

export function hasTenantAccessContext(context: RequestContext): context is TenantRequestContext {
  return hasTenantSelection(context);
}

export function getTenantAccessResolution(context: RequestContext): TenantAccessResolverResult {
  if (context.actorType !== "USER") {
    return {
      state: "blocked",
      ok: false,
      message: "Tenant access resolver is blocked for non-user request contexts."
    };
  }

  const tenantSelection = getTenantSelectionResult(context);
  if (tenantSelection.ok) {
    return {
      state: "selected",
      ok: false,
      tenantId: tenantSelection.tenantId,
      tenantMembershipId: tenantSelection.tenantMembershipId,
      message: "Tenant access resolution remains skeleton-only and is not wired into route protection."
    };
  }

  return {
    state: "missing",
    ok: false,
    message: "Tenant access resolution requires selected tenant context and remains skeleton-only."
  };
}

export function requireTenantAccessResolution(context: RequestContext): TenantAccessResolverResult {
  return getTenantAccessResolution(context);
}
