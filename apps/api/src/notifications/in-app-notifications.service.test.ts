import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  toPersistedInAppPayloadJson,
  upsertInAppNotification
} from "./in-app-notifications.service";

describe("in-app notification payload redaction on write", () => {
  it("redacts secret keys before persistence helper returns payloadJson", () => {
    const persisted = toPersistedInAppPayloadJson({
      title: "Draft ready",
      apiKey: "sk-should-not-persist",
      storageKey: "tenants/t1/secret.bin",
      oauthToken: "ya29.leak",
      stackTrace: "Error at line 1",
      nested: { password: "hunter2", statusLabel: "READY" }
    });

    assert.ok(persisted && typeof persisted === "object");
    const record = persisted as Record<string, unknown>;
    assert.equal(record.title, "Draft ready");
    assert.equal(record.apiKey, "[REDACTED]");
    assert.equal(record.storageKey, "[REDACTED]");
    assert.equal(record.oauthToken, "[REDACTED]");
    assert.equal(record.stackTrace, "[REDACTED]");
    assert.deepEqual(record.nested, { password: "[REDACTED]", statusLabel: "READY" });
  });

  it("passes undefined when payloadJson is null or undefined", () => {
    assert.equal(toPersistedInAppPayloadJson(null), undefined);
    assert.equal(toPersistedInAppPayloadJson(undefined), undefined);
  });

  it("upsertInAppNotification writes only redacted payloadJson via client", async () => {
    let capturedPayload: unknown;
    const client = {
      inAppNotification: {
        upsert: async (args: { create: { payloadJson?: unknown }; update: { payloadJson?: unknown } }) => {
          capturedPayload = args.create.payloadJson;
          assert.deepEqual(args.create.payloadJson, args.update.payloadJson);
          return { id: "notif-1" };
        }
      }
    };

    await upsertInAppNotification(
      {
        tenantId: "tenant-1",
        recipientUserId: "user-1",
        recipientRole: "admin",
        eventType: "content_draft_ready",
        severity: "action_required",
        title: "Ready",
        relatedEntityType: "deliverable",
        relatedEntityId: "del-1",
        payloadJson: {
          message: "ok",
          RESEND_API_KEY: "re_secret",
          rawProviderResponse: { body: "secret" }
        }
      },
      client as never
    );

    const record = capturedPayload as Record<string, unknown>;
    assert.equal(record.message, "ok");
    assert.equal(record.RESEND_API_KEY, "[REDACTED]");
    assert.equal(record.rawProviderResponse, "[REDACTED]");
    assert.equal(JSON.stringify(capturedPayload).includes("re_secret"), false);
  });
});
