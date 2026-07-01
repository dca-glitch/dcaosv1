import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

describe("API integration — auth boundaries", () => {
  it("returns 401 for unauthenticated client portal access", async () => {
    const response = await request(app).get("/api/v1/client-portal/projects").expect(401);
    assert.equal(response.body.ok, false);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });

  it("returns 401 for invalid bearer token on protected route", async () => {
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer invalid-token-value")
      .expect(401);

    assert.equal(response.body.ok, false);
  });

  it("returns 404 for unknown API routes", async () => {
    const response = await request(app).get("/api/v1/this-route-does-not-exist").expect(404);
    assert.equal(response.body.ok, false);
    assert.equal(response.body.error?.code, "NOT_FOUND");
  });
});

describe("API integration — login", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";

  if (!password) {
    it("skips login integration when AUTH_SEED_TEST_PASSWORD is unset", () => {
      assert.ok(true, "skipped — set AUTH_SEED_TEST_PASSWORD for live login tests");
    });
  } else {
    it("rejects invalid credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email, password: "definitely-wrong-password" })
        .expect(401);

      assert.equal(response.body.ok, false);
    });

    it("accepts valid admin credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email, password })
        .expect(200);

      assert.equal(response.body.ok, true);
      assert.ok(response.body.data?.session?.token);
      assert.ok(!/passwordHash|sessionTokenHash/i.test(JSON.stringify(response.body)));
    });
  }
});

after(() => {
  // Allow supertest/http servers to close cleanly in CI.
});
