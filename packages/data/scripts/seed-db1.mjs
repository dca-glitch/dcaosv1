import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const localDatabaseTarget = "local";
const stagingDatabaseTarget = "staging";
const expectedLocalPort = "5434";
const expectedStagingHost = "dcaosv1-postgres";
const expectedStagingPort = "5432";
const expectedDatabaseNames = [/dev/i, /local/i];

const seedTenantSlug = "dca-local";
const seedTenantName = "Digital Cube Agency Local";
const seedUserName = "Local Login Tester";
const seedRoleKey = "local_tester";
const seedRoleName = "Local Tester";

const dcaTenantSlug = "digital-cube-agency";
const dcaTenantName = "Digital Cube Agency LLC";
const dcaBootstrapAdminEmail = "digitalcubeagency360@gmail.com";

const dcaRoleDefinitions = [
  {
    key: "owner",
    name: "Owner",
    description: "Full tenant owner access."
  },
  {
    key: "admin",
    name: "Admin",
    description: "Full tenant admin access."
  }
];

const dcaPermissionDefinitions = [
  {
    key: "audit:read",
    moduleKey: "core",
    description: "Read tenant audit activity."
  },
  {
    key: "modules:manage",
    moduleKey: "core",
    description: "Enable and disable tenant modules."
  },
  {
    key: "roles:manage",
    moduleKey: "core",
    description: "Manage tenant roles."
  },
  {
    key: "settings:read",
    moduleKey: "user-settings",
    description: "Read tenant settings."
  },
  {
    key: "settings:update",
    moduleKey: "user-settings",
    description: "Update tenant settings."
  },
  {
    key: "users:invite",
    moduleKey: "core",
    description: "Invite tenant users."
  },
  {
    key: "users:read",
    moduleKey: "core",
    description: "Read tenant users and team membership."
  }
];

const dcaModuleDefinitions = [
  {
    key: "core",
    name: "Core",
    description: "Platform core module registry entry.",
    status: "ACTIVE",
    tenantStatus: "ACTIVE"
  },
  {
    key: "finance-lite",
    name: "Finance Lite",
    description: "Placeholder finance module registry entry.",
    status: "PLANNED",
    tenantStatus: "PLANNED"
  },
  {
    key: "user-settings",
    name: "User Settings",
    description: "User settings module registry entry.",
    status: "ACTIVE",
    tenantStatus: "ACTIVE"
  }
];

const AUTH_PASSWORD_SCRYPT_KEY_LENGTH = 64;
const AUTH_PASSWORD_SCRYPT_SALT_BYTES = 16;
const AUTH_PASSWORD_SCRYPT_COST = 16384;
const AUTH_PASSWORD_SCRYPT_BLOCK_SIZE = 8;
const AUTH_PASSWORD_SCRYPT_PARALLELIZATION = 1;

function fail(message) {
  throw new Error(`DB-1 seed refused: ${message}`);
}

function readDatabaseTarget() {
  const value = process.env.DCA_BOOTSTRAP_DATABASE_TARGET;
  if (typeof value !== "string" || !value.trim()) {
    return localDatabaseTarget;
  }

  const target = value.trim().toLowerCase();
  if (target !== localDatabaseTarget && target !== stagingDatabaseTarget) {
    fail("DCA_BOOTSTRAP_DATABASE_TARGET must be local or staging.");
  }

  return target;
}

