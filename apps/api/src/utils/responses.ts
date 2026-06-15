import type { ApiErrorResponse, ApiSuccessResponse } from "@dca-os-v1/shared";

export const API_ERROR_CODES = {
  authUnauthorized: "AUTH_UNAUTHORIZED",
  authForbidden: "AUTH_FORBIDDEN",
  companyProfileInvalid: "COMPANY_PROFILE_INVALID",
  clientInvalid: "CLIENT_INVALID",
  clientNotFound: "CLIENT_NOT_FOUND",
  projectInvalid: "PROJECT_INVALID",
  projectNotFound: "PROJECT_NOT_FOUND",
  taskInvalid: "TASK_INVALID",
  taskNotFound: "TASK_NOT_FOUND",
  invoiceInvalid: "INVOICE_INVALID",
  invoiceNotFound: "INVOICE_NOT_FOUND",
  recurringInvoiceInvalid: "RECURRING_INVOICE_INVALID",
  recurringInvoiceNotFound: "RECURRING_INVOICE_NOT_FOUND",
  billInvalid: "BILL_INVALID",
  billNotFound: "BILL_NOT_FOUND",
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
  companyProfileInvalid: "Invalid company profile request.",
  clientInvalid: "Invalid client request.",
  clientNotFound: "Client was not found.",
  projectInvalid: "Invalid project request.",
  projectNotFound: "Project was not found.",
  taskInvalid: "Invalid task request.",
  taskNotFound: "Task was not found.",
  invoiceInvalid: "Invalid invoice request.",
  invoiceNotFound: "Invoice was not found.",
  recurringInvoiceInvalid: "Invalid recurring invoice request.",
  recurringInvoiceNotFound: "Recurring invoice was not found.",
  billInvalid: "Invalid bill request.",
  billNotFound: "Bill was not found.",
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

export function companyProfileInvalidFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.companyProfileInvalid, API_ERROR_MESSAGES.companyProfileInvalid);
}

export function clientInvalidFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.clientInvalid, API_ERROR_MESSAGES.clientInvalid);
}

export function clientNotFoundFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.clientNotFound, API_ERROR_MESSAGES.clientNotFound);
}

export function projectInvalidFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.projectInvalid, API_ERROR_MESSAGES.projectInvalid);
}

export function projectNotFoundFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.projectNotFound, API_ERROR_MESSAGES.projectNotFound);
}

export function taskInvalidFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.taskInvalid, API_ERROR_MESSAGES.taskInvalid);
}

export function taskNotFoundFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.taskNotFound, API_ERROR_MESSAGES.taskNotFound);
}

export function invoiceInvalidFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.invoiceInvalid, API_ERROR_MESSAGES.invoiceInvalid);
}

export function invoiceNotFoundFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.invoiceNotFound, API_ERROR_MESSAGES.invoiceNotFound);
}

export function recurringInvoiceInvalidFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.recurringInvoiceInvalid, API_ERROR_MESSAGES.recurringInvoiceInvalid);
}

export function recurringInvoiceNotFoundFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.recurringInvoiceNotFound, API_ERROR_MESSAGES.recurringInvoiceNotFound);
}

export function billInvalidFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.billInvalid, API_ERROR_MESSAGES.billInvalid);
}

export function billNotFoundFailure(): ApiErrorResponse {
  return failure(API_ERROR_CODES.billNotFound, API_ERROR_MESSAGES.billNotFound);
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
