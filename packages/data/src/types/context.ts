export type ActorType = "USER" | "SYSTEM" | "AUTOMATION" | "API";

export interface TenantContext {
  requestId?: string;
  actorType: "USER";
  userId: string;
  tenantId: string;
  tenantMembershipId: string;
  roles: string[];
  permissions: string[];
}

export interface SystemContext {
  requestId?: string;
  actorType: Exclude<ActorType, "USER">;
  actorLabel?: string;
}

export interface AuditWriteContext {
  requestId?: string;
  tenantId?: string;
  tenantMembershipId?: string;
  actorUserId?: string;
  actorType: ActorType;
}

export type RequestContext = TenantContext | SystemContext;
