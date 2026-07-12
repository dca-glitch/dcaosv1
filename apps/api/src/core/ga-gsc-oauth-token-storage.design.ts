/**
 * G518 — OAuth token storage DESIGN contracts only.
 * No Prisma schema, no persistence, no live Google, no token I/O.
 * Future implementation must reuse credential-encryption AES-256-GCM patterns.
 */

export const GA_GSC_OAUTH_TOKEN_STORAGE_DESIGN_VERSION = "G518-2026-07-10" as const;

/** Planned readiness states beyond today's env-shape ceiling. */
export const GA_GSC_OAUTH_TOKEN_READINESS_STATES = [
  "disabled",
  "missing_config",
  "configured_shape_ok",
  "needs_oauth",
  "token_valid",
  "token_expired",
  "token_revoked",
  "sync_failed"
] as const;

export type GaGscOauthTokenReadinessState = (typeof GA_GSC_OAUTH_TOKEN_READINESS_STATES)[number];

/** Non-secret fields a future token row would expose to admin/readiness only. */
export const GA_GSC_OAUTH_TOKEN_RECORD_SAFE_FIELDS = [
  "tenantId",
  "aiDeliveryProjectId",
  "googleAccountSubject",
  "scopes",
  "accessTokenExpiresAt",
  "refreshTokenPresent",
  "revokedAt",
  "lastRefreshAt",
  "lastSyncStatus"
] as const;

/** Secret / ciphertext fields — never returned by API or logged. */
export const GA_GSC_OAUTH_TOKEN_RECORD_SECRET_FIELDS = [
  "accessTokenCiphertext",
  "refreshTokenCiphertext",
  "iv",
  "authTag",
  "authorizationCode"
] as const;

export type GaGscOauthTokenRecordSafeField = (typeof GA_GSC_OAUTH_TOKEN_RECORD_SAFE_FIELDS)[number];
export type GaGscOauthTokenRecordSecretField = (typeof GA_GSC_OAUTH_TOKEN_RECORD_SECRET_FIELDS)[number];

/**
 * Design-only shape for a future encrypted OAuth token record.
 * Values for secret fields are presence booleans in safe views — never plaintext.
 */
export interface GaGscOauthTokenStorageDesignRecord {
  tenantId: string;
  aiDeliveryProjectId: string;
  googleAccountSubject: string | null;
  scopes: string[];
  accessTokenExpiresAt: string | null;
  refreshTokenPresent: boolean;
  revokedAt: string | null;
  lastRefreshAt: string | null;
  lastSyncStatus: GaGscOauthTokenReadinessState | null;
  /** Always true in design — live OAuth remains deferred until owner-approved block. */
  liveOAuthDeferred: true;
  /** Schema/migration not created in this lane. */
  schemaImplemented: false;
  /** Encryption must reuse credential-encryption AES-256-GCM + tenant-derived key. */
  encryptionPlan: "aes-256-gcm-tenant-derived";
}

export interface GaGscOauthTokenStorageDesignGaps {
  consentCallbackRoute: false;
  prismaTokenModel: false;
  tokenRefreshLogic: false;
  encryptionAtRestWired: false;
  googleConsentScreenDocumented: false;
  liveOAuthDeferred: true;
}

export interface GaGscOauthTokenSafeView {
  tenantId: string;
  aiDeliveryProjectId: string;
  googleAccountSubject: string | null;
  scopes: string[];
  accessTokenExpiresAt: string | null;
  refreshTokenPresent: boolean;
  revokedAt: string | null;
  lastRefreshAt: string | null;
  lastSyncStatus: GaGscOauthTokenReadinessState | null;
  liveOAuthDeferred: true;
  schemaImplemented: false;
  secretFieldsSerialized: false;
}

export function getGaGscOauthTokenStorageDesignGaps(): GaGscOauthTokenStorageDesignGaps {
  return {
    consentCallbackRoute: false,
    prismaTokenModel: false,
    tokenRefreshLogic: false,
    encryptionAtRestWired: false,
    googleConsentScreenDocumented: false,
    liveOAuthDeferred: true
  };
}

