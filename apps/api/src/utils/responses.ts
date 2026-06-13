import type { ApiErrorResponse, ApiSuccessResponse } from "@dca-os-v1/shared";

export function success<T>(data: T, meta?: Record<string, unknown>): ApiSuccessResponse<T> {
  return {
    ok: true,
    data,
    ...(meta ? { meta } : {})
  };
}

export function failure(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiErrorResponse {
  return {
    ok: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  };
}
