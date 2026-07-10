import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  assessGaGscCredentialPresence,
  GA_GSC_CREDENTIAL_PRESENCE_FIELDS,
  GA_GSC_ENV_KEYS,
  GA_GSC_PROPERTY_MAPPING_FIELDS,
  GA_GSC_REQUIRED_CONFIG_SHAPE_KEYS,
  getGaGscConfigShape,
  getGaGscIntegrationReadiness,
  serializeGaGscCredentialPresenceSafe,
  validateGaGscPropertyMappingShape
} from "./ga-gsc.config";

const trackedKeys = Object.values(GA_GSC_ENV_KEYS);

function snapshotEnv() {
  const snapshot: Record<string, string | undefined> = {};
  for (const key of trackedKeys) {
    snapshot[key] = process.env[key];
  }
  return snapshot;
}

function restoreEnv(snapshot: Record<string, string | undefined>) {
  for (const key of trackedKeys) {
    const value = snapshot[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("ga-gsc.config", () => {
  const initialEnv = snapshotEnv();

  afterEach(() => {
    restoreEnv(initialEnv);
  });

  it("reports config shape without exposing OAuth values", () => {
    for (const key of trackedKeys) delete process.env[key];
    process.env[GA_GSC_ENV_KEYS.syncEnabled] = "true";
    process.env[GA_GSC_ENV_KEYS.oauthClientId] = "client-id-value";
    process.env[GA_GSC_ENV_KEYS.oauthClientSecret] = "client-secret-value";

    const shape = getGaGscConfigShape();
    const readiness = getGaGscIntegrationReadiness();
    const serialized = JSON.stringify({ shape, readiness });

    assert.deepEqual(shape.requiredKeys, GA_GSC_REQUIRED_CONFIG_SHAPE_KEYS);
    assert.equal(readiness.status, "configured_shape_ok");
    assert.equal(shape.liveOAuthDeferred, true);
    assert.equal(shape.liveSyncDeferred, true);
    assert.equal(serialized.includes("client-id-value"), false);
    assert.equal(serialized.includes("client-secret-value"), false);
  });

  it("keeps property mapping constants typed and secret-free", () => {
    assert.deepEqual(GA_GSC_PROPERTY_MAPPING_FIELDS, [
      "tenantId",
      "aiDeliveryProjectId",
      "clientDomain",
      "ga4PropertyId",
      "gscSiteUrl",
      "reportingTimezone"
    ]);
    assert.equal(GA_GSC_PROPERTY_MAPPING_FIELDS.some((field) => /token|secret|password/i.test(field)), false);

    const validation = validateGaGscPropertyMappingShape({
      tenantId: "tenant-1",
      aiDeliveryProjectId: "project-1",
      clientDomain: "example.com",
      ga4PropertyId: "properties/123",
      gscSiteUrl: "sc-domain:example.com",
      reportingTimezone: "Asia/Bangkok"
    });

    assert.equal(validation.ok, true);
    assert.equal(validation.secretFieldsAllowed, false);
  });

  it("identifies missing property mapping fields", () => {
    const validation = validateGaGscPropertyMappingShape({
      tenantId: "tenant-1",
      clientDomain: "example.com"
    });

    assert.equal(validation.ok, false);
    assert.ok(validation.missingFields.includes("ga4PropertyId"));
    assert.ok(validation.missingFields.includes("gscSiteUrl"));
  });

  it("G171: reports missing client id, secret, refresh, property, and GSC site", () => {
    const assessment = assessGaGscCredentialPresence({});
    assert.equal(assessment.configuredShapeOk, false);
    assert.deepEqual(assessment.missingFields, [...GA_GSC_CREDENTIAL_PRESENCE_FIELDS]);
    assert.equal(assessment.liveOAuthDeferred, true);
    assert.equal(assessment.liveSyncDeferred, true);

    const partial = assessGaGscCredentialPresence({
      oauthClientId: "id-only",
      oauthClientSecret: "secret-only"
    });
    assert.ok(partial.missingFields.includes("refreshToken"));
    assert.ok(partial.missingFields.includes("ga4PropertyId"));
    assert.ok(partial.missingFields.includes("gscSiteUrl"));
    assert.equal(partial.configuredShapeOk, false);
  });

  it("G171: full credential shape still keeps live OAuth/sync deferred", () => {
    const secrets = {
      oauthClientId: "oauth-client-id-secret-value",
      oauthClientSecret: "oauth-client-secret-value",
      refreshToken: "refresh-token-secret-value",
      ga4PropertyId: "properties/999",
      gscSiteUrl: "sc-domain:example.com"
    };

    const assessment = assessGaGscCredentialPresence(secrets);
    assert.equal(assessment.configuredShapeOk, true);
    assert.deepEqual(assessment.missingFields, []);
    assert.equal(assessment.liveOAuthDeferred, true);
    assert.equal(assessment.liveSyncDeferred, true);
    assert.equal(assessment.secretFieldsSerialized, false);

    const safe = serializeGaGscCredentialPresenceSafe(secrets);
    const serialized = JSON.stringify({ assessment, safe });
    assert.equal(serialized.includes("oauth-client-id-secret-value"), false);
    assert.equal(serialized.includes("oauth-client-secret-value"), false);
    assert.equal(serialized.includes("refresh-token-secret-value"), false);
    assert.equal(safe.oauthClientId, true);
    assert.equal(safe.refreshToken, true);
    assert.equal(safe.liveOAuthDeferred, true);
  });

  it("G171: readiness stays deferred when env shape is configured", () => {
    for (const key of trackedKeys) delete process.env[key];
    process.env[GA_GSC_ENV_KEYS.syncEnabled] = "true";
    process.env[GA_GSC_ENV_KEYS.oauthClientId] = "present-id";
    process.env[GA_GSC_ENV_KEYS.oauthClientSecret] = "present-secret";

    const readiness = getGaGscIntegrationReadiness();
    assert.equal(readiness.status, "configured_shape_ok");
    assert.equal(readiness.liveOAuthDeferred, true);
    assert.equal(readiness.liveSyncDeferred, true);
    assert.equal(JSON.stringify(readiness).includes("present-id"), false);
    assert.equal(JSON.stringify(readiness).includes("present-secret"), false);
  });
});
