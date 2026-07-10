import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createEmailNoSendAdapter } from "./email-no-send-adapter";

describe("email no-send adapter", () => {
  it("records an email attempt as skipped without provider metadata", async () => {
    const adapter = createEmailNoSendAdapter();

    const result = await adapter.send({
      tenantId: "tenant_1",
      recipientEmail: " Client@Example.com ",
      subject: " Client approval needed ",
      templateKey: "AI_DELIVERY_REVIEW_REQUEST",
      eventType: "article_ready_for_client_review",
      relatedEntityId: " deliverable_1 ",
      textBody: " Review the deliverable. "
    });

    assert.equal(result.status, "SKIPPED");
    assert.equal(result.provider, "local");
    assert.equal(result.providerMessageId, null);
    assert.equal(result.sentAt, null);
    assert.equal(result.noSend, true);
    assert.deepEqual(adapter.listAttempts(), [
      {
        tenantId: "tenant_1",
        recipientEmail: "client@example.com",
        subject: "Client approval needed",
        templateKey: "AI_DELIVERY_REVIEW_REQUEST",
        eventType: "article_ready_for_client_review",
        relatedEntityId: "deliverable_1",
        textBody: "Review the deliverable."
      }
    ]);
  });

  it("does not call fetch or any external sender", async () => {
    const originalFetch = globalThis.fetch;
    let fetchCalled = false;
    globalThis.fetch = (() => {
      fetchCalled = true;
      throw new Error("fetch must not be called by no-send adapter");
    }) as typeof fetch;

    try {
      const adapter = createEmailNoSendAdapter();
      await adapter.send({
        tenantId: "tenant_1",
        recipientEmail: "owner@example.com",
        subject: "No-send proof",
        templateKey: "AI_DELIVERY_APPROVED",
        eventType: "client_deliverable_approved"
      });

      assert.equal(fetchCalled, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
