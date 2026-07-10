import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMAIL_REDACTED_RECIPIENT_TOKEN,
  EMAIL_REDACTED_TOKEN,
  EMAIL_REDACTION_VERSION,
  emailSerializationContainsSecretLeak,
  redactEmailRecipient,
  redactEmailTemplateVariables
} from "./email-redaction";

describe("G509 email recipient redaction", () => {
  it("keeps domain and masks local-part for well-formed addresses", () => {
    assert.equal(EMAIL_REDACTION_VERSION, "EMAIL_REDACTION_V1");
    assert.equal(redactEmailRecipient("client.user@example.com"), "***@example.com");
    assert.equal(redactEmailRecipient("  Admin@DigitalCubeAgency.net  "), "***@DigitalCubeAgency.net");
  });

  it("uses a fixed token for malformed recipients", () => {
    assert.equal(redactEmailRecipient("not-an-email"), EMAIL_REDACTED_RECIPIENT_TOKEN);
    assert.equal(redactEmailRecipient("@missing-local"), EMAIL_REDACTED_RECIPIENT_TOKEN);
    assert.equal(redactEmailRecipient("missing-domain@"), EMAIL_REDACTED_RECIPIENT_TOKEN);
    assert.equal(redactEmailRecipient(""), EMAIL_REDACTED_RECIPIENT_TOKEN);
  });

  it("never leaves the original local-part in the redacted value", () => {
    const original = "secret.user@example.org";
    const redacted = redactEmailRecipient(original);
    assert.equal(redacted.includes("secret.user"), false);
    assert.equal(redacted.startsWith("***@"), true);
  });
});

describe("G510 email template variable redaction", () => {
  it("redacts sensitive keys and preserves safe template variables", () => {
    const redacted = redactEmailTemplateVariables({
      title: "Draft ready",
      clientId: "client_1",
      relatedEntityId: "deliverable_1",
      apiKey: "re_should_not_appear",
      storageKey: "secret/path",
      oauthToken: "token-value",
      stackTrace: "Error at line 1",
      privateAuditMetadata: { note: "internal" },
      nested: {
        password: "hunter2",
        statusLabel: "READY"
      }
    });

    assert.equal(redacted.title, "Draft ready");
    assert.equal(redacted.clientId, "client_1");
    assert.equal(redacted.relatedEntityId, "deliverable_1");
    assert.equal(redacted.apiKey, EMAIL_REDACTED_TOKEN);
    assert.equal(redacted.storageKey, EMAIL_REDACTED_TOKEN);
    assert.equal(redacted.oauthToken, EMAIL_REDACTED_TOKEN);
    assert.equal(redacted.stackTrace, EMAIL_REDACTED_TOKEN);
    assert.equal(redacted.privateAuditMetadata, EMAIL_REDACTED_TOKEN);
    assert.equal(redacted.nested.password, EMAIL_REDACTED_TOKEN);
    assert.equal(redacted.nested.statusLabel, "READY");
  });

  it("redacts arrays and does not leak secrets in serialization", () => {
    const redacted = redactEmailTemplateVariables({
      items: [{ authorization: "Bearer abc", message: "ok" }],
      RESEND_API_KEY: "re_test_should_not_leak"
    });
    assert.equal(redacted.items[0]?.authorization, EMAIL_REDACTED_TOKEN);
    assert.equal(redacted.items[0]?.message, "ok");
    assert.equal(redacted.RESEND_API_KEY, EMAIL_REDACTED_TOKEN);

    const serialized = JSON.stringify(redacted);
    assert.equal(serialized.includes("re_test_should_not_leak"), false);
    assert.equal(serialized.includes("Bearer abc"), false);
    assert.equal(emailSerializationContainsSecretLeak(serialized), false);
  });

  it("detects obvious secret leaks in unsafe serialization", () => {
    assert.equal(emailSerializationContainsSecretLeak('{"k":"re_abcdefghijklmnop"}'), true);
    assert.equal(emailSerializationContainsSecretLeak('{"Authorization":"Bearer x"}'), true);
    assert.equal(emailSerializationContainsSecretLeak('{"title":"ok"}'), false);
  });
});
