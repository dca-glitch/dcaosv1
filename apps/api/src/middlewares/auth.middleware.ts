import type { RequestHandler } from "express";
import { failure } from "../utils/responses";
import { extractBearerToken, resolveAuthSessionContext } from "../auth/session-context.runtime";

export function createAuthMiddleware(): RequestHandler {
  return async (req, res, next) => {
    const token = extractBearerToken(req.get("authorization"));

    if (!token) {
      res.status(401).json(failure("AUTH_UNAUTHORIZED", "Authorization is required."));
      return;
    }

    try {
      const authSession = await resolveAuthSessionContext(token);

      if (!authSession) {
        res.status(401).json(failure("AUTH_UNAUTHORIZED", "Authorization is required."));
        return;
      }

      res.locals.authSession = authSession;
      next();
    } catch {
      res.status(401).json(failure("AUTH_UNAUTHORIZED", "Authorization is required."));
    }
  };
}

export const requireAuth = createAuthMiddleware();
