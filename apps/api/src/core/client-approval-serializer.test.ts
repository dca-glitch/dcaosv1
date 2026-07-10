import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CLIENT_APPROVAL_SERIALIZER_VERSION,
  findForbiddenKeysInApprovalPayload,
  listForbiddenApprovalPayloadKeys,
  serializeClientApprovalDetail,
  serializeClientApprovalPendingItem
} from "./client-approval-serializer";

describe("G584 approval surface client-safe serializer", () => {
  it("serializes pending list items without copying internal keys", () => {
    const dirtyInput = {
      id: "del-1",
      title: "Article",
      status: "PENDING_CLIENT_REVIEW",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      aiDeliveryProject: {
        id: "proj-1",
        name: "July",
        clientId: "client-1",
        client: { id: "client-1", name: "Acme" }
      },
      storageKey: "tenants/x/y",
      actualCostUsd: 12.5
    };
    const item = serializeClientApprovalPendingItem(dirtyInput);

    assert.equal(item.clientName, "Acme");
    assert.equal(item.projectId, "proj-1");
    assert.equal("storageKey" in item, false);
    assert.equal("actualCostUsd" in item, false);
    assert.equal(findForbiddenKeysInApprovalPayload(item).length, 0);
  });

  it("serializes approval detail with revisionRoundAvailable and safe images", () => {
    const detail = serializeClientApprovalDetail({
      id: "del-2",
      title: "Review me",
      description: "Body",
      tags: ["seo"],
      category: "Blog",
      scheduledPublishAt: new Date("2026-07-10T00:00:00.000Z"),
      status: "PENDING_CLIENT_REVIEW",
      bodyContent: "Hello",
      projectId: "proj-2",
      projectName: "Project",
      clientId: "client-2",
      clientName: "Client Co",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      revisionRoundAvailable: true,
      images: [
        {
          id: "img-1",
          title: "Hero",
          imageUrl: "https://cdn.example.com/hero.jpg",
          approvalStatus: "PENDING",
          rejectionReason: null
        }
      ]
    });

    assert.equal(detail.revisionRoundAvailable, true);
    assert.equal(detail.images[0]?.altText, "Hero");
    assert.equal(detail.scheduledPublishAt, "2026-07-10T00:00:00.000Z");
    const serialized = JSON.stringify(detail);
    for (const key of listForbiddenApprovalPayloadKeys()) {
      assert.equal(serialized.includes(key), false, `leaked ${key}`);
    }
  });

  it("defaults revisionRoundAvailable to true when omitted (pre-persistence)", () => {
    const detail = serializeClientApprovalDetail({
      id: "del-3",
      title: "T",
      status: "PENDING_CLIENT_REVIEW",
      bodyContent: "",
      projectId: "p",
      projectName: "P",
      clientId: "c",
      createdAt: "2026-07-02T00:00:00.000Z"
    });
    assert.equal(detail.revisionRoundAvailable, true);
    assert.equal(CLIENT_APPROVAL_SERIALIZER_VERSION.startsWith("CLIENT_APPROVAL"), true);
  });

  it("detects forbidden keys in unsafe raw payloads", () => {
    const found = findForbiddenKeysInApprovalPayload({
      id: "x",
      storageKey: "secret",
      nested: { providerMetadata: { model: "x" } }
    });
    assert.equal(found.includes("storageKey"), true);
    assert.equal(found.includes("providerMetadata"), true);
  });
});
