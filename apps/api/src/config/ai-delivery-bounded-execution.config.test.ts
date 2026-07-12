import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertBoundedStagingDatabaseGuard,
  assertBoundedStagingLiveExecutionGuards,
  type BoundedExecutionExactScope
} from "./ai-delivery-bounded-execution.config";

const scope: BoundedExecutionExactScope = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  clientId: "22222222-2222-4222-8222-222222222222",
  projectId: "33333333-3333-4333-8333-333333333333",
  contentDraftId: "44444444-4444-4444-8444-444444444444",
  publicationTargetId: "55555555-5555-4555-8555-555555555555",
  initiatingUserId: "66666666-6666-4666-8666-666666666666"
};

function liveEnv(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "staging",
    DCA_AI_DELIVERY_EXECUTION_TARGET: "staging",
    DCA_AI_DELIVERY_STAGING_WORDPRESS_HOST: "wp-staging.example.test",
    DATABASE_URL: "postgresql://user:pass@dcaosv1-staging-postgres:5432/dcaosv1_staging",
    IMAGE_GENERATION_ENABLED: "true",
    IMAGE_GENERATION_LIVE_CALLS_ALLOWED: "true",
    IMAGE_GENERATION_PROVIDER: "openai",
    IMAGE_GENERATION_API_KEY: "present",
    WORDPRESS_DRAFT_LIVE_ENABLED: "true",
    WORDPRESS_DRAFT_LIVE_CALLS_ALLOWED: "true",
    EMAIL_PROVIDER: "resend",
    EMAIL_LIVE_SEND_AUTHORIZED: "true",
    RESEND_API_KEY: "present",
    R2_ACCOUNT_ID: "present",
    R2_ACCESS_KEY_ID: "present",
    R2_SECRET_ACCESS_KEY: "present",
    R2_BUCKET_NAME: "present"
  };
}

describe("bounded execution staging guards", () => {
  it("accepts only the complete staging guard set", () => {
    assert.doesNotThrow(() =>
      assertBoundedStagingLiveExecutionGuards({
        env: liveEnv(),
        scope,
        wordpressSiteUrl: "https://wp-staging.example.test",
        retryCount: 0,
        fallbackUsed: false
      })
    );
  });

  it("rejects production and production-shaped databases", () => {
    assert.throws(
      () => assertBoundedStagingDatabaseGuard({ ...liveEnv(), NODE_ENV: "production" }),
      /production/
    );
    assert.throws(
      () =>
        assertBoundedStagingDatabaseGuard({
          ...liveEnv(),
          DATABASE_URL: "postgresql://user:pass@dcaosv1-postgres:5432/dcaosv1"
        }),
      /production-shaped|approved/
    );
  });

  it("rejects every missing live flag and wrong staging hostname", () => {
    for (const key of [
      "IMAGE_GENERATION_ENABLED",
      "IMAGE_GENERATION_LIVE_CALLS_ALLOWED",
      "WORDPRESS_DRAFT_LIVE_ENABLED",
      "WORDPRESS_DRAFT_LIVE_CALLS_ALLOWED",
      "EMAIL_LIVE_SEND_AUTHORIZED"
    ]) {
      const env = liveEnv();
      delete env[key];
      assert.throws(
        () =>
          assertBoundedStagingLiveExecutionGuards({
            env,
            scope,
            wordpressSiteUrl: "https://wp-staging.example.test",
            retryCount: 0,
            fallbackUsed: false
          }),
        new RegExp(key)
      );
    }
    assert.throws(
      () =>
        assertBoundedStagingLiveExecutionGuards({
          env: liveEnv(),
          scope,
          wordpressSiteUrl: "https://system.digitalcubeagency.net",
          retryCount: 0,
          fallbackUsed: false
        }),
      /production-shaped/
    );
    assert.throws(
      () =>
        assertBoundedStagingLiveExecutionGuards({
          env: { ...liveEnv(), WORDPRESS_PUBLISH_ENABLED: "true" },
          scope,
          wordpressSiteUrl: "https://wp-staging.example.test",
          retryCount: 0,
          fallbackUsed: false
        }),
      /WORDPRESS_PUBLISH_ENABLED/
    );
  });

  it("rejects missing or non-exact identifiers", () => {
    assert.throws(
      () =>
        assertBoundedStagingLiveExecutionGuards({
          env: liveEnv(),
          scope: { ...scope, clientId: "" },
          wordpressSiteUrl: "https://wp-staging.example.test",
          retryCount: 0,
          fallbackUsed: false
        }),
      /clientId/
    );
  });
});
