export const AUDIT_EVENTS = {
  bootstrapDb1: "bootstrap:db1",
  authLoginStart: "auth.login.start",
  authLoginCallback: "auth.login.callback",
  authLoginSuccess: "auth.login.success",
  authLoginFailure: "auth.login.failure",
  authLogout: "auth.logout",
  authSessionChecked: "auth.session.checked",
  authTenantSelected: "auth.tenant.selected",
  authPermissionDenied: "auth.permission.denied",
  tenantSettingsUpdated: "tenant.settings.updated",
  moduleEnabled: "module.enabled",
  moduleDisabled: "module.disabled"
} as const;

export type AuditEventName = (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS];
