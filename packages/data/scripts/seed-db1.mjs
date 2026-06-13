import { PrismaClient } from "@prisma/client";

const allowedHosts = new Set(["localhost", "127.0.0.1"]);
const expectedPort = "5434";
const expectedDatabaseNames = [/dev/i, /local/i];
const placeholderEmail = "dca-admin@example.local";
const placeholderTenantSlug = "digital-cube-agency";
const bootstrapAction = "bootstrap:db1";

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

  if (!allowedHosts.has(parsed.hostname)) {
    fail(`DATABASE_URL host must be localhost or 127.0.0.1, got ${parsed.hostname}.`);
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

  if (/prod|production|live/i.test(databaseName)) {
    fail(`DATABASE_URL database name looks unsafe, got ${databaseName}.`);
  }

  return { databaseName, hostname: parsed.hostname, port: parsed.port };
}

function json(value) {
  return value;
}

async function upsertTenant(prisma) {
  return prisma.tenant.upsert({
    where: { slug: placeholderTenantSlug },
    update: {
      name: "Digital Cube Agency",
      status: "ACTIVE"
    },
    create: {
      name: "Digital Cube Agency",
      slug: placeholderTenantSlug,
      status: "ACTIVE"
    }
  });
}

async function upsertUser(prisma) {
  return prisma.user.upsert({
    where: { email: placeholderEmail },
    update: {
      name: "DCA Admin Placeholder",
      status: "ACTIVE"
    },
    create: {
      email: placeholderEmail,
      name: "DCA Admin Placeholder",
      status: "ACTIVE"
    }
  });
}

