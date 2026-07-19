import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  P2A_EXECUTION_PREPARATION_AUTHORIZATION_CONSUMED,
  P2A_EXECUTION_PREPARATION_AUTHORIZATION_KIND,
  P2A_EXECUTION_PREPARATION_EVIDENCE_LOCATION,
  P2A_EXECUTION_PREPARATION_READ_ONLY_INTENT,
  P2A_EXECUTION_PREPARATION_TARGET,
  P2aExecutionPreparationError,
  assertP2aExecutionPreparationTarget,
  buildP2aExecutionPreparationSnapshot,
  createP2aInjectedPublicationContract,
  derivePseudonymousKey,
  prepareAndPublishP2aSnapshot
} from "./p2-a-execution-preparation.mjs";
import { parseP2aOwnerExporterArgs } from "./p2-a-owner-local-exporter.mjs";

const policy = { knownNoRoleMembershipKeys: Array.from({ length: 6 }, (_, index) => derivePseudonymousKey("membership", String(index + 1))), approvedLegacyRoleKeys: ["OWNER", "CLIENT_USER"], approvedWorkspaceRoleKeys: ["ADMIN", "WORKSPACE_MANAGER", "TEAM_MEMBER", "CLIENT_MANAGER", "CLIENT_USER"] };
const population = () => ({
  tenants: [{ sourceKey: "synthetic-tenant", status: "ACTIVE" }],
  clients: [{ sourceKey: "synthetic-client", tenantSourceKey: "synthetic-tenant", status: "ACTIVE" }],
  memberships: [{ sourceKey: "owner", tenantSourceKey: "synthetic-tenant", userSourceKey: "synthetic-owner", status: "ACTIVE", legacyRoleKeys: ["OWNER"] }, ...Array.from({ length: 6 }, (_, index) => ({ sourceKey: String(index + 1), tenantSourceKey: "synthetic-tenant", userSourceKey: `synthetic-n${index + 1}`, status: "ACTIVE", legacyRoleKeys: [] }))],
  clientUserAccess: [{ sourceKey: "synthetic-access", clientSourceKey: "synthetic-client", userSourceKey: "synthetic-owner", status: "ACTIVE" }]
});
const authorization = (id) => ({ kind: P2A_EXECUTION_PREPARATION_AUTHORIZATION_KIND, authorizationId: id, state: "UNUSED" });
const assertRedacted = (error, secret) => assert.doesNotMatch(`${error.message} ${JSON.stringify(error)}`, new RegExp(secret));

test("uses separate single-use authorizations around injected read and approved publication", async () => {
  const readerAuthorization = authorization("opaque-reader-id");
  const publicationAuthorization = authorization("opaque-publication-id");
  const calls = [];
  const report = await prepareAndPublishP2aSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, readAuthorization: readerAuthorization, publicationAuthorization, policy, readPopulation: async (request) => { calls.push(request); return population(); }, publishSnapshot: async (request) => calls.push(request) });
  assert.deepEqual(calls[0], { target: P2A_EXECUTION_PREPARATION_TARGET, intent: P2A_EXECUTION_PREPARATION_READ_ONLY_INTENT });
  assert.deepEqual(Object.keys(calls[1]).sort(), ["logicalEvidenceLocation", "payload"]);
  assert.equal(calls[1].logicalEvidenceLocation, P2A_EXECUTION_PREPARATION_EVIDENCE_LOCATION);
  assert.equal(calls[1].payload.schemaVersion, "DCA_OS_V2_P2_A_SNAPSHOT_V1");
  assert.equal(calls.filter((call) => call.logicalEvidenceLocation).length, 1);
  assert.equal(readerAuthorization.state, P2A_EXECUTION_PREPARATION_AUTHORIZATION_CONSUMED);
  assert.equal(publicationAuthorization.state, P2A_EXECUTION_PREPARATION_AUTHORIZATION_CONSUMED);
  assert.equal(report.databaseAccess, false);
  assert.equal(report.realEvidenceFileWritten, false);
  assert.doesNotMatch(JSON.stringify(report), /opaque|synthetic|sourceKey|credential|rawRecord|postgres/i);
  await assert.rejects(() => prepareAndPublishP2aSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, readAuthorization: authorization("opaque-new-reader"), publicationAuthorization, policy, readPopulation: async () => population(), publishSnapshot: async () => undefined }), /rejected/);
});

