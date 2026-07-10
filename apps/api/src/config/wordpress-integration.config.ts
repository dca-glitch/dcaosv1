export const WORDPRESS_INTEGRATION_ENV_KEYS = {
  publishEnabled: "WORDPRESS_PUBLISH_ENABLED",
  credentialEncryptionMasterKey: "CREDENTIAL_ENCRYPTION_MASTER_KEY"
} as const;

/**
 * G544 — config-level freeze label. Env shape never authorizes live HTTP/publish.
 * Service guard (`WORDPRESS_LIVE_HTTP_FROZEN`) remains the runtime no-fetch gate.
 */
export const WORDPRESS_INTEGRATION_LIVE_HTTP_DEFERRED = true as const;

export type WordPressIntegrationReadinessStatus = "disabled" | "missing_config" | "configured_shape_ok";

export interface WordPressIntegrationReadiness {
  status: WordPressIntegrationReadinessStatus;
  publishEnabled: boolean;
  hasCredentialEncryptionKey: boolean;
  missingKeys: string[];
  livePublishDeferred: true;
}

function readEnvPresent(key: string): boolean {
  const value = process.env[key]?.trim();
  return Boolean(value);
}

export function getWordPressIntegrationReadiness(): WordPressIntegrationReadiness {
  const publishEnabled = process.env[WORDPRESS_INTEGRATION_ENV_KEYS.publishEnabled] === "true";
  const hasCredentialEncryptionKey = readEnvPresent(WORDPRESS_INTEGRATION_ENV_KEYS.credentialEncryptionMasterKey);

  if (!publishEnabled) {
    return {
      status: "disabled",
      publishEnabled: false,
      hasCredentialEncryptionKey,
      missingKeys: [],
      livePublishDeferred: WORDPRESS_INTEGRATION_LIVE_HTTP_DEFERRED
    };
  }

  if (!hasCredentialEncryptionKey) {
    return {
      status: "missing_config",
      publishEnabled: true,
      hasCredentialEncryptionKey: false,
      missingKeys: [WORDPRESS_INTEGRATION_ENV_KEYS.credentialEncryptionMasterKey],
      livePublishDeferred: WORDPRESS_INTEGRATION_LIVE_HTTP_DEFERRED
    };
  }

  return {
    status: "configured_shape_ok",
    publishEnabled: true,
    hasCredentialEncryptionKey: true,
    missingKeys: [],
    livePublishDeferred: WORDPRESS_INTEGRATION_LIVE_HTTP_DEFERRED
  };
}