async function upsertMembership(prisma, tenantId, userId) {
  return prisma.tenantMembership.upsert({
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
}

async function upsertRole(prisma, tenantId, role) {
  return prisma.role.upsert({
    where: {
      tenantId_key: {
        tenantId,
        key: role.key
      }
    },
    update: {
      name: role.name,
      description: role.description ?? null,
      status: "ACTIVE"
    },
    create: {
      tenantId,
      key: role.key,
      name: role.name,
      description: role.description ?? null,
      status: "ACTIVE"
    }
  });
}

async function upsertPermission(prisma, permission) {
  return prisma.permission.upsert({
    where: { key: permission.key },
    update: {
      moduleKey: permission.moduleKey ?? null,
      description: permission.description ?? null
    },
    create: {
      key: permission.key,
      moduleKey: permission.moduleKey ?? null,
      description: permission.description ?? null
    }
  });
}

async function upsertRolePermission(prisma, roleId, permissionId) {
  return prisma.rolePermission.upsert({
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
}

async function upsertMembershipRole(prisma, tenantMembershipId, roleId) {
  return prisma.membershipRole.upsert({
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
}

async function upsertModuleDefinition(prisma, moduleDefinition) {
  return prisma.moduleDefinition.upsert({
    where: { key: moduleDefinition.key },
    update: {
      name: moduleDefinition.name,
      description: moduleDefinition.description ?? null,
      status: "ACTIVE"
    },
    create: {
      key: moduleDefinition.key,
      name: moduleDefinition.name,
      description: moduleDefinition.description ?? null,
      status: "ACTIVE"
    }
  });
}

async function upsertTenantModule(prisma, tenantId, moduleDefinitionId) {
  return prisma.tenantModule.upsert({
    where: {
      tenantId_moduleDefinitionId: {
        tenantId,
        moduleDefinitionId
      }
    },
    update: {
      status: "ACTIVE"
    },
    create: {
      tenantId,
      moduleDefinitionId,
      status: "ACTIVE"
    }
  });
}

async function upsertTenantSetting(prisma, tenantId, setting) {
  return prisma.tenantSetting.upsert({
    where: {
      tenantId_key: {
        tenantId,
        key: setting.key
      }
    },
    update: {
      moduleKey: setting.moduleKey ?? null,
      valueType: setting.valueType,
      value: json(setting.value)
    },
    create: {
      tenantId,
      key: setting.key,
      moduleKey: setting.moduleKey ?? null,
      valueType: setting.valueType,
      value: json(setting.value)
    }
  });
}

async function ensureBootstrapAuditLog(prisma, tenantId, userId) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      tenantId,
      action: bootstrapAction,
      entityType: "system",
      entityId: placeholderTenantSlug
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.auditLog.create({
    data: {
      tenantId,
      actorType: "SYSTEM",
      actorUserId: userId,
      action: bootstrapAction,
      entityType: "system",
      entityId: placeholderTenantSlug,
      metadata: {
        seedVersion: "db1-local",
        tenantSlug: placeholderTenantSlug
      }
    }
  });
}

async function main() {
  const { databaseName, hostname, port } = assertLocalDatabaseUrl();
  const prisma = new PrismaClient();

  try {
    console.log(`Seeding DB-1 local data into ${databaseName} at ${hostname}:${port}`);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await upsertTenant(tx);
      const user = await upsertUser(tx);
      const membership = await upsertMembership(tx, tenant.id, user.id);

      const roles = {
        owner: await upsertRole(tx, tenant.id, {
          key: "owner",
          name: "Owner"
        }),
        admin: await upsertRole(tx, tenant.id, {
          key: "admin",
          name: "Admin"
        }),
        member: await upsertRole(tx, tenant.id, {
          key: "member",
          name: "Member"
        }),
        viewer: await upsertRole(tx, tenant.id, {
          key: "viewer",
          name: "Viewer"
        })
      };

      const permissions = {
        settingsRead: await upsertPermission(tx, { key: "settings:read", moduleKey: "settings" }),
        settingsUpdate: await upsertPermission(tx, { key: "settings:update", moduleKey: "settings" }),
        usersRead: await upsertPermission(tx, { key: "users:read", moduleKey: "users" }),
        usersInvite: await upsertPermission(tx, { key: "users:invite", moduleKey: "users" }),
        rolesManage: await upsertPermission(tx, { key: "roles:manage", moduleKey: "roles" }),
        modulesManage: await upsertPermission(tx, { key: "modules:manage", moduleKey: "modules" }),
        auditRead: await upsertPermission(tx, { key: "audit:read", moduleKey: "audit" })
      };

      const moduleDefinitions = {
        dashboard: await upsertModuleDefinition(tx, {
          key: "dashboard",
          name: "Dashboard"
        }),
        settings: await upsertModuleDefinition(tx, {
          key: "settings",
          name: "Settings"
        }),
        users: await upsertModuleDefinition(tx, {
          key: "users",
          name: "Users"
        }),
        roles: await upsertModuleDefinition(tx, {
          key: "roles",
          name: "Roles"
        }),
        audit: await upsertModuleDefinition(tx, {
          key: "audit",
          name: "Audit"
        }),
        modules: await upsertModuleDefinition(tx, {
          key: "modules",
          name: "Modules"
        })
      };

      const rolePermissionMap = {
        owner: Object.values(permissions),
        admin: Object.values(permissions),
        member: [permissions.settingsRead, permissions.usersRead, permissions.auditRead],
        viewer: [permissions.settingsRead, permissions.auditRead]
      };

      for (const [roleKey, permissionRows] of Object.entries(rolePermissionMap)) {
        const role = roles[roleKey];
        for (const permission of permissionRows) {
          await upsertRolePermission(tx, role.id, permission.id);
        }
      }

      await upsertMembershipRole(tx, membership.id, roles.owner.id);
      await upsertMembershipRole(tx, membership.id, roles.admin.id);

      for (const moduleDefinition of Object.values(moduleDefinitions)) {
        await upsertTenantModule(tx, tenant.id, moduleDefinition.id);
      }

      const settings = [
        {
          key: "platformName",
          moduleKey: "settings",
          valueType: "STRING",
          value: "Digital Cube Agency"
        },
        {
          key: "supportEmail",
          moduleKey: "settings",
          valueType: "STRING",
          value: placeholderEmail
        },
        {
          key: "seedVersion",
          moduleKey: "settings",
          valueType: "STRING",
          value: "db1-local"
        }
      ];

      for (const setting of settings) {
        await upsertTenantSetting(tx, tenant.id, setting);
      }

      await ensureBootstrapAuditLog(tx, tenant.id, user.id);

      return {
        tenantId: tenant.id,
        userId: user.id,
        membershipId: membership.id,
        roleCount: Object.keys(roles).length,
        permissionCount: Object.keys(permissions).length,
        moduleCount: Object.keys(moduleDefinitions).length,
        settingCount: settings.length
      };
    });

    const [tenantCount, userCount, membershipCount, roleCount, permissionCount, moduleCount, settingCount, auditCount] =
      await Promise.all([
        prisma.tenant.count(),
        prisma.user.count(),
        prisma.tenantMembership.count(),
        prisma.role.count(),
        prisma.permission.count(),
        prisma.moduleDefinition.count(),
        prisma.tenantSetting.count(),
        prisma.auditLog.count()
      ]);

    console.log(
      JSON.stringify(
        {
          seed: "db1-local",
          result,
          counts: {
            tenantCount,
            userCount,
            membershipCount,
            roleCount,
            permissionCount,
            moduleCount,
            settingCount,
            auditCount
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
