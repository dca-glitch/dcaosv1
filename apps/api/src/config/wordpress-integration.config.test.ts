import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  getWordPressIntegrationReadiness,
  WORDPRESS_INTEGRATION_ENV_KEYS
} from "../config/wordpress-integration.config";

const originalPublishEnabled = process.env[WORDPRESS_INTEGRATION_ENV_KEYS.publishEnabled];
const originalMasterKey = process.env[WORDPRESS_INTEGRATION_ENV_KEYS.credentialEncryptionMasterKey];

afterEach(() => {
  if (originalPublishEnabled === undefined) {
    delete process.env[WORDPRESS_INTEGRATION_ENV_KEYS.publishEnabled];
  } else {
    process.env[WORDPRESS_INTEGRATION_ENV_KEYS.publishEnabled] = originalPublishEnabled;
  }

  if (originalMasterKey === undefined) {
    delete process.env[WORDPRESS_INTEGRATION_ENV_KEYS.credentialEncryptionMasterKey];
  } else {
    process.env[WORDPRESS_INTEGRATION_ENV_KEYS.credentialEncryptionMasterKey] = originalMasterKey;
  }
});

describe("wordpress-integration.config (G300 readiness)", () => {
  it("reports disabled with livePublishDeferred when publish env is off", () => {
    delete process.env[WORDPRESS_INTEGRATION_ENV_KEYS.publishEnabled];
    delete process.env[WORDPRESS_INTEGRATION_ENV_KEYS.credentialEncryptionMasterKey];

    const readiness = getWordPressIntegrationReadiness();
    assert.equal(readiness.status, "disabled");
    assert.equal(readiness.publishEnabled, false);
    assert.equal(readiness.livePublishDeferred, true);
    assert.deepEqual(readiness.missingKeys, []);
  });

  it("reports missing_config when publish enabled without encryption key", () => {
    process.env[WORDPRESS_INTEGRATION_ENV_KEYS.publishEnabled] = "true";
    delete process.env[WORDPRESS_INTEGRATION_ENV_KEYS.credentialEncryptionMasterKey];

    const readiness = getWordPressIntegrationReadiness();
    assert.equal(readiness.status, "missing_config");
    assert.equal(readiness.livePublishDeferred, true);
    assert.deepEqual(readiness.missingKeys, [
      WORDPRESS_INTEGRATION_ENV_KEYS.credentialEncryptionMasterKey
    ]);
  });

  it("reports configured_shape_ok without authorizing live publish", () => {
    process.env[WORDPRESS_INTEGRATION_ENV_KEYS.publishEnabled] = "true";
    process.env[WORDPRESS_INTEGRATION_ENV_KEYS.credentialEncryptionMasterKey] = "test-key-presence-only";

    const readiness = getWordPressIntegrationReadiness();
    assert.equal(readiness.status, "configured_shape_ok");
    assert.equal(readiness.livePublishDeferred, true);
    assert.equal(JSON.stringify(readiness).includes("test-key-presence-only"), false);
  });
});
