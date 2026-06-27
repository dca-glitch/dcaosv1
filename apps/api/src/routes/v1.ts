import { Router } from "express";
import { createAuthRouter } from "./auth.routes";
import { createClientPortalRouter } from "./client-portal";
import { createCoreRouter } from "./core";
import { createHealthRouter } from "./health";
import { createModuleRouter } from "./modules";
import { createTenantRouter } from "./tenants";

export function createV1Router() {
  const router = Router();

  router.use("/auth", createAuthRouter());
  router.use("/client-portal", createClientPortalRouter());
  router.use("/", createCoreRouter());
  router.use("/health", createHealthRouter());
  router.use("/modules", createModuleRouter());
  router.use("/tenants", createTenantRouter());

  return router;
}
