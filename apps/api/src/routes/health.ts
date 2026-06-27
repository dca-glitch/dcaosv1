import { Router } from "express";
import { failure, success } from "../utils/responses";
import { probeDbReadiness, type DbReadinessResult } from "../health/db-readiness";

type ApiHealthResponse = {
  service: "dca-os-v1-api";
  status: "ok";
  version: string;
  database: DbReadinessResult;
};

export function createHealthRouter() {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      const database = await probeDbReadiness();
      if (database.status !== "ready") {
        res.status(503).json(failure("DATABASE_UNAVAILABLE", database.message, { database }));
        return;
      }

      const health: ApiHealthResponse = {
        service: "dca-os-v1-api",
        status: "ok",
        version: "0.1.0",
        database
      };

      res.json(success(health));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
