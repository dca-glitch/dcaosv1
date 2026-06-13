import { Router } from "express";
import { createAuthRouter } from "./auth.routes";
import { createHealthRouter } from "./health";
import { createModuleRouter } from "./modules";

export function createV1Router() {
  const router = Router();

  router.use("/auth", createAuthRouter());
  router.use("/health", createHealthRouter());
  router.use("/modules", createModuleRouter());

  return router;
}
