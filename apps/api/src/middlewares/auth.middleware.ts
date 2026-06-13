import type { RequestHandler } from "express";

export function createAuthMiddleware(): RequestHandler {
  return (_req, _res, next) => {
    next(new Error("Auth middleware skeleton is not mounted and is not production ready."));
  };
}

export const requireAuth = createAuthMiddleware();
