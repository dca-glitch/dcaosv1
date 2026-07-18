import express from "express";
import { rateLimit, securityHeaders } from "./middlewares";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { createV1Router } from "./routes/v1";
import { createWorkspaceAdminRouter } from "./routes/workspace-admin";
import { failure } from "./utils/responses";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(securityHeaders);
  app.use(rateLimit);
  app.use(express.json({ limit: "8mb" }));
  // The owner-approved first switch is deliberately literal /api/admin, not /api/v1.
  app.use("/api/admin", createWorkspaceAdminRouter());
  app.use("/api/v1", createV1Router());

  app.use((_req, res) => {
    res.status(404).json(failure("NOT_FOUND", "Route was not found."));
  });

  app.use(errorMiddleware);

  return app;
}
