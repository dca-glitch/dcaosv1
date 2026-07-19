import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  P2A_EXECUTION_PREPARATION_READ_ONLY_INTENT,
  P2A_EXECUTION_PREPARATION_TARGET,
  P2A_EXECUTION_PREPARATION_AUTHORIZATION_KIND,
  derivePseudonymousKey,
  prepareAndPublishP2aSnapshot
} from "./p2-a-execution-preparation.mjs";
import {
  P2aLocalReadOnlySourceAdapterError,
  createP2aInjectedReadPopulationContract,
  createP2aLocalReadOnlySourceAdapter,
  deriveP2aAdapterSourceKey
} from "./p2-a-local-read-only-source-adapter.mjs";

const activeRole = { id: "role-owner", tenantId: "tenant-1", key: "OWNER", status: "ACTIVE", deletedAt: null };
const rows = () => ({
  tenant: [{ id: "tenant-1", status: "ACTIVE", deletedAt: null }],
  client: [{ id: "client-1", tenantId: "tenant-1", isArchived: false, migrationStatus: "ACTIVE" }],
  tenantMembership: [{ id: "member-owner", tenantId: "tenant-1", userId: "user-owner", status: "ACTIVE", deletedAt: null, membershipRoles: [{ role: activeRole }], }, ...Array.from({ length: 6 }, (_, index) => ({ id: `member-no-role-${index + 1}`, tenantId: "tenant-1", userId: `user-no-role-${index + 1}`, status: "ACTIVE", deletedAt: null, membershipRoles: [] }))],
  clientUserAccess: [{ id: "access-1", tenantId: "tenant-1", clientId: "client-1", userId: "user-owner", isArchived: false }]
});

function mockClient(source = rows()) {
  const calls = [];
  return {
    calls,
    client: Object.fromEntries(Object.entries(source).map(([delegate, result]) => [delegate, { findMany: async (query) => { calls.push({ delegate, query }); return structuredClone(result); } }]))
  };
}

const policy = () => ({ knownNoRoleMembershipKeys: Array.from({ length: 6 }, (_, index) => derivePseudonymousKey("membership", deriveP2aAdapterSourceKey("membership", `member-no-role-${index + 1}`))), approvedLegacyRoleKeys: ["OWNER", "CLIENT_USER"], approvedWorkspaceRoleKeys: ["ADMIN", "WORKSPACE_MANAGER", "TEAM_MEMBER", "CLIENT_MANAGER", "CLIENT_USER"] });
const request = { target: P2A_EXECUTION_PREPARATION_TARGET, intent: P2A_EXECUTION_PREPARATION_READ_ONLY_INTENT };

test("reads one active tenant through exactly four active-only findMany operations and emits redacted population", async () => {
  const mocked = mockClient();
  const reader = createP2aLocalReadOnlySourceAdapter({ client: mocked.client });
  const population = await reader(request);
  assert.equal(mocked.calls.length, 4);
  assert.deepEqual(mocked.calls.map(({ delegate }) => delegate).sort(), ["client", "clientUserAccess", "tenant", "tenantMembership"]);
  assert.deepEqual(mocked.calls.find((call) => call.delegate === "tenant").query.where, { status: "ACTIVE", deletedAt: null });
  assert.deepEqual(mocked.calls.find((call) => call.delegate === "client").query.where, { isArchived: false, migrationStatus: "ACTIVE" });
  assert.deepEqual(mocked.calls.find((call) => call.delegate === "tenantMembership").query.where, { status: "ACTIVE", deletedAt: null });
  assert.deepEqual(mocked.calls.find((call) => call.delegate === "clientUserAccess").query.where, { isArchived: false });
  assert.deepEqual(Object.keys(population).sort(), ["clientUserAccess", "clients", "memberships", "tenants"]);
  assert.doesNotMatch(JSON.stringify(population), /tenant-1|client-1|user-owner|member-owner|rawRecord|email|name|credential/i);
  assert.deepEqual(population.memberships.find((record) => record.legacyRoleKeys.length === 1).legacyRoleKeys, ["OWNER"]);
});

