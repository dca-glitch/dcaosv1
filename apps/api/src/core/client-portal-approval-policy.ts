/**
 * Pure client-portal approval action policy (G202 / G577–G580).
 * Encodes allow/deny for approve, request-changes, image reject-with-reason,
 * one revision round, and whether admin should be notified — no I/O.
 */

import {
  evaluateRevisionRound,
  revisionRoundStateFromUsedFlag,
  REVISION_ROUND_EXHAUSTED_MESSAGE
} from "./revision-policy";

export type ClientPortalApprovalActionType =
  | "approve_deliverable"
  | "request_changes"
  | "approve_image"
  | "reject_image"
  | "undo_image_review";

export type ClientPortalApprovalActionInput = {
  action: ClientPortalApprovalActionType;
  deliverableStatus: string;
  /** True when the client already consumed the single revision round for this deliverable. */
  revisionRoundUsed?: boolean;
  /** Required for request_changes and reject_image. */
  reason?: string | null;
  /** Image ids attached to the deliverable (empty = no images). */
  imageIds?: string[];
  /** Current image approval rows. */
  imageApprovals?: Array<{ articleImageId: string; status: string }>;
  /** Target image for image-level actions. */
  imageId?: string | null;
};

export type ClientPortalApprovalPolicySuccess = {
  ok: true;
  action: ClientPortalApprovalActionType;
  /** Deliverable status after a successful deliverable-level action. */
  nextDeliverableStatus?: "APPROVED_BY_CLIENT" | "DRAFT";
  /** Image approval status after a successful image-level action. */
  nextImageStatus?: "APPROVED" | "REJECTED" | "PENDING";
  notifyAdmin: boolean;
  notificationKind?: "AI_DELIVERY_APPROVED" | "AI_DELIVERY_REVIEW_REQUEST";
  /** True when this action consumes the single client revision round. */
  revisionRoundConsumed?: boolean;
  sanitizedReason?: string;
};

export type ClientPortalApprovalPolicyFailure = {
  ok: false;
  code:
    | "NOT_PENDING_REVIEW"
    | "ALREADY_APPROVED"
    | "IMAGES_PENDING"
    | "REASON_REQUIRED"
    | "REVISION_ROUND_EXHAUSTED"
    | "IMAGE_NOT_FOUND"
    | "INVALID_ACTION";
  message: string;
};

export type ClientPortalApprovalPolicyResult =
  | ClientPortalApprovalPolicySuccess
  | ClientPortalApprovalPolicyFailure;

const CLIENT_SAFE_POLICY_MESSAGES: Record<ClientPortalApprovalPolicyFailure["code"], string> = {
  NOT_PENDING_REVIEW: "This article is not awaiting client review.",
  ALREADY_APPROVED: "This article has already been approved.",
  IMAGES_PENDING: "Approve or reject all images before approving the article.",
  REASON_REQUIRED: "A reason is required.",
  REVISION_ROUND_EXHAUSTED: REVISION_ROUND_EXHAUSTED_MESSAGE,
  IMAGE_NOT_FOUND: "Image was not found for this article.",
  INVALID_ACTION: "This approval action is not allowed."
};

export function getClientPortalApprovalPolicyMessage(
  code: ClientPortalApprovalPolicyFailure["code"]
): string {
  return CLIENT_SAFE_POLICY_MESSAGES[code];
}

function sanitizeReason(reason: string | null | undefined): string {
  return typeof reason === "string" ? reason.trim() : "";
}

/** G580 — image reject requires a non-empty sanitized reason. */
export function evaluateImageRejectReasonPolicy(reason: string | null | undefined): {
  ok: boolean;
  sanitizedReason?: string;
  code?: "REASON_REQUIRED";
  message?: string;
} {
  const sanitizedReason = sanitizeReason(reason);
  if (!sanitizedReason) {
    return {
      ok: false,
      code: "REASON_REQUIRED",
      message: CLIENT_SAFE_POLICY_MESSAGES.REASON_REQUIRED
    };
  }
  return { ok: true, sanitizedReason };
}

/** G578 — request-changes requires a non-empty sanitized reason. */
export function evaluateRequestChangesReasonPolicy(reason: string | null | undefined): {
  ok: boolean;
  sanitizedReason?: string;
  code?: "REASON_REQUIRED";
  message?: string;
} {
  return evaluateImageRejectReasonPolicy(reason);
}

