import type { RequestHandler } from "express";
import { failure } from "../utils/responses";

function skeletonResponse(message: string) {
  return failure("AUTH_SKELETON_ONLY", message, {
    phase: "skeleton"
  });
}

export const login: RequestHandler = (_req, res) => {
  res.status(501).json(skeletonResponse("Auth login is not enabled in this phase."));
};

export const logout: RequestHandler = (_req, res) => {
  res.status(501).json(skeletonResponse("Auth logout is not enabled in this phase."));
};

export const getCurrentUser: RequestHandler = (_req, res) => {
  res.status(501).json(skeletonResponse("Auth current-user lookup is not enabled in this phase."));
};

export const changePassword: RequestHandler = (_req, res) => {
  res.status(501).json(skeletonResponse("Auth password change is not enabled in this phase."));
};
