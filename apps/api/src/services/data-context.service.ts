import type { RequestContext, SystemRequestContext, TenantRequestContext } from "../types";

export interface DataRequestContext {
  actorType: RequestContext["actorType"];
  requestId?: string;
  tenantId?: string;
  tenantMembershipId?: string;
  userId?: string;
  actorLabel?: string;
  roles: string[];
  permissions: string[];
}

export function toDataRequestContext(context: RequestContext): DataRequestContext {
  if (context.actorType !== "USER") {
    const systemContext = context as SystemRequestContext;
    return {
      actorType: systemContext.actorType,
      requestId: systemContext.requestId,
      actorLabel: systemContext.actorLabel,
      roles: [],
      permissions: []
    };
  }

  const tenantContext = context as TenantRequestContext;
  return {
    actorType: tenantContext.actorType,
    requestId: tenantContext.requestId,
    tenantId: tenantContext.tenantId,
    tenantMembershipId: tenantContext.tenantMembershipId,
    userId: tenantContext.userId,
    roles: tenantContext.roles,
    permissions: tenantContext.permissions
  };
}

export function isTenantDataContext(context: RequestContext): context is TenantRequestContext {
  return context.actorType === "USER";
}
