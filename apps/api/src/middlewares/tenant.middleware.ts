import type { RequestHandler } from "express";

export function createTenantMiddleware(): RequestHandler {
  return (_req, _res, next) => {
    next(new Error("Tenant middleware skeleton is not mounted and is not production ready."));
  };
}

export const requireTenant = createTenantMiddleware();
