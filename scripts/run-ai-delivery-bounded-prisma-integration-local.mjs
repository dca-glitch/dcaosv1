import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceUrl = process.env.DATABASE_URL;
const allowedHosts = new Set(["localhost", "127.0.0.1", "::1"]);

if (!sourceUrl) {
  throw new Error("DATABASE_URL must reference a local PostgreSQL database for the isolated proof.");
}

const parsed = new URL(sourceUrl);
const sourceDatabase = parsed.pathname.replace(/^\/+/, "");
if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
  throw new Error("The isolated proof requires PostgreSQL.");
}
if (!allowedHosts.has(parsed.hostname)) {
  throw new Error("The isolated proof refuses non-loopback database hosts.");
}
if (!/(local|dev|test)/i.test(sourceDatabase) || /(prod|staging)/i.test(sourceDatabase)) {
  throw new Error("The source database name must be explicitly local/dev/test and non-production.");
}

const databaseName = `dcaosv1_bounded_test_${Date.now()}_${randomBytes(3).toString("hex")}`;
if (!/^[a-z0-9_]+$/.test(databaseName)) {
  throw new Error("Generated test database name failed validation.");
}

const adminUrl = new URL(parsed);
adminUrl.pathname = "/postgres";
const testUrl = new URL(parsed);
testUrl.pathname = `/${databaseName}`;
const admin = new PrismaClient({
  datasources: { db: { url: adminUrl.toString() } }
});

const prismaCommand = path.join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma"
);

let testStatus = 1;
try {
  await admin.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
  console.log("[BOUNDED_PRISMA] isolated local test database created");

  const migrate = spawnSync(
    prismaCommand,
    ["migrate", "deploy", "--schema", "packages/data/prisma/schema.prisma"],
    {
      cwd: root,
      env: { ...process.env, DATABASE_URL: testUrl.toString() },
      encoding: "utf8",
      shell: process.platform === "win32"
    }
  );
  if (migrate.status !== 0) {
    process.stderr.write(migrate.stderr || migrate.error?.message || "Prisma migrate deploy failed.\n");
    throw new Error("Additive migrations did not apply to the isolated local test database.");
  }
  console.log("[BOUNDED_PRISMA] repository migrations applied to isolated database");

  const test = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--test",
      "apps/api/tests/integration/ai-delivery-bounded-workflow.prisma.integration.test.ts"
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        DATABASE_URL: testUrl.toString(),
        BOUNDED_WORKFLOW_PRISMA_TEST: "true"
      },
      encoding: "utf8"
    }
  );
  process.stdout.write(test.stdout);
  process.stderr.write(test.stderr);
  testStatus = test.status ?? 1;
} finally {
  await admin.$executeRawUnsafe(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${databaseName}' AND pid <> pg_backend_pid()`
  );
  await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${databaseName}"`);
  await admin.$disconnect();
  console.log("[BOUNDED_PRISMA] isolated local test database dropped");
}

if (testStatus !== 0) {
  throw new Error("Prisma-backed bounded workflow integration proof failed.");
}
