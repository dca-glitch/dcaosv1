import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { EXIT_CODES, createP12aDryRunReport, formatP12aSummary, parseP12aCliArgs, runP12aCli } from "./p1-2a-mapping-dry-run.mjs";

function validSnapshot() {
  return {
    tenants: [{ id: "tenant-a", status: "ACTIVE" }],
    clients: [{ id: "client-a", tenantId: "tenant-a" }],
    workspaces: [{ id: "workspace-a" }],
    tenantMemberships: [],
    proposedTenantWorkspaceMappings: [{ tenantId: "tenant-a", workspaceId: "workspace-a" }]
  };
}

test("P1.2a produces deterministic sanitized plans for unambiguous candidates", () => {
  const first = createP12aDryRunReport(validSnapshot());
  const second = createP12aDryRunReport(validSnapshot());
  assert.deepEqual(first, second);
  assert.equal(first.status, "VALIDATION_PASSED");
  assert.equal(first.dataMutation, false);
  assert.equal(first.executionApplyMode, "DISABLED_BY_DESIGN");
  assert.deepEqual(first.plannedBindings, [{ operation: "PLAN_TENANT_TO_WORKSPACE_BINDING", tenantId: "tenant-a", workspaceId: "workspace-a", clientIds: ["client-a"], execution: "NOT_EXECUTED" }]);
  assert.match(JSON.stringify(first), /DRY_RUN_ONLY/);
  assert.match(formatP12aSummary(first), /NO DATA MUTATION/);
});

test("P1.2a fails closed for missing, ambiguous, duplicate, orphan, and role exceptions", () => {
  const snapshot = validSnapshot();
  snapshot.tenants.push({ id: "tenant-b", status: "ACTIVE" }, { id: "tenant-c", status: "ACTIVE" }, { id: "tenant-d", status: "ACTIVE" });
  snapshot.clients.push({ id: "client-orphan", tenantId: "missing-tenant" });
  snapshot.tenantMemberships.push({ id: "membership-orphan", tenantId: "missing-tenant", status: "ACTIVE", roleKeys: [] }, { id: "membership-role", tenantId: "tenant-a", status: "ACTIVE", roleKeys: ["OWNER"] });
  snapshot.proposedTenantWorkspaceMappings.push({ tenantId: "tenant-a", workspaceId: "workspace-a" }, { tenantId: "tenant-b", workspaceId: "workspace-a" }, { tenantId: "tenant-c", workspaceId: "workspace-a" }, { tenantId: "tenant-c", workspaceId: "workspace-missing" }, { tenantId: "tenant-not-in-snapshot", workspaceId: "workspace-a" });
  const report = createP12aDryRunReport(snapshot);
  assert.equal(report.status, "VALIDATION_BLOCKED");
  assert.equal(report.counts.missingMappings, 1);
  assert.equal(report.counts.ambiguousMappings, 1);
  assert.equal(report.counts.duplicateMappings, 2);
  assert.equal(report.counts.unsupportedMappings, 1);
  assert.equal(report.counts.orphanedLegacyRecords, 2);
  assert.equal(report.counts.membershipRoleExceptions, 1);
  assert.equal(report.plannedBindings.length, 0);
});

test("P1.2a rejects all execution flags and exposes no apply mode", () => {
  for (const flag of ["--apply", "--execute", "--mutation", "--mutate", "--write", "--apply=true", "--execute=false", "--mutation=1", "--mutate=yes", "--write=plan"]) {
    assert.throws(() => parseP12aCliArgs([flag]), /forbidden/);
  }
});

test("P1.2a fails closed for duplicate snapshot identifiers", () => {
  for (const [field, duplicate] of [
    ["tenants", { id: "tenant-a", status: "ACTIVE" }],
    ["workspaces", { id: "workspace-a" }],
    ["tenantMemberships", { id: "membership-a", tenantId: "tenant-a", status: "ACTIVE", roleKeys: [] }]
  ]) {
    const snapshot = validSnapshot();
    if (field === "tenantMemberships") snapshot.tenantMemberships.push(duplicate, duplicate);
    else snapshot[field].push(duplicate);
    assert.throws(() => createP12aDryRunReport(snapshot), /Duplicate/);
  }
});

test("P1.2a CLI returns an invalid-argument exit code for apply flags", async () => {
  const exitCode = await runP12aCli(["--apply"], { readFile: async () => "{}", stdout: { write() {} }, stderr: { write() {} } });
  assert.equal(exitCode, EXIT_CODES.INVALID_ARGUMENT);
});

test("P1.2a CLI returns stable JSON through its snapshot-only I/O boundary", async () => {
  const writes = [];
  const io = {
    readFile: async () => JSON.stringify(validSnapshot()),
    stdout: { write: (value) => writes.push(value) },
    stderr: { write: (value) => writes.push(value) }
  };
  const exitCode = await runP12aCli(["--snapshot", "snapshot.json", "--format", "json"], io);
  assert.equal(exitCode, EXIT_CODES.OK);
  assert.deepEqual(JSON.parse(writes.join("")), createP12aDryRunReport(validSnapshot()));
});

test("P1.2a has no Prisma or mutating database operation path", () => {
  const source = readFileSync(fileURLToPath(new URL("./p1-2a-mapping-dry-run.mjs", import.meta.url)), "utf8");
  assert.equal(createP12aDryRunReport.length, 1, "mapping core accepts only a snapshot");
  assert.doesNotMatch(source, /@prisma\/client|PrismaClient|\$executeRaw|\$queryRaw/);
  assert.doesNotMatch(source, /\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/);
});

test("P1.2a CLI returns a meaningful blocked exit code without mutating anything", async () => {
  const snapshot = validSnapshot();
  snapshot.proposedTenantWorkspaceMappings = [];
  const writes = [];
  const exitCode = await runP12aCli(["--snapshot", "snapshot.json"], {
    readFile: async () => JSON.stringify(snapshot),
    stdout: { write: (value) => writes.push(value) },
    stderr: { write: (value) => writes.push(value) }
  });
  assert.equal(exitCode, EXIT_CODES.VALIDATION_BLOCKED);
  assert.match(writes.join(""), /P1.2A DRY RUN/);
});
