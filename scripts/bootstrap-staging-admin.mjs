import { randomBytes, scryptSync } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

export const BOOTSTRAP_TARGET_ENV = "DCA_BOOTSTRAP_DATABASE_TARGET";
export const CONFIRM_ENV = "DCA_BOOTSTRAP_CONFIRM_STAGING_ADMIN";
export const REQUIRED_TARGET = "staging";
export const REQUIRED_CONFIRM_PHRASE = "I_UNDERSTAND_THIS_MUTATES_STAGING";
const DEFAULT_ADMIN_EMAIL = "admin@dca.local";
const ALLOWED_DATABASE_NAMES = new Set(["dcaosv1_staging"]);
const ALLOWED_DATABASE_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "dcaosv1-staging-postgres"
]);
const DENIED_DATABASE_HOSTS = new Set(["dcaosv1-postgres", "postgres"]);
const FORBIDDEN_DATABASE_HOST_FRAGMENTS = [
  "system.digitalcubeagency.net",
  "staging.digitalcubeagency.net",
  "production",
  "prod",
  "live"
];
const FORBIDDEN_DATABASE_NAME_FRAGMENTS = ["production", "prod", "live"];

const AUTH_PASSWORD_SCRYPT_KEY_LENGTH = 64;
const AUTH_PASSWORD_SCRYPT_SALT_BYTES = 16;
const AUTH_PASSWORD_SCRYPT_COST = 16384;
const AUTH_PASSWORD_SCRYPT_BLOCK_SIZE = 8;
const AUTH_PASSWORD_SCRYPT_PARALLELIZATION = 1;

const MODULE_DEFINITIONS = [
  { key: "core", name: "Core", description: "Platform core module registry entry.", status: "ACTIVE" },
  { key: "ai-delivery", name: "AI Delivery", description: "AI Delivery operational module.", status: "ACTIVE" },
  {
    key: "market-intelligence",
    name: "Market Intelligence",
    description: "Market Intelligence research module.",
    status: "ACTIVE"
  },
  {
    key: "finance-lite",
    name: "Finance Lite",
    description: "Placeholder finance module registry entry.",
    status: "PLANNED"
  },
  {
    key: "user-settings",
    name: "User Settings",
    description: "User settings module registry entry.",
    status: "ACTIVE"
  }
];

const modulePath = fileURLToPath(import.meta.url);
const isMainModule = Boolean(process.argv[1] && path.resolve(process.argv[1]) === path.resolve(modulePath));
const args = isMainModule ? new Set(process.argv.slice(2)) : new Set();
const checkOnly = args.has("--check");
const help = args.has("--help") || args.has("-h");

function printHelp() {
  console.log("Usage: npm run bootstrap:staging-admin -- [--check]");
  console.log("");
  console.log("Explicit staging guard required:");
  console.log(`  ${BOOTSTRAP_TARGET_ENV}=staging`);
  console.log("");
  console.log("Required for write mode:");
  console.log("  DATABASE_URL (approved staging host or loopback only; database name dcaosv1_staging)");
  console.log("  AUTH_SEED_TEST_PASSWORD");
  console.log(`  ${CONFIRM_ENV}=${REQUIRED_CONFIRM_PHRASE}`);
  console.log("");
  console.log("Optional:");
  console.log(`  AUTH_SEED_TEST_EMAIL (defaults to ${DEFAULT_ADMIN_EMAIL})`);
  console.log("");
  console.log("Modes:");
  console.log("  --check  Read-only verification summary. Does not write password hashes or rows.");
  console.log("");
  console.log("Approved DATABASE_URL hosts: dcaosv1-staging-postgres, localhost, 127.0.0.1, ::1");
  console.log("Refused DATABASE_URL hosts include dcaosv1-postgres and generic postgres.");
  console.log("");
  console.log("Output is intentionally redacted and never prints secrets, hashes, tokens, cookies, auth headers, or full DATABASE_URL.");
}

function fail(message) {
  console.error(`Bootstrap refused: ${message}`);
  process.exitCode = 1;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

export function validateDatabaseUrlForStagingBootstrap(rawDatabaseUrl) {
  let parsed;
  try {
    parsed = new URL(rawDatabaseUrl);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL.");
  }

  if (!["postgresql:", "postgres:"].includes(parsed.protocol)) {
    throw new Error("DATABASE_URL must use a PostgreSQL protocol.");
  }

  const host = parsed.hostname.toLowerCase();
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, "")).toLowerCase();

  if (!host || !databaseName) {
    throw new Error("DATABASE_URL must include a database host and database name.");
  }

  if (host === "dcaosv1-postgres") {
    throw new Error(
      'staging admin bootstrap does not allow production-shaped database host "dcaosv1-postgres". Use the approved staging database host or loopback tunnel only.'
    );
  }

  if (DENIED_DATABASE_HOSTS.has(host)) {
    throw new Error(
      `staging admin bootstrap does not allow generic database host "${host}". Use the approved staging database host or loopback tunnel only.`
    );
  }

  if (FORBIDDEN_DATABASE_HOST_FRAGMENTS.some((fragment) => host.includes(fragment))) {
    throw new Error("DATABASE_URL host is not an approved staging database host.");
  }

  if (FORBIDDEN_DATABASE_NAME_FRAGMENTS.some((fragment) => databaseName.includes(fragment))) {
    throw new Error("DATABASE_URL database name appears production-like and is refused.");
  }

  if (!ALLOWED_DATABASE_HOSTS.has(host)) {
    throw new Error("DATABASE_URL host must match the approved staging database host or loopback allowlist.");
  }

  if (!ALLOWED_DATABASE_NAMES.has(databaseName)) {
    throw new Error("DATABASE_URL database name must match the approved staging database name allowlist.");
  }
}

