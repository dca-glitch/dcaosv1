import type { RequestHandler } from "express";
import type { PermissionKey } from "../security/permission-keys";

export function createPermissionMiddleware(permissionKey: PermissionKey): RequestHandler {
  return (_req, _res, next) => {
    next(
      new Error(
        `Permission middleware skeleton is not mounted and is not production ready: ${permissionKey}`
      )
    );
  };
}

export const requirePermission = createPermissionMiddleware;
