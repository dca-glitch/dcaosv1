import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function loadEnvFile(): void {
  const envPath = path.resolve(".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

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

function setLocalTurnstileDisabled(): void {
  const envPath = path.resolve(".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const original = fs.readFileSync(envPath, "utf8");
  const lines = original.split(/\r?\n/);
  let changed = false;
  let found = false;

  const nextLines = lines.map((line) => {
    if (/^\s*TURNSTILE_ENABLED\s*=/.test(line)) {
      found = true;
      if (line.trim() !== "TURNSTILE_ENABLED=false") {
        changed = true;
      }
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
    console.log(`Local .env updated: TURNSTILE_ENABLED=false. Backup: ${path.basename(backupPath)}`);
  } else {
    console.log("Local .env already has TURNSTILE_ENABLED=false.");
  }
}

function assertRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

loadEnvFile();
setLocalTurnstileDisabled();
loadEnvFile();

const email = (process.env.LOCAL_ADMIN_EMAIL ?? "admin@dca.local").toLowerCase();
const password = assertRequiredEnv("LOCAL_ADMIN_PASSWORD");

const { PrismaClient } = await import("@prisma/client");
const { hashPassword, verifyPassword } = await import("../apps/api/src/auth/password.service");

const prisma = new PrismaClient();
const passwordHash = hashPassword(password);

let tenant = await prisma.tenant.findFirst({
  where: { slug: "local-dca" }
});

if (!tenant) {
  tenant = await prisma.tenant.create({
    data: {
      id: crypto.randomUUID(),
      name: "Local DCA",
      slug: "local-dca",
      status: "ACTIVE"
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
      id: crypto.randomUUID(),
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
      lockedUntil: null
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
      id: crypto.randomUUID(),
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

const savedUser = await prisma.user.findUnique({
  where: { id: user.id }
});

if (!savedUser?.passwordHash || !verifyPassword(password, savedUser.passwordHash)) {
  await prisma.$disconnect();
  throw new Error("Local admin was written but password verification failed.");
}

await prisma.$disconnect();

console.log("Local admin restored.");
console.log(`Email: ${email}`);
console.log("Password printed: no");
console.log("Restart API/Web before login.");
