import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../../src/app";
import { IMAGE_GENERATION_VARIANT_SLOTS } from "../../src/core/image-generation.execution";

const app = createApp();

function assertNoStorageKeyField(body: unknown, context: string) {
  const text = JSON.stringify(body);
  assert.equal(/"storageKey"/i.test(text), false, `storageKey leaked in ${context}: ${text}`);
}

describe("API integration — R2 storage boundary (unauthenticated)", () => {
  it("requires auth for deliverable download-reference", async () => {
    const response = await request(app)
      .get("/api/v1/ai-delivery-projects/not-a-real-project/deliverables/not-a-real-id/download-reference")
      .expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });

  it("requires auth for article-image download-reference", async () => {
    const response = await request(app)
      .get("/api/v1/ai-delivery-projects/not-a-real-project/article-images/not-a-real-id/download-reference")
      .expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });
});

describe("API integration — R2 storage boundary (authenticated, optional)", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";

  if (!password) {
    it("R2 storage boundary checks", { skip: "AUTH_SEED_TEST_PASSWORD unset" }, () => {});
    return;
  }

  it("image generation foundation exposes four variant slots without secrets", async () => {
    const login = await request(app).post("/api/v1/auth/login").send({ email, password }).expect(200);
    const token = login.body.data?.session?.token as string;
    assert.ok(token);

    const foundationResponse = await request(app)
      .get("/api/v1/image-generation/foundation-config")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const slots = foundationResponse.body.data?.foundation?.variantSlots?.map((row: { slot: string }) => row.slot);
    assert.deepEqual(slots, [...IMAGE_GENERATION_VARIANT_SLOTS]);
    assertNoStorageKeyField(foundationResponse.body, "image-generation foundation-config");
    assert.equal(foundationResponse.body.data?.foundation?.disabledSafe, true);
  });

  it("cross-tenant deliverable download-reference returns null reference for unknown id", async () => {
    const login = await request(app).post("/api/v1/auth/login").send({ email, password }).expect(200);
    const token = login.body.data?.session?.token as string;
    assert.ok(token);

    const response = await request(app)
      .get("/api/v1/ai-delivery-projects/00000000-0000-4000-8000-000000000099/deliverables/00000000-0000-4000-8000-000000000098/download-reference")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(response.body.data?.downloadReference, null);
    assertNoStorageKeyField(response.body, "unknown deliverable download-reference");
  });
});
