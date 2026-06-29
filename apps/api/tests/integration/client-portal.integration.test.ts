import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

describe("API integration — client portal (Puriva) boundaries", () => {
  it("requires auth for portal project listing", async () => {
    const response = await request(app).get("/api/v1/client-portal/projects").expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });

  it("requires auth for pending approvals", async () => {
    const response = await request(app).get("/api/v1/client-portal/pending-approvals").expect(401);
    assert.equal(response.body.ok, false);
  });

  it("does not leak sensitive fields in 401 responses", async () => {
    const response = await request(app).get("/api/v1/client-portal/projects");
    const text = JSON.stringify(response.body);
    assert.equal(/passwordHash|sessionTokenHash|storageKey/i.test(text), false);
  });
});

describe("API integration — data isolation (optional)", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";

  if (!password) {
    it("skips tenant-scoped portal checks when AUTH_SEED_TEST_PASSWORD is unset", () => {
      assert.ok(true);
    });
    return;
  }

  it("returns tenant-scoped portal projects for authenticated admin", async () => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    const token = login.body.data?.session?.token as string;
    const response = await request(app)
      .get("/api/v1/client-portal/projects")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(response.body.ok, true);
    assert.ok(Array.isArray(response.body.data?.aiDeliveryProjects));
    assert.equal(/storageKey/i.test(JSON.stringify(response.body)), false);
  });

  it("rejects forged tenant route without membership context", async () => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    const token = login.body.data?.session?.token as string;
    const response = await request(app)
      .get("/api/v1/client-portal/projects/not-a-real-project-id")
      .set("Authorization", `Bearer ${token}`);

    assert.ok([403, 404].includes(response.status));
  });
});