/** Build a design record with deferred/schema flags forced — no secrets accepted. */
export function buildGaGscOauthTokenStorageDesignRecord(input: {
  tenantId: string;
  aiDeliveryProjectId: string;
  googleAccountSubject?: string | null;
  scopes?: string[];
  accessTokenExpiresAt?: string | null;
  refreshTokenPresent?: boolean;
  revokedAt?: string | null;
  lastRefreshAt?: string | null;
  lastSyncStatus?: GaGscOauthTokenReadinessState | null;
}): GaGscOauthTokenStorageDesignRecord {
  return {
    tenantId: input.tenantId.trim(),
    aiDeliveryProjectId: input.aiDeliveryProjectId.trim(),
    googleAccountSubject: input.googleAccountSubject?.trim() || null,
    scopes: [...(input.scopes ?? [])],
    accessTokenExpiresAt: input.accessTokenExpiresAt ?? null,
    refreshTokenPresent: input.refreshTokenPresent === true,
    revokedAt: input.revokedAt ?? null,
    lastRefreshAt: input.lastRefreshAt ?? null,
    lastSyncStatus: input.lastSyncStatus ?? null,
    liveOAuthDeferred: true,
    schemaImplemented: false,
    encryptionPlan: "aes-256-gcm-tenant-derived"
  };
}

/** Safe JSON view — never includes ciphertext, IV, authTag, or token plaintext. */
export function serializeGaGscOauthTokenStorageSafeView(
  record: GaGscOauthTokenStorageDesignRecord
): GaGscOauthTokenSafeView {
  return {
    tenantId: record.tenantId,
    aiDeliveryProjectId: record.aiDeliveryProjectId,
    googleAccountSubject: record.googleAccountSubject,
    scopes: [...record.scopes],
    accessTokenExpiresAt: record.accessTokenExpiresAt,
    refreshTokenPresent: record.refreshTokenPresent,
    revokedAt: record.revokedAt,
    lastRefreshAt: record.lastRefreshAt,
    lastSyncStatus: record.lastSyncStatus,
    liveOAuthDeferred: true,
    schemaImplemented: false,
    secretFieldsSerialized: false
  };
}

export function assertGaGscOauthTokenSecretFieldsNeverInSafeView(
  serialized: string
): { ok: boolean; leakedHints: string[] } {
  const hints = [
    "accessTokenCiphertext",
    "refreshTokenCiphertext",
    "authorizationCode",
    "client_secret",
    "Bearer "
  ];
  const leakedHints = hints.filter((hint) => serialized.includes(hint));
  return { ok: leakedHints.length === 0, leakedHints };
}

/**
 * G518 extension — OAuth state / callback / redirect DESIGN only.
 * No consent route, no token exchange, no schema, no live Google.
 */

export const GA_GSC_OAUTH_CALLBACK_DESIGN_VERSION = "G518-callback-2026-07-12" as const;

/** Allowed relative admin redirect paths after a future callback (design allowlist). */
export const GA_GSC_OAUTH_REDIRECT_PATH_ALLOWLIST = [
  "/#/integrations/ga-gsc",
  "/#/ai-delivery/monthly-reports",
  "/#/settings/integrations"
] as const;

export type GaGscOauthRedirectPath = (typeof GA_GSC_OAUTH_REDIRECT_PATH_ALLOWLIST)[number];

/**
 * Opaque CSRF/state payload shape for a future consent start.
 * Never embeds access/refresh tokens or client secrets.
 */
export interface GaGscOauthStateDesign {
  version: typeof GA_GSC_OAUTH_CALLBACK_DESIGN_VERSION;
  tenantId: string;
  aiDeliveryProjectId: string;
  /** Opaque CSRF nonce — not a Google token. */
  nonce: string;
  issuedAtIso: string;
  redirectPath: GaGscOauthRedirectPath;
  liveOAuthDeferred: true;
  schemaImplemented: false;
}

