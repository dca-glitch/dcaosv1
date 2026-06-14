import type { RequestContext, TenantRequestContext } from "../types";
import type { AuthMode } from "../config";
import type { PermissionKey } from "../security/permission-keys";

export type SessionStoreType = "deferred" | "database" | "redis" | "encrypted-cookie";

export interface SessionOptionConfig {
  cookieName: string;
  httpOnly: boolean;
  secureInProduction: boolean;
  sameSite: "lax" | "strict" | "none";
  maxAgeSeconds: number;
  path: string;
  domain?: string;
  storeType: SessionStoreType;
  runtimeEnabled: false;
}

export interface AuthProviderStatus {
  mode: AuthMode;
  providerVendor: string;
  ready: boolean;
  message: string;
}

export interface AuthProviderProfile {
  providerVendor: string;
  providerSubject: string;
  email?: string;
  displayName?: string;
}

export interface AuthStartRequest {
  returnTo?: string;
}

export interface AuthStartResult {
  mode: AuthMode;
  ok: boolean;
  message: string;
  redirectUrl?: string;
}

export interface AuthLoginRequest {
  email?: string;
  password?: string;
  turnstileToken?: string;
}

export interface AuthTenantMembershipSummary {
  tenantId: string;
  tenantMembershipId: string;
  roles: string[];
}

export interface AuthLoginSessionSummary {
  token: string;
  expiresAt: string;
  ttlMinutes: number;
}

export interface AuthLoginUserSummary {
  id: string;
  email: string;
  name?: string | null;
  status: string;
  forcePasswordChange: boolean;
  lastLoginAt?: string | null;
}

export interface AuthLoginResponse {
  user: AuthLoginUserSummary;
  session: AuthLoginSessionSummary;
  tenantContext: {
    activeMembership: AuthTenantMembershipSummary | null;
    memberships: AuthTenantMembershipSummary[];
  };
}

export interface AuthCurrentSessionSummary {
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string | null;
  revokedAt: string | null;
}

export interface AuthCurrentUserResponse {
  user: AuthLoginUserSummary;
  session: AuthCurrentSessionSummary;
  tenantContext: {
    activeMembership: AuthTenantMembershipSummary | null;
    memberships: AuthTenantMembershipSummary[];
  };
}

export interface AuthAuthorizationTenantContext {
  activeTenant: {
    tenantId: string;
    tenantMembershipId: string;
  } | null;
  activeMembership: AuthTenantMembershipSummary | null;
  memberships: AuthTenantMembershipSummary[];
  roles: string[];
}

export interface AuthAuthorizationContextResponse {
  user: AuthLoginUserSummary;
  tenantContext: AuthAuthorizationTenantContext;
  effectivePermissions: PermissionKey[];
}

export interface AuthLogoutResponse {
  loggedOut: true;
  revokedAt: string;
}

export interface AuthResolvedSessionContext {
  user: AuthLoginUserSummary;
  session: {
    id: string;
    createdAt: Date;
    expiresAt: Date;
    lastSeenAt: Date | null;
  };
  tenantContext: {
    activeMembership: AuthTenantMembershipSummary | null;
    memberships: AuthTenantMembershipSummary[];
  };
}

export interface AuthSessionLocals {
  authSession?: AuthResolvedSessionContext;
}

export interface AuthCallbackRequest {
  code?: string;
  state?: string;
}

export interface AuthCallbackResult {
  ok: boolean;
  message: string;
  profile?: AuthProviderProfile;
}

export type TenantSelectionState = "selected" | "missing" | "incomplete";

export interface TenantSelectionResult {
  state: TenantSelectionState;
  ok: boolean;
  tenantId?: string;
  tenantMembershipId?: string;
  message: string;
}

export type TenantAccessResolverState = "selected" | "missing" | "blocked";

export interface TenantAccessResolverResult {
  state: TenantAccessResolverState;
  ok: false;
  tenantId?: string;
  tenantMembershipId?: string;
  message: string;
}

export type AuthContextResolutionState = "attached" | "missing" | "blocked";

export interface AuthContextResolutionResult {
  state: AuthContextResolutionState;
  ok: false;
  requestContext: RequestContext;
  tenantContext?: TenantRequestContext;
  message: string;
}

export type PermissionResolverState = "allowed" | "missing" | "blocked";

export interface PermissionResolverResult {
  state: PermissionResolverState;
  ok: false;
  permissionKey: string;
  message: string;
}

export type ModuleAccessResolverState = "allowed" | "missing" | "blocked";

export interface ModuleAccessResolverResult {
  state: ModuleAccessResolverState;
  ok: false;
  moduleKey: string;
  message: string;
}

export interface AuthConfigSnapshot {
  runtimeEnabled: false;
  mode: AuthMode;
  providerVendor: string;
  callbackUrlPlaceholder: string;
  sessionCookieName: string;
  productionSafetyNotes: string[];
}

export interface AuthConfigValidationResult {
  ok: boolean;
  issues: string[];
}

export interface AuthContextEnvelope {
  requestContext: RequestContext;
  tenantContext?: TenantRequestContext;
}

export interface PasswordPolicyConfig {
  minLength: number;
}

export interface PasswordPolicyValidationResult {
  ok: boolean;
  issues: string[];
}

export interface SessionCookieConfig {
  cookieName: string;
  httpOnly: true;
  secureInProduction: boolean;
  sameSite: "lax" | "strict";
  ttlMinutes: number;
  path: "/";
  domain?: string;
}

export interface SessionTokenResult {
  token: string;
  byteLength: number;
}

export interface SessionPersistenceInput {
  token: string;
  userId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionPersistenceRecord {
  id: string;
  userId: string;
  sessionTokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
  lastSeenAt?: Date | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface SessionPersistenceBoundaryResult {
  ok: false;
  code: "SESSION_DB_RUNTIME_BLOCKED";
  message: string;
}