export function validateBootstrapTarget(target) {
  if (target !== REQUIRED_TARGET) {
    throw new Error(`${BOOTSTRAP_TARGET_ENV} must equal ${REQUIRED_TARGET}.`);
  }
}

export function validateWriteConfirmation({ checkOnly, confirmPhrase }) {
  if (checkOnly) {
    return;
  }

  if (confirmPhrase !== REQUIRED_CONFIRM_PHRASE) {
    throw new Error(`set ${CONFIRM_ENV}=${REQUIRED_CONFIRM_PHRASE} to allow staging admin mutations.`);
  }
}

export function validateBootstrapEnvironment({ target, databaseUrl, checkOnly, confirmPhrase }) {
  validateBootstrapTarget(target);
  validateDatabaseUrlForStagingBootstrap(databaseUrl);
  validateWriteConfirmation({ checkOnly, confirmPhrase });
}

function getAdminEmail() {
  return (process.env.AUTH_SEED_TEST_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

function hashPassword(plainPassword) {
  const salt = randomBytes(AUTH_PASSWORD_SCRYPT_SALT_BYTES);
  const derivedKey = scryptSync(plainPassword, salt, AUTH_PASSWORD_SCRYPT_KEY_LENGTH, {
    cost: AUTH_PASSWORD_SCRYPT_COST,
    blockSize: AUTH_PASSWORD_SCRYPT_BLOCK_SIZE,
    parallelization: AUTH_PASSWORD_SCRYPT_PARALLELIZATION
  });

  return [
    "scrypt",
    `cost=${AUTH_PASSWORD_SCRYPT_COST}`,
    `blockSize=${AUTH_PASSWORD_SCRYPT_BLOCK_SIZE}`,
    `parallelization=${AUTH_PASSWORD_SCRYPT_PARALLELIZATION}`,
    salt.toString("base64url"),
    derivedKey.toString("base64url")
  ].join("$");
}

function createSummary() {
  return {
    mode: checkOnly ? "check" : "write",
    targetGuard: REQUIRED_TARGET,
    tenant: "unknown",
    adminUser: "unknown",
    membership: "unknown",
    ownerRole: "unknown",
    membershipRole: "unknown",
    moduleDefinitions: { expected: MODULE_DEFINITIONS.length, present: 0, changed: 0 },
    tenantModules: { expected: MODULE_DEFINITIONS.length, present: 0, changed: 0 }
  };
}

function isDifferent(record, expected) {
  return Object.entries(expected).some(([key, value]) => record?.[key] !== value);
}

async function checkBootstrapState(prisma, email) {
  const summary = createSummary();
  const tenant = await prisma.tenant.findUnique({ where: { slug: "local-dca" } });
  summary.tenant = tenant && tenant.name === "Local DCA" && tenant.status === "ACTIVE" && !tenant.deletedAt ? "ready" : "needs-write";

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } }
  });
  summary.adminUser = user && user.status === "ACTIVE" && !user.deletedAt && Boolean(user.passwordHash) ? "ready" : "needs-write";

  const membership = tenant && user
    ? await prisma.tenantMembership.findUnique({ where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } } })
    : null;
  summary.membership = membership && membership.status === "ACTIVE" && !membership.deletedAt ? "ready" : "needs-write";

  const ownerRole = tenant
    ? await prisma.role.findUnique({ where: { tenantId_key: { tenantId: tenant.id, key: "owner" } } })
    : null;
  summary.ownerRole = ownerRole && ownerRole.name === "Owner" && ownerRole.status === "ACTIVE" && !ownerRole.deletedAt ? "ready" : "needs-write";

  const membershipRole = membership && ownerRole
    ? await prisma.membershipRole.findUnique({ where: { tenantMembershipId_roleId: { tenantMembershipId: membership.id, roleId: ownerRole.id } } })
    : null;
  summary.membershipRole = membershipRole ? "ready" : "needs-write";

  for (const moduleDefinition of MODULE_DEFINITIONS) {
    const persistedModule = await prisma.moduleDefinition.findUnique({ where: { key: moduleDefinition.key } });
    if (persistedModule) summary.moduleDefinitions.present += 1;
    if (!persistedModule || isDifferent(persistedModule, moduleDefinition)) summary.moduleDefinitions.changed += 1;

    const tenantModule = tenant && persistedModule
      ? await prisma.tenantModule.findUnique({
          where: { tenantId_moduleDefinitionId: { tenantId: tenant.id, moduleDefinitionId: persistedModule.id } }
        })
      : null;
    if (tenantModule) summary.tenantModules.present += 1;
    if (!tenantModule || tenantModule.status !== moduleDefinition.status) summary.tenantModules.changed += 1;
  }

  return summary;
}