function allImagesReviewed(
  imageIds: string[],
  approvals: Array<{ articleImageId: string; status: string }>
): boolean {
  if (imageIds.length === 0) return true;
  return imageIds.every((imageId) => {
    const approval = approvals.find((row) => row.articleImageId === imageId);
    return approval && (approval.status === "APPROVED" || approval.status === "REJECTED");
  });
}

export function evaluateClientPortalApprovalAction(
  input: ClientPortalApprovalActionInput
): ClientPortalApprovalPolicyResult {
  const { action, deliverableStatus } = input;
  const imageIds = input.imageIds ?? [];
  const imageApprovals = input.imageApprovals ?? [];
  const revisionRoundUsed = input.revisionRoundUsed === true;

  if (action === "approve_deliverable") {
    if (deliverableStatus === "APPROVED_BY_CLIENT") {
      return { ok: false, code: "ALREADY_APPROVED", message: CLIENT_SAFE_POLICY_MESSAGES.ALREADY_APPROVED };
    }
    if (deliverableStatus !== "PENDING_CLIENT_REVIEW") {
      return { ok: false, code: "NOT_PENDING_REVIEW", message: CLIENT_SAFE_POLICY_MESSAGES.NOT_PENDING_REVIEW };
    }
    if (!allImagesReviewed(imageIds, imageApprovals)) {
      return { ok: false, code: "IMAGES_PENDING", message: CLIENT_SAFE_POLICY_MESSAGES.IMAGES_PENDING };
    }
    return {
      ok: true,
      action,
      nextDeliverableStatus: "APPROVED_BY_CLIENT",
      notifyAdmin: true,
      notificationKind: "AI_DELIVERY_APPROVED"
    };
  }

  if (action === "request_changes") {
    if (deliverableStatus !== "PENDING_CLIENT_REVIEW") {
      return { ok: false, code: "NOT_PENDING_REVIEW", message: CLIENT_SAFE_POLICY_MESSAGES.NOT_PENDING_REVIEW };
    }
    const revision = evaluateRevisionRound(revisionRoundStateFromUsedFlag(revisionRoundUsed));
    if (!revision.ok) {
      return {
        ok: false,
        code: "REVISION_ROUND_EXHAUSTED",
        message: CLIENT_SAFE_POLICY_MESSAGES.REVISION_ROUND_EXHAUSTED
      };
    }
    const reasonPolicy = evaluateRequestChangesReasonPolicy(input.reason);
    if (!reasonPolicy.ok) {
      return {
        ok: false,
        code: "REASON_REQUIRED",
        message: CLIENT_SAFE_POLICY_MESSAGES.REASON_REQUIRED
      };
    }
    return {
      ok: true,
      action,
      nextDeliverableStatus: "DRAFT",
      notifyAdmin: true,
      notificationKind: "AI_DELIVERY_REVIEW_REQUEST",
      revisionRoundConsumed: true,
      sanitizedReason: reasonPolicy.sanitizedReason
    };
  }

  if (action === "approve_image" || action === "reject_image" || action === "undo_image_review") {
    if (deliverableStatus !== "PENDING_CLIENT_REVIEW") {
      return { ok: false, code: "NOT_PENDING_REVIEW", message: CLIENT_SAFE_POLICY_MESSAGES.NOT_PENDING_REVIEW };
    }
    const imageId = typeof input.imageId === "string" ? input.imageId.trim() : "";
    if (!imageId || !imageIds.includes(imageId)) {
      return { ok: false, code: "IMAGE_NOT_FOUND", message: CLIENT_SAFE_POLICY_MESSAGES.IMAGE_NOT_FOUND };
    }

    if (action === "approve_image") {
      return {
        ok: true,
        action,
        nextImageStatus: "APPROVED",
        notifyAdmin: false
      };
    }

    if (action === "reject_image") {
      const reasonPolicy = evaluateImageRejectReasonPolicy(input.reason);
      if (!reasonPolicy.ok) {
        return {
          ok: false,
          code: "REASON_REQUIRED",
          message: CLIENT_SAFE_POLICY_MESSAGES.REASON_REQUIRED
        };
      }
      return {
        ok: true,
        action,
        nextImageStatus: "REJECTED",
        notifyAdmin: false,
        sanitizedReason: reasonPolicy.sanitizedReason
      };
    }

    return {
      ok: true,
      action,
      nextImageStatus: "PENDING",
      notifyAdmin: false
    };
  }

  return { ok: false, code: "INVALID_ACTION", message: CLIENT_SAFE_POLICY_MESSAGES.INVALID_ACTION };
}
