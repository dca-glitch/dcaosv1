import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  P2A_EXIT_CODES,
  P2A_REPORT_VERSION,
  P2A_SNAPSHOT_SCHEMA_VERSION,
  P2AValidationError,
  computeClientUserAccessSha256,
  computeSnapshotSha256,
  parseP2aCliArgs,
  runP2aCli,
  validateP2aSnapshot
} from "./p2-a-offline-foundation.mjs";

const fixturePath = fileURLToPath(new URL("../fixtures/p2-a-synthetic-valid.json", import.meta.url));
const policyPath = fileURLToPath(new URL("../fixtures/p2-a-synthetic-policy.json", import.meta.url));
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const fixture = () => readJson(fixturePath);
const policy = () => readJson(policyPath);
const clone = (value) => JSON.parse(JSON.stringify(value));

test("P2-A validates the synthetic offline contract and classifies exactly six known no-role records", () => {
  const report = validateP2aSnapshot(fixture(), policy());
  assert.equal(report.reportVersion, P2A_REPORT_VERSION);
  assert.equal(report.snapshotSchemaVersion, P2A_SNAPSHOT_SCHEMA_VERSION);
  assert.equal(report.status, "VALIDATION_PASSED");
  assert.equal(report.databaseAccess, false);
  assert.equal(report.dataMutation, false);
  assert.equal(report.snapshotProcessing, "NOT_EXECUTED");
  assert.equal(report.phase2Runtime, "NOT_STARTED");
  assert.equal(report.counts.knownNoRoleMemberships, 6);
  assert.equal(report.exceptions.knownNoRoleMemberships.length, 6);
  assert.ok(report.exceptions.knownNoRoleMemberships.every((item) => item.classification === "OWNER_REMEDIATION_REQUIRED" && item.defaultRole === null && item.accessGranted === false));
  assert.equal(report.accessInvariant.preserved, true);
  assert.equal(report.accessInvariant.workspaceDerivedGrants, 0);
  assert.equal(report.decisionEvidencePacket.decision, "P2_B_GATE_REQUIRED");
});

test("P2-A manifest and ClientUserAccess hashes are deterministic across record ordering", () => {
  const first = fixture();
  const second = fixture();
  second.records.clients.reverse();
  second.records.memberships.reverse();
  second.records.clientUserAccess.reverse();
  second.proposedMappings.clientToWorkspace.reverse();
  second.proposedMappings.membershipRoles.reverse();
  assert.equal(computeSnapshotSha256(first), computeSnapshotSha256(second));
  assert.equal(computeClientUserAccessSha256(first.records.clientUserAccess), computeClientUserAccessSha256(second.records.clientUserAccess));
  assert.deepEqual(validateP2aSnapshot(first, policy()).mappings, validateP2aSnapshot(second, policy()).mappings);
});

test("P2-A fails closed for a new no-role exception", () => {
  const snapshot = fixture();
  snapshot.records.memberships.find((item) => item.membershipKey === "membership-no-role-06").membershipKey = "membership-new-no-role";
  snapshot.manifest.inputSha256 = computeSnapshotSha256(snapshot);
  assert.throws(() => validateP2aSnapshot(snapshot, policy()), (error) => error instanceof P2AValidationError && error.code === "UNAPPROVED_EXCEPTION");
});

test("P2-A fails closed for unknown roles, cross-tenant links, access drift, and known-exception mappings", () => {
  const unknownRole = fixture();
  unknownRole.records.memberships.find((item) => item.membershipKey === "membership-client").legacyRoleKeys = ["UNKNOWN_ROLE"];
  unknownRole.manifest.inputSha256 = computeSnapshotSha256(unknownRole);
  assert.throws(() => validateP2aSnapshot(unknownRole, policy()), /Unknown legacy role/);

  const crossTenant = fixture();
  crossTenant.records.clients[0].tenantKey = "tenant-other";
  crossTenant.manifest.inputSha256 = computeSnapshotSha256(crossTenant);
  assert.throws(() => validateP2aSnapshot(crossTenant, policy()), /unknown tenant|crosses the selected tenant boundary/);

  const accessDrift = fixture();
  accessDrift.accessInvariant.clientUserAccessCount = 3;
  accessDrift.manifest.inputSha256 = computeSnapshotSha256(accessDrift);
  assert.throws(() => validateP2aSnapshot(accessDrift, policy()), /ClientUserAccess count\/hash is not preserved/);

  const knownMapping = fixture();
  knownMapping.proposedMappings.membershipRoles.push({ membershipKey: "membership-no-role-01", userKey: "user-remediation-01", workspaceKey: "workspace-alpha", workspaceRoleKeys: ["CLIENT_USER"] });
  knownMapping.manifest.inputSha256 = computeSnapshotSha256(knownMapping);
  assert.throws(() => validateP2aSnapshot(knownMapping, policy()), /No role or access mapping may be proposed/);
});

