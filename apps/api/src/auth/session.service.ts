import { createHash, createHmac, randomBytes } from "node:crypto";
import {
  AUTH_SESSION_COOKIE_NAME_DEFAULT,
  AUTH_SESSION_SAME_SITE_DEFAULT,
  AUTH_SESSION_SECURE_COOKIES_DEFAULT,
  AUTH_SESSION_TTL_MINUTES_DEFAULT,
  AUTH_SESSION_TOKEN_BYTES,
  AUTH_SESSION_TOKEN_HASH_ALGORITHM
} from "./auth.constants";
import type { SessionCookieConfig, SessionTokenResult } from "./types";

export function generateSessionToken(byteLength = AUTH_SESSION_TOKEN_BYTES): SessionTokenResult {
  return {
    token: randomBytes(byteLength).toString("base64url"),
    byteLength
  };
}

export function hashSessionToken(token: string, signingSecret?: string): string {
  if (signingSecret) {
    return createHmac("sha256", signingSecret).update(token, "utf8").digest("base64url");
  }

  return createHash(AUTH_SESSION_TOKEN_HASH_ALGORITHM).update(token, "utf8").digest("base64url");
}

export function getSessionCookieConfig(
  overrides: Partial<SessionCookieConfig> = {}
): SessionCookieConfig {
  return {
    cookieName: AUTH_SESSION_COOKIE_NAME_DEFAULT,
    httpOnly: true,
    secureInProduction: AUTH_SESSION_SECURE_COOKIES_DEFAULT,
    sameSite: AUTH_SESSION_SAME_SITE_DEFAULT,
    ttlMinutes: AUTH_SESSION_TTL_MINUTES_DEFAULT,
    path: "/",
    domain: undefined,
    ...overrides
  };
}
