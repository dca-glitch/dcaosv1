export type ApiActorType = "USER" | "SYSTEM" | "AUTOMATION" | "API";

export interface AuthenticatedUserContext {
  requestId?: string;
  actorType: "USER";
  userId: string;
}

export interface ActiveTenantContext {
  tenantId: string;
  tenantMembershipId: string;
  roles: string[];
}

export interface PermissionContext {
  permissions: string[];
}

export interface SystemRequestContext {
  requestId?: string;
  actorType: Exclude<ApiActorType, "USER">;
  actorLabel?: string;
}

export interface TenantRequestContext
  extends AuthenticatedUserContext,
    ActiveTenantContext,
    PermissionContext {
  actorType: "USER";
}

export type RequestContext = TenantRequestContext | SystemRequestContext;
