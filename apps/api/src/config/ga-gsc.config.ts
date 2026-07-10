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

export type GaGscIntegrationReadinessStatus = "disabled" | "missing_config" | "configured_shape_ok";

export type GaGscPropertyMappingField = (typeof GA_GSC_PROPERTY_MAPPING_FIELDS)[number];

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

function readEnvPresent(key: string): boolean {
  const value = process.env[key]?.trim();
  return Boolean(value);
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
