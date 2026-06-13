import { Router } from "express";
import { getModuleDefinition, listModuleDefinitions } from "../controllers/moduleController";

export function createModuleRouter() {
  const router = Router();

  router.get("/", listModuleDefinitions);
  router.get("/:key", getModuleDefinition);

  return router;
}
