import type { RequestContext, TenantRequestContext } from "../types";
import type { AuthMode } from "../config";

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
