import type { AuthConfig } from "../config";
import type { SessionOptionConfig } from "./types";

export function getSessionOptionConfig(authConfig: AuthConfig): SessionOptionConfig {
  return {
    cookieName: authConfig.sessionCookieName,
    httpOnly: true,
    secureInProduction: true,
    sameSite: "lax",
    maxAgeSeconds: 60 * 60 * 8,
    path: "/",
    domain: undefined,
    storeType: "deferred",
    runtimeEnabled: false
  };
}

export function validateSessionOptionConfigForSkeleton(
  config: SessionOptionConfig
): { ok: boolean; issues: string[] } {
  const issues: string[] = [];

  if (config.runtimeEnabled) {
    issues.push("Session runtime must remain disabled in the Phase 10 skeleton.");
  }

  if (!config.cookieName) {
    issues.push("Session cookie name is required for the skeleton configuration.");
  }

  if (config.domain) {
    issues.push("Session domain should remain unset until the production cookie domain is approved.");
  }

  if (config.storeType !== "deferred") {
    issues.push("Session store remains deferred until a later gate.");
  }

  return {
    ok: issues.length === 0,
    issues
  };
}
