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
  ]
} as const;

export const WORDPRESS_LIVE_DRAFT_PROOF_PLAN_NOTE =
  "Plan-only. No live WordPress HTTP is authorized by these constants. Execution requires a separate owner-approved staging block.";
