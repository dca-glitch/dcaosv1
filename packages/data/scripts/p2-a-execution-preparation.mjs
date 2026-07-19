import { createHash } from "node:crypto";
import {
  P2A_CANONICALIZATION,
  P2A_SNAPSHOT_SCHEMA_VERSION,
  computeClientUserAccessSha256,
  computeSnapshotSha256,
  validateP2aSnapshot
} from "./p2-a-offline-foundation.mjs";

export const P2A_EXECUTION_PREPARATION_AUTHORIZATION_KIND = "DCA_OS_V2_P2_A_OWNER_EXECUTION_AUTHORIZATION_V1";
export const P2A_EXECUTION_PREPARATION_AUTHORIZATION_UNUSED = "UNUSED";
export const P2A_EXECUTION_PREPARATION_AUTHORIZATION_CONSUMED = "CONSUMED";
export const P2A_EXECUTION_PREPARATION_TARGET = Object.freeze({ host: "127.0.0.1", port: 5434 });
export const P2A_EXECUTION_PREPARATION_READ_ONLY_INTENT = "DCA_OS_V2_P2_A_READ_ONLY_POPULATION_V1";
export const P2A_EXECUTION_PREPARATION_EVIDENCE_LOCATION = "C:\\dcaosv1-p2-evidence";
export const P2A_EXECUTION_PREPARATION_REPORT_VERSION = "DCA_OS_V2_P2_A_EXECUTION_PREPARATION_V1";

const PROHIBITED_SOURCE_FIELDS = new Set(["id", "name", "email", "sourceId", "tenantId", "clientId", "userId", "credential", "credentials", "password", "token", "rawRecord", "connectionString", "databaseUrl", "url", "host", "port", "environment", "mutation", "mode", "write", "apply"]);
const POPULATION_GROUPS = ["tenants", "clients", "memberships", "clientUserAccess"];
const hash = (value) => createHash("sha256").update(value, "utf8").digest("hex");
export const derivePseudonymousKey = (type, sourceKey) => `${type}-${hash(`${type}:${sourceKey}`).slice(0, 24)}`;
const sortBy = (field) => (records) => [...records].sort((left, right) => left[field].localeCompare(right[field]));

export class P2aExecutionPreparationError extends Error {
  constructor(code, message = "P2-A execution preparation was rejected.") {
    super(message);
    this.name = "P2aExecutionPreparationError";
    this.code = code;
  }
}

function assertExactKeys(value, expected, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join("|") !== [...expected].sort().join("|")) throw new P2aExecutionPreparationError(code);
}

function assertNonEmptyString(value, code) {
  if (typeof value !== "string" || value.trim().length === 0) throw new P2aExecutionPreparationError(code);
}

function assertNoProhibitedSourceFields(value) {
  if (Array.isArray(value)) return value.forEach(assertNoProhibitedSourceFields);
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (PROHIBITED_SOURCE_FIELDS.has(key)) throw new P2aExecutionPreparationError("SOURCE_FIELD_FORBIDDEN");
    assertNoProhibitedSourceFields(child);
  }
}

function assertPopulationRecord(record, allowedKeys) {
  assertExactKeys(record, allowedKeys, "POPULATION_SHAPE_INVALID");
  for (const [key, value] of Object.entries(record)) {
    if (key === "legacyRoleKeys") {
      if (!Array.isArray(value) || value.some((role) => typeof role !== "string" || role.length === 0)) throw new P2aExecutionPreparationError("POPULATION_SHAPE_INVALID");
    } else {
      assertNonEmptyString(value, "POPULATION_SHAPE_INVALID");
    }
  }
}

function assertPopulation(population) {
  assertExactKeys(population, POPULATION_GROUPS, "POPULATION_SHAPE_INVALID");
  assertNoProhibitedSourceFields(population);
  for (const group of POPULATION_GROUPS) if (!Array.isArray(population[group])) throw new P2aExecutionPreparationError("POPULATION_SHAPE_INVALID");
  population.tenants.forEach((record) => assertPopulationRecord(record, ["sourceKey", "status"]));
  population.clients.forEach((record) => assertPopulationRecord(record, ["sourceKey", "tenantSourceKey", "status"]));
  population.memberships.forEach((record) => assertPopulationRecord(record, ["sourceKey", "tenantSourceKey", "userSourceKey", "status", "legacyRoleKeys"]));
  population.clientUserAccess.forEach((record) => assertPopulationRecord(record, ["sourceKey", "clientSourceKey", "userSourceKey", "status"]));
}

const isActive = (record) => record.status === "ACTIVE";

