import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = [
  "src/config/auth.config.ts",
  "src/config/index.ts",
  "src/auth/types.ts",
  "src/auth/session.ts",
  "src/auth/password.service.ts",
  "src/auth/session.service.ts",
  "src/auth/provider.ts",
  "src/auth/tenant-selection.ts",
  "src/auth/tenant-access.resolver.ts",
  "src/auth/permission.resolver.ts",
  "src/auth/module-access.resolver.ts",
  "src/auth/audit.ts",
  "src/auth/auth.constants.ts",
  "src/auth/auth.controller.ts",
  "src/auth/auth.service.ts",
  "src/auth/auth.handlers.ts",
  "src/auth/auth.routes.ts",
  "src/auth/index.ts",
  "src/routes/auth.routes.ts",
  "src/routes/v1.ts",
  "src/security/audit-events.ts"
];

const forbiddenTokens = [
  "bcrypt",
  "argon2",
  "passwordHash",
  "resetPassword",
  "TenantUser",
  "UserRole",
  "tenantId from body",
  "tenantId-from-body",
  "working login",
  "real auth",
  "provider credentials",
  "client secret",
  "session secret",
  "AUTH_RUNTIME_NOT_IMPLEMENTED"
];

const requiredSkeletonTokens = ["mode: \"skeleton\"", "runtimeEnabled: false"];

for (const relativePath of files) {
  const absPath = path.join(root, relativePath);
  if (!existsSync(absPath)) {
    console.error(`Auth skeleton check failed. Missing file: ${relativePath}`);
    process.exit(1);
  }
}

for (const relativePath of files) {
  const absPath = path.join(root, relativePath);
  const content = readFileSync(absPath, "utf8");

  for (const token of forbiddenTokens) {
    if (content.includes(token)) {
      console.error(`Auth skeleton check failed. Forbidden token found in ${relativePath}: ${token}`);
      process.exit(1);
    }
  }
}

const configContent = readFileSync(path.join(root, "src/config/auth.config.ts"), "utf8");
for (const token of requiredSkeletonTokens) {
  if (!configContent.includes(token)) {
    console.error(`Auth skeleton check failed. Missing skeleton token in src/config/auth.config.ts: ${token}`);
    process.exit(1);
  }
}

const routesContent = readFileSync(path.join(root, "src/auth/auth.routes.ts"), "utf8");
if (
  !routesContent.includes("/status") ||
  !routesContent.includes("/start") ||
  !routesContent.includes("/callback") ||
  !routesContent.includes("/login") ||
  !routesContent.includes("/logout") ||
  !routesContent.includes("/me") ||
  !routesContent.includes("/change-password")
) {
  console.error("Auth skeleton check failed. Route skeleton endpoints are incomplete.");
  process.exit(1);
}

const routeForbiddenTokens = ["/register", "oauth", "oidc", "magic-link", "mfa"];
for (const token of routeForbiddenTokens) {
  if (routesContent.toLowerCase().includes(token)) {
    console.error(`Auth skeleton check failed. Forbidden route token found in src/auth/auth.routes.ts: ${token}`);
    process.exit(1);
  }
}

const handlersContent = readFileSync(path.join(root, "src/auth/auth.handlers.ts"), "utf8");
if (!handlersContent.includes("501") || !handlersContent.includes("AUTH_SKELETON_ONLY")) {
  console.error("Auth skeleton check failed. Placeholder auth handlers must clearly return disabled/skeleton responses.");
  process.exit(1);
}

const controllerContent = readFileSync(path.join(root, "src/auth/auth.controller.ts"), "utf8");
if (!controllerContent.includes("501") || !controllerContent.includes("AUTH_SKELETON_ONLY")) {
  console.error("Auth skeleton check failed. Placeholder auth controller must clearly return disabled/skeleton responses.");
  process.exit(1);
}

const sessionServiceContent = readFileSync(path.join(root, "src/auth/session.service.ts"), "utf8");
if (!sessionServiceContent.includes("SESSION_DB_RUNTIME_BLOCKED")) {
  console.error("Auth skeleton check failed. Session service boundary must stay blocked until DB/runtime approval.");
  process.exit(1);
}

