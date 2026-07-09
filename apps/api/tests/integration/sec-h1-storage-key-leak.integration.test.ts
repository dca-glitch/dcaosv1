import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createPrismaClient } from "../../../../packages/data/src/client";
import { createApp } from "../../src/app";

// SEC-H1 regression coverage: admin and client-portal AI Delivery JSON responses
// must never include the raw `storageKey` field. Presence of a document/asset
// must be signaled only via the `hasDocument` boolean; the download-reference
// handlers are the sole intentional exception (audited, admin-only).

const app = createApp();
const prisma = createPrismaClient();

function assertNoStorageKeyField(body: unknown, context: string) {
  const text = JSON.stringify(body);
  assert.equal(
    /"storageKey"/i.test(text),
    false,
    `SEC-H1 regression: "storageKey" field leaked in ${context}: ${text}`
  );
}

describe("API integration — SEC-H1 storageKey exposure (unauthenticated)", () => {
  it("requires auth for ai-delivery deliverables listing", async () => {
    const response = await request(app)
      .get("/api/v1/ai-delivery-projects/not-a-real-project/deliverables")
      .expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });

  it("requires auth for ai-delivery article images listing", async () => {
    const response = await request(app)
      .get("/api/v1/ai-delivery-projects/not-a-real-project/article-images")
      .expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });
});