test("P2-A rejects access-expansion mapping groups and every apply-like flag", () => {
  const expansion = fixture();
  expansion.proposedMappings.clientUserAccessGrants = [{ clientKey: "client-alpha", userKey: "user-remediation-01" }];
  expansion.manifest.inputSha256 = computeSnapshotSha256(expansion);
  assert.throws(() => validateP2aSnapshot(expansion, policy()), /Unsupported mapping groups/);
  for (const flag of ["--apply", "--execute", "--write", "--mutate", "--backfill", "--reconcile", "--switch", "--cleanup", "--snapshot-create", "--database", "--apply=true"]) {
    assert.throws(() => parseP2aCliArgs([flag]), /forbidden/);
  }
});

test("P2-A rejects raw fields and any ClientUserAccess grant for a known no-role user", () => {
  const rawField = fixture();
  rawField.records.clients[0].name = "forbidden-real-name";
  rawField.manifest.inputSha256 = computeSnapshotSha256(rawField);
  assert.throws(() => validateP2aSnapshot(rawField, policy()), /Forbidden raw or source field/);

  const knownAccess = fixture();
  knownAccess.records.clientUserAccess[0].userKey = "user-remediation-01";
  knownAccess.accessInvariant.clientUserAccessSha256 = computeClientUserAccessSha256(knownAccess.records.clientUserAccess);
  knownAccess.manifest.inputSha256 = computeSnapshotSha256(knownAccess);
  assert.throws(() => validateP2aSnapshot(knownAccess, policy()), /known no-role user/);
});

test("P2-A fails closed for orphan tenant and client mappings", () => {
  const orphanTenant = fixture();
  orphanTenant.proposedMappings.tenantToWorkspace.push({ tenantKey: "tenant-ghost", workspaceKey: "workspace-ghost" });
  orphanTenant.manifest.inputSha256 = computeSnapshotSha256(orphanTenant);
  assert.throws(() => validateP2aSnapshot(orphanTenant, policy()), /unknown or inactive tenant/);

  const orphanClient = fixture();
  orphanClient.proposedMappings.clientToWorkspace.push({ clientKey: "client-ghost", tenantKey: "tenant-alpha", workspaceKey: "workspace-alpha" });
  orphanClient.manifest.inputSha256 = computeSnapshotSha256(orphanClient);
  assert.throws(() => validateP2aSnapshot(orphanClient, policy()), /unknown or inactive client/);
});

test("P2-A rejects unsupported top-level snapshot fields", () => {
  const snapshot = fixture();
  snapshot.extra = "unsupported";
  snapshot.manifest.inputSha256 = computeSnapshotSha256(snapshot);
  assert.throws(() => validateP2aSnapshot(snapshot, policy()), /Unsupported top-level snapshot fields/);
});

test("P2-A CLI consumes only the tracked synthetic fixture and emits a no-snapshot evidence packet", async () => {
  const writes = [];
  const io = {
    readFile: async (filePath) => readFileSync(filePath, "utf8"),
    stdout: { write: (value) => writes.push(value) },
    stderr: { write: (value) => writes.push(value) }
  };
  const exitCode = await runP2aCli(["--snapshot", fixturePath, "--policy", policyPath, "--format", "json"], io);
  assert.equal(exitCode, P2A_EXIT_CODES.OK);
  const report = JSON.parse(writes.join(""));
  assert.equal(report.decisionEvidencePacket.realSnapshotConsumed, false);
  assert.equal(report.decisionEvidencePacket.databaseAccess, false);
  assert.equal(report.dataMutation, false);
});

test("P2-A source has no database client, environment connection, or mutation path", () => {
  const source = readFileSync(fileURLToPath(new URL("./p2-a-offline-foundation.mjs", import.meta.url)), "utf8");
  assert.doesNotMatch(source, /@prisma\/client|PrismaClient|DATABASE_URL|process\.env|\$executeRaw|\$queryRaw|child_process/);
  assert.doesNotMatch(source, /\.(?:create|createMany|updateMany|upsert|delete|deleteMany)\s*\(/);
});
