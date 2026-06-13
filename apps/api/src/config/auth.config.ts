export type AuthMode = "disabled" | "skeleton" | "oidc-planned";

export interface AuthConfig {
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

const DEFAULT_AUTH_CONFIG: AuthConfig = {
  runtimeEnabled: false,
  mode: "skeleton",
  providerVendor: "unselected",
  callbackUrlPlaceholder: "https://placeholder.invalid/auth/callback",
  sessionCookieName: "dcaosv1_auth_session",
  productionSafetyNotes: [
    "Runtime auth remains disabled.",
    "Provider vendor choice is deferred.",
    "Callback URL is a placeholder only.",
    "Session cookie configuration is scaffold only."
  ]
};

function hasSuspiciousPlaceholder(value: string): boolean {
  return /localhost|127\.0\.0\.1|example\.com|example\.org|example\.net/i.test(value);
}

export function getAuthConfig(): AuthConfig {
  return {
    ...DEFAULT_AUTH_CONFIG,
    providerVendor: process.env.DCAOSV1_AUTH_PROVIDER_VENDOR ?? DEFAULT_AUTH_CONFIG.providerVendor,
    callbackUrlPlaceholder:
      process.env.DCAOSV1_AUTH_CALLBACK_URL_PLACEHOLDER ?? DEFAULT_AUTH_CONFIG.callbackUrlPlaceholder,
    sessionCookieName:
      process.env.DCAOSV1_AUTH_SESSION_COOKIE_NAME ?? DEFAULT_AUTH_CONFIG.sessionCookieName
  };
}

export function validateAuthConfigForSkeleton(config: AuthConfig): AuthConfigValidationResult {
  const issues: string[] = [];

  if (config.runtimeEnabled) {
    issues.push("Auth runtime must remain disabled in the Phase 10 skeleton.");
  }

  if (!config.providerVendor) {
    issues.push("Provider vendor placeholder is required.");
  }

  if (!config.callbackUrlPlaceholder) {
    issues.push("A callback URL placeholder should remain present for future planning.");
  } else if (hasSuspiciousPlaceholder(config.callbackUrlPlaceholder)) {
    issues.push("Callback URL placeholder should not point at a real host.");
  }

  if (!config.sessionCookieName) {
    issues.push("Session cookie name placeholder is required.");
  }

  return {
    ok: issues.length === 0,
    issues
  };
}
