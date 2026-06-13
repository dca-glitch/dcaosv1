export interface TenantContext {
  requestId: string;
  userId: string;
  activeTenantId: string;
  membershipId: string;
  roles: string[];
  permissions: string[];
}

export interface SystemContext {
  requestId: string;
  actorType: "SYSTEM" | "AUTOMATION" | "API";
  actorLabel?: string;
}

export interface AuditWriteContext {
  requestId: string;
  tenantId?: string;
  actorUserId?: string;
  actorType: "USER" | "SYSTEM" | "AUTOMATION" | "API";
}

export type RequestContext = TenantContext | SystemContext;
