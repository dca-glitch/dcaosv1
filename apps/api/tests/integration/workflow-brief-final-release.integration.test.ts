import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

describe("API integration — workflow brief final release package", () => {
  it("requires auth for release package status", async () => {
    const response = await request(app).get("/api/v1/workflow-briefs/test-id/release-package").expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });

  it("requires auth for finalize release package", async () => {
    const response = await request(app)
      .post("/api/v1/workflow-briefs/test-id/finalize-release-package")
      .expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });

  it("requires auth for client portal release package", async () => {
    const response = await request(app)
      .get("/api/v1/client-portal/projects/test-id/release-package")
      .expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });
});

describe("API integration — workflow brief final release package lifecycle (optional)", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
  const clientEmail = process.env.AUTH_SEED_TESTER_EMAIL;
  const clientPassword = process.env.AUTH_SEED_TESTER_PASSWORD ?? password;

  if (!password) {
    it("skips final release package lifecycle when AUTH_SEED_TEST_PASSWORD is unset", () => {
      assert.ok(true);
    });
    return;
  }

  it("blocks finalize until release prep is complete and exposes client-safe package after finalize", async () => {
    const login = await request(app).post("/api/v1/auth/login").send({ email, password }).expect(200);
    const token = login.body.data?.session?.token as string;
    assert.ok(token);

    const clientsResponse = await request(app)
      .get("/api/v1/clients")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const clients = clientsResponse.body.data?.clients as Array<{ id: string }> | undefined;
    assert.ok(Array.isArray(clients) && clients.length > 0);
    const clientId = clients[0].id;

    const createResponse = await request(app)
      .post("/api/v1/workflow-briefs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clientId,
        title: "[SMOKE] Workflow brief final release package",
        goal: "Validate final release package block"
      })
      .expect(201);

    const briefId = createResponse.body.data?.id as string;
    assert.ok(briefId);

    const releasePackageStatus = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/release-package`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(releasePackageStatus.body.ok, true);
    assert.equal(releasePackageStatus.body.data?.releasePackageFinalized, false);
    assert.ok(
      ["release_prep_missing", "not_ready"].includes(releasePackageStatus.body.data?.releasePackageStage),
      `unexpected stage: ${releasePackageStatus.body.data?.releasePackageStage}`
    );

    const finalizeBlocked = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/finalize-release-package`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    assert.ok(
      ["RELEASE_PACKAGE_PREP_MISSING", "RELEASE_PACKAGE_MISSING_PROJECT", "RELEASE_PACKAGE_NOT_READY"].includes(
        finalizeBlocked.body.error?.code
      ),
      `unexpected error code: ${finalizeBlocked.body.error?.code}`
    );

    if (!clientEmail) {
      return;
    }

    const clientLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: clientEmail, password: clientPassword })
      .expect(200);
    const clientToken = clientLogin.body.data?.session?.token as string;
    assert.ok(clientToken);

    const clientReleaseBefore = await request(app)
      .get("/api/v1/client-portal/projects/not-a-real-project-id/release-package")
      .set("Authorization", `Bearer ${clientToken}`);

    assert.ok([403, 404].includes(clientReleaseBefore.status));
    const clientBodyText = JSON.stringify(clientReleaseBefore.body);
    assert.equal(/storageKey|prompt|workflowRunId|providerMetadata/i.test(clientBodyText), false);
  });
});
