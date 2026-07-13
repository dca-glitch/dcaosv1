import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../../src/app";
import { redactStorageErrorMessage } from "../../src/storage/storage-error-redaction";

/**
 * Product API regression: Stage A storageKey-only images must approve via
 * POST …/article-images/:imageId/approve without writing preview/final URLs.
 * Optional when AUTH_SEED_TEST_PASSWORD is unset.
 */

const app = createApp();

function assertNoStorageKeyField(body: unknown, context: string) {
  const text = JSON.stringify(body);
  assert.equal(
    /"storageKey"/i.test(text),
    false,
    `storageKey leaked in ${context}: ${text}`
  );
}

describe("API integration — article image storageKey-only product approve", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";

  it("requires auth for article image approve", async () => {
    const response = await request(app)
      .post("/api/v1/ai-delivery-projects/not-a-real-project/article-images/not-a-real-id/approve")
      .expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });

  it("redacts signed URL signatures from storage error surfaces", () => {
    const redacted = redactStorageErrorMessage(
      "download failed https://example.test/obj?X-Amz-Signature=abcdef0123456789deadbeef"
    );
    assert.equal(redacted.redacted, true);
    assert.equal(/X-Amz-Signature=abcdef/i.test(redacted.message), false);
  });

  if (!password) {
    it("storageKey-only approve lifecycle", { skip: "AUTH_SEED_TEST_PASSWORD unset" }, () => {});
    return;
  }

  it("approves Stage A storageKey-only PREVIEW_READY through product API without persisting URLs", async (t) => {
    const login = await request(app).post("/api/v1/auth/login").send({ email, password }).expect(200);
    const token = login.body.data?.session?.token as string;
    assert.ok(token);

    const clientsResponse = await request(app)
      .get("/api/v1/clients")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const clients = clientsResponse.body.data?.clients as Array<{ id: string }> | undefined;
    if (!Array.isArray(clients) || clients.length === 0) {
      t.skip("no client available for storageKey-only approve smoke");
      return;
    }
    const clientId = clients[0].id;

    const targetMonth = new Date().toISOString().slice(0, 7);
    const projectResponse = await request(app)
      .post("/api/v1/ai-delivery-projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ clientId, name: "[SMOKE] storageKey-only approve", targetMonth });
    if (projectResponse.status === 403) {
      t.skip("AI Delivery module not enabled for local admin tenant");
      return;
    }
    assert.equal(projectResponse.status, 201);
    const projectId = projectResponse.body.data?.aiDeliveryProject?.id as string;
    assert.ok(projectId);

    const otherProjectResponse = await request(app)
      .post("/api/v1/ai-delivery-projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ clientId, name: "[SMOKE] storageKey-only approve other", targetMonth });
    assert.equal(otherProjectResponse.status, 201);
    const otherProjectId = otherProjectResponse.body.data?.aiDeliveryProject?.id as string;
    assert.ok(otherProjectId);

    const draftResponse = await request(app)
      .post(`/api/v1/ai-delivery-projects/${projectId}/content-drafts`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "[SMOKE] storageKey-only draft", draftBody: "Body for storageKey-only approve." })
      .expect(201);
    const contentDraftId = draftResponse.body.data?.contentDraft?.id as string;
    assert.ok(contentDraftId);

    const storageKey =
      "tenants/local-smoke/ai-delivery/storage-key-only/image-candidate.png";
    const imageCreate = await request(app)
      .post(`/api/v1/ai-delivery-projects/${projectId}/article-images`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        contentDraftId,
        title: "[SMOKE] storageKey-only image",
        prompt: "Stage A shaped private asset with no persisted preview URL.",
        status: "PREVIEW_READY",
        storageKey,
        previewImageUrl: null,
        finalImageUrl: null
      })
      .expect(201);

    assertNoStorageKeyField(imageCreate.body, "article image create");
    const image = imageCreate.body.data?.articleImage as {
      id: string;
      status: string;
      previewImageUrl: string | null;
      finalImageUrl: string | null;
      hasDocument: boolean;
    };
    assert.ok(image?.id);
    assert.equal(image.status, "PREVIEW_READY");
    assert.equal(image.hasDocument, true);
    assert.equal(image.previewImageUrl, null);
    assert.equal(image.finalImageUrl, null);

    const crossProject = await request(app)
      .post(`/api/v1/ai-delivery-projects/${otherProjectId}/article-images/${image.id}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    const approve = await request(app)
      .post(`/api/v1/ai-delivery-projects/${projectId}/article-images/${image.id}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assertNoStorageKeyField(approve.body, "article image approve");
    const approved = approve.body.data?.articleImage as {
      id: string;
      status: string;
      previewImageUrl: string | null;
      finalImageUrl: string | null;
      hasDocument: boolean;
    };
    assert.equal(approved.status, "APPROVED");
    assert.equal(approved.hasDocument, true);
    assert.equal(approved.previewImageUrl, null);
    assert.equal(approved.finalImageUrl, null);

    const repeat = await request(app)
      .post(`/api/v1/ai-delivery-projects/${projectId}/article-images/${image.id}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .expect(409);
    assert.equal(repeat.body.error?.code, "AI_DELIVERY_ARTICLE_IMAGE_ACTION_BLOCKED");

    const emptyCreate = await request(app)
      .post(`/api/v1/ai-delivery-projects/${projectId}/article-images`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        contentDraftId,
        title: "[SMOKE] empty reference image",
        prompt: "No asset reference.",
        status: "PREVIEW_READY"
      })
      .expect(201);
    const emptyId = emptyCreate.body.data?.articleImage?.id as string;
    const emptyApprove = await request(app)
      .post(`/api/v1/ai-delivery-projects/${projectId}/article-images/${emptyId}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .expect(409);
    assert.equal(emptyApprove.body.error?.code, "AI_DELIVERY_ARTICLE_IMAGE_PREVIEW_REFERENCE_REQUIRED");

    const urlCreate = await request(app)
      .post(`/api/v1/ai-delivery-projects/${projectId}/article-images`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        contentDraftId,
        title: "[SMOKE] URL-backed image",
        prompt: "URL-backed preview still works.",
        status: "PREVIEW_READY",
        previewImageUrl: "https://cdn.example.test/preview-only.png"
      })
      .expect(201);
    const urlId = urlCreate.body.data?.articleImage?.id as string;
    const urlApprove = await request(app)
      .post(`/api/v1/ai-delivery-projects/${projectId}/article-images/${urlId}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    assert.equal(urlApprove.body.data?.articleImage?.status, "APPROVED");
    assert.equal(urlApprove.body.data?.articleImage?.previewImageUrl, "https://cdn.example.test/preview-only.png");

    await request(app)
      .post(`/api/v1/ai-delivery-projects/${projectId}/archive`)
      .set("Authorization", `Bearer ${token}`);
    await request(app)
      .post(`/api/v1/ai-delivery-projects/${otherProjectId}/archive`)
      .set("Authorization", `Bearer ${token}`);
  });
});