test("requires opaque non-empty unused authorizations and rejects all reuse", async () => {
  for (const candidate of [null, {}, { kind: P2A_EXECUTION_PREPARATION_AUTHORIZATION_KIND, authorizationId: "", state: "UNUSED" }, { kind: "wrong", authorizationId: "opaque", state: "UNUSED" }, { kind: P2A_EXECUTION_PREPARATION_AUTHORIZATION_KIND, authorizationId: "opaque", state: "CONSUMED" }]) {
    await assert.rejects(() => prepareAndPublishP2aSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, readAuthorization: candidate, publicationAuthorization: authorization("opaque-publication"), policy, readPopulation: async () => population(), publishSnapshot: async () => undefined }), P2aExecutionPreparationError);
  }
  const consumed = authorization("opaque-reuse-id");
  await assert.rejects(() => prepareAndPublishP2aSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, readAuthorization: consumed, publicationAuthorization: authorization("opaque-other"), policy, readPopulation: async () => { throw new Error("source-private"); }, publishSnapshot: async () => undefined }), P2aExecutionPreparationError);
  await assert.rejects(() => prepareAndPublishP2aSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, readAuthorization: consumed, publicationAuthorization: authorization("opaque-other-2"), policy, readPopulation: async () => population(), publishSnapshot: async () => undefined }), /rejected/);
});

test("consumes before reader and publication attempts and redacts injected failures", async () => {
  const reader = authorization("opaque-read-secret");
  await assert.rejects(() => prepareAndPublishP2aSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, readAuthorization: reader, publicationAuthorization: authorization("opaque-pub"), policy, readPopulation: async () => { throw new Error("source-77 pii@example.test postgres://credential"); }, publishSnapshot: async () => undefined }), (error) => { assert.equal(reader.state, "CONSUMED"); assertRedacted(error, "opaque-read-secret"); assert.doesNotMatch(error.message, /source-77|pii|postgres|credential/); return true; });
  const publication = authorization("opaque-publication-secret");
  await assert.rejects(() => prepareAndPublishP2aSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, readAuthorization: authorization("opaque-read"), publicationAuthorization: publication, policy, readPopulation: async () => population(), publishSnapshot: async () => { throw new Error("raw record credential"); } }), (error) => { assert.equal(publication.state, "CONSUMED"); assertRedacted(error, "opaque-publication-secret"); assert.doesNotMatch(error.message, /raw|credential/); return true; });
  await assert.rejects(() => prepareAndPublishP2aSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, readAuthorization: authorization("opaque-read-again"), publicationAuthorization: publication, policy, readPopulation: async () => population(), publishSnapshot: async () => undefined }), /rejected/);
});

test("enforces exact target, read-only contract, and one approved anonymized payload", () => {
  for (const target of [null, { host: "localhost", port: 5434 }, { host: "127.0.0.1", port: 5435 }, { host: "127.0.0.1", port: 5434, url: "postgres://x" }, { host: "127.0.0.1", port: 5434, mutation: true }]) assert.throws(() => assertP2aExecutionPreparationTarget(target), P2aExecutionPreparationError);
  const first = buildP2aExecutionPreparationSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, population: population(), policy });
  const second = buildP2aExecutionPreparationSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, population: population(), policy });
  assert.deepEqual(first, second);
  const shuffled = population(); shuffled.clients.reverse(); shuffled.memberships.reverse(); shuffled.clientUserAccess.reverse();
  assert.deepEqual(first, buildP2aExecutionPreparationSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, population: shuffled, policy }));
  assert.doesNotMatch(JSON.stringify(first), /synthetic-|sourceKey|credential|connection/i);
  assert.equal(first.accessInvariant.clientUserAccessCount, 1);
  assert.equal(first.accessInvariant.clientUserAccessSha256.length, 64);
});