function assertSafeDatabaseUrl() {
  const databaseTarget = readDatabaseTarget();
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

  if (parsed.hostname === "system.digitalcubeagency.net" || parsed.hostname === "app.digitalcubeagency.net") {
    fail("DATABASE_URL host must not target a public DCA domain.");
  }

  if (databaseTarget === localDatabaseTarget && parsed.hostname !== "127.0.0.1") {
    fail(`Local DATABASE_URL host must be 127.0.0.1, got ${parsed.hostname}.`);
  }

  if (databaseTarget === localDatabaseTarget && parsed.port !== expectedLocalPort) {
    fail(`Local DATABASE_URL port must be ${expectedLocalPort}, got ${parsed.port || "(missing)"}.`);
  }

  if (databaseTarget === stagingDatabaseTarget && parsed.hostname !== expectedStagingHost) {
    fail(`Staging DATABASE_URL host must be ${expectedStagingHost}, got ${parsed.hostname}.`);
  }

  if (
    databaseTarget === stagingDatabaseTarget &&
    parsed.port &&
    parsed.port !== expectedStagingPort
  ) {
    fail(`Staging DATABASE_URL port must be ${expectedStagingPort}, got ${parsed.port}.`);
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!databaseName) {
    fail("DATABASE_URL database name is missing.");
  }

  if (
    databaseTarget === localDatabaseTarget &&
    !expectedDatabaseNames.some((pattern) => pattern.test(databaseName))
  ) {
    fail(`Local DATABASE_URL database name must look local/dev, got ${databaseName}.`);
  }

  if (/prod|production|live|vps|public/i.test(databaseName)) {
    fail(`DATABASE_URL database name looks unsafe, got ${databaseName}.`);
  }

  return {
    databaseName,
    databaseTarget,
    hostname: parsed.hostname,
    port: parsed.port || expectedStagingPort
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

function readTesterCredentials() {
  const email = process.env.AUTH_SEED_TESTER_EMAIL;
  const password = process.env.AUTH_SEED_TESTER_PASSWORD;
  const hasEmail = typeof email === "string" && email.trim().length > 0;
  const hasPassword = typeof password === "string" && password.length > 0;

  if (!hasEmail && !hasPassword) {
    return null;
  }

  if (hasEmail && !hasPassword) {
    fail("AUTH_SEED_TESTER_EMAIL is set but AUTH_SEED_TESTER_PASSWORD is missing.");
  }

  if (!hasEmail && hasPassword) {
    fail("AUTH_SEED_TESTER_PASSWORD is set but AUTH_SEED_TESTER_EMAIL is missing.");
  }

  return {
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password)
  };
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

async function upsertDcaFoundationTenant(prisma) {
  const existing = await prisma.tenant.findUnique({
    where: { slug: dcaTenantSlug }
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: dcaTenantSlug },
    update: {
      name: dcaTenantName,
      status: "ACTIVE"
    },
    create: {
      name: dcaTenantName,
      slug: dcaTenantSlug,
      status: "ACTIVE"
    }
  });

  return { tenant, status: existing ? "updated" : "created" };
}

async function upsertDcaRole(prisma, tenantId, roleDefinition) {
  const existing = await prisma.role.findUnique({
    where: {
      tenantId_key: {
        tenantId,
        key: roleDefinition.key
      }
    }
  });

  const role = await prisma.role.upsert({
    where: {
      tenantId_key: {
        tenantId,
        key: roleDefinition.key
      }
    },
    update: {
      name: roleDefinition.name,
      description: roleDefinition.description,
      status: "ACTIVE"
    },
    create: {
      tenantId,
      key: roleDefinition.key,
      name: roleDefinition.name,
      description: roleDefinition.description,
      status: "ACTIVE"
    }
  });

  return { role, status: existing ? "updated" : "created" };
}

async function upsertDcaPermission(prisma, permissionDefinition) {
  const existing = await prisma.permission.findUnique({
    where: {
      key: permissionDefinition.key
    }
  });

  const permission = await prisma.permission.upsert({
    where: {
      key: permissionDefinition.key
    },
    update: {
      moduleKey: permissionDefinition.moduleKey,
      description: permissionDefinition.description
    },
    create: {
      key: permissionDefinition.key,
      moduleKey: permissionDefinition.moduleKey,
      description: permissionDefinition.description
    }
  });

  return { permission, status: existing ? "updated" : "created" };
}

async function upsertDcaRolePermission(prisma, roleId, permissionId) {
  const existing = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId
      }
    }
  });

  const rolePermission = await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId
      }
    },
    update: {},
    create: {
      roleId,
      permissionId
    }
  });

  return { rolePermission, status: existing ? "updated" : "created" };
}

async function upsertDcaModuleDefinition(prisma, moduleDefinition) {
  const existing = await prisma.moduleDefinition.findUnique({
    where: {
      key: moduleDefinition.key
    }
  });

  const module = await prisma.moduleDefinition.upsert({
    where: {
      key: moduleDefinition.key
    },
    update: {
      name: moduleDefinition.name,
      description: moduleDefinition.description,
      status: moduleDefinition.status
    },
    create: {
      key: moduleDefinition.key,
      name: moduleDefinition.name,
      description: moduleDefinition.description,
      status: moduleDefinition.status
    }
  });

  return { module, status: existing ? "updated" : "created" };
}

async function upsertDcaTenantModule(prisma, tenantId, moduleDefinitionId, tenantStatus) {
  const existing = await prisma.tenantModule.findUnique({
    where: {
      tenantId_moduleDefinitionId: {
        tenantId,
        moduleDefinitionId
      }
    }
  });

  const tenantModule = await prisma.tenantModule.upsert({
    where: {
      tenantId_moduleDefinitionId: {
        tenantId,
        moduleDefinitionId
      }
    },
    update: {
      status: tenantStatus
    },
    create: {
      tenantId,
      moduleDefinitionId,
      status: tenantStatus
    }
  });

  return { tenantModule, status: existing ? "updated" : "created" };
}

async function upsertDcaAdminMembership(prisma, tenantId, rolesByKey) {
  const user = await prisma.user.findUnique({
    where: {
      email: dcaBootstrapAdminEmail
    }
  });

  if (!user) {
    return {
      user: null,
      membership: null,
      membershipRoles: [],
      status: "skipped_missing_user"
    };
  }

  const membership = await upsertMembership(prisma, tenantId, user.id);
  const membershipRoles = [];

  for (const roleKey of ["owner", "admin"]) {
    const role = rolesByKey.get(roleKey);
    if (role) {
      membershipRoles.push(await upsertMembershipRole(prisma, membership.membership.id, role.id));
    }
  }

  return {
    user,
    membership,
    membershipRoles,
    status: membership.status
  };
}

