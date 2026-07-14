import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AI_DELIVERY_DELIVERABLE_STATUSES } from "@dca-os-v1/shared";
import { AiDeliveryGuardError } from "./ai-delivery-guard-error";
import {
  AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED,
  AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED_MESSAGE,
  resolveAiDeliveryDeliverableCreateStatus
} from "./ai-delivery-deliverable-create-status-policy";

function assertBlockedCreateStatus(status: unknown) {
  assert.throws(
    () => resolveAiDeliveryDeliverableCreateStatus(status),
    (error: unknown) =>
      error instanceof AiDeliveryGuardError &&
      error.status === 400 &&
      error.code === AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED &&
      error.message === AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED_MESSAGE
  );
}

describe("ai delivery deliverable create status policy", () => {
  it("allows omitted and explicit draft status values", () => {
    assert.equal(resolveAiDeliveryDeliverableCreateStatus(undefined), "DRAFT");
    assert.equal(resolveAiDeliveryDeliverableCreateStatus("DRAFT"), "DRAFT");
    assert.equal(resolveAiDeliveryDeliverableCreateStatus("draft"), "DRAFT");
    assert.equal(resolveAiDeliveryDeliverableCreateStatus("  DrAfT  "), "DRAFT");
  });

  it("blocks explicit malformed values with the stable guard response", () => {
    for (const value of [null, "", "   ", 123, true, false, {}, [], "nonsense"]) {
      assertBlockedCreateStatus(value);
    }
  });

  it("blocks every canonical non-draft status", () => {
    for (const status of AI_DELIVERY_DELIVERABLE_STATUSES) {
      if (status === "DRAFT") {
        continue;
      }
      assertBlockedCreateStatus(status);
      assertBlockedCreateStatus(status.toLowerCase());
      assertBlockedCreateStatus(`  ${status.toLowerCase()}  `);
    }
  });
});
