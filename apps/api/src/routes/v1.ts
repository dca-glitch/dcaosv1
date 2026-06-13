import { Router } from "express";
import { createHealthRouter } from "./health";
import { createModuleRouter } from "./modules";

export function createV1Router() {
  const router = Router();

  router.use("/health", createHealthRouter());
  router.use("/modules", createModuleRouter());

  return router;
}
