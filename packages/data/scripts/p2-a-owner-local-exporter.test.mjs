import assert from "node:assert/strict";
import test from "node:test";
import { buildP2aOwnerSnapshot, derivePseudonymousKey, exportP2aOwnerSnapshot, parseP2aOwnerExporterArgs, P2A_OWNER_EXPORTER_OUTPUT_DIRECTORY, P2A_OWNER_EXPORTER_TARGET } from "./p2-a-owner-local-exporter.mjs";

const policy = { knownNoRoleMembershipKeys: Array.from({ length: 6 }, (_, index) => derivePseudonymousKey("membership", String(index + 1))), approvedLegacyRoleKeys: ["OWNER", "CLIENT_USER"], approvedWorkspaceRoleKeys: ["ADMIN", "WORKSPACE_MANAGER", "TEAM_MEMBER", "CLIENT_MANAGER", "CLIENT_USER"] };
const population = {
  tenants: [{ sourceKey: "synthetic-tenant", status: "ACTIVE" }], clients: [{ sourceKey: "synthetic-client", status: "ACTIVE" }],
  memberships: [{ sourceKey: "owner", userSourceKey: "owner-user", status: "ACTIVE", legacyRoleKeys: ["OWNER"] }, ...Array.from({ length: 6 }, (_, index) => ({ sourceKey: String(index + 1), userSourceKey: `n${index + 1}`, status: "ACTIVE", legacyRoleKeys: [] }))],
  clientUserAccess: [{ sourceKey: "access", clientSourceKey: "synthetic-client", userSourceKey: "owner-user", status: "ACTIVE" }]
};
const authorization = { kind: "P2_A_OWNER_SINGLE_USE_AUTHORIZATION", used: false };

test("builds a deterministic anonymized snapshot from mocked data only", () => {
  const snapshot = buildP2aOwnerSnapshot({ target: P2A_OWNER_EXPORTER_TARGET, authorization, population, policy });
  assert.equal(snapshot.schemaVersion, "DCA_OS_V2_P2_A_SNAPSHOT_V1");
  assert.equal(snapshot.records.memberships.filter((item) => item.legacyRoleKeys.length === 0).length, 6);
  assert.doesNotMatch(JSON.stringify(snapshot), /sourceKey|synthetic-tenant|owner-user/);
  for (const field of ["id", "name", "email", "sourceId", "tenantId", "clientId", "userId", "credential", "password", "token", "rawRecord", "connectionString", "databaseUrl"]) assert.equal(JSON.stringify(snapshot).includes(`\"${field}\"`), false);
});
test("rejects missing and non-local targets", () => {
  for (const target of [null, { host: "localhost", port: 5434 }, { host: "127.0.0.1", port: 5435 }, { host: "remote", port: 5434 }, { host: "127.0.0.1", port: 5434, url: "postgres://remote" }]) assert.throws(() => buildP2aOwnerSnapshot({ target, authorization, population, policy }), /127\.0\.0\.1:5434/);
});
test("rejects missing owner authorization and write/apply modes", () => {
  assert.throws(() => buildP2aOwnerSnapshot({ target: P2A_OWNER_EXPORTER_TARGET, authorization: null, population, policy }), /single-use/);
  for (const flag of ["--apply", "--execute", "--write", "--mutate"]) assert.throws(() => parseP2aOwnerExporterArgs([flag]), /forbidden/);
});
test("rejects unknown exceptions and access widening", () => {
  assert.throws(() => buildP2aOwnerSnapshot({ target: P2A_OWNER_EXPORTER_TARGET, authorization, population: { ...population, memberships: population.memberships.slice(0, -1) }, policy }), /exception/);
  const widened = { ...population, clientUserAccess: [...population.clientUserAccess, { sourceKey: "widen", clientSourceKey: "synthetic-client", userSourceKey: "n1", status: "ACTIVE" }] };
  assert.throws(() => buildP2aOwnerSnapshot({ target: P2A_OWNER_EXPORTER_TARGET, authorization, population: widened, policy }), /known no-role user/);
  assert.throws(() => buildP2aOwnerSnapshot({ target: P2A_OWNER_EXPORTER_TARGET, authorization, population: { ...population, clients: [{ ...population.clients[0], name: "forbidden" }] }, policy }), /Prohibited source field/);
});
test("uses mocked read-only input and writes only the external evidence target", async () => {
  const calls = [];
  await exportP2aOwnerSnapshot({ target: P2A_OWNER_EXPORTER_TARGET, authorization, policy, readPopulation: async (options) => { calls.push(options); return population; }, writeSnapshot: async (options) => calls.push(options) });
  assert.deepEqual(calls[0], { target: P2A_OWNER_EXPORTER_TARGET, readOnly: true });
  assert.equal(calls[1].directory, P2A_OWNER_EXPORTER_OUTPUT_DIRECTORY);
  assert.equal(authorization.used, true);
  await assert.rejects(() => exportP2aOwnerSnapshot({ target: P2A_OWNER_EXPORTER_TARGET, authorization, policy, readPopulation: async () => population, writeSnapshot: async () => undefined }), /single-use/);
});
test("consumes authorization before a failed mocked read", async () => {
  const singleUse = { kind: "P2_A_OWNER_SINGLE_USE_AUTHORIZATION", used: false };
  await assert.rejects(() => exportP2aOwnerSnapshot({ target: P2A_OWNER_EXPORTER_TARGET, authorization: singleUse, policy, readPopulation: async () => { throw new Error("mock failure"); }, writeSnapshot: async () => undefined }), /mock failure/);
  assert.equal(singleUse.used, true);
});