export function assertP2aExecutionPreparationTarget(target) {
  assertExactKeys(target, ["host", "port"], "TARGET_INVALID");
  if (target.host !== P2A_EXECUTION_PREPARATION_TARGET.host || target.port !== P2A_EXECUTION_PREPARATION_TARGET.port) throw new P2aExecutionPreparationError("TARGET_INVALID");
  return P2A_EXECUTION_PREPARATION_TARGET;
}

export function assertUnusedOwnerAuthorization(authorization) {
  assertExactKeys(authorization, ["kind", "authorizationId", "state"], "AUTHORIZATION_INVALID");
  if (authorization.kind !== P2A_EXECUTION_PREPARATION_AUTHORIZATION_KIND) throw new P2aExecutionPreparationError("AUTHORIZATION_INVALID");
  assertNonEmptyString(authorization.authorizationId, "AUTHORIZATION_INVALID");
  if (authorization.state !== P2A_EXECUTION_PREPARATION_AUTHORIZATION_UNUSED) throw new P2aExecutionPreparationError("AUTHORIZATION_CONSUMED");
}

export function consumeOwnerAuthorization(authorization) {
  assertUnusedOwnerAuthorization(authorization);
  authorization.state = P2A_EXECUTION_PREPARATION_AUTHORIZATION_CONSUMED;
}

export function buildP2aExecutionPreparationSnapshot({ target, population, policy }) {
  assertP2aExecutionPreparationTarget(target);
  assertPopulation(population);
  const activeTenants = population.tenants.filter(isActive);
  if (activeTenants.length !== 1) throw new P2aExecutionPreparationError("ACTIVE_TENANT_COUNT_INVALID");
  const tenant = activeTenants[0];
  const tenantKey = derivePseudonymousKey("tenant", tenant.sourceKey);
  const tenantLabel = `tenant-${hash(tenant.sourceKey).slice(0, 24)}`;
  const activeClients = population.clients.filter(isActive);
  const activeMemberships = population.memberships.filter(isActive);
  const activeAccess = population.clientUserAccess.filter(isActive);
  if (activeClients.some((record) => record.tenantSourceKey !== tenant.sourceKey) || activeMemberships.some((record) => record.tenantSourceKey !== tenant.sourceKey)) throw new P2aExecutionPreparationError("CROSS_TENANT_LINK");
  const clientSourceKeys = new Set(activeClients.map((record) => record.sourceKey));
  const membershipUserSourceKeys = new Set(activeMemberships.map((record) => record.userSourceKey));
  if (activeAccess.some((record) => !clientSourceKeys.has(record.clientSourceKey) || !membershipUserSourceKeys.has(record.userSourceKey))) throw new P2aExecutionPreparationError("ORPHAN_ACCESS");
  const clients = sortBy("clientKey")(activeClients.map((record) => ({ clientKey: derivePseudonymousKey("client", record.sourceKey), tenantKey, status: "ACTIVE" })));
  const memberships = sortBy("membershipKey")(activeMemberships.map((record) => ({ membershipKey: derivePseudonymousKey("membership", record.sourceKey), tenantKey, userKey: derivePseudonymousKey("user", record.userSourceKey), status: "ACTIVE", legacyRoleKeys: [...record.legacyRoleKeys].sort() })));
  const clientUserAccess = sortBy("accessKey")(activeAccess.map((record) => ({ accessKey: derivePseudonymousKey("access", record.sourceKey), clientKey: derivePseudonymousKey("client", record.clientSourceKey), userKey: derivePseudonymousKey("user", record.userSourceKey), status: "ACTIVE" })));
  const expectedNoRoleKeys = [...(policy?.knownNoRoleMembershipKeys ?? [])].sort();
  const actualNoRoleKeys = memberships.filter((record) => record.legacyRoleKeys.length === 0).map((record) => record.membershipKey).sort();
  if (actualNoRoleKeys.length !== 6 || actualNoRoleKeys.join("|") !== expectedNoRoleKeys.join("|")) throw new P2aExecutionPreparationError("KNOWN_EXCEPTION_SET_MISMATCH");
  const workspaceKey = derivePseudonymousKey("workspace", tenant.sourceKey);
  const snapshot = {
    schemaVersion: P2A_SNAPSHOT_SCHEMA_VERSION,
    selection: { tenantLabel, tenantSelectionHash: hash(tenantLabel) },
    records: { tenants: [{ tenantKey, status: "ACTIVE" }], clients, memberships, clientUserAccess },
    proposedMappings: {
      tenantToWorkspace: [{ tenantKey, workspaceKey }],
      clientToWorkspace: clients.map(({ clientKey }) => ({ clientKey, tenantKey, workspaceKey })),
      membershipRoles: memberships.filter((record) => record.legacyRoleKeys.length > 0).map((record) => ({ membershipKey: record.membershipKey, userKey: record.userKey, workspaceKey, workspaceRoleKeys: record.legacyRoleKeys.map((role) => role === "OWNER" ? "ADMIN" : role).sort() }))
    },
    accessInvariant: { clientUserAccessCount: clientUserAccess.length, clientUserAccessSha256: computeClientUserAccessSha256(clientUserAccess) },
    manifest: { algorithm: "SHA-256", canonicalization: P2A_CANONICALIZATION, inputSha256: "" }
  };
  snapshot.manifest.inputSha256 = computeSnapshotSha256(snapshot);
  try { validateP2aSnapshot(snapshot, policy); } catch { throw new P2aExecutionPreparationError("SNAPSHOT_INVALID"); }
  return snapshot;
}

