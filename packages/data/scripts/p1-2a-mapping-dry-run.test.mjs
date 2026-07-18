import assert from "node:assert/strict";
import test from "node:test";
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
  for (const flag of ["--apply", "--execute", "--mutation", "--mutate", "--write"]) {
    assert.throws(() => parseP12aCliArgs([flag]), /forbidden/);
  }
});

test("P1.2a CLI returns an invalid-argument exit code for apply flags", async () => {
  const exitCode = await runP12aCli(["--apply"], { readFile: async () => "{}", stdout: { write() {} }, stderr: { write() {} } });
  assert.equal(exitCode, EXIT_CODES.INVALID_ARGUMENT);
});

test("P1.2a CLI returns stable JSON and never receives a database client", async () => {
  const writes = [];
  const io = {
    readFile: async () => JSON.stringify(validSnapshot()),
    stdout: { write: (value) => writes.push(value) },
    stderr: { write: (value) => writes.push(value) }
  };
  const exitCode = await runP12aCli(["--snapshot", "snapshot.json", "--format", "json"], io);
  assert.equal(exitCode, EXIT_CODES.OK);
  assert.deepEqual(JSON.parse(writes.join("")), createP12aDryRunReport(validSnapshot()));
  assert.equal("create" in io, false);
  assert.equal("update" in io, false);
  assert.equal("upsert" in io, false);
  assert.equal("delete" in io, false);
  assert.equal("$executeRaw" in io, false);
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