async function upsertDcaFoundationBootstrap(prisma) {
  const tenant = await upsertDcaFoundationTenant(prisma);
  const roles = [];
  const permissions = [];
  const rolePermissions = [];
  const modules = [];
  const tenantModules = [];

  for (const roleDefinition of dcaRoleDefinitions) {
    roles.push(await upsertDcaRole(prisma, tenant.tenant.id, roleDefinition));
  }

  for (const permissionDefinition of dcaPermissionDefinitions) {
    permissions.push(await upsertDcaPermission(prisma, permissionDefinition));
  }

  for (const role of roles) {
    for (const permission of permissions) {
      rolePermissions.push(
        await upsertDcaRolePermission(prisma, role.role.id, permission.permission.id)
      );
    }
  }

  for (const moduleDefinition of dcaModuleDefinitions) {
    const module = await upsertDcaModuleDefinition(prisma, moduleDefinition);
    modules.push(module);
    tenantModules.push(
      await upsertDcaTenantModule(
        prisma,
        tenant.tenant.id,
        module.module.id,
        moduleDefinition.tenantStatus
      )
    );
  }

  const rolesByKey = new Map(roles.map((role) => [role.role.key, role.role]));
  const adminMembership = await upsertDcaAdminMembership(prisma, tenant.tenant.id, rolesByKey);

  return {
    tenant,
    roles,
    permissions,
    rolePermissions,
    modules,
    tenantModules,
    adminMembership
  };
}

async function upsertTesterFixture(prisma, testerCredentials, dcaTenantId) {
  const testerUser = await upsertUser(prisma, testerCredentials.email, testerCredentials.passwordHash);
  const testerMembership = await upsertMembership(prisma, dcaTenantId, testerUser.user.id);

  // The local_tester role has zero permissions (ROLE_PERMISSION_MAP local_tester: []).
  // Finance routes require requireRole("owner", "admin"). Assigning local_tester would
  // cause 403 on all Finance endpoints due to RBAC, not tenant isolation, making
  // cross-tenant blocking indistinguishable from role-based blocking. Use the existing
  // admin role already seeded by upsertDcaFoundationBootstrap in the second tenant.
  const adminRole = await prisma.role.findUnique({
    where: { tenantId_key: { tenantId: dcaTenantId, key: "admin" } }
  });

  if (!adminRole) {
    fail("admin role not found in DCA foundation tenant; upsertDcaFoundationBootstrap must run before upsertTesterFixture.");
  }

  const testerMembershipRole = await upsertMembershipRole(
    prisma,
    testerMembership.membership.id,
    adminRole.id
  );

  return {
    user: testerUser,
    membership: testerMembership,
    roleKey: adminRole.key,
    membershipRole: testerMembershipRole
  };
}

async function main() {
  const { databaseName, databaseTarget, hostname, port } = assertSafeDatabaseUrl();
  const email = readSeedEmail();
  const password = readSeedPassword();
  const passwordHash = hashPassword(password);
  const testerCredentials = readTesterCredentials();
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
      const dcaFoundation = await upsertDcaFoundationBootstrap(tx);

      let testerFixture = null;
      if (testerCredentials) {
        testerFixture = await upsertTesterFixture(
          tx,
          testerCredentials,
          dcaFoundation.tenant.tenant.id
        );
      }

      return {
        tenant,
        user,
        membership,
        role,
        membershipRole,
        dcaFoundation,
        testerFixture
      };
    });

    console.log(
      JSON.stringify(
        {
          seed: "db1-local-auth-test",
          database: {
            target: databaseTarget,
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
          },
          dcaFoundation: {
            tenant: {
              slug: dcaTenantSlug,
              name: dcaTenantName,
              status: result.dcaFoundation.tenant.status
            },
            admin: {
              email: maskEmail(dcaBootstrapAdminEmail),
              status: result.dcaFoundation.adminMembership.status
            },
            roles: result.dcaFoundation.roles.map((role) => ({
              key: role.role.key,
              status: role.status
            })),
            permissions: result.dcaFoundation.permissions.map((permission) => ({
              key: permission.permission.key,
              moduleKey: permission.permission.moduleKey,
              status: permission.status
            })),
            rolePermissions: {
              count: result.dcaFoundation.rolePermissions.length
            },
            modules: result.dcaFoundation.modules.map((module) => ({
              key: module.module.key,
              status: module.status
            })),
            tenantModules: result.dcaFoundation.tenantModules.map((tenantModule, index) => ({
              key: dcaModuleDefinitions[index]?.key ?? "unknown",
              status: tenantModule.status
            }))
          },
          testerFixture: result.testerFixture
            ? {
                tenant: {
                  slug: dcaTenantSlug,
                  name: dcaTenantName
                },
                user: {
                  email: maskEmail(testerCredentials.email),
                  status: result.testerFixture.user.status
                },
                membership: {
                  status: result.testerFixture.membership.status
                },
                role: {
                  key: result.testerFixture.roleKey,
                  status: result.testerFixture.membershipRole.status
                }
              }
            : "skipped - AUTH_SEED_TESTER_EMAIL/AUTH_SEED_TESTER_PASSWORD not set"
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