const inMemorySessionStoreTokens = ["new Map(", "createMemorySession", "memory session", "in-memory session"];
for (const token of inMemorySessionStoreTokens) {
  if (sessionServiceContent.toLowerCase().includes(token.toLowerCase())) {
    console.error(`Auth skeleton check failed. In-memory session store token found in src/auth/session.service.ts: ${token}`);
    process.exit(1);
  }
}

const tenantAccessResolverContent = readFileSync(path.join(root, "src/auth/tenant-access.resolver.ts"), "utf8");
if (
  !tenantAccessResolverContent.includes("skeleton-only") ||
  !tenantAccessResolverContent.includes("blocked")
) {
  console.error("Auth skeleton check failed. Tenant access resolver must clearly remain skeleton-only and blocked.");
  process.exit(1);
}

const permissionResolverContent = readFileSync(path.join(root, "src/auth/permission.resolver.ts"), "utf8");
if (
  !permissionResolverContent.includes("skeleton-only") ||
  !permissionResolverContent.includes("enforcement")
) {
  console.error("Auth skeleton check failed. Permission resolver must clearly remain skeleton-only and unenforced.");
  process.exit(1);
}

const moduleAccessResolverContent = readFileSync(path.join(root, "src/auth/module-access.resolver.ts"), "utf8");
if (
  !moduleAccessResolverContent.includes("skeleton-only") ||
  !moduleAccessResolverContent.includes("enforcement")
) {
  console.error("Auth skeleton check failed. Module access resolver must clearly remain skeleton-only and unenforced.");
  process.exit(1);
}

const resolverFiles = [
  ["src/auth/tenant-access.resolver.ts", tenantAccessResolverContent],
  ["src/auth/permission.resolver.ts", permissionResolverContent],
  ["src/auth/module-access.resolver.ts", moduleAccessResolverContent]
];
const resolverForbiddenTokens = ["TenantMembership", "prisma", "findUnique(", "findMany(", "count(", "queryRaw"];
for (const [relativePath, content] of resolverFiles) {
  for (const token of resolverForbiddenTokens) {
    if (content.includes(token)) {
      console.error(`Auth skeleton check failed. Resolver must not perform DB lookup or Prisma access in ${relativePath}: ${token}`);
      process.exit(1);
    }
  }
}

function requireIncludes(relativePath, content, tokens, label) {
  for (const token of tokens) {
    if (!content.includes(token)) {
      console.error(`${label} failed. Missing token in ${relativePath}: ${token}`);
      process.exit(1);
    }
  }
}

function requireNotIncludes(relativePath, content, tokens, label) {
  for (const token of tokens) {
    if (content.includes(token)) {
      console.error(`${label} failed. Forbidden token found in ${relativePath}: ${token}`);
      process.exit(1);
    }
  }
}

const runtimeHardeningLabel = "Auth tenant runtime hardening check";
const authRoutesRuntimeContent = readFileSync(path.join(root, "src/auth/auth.routes.ts"), "utf8");
const authMiddlewareRuntimeContent = readFileSync(path.join(root, "src/middlewares/auth.middleware.ts"), "utf8");
const authorizationMiddlewareRuntimeContent = readFileSync(path.join(root, "src/middlewares/authorization.middleware.ts"), "utf8");
const tenantMiddlewareRuntimeContent = readFileSync(path.join(root, "src/middlewares/tenant.middleware.ts"), "utf8");
const loginRuntimeContent = readFileSync(path.join(root, "src/auth/login.runtime.ts"), "utf8");
const sessionContextRuntimeContent = readFileSync(path.join(root, "src/auth/session-context.runtime.ts"), "utf8");
const tenantRoutesRuntimeContent = readFileSync(path.join(root, "src/routes/tenants.ts"), "utf8");
const tenantControllerRuntimeContent = readFileSync(path.join(root, "src/controllers/tenantController.ts"), "utf8");
const tenantRuntimeContent = readFileSync(path.join(root, "src/tenants/tenant.runtime.ts"), "utf8");
const responsesContent = readFileSync(path.join(root, "src/utils/responses.ts"), "utf8");

