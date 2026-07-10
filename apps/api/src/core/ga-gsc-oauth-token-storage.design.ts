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
