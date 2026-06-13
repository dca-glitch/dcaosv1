export const AUDIT_EVENTS = {
  bootstrapDb1: "bootstrap:db1",
  loginFailed: "auth:login:failure",
  loginSucceeded: "auth:login:success",
  permissionDenied: "permission:denied",
  tenantSwitch: "tenant:switch"
} as const;

export type AuditEventName = (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS];
