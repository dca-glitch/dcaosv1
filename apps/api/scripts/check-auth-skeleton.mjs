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
const tenantAccessForbiddenTokens = ["TenantMembership", "prisma", "findUnique(", "findMany(", "count("];
for (const token of tenantAccessForbiddenTokens) {
  if (tenantAccessResolverContent.includes(token)) {
    console.error(`Auth skeleton check failed. Tenant access resolver must not perform DB lookup or Prisma access: ${token}`);
    process.exit(1);
  }
}
if (
  !tenantAccessResolverContent.includes("skeleton-only") ||
  !tenantAccessResolverContent.includes("blocked")
) {
  console.error("Auth skeleton check failed. Tenant access resolver must clearly remain skeleton-only and blocked.");
  process.exit(1);
}

console.log("Auth skeleton structural check passed.");
