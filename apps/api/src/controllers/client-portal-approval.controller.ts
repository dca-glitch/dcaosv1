import type { RequestHandler } from "express";
import type { AuthSessionLocals } from "../auth/types";
import {
  approveClientPortalDeliverable,
  approveClientPortalDeliverableImage,
  getClientPortalDeliverableForApproval,
  listClientPortalPendingApprovals,
  patchClientPortalDeliverableBody,
  rejectClientPortalDeliverable,
  rejectClientPortalDeliverableImage,
  undoClientPortalDeliverableImageReview
} from "../core/client-portal-approval.runtime";
import { failure, forbiddenFailure, success, unauthorizedFailure } from "../utils/responses";

function getAuthSession(locals: AuthSessionLocals) {
  return locals.authSession ?? null;
}

export const listClientPortalPendingApprovalsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals as AuthSessionLocals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const clientId = typeof req.params.clientId === "string" ? req.params.clientId.trim() : undefined;
  const result = await listClientPortalPendingApprovals(authSession, clientId);
  if (!result) {
    res.status(403).json(forbiddenFailure());
    return;
  }
  res.status(200).json(success(result));
};

export const getClientPortalDeliverableForApprovalHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals as AuthSessionLocals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  if (!deliverableId) {
    res.status(400).json(failure("CLIENT_APPROVAL_INVALID", "Deliverable id is required."));
    return;
  }

  const result = await getClientPortalDeliverableForApproval(authSession, deliverableId);
  if (!result) {
    res.status(403).json(forbiddenFailure());
    return;
  }
  if ("error" in result && result.error === "ALREADY_REVIEWED") {
    res.status(409).json(failure("CLIENT_APPROVAL_ALREADY_REVIEWED", "This article has already been reviewed."));
    return;
  }
  res.status(200).json(success(result));
};

export const patchClientPortalDeliverableBodyHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals as AuthSessionLocals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  const body = (req.body ?? {}) as { bodyContent?: unknown };
  const bodyContent = typeof body.bodyContent === "string" ? body.bodyContent : "";
  if (!deliverableId) {
    res.status(400).json(failure("CLIENT_APPROVAL_INVALID", "Deliverable id is required."));
    return;
  }

  const result = await patchClientPortalDeliverableBody(authSession, deliverableId, bodyContent);
  if (!result) {
    res.status(403).json(forbiddenFailure());
    return;
  }
  res.status(200).json(success(result));
};

export const approveClientPortalDeliverableImageHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals as AuthSessionLocals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  const imageId = typeof req.params.imageId === "string" ? req.params.imageId.trim() : "";
  if (!deliverableId || !imageId) {
    res.status(400).json(failure("CLIENT_APPROVAL_INVALID", "Deliverable and image ids are required."));
    return;
  }

  const result = await approveClientPortalDeliverableImage(authSession, deliverableId, imageId);
  if (!result) {
    res.status(403).json(forbiddenFailure());
    return;
  }
  res.status(200).json(success(result));
};

export const rejectClientPortalDeliverableImageHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals as AuthSessionLocals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  const imageId = typeof req.params.imageId === "string" ? req.params.imageId.trim() : "";
  const body = (req.body ?? {}) as { rejectionReason?: unknown };
  const rejectionReason = typeof body.rejectionReason === "string" ? body.rejectionReason : "";
  if (!deliverableId || !imageId) {
    res.status(400).json(failure("CLIENT_APPROVAL_INVALID", "Deliverable and image ids are required."));
    return;
  }

  const result = await rejectClientPortalDeliverableImage(authSession, deliverableId, imageId, rejectionReason);
  if (!result) {
    res.status(400).json(failure("CLIENT_APPROVAL_INVALID", "Image rejection could not be saved."));
    return;
  }
  res.status(200).json(success(result));
};

export const undoClientPortalDeliverableImageReviewHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals as AuthSessionLocals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  const imageId = typeof req.params.imageId === "string" ? req.params.imageId.trim() : "";
  if (!deliverableId || !imageId) {
    res.status(400).json(failure("CLIENT_APPROVAL_INVALID", "Deliverable and image ids are required."));
    return;
  }

  const result = await undoClientPortalDeliverableImageReview(authSession, deliverableId, imageId);
  if (!result) {
    res.status(403).json(forbiddenFailure());
    return;
  }
  res.status(200).json(success(result));
};

export const approveClientPortalDeliverableHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals as AuthSessionLocals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  if (!deliverableId) {
    res.status(400).json(failure("CLIENT_APPROVAL_INVALID", "Deliverable id is required."));
    return;
  }

  const result = await approveClientPortalDeliverable(authSession, deliverableId);
  if (!result) {
    res.status(403).json(forbiddenFailure());
    return;
  }
  if ("error" in result) {
    if (result.error === "ALREADY_APPROVED") {
      res.status(409).json(failure("CLIENT_APPROVAL_ALREADY_APPROVED", "This article has already been approved."));
      return;
    }
    if (result.error === "IMAGES_PENDING") {
      res.status(400).json(failure("CLIENT_APPROVAL_IMAGES_PENDING", "Approve or reject all images before approving the article."));
      return;
    }
  }
  res.status(200).json(success(result));
};

export const rejectClientPortalDeliverableHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals as AuthSessionLocals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  const body = (req.body ?? {}) as { rejectionReason?: unknown };
  const rejectionReason = typeof body.rejectionReason === "string" ? body.rejectionReason : "";
  if (!deliverableId) {
    res.status(400).json(failure("CLIENT_APPROVAL_INVALID", "Deliverable id is required."));
    return;
  }

  const result = await rejectClientPortalDeliverable(authSession, deliverableId, rejectionReason);
  if (!result) {
    res.status(400).json(failure("CLIENT_APPROVAL_INVALID", "Article rejection could not be saved."));
    return;
  }
  res.status(200).json(success(result));
};
