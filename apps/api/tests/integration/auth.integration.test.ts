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

  it("rejects malformed JSON login bodies with 400 INVALID_JSON", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .set("Content-Type", "application/json")
      .send("{not-json")
      .expect(400);

    assert.equal(response.body.ok, false);
    assert.equal(response.body.error?.code, "INVALID_JSON");
    assert.equal(JSON.stringify(response.body).includes("stack"), false);
  });
});

describe("API integration — login", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";

  if (!password) {
    it("protected login integration checks", { skip: "AUTH_SEED_TEST_PASSWORD unset" }, () => {});
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

    it("revokes active sessions after password change", async () => {
      const adminLogin = await request(app).post("/api/v1/auth/login").send({ email, password }).expect(200);
      const adminToken = adminLogin.body.data?.session?.token as string;
      assert.ok(adminToken);

      const stamp = Date.now();
      const tempEmail = `dast-pwchange-${stamp}@dca.local`;
      const create = await request(app)
        .post("/api/v1/auth/create-user")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ email: tempEmail, name: `DAST PW ${stamp}` })
        .expect((res) => {
          if (res.status !== 200 && res.status !== 201) {
            throw new Error(`create-user unexpected status ${res.status}`);
          }
        });

      const tempPassword = create.body.data?.tempPassword as string;
      assert.ok(tempPassword);

      const userLogin = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: tempEmail, password: tempPassword })
        .expect(200);
      const userToken = userLogin.body.data?.session?.token as string;
      assert.ok(userToken);

      const newPassword = `Changed-${stamp}-Aa1!`;
      await request(app)
        .post("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ oldPassword: tempPassword, newPassword })
        .expect(200);

      await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${userToken}`).expect(401);

      const relogin = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: tempEmail, password: newPassword })
        .expect(200);
      assert.ok(relogin.body.data?.session?.token);
    });
  }
});

after(() => {
  // Allow supertest/http servers to close cleanly in CI.
});
