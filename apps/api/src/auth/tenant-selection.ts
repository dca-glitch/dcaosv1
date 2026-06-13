import type { RequestContext, TenantRequestContext } from "../types";
import type { TenantSelectionResult } from "./types";

export function hasTenantSelection(context: RequestContext): context is TenantRequestContext {
  return context.actorType === "USER" && Boolean(context.tenantId) && Boolean(context.tenantMembershipId);
}

export function getTenantSelectionResult(context: RequestContext): TenantSelectionResult {
  if (context.actorType !== "USER") {
    return {
      state: "missing",
      ok: false,
      message: "Tenant selection is not available for system-context requests."
    };
  }

  if (hasTenantSelection(context)) {
    return {
      state: "selected",
      ok: true,
      tenantId: context.tenantId,
      tenantMembershipId: context.tenantMembershipId,
      message: "Tenant selection context is present."
    };
  }

  return {
    state: "incomplete",
    ok: false,
    message: "Tenant selection context is incomplete."
  };
}

export function requireTenantSelection(context: RequestContext): TenantSelectionResult {
  return getTenantSelectionResult(context);
}