test("rejects cross-boundary source links, unknown exceptions, prohibited fields, and CLI execution-like flags", () => {
  const crossTenant = population(); crossTenant.clients[0].tenantSourceKey = "other";
  assert.throws(() => buildP2aExecutionPreparationSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, population: crossTenant, policy }), /rejected/);
  const orphanAccess = population(); orphanAccess.clientUserAccess[0].clientSourceKey = "orphan";
  assert.throws(() => buildP2aExecutionPreparationSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, population: orphanAccess, policy }), /rejected/);
  const roleDrift = population(); roleDrift.memberships[0].legacyRoleKeys = ["UNKNOWN_ROLE"];
  assert.throws(() => buildP2aExecutionPreparationSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, population: roleDrift, policy }), /rejected/);
  const piiRole = population(); piiRole.memberships[0].legacyRoleKeys = ["pii@example.test"];
  assert.throws(() => buildP2aExecutionPreparationSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, population: piiRole, policy }), (error) => { assert.doesNotMatch(error.message, /pii@example/); return true; });
  const prohibited = population(); prohibited.clients[0].url = "postgres://forbidden";
  assert.throws(() => buildP2aExecutionPreparationSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, population: prohibited, policy }), /rejected/);
  const source = readFileSync(fileURLToPath(new URL("./p2-a-offline-foundation.mjs", import.meta.url)), "utf8");
  assert.doesNotMatch(source, /@prisma\/client|PrismaClient|DATABASE_URL|process\.env|child_process/);
  const adapterSource = readFileSync(fileURLToPath(new URL("./p2-a-execution-preparation.mjs", import.meta.url)), "utf8");
  assert.doesNotMatch(adapterSource, /@prisma\/client|PrismaClient|DATABASE_URL|process\.env|child_process|node:fs/);
  for (const flag of [[], ["--apply"], ["--execute"], ["--write"], ["--mutate"], ["--database"], ["--url=postgres://x"], ["--target=127.0.0.1:5434"]]) assert.throws(() => parseP2aOwnerExporterArgs(flag), /disabled/);
});

test("publication contract rejects wrong payloads, locations, unknown parameters, and duplicate attempts", async () => {
  const delivered = [];
  const contract = createP2aInjectedPublicationContract({ policy, publishSnapshot: async (request) => delivered.push(request) });
  const valid = buildP2aExecutionPreparationSnapshot({ target: P2A_EXECUTION_PREPARATION_TARGET, population: population(), policy });
  const wrongSchema = structuredClone(valid); wrongSchema.schemaVersion = "WRONG";
  await assert.rejects(() => contract({ logicalEvidenceLocation: P2A_EXECUTION_PREPARATION_EVIDENCE_LOCATION, payload: wrongSchema }), /rejected/);
  const wrongManifest = structuredClone(valid); wrongManifest.manifest.inputSha256 = "0".repeat(64);
  await assert.rejects(() => contract({ logicalEvidenceLocation: P2A_EXECUTION_PREPARATION_EVIDENCE_LOCATION, payload: wrongManifest }), /rejected/);
  const nonAnonymized = structuredClone(valid); nonAnonymized.records.clients[0].email = "pii@example.test";
  await assert.rejects(() => contract({ logicalEvidenceLocation: P2A_EXECUTION_PREPARATION_EVIDENCE_LOCATION, payload: nonAnonymized }), /rejected/);
  await assert.rejects(() => contract({ logicalEvidenceLocation: "C:\\other", payload: valid }), /rejected/);
  await assert.rejects(() => contract({ logicalEvidenceLocation: P2A_EXECUTION_PREPARATION_EVIDENCE_LOCATION, payload: valid, extra: true }), /rejected/);
  await contract({ logicalEvidenceLocation: P2A_EXECUTION_PREPARATION_EVIDENCE_LOCATION, payload: valid });
  await assert.rejects(() => contract({ logicalEvidenceLocation: P2A_EXECUTION_PREPARATION_EVIDENCE_LOCATION, payload: valid }), /rejected/);
  assert.equal(delivered.length, 1);
});