test("rejects missing or ambiguous active tenant selection, non-local target, missing intent, and unsafe client capabilities", async () => {
  for (const tenantRows of [[], [{ id: "tenant-1", status: "ACTIVE", deletedAt: null }, { id: "tenant-2", status: "ACTIVE", deletedAt: null }]]) {
    const mocked = mockClient({ ...rows(), tenant: tenantRows });
    await assert.rejects(() => createP2aLocalReadOnlySourceAdapter({ client: mocked.client })(request), P2aLocalReadOnlySourceAdapterError);
  }
  const mocked = mockClient();
  assert.throws(() => createP2aLocalReadOnlySourceAdapter({ client: mocked.client, target: { host: "localhost", port: 5434 } }), P2aLocalReadOnlySourceAdapterError);
  assert.throws(() => createP2aLocalReadOnlySourceAdapter({ client: mocked.client, intent: "WRITE" }), P2aLocalReadOnlySourceAdapterError);
  await assert.rejects(() => createP2aLocalReadOnlySourceAdapter({ client: mocked.client })({ target: P2A_EXECUTION_PREPARATION_TARGET, intent: undefined }), P2aLocalReadOnlySourceAdapterError);
  const unsafe = mockClient().client; unsafe.$queryRaw = async () => []; assert.throws(() => createP2aLocalReadOnlySourceAdapter({ client: unsafe }), P2aLocalReadOnlySourceAdapterError);
  const writeCapable = mockClient().client; writeCapable.client.create = async () => ({}); assert.throws(() => createP2aLocalReadOnlySourceAdapter({ client: writeCapable }), P2aLocalReadOnlySourceAdapterError);
  const inheritedRaw = Object.create({ $queryRaw: async () => [] }, Object.getOwnPropertyDescriptors(mockClient().client)); assert.throws(() => createP2aLocalReadOnlySourceAdapter({ client: inheritedRaw }), P2aLocalReadOnlySourceAdapterError);
  const inheritedWriteDelegate = { ...mockClient().client, tenant: Object.create({ create: async () => ({}) }, Object.getOwnPropertyDescriptors(mockClient().client.tenant)) }; assert.throws(() => createP2aLocalReadOnlySourceAdapter({ client: inheritedWriteDelegate }), P2aLocalReadOnlySourceAdapterError);
  const mutable = mockClient(); const reader = createP2aLocalReadOnlySourceAdapter({ client: mutable.client }); mutable.client.$queryRaw = async () => []; await assert.rejects(() => reader(request), P2aLocalReadOnlySourceAdapterError); assert.equal(mutable.calls.length, 0);
});

test("filters inactive source rows and fails closed for malformed, orphaned, cross-tenant, and duplicate data", async () => {
  const source = rows();
  source.client.push({ id: "archived", tenantId: "tenant-1", isArchived: true, migrationStatus: "ACTIVE" });
  source.tenantMembership.push({ id: "inactive", tenantId: "tenant-1", userId: "inactive-user", status: "INACTIVE", deletedAt: null, membershipRoles: [] });
  source.clientUserAccess.push({ id: "archived-access", tenantId: "tenant-1", clientId: "client-1", userId: "user-owner", isArchived: true });
  const population = await createP2aLocalReadOnlySourceAdapter({ client: mockClient(source).client })(request);
  assert.equal(population.clients.length, 1); assert.equal(population.memberships.length, 7); assert.equal(population.clientUserAccess.length, 1);
  for (const mutate of [
    (value) => { value.client[0].tenantId = "other"; },
    (value) => { value.clientUserAccess[0].clientId = "missing"; },
    (value) => { value.tenantMembership.push(structuredClone(value.tenantMembership[0])); },
    (value) => { value.tenantMembership[0].membershipRoles = [{ role: { ...activeRole, tenantId: "other" } }]; },
    (value) => { value.tenantMembership[0].membershipRoles = [{ role: { ...activeRole, status: 17 } }]; },
    (value) => { value.client[0].name = "forbidden"; }
  ]) {
    const invalid = rows(); mutate(invalid);
    await assert.rejects(() => createP2aLocalReadOnlySourceAdapter({ client: mockClient(invalid).client })(request), P2aLocalReadOnlySourceAdapterError);
  }
});

test("keeps six known no-role exceptions and ClientUserAccess invariant through exporter injection without filesystem or database work", async () => {
  const mocked = mockClient();
  const reader = createP2aInjectedReadPopulationContract({ client: mocked.client });
  const readAuthorization = { kind: P2A_EXECUTION_PREPARATION_AUTHORIZATION_KIND, authorizationId: "reader", state: "UNUSED" };
  const publicationAuthorization = { kind: P2A_EXECUTION_PREPARATION_AUTHORIZATION_KIND, authorizationId: "publication", state: "UNUSED" };
  const publicationCalls = [];
  const report = await prepareAndPublishP2aSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, readAuthorization, publicationAuthorization, policy: policy(), readPopulation: reader, publishSnapshot: async (value) => publicationCalls.push(value) });
  assert.equal(report.databaseAccess, false); assert.equal(report.realEvidenceFileWritten, false); assert.equal(publicationCalls.length, 1);
  assert.equal(publicationCalls[0].payload.accessInvariant.clientUserAccessCount, 1);
  assert.equal(publicationCalls[0].payload.proposedMappings.membershipRoles.length, 1);
  assert.doesNotMatch(JSON.stringify(publicationCalls), /tenant-1|client-1|user-owner|member-owner|email|name|credential/i);
  assert.equal(mocked.calls.length, 4);
});

test("adapter source has no real database, environment, filesystem, raw-query, or write operation", () => {
  const source = readFileSync(fileURLToPath(new URL("./p2-a-local-read-only-source-adapter.mjs", import.meta.url)), "utf8");
  assert.doesNotMatch(source, /@prisma\/client|PrismaClient|process\.env|node:fs|child_process|\$queryRaw|\$executeRaw/);
  assert.doesNotMatch(source, /client\.[A-Za-z]+\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/);
});
