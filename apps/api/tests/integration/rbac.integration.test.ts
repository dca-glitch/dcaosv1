import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

describe("API integration — RBAC boundaries", () => {
  it("blocks tenant authorization summary without auth", async () => {
    const response = await request(app)
      .get("/api/v1/tenants/current/authorization-summary")
      .expect(401);

    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });

  it("blocks tenant members listing without auth", async () => {
    const response = await request(app).get("/api/v1/tenants/current/members").expect(401);
    assert.equal(response.body.ok, false);
  });

  it("exposes public module catalog without auth", async () => {
    const response = await request(app).get("/api/v1/modules").expect(200);
    assert.equal(response.body.ok, true);
    assert.ok(Array.isArray(response.body.data?.modules));
  });
});

describe("API integration — authenticated RBAC (optional)", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";

  if (!password) {
    it("protected authenticated RBAC checks", { skip: "AUTH_SEED_TEST_PASSWORD unset" }, () => {});
    return;
  }

  it("allows owner/admin authorization summary after login", async () => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    const token = login.body.data?.session?.token as string;
    assert.ok(token);

    const summary = await request(app)
      .get("/api/v1/tenants/current/authorization-summary")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(summary.body.ok, true);
    assert.ok(Array.isArray(summary.body.data?.authorization?.effectivePermissions));
    assert.ok(summary.body.data.authorization.effectivePermissions.length > 0);
  });
});
