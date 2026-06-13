import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const expectedPort = "5434";
const expectedDatabaseNames = [/dev/i, /local/i];

const seedTenantSlug = "dca-local";
const seedTenantName = "Digital Cube Agency Local";
const seedUserName = "Local Login Tester";
const seedRoleKey = "local_tester";
const seedRoleName = "Local Tester";

const AUTH_PASSWORD_SCRYPT_KEY_LENGTH = 64;
const AUTH_PASSWORD_SCRYPT_SALT_BYTES = 16;
const AUTH_PASSWORD_SCRYPT_COST = 16384;
const AUTH_PASSWORD_SCRYPT_BLOCK_SIZE = 8;
const AUTH_PASSWORD_SCRYPT_PARALLELIZATION = 1;

function fail(message) {
  throw new Error(`DB-1 seed refused: ${message}`);
}

function assertLocalDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    fail("DATABASE_URL is not set.");
  }

  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    fail("DATABASE_URL is not a valid URL.");
  }

  if (parsed.protocol !== "postgresql:") {
    fail("DATABASE_URL must use the postgresql protocol.");
  }

  if (parsed.hostname !== "127.0.0.1") {
    fail(`DATABASE_URL host must be 127.0.0.1, got ${parsed.hostname}.`);
  }

  if (parsed.hostname === "system.digitalcubeagency.net") {
    fail("DATABASE_URL host must not target system.digitalcubeagency.net.");
  }

  if (parsed.port !== expectedPort) {
    fail(`DATABASE_URL port must be ${expectedPort}, got ${parsed.port || "(missing)"}.`);
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!databaseName) {
    fail("DATABASE_URL database name is missing.");
  }

  if (!expectedDatabaseNames.some((pattern) => pattern.test(databaseName))) {
    fail(`DATABASE_URL database name must look local/dev, got ${databaseName}.`);
  }

  if (/prod|production|live|vps|public/i.test(databaseName)) {
    fail(`DATABASE_URL database name looks unsafe, got ${databaseName}.`);
  }

  return {
    databaseName,
    hostname: parsed.hostname,
    port: parsed.port
  };
}

function readSeedEmail() {
  const value = process.env.AUTH_SEED_TEST_EMAIL;
  if (typeof value !== "string" || !value.trim()) {
    fail("AUTH_SEED_TEST_EMAIL is required.");
  }

  return value.trim().toLowerCase();
}

function readSeedPassword() {
  const value = process.env.AUTH_SEED_TEST_PASSWORD;
  if (typeof value !== "string") {
    fail("AUTH_SEED_TEST_PASSWORD is required.");
  }

  if (value.length === 0) {
    fail("AUTH_SEED_TEST_PASSWORD must not be empty.");
  }

  return value;
}

function maskEmail(email) {
  const [localPart, domain = ""] = email.split("@");
  if (!domain) {
    return "***";
  }

  const visiblePrefix = localPart.slice(0, 1) || "*";
  return `${visiblePrefix}***@${domain}`;
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
    Buffer.from(derivedKey).toString("base64url")
  ].join("$");
}

async function upsertTenant(prisma) {
  const existing = await prisma.tenant.findUnique({
    where: { slug: seedTenantSlug }
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: seedTenantSlug },
    update: {
      name: seedTenantName,
      status: "ACTIVE"
    },
    create: {
      name: seedTenantName,
      slug: seedTenantSlug,
      status: "ACTIVE"
    }
  });

  return { tenant, status: existing ? "updated" : "created" };
}

async function upsertUser(prisma, email, passwordHash) {
  const existing = await prisma.user.findUnique({
    where: { email }
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: seedUserName,
      status: "ACTIVE",
      passwordHash,
      forcePasswordChange: true,
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: null
    },
    create: {
      email,
      name: seedUserName,
      status: "ACTIVE",
      passwordHash,
      forcePasswordChange: true
    }
  });

  return { user, status: existing ? "updated" : "created" };
}

async function upsertMembership(prisma, tenantId, userId) {
  const existing = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId
      }
    }
  });

  const membership = await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId,
        userId
      }
    },
    update: {
      status: "ACTIVE"
    },
    create: {
      tenantId,
      userId,
      status: "ACTIVE"
    }
  });

  return { membership, status: existing ? "updated" : "created" };
}

async function upsertRole(prisma, tenantId) {
  const existing = await prisma.role.findUnique({
    where: {
      tenantId_key: {
        tenantId,
        key: seedRoleKey
      }
    }
  });

  const role = await prisma.role.upsert({
    where: {
      tenantId_key: {
        tenantId,
        key: seedRoleKey
      }
    },
    update: {
      name: seedRoleName,
      description: "Low-privilege local login test role",
      status: "ACTIVE"
    },
    create: {
      tenantId,
      key: seedRoleKey,
      name: seedRoleName,
      description: "Low-privilege local login test role",
      status: "ACTIVE"
    }
  });

  return { role, status: existing ? "updated" : "created" };
}

async function upsertMembershipRole(prisma, tenantMembershipId, roleId) {
  const existing = await prisma.membershipRole.findUnique({
    where: {
      tenantMembershipId_roleId: {
        tenantMembershipId,
        roleId
      }
    }
  });

  const membershipRole = await prisma.membershipRole.upsert({
    where: {
      tenantMembershipId_roleId: {
        tenantMembershipId,
        roleId
      }
    },
    update: {},
    create: {
      tenantMembershipId,
      roleId
    }
  });

  return { membershipRole, status: existing ? "updated" : "created" };
}

async function main() {
  const { databaseName, hostname, port } = assertLocalDatabaseUrl();
  const email = readSeedEmail();
  const password = readSeedPassword();
  const passwordHash = hashPassword(password);
  const prisma = new PrismaClient();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await upsertTenant(tx);
      const user = await upsertUser(tx, email, passwordHash);
      const membership = await upsertMembership(tx, tenant.tenant.id, user.user.id);
      const role = await upsertRole(tx, tenant.tenant.id);
      const membershipRole = await upsertMembershipRole(
        tx,
        membership.membership.id,
        role.role.id
      );

      return {
        tenant,
        user,
        membership,
        role,
        membershipRole
      };
    });

    console.log(
      JSON.stringify(
        {
          seed: "db1-local-auth-test",
          database: {
            host: hostname,
            port,
            name: databaseName
          },
          tenant: {
            slug: seedTenantSlug,
            name: seedTenantName,
            status: result.tenant.status
          },
          user: {
            email: maskEmail(email),
            status: result.user.status
          },
          membership: {
            status: result.membership.status
          },
          role: {
            key: seedRoleKey,
            name: seedRoleName,
            status: result.role.status
          },
          membershipRole: {
            status: result.membershipRole.status
          }
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
