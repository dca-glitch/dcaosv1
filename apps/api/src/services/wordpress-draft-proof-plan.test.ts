import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertWordPressDraftProofPlanInvariants,
  WORDPRESS_LIVE_DRAFT_PROOF_ALLOWED_STATUS,
  WORDPRESS_LIVE_DRAFT_PROOF_PLAN_NOTE,
  WORDPRESS_LIVE_DRAFT_PROOF_STEPS,
  WORDPRESS_TEST_DRAFT_PROOF_MARKER,
  WORDPRESS_TEST_DRAFT_PROOF_TAG,
  WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN
} from "./wordpress-draft-proof-plan";

describe("wordpress-draft-proof-plan (G294/G295)", () => {
  it("defines create → verify → delete → no publish → rollback steps", () => {
    assert.deepEqual([...WORDPRESS_LIVE_DRAFT_PROOF_STEPS], [
      "create_draft",
      "verify_draft",
      "delete_or_trash_draft",
      "no_publish",
      "rollback_publish_env"
    ]);
    assert.deepEqual([...WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN.steps], [...WORDPRESS_LIVE_DRAFT_PROOF_STEPS]);
  });

  it("keeps proof constants staging-safe and draft-only", () => {
    assert.equal(WORDPRESS_TEST_DRAFT_PROOF_MARKER, "[DCA-OS-PROOF-DO-NOT-PUBLISH]");
    assert.equal(WORDPRESS_TEST_DRAFT_PROOF_TAG, "dca-proof");
    assert.equal(WORDPRESS_LIVE_DRAFT_PROOF_ALLOWED_STATUS, "draft");
    assert.equal(WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN.allowedStatus, "draft");
    assert.equal(WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN.restorePublishEnv, "WORDPRESS_PUBLISH_ENABLED=false");
    assert.deepEqual([...WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN.forbiddenStatuses], [
      "publish",
      "pending",
      "future"
    ]);
    assert.ok(WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN.evidenceRequired.includes("cleanupActionAndTimestamp"));
    assert.match(WORDPRESS_LIVE_DRAFT_PROOF_PLAN_NOTE, /Plan-only/);
    assert.match(WORDPRESS_LIVE_DRAFT_PROOF_PLAN_NOTE, /No live WordPress HTTP/);
  });

  it("asserts proof-plan invariants including delete/trash and publish forbidden", () => {
    assert.equal(assertWordPressDraftProofPlanInvariants(), true);
    assert.equal(WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN.deleteOrTrashRequired, true);
    assert.equal(WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN.publishForbidden, true);
    assert.equal(WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN.cleanupAction, "trash_or_delete_staging_test_draft");
  });

  it("requires rollback evidence fields for delete/trash close-out", () => {
    for (const key of [
      "ownerApprovalReference",
      "stagingOnlyTarget",
      "wordpressPostIdOrEditUrl",
      "cleanupActionAndTimestamp",
      "disabledSafeSmokeResult"
    ] as const) {
      assert.ok(WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN.evidenceRequired.includes(key));
    }
  });
});
