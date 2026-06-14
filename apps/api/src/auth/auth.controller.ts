import type { RequestHandler } from "express";
import { failure, success } from "../utils/responses";
import { resolveActiveRoles, resolveEffectivePermissions } from "../middlewares/authorization.middleware";
import type { AuthSessionLocals } from "./types";
import { revokeAuthSession, toCurrentUserResponse } from "./session-context.runtime";
import type { AuthAuthorizationContextResponse } from "./types";

function skeletonResponse(message: string) {
  return failure("AUTH_SKELETON_ONLY", message, {
    phase: "skeleton"
  });
}

function toAuthorizationContextResponse(
  authSession: NonNullable<AuthSessionLocals["authSession"]>
): AuthAuthorizationContextResponse {
  const activeMembership = authSession.tenantContext.activeMembership;
  const roles = resolveActiveRoles(authSession);
  const effectivePermissions = resolveEffectivePermissions(authSession);

  return {
    user: authSession.user,
    tenantContext: {
      activeTenant: activeMembership
        ? {
            tenantId: activeMembership.tenantId,
            tenantMembershipId: activeMembership.tenantMembershipId
          }
        : null,
      activeMembership,
      memberships: authSession.tenantContext.memberships,
      roles
    },
    effectivePermissions
  };
}

export const login: RequestHandler = (_req, res) => {
  res.status(501).json(skeletonResponse("Auth login is not enabled in this phase."));
};

export const logout: RequestHandler = async (_req, res) => {
  const authSession = (res.locals as AuthSessionLocals).authSession;
  if (!authSession) {
    res.status(401).json(failure("AUTH_UNAUTHORIZED", "Authorization is required."));
    return;
  }

  try {
    const revokedAt = await revokeAuthSession(authSession.session.id);
    res.json(
      success(
        {
          loggedOut: true,
          revokedAt: revokedAt.toISOString()
        },
        {
          phase: "runtime",
          auth: "controlled-mvp"
        }
      )
    );
  } catch {
    res.status(500).json(failure("AUTH_RUNTIME_ERROR", "Auth logout could not be completed."));
  }
};

export const getCurrentUser: RequestHandler = (_req, res) => {
  const authSession = (res.locals as AuthSessionLocals).authSession;
  if (!authSession) {
    res.status(401).json(failure("AUTH_UNAUTHORIZED", "Authorization is required."));
    return;
  }

  res.json(
    success(toCurrentUserResponse(authSession), {
      phase: "runtime",
      auth: "controlled-mvp"
    })
  );
};

export const getAuthContext: RequestHandler = (_req, res) => {
  const authSession = (res.locals as AuthSessionLocals).authSession;
  if (!authSession) {
    res.status(401).json(failure("AUTH_UNAUTHORIZED", "Authorization is required."));
    return;
  }

  res.json(
    success(toAuthorizationContextResponse(authSession), {
      phase: "runtime",
      auth: "controlled-mvp"
    })
  );
};

export const changePassword: RequestHandler = (_req, res) => {
  res.status(501).json(skeletonResponse("Auth password change is not enabled in this phase."));
};
