import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();
const SECRET_PATTERN = /re_[A-Za-z0-9]+|RESEND_API_KEY/i;

describe("API integration — email notification wiring (unauthenticated)", () => {
  it("requires auth for email logs listing", async () => {
    const response = await request(app).get("/api/v1/notifications/email-logs").expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });
});

describe("API integration — email notification wiring (authenticated, optional)", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";

  if (!password) {
    it("email notification wiring checks", { skip: "AUTH_SEED_TEST_PASSWORD unset" }, () => {});
    return;
  }

  it("outbox status is disabled-safe and hides secrets", async () => {
    const login = await request(app).post("/api/v1/auth/login").send({ email, password }).expect(200);
    const token = login.body.data?.session?.token as string;
    assert.ok(token);

    const logsResponse = await request(app)
      .get("/api/v1/notifications/email-logs?limit=5")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const serialized = JSON.stringify(logsResponse.body);
    assert.doesNotMatch(serialized, SECRET_PATTERN);
    assert.equal(logsResponse.body.data?.outbox?.sendingEnabled, false);
    assert.equal(logsResponse.body.data?.outbox?.provider, "local");
  });

  it("content draft review request creates SKIPPED admin notification intent", async (t) => {
    const login = await request(app).post("/api/v1/auth/login").send({ email, password }).expect(200);
    const token = login.body.data?.session?.token as string;
    assert.ok(token);

    const beforeLogs = await request(app)
      .get("/api/v1/notifications/email-logs?limit=50")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const beforeCount = (beforeLogs.body.data?.emailLogs as unknown[] | undefined)?.length ?? 0;

    const clientsResponse = await request(app)
      .get("/api/v1/clients")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const clients = clientsResponse.body.data?.clients as Array<{ id: string }> | undefined;
    if (!Array.isArray(clients) || clients.length === 0) {
      t.skip("no client available in local seed for email wiring smoke");
      return;
    }

    const targetMonth = new Date().toISOString().slice(0, 7);
    const projectResponse = await request(app)
      .post("/api/v1/ai-delivery-projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ clientId: clients[0].id, name: "[SMOKE] email wiring", targetMonth });

    if (projectResponse.status === 403) {
      t.skip("AI Delivery module not enabled for local admin tenant");
      return;
    }
    assert.equal(projectResponse.status, 201);
    const projectId = projectResponse.body.data?.aiDeliveryProject?.id as string;
    assert.ok(projectId);

    const draftResponse = await request(app)
      .post(`/api/v1/ai-delivery-projects/${projectId}/content-drafts`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Email wiring draft",
        draftBody: "Body for email notification wiring proof.",
        status: "DRAFT"
      });

    if (draftResponse.status !== 201) {
      t.skip("content draft create not available in local seed");
      return;
    }
    const draftId = draftResponse.body.data?.contentDraft?.id as string;
    assert.ok(draftId);

    const reviewResponse = await request(app)
      .post(`/api/v1/ai-delivery-projects/${projectId}/content-drafts/${draftId}/request-client-review`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.ok(reviewResponse.body.data?.contentDraft?.id);

    const afterLogs = await request(app)
      .get("/api/v1/notifications/email-logs?limit=50")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const emailLogs = afterLogs.body.data?.emailLogs as Array<{ subject: string; status: string }> | undefined;
    assert.ok(Array.isArray(emailLogs));
    assert.ok(emailLogs.length >= beforeCount);
    const wiredLog = emailLogs.find((row) => row.subject.includes("Article ready for review"));
    assert.ok(wiredLog, "expected article-ready admin notification intent in email logs");
    assert.equal(wiredLog.status, "SKIPPED");
    assert.doesNotMatch(JSON.stringify(afterLogs.body), SECRET_PATTERN);
  });
});
