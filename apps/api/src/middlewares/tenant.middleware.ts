import type { RequestHandler } from "express";
import { forbiddenFailure, unauthorizedFailure } from "../utils/responses";
import type { AuthSessionLocals } from "../auth/types";

export function createTenantMiddleware(): RequestHandler {
  return (_req, res, next) => {
    const authSession = (res.locals as AuthSessionLocals).authSession;

    if (!authSession) {
      res.status(401).json(unauthorizedFailure());
      return;
    }

    if (!authSession.tenantContext.activeMembership) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    next();
  };
}

export const requireTenant = createTenantMiddleware();
