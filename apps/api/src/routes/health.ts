import { Router } from "express";
import type { HealthResponse } from "@dca-os-v1/shared";
import { success } from "../utils/responses";

export function createHealthRouter() {
  const router = Router();

  router.get("/", (_req, res) => {
    const health: HealthResponse = {
      service: "dca-os-v1-api",
      status: "ok",
      version: "0.1.0"
    };

    res.json(success(health));
  });

  return router;
}
