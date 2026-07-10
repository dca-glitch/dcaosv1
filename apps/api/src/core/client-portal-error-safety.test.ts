import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertClientPortalPayloadHasNoForbiddenKeys,
  collectClientPortalForbiddenPayloadKeys,
  containsClientPortalUnsafeErrorContent,
  toClientPortalSafeErrorMessage
} from "./client-portal-error-safety";

describe("client portal error message safety (G204/G330/G570)", () => {
  it("strips stack traces and storage keys from client-facing messages", () => {
    const raw =
      "Failed at Object.open (C:\\app\\storage.ts:12:3)\nstorageKey=tenants/acme/private.pdf\nproviderMetadata=openai";
    const safe = toClientPortalSafeErrorMessage(raw, "Unable to complete request.");
    assert.equal(safe, "Unable to complete request.");
    assert.equal(containsClientPortalUnsafeErrorContent(raw), true);
  });

  it("replaces messages that mention cost, audit, or workflow internals", () => {
    for (const raw of [
      "actualCostUsd=12.50 billed",
      "estimatedCostUsd=9.1 estimated",
      "rawCost leaked",
      "auditLog write failed",
      "workflowRunId=run-99 crashed",
      "workflowRunStatus=FAILED",
      "jobQueueStatus=queued",
      "queueStatus=waiting",
      "adminSummaryNotes leaked",
      "executionLog step failed",
      "provider=openai failed"
    ]) {
      assert.equal(containsClientPortalUnsafeErrorContent(raw), true, raw);
      assert.equal(toClientPortalSafeErrorMessage(raw), "Request could not be completed.");
    }
  });

  it("preserves short client-safe messages", () => {
    assert.equal(
      toClientPortalSafeErrorMessage("Monthly report not found."),
      "Monthly report not found."
    );
  });

  it("replaces oversized messages even when content looks safe", () => {
    const longSafe = "x".repeat(241);
    assert.equal(toClientPortalSafeErrorMessage(longSafe, "Too long."), "Too long.");
  });

  it("detects forbidden payload keys recursively including provider and cost aliases (G329)", () => {
    const payload = {
      deliverable: {
        id: "d1",
        title: "Safe",
        nested: {
          storageKey: "tenants/x/y",
          workflowRunId: "run-1",
          provider: "openai",
          estimatedCostUsd: 3.3
        }
      },
      meta: { adminSummaryNotes: "internal", actualCostUsd: 1.2, costRows: [] }
    };

    const found = collectClientPortalForbiddenPayloadKeys(payload).sort();
    assert.deepEqual(found, [
      "actualCostUsd",
      "adminSummaryNotes",
      "costRows",
      "estimatedCostUsd",
      "provider",
      "storageKey",
      "workflowRunId"
    ]);
    assert.throws(() => assertClientPortalPayloadHasNoForbiddenKeys(payload));
  });

  it("replaces non-string raw errors with the safe fallback (G570)", () => {
    assert.equal(toClientPortalSafeErrorMessage({ message: "boom" }), "Request could not be completed.");
    assert.equal(toClientPortalSafeErrorMessage(null), "Request could not be completed.");
    assert.equal(toClientPortalSafeErrorMessage(42, "Fallback."), "Fallback.");
  });
});
