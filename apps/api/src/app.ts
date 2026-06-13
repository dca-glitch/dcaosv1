import express from "express";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { createV1Router } from "./routes/v1";
import { failure } from "./utils/responses";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use("/api/v1", createV1Router());

  app.use((_req, res) => {
    res.status(404).json(failure("NOT_FOUND", "Route was not found."));
  });

  app.use(errorMiddleware);

  return app;
}