export interface GaGscOauthCallbackDesign {
  version: typeof GA_GSC_OAUTH_CALLBACK_DESIGN_VERSION;
  /** Future route path only — not registered in this lane. */
  plannedCallbackPath: "/api/v1/integrations/ga-gsc/oauth/callback";
  /** State must be validated before any code exchange (future). */
  requiresStateValidation: true;
  /** Authorization code is ephemeral and must never be persisted plaintext. */
  authorizationCodePersistence: "never_plaintext";
  /** Redirect after success/failure must stay on allowlisted relative paths. */
  redirectAllowlist: typeof GA_GSC_OAUTH_REDIRECT_PATH_ALLOWLIST;
  liveOAuthDeferred: true;
  schemaImplemented: false;
  consentCallbackRouteImplemented: false;
}

export interface GaGscOauthRedirectDesignResult {
  ok: boolean;
  redirectPath: GaGscOauthRedirectPath | null;
  reason: "allowlisted" | "rejected_absolute_or_external" | "rejected_not_allowlisted";
  liveOAuthDeferred: true;
  schemaImplemented: false;
}

function isAllowlistedRedirectPath(value: string): value is GaGscOauthRedirectPath {
  return (GA_GSC_OAUTH_REDIRECT_PATH_ALLOWLIST as readonly string[]).includes(value);
}

/** Build opaque OAuth state design record — rejects secret-like fields by omission. */
export function buildGaGscOauthStateDesign(input: {
  tenantId: string;
  aiDeliveryProjectId: string;
  nonce: string;
  issuedAtIso?: string;
  redirectPath?: string;
}): GaGscOauthStateDesign {
  const redirectPath = input.redirectPath?.trim() || GA_GSC_OAUTH_REDIRECT_PATH_ALLOWLIST[0];
  if (!isAllowlistedRedirectPath(redirectPath)) {
    throw new Error("GA/GSC OAuth state redirectPath must be an allowlisted relative admin path.");
  }
  return {
    version: GA_GSC_OAUTH_CALLBACK_DESIGN_VERSION,
    tenantId: input.tenantId.trim(),
    aiDeliveryProjectId: input.aiDeliveryProjectId.trim(),
    nonce: input.nonce.trim(),
    issuedAtIso: input.issuedAtIso ?? new Date(0).toISOString(),
    redirectPath,
    liveOAuthDeferred: true,
    schemaImplemented: false
  };
}

/** Static callback design contract — route not implemented. */
export function getGaGscOauthCallbackDesign(): GaGscOauthCallbackDesign {
  return {
    version: GA_GSC_OAUTH_CALLBACK_DESIGN_VERSION,
    plannedCallbackPath: "/api/v1/integrations/ga-gsc/oauth/callback",
    requiresStateValidation: true,
    authorizationCodePersistence: "never_plaintext",
    redirectAllowlist: GA_GSC_OAUTH_REDIRECT_PATH_ALLOWLIST,
    liveOAuthDeferred: true,
    schemaImplemented: false,
    consentCallbackRouteImplemented: false
  };
}

/**
 * Resolve a post-callback redirect path against the allowlist.
 * Rejects absolute URLs and open redirects (design helper only).
 */
export function resolveGaGscOauthRedirectDesign(candidatePath: string): GaGscOauthRedirectDesignResult {
  const trimmed = candidatePath.trim();
  if (
    !trimmed.startsWith("/#/") ||
    trimmed.includes("://") ||
    trimmed.includes("\\") ||
    trimmed.includes("\n")
  ) {
    return {
      ok: false,
      redirectPath: null,
      reason: "rejected_absolute_or_external",
      liveOAuthDeferred: true,
      schemaImplemented: false
    };
  }
  if (!isAllowlistedRedirectPath(trimmed)) {
    return {
      ok: false,
      redirectPath: null,
      reason: "rejected_not_allowlisted",
      liveOAuthDeferred: true,
      schemaImplemented: false
    };
  }
  return {
    ok: true,
    redirectPath: trimmed,
    reason: "allowlisted",
    liveOAuthDeferred: true,
    schemaImplemented: false
  };
}
