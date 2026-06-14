import type { RequestHandler } from "express";
import { failure } from "../utils/responses";
import type { AuthSessionLocals } from "../auth/types";

export function createTenantMiddleware(): RequestHandler {
  return (_req, res, next) => {
    const authSession = (res.locals as AuthSessionLocals).authSession;

    if (!authSession) {
      res.status(401).json(failure("AUTH_UNAUTHORIZED", "Authorization is required."));
      return;
    }

    if (!authSession.tenantContext.activeMembership) {
      res.status(403).json(failure("AUTH_FORBIDDEN", "Access is forbidden."));
      return;
    }

    next();
  };
}

export const requireTenant = createTenantMiddleware();
