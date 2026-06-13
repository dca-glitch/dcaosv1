import type { ErrorRequestHandler } from "express";
import { failure } from "../utils/responses";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json(failure(error.code, error.message, error.details));
    return;
  }

  res.status(500).json(failure("INTERNAL_SERVER_ERROR", "Unexpected server error."));
};
