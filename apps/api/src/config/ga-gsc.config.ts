export const GA_GSC_ENV_KEYS = {
  syncEnabled: "GA4_GSC_SYNC_ENABLED",
  oauthClientId: "GOOGLE_OAUTH_CLIENT_ID",
  oauthClientSecret: "GOOGLE_OAUTH_CLIENT_SECRET"
} as const;

export const GA_GSC_REQUIRED_CONFIG_SHAPE_KEYS = [
  GA_GSC_ENV_KEYS.syncEnabled,
  GA_GSC_ENV_KEYS.oauthClientId,
  GA_GSC_ENV_KEYS.oauthClientSecret
] as const;

export const GA_GSC_PROPERTY_MAPPING_FIELDS = [
  "tenantId",
  "aiDeliveryProjectId",
  "clientDomain",
  "ga4PropertyId",
  "gscSiteUrl",
  "reportingTimezone"
] as const;

/** Presence-only credential fields for live-path completeness checks. Values are never returned. */
export const GA_GSC_CREDENTIAL_PRESENCE_FIELDS = [
  "oauthClientId",
  "oauthClientSecret",
  "refreshToken",
  "ga4PropertyId",
  "gscSiteUrl"
] as const;

export type GaGscIntegrationReadinessStatus = "disabled" | "missing_config" | "configured_shape_ok";

export type GaGscPropertyMappingField = (typeof GA_GSC_PROPERTY_MAPPING_FIELDS)[number];

export type GaGscCredentialPresenceField = (typeof GA_GSC_CREDENTIAL_PRESENCE_FIELDS)[number];

export interface GaGscConfigShape {
  requiredKeys: readonly string[];
  presentKeys: string[];
  missingKeys: string[];
  hasOauthClientId: boolean;
  hasOauthClientSecret: boolean;
  syncEnabled: boolean;
  liveOAuthDeferred: true;
  liveSyncDeferred: true;
}

export interface GaGscIntegrationReadiness {
  status: GaGscIntegrationReadinessStatus;
  syncEnabled: boolean;
  hasOauthClientId: boolean;
  hasOauthClientSecret: boolean;
  missingKeys: string[];
  liveOAuthDeferred: true;
  liveSyncDeferred: true;
}

export interface GaGscCredentialPresenceInput {
  oauthClientId?: string | null;
  oauthClientSecret?: string | null;
  refreshToken?: string | null;
  ga4PropertyId?: string | null;
  gscSiteUrl?: string | null;
}

export interface GaGscCredentialPresenceAssessment {
  presentFields: GaGscCredentialPresenceField[];
  missingFields: GaGscCredentialPresenceField[];
  configuredShapeOk: boolean;
  liveOAuthDeferred: true;
  liveSyncDeferred: true;
  secretFieldsSerialized: false;
}

function readEnvPresent(key: string): boolean {
  const value = process.env[key]?.trim();
  return Boolean(value);
}

function isNonEmptyString(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function getGaGscConfigShape(): GaGscConfigShape {
  const syncEnabled = process.env[GA_GSC_ENV_KEYS.syncEnabled] === "true";
  const hasOauthClientId = readEnvPresent(GA_GSC_ENV_KEYS.oauthClientId);
  const hasOauthClientSecret = readEnvPresent(GA_GSC_ENV_KEYS.oauthClientSecret);
  const presentKeys = GA_GSC_REQUIRED_CONFIG_SHAPE_KEYS.filter((key) => {
    if (key === GA_GSC_ENV_KEYS.syncEnabled) return syncEnabled;
    return readEnvPresent(key);
  });

  return {
    requiredKeys: GA_GSC_REQUIRED_CONFIG_SHAPE_KEYS,
    presentKeys,
    missingKeys: GA_GSC_REQUIRED_CONFIG_SHAPE_KEYS.filter((key) => !presentKeys.includes(key)),
    hasOauthClientId,
    hasOauthClientSecret,
    syncEnabled,
    liveOAuthDeferred: true,
    liveSyncDeferred: true
  };
}

export function validateGaGscPropertyMappingShape(
  mapping: Partial<Record<GaGscPropertyMappingField, string | null | undefined>>
): { ok: boolean; missingFields: GaGscPropertyMappingField[]; secretFieldsAllowed: false } {
  const missingFields = GA_GSC_PROPERTY_MAPPING_FIELDS.filter((field) => {
    const value = mapping[field];
    return typeof value !== "string" || value.trim().length === 0;
  });

  return {
    ok: missingFields.length === 0,
    missingFields,
    secretFieldsAllowed: false
  };
}

/**
 * Presence-only completeness for live-path prerequisites (client id/secret/refresh/property/GSC site).
 * Never returns secret values. Live OAuth/sync remain deferred even when shape is complete.
 */
export function assessGaGscCredentialPresence(
  input: GaGscCredentialPresenceInput
): GaGscCredentialPresenceAssessment {
  const presentFields = GA_GSC_CREDENTIAL_PRESENCE_FIELDS.filter((field) =>
    isNonEmptyString(input[field])
  );
  const missingFields = GA_GSC_CREDENTIAL_PRESENCE_FIELDS.filter(
    (field) => !presentFields.includes(field)
  );

  return {
    presentFields,
    missingFields,
    configuredShapeOk: missingFields.length === 0,
    liveOAuthDeferred: true,
    liveSyncDeferred: true,
    secretFieldsSerialized: false
  };
}

/** Safe JSON view of credential presence — booleans only, never secret values. */
export function serializeGaGscCredentialPresenceSafe(
  input: GaGscCredentialPresenceInput
): Record<GaGscCredentialPresenceField, boolean> & {
  liveOAuthDeferred: true;
  liveSyncDeferred: true;
} {
  return {
    oauthClientId: isNonEmptyString(input.oauthClientId),
    oauthClientSecret: isNonEmptyString(input.oauthClientSecret),
    refreshToken: isNonEmptyString(input.refreshToken),
    ga4PropertyId: isNonEmptyString(input.ga4PropertyId),
    gscSiteUrl: isNonEmptyString(input.gscSiteUrl),
    liveOAuthDeferred: true,
    liveSyncDeferred: true
  };
}

export function getGaGscIntegrationReadiness(): GaGscIntegrationReadiness {
  const shape = getGaGscConfigShape();
  const { syncEnabled, hasOauthClientId, hasOauthClientSecret } = shape;

  if (!syncEnabled) {
    return {
      status: "disabled",
      syncEnabled: false,
      hasOauthClientId,
      hasOauthClientSecret,
      missingKeys: [],
      liveOAuthDeferred: true,
      liveSyncDeferred: true
    };
  }

  const missingKeys: string[] = [];
  if (!hasOauthClientId) {
    missingKeys.push(GA_GSC_ENV_KEYS.oauthClientId);
  }
  if (!hasOauthClientSecret) {
    missingKeys.push(GA_GSC_ENV_KEYS.oauthClientSecret);
  }

  if (missingKeys.length > 0) {
    return {
      status: "missing_config",
      syncEnabled: true,
      hasOauthClientId,
      hasOauthClientSecret,
      missingKeys,
      liveOAuthDeferred: true,
      liveSyncDeferred: true
    };
  }

  return {
    status: "configured_shape_ok",
    syncEnabled: true,
    hasOauthClientId: true,
    hasOauthClientSecret: true,
    missingKeys: [],
    liveOAuthDeferred: true,
    liveSyncDeferred: true
  };
}
