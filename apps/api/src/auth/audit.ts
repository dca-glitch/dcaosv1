import { AUDIT_EVENTS } from "../security/audit-events";

export const AUTH_AUDIT_EVENTS = {
  loginStart: AUDIT_EVENTS.authLoginStart,
  loginCallback: AUDIT_EVENTS.authLoginCallback,
  loginSuccess: AUDIT_EVENTS.authLoginSuccess,
  loginFailure: AUDIT_EVENTS.authLoginFailure,
  logout: AUDIT_EVENTS.authLogout,
  sessionChecked: AUDIT_EVENTS.authSessionChecked,
  tenantSelected: AUDIT_EVENTS.authTenantSelected,
  permissionDenied: AUDIT_EVENTS.authPermissionDenied
} as const;

export type AuthAuditEventName = (typeof AUTH_AUDIT_EVENTS)[keyof typeof AUTH_AUDIT_EVENTS];