describe("API integration — SEC-H1 storageKey exposure (admin lifecycle, optional)", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";

  if (!password) {
    it("SEC-H1 admin storageKey checks", { skip: "AUTH_SEED_TEST_PASSWORD unset" }, () => {});
    return;
  }

  it("admin deliverable create/list/detail never leak storageKey and expose hasDocument", async (t) => {
    const login = await request(app).post("/api/v1/auth/login").send({ email, password }).expect(200);
    const token = login.body.data?.session?.token as string;
    assert.ok(token);

    const clientsResponse = await request(app)
      .get("/api/v1/clients")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const clients = clientsResponse.body.data?.clients as Array<{ id: string }> | undefined;
    if (!Array.isArray(clients) || clients.length === 0) {
      t.skip("no client available in local seed for SEC-H1 deliverable smoke");
      return;
    }
    const clientId = clients[0].id;

    const targetMonth = new Date().toISOString().slice(0, 7);
    const projectResponse = await request(app)
      .post("/api/v1/ai-delivery-projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ clientId, name: "[SMOKE] SEC-H1 storageKey guard", targetMonth });

    if (projectResponse.status === 403) {
      t.skip("AI Delivery module not enabled for local admin tenant");
      return;
    }
    assert.equal(projectResponse.status, 201);
    assertNoStorageKeyField(projectResponse.body, "ai-delivery project create response");
    const projectId = projectResponse.body.data?.aiDeliveryProject?.id as string;
    assert.ok(projectId);

    const deliverableCreate = await request(app)
      .post(`/api/v1/ai-delivery-projects/${projectId}/deliverables`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "[SMOKE] SEC-H1 deliverable",
        deliveryType: "OTHER",
        status: "DRAFT",
        storageKey: "sec-h1-smoke/deliverable-object-key.bin"
      })
      .expect(201);

    assertNoStorageKeyField(deliverableCreate.body, "deliverable create response");
    assert.equal(deliverableCreate.body.data?.deliverable?.hasDocument, true);
    const deliverableId = deliverableCreate.body.data?.deliverable?.id as string;
    assert.ok(deliverableId);

    const listResponse = await request(app)
      .get(`/api/v1/ai-delivery-projects/${projectId}/deliverables`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assertNoStorageKeyField(listResponse.body, "deliverable list response");
    const listed = (listResponse.body.data?.deliverables as Array<{ id: string; hasDocument: boolean }>).find(
      (d) => d.id === deliverableId
    );
    assert.ok(listed, "created deliverable should appear in list response");
    assert.equal(listed?.hasDocument, true);

    const downloadRefResponse = await request(app)
      .get(`/api/v1/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/download-reference`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    assert.equal(downloadRefResponse.body.ok, true);

    await request(app)
      .post(`/api/v1/ai-delivery-projects/${projectId}/archive`)
      .set("Authorization", `Bearer ${token}`);
  });

  it("admin article image create/list never leak storageKey and expose hasDocument", async (t) => {
    const login = await request(app).post("/api/v1/auth/login").send({ email, password }).expect(200);
    const token = login.body.data?.session?.token as string;
    assert.ok(token);

    const clientsResponse = await request(app)
      .get("/api/v1/clients")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const clients = clientsResponse.body.data?.clients as Array<{ id: string }> | undefined;
    if (!Array.isArray(clients) || clients.length === 0) {
      t.skip("no client available in local seed for SEC-H1 article image smoke");
      return;
    }
    const clientId = clients[0].id;

    const targetMonth = new Date().toISOString().slice(0, 7);
    const projectResponse = await request(app)
      .post("/api/v1/ai-delivery-projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ clientId, name: "[SMOKE] SEC-H1 image storageKey guard", targetMonth });

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
      .send({ title: "[SMOKE] SEC-H1 draft", draftBody: "Draft body for SEC-H1 image smoke." })
      .expect(201);
    const contentDraftId = draftResponse.body.data?.contentDraft?.id as string;
    assert.ok(contentDraftId);

    const imageCreate = await request(app)
      .post(`/api/v1/ai-delivery-projects/${projectId}/article-images`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        contentDraftId,
        title: "[SMOKE] SEC-H1 article image",
        prompt: "A smoke-test prompt for SEC-H1 storageKey guard.",
        status: "DRAFT",
        storageKey: "sec-h1-smoke/article-image-object-key.png"
      })
      .expect(201);

    assertNoStorageKeyField(imageCreate.body, "article image create response");
    assert.equal(imageCreate.body.data?.articleImage?.hasDocument, true);
    const imageId = imageCreate.body.data?.articleImage?.id as string;
    assert.ok(imageId);

    const listResponse = await request(app)
      .get(`/api/v1/ai-delivery-projects/${projectId}/article-images`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assertNoStorageKeyField(listResponse.body, "article image list response");
    const listed = (listResponse.body.data?.articleImages as Array<{ id: string; hasDocument: boolean }>).find(
      (img) => img.id === imageId
    );
    assert.ok(listed, "created article image should appear in list response");
    assert.equal(listed?.hasDocument, true);

    await request(app)
      .post(`/api/v1/ai-delivery-projects/${projectId}/archive`)
      .set("Authorization", `Bearer ${token}`);
  });

  it("admin monthly report response never leaks storageKey and exposes hasDocument", async (t) => {
    const login = await request(app).post("/api/v1/auth/login").send({ email, password }).expect(200);
    const token = login.body.data?.session?.token as string;
    assert.ok(token);

    const clientsResponse = await request(app)
      .get("/api/v1/clients")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const clients = clientsResponse.body.data?.clients as Array<{ id: string }> | undefined;
    if (!Array.isArray(clients) || clients.length === 0) {
      t.skip("no client available in local seed for SEC-H1 monthly report smoke");
      return;
    }
    const clientId = clients[0].id;

    const targetMonth = new Date().toISOString().slice(0, 7);
    const projectResponse = await request(app)
      .post("/api/v1/ai-delivery-projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ clientId, name: "[SMOKE] SEC-H1 report storageKey guard", targetMonth });

    if (projectResponse.status === 403) {
      t.skip("AI Delivery module not enabled for local admin tenant");
      return;
    }
    assert.equal(projectResponse.status, 201);
    const projectId = projectResponse.body.data?.aiDeliveryProject?.id as string;
    assert.ok(projectId);

    const reportCreate = await request(app)
      .post(`/api/v1/ai-delivery/reports/monthly/${projectId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "[SMOKE] SEC-H1 monthly report" })
      .expect(201);

    assertNoStorageKeyField(reportCreate.body, "monthly report create response");
    assert.equal(reportCreate.body.data?.report?.hasDocument, false);
    const reportId = reportCreate.body.data?.report?.id as string;
    assert.ok(reportId);

    // Directly set storageKey at the data layer (no API mutation path exists for
    // this field outside the real document-upload flow) purely to exercise the
    // read-side leak guard below.
    await (prisma as any).aiDeliveryMonthlyReport.update({
      where: { id: reportId },
      data: { storageKey: "sec-h1-smoke/monthly-report-object-key.pdf" }
    });

    const getResponse = await request(app)
      .get(`/api/v1/ai-delivery/reports/monthly/${projectId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assertNoStorageKeyField(getResponse.body, "monthly report get response");
    assert.equal(getResponse.body.data?.report?.hasDocument, true);

    await request(app)
      .post(`/api/v1/ai-delivery-projects/${projectId}/archive`)
      .set("Authorization", `Bearer ${token}`);
  });
});

describe("API integration — SEC-H1 storageKey exposure (client portal, optional)", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";

  if (!password) {
    it("SEC-H1 client portal storageKey checks", { skip: "AUTH_SEED_TEST_PASSWORD unset" }, () => {});
    return;
  }

  it("client portal project/deliverable/monthly-report responses never leak storageKey", async () => {
    const login = await request(app).post("/api/v1/auth/login").send({ email, password }).expect(200);
    const token = login.body.data?.session?.token as string;
    assert.ok(token);

    const projectsResponse = await request(app)
      .get("/api/v1/client-portal/projects")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assertNoStorageKeyField(projectsResponse.body, "client portal projects response");

    const projects = projectsResponse.body.data?.aiDeliveryProjects as Array<{ id: string }> | undefined;
    if (!Array.isArray(projects) || projects.length === 0) {
      return;
    }
    const projectId = projects[0].id;

    const deliverablesResponse = await request(app)
      .get(`/api/v1/client-portal/projects/${projectId}/deliverables`)
      .set("Authorization", `Bearer ${token}`);
    assertNoStorageKeyField(deliverablesResponse.body, "client portal deliverables response");

    const reportsResponse = await request(app)
      .get(`/api/v1/client-portal/projects/${projectId}/monthly-reports`)
      .set("Authorization", `Bearer ${token}`);
    assertNoStorageKeyField(reportsResponse.body, "client portal monthly-reports response");
  });
});
