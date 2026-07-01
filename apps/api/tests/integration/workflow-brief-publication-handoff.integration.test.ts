import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

const FORBIDDEN_RESPONSE_FIELD_PATTERN =
  /storageKey|prompt|workflowRunId|providerMetadata|draftBody|bodyContent|privatePath|wordpressDraft/i;

describe("API integration — workflow brief publication handoff status", () => {
  it("requires auth for publication handoff status", async () => {
    const response = await request(app)
      .get("/api/v1/workflow-briefs/test-id/publication-handoff")
      .expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });
});

describe("API integration — workflow brief publication handoff status lifecycle (optional)", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
  const clientEmail = process.env.AUTH_SEED_TESTER_EMAIL;
  const clientPassword = process.env.AUTH_SEED_TESTER_PASSWORD ?? password;

  if (!password) {
    it("skips publication handoff status lifecycle when AUTH_SEED_TEST_PASSWORD is unset", () => {
      assert.ok(true);
    });
    return;
  }

  it("returns admin handoff readiness without forbidden fields and blocks client access", async () => {
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
        title: "[SMOKE] Workflow brief publication handoff status",
        goal: "Validate publication handoff status block"
      })
      .expect(201);

    const briefId = createResponse.body.data?.id as string;
    assert.ok(briefId);

    const notFoundResponse = await request(app)
      .get("/api/v1/workflow-briefs/00000000-0000-4000-8000-000000000099/publication-handoff")
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
    assert.equal(notFoundResponse.body.error?.code, "WORKFLOW_BRIEF_NOT_FOUND");

    const statusResponse = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/publication-handoff`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(statusResponse.body.ok, true);
    assert.equal(statusResponse.body.data?.briefId, briefId);
    assert.ok(typeof statusResponse.body.data?.handoffStage === "string");
    assert.equal(statusResponse.body.data?.executionMode, "PREPARE_WORDPRESS_DRAFT");
    assert.equal(statusResponse.body.data?.handoffExecuted, false);
    assert.equal(statusResponse.body.data?.releasePackageFinalized, false);
    assert.equal(statusResponse.body.data?.publicationHandoff, null);
    assert.ok(
      ["not_ready", "publication_target_missing", "release_prep_missing"].includes(
        statusResponse.body.data?.handoffStage
      ),
      `unexpected handoff stage: ${statusResponse.body.data?.handoffStage}`
    );

    const bodyText = JSON.stringify(statusResponse.body);
    assert.equal(FORBIDDEN_RESPONSE_FIELD_PATTERN.test(bodyText), false);

    if (!clientEmail) {
      return;
    }

    const clientLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: clientEmail, password: clientPassword })
      .expect(200);
    const clientToken = clientLogin.body.data?.session?.token as string;
    assert.ok(clientToken);

    const clientBlocked = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/publication-handoff`)
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(403);

    assert.equal(clientBlocked.body.error?.code, "FORBIDDEN");
  });
});
