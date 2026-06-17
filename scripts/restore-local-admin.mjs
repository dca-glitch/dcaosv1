import fs from "node:fs";
import path from "node:path";

function loadEnvFile() {
  const envPath = path.resolve(".env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

function disableLocalTurnstile() {
  const envPath = path.resolve(".env");
  if (!fs.existsSync(envPath)) return false;

  const original = fs.readFileSync(envPath, "utf8");
  const lines = original.split(/\r?\n/);
  let found = false;
  let changed = false;

  const nextLines = lines.map((line) => {
    if (/^\s*TURNSTILE_ENABLED\s*=/.test(line)) {
      found = true;
      if (line.trim() !== "TURNSTILE_ENABLED=false") changed = true;
      return "TURNSTILE_ENABLED=false";
    }
    return line;
  });

  if (!found) {
    nextLines.push("TURNSTILE_ENABLED=false");
    changed = true;
  }

  if (changed) {
    const backupPath = path.resolve(`.env.local-login-backup-${Date.now()}`);
    fs.writeFileSync(backupPath, original, "utf8");
    fs.writeFileSync(envPath, nextLines.join("\n"), "utf8");
  }

  return true;
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

loadEnvFile();
const turnstileDisabled = disableLocalTurnstile();
loadEnvFile();

const email = (process.env.LOCAL_ADMIN_EMAIL ?? "admin@dca.local").toLowerCase();
const password = requiredEnv("LOCAL_ADMIN_PASSWORD");

const { PrismaClient } = await import("@prisma/client");
const { hashPassword, verifyPassword } = await import("../apps/api/src/auth/password.service.ts");

const prisma = new PrismaClient();

try {
  const passwordHash = hashPassword(password);

  let tenant = await prisma.tenant.findFirst({ where: { slug: "local-dca" } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: "Local DCA",
        slug: "local-dca",
        status: "ACTIVE"
      }
    });
  } else if (tenant.name !== "Local DCA" || tenant.status !== "ACTIVE" || tenant.deletedAt) {
    tenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        name: "Local DCA",
        status: "ACTIVE",
        deletedAt: null
      }
    });
  }

  let user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive"
      }
    }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: "Local Admin",
        status: "ACTIVE",
        passwordHash,
        forcePasswordChange: false,
        failedLoginCount: 0,
        lockedUntil: null
      }
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email,
        name: user.name ?? "Local Admin",
        status: "ACTIVE",
        passwordHash,
        forcePasswordChange: false,
        failedLoginCount: 0,
        lockedUntil: null,
        deletedAt: null
      }
    });
  }

  let membership = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: user.id
      }
    }
  });

  if (!membership) {
    membership = await prisma.tenantMembership.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        status: "ACTIVE"
      }
    });
  } else if (membership.status !== "ACTIVE" || membership.deletedAt) {
    membership = await prisma.tenantMembership.update({
      where: { id: membership.id },
      data: {
        status: "ACTIVE",
        deletedAt: null
      }
    });
  }

  let role = await prisma.role.findUnique({
    where: {
      tenantId_key: {
        tenantId: tenant.id,
        key: "owner"
      }
    }
  });

  if (!role) {
    role = await prisma.role.create({
      data: {
        tenantId: tenant.id,
        key: "owner",
        name: "Owner",
        status: "ACTIVE",
        deletedAt: null
      }
    });
  } else if (role.name !== "Owner" || role.status !== "ACTIVE" || role.deletedAt) {
    role = await prisma.role.update({
      where: { id: role.id },
      data: {
        name: "Owner",
        status: "ACTIVE",
        deletedAt: null
      }
    });
  }

  let membershipRole = await prisma.membershipRole.findUnique({
    where: {
      tenantMembershipId_roleId: {
        tenantMembershipId: membership.id,
        roleId: role.id
      }
    }
  });

  if (!membershipRole) {
    membershipRole = await prisma.membershipRole.create({
      data: {
        tenantMembershipId: membership.id,
        roleId: role.id
      }
    });
  }

  const savedUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!savedUser?.passwordHash || !verifyPassword(password, savedUser.passwordHash)) {
    throw new Error("Local admin was written but password verification failed.");
  }

  const activeMembership = await prisma.tenantMembership.findFirst({
    where: {
      id: membership.id,
      tenantId: tenant.id,
      userId: user.id,
      status: "ACTIVE",
      deletedAt: null
    }
  });
  if (!activeMembership) {
    throw new Error("Local admin active tenant membership verification failed.");
  }

  const ownerMembershipRole = await prisma.membershipRole.findFirst({
    where: {
      tenantMembershipId: membership.id,
      role: {
        tenantId: tenant.id,
        key: "owner",
        status: "ACTIVE",
        deletedAt: null
      }
    }
  });
  if (!ownerMembershipRole) {
    throw new Error("Local admin owner role verification failed.");
  }

  console.log("Local admin restored.");
  console.log(`Email: ${email}`);
  console.log("Password printed: no");
  console.log(`Active tenant membership: ${activeMembership ? "yes" : "no"}`);
  console.log(`Owner role: ${ownerMembershipRole ? "yes" : "no"}`);
  console.log(`Turnstile disabled locally: ${turnstileDisabled ? "yes" : "no"}`);
  console.log("Restart required: yes");
} finally {
  await prisma.$disconnect();
}
