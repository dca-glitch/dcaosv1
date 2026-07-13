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

function isBodyParserJsonError(error: unknown): boolean {
  if (!(error instanceof SyntaxError)) {
    return false;
  }

  const candidate = error as SyntaxError & { status?: number; type?: string };
  return candidate.status === 400 && candidate.type === "entity.parse.failed";
}

function buildErrorDetails(error: unknown): Record<string, unknown> | undefined {
  if (process.env.NODE_ENV === "production") {
    return undefined;
  }

  // Never return stack traces or filesystem paths to API clients.
  if (error instanceof Error) {
    return {
      name: error.name
    };
  }

  return {
    value: typeof error === "string" ? error : "Non-error throw value"
  };
}

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (isBodyParserJsonError(error)) {
    res.status(400).json(failure("INVALID_JSON", "Request body must be valid JSON."));
    return;
  }

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
