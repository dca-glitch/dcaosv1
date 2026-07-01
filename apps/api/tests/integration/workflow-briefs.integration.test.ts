import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

describe("API integration — workflow briefs foundation", () => {
  it("requires auth for workflow brief listing", async () => {
    const response = await request(app).get("/api/v1/workflow-briefs").expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });

  it("requires auth for workflow brief creation", async () => {
    const response = await request(app)
      .post("/api/v1/workflow-briefs")
      .send({ clientId: "x", title: "Test" })
      .expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });
});

describe("API integration — workflow briefs lifecycle (optional)", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";

  if (!password) {
    it("skips workflow brief lifecycle when AUTH_SEED_TEST_PASSWORD is unset", () => {
      assert.ok(true);
    });
    return;
  }

  it("creates, submits, runs AI, and attaches reports + production plan", async () => {
    const login = await request(app).post("/api/v1/auth/login").send({ email, password }).expect(200);
    const token = login.body.data?.session?.token as string;
    assert.ok(token);

    const clientsResponse = await request(app)
      .get("/api/v1/clients")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const clients = clientsResponse.body.data?.clients as Array<{ id: string; name: string }> | undefined;
    assert.ok(Array.isArray(clients) && clients.length > 0, "expected at least one client for workflow brief smoke");
    const clientId = clients[0].id;

    const createResponse = await request(app)
      .post("/api/v1/workflow-briefs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clientId,
        title: "[SMOKE] Workflow brief foundation",
        goal: "Validate brief-centered workflow foundation",
        businessContext: "Smoke test context",
        targetAudience: "Test audience"
      })
      .expect(201);

    assert.equal(createResponse.body.ok, true);
    const briefId = createResponse.body.data?.id as string;
    assert.ok(briefId);

    const submitResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(submitResponse.body.data?.status, "READY_FOR_AI");

    const runResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/run-ai`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(runResponse.body.ok, true);
    assert.equal(runResponse.body.data?.run?.status, "COMPLETED");
    assert.ok(runResponse.body.data?.miReport?.id);
    assert.ok(runResponse.body.data?.seoReport?.id);
    assert.equal(runResponse.body.data?.brief?.status, "AI_RESULTS_READY");

    const miResponse = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/mi-report`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    assert.equal(miResponse.body.ok, true);
    assert.ok(miResponse.body.data?.summaryText);

    const seoResponse = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/seo-report`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    assert.equal(seoResponse.body.ok, true);
    assert.ok(seoResponse.body.data?.summaryText);

    const planResponse = await request(app)
      .put(`/api/v1/workflow-briefs/${briefId}/production-plan`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Smoke production plan",
        body: "Foundation plan body"
      })
      .expect(200);

    assert.equal(planResponse.body.ok, true);
    assert.equal(planResponse.body.data?.title, "Smoke production plan");

    const getPlanResponse = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/production-plan`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    assert.equal(getPlanResponse.body.data?.body, "Foundation plan body");

    const listResponse = await request(app)
      .get("/api/v1/workflow-briefs")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    assert.equal(listResponse.body.ok, true);
    const listed = listResponse.body.data as Array<{ id: string }>;
    assert.ok(listed.some((item) => item.id === briefId));
  });
});
