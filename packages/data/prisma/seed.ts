import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "../../../apps/api/src/auth/password.service.ts";

const ADMIN_EMAIL = "admin@dca.local";
const ADMIN_PASSWORD = "Admin123!";
const ADMIN_NAME = "Local Admin";
const DEFAULT_TENANT_SLUG = "local-dca";
const DEFAULT_TENANT_NAME = "Local DCA";
const ADMIN_ROLE_KEY = "owner";
const ADMIN_ROLE_NAME = "Owner";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = hashPassword(ADMIN_PASSWORD);

  const tenant = await prisma.tenant.upsert({
    where: { slug: DEFAULT_TENANT_SLUG },
    update: {
      name: DEFAULT_TENANT_NAME,
      status: "ACTIVE",
      deletedAt: null
    },
    create: {
      slug: DEFAULT_TENANT_SLUG,
      name: DEFAULT_TENANT_NAME,
      status: "ACTIVE"
    }
  });

  const existingUser = await prisma.user.findFirst({
    where: {
      email: {
        equals: ADMIN_EMAIL,
        mode: "insensitive"
      }
    }
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          email: ADMIN_EMAIL,
          name: existingUser.name ?? ADMIN_NAME,
          status: "ACTIVE",
          passwordHash,
          forcePasswordChange: false,
          failedLoginCount: 0,
          lockedUntil: null,
          deletedAt: null
        }
      })
    : await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
          status: "ACTIVE",
          passwordHash,
          forcePasswordChange: false,
          failedLoginCount: 0,
          lockedUntil: null
        }
      });

  const membership = await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: user.id
      }
    },
    update: {
      status: "ACTIVE",
      deletedAt: null
    },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      status: "ACTIVE"
    }
  });

  const ownerRole = await prisma.role.upsert({
    where: {
      tenantId_key: {
        tenantId: tenant.id,
        key: ADMIN_ROLE_KEY
      }
    },
    update: {
      name: ADMIN_ROLE_NAME,
      description: "Full tenant owner access.",
      status: "ACTIVE",
      deletedAt: null
    },
    create: {
      tenantId: tenant.id,
      key: ADMIN_ROLE_KEY,
      name: ADMIN_ROLE_NAME,
      description: "Full tenant owner access.",
      status: "ACTIVE"
    }
  });

  const clientRole = await prisma.role.upsert({
    where: {
      tenantId_key: {
        tenantId: tenant.id,
        key: "client"
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      key: "client",
      name: "Client",
      description: "Portal access only.",
      status: "ACTIVE"
    }
  });

  await prisma.membershipRole.upsert({
    where: {
      tenantMembershipId_roleId: {
        tenantMembershipId: membership.id,
        roleId: ownerRole.id
      }
    },
    update: {},
    create: {
      tenantMembershipId: membership.id,
      roleId: ownerRole.id
    }
  });

  const legacyAdminRole = await prisma.role.findUnique({
    where: { tenantId_key: { tenantId: tenant.id, key: "admin" } },
    select: { id: true }
  });
  if (legacyAdminRole) {
    await prisma.membershipRole.deleteMany({
      where: { tenantMembershipId: membership.id, roleId: legacyAdminRole.id }
    });
  }

  const savedUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!savedUser?.passwordHash || !verifyPassword(ADMIN_PASSWORD, savedUser.passwordHash)) {
    throw new Error("Admin seed completed but password verification failed.");
  }

  console.log("Seed complete: admin user ready.");
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Tenant: ${tenant.slug}`);
  console.log(`Role: ${ADMIN_ROLE_KEY}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
