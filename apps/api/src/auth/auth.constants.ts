export const AUTH_RUNTIME_ROUTES = {
  login: "/api/v1/auth/login",
  logout: "/api/v1/auth/logout",
  me: "/api/v1/auth/me",
  changePassword: "/api/v1/auth/change-password"
} as const;

export const AUTH_RUNTIME_ENV = {
  sessionCookieName: "AUTH_SESSION_COOKIE_NAME",
  sessionTtlMinutes: "AUTH_SESSION_TTL_MINUTES",
  sessionSecureCookies: "AUTH_SESSION_SECURE_COOKIES",
  sessionSameSite: "AUTH_SESSION_SAME_SITE",
  passwordMinLength: "AUTH_PASSWORD_MIN_LENGTH",
  loginMaxFailedAttempts: "AUTH_LOGIN_MAX_FAILED_ATTEMPTS",
  loginLockoutMinutes: "AUTH_LOGIN_LOCKOUT_MINUTES"
} as const;

export const AUTH_RUNTIME_AUDIT_EVENTS = {
  loginSuccess: "auth.login.success",
  loginFailed: "auth.login.failed",
  logout: "auth.logout",
  sessionRevoked: "auth.session.revoked",
  passwordResetByAdmin: "auth.password.reset_by_admin",
  passwordChanged: "auth.password.changed",
  permissionDenied: "auth.permission.denied",
  adminUserCreated: "admin.user.created",
  adminUserUpdated: "admin.user.updated",
  adminMembershipUpdated: "admin.membership.updated",
  adminRoleUpdated: "admin.role.updated",
  adminModuleAccessUpdated: "admin.module_access.updated"
} as const;
