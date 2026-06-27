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

function buildErrorDetails(error: unknown): Record<string, unknown> | undefined {
  if (process.env.NODE_ENV === "production") {
    return undefined;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      stack: error.stack
    };
  }

  return {
    value: typeof error === "string" ? error : "Non-error throw value"
  };
}

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    const details = {
      ...(error.details ?? {}),
      ...(buildErrorDetails(error) ?? {})
    };

    res.status(error.statusCode).json(
      failure(error.code, error.message, Object.keys(details).length > 0 ? details : undefined)
    );
    return;
  }

  res.status(500).json(
    failure("INTERNAL_SERVER_ERROR", "Unexpected server error.", buildErrorDetails(error))
  );
};
