/**
 * Standalone AI Delivery guard error.
 *
 * Kept in its own tiny module (no prisma / no heavy runtime imports) so lightweight
 * runtime and unit-test modules can throw/detect guard errors without pulling in the
 * full core.runtime graph. core.runtime re-exports these for backward compatibility.
 */

export class AiDeliveryGuardError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AiDeliveryGuardError";
    this.status = status;
    this.code = code;
  }
}

export function isAiDeliveryGuardError(error: unknown): error is AiDeliveryGuardError {
  return error instanceof AiDeliveryGuardError;
}
