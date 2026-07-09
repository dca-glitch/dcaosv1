import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

// Admin-only readiness/config routes intentionally expose boolean presence flags
// (e.g. "hasApiKey": false) — same convention as WordPress/GA readiness categories.
// The forbidden pattern below guards against actual secret/internal leakage, not
// the presence-boolean field names.
const FORBIDDEN_RESPONSE_FIELD_PATTERN = /storageKey|providerMetadata|"prompt"/i;

describe("API integration — image generation foundation (disabled-safe)", () => {
  it("blocks the foundation config route without auth", async () => {
    const response = await request(app).get("/api/v1/image-generation/foundation-config").expect(401);
    assert.equal(response.body.ok, false);
  });

  it("integrations readiness route lists image_generation without auth failing open", async () => {
    const response = await request(app).get("/api/v1/integrations/readiness").expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });
});

describe("API integration — image generation foundation (authenticated, optional)", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";

  if (!password) {
    it("authenticated image generation foundation checks", { skip: "AUTH_SEED_TEST_PASSWORD unset" }, () => {});
    return;
  }

  it("returns disabled-safe foundation config with no provider call and no secret leakage", async () => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    const token = login.body.data?.session?.token as string;
    assert.ok(token);

    const foundationResponse = await request(app)
      .get("/api/v1/image-generation/foundation-config")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(foundationResponse.body.ok, true);
    const foundation = foundationResponse.body.data?.foundation;
    assert.ok(foundation);
    assert.equal(foundation.disabledSafe, true);
    assert.equal(foundation.liveProviderCallsDeferred, true);
    assert.deepEqual(
      foundation.variantSlots.map((variant: { slot: string }) => variant.slot),
      ["hero", "supporting_1", "supporting_2", "social_preview"]
    );

    const serialized = JSON.stringify(foundationResponse.body);
    assert.doesNotMatch(serialized, FORBIDDEN_RESPONSE_FIELD_PATTERN);

    if (!process.env.IMAGE_GENERATION_ENABLED || process.env.IMAGE_GENERATION_ENABLED !== "true") {
      assert.equal(foundation.readiness.status, "disabled");
      assert.equal(foundation.readiness.generationEnabled, false);
    }

    const readinessResponse = await request(app)
      .get("/api/v1/integrations/readiness")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(readinessResponse.body.ok, true);
    const categories = readinessResponse.body.data?.readiness?.categories as Array<{ key: string; status: string }>;
    const imageGenerationCategory = categories.find((category) => category.key === "image_generation");
    assert.ok(imageGenerationCategory);
    assert.doesNotMatch(JSON.stringify(readinessResponse.body), FORBIDDEN_RESPONSE_FIELD_PATTERN);
  });
});
