import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const allowedHosts = new Set(["localhost", "127.0.0.1", "::1"]);

export async function runIsolatedPostgresProof(input) {
  const sourceUrl = process.env.DATABASE_URL;
  if (!sourceUrl) {
    throw new Error("DATABASE_URL must reference a local PostgreSQL database.");
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
    throw new Error("The source database must be explicitly local/dev/test and non-production.");
  }

  const databaseName =
    `dcaosv1_bridge_test_${Date.now()}_${randomBytes(3).toString("hex")}`;
  const adminUrl = new URL(parsed);
  adminUrl.pathname = "/postgres";
  const testUrl = new URL(parsed);
  testUrl.pathname = `/${databaseName}`;
  const admin = new PrismaClient({ datasources: { db: { url: adminUrl.toString() } } });
  const prismaCommand = path.join(
    input.root,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "prisma.cmd" : "prisma"
  );

  let status = 1;
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
    console.log("[BOUNDED_BRIDGE] isolated local test database created");
    const migrate = spawnSync(
      prismaCommand,
      ["migrate", "deploy", "--schema", "packages/data/prisma/schema.prisma"],
      {
        cwd: input.root,
        env: { ...process.env, DATABASE_URL: testUrl.toString() },
        encoding: "utf8",
        shell: process.platform === "win32"
      }
    );
    if (migrate.status !== 0) {
      process.stderr.write(migrate.stderr || migrate.error?.message || "Migration failed.\n");
      throw new Error("Migrations did not apply to the isolated database.");
    }
    console.log("[BOUNDED_BRIDGE] migrations applied to isolated database");

    const child = spawnSync(process.execPath, input.nodeArgs, {
      cwd: input.root,
      env: {
        ...process.env,
        ...input.env,
        DATABASE_URL: testUrl.toString()
      },
      encoding: "utf8"
    });
    process.stdout.write(child.stdout);
    process.stderr.write(child.stderr);
    status = child.status ?? 1;
  } finally {
    await admin.$executeRawUnsafe(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${databaseName}' AND pid <> pg_backend_pid()`
    );
    await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${databaseName}"`);
    await admin.$disconnect();
    console.log("[BOUNDED_BRIDGE] isolated local test database dropped");
  }
  if (status !== 0) {
    throw new Error(`${input.label} failed.`);
  }
}
