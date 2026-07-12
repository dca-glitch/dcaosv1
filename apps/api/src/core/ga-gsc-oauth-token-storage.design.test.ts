import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertGaGscOauthTokenSecretFieldsNeverInSafeView,
  buildGaGscOauthStateDesign,
  buildGaGscOauthTokenStorageDesignRecord,
  GA_GSC_OAUTH_CALLBACK_DESIGN_VERSION,
  GA_GSC_OAUTH_TOKEN_READINESS_STATES,
  GA_GSC_OAUTH_REDIRECT_PATH_ALLOWLIST,
  GA_GSC_OAUTH_TOKEN_RECORD_SAFE_FIELDS,
  GA_GSC_OAUTH_TOKEN_RECORD_SECRET_FIELDS,
  GA_GSC_OAUTH_TOKEN_STORAGE_DESIGN_VERSION,
  getGaGscOauthCallbackDesign,
  getGaGscOauthTokenStorageDesignGaps,
  resolveGaGscOauthRedirectDesign,
  serializeGaGscOauthTokenStorageSafeView
} from "./ga-gsc-oauth-token-storage.design";

describe("ga-gsc-oauth-token-storage.design (G518)", () => {
  it("exposes design version and readiness states without schema claim", () => {
    assert.equal(GA_GSC_OAUTH_TOKEN_STORAGE_DESIGN_VERSION, "G518-2026-07-10");
    assert.ok(GA_GSC_OAUTH_TOKEN_READINESS_STATES.includes("needs_oauth"));
    assert.ok(GA_GSC_OAUTH_TOKEN_READINESS_STATES.includes("token_revoked"));

    const gaps = getGaGscOauthTokenStorageDesignGaps();
    assert.equal(gaps.consentCallbackRoute, false);
    assert.equal(gaps.prismaTokenModel, false);
    assert.equal(gaps.tokenRefreshLogic, false);
    assert.equal(gaps.encryptionAtRestWired, false);
    assert.equal(gaps.liveOAuthDeferred, true);
  });

  it("keeps secret field names out of safe field list", () => {
    for (const secret of GA_GSC_OAUTH_TOKEN_RECORD_SECRET_FIELDS) {
      assert.equal(GA_GSC_OAUTH_TOKEN_RECORD_SAFE_FIELDS.includes(secret as never), false);
    }
  });

  it("serializes safe view without ciphertext or schemaImplemented true", () => {
    const record = buildGaGscOauthTokenStorageDesignRecord({
      tenantId: "tenant-1",
      aiDeliveryProjectId: "project-1",
      googleAccountSubject: "subject-abc",
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
      refreshTokenPresent: true,
      lastSyncStatus: "configured_shape_ok"
    });

    assert.equal(record.liveOAuthDeferred, true);
    assert.equal(record.schemaImplemented, false);
    assert.equal(record.encryptionPlan, "aes-256-gcm-tenant-derived");

    const safe = serializeGaGscOauthTokenStorageSafeView(record);
    const serialized = JSON.stringify(safe);
    const leakCheck = assertGaGscOauthTokenSecretFieldsNeverInSafeView(serialized);
    assert.equal(leakCheck.ok, true);
    assert.equal(safe.secretFieldsSerialized, false);
    assert.equal(safe.schemaImplemented, false);
    assert.equal(safe.refreshTokenPresent, true);
    assert.equal(serialized.includes("ciphertext"), false);
  });

  it("defines callback/state/redirect design with deferred flags and no open redirects", () => {
    assert.equal(GA_GSC_OAUTH_CALLBACK_DESIGN_VERSION, "G518-callback-2026-07-12");

    const callback = getGaGscOauthCallbackDesign();
    assert.equal(callback.liveOAuthDeferred, true);
    assert.equal(callback.schemaImplemented, false);
    assert.equal(callback.consentCallbackRouteImplemented, false);
    assert.equal(callback.authorizationCodePersistence, "never_plaintext");
    assert.equal(callback.requiresStateValidation, true);

    const state = buildGaGscOauthStateDesign({
      tenantId: "tenant-1",
      aiDeliveryProjectId: "project-1",
      nonce: "csrf-nonce-abc",
      redirectPath: GA_GSC_OAUTH_REDIRECT_PATH_ALLOWLIST[0]
    });
    assert.equal(state.liveOAuthDeferred, true);
    assert.equal(state.schemaImplemented, false);
    assert.equal(JSON.stringify(state).includes("Bearer "), false);
    assert.equal(JSON.stringify(state).includes("client_secret"), false);

    const allowed = resolveGaGscOauthRedirectDesign("/#/integrations/ga-gsc");
    assert.equal(allowed.ok, true);
    assert.equal(allowed.liveOAuthDeferred, true);
    assert.equal(allowed.schemaImplemented, false);

    const rejected = resolveGaGscOauthRedirectDesign("https://evil.example/phish");
    assert.equal(rejected.ok, false);
    assert.equal(rejected.reason, "rejected_absolute_or_external");
  });
});
