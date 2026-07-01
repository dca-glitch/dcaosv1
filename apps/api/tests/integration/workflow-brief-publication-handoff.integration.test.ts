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

describe("API integration — workflow brief publication handoff execute", () => {
  it("requires auth for execute publication handoff", async () => {
    const response = await request(app)
      .post("/api/v1/workflow-briefs/test-id/execute-publication-handoff")
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

describe("API integration — workflow brief publication handoff execute lifecycle (optional)", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
  const clientEmail = process.env.AUTH_SEED_TESTER_EMAIL;
  const clientPassword = process.env.AUTH_SEED_TESTER_PASSWORD ?? password;

  if (!password) {
    it("skips publication handoff execute lifecycle when AUTH_SEED_TEST_PASSWORD is unset", () => {
      assert.ok(true);
    });
    return;
  }

  it("executes publication handoff with guards, idempotency, and status reflection", async () => {
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
        title: "[SMOKE] Workflow brief publication handoff execute",
        goal: "Validate publication handoff execute block"
      })
      .expect(201);
    const briefId = createResponse.body.data?.id as string;
    assert.ok(briefId);

    const executeUnknownBrief = await request(app)
      .post("/api/v1/workflow-briefs/00000000-0000-4000-8000-000000000099/execute-publication-handoff")
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
    assert.equal(executeUnknownBrief.body.error?.code, "WORKFLOW_BRIEF_NOT_FOUND");

    const executeMissingProject = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/execute-publication-handoff`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
    assert.equal(executeMissingProject.body.error?.code, "PUBLICATION_HANDOFF_MISSING_PROJECT");

    await request(app).post(`/api/v1/workflow-briefs/${briefId}/submit`).set("Authorization", `Bearer ${token}`).expect(200);
    await request(app).post(`/api/v1/workflow-briefs/${briefId}/run-ai`).set("Authorization", `Bearer ${token}`).expect(200);
    await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/production-plan/generate`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/production-plan/send`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/production-plan/approve`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/create-project`)
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(201);

    const handoffStatusBeforeTarget = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/publication-handoff`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const executeBeforePackaging = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/execute-publication-handoff`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    if (!handoffStatusBeforeTarget.body.data?.publicationTargetAvailable) {
      assert.equal(
        executeBeforePackaging.body.error?.code,
        "PUBLICATION_HANDOFF_PUBLICATION_TARGET_MISSING"
      );
    } else {
      assert.ok(
        ["PUBLICATION_HANDOFF_NOT_READY", "PUBLICATION_HANDOFF_PREP_MISSING"].includes(
          executeBeforePackaging.body.error?.code
        ),
        `unexpected early execute error: ${executeBeforePackaging.body.error?.code}`
      );
    }

    await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/seed-content-production`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);
    await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/generate-content-drafts`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const packageResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/package-deliverables`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/prepare-image-sets`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const firstDeliverableId = packageResponse.body.data?.status?.items?.[0]?.deliverableId as string;
    const firstSeedItemId = packageResponse.body.data?.status?.items?.[0]?.contentPlanItemId as string;
    assert.ok(firstDeliverableId);
    assert.ok(firstSeedItemId);

    const imageSetStatus = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/image-sets`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const articleImageId = imageSetStatus.body.data?.items?.find(
      (item: { contentPlanItemId: string }) => item.contentPlanItemId === firstSeedItemId
    )?.articleImageId as string;
    assert.ok(articleImageId);

    await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/deliverables/${firstDeliverableId}/send-for-client-review`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    if (!handoffStatusBeforeTarget.body.data?.publicationTargetAvailable) {
      await request(app)
        .post(`/api/v1/clients/${clientId}/publication-targets`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          label: "[SMOKE] Publication handoff blog",
          siteUrl: "https://example.com",
          isDefault: true
        })
        .expect(201);
    }

    const executeNotFinalized = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/execute-publication-handoff`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
    assert.equal(executeNotFinalized.body.error?.code, "PUBLICATION_HANDOFF_NOT_READY");

    if (!clientEmail) {
      return;
    }

    const clientLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: clientEmail, password: clientPassword })
      .expect(200);
    const clientToken = clientLogin.body.data?.session?.token as string;
    assert.ok(clientToken);

    const clientExecuteBlocked = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/execute-publication-handoff`)
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(403);
    assert.equal(clientExecuteBlocked.body.error?.code, "FORBIDDEN");

    await request(app)
      .patch(`/api/v1/client-portal/deliverables/${firstDeliverableId}/images/${articleImageId}/approve`)
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(200);
    await request(app)
      .patch(`/api/v1/client-portal/deliverables/${firstDeliverableId}/approve`)
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(200);

    await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/prepare-release`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const executeBeforeFinalize = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/execute-publication-handoff`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
    assert.equal(
      executeBeforeFinalize.body.error?.code,
      "PUBLICATION_HANDOFF_RELEASE_PACKAGE_NOT_FINALIZED"
    );

    await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/finalize-release-package`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const executeResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/execute-publication-handoff`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(executeResponse.body.ok, true);
    assert.equal(executeResponse.body.data?.executed, true);
    assert.equal(executeResponse.body.data?.reused, false);
    assert.equal(executeResponse.body.data?.handoffStage, "draft_prepared");
    assert.equal(executeResponse.body.data?.publicationHandoff?.kind, "publication_handoff_result");
    assert.ok(executeResponse.body.data?.publicationHandoff?.preparedCount > 0);

    const executeBodyText = JSON.stringify(executeResponse.body);
    assert.equal(FORBIDDEN_RESPONSE_FIELD_PATTERN.test(executeBodyText), false);

    const executeAgain = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/execute-publication-handoff`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    assert.equal(executeAgain.body.data?.executed, true);
    assert.equal(executeAgain.body.data?.reused, true);

    const statusAfterExecute = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/publication-handoff`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    assert.equal(statusAfterExecute.body.data?.handoffExecuted, true);
    assert.equal(statusAfterExecute.body.data?.handoffStage, "draft_prepared");
    assert.equal(statusAfterExecute.body.data?.publicationHandoff?.kind, "publication_handoff_result");
  });
});
