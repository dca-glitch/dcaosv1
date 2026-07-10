import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createEmailNoSendAdapter } from "./email-no-send-adapter";

describe("G165 email no-send adapter edge cases", () => {
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
    assert.equal(result.templateResolved, true);
    assert.equal(result.templateMissing, false);
    assert.deepEqual(adapter.listAttempts()[0], {
      tenantId: "tenant_1",
      recipientEmail: "client@example.com",
      subject: "Client approval needed",
      templateKey: "AI_DELIVERY_REVIEW_REQUEST",
      eventType: "article_ready_for_client_review",
      relatedEntityId: "deliverable_1",
      textBody: "Review the deliverable.",
      payload: null,
      redactRecipientInLogs: false
    });
  });

  it("does not call fetch or any external sender and needs no API key", async () => {
    const originalFetch = globalThis.fetch;
    let fetchCalled = false;
    globalThis.fetch = (() => {
      fetchCalled = true;
      throw new Error("fetch must not be called by no-send adapter");
    }) as typeof fetch;

    const previousKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    try {
      const adapter = createEmailNoSendAdapter();
      const result = await adapter.send({
        tenantId: "tenant_1",
        recipientEmail: "owner@example.com",
        subject: "No-send proof",
        templateKey: "AI_DELIVERY_APPROVED",
        eventType: "client_deliverable_approved"
      });

      assert.equal(fetchCalled, false);
      assert.equal(result.noSend, true);
      assert.equal(result.provider, "local");
      assert.equal(adapter.noSend, true);
      assert.equal(JSON.stringify(result).includes("RESEND_API_KEY"), false);
    } finally {
      globalThis.fetch = originalFetch;
      if (previousKey === undefined) {
        delete process.env.RESEND_API_KEY;
      } else {
        process.env.RESEND_API_KEY = previousKey;
      }
    }
  });

  it("exposes only safe metadata and redacts sensitive payload fields", async () => {
    const adapter = createEmailNoSendAdapter();
    const result = await adapter.send({
      tenantId: "tenant_1",
      recipientEmail: "client@example.com",
      subject: "Approval needed",
      templateKey: "CLIENT_APPROVAL_REQUIRED",
      eventType: "client_approval_needed",
      payload: {
        title: "Draft ready",
        storageKey: "secret/path",
        apiKey: "re_should_not_appear",
        oauthToken: "token-value",
        stackTrace: "Error at line 1",
        privateAuditMetadata: { note: "internal" }
      }
    });

    assert.equal(result.safeMetadata.typedTemplateKey, "CLIENT_APPROVAL_REQUIRED");
    assert.equal(result.safeMetadata.templateKey, "AI_DELIVERY_REVIEW_REQUEST");
    assert.equal(result.safeMetadata.payload?.title, "Draft ready");
    assert.equal(result.safeMetadata.payload?.storageKey, "[REDACTED]");
    assert.equal(result.safeMetadata.payload?.apiKey, "[REDACTED]");
    assert.equal(result.safeMetadata.payload?.oauthToken, "[REDACTED]");
    assert.equal(result.safeMetadata.payload?.stackTrace, "[REDACTED]");
    assert.equal(result.safeMetadata.payload?.privateAuditMetadata, "[REDACTED]");

    const serialized = JSON.stringify(adapter.listSafeMetadata());
    assert.equal(serialized.includes("re_should_not_appear"), false);
    assert.equal(serialized.includes("secret/path"), false);
    assert.equal(serialized.includes("token-value"), false);
  });

  it("redacts recipient email in logs when policy requests it", async () => {
    const adapter = createEmailNoSendAdapter();
    const result = await adapter.send({
      tenantId: "tenant_1",
      recipientEmail: "client.user@example.com",
      subject: "Monthly report available",
      templateKey: "MONTHLY_REPORT_AVAILABLE",
      eventType: "monthly_report_available",
      redactRecipientInLogs: true
    });

    assert.equal(result.safeMetadata.recipientEmail, "***@example.com");
    assert.equal(adapter.listAttempts()[0]?.recipientEmail, "client.user@example.com");
    assert.equal(adapter.listSafeMetadata()[0]?.recipientEmail, "***@example.com");
  });

  it("treats a missing or unknown template as safe no-send without throwing", async () => {
    const adapter = createEmailNoSendAdapter();
    const missing = await adapter.send({
      tenantId: "tenant_1",
      recipientEmail: "admin@example.com",
      subject: "Missing template",
      templateKey: "",
      eventType: "external_proof_failed"
    });

    assert.equal(missing.status, "SKIPPED");
    assert.equal(missing.templateMissing, true);
    assert.equal(missing.templateResolved, false);
    assert.equal(missing.safeMetadata.templateKey, null);

    const unknown = await adapter.send({
      tenantId: "tenant_1",
      recipientEmail: "admin@example.com",
      subject: "Unknown template",
      templateKey: "NOT_A_REAL_TEMPLATE_KEY",
      eventType: "budget_cap_blocked"
    });

    assert.equal(unknown.status, "SKIPPED");
    assert.equal(unknown.templateMissing, true);
    assert.equal(unknown.noSend, true);
    assert.equal(unknown.providerMessageId, null);
  });
});
