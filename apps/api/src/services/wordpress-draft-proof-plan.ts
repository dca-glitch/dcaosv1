/**
 * Live WordPress draft proof plan constants (plan-only, no HTTP).
 *
 * Documents the future owner-approved staging session sequence:
 * create draft → verify → delete/trash → no publish → rollback env.
 * This module does not authorize or perform any live WordPress call.
 */

export const WORDPRESS_TEST_DRAFT_PROOF_MARKER = "[DCA-OS-PROOF-DO-NOT-PUBLISH]";
export const WORDPRESS_TEST_DRAFT_PROOF_TAG = "dca-proof";
export const WORDPRESS_LIVE_DRAFT_PROOF_ALLOWED_STATUS = "draft" as const;

export const WORDPRESS_LIVE_DRAFT_PROOF_STEPS = [
  "create_draft",
  "verify_draft",
  "delete_or_trash_draft",
  "no_publish",
  "rollback_publish_env"
] as const;

export type WordPressLiveDraftProofStep = (typeof WORDPRESS_LIVE_DRAFT_PROOF_STEPS)[number];

export const WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN = {
  marker: WORDPRESS_TEST_DRAFT_PROOF_MARKER,
  tag: WORDPRESS_TEST_DRAFT_PROOF_TAG,
  allowedStatus: WORDPRESS_LIVE_DRAFT_PROOF_ALLOWED_STATUS,
  steps: WORDPRESS_LIVE_DRAFT_PROOF_STEPS,
  cleanupAction: "trash_or_delete_staging_test_draft",
  restorePublishEnv: "WORDPRESS_PUBLISH_ENABLED=false",
  forbiddenStatuses: ["publish", "pending", "future"] as const,
  evidenceRequired: [
    "ownerApprovalReference",
    "stagingOnlyTarget",
    "wordpressPostIdOrEditUrl",
    "cleanupActionAndTimestamp",
    "disabledSafeSmokeResult"
  ],
  /**
   * Delete/trash must happen before session close-out; never leave a proof draft published.
   */
  deleteOrTrashRequired: true,
  publishForbidden: true
} as const;

export const WORDPRESS_LIVE_DRAFT_PROOF_PLAN_NOTE =
  "Plan-only. No live WordPress HTTP is authorized by these constants. Execution requires a separate owner-approved staging block.";

/**
 * Invariant: proof plan is draft-only, includes delete/trash, and never authorizes publish.
 */
export function assertWordPressDraftProofPlanInvariants(): boolean {
  const plan = WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN;
  if (plan.allowedStatus !== "draft") {
    return false;
  }
  if (!plan.deleteOrTrashRequired || !plan.publishForbidden) {
    return false;
  }
  if (!plan.steps.includes("delete_or_trash_draft") || !plan.steps.includes("no_publish")) {
    return false;
  }
  if (plan.forbiddenStatuses.includes("draft" as never)) {
    return false;
  }
  for (const status of ["publish", "pending", "future"] as const) {
    if (!plan.forbiddenStatuses.includes(status)) {
      return false;
    }
  }
  return true;
}