function sanitizeAttemptError(code) {
  return new P2aExecutionPreparationError(code, "P2-A execution preparation attempt was rejected.");
}

export function createP2aInjectedPublicationContract({ policy, publishSnapshot }) {
  assertExactKeys({ policy, publishSnapshot }, ["policy", "publishSnapshot"], "PUBLICATION_CONTRACT_INVALID");
  if (typeof publishSnapshot !== "function") throw new P2aExecutionPreparationError("PUBLICATION_CONTRACT_INVALID");
  let published = false;
  return async (request) => {
    assertExactKeys(request, ["logicalEvidenceLocation", "payload"], "PUBLICATION_REQUEST_INVALID");
    if (published) throw new P2aExecutionPreparationError("PUBLICATION_ALREADY_ATTEMPTED");
    if (request.logicalEvidenceLocation !== P2A_EXECUTION_PREPARATION_EVIDENCE_LOCATION) throw new P2aExecutionPreparationError("PUBLICATION_LOCATION_INVALID");
    try { validateP2aSnapshot(request.payload, policy); } catch { throw sanitizeAttemptError("PUBLICATION_PAYLOAD_INVALID"); }
    published = true;
    try { await publishSnapshot(request); } catch { throw sanitizeAttemptError("PUBLICATION_ATTEMPT_FAILED"); }
  };
}

export async function prepareAndPublishP2aSnapshot(input) {
  assertExactKeys(input, ["target", "readAuthorization", "publicationAuthorization", "policy", "readPopulation", "publishSnapshot"], "ADAPTER_INPUT_INVALID");
  const { target, readAuthorization, publicationAuthorization, policy, readPopulation, publishSnapshot } = input;
  assertP2aExecutionPreparationTarget(target);
  if (typeof readPopulation !== "function" || typeof publishSnapshot !== "function") throw new P2aExecutionPreparationError("ADAPTER_CONTRACT_INVALID");
  consumeOwnerAuthorization(readAuthorization);
  let population;
  try {
    population = await readPopulation({ target: P2A_EXECUTION_PREPARATION_TARGET, intent: P2A_EXECUTION_PREPARATION_READ_ONLY_INTENT });
  } catch {
    throw sanitizeAttemptError("READER_ATTEMPT_FAILED");
  }
  let snapshot;
  try {
    snapshot = buildP2aExecutionPreparationSnapshot({ target, population, policy });
  } catch (error) {
    if (error instanceof P2aExecutionPreparationError) throw error;
    throw sanitizeAttemptError("SNAPSHOT_REJECTED");
  }
  const publishApprovedSnapshot = createP2aInjectedPublicationContract({ policy, publishSnapshot });
  consumeOwnerAuthorization(publicationAuthorization);
  try {
    await publishApprovedSnapshot({ logicalEvidenceLocation: P2A_EXECUTION_PREPARATION_EVIDENCE_LOCATION, payload: snapshot });
  } catch {
    throw sanitizeAttemptError("PUBLICATION_ATTEMPT_FAILED");
  }
  return Object.freeze({ reportVersion: P2A_EXECUTION_PREPARATION_REPORT_VERSION, status: "PREPARED_AND_PUBLISHED_BY_INJECTION", target: P2A_EXECUTION_PREPARATION_TARGET, logicalEvidenceLocation: P2A_EXECUTION_PREPARATION_EVIDENCE_LOCATION, snapshotSchemaVersion: snapshot.schemaVersion, manifestSha256: snapshot.manifest.inputSha256, databaseAccess: false, realEvidenceFileWritten: false });
}
