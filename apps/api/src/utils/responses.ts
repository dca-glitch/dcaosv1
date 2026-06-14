import type { ApiErrorResponse, ApiSuccessResponse } from "@dca-os-v1/shared";

export const API_ERROR_CODES = {
  authUnauthorized: "AUTH_UNAUTHORIZED",
  authForbidden: "AUTH_FORBIDDEN",
  moduleInvalid: "MODULE_INVALID",
  moduleNotFound: "MODULE_NOT_FOUND",
  moduleTenantContextInvalid: "MODULE_TENANT_CONTEXT_INVALID",
  tenantSwitchInvalid: "TENANT_SWITCH_INVALID",
  tenantSettingsInvalid: "TENANT_SETTINGS_INVALID",
  tenantMemberInvalid: "TENANT_MEMBER_INVALID",
  tenantMemberNotFound: "TENANT_MEMBER_NOT_FOUND"
} as const;

export const API_ERROR_MESSAGES = {
  authorizationRequired: "Authorization is required.",
  accessForbidden: "Access is forbidden.",
  moduleInvalid: "Invalid module request.",
  moduleNotFound: "Module was not found.",
  moduleTenantContextInvalid: "Module tenant context is required.",
  tenantSwitchInvalid: "Invalid tenant switch request.",
  tenantSettingsInvalid: "Invalid tenant settings.",
  tenantMemberInvalid: "Invalid tenant member request.",
  tenantMemberNotFound: "Member was not found."
} as const;

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

export function unauthorizedFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.authUnauthorized, API_ERROR_MESSAGES.authorizationRequired);
}

export function forbiddenFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.authForbidden, API_ERROR_MESSAGES.accessForbidden);
}

export function moduleInvalidFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.moduleInvalid, API_ERROR_MESSAGES.moduleInvalid);
}

export function moduleNotFoundFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.moduleNotFound, API_ERROR_MESSAGES.moduleNotFound);
}

export function moduleTenantContextInvalidFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.moduleTenantContextInvalid, API_ERROR_MESSAGES.moduleTenantContextInvalid);
}

export function tenantSwitchInvalidFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.tenantSwitchInvalid, API_ERROR_MESSAGES.tenantSwitchInvalid);
}

export function tenantSettingsInvalidFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.tenantSettingsInvalid, API_ERROR_MESSAGES.tenantSettingsInvalid);
}

export function tenantMemberInvalidFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.tenantMemberInvalid, API_ERROR_MESSAGES.tenantMemberInvalid);
}

export function tenantMemberNotFoundFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.tenantMemberNotFound, API_ERROR_MESSAGES.tenantMemberNotFound);
}
