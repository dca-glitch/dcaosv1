import type { RequestHandler } from "express";
import { failure } from "../utils/responses";
import type { AuthSessionLocals } from "../auth/types";
import type { PermissionKey } from "../security/permission-keys";
import { CORE_PERMISSION_KEYS } from "../security/permission-keys";
import { hasPermission } from "../security/rbac";

type RoleKey = string;

const ROLE_PERMISSION_MAP: Record<RoleKey, readonly PermissionKey[]> = {
  owner: CORE_PERMISSION_KEYS,
  admin: CORE_PERMISSION_KEYS,
  local_tester: []
};

function getAuthSessionFromLocals(locals: unknown): AuthSessionLocals["authSession"] | undefined {
  const typedLocals = locals as AuthSessionLocals | undefined;
  return typedLocals?.authSession;
}

function getActiveRoles(authSession: NonNullable<AuthSessionLocals["authSession"]>): string[] {
  return authSession.tenantContext.activeMembership?.roles ?? [];
}

function getEffectivePermissions(authSession: NonNullable<AuthSessionLocals["authSession"]>): PermissionKey[] {
  const permissions = new Set<PermissionKey>();

  for (const role of getActiveRoles(authSession)) {
    const rolePermissions = ROLE_PERMISSION_MAP[role] ?? [];
    for (const permission of rolePermissions) {
      permissions.add(permission);
    }
  }

  return [...permissions];
}

function isAuthorizedForRoles(
  authSession: NonNullable<AuthSessionLocals["authSession"]>,
  requiredRoles: readonly RoleKey[]
): boolean {
  const activeRoles = new Set(getActiveRoles(authSession));
  return requiredRoles.length > 0 && requiredRoles.some((role) => activeRoles.has(role));
}

function isAuthorizedForPermissions(
  authSession: NonNullable<AuthSessionLocals["authSession"]>,
  requiredPermissions: readonly PermissionKey[]
): boolean {
  const effectivePermissions = getEffectivePermissions(authSession);
  const permissionContext = {
    actorType: "USER" as const,
    requestId: undefined,
    userId: authSession.user.id,
    tenantId: authSession.tenantContext.activeMembership?.tenantId ?? "",
    tenantMembershipId: authSession.tenantContext.activeMembership?.tenantMembershipId ?? "",
    roles: getActiveRoles(authSession),
    permissions: effectivePermissions
  };

  return requiredPermissions.length > 0 && requiredPermissions.every((permission) =>
    hasPermission(permissionContext, permission)
  );
}

function getAuthorizationGuardFailure(authSession: AuthSessionLocals["authSession"]): {
  status: number;
  code: string;
  message: string;
} {
  if (!authSession) {
    return {
      status: 401,
      code: "AUTH_UNAUTHORIZED",
      message: "Authorization is required."
    };
  }

  return {
    status: 403,
    code: "AUTH_FORBIDDEN",
    message: "Access is forbidden."
  };
}

function createAuthorizationMiddleware(
  evaluator: (authSession: NonNullable<AuthSessionLocals["authSession"]>) => boolean
): RequestHandler {
  return (_req, res, next) => {
    const authSession = getAuthSessionFromLocals(res.locals);
    if (!authSession) {
      const failureResponse = getAuthorizationGuardFailure(authSession);
      res.status(failureResponse.status).json(failure(failureResponse.code, failureResponse.message));
      return;
    }

    if (!authSession.tenantContext.activeMembership) {
      res.status(403).json(failure("AUTH_FORBIDDEN", "Access is forbidden."));
      return;
    }

    if (!evaluator(authSession)) {
      res.status(403).json(failure("AUTH_FORBIDDEN", "Access is forbidden."));
      return;
    }

    next();
  };
}

export function createRoleMiddleware(...requiredRoles: RoleKey[]): RequestHandler {
  return createAuthorizationMiddleware((authSession) =>
    isAuthorizedForRoles(authSession, requiredRoles)
  );
}

export function createPermissionMiddleware(...requiredPermissions: PermissionKey[]): RequestHandler {
  return createAuthorizationMiddleware((authSession) =>
    isAuthorizedForPermissions(authSession, requiredPermissions)
  );
}

export const requireRole = createRoleMiddleware;
export const requirePermission = createPermissionMiddleware;

export function resolveActiveRoles(authSession: NonNullable<AuthSessionLocals["authSession"]>): string[] {
  return getActiveRoles(authSession);
}

export function resolveEffectivePermissions(
  authSession: NonNullable<AuthSessionLocals["authSession"]>
): PermissionKey[] {
  return getEffectivePermissions(authSession);
}