async function upsertBootstrapState(prisma, email, password) {
  return prisma.$transaction(async (tx) => {
    const passwordHash = hashPassword(password);

    const tenant = await tx.tenant.upsert({
      where: { slug: "local-dca" },
      update: { name: "Local DCA", status: "ACTIVE", deletedAt: null },
      create: { slug: "local-dca", name: "Local DCA", status: "ACTIVE" }
    });

    const existingUser = await tx.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    const user = existingUser
      ? await tx.user.update({
          where: { id: existingUser.id },
          data: {
            email,
            name: existingUser.name ?? "Staging Admin",
            status: "ACTIVE",
            passwordHash,
            forcePasswordChange: false,
            failedLoginCount: 0,
            lockedUntil: null,
            deletedAt: null
          }
        })
      : await tx.user.create({
          data: {
            email,
            name: "Staging Admin",
            status: "ACTIVE",
            passwordHash,
            forcePasswordChange: false,
            failedLoginCount: 0,
            lockedUntil: null
          }
        });

    const membership = await tx.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
      update: { status: "ACTIVE", deletedAt: null },
      create: { tenantId: tenant.id, userId: user.id, status: "ACTIVE" }
    });

    const ownerRole = await tx.role.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: "owner" } },
      update: { name: "Owner", status: "ACTIVE", deletedAt: null },
      create: { tenantId: tenant.id, key: "owner", name: "Owner", status: "ACTIVE", deletedAt: null }
    });

    await tx.membershipRole.upsert({
      where: { tenantMembershipId_roleId: { tenantMembershipId: membership.id, roleId: ownerRole.id } },
      update: {},
      create: { tenantMembershipId: membership.id, roleId: ownerRole.id }
    });

    for (const moduleDefinition of MODULE_DEFINITIONS) {
      const persistedModule = await tx.moduleDefinition.upsert({
        where: { key: moduleDefinition.key },
        update: {
          name: moduleDefinition.name,
          description: moduleDefinition.description,
          status: moduleDefinition.status
        },
        create: moduleDefinition
      });

      await tx.tenantModule.upsert({
        where: { tenantId_moduleDefinitionId: { tenantId: tenant.id, moduleDefinitionId: persistedModule.id } },
        update: { status: moduleDefinition.status },
        create: { tenantId: tenant.id, moduleDefinitionId: persistedModule.id, status: moduleDefinition.status }
      });
    }
  });
}

function printSummary(summary) {
  console.log("Staging admin bootstrap summary");
  console.log(`Mode: ${summary.mode}`);
  console.log(`Target guard: ${summary.targetGuard}`);
  console.log(`Tenant local-dca: ${summary.tenant}`);
  console.log(`Admin user: ${summary.adminUser}`);
  console.log(`Tenant membership: ${summary.membership}`);
  console.log(`Owner role: ${summary.ownerRole}`);
  console.log(`Membership role: ${summary.membershipRole}`);
  console.log(`Module definitions present: ${summary.moduleDefinitions.present}/${summary.moduleDefinitions.expected}`);
  console.log(`Module definitions needing write: ${summary.moduleDefinitions.changed}`);
  console.log(`Tenant modules present: ${summary.tenantModules.present}/${summary.tenantModules.expected}`);
  console.log(`Tenant modules needing write: ${summary.tenantModules.changed}`);
  console.log("Secrets printed: no");
  console.log("Full DATABASE_URL printed: no");
}

async function runBootstrap() {
  try {
    validateBootstrapEnvironment({
      target: requireEnv(BOOTSTRAP_TARGET_ENV),
      databaseUrl: requireEnv("DATABASE_URL"),
      checkOnly,
      confirmPhrase: process.env[CONFIRM_ENV]
    });

    const email = getAdminEmail();
    const password = checkOnly ? null : requireEnv("AUTH_SEED_TEST_PASSWORD");

    const prisma = new PrismaClient();
    try {
      if (!checkOnly) {
        await upsertBootstrapState(prisma, email, password);
      }

      const summary = await checkBootstrapState(prisma, email);
      if (!checkOnly) summary.mode = "write";
      printSummary(summary);
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : "Unknown bootstrap error.");
  }
}

if (isMainModule) {
  if (help) {
    printHelp();
    process.exit(0);
  }

  runBootstrap();
}