requireIncludes(
  "src/auth/auth.routes.ts",
  authRoutesRuntimeContent,
  ["router.post(\"/login\", login)", "router.post(\"/logout\", requireAuth, logout)", "router.get(\"/me\", requireAuth, getCurrentUser)"],
  runtimeHardeningLabel
);

if (authRoutesRuntimeContent.includes("router.post(\"/login\", requireAuth")) {
  console.error(`${runtimeHardeningLabel} failed. Login must remain public.`);
  process.exit(1);
}

requireIncludes(
  "src/middlewares/auth.middleware.ts",
  authMiddlewareRuntimeContent,
  ["if (!token)", "res.status(401).json(unauthorizedFailure())", "if (!authSession)"],
  runtimeHardeningLabel
);

requireIncludes(
  "src/auth/session-context.runtime.ts",
  sessionContextRuntimeContent,
  ["revokedAt: null", "expiresAt:", "activeTenantMembershipId", "hashSessionToken(token)"],
  runtimeHardeningLabel
);

requireIncludes(
  "src/auth/login.runtime.ts",
  loginRuntimeContent,
  ["activeTenantMembershipId", "sessionTokenHash", "sessionToken", "buildAuthResponse", "token: sessionToken"],
  runtimeHardeningLabel
);

requireIncludes(
  "src/tenants/tenant.runtime.ts",
  tenantRuntimeContent,
  ["id: tenantMembershipId", "userId: authSession.user.id", "status: \"ACTIVE\"", "tenant:", "activeTenantMembershipId: membership.id"],
  runtimeHardeningLabel
);

requireIncludes(
  "src/controllers/tenantController.ts",
  tenantControllerRuntimeContent,
  ["tenantSwitchInvalidFailure()", "res.status(403).json(forbiddenFailure())", "tenantMemberNotFoundFailure()", "tenantSettingsInvalidFailure()"],
  runtimeHardeningLabel
);

requireIncludes(
  "src/routes/tenants.ts",
  tenantRoutesRuntimeContent,
  [
    "router.get(\"/current\", requireAuth, requireTenant, getCurrentTenant)",
    "router.post(\"/current/switch\", requireAuth, switchCurrentTenant)",
    "requirePermission(PERMISSION_KEYS.usersRead)",
    "requirePermission(PERMISSION_KEYS.settingsRead)",
    "requirePermission(PERMISSION_KEYS.settingsUpdate)"
  ],
  runtimeHardeningLabel
);

requireIncludes(
  "src/middlewares/authorization.middleware.ts",
  authorizationMiddlewareRuntimeContent,
  ["local_tester: []", "forbiddenFailure()", "API_ERROR_CODES.authForbidden"],
  runtimeHardeningLabel
);

requireIncludes(
  "src/middlewares/tenant.middleware.ts",
  tenantMiddlewareRuntimeContent,
  ["unauthorizedFailure()", "forbiddenFailure()"],
  runtimeHardeningLabel
);

requireIncludes(
  "src/utils/responses.ts",
  responsesContent,
  ["AUTH_UNAUTHORIZED", "AUTH_FORBIDDEN", "TENANT_SWITCH_INVALID", "TENANT_SETTINGS_INVALID", "TENANT_MEMBER_INVALID", "TENANT_MEMBER_NOT_FOUND"],
  runtimeHardeningLabel
);

requireNotIncludes(
  "src/auth/session-context.runtime.ts",
  sessionContextRuntimeContent,
  ["passwordHash"],
  runtimeHardeningLabel
);

const responseSurfaceContent = [
  authRoutesRuntimeContent,
  authMiddlewareRuntimeContent,
  authorizationMiddlewareRuntimeContent,
  tenantMiddlewareRuntimeContent,
  tenantRoutesRuntimeContent,
  tenantControllerRuntimeContent,
  tenantRuntimeContent,
  responsesContent
].join("\n");

for (const token of ["passwordHash", "sessionTokenHash", "token: sessionToken"]) {
  if (responseSurfaceContent.includes(token)) {
    console.error(`${runtimeHardeningLabel} failed. Response-facing files must not expose ${token}.`);
    process.exit(1);
  }
}

console.log("Auth skeleton structural check passed.");
