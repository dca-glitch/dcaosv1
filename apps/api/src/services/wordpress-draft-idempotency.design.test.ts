import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWordPressDraftIdempotencyKey,
  getWordPressDraftIdempotencyDesignDecision,
  WORDPRESS_DRAFT_IDEMPOTENCY_DESIGN_VERSION
} from "./wordpress-draft-idempotency.design";

describe("wordpress-draft-idempotency.design", () => {
  it("builds a stable key from tenant, deliverable, target, and attempt", () => {
    const key = buildWordPressDraftIdempotencyKey({
      tenantId: "tenant-1",
      deliverableId: "del-1",
      publicationTargetId: "target-1",
      attemptCounter: 2
    });
    assert.equal(key, "wp-draft|tenant-1|del-1|target-1|attempt-2");
    assert.equal(
      buildWordPressDraftIdempotencyKey({
        tenantId: "tenant-1",
        deliverableId: "del-1",
        publicationTargetId: "target-1",
        attemptCounter: 2
      }),
      key
    );
  });

  it("defaults missing target and attempt, and rejects empty ids", () => {
    assert.equal(
      buildWordPressDraftIdempotencyKey({
        tenantId: " t1 ",
        deliverableId: " d1 "
      }),
      "wp-draft|t1|d1|default-target|attempt-1"
    );
    assert.throws(() =>
      buildWordPressDraftIdempotencyKey({
        tenantId: "  ",
        deliverableId: "d1"
      })
    );
  });

  it("records design-helper + manual-check-until-live-gate decision without schema claim", () => {
    const decision = getWordPressDraftIdempotencyDesignDecision();
    assert.equal(decision.version, WORDPRESS_DRAFT_IDEMPOTENCY_DESIGN_VERSION);
    assert.equal(decision.designHelperImplemented, true);
    assert.equal(decision.schemaPersistedKey, false);
    assert.equal(decision.liveProofPolicy, "design_helper_plus_manual_check_until_live_gate");
    assert.equal(decision.liveHttpDeferred, true);
  });
});
