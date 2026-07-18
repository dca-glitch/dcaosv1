import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { assertLocalTarget, executeBackfill, inspectApprovedScope, reconcile } from "./p1-execution-local.mjs";

const SOURCE_CONTAINER = "dcaosv1-postgres-dev";
const RESTORE_CONTAINER = "dcaosv1-postgres-restore-p1";
export function parseBackupArgs(args) {
  const parsed = { execute: false, backupDir: null };
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (["--apply", "--approve", "--backfill", "--cleanup", "--reconcile", "--switch"].includes(value)) throw new Error(`Forbidden flag ${value}.`);
    if (value === "--execute") { parsed.execute = true; continue; }
    if (value === "--backup-dir") { parsed.backupDir = args[++index] ?? null; continue; }
    if (value === "--help") return { help: true };
    throw new Error(`Unsupported argument ${value}.`);
  }
  if (!parsed.execute) throw new Error("Explicit --execute is required.");
  if (!parsed.backupDir || !path.isAbsolute(parsed.backupDir) || path.resolve(parsed.backupDir).startsWith(path.resolve(process.cwd()) + path.sep)) throw new Error("--backup-dir must be an absolute path outside the repository.");
  return parsed;
}
function docker(args, options = {}) { return execFileSync("docker", args, { encoding: options.encoding ?? "utf8", ...options }); }
function hasContainer(name) { return docker(["ps", "-a", "--filter", `name=^/${name}$`, "--format", "{{.Names}}"], { encoding: "utf8" }).trim() === name; }
function replacePort(url, port) { const value = new URL(url); value.port = port; return value.toString(); }
export async function runBackupRehearsal(args, env = process.env, io = { stdout: process.stdout, stderr: process.stderr }) {
  try {
    const options = parseBackupArgs(args); if (options.help) { io.stdout.write("Usage: workspace:backup-rehearsal:local --execute --backup-dir <absolute-untracked-path>\n"); return 0; }
    assertLocalTarget(env.DATABASE_URL, "source");
    if (docker(["port", SOURCE_CONTAINER, "5432/tcp"]).trim() !== "127.0.0.1:5434") throw new Error("SOURCE_CONTAINER_TARGET_MISMATCH");
    if (hasContainer(RESTORE_CONTAINER)) throw new Error("RESTORE_TARGET_EXISTS_OR_UNKNOWN: refusing overwrite or cleanup.");
    const source = new PrismaClient();
    let scope;
    try {
      const writers = await source.$queryRaw`SELECT count(*)::int AS count FROM pg_stat_activity WHERE datname = current_database() AND state = 'active' AND pid <> pg_backend_pid() AND query !~* '^\\s*(select|show|set)'`;
      if (Number(writers[0].count) !== 0) throw new Error("ACTIVE_WRITER_ABORT");
      scope = await inspectApprovedScope(source); if (scope.blockers.length) throw new Error(`SOURCE_PREFLIGHT_ABORT:${scope.blockers.join(",")}`);
      scope.migrationState = await source.$queryRawUnsafe('SELECT migration_name, finished_at IS NOT NULL AS finished FROM "_prisma_migrations" ORDER BY migration_name');
      scope.workspaceFoundationPresent = (await source.$queryRaw`SELECT to_regclass('public."Workspace"') IS NOT NULL AS present`)[0].present;
    } finally { await source.$disconnect(); }
    await mkdir(options.backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-"); const backupPath = path.join(options.backupDir, `p1-local-${timestamp}.dump`);
    const dump = docker(["exec", SOURCE_CONTAINER, "sh", "-c", "pg_dump -Fc -C -U \"$POSTGRES_USER\" \"$POSTGRES_DB\""], { encoding: "buffer", maxBuffer: 1024 * 1024 * 1024 });
    await writeFile(backupPath, dump); const backupSha256 = createHash("sha256").update(dump).digest("hex");
    await writeFile(`${backupPath}.manifest.json`, JSON.stringify({ target: "127.0.0.1:5434", backupSha256, counts: scope.counts, hashes: scope.hashes, excludedNoRoleMembershipIds: scope.noRoleMembershipIds, schema: { migrations: scope.migrationState, workspaceFoundationPresent: scope.workspaceFoundationPresent }, safety: { activeWriterCount: 0, rawDataIncluded: false } }, null, 2));
    const image = docker(["inspect", SOURCE_CONTAINER, "--format", "{{.Config.Image}}"]).trim();
    docker(["run", "-d", "--name", RESTORE_CONTAINER, "--publish", "127.0.0.1:5435:5432", "-e", "POSTGRES_USER=dcaosv1_dev", "-e", "POSTGRES_DB=postgres", "-e", "POSTGRES_HOST_AUTH_METHOD=trust", image]);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    for (let attempt = 0; attempt < 30; attempt += 1) { try { docker(["exec", RESTORE_CONTAINER, "pg_isready", "-U", "dcaosv1_dev", "-d", "postgres"]); break; } catch { if (attempt === 29) throw new Error("RESTORE_TARGET_NOT_READY"); await new Promise((resolve) => setTimeout(resolve, 1000)); } }
    docker(["exec", "-i", RESTORE_CONTAINER, "pg_restore", "--no-owner", "--no-acl", "-C", "-d", "postgres", "-U", "dcaosv1_dev"], { input: dump, encoding: "buffer", maxBuffer: 1024 * 1024 * 1024 });
    const restoreUrl = replacePort(env.DATABASE_URL, "5435");
    execFileSync("C:\\Windows\\System32\\cmd.exe", ["/d", "/s", "/c", "npm exec -- prisma migrate deploy"], { cwd: path.resolve("packages/data"), env: { ...env, DATABASE_URL: restoreUrl }, stdio: "inherit" });
    const prisma = new PrismaClient({ datasources: { db: { url: restoreUrl } } });
    try {
      const backfill = await executeBackfill(prisma); const reconciliation = await reconcile(prisma);
      if (reconciliation.status !== "RECONCILIATION_PASSED") throw new Error("REHEARSAL_RECONCILIATION_FAILED");
      io.stdout.write(`${JSON.stringify({ status: "RESTORE_REHEARSAL_PASSED", backupPath, backupSha256, backfill: backfill.status, reconciliation: reconciliation.status }, null, 2)}\n`); return 0;
    } finally { await prisma.$disconnect(); }
  } catch (error) { io.stderr.write(`P1 BACKUP/RESTORE REHEARSAL ABORT: ${error.message}\n`); return 64; }
}
if (process.argv[1]?.endsWith("p1-local-backup-rehearsal.mjs")) process.exitCode = await runBackupRehearsal(process.argv.slice(2));
