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

export const AUTH_PASSWORD_MIN_LENGTH_DEFAULT = 12;
export const AUTH_PASSWORD_SCRYPT_KEY_LENGTH = 64;
export const AUTH_PASSWORD_SCRYPT_SALT_BYTES = 16;
export const AUTH_PASSWORD_SCRYPT_COST = 16384;
export const AUTH_PASSWORD_SCRYPT_BLOCK_SIZE = 8;
export const AUTH_PASSWORD_SCRYPT_PARALLELIZATION = 1;

export const AUTH_SESSION_COOKIE_NAME_DEFAULT = "dcaosv1_auth_session";
export const AUTH_SESSION_TTL_MINUTES_DEFAULT = 8 * 60;
export const AUTH_SESSION_SAME_SITE_DEFAULT = "lax" as const;
export const AUTH_SESSION_SECURE_COOKIES_DEFAULT = true;
export const AUTH_SESSION_TOKEN_BYTES = 32;
export const AUTH_SESSION_TOKEN_HASH_ALGORITHM = "sha256";

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
