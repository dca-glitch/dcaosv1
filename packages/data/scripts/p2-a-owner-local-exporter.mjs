import { createHash } from "node:crypto";
import {
  computeClientUserAccessSha256,
  computeSnapshotSha256,
  validateP2aSnapshot
} from "./p2-a-offline-foundation.mjs";

export const P2A_OWNER_EXPORTER_TARGET = Object.freeze({ host: "127.0.0.1", port: 5434 });
export const P2A_OWNER_EXPORTER_OUTPUT_DIRECTORY = "C:\\dcaosv1-p2-evidence";
export const P2A_OWNER_EXPORTER_STATUS = "DISABLED_BY_DEFAULT";

const EXECUTION_FLAGS = new Set(["--apply", "--execute", "--write", "--mutate", "--backfill", "--reconcile", "--switch", "--cleanup"]);
const PROHIBITED_FIELD_NAMES = new Set(["id", "name", "email", "sourceId", "tenantId", "clientId", "userId", "credential", "credentials", "password", "token", "rawRecord", "connectionString", "databaseUrl"]);
const hash = (value) => createHash("sha256").update(value, "utf8").digest("hex");
export const derivePseudonymousKey = (type, source) => `${type}-${hash(`${type}:${source}`).slice(0, 24)}`;
const active = (item) => item.status === "ACTIVE";

export class P2aOwnerExporterError extends Error {}

export function assertP2aOwnerExporterTarget(target) {
  if (!target || Object.keys(target).sort().join("|") !== "host|port" || target.host !== P2A_OWNER_EXPORTER_TARGET.host || Number(target.port) !== P2A_OWNER_EXPORTER_TARGET.port) {
    throw new P2aOwnerExporterError("P2-A exporter accepts only 127.0.0.1:5434.");
  }
  return P2A_OWNER_EXPORTER_TARGET;
}

export function assertSingleUseOwnerAuthorization(authorization) {
  if (!authorization || authorization.kind !== "P2_A_OWNER_SINGLE_USE_AUTHORIZATION" || authorization.used !== false) {
    throw new P2aOwnerExporterError("A future explicit unused single-use owner authorization is required.");
  }
}

function assertNoProhibitedFields(value) {
  if (Array.isArray(value)) return value.forEach(assertNoProhibitedFields);
  if (!value || typeof value !== "object") return;
  for (const [field, child] of Object.entries(value)) {
    if (PROHIBITED_FIELD_NAMES.has(field)) throw new P2aOwnerExporterError(`Prohibited source field "${field}".`);
    assertNoProhibitedFields(child);
  }
}

export function parseP2aOwnerExporterArgs(args) {
  for (const argument of args) {
    if (EXECUTION_FLAGS.has(argument) || [...EXECUTION_FLAGS].some((flag) => argument.startsWith(`${flag}=`))) throw new P2aOwnerExporterError(`Execution mode "${argument}" is forbidden during build-only status.`);
  }
  throw new P2aOwnerExporterError("P2-A owner exporter is disabled by default; no database operation is authorized.");
}

export function buildP2aOwnerSnapshot({ target, authorization, population, policy }) {
  assertP2aOwnerExporterTarget(target);
  assertSingleUseOwnerAuthorization(authorization);
  if (!population || !Array.isArray(population.tenants)) throw new P2aOwnerExporterError("Synthetic population shape is required.");
  assertNoProhibitedFields(population);
  const tenants = population.tenants.filter(active);
  if (tenants.length !== 1) throw new P2aOwnerExporterError("Exactly one active Tenant is required.");
  const tenant = tenants[0];
  const tenantKey = derivePseudonymousKey("tenant", tenant.sourceKey);
  const tenantLabel = `tenant-${hash(tenant.sourceKey).slice(0, 24)}`;
  const clients = (population.clients ?? []).filter(active).map((item) => ({ clientKey: derivePseudonymousKey("client", item.sourceKey), tenantKey, status: "ACTIVE", sourceKey: item.sourceKey }));
  const memberships = (population.memberships ?? []).filter(active).map((item) => ({ membershipKey: derivePseudonymousKey("membership", item.sourceKey), tenantKey, userKey: derivePseudonymousKey("user", item.userSourceKey), status: "ACTIVE", legacyRoleKeys: [...(item.legacyRoleKeys ?? [])].sort(), sourceKey: item.sourceKey }));
  const clientUserAccess = (population.clientUserAccess ?? []).filter(active).map((item) => ({ accessKey: derivePseudonymousKey("access", item.sourceKey), clientKey: derivePseudonymousKey("client", item.clientSourceKey), userKey: derivePseudonymousKey("user", item.userSourceKey), status: "ACTIVE" }));
  const workspaceKey = derivePseudonymousKey("workspace", tenant.sourceKey);
  const noRoleKeys = memberships.filter((item) => item.legacyRoleKeys.length === 0).map((item) => item.membershipKey).sort();
  if (noRoleKeys.length !== 6 || [...noRoleKeys].join("|") !== [...policy.knownNoRoleMembershipKeys].sort().join("|")) throw new P2aOwnerExporterError("Unknown or mismatched no-role exception set.");
  const snapshot = {
    schemaVersion: "DCA_OS_V2_P2_A_SNAPSHOT_V1",
    selection: { tenantLabel, tenantSelectionHash: hash(tenantLabel) },
    records: {
      tenants: [{ tenantKey, status: "ACTIVE" }],
      clients: clients.map(({ sourceKey, ...item }) => item),
      memberships: memberships.map(({ sourceKey, ...item }) => item),
      clientUserAccess
    },
    proposedMappings: {
      tenantToWorkspace: [{ tenantKey, workspaceKey }],
      clientToWorkspace: clients.map(({ clientKey }) => ({ clientKey, tenantKey, workspaceKey })),
      membershipRoles: memberships.filter((item) => item.legacyRoleKeys.length > 0).map((item) => ({ membershipKey: item.membershipKey, userKey: item.userKey, workspaceKey, workspaceRoleKeys: item.legacyRoleKeys.map((role) => role === "OWNER" ? "ADMIN" : role) }))
    },
    accessInvariant: { clientUserAccessCount: clientUserAccess.length, clientUserAccessSha256: computeClientUserAccessSha256(clientUserAccess) },
    manifest: { algorithm: "SHA-256", canonicalization: "SORTED_KEYS_AND_DECLARED_RECORD_ORDER_V1", inputSha256: "" }
  };
  snapshot.manifest.inputSha256 = computeSnapshotSha256(snapshot);
  validateP2aSnapshot(snapshot, policy);
  return snapshot;
}

export async function exportP2aOwnerSnapshot({ target, authorization, policy, readPopulation, writeSnapshot }) {
  assertP2aOwnerExporterTarget(target);
  assertSingleUseOwnerAuthorization(authorization);
  if (typeof readPopulation !== "function" || typeof writeSnapshot !== "function") throw new P2aOwnerExporterError("Read-only population reader and external evidence writer are required.");
  authorization.used = true;
  const population = await readPopulation({ target: P2A_OWNER_EXPORTER_TARGET, readOnly: true });
  const snapshot = buildP2aOwnerSnapshot({ target, authorization: { ...authorization, used: false }, population, policy });
  await writeSnapshot({ directory: P2A_OWNER_EXPORTER_OUTPUT_DIRECTORY, snapshot });
  return snapshot;
}

if (process.argv[1]?.endsWith("p2-a-owner-local-exporter.mjs")) {
  try { parseP2aOwnerExporterArgs(process.argv.slice(2)); } catch (error) { process.stderr.write(`P2-A OWNER EXPORTER / ${error.message}\n`); process.exitCode = 64; }
}
