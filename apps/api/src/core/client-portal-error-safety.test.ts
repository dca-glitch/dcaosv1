import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertClientPortalPayloadHasNoForbiddenKeys,
  collectClientPortalForbiddenPayloadKeys,
  containsClientPortalUnsafeErrorContent,
  toClientPortalSafeErrorMessage
} from "./client-portal-error-safety";

describe("client portal error message safety (G204)", () => {
  it("strips stack traces and storage keys from client-facing messages", () => {
    const raw =
      "Failed at Object.open (C:\\app\\storage.ts:12:3)\nstorageKey=tenants/acme/private.pdf\nproviderMetadata=openai";
    const safe = toClientPortalSafeErrorMessage(raw, "Unable to complete request.");
    assert.equal(safe, "Unable to complete request.");
    assert.equal(containsClientPortalUnsafeErrorContent(raw), true);
  });

  it("preserves short client-safe messages", () => {
    assert.equal(
      toClientPortalSafeErrorMessage("Monthly report not found."),
      "Monthly report not found."
    );
  });

  it("detects forbidden payload keys recursively", () => {
    const payload = {
      deliverable: {
        id: "d1",
        title: "Safe",
        nested: { storageKey: "tenants/x/y", workflowRunId: "run-1" }
      },
      meta: { adminSummaryNotes: "internal", actualCostUsd: 1.2 }
    };

    const found = collectClientPortalForbiddenPayloadKeys(payload).sort();
    assert.deepEqual(found, ["actualCostUsd", "adminSummaryNotes", "storageKey", "workflowRunId"]);
    assert.throws(() => assertClientPortalPayloadHasNoForbiddenKeys(payload));
  });
});
