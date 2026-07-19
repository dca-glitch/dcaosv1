import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const P2A_REPORT_VERSION = "DCA_OS_V2_P2_A_OFFLINE_FOUNDATION_V1";
export const P2A_SNAPSHOT_SCHEMA_VERSION = "DCA_OS_V2_P2_A_SNAPSHOT_V1";
export const P2A_CANONICALIZATION = "SORTED_KEYS_AND_DECLARED_RECORD_ORDER_V1";
export const P2A_KNOWN_NO_ROLE_CLASSIFICATION = "OWNER_REMEDIATION_REQUIRED";
export const P2A_EXIT_CODES = Object.freeze({
  OK: 0,
  VALIDATION_BLOCKED: 2,
  INVALID_ARGUMENT: 64,
  INVALID_INPUT: 65
});

const EXECUTION_FLAGS = new Set([
  "--apply",
  "--execute",
  "--write",
  "--mutate",
  "--mutation",
  "--backfill",
  "--reconcile",
  "--reconciliation",
  "--switch",
  "--cleanup",
  "--snapshot-create",
  "--database",
  "--db"
]);
const FORBIDDEN_FIELD_NAMES = new Set([
  "id",
  "name",
  "email",
  "sourceId",
  "tenantId",
  "clientId",
  "userId",
  "credential",
  "credentials",
  "password",
  "token",
  "rawRecord",
  "connectionString",
  "databaseUrl"
]);
const REQUIRED_RECORDS = ["tenants", "clients", "memberships", "clientUserAccess"];
const REQUIRED_MAPPING_GROUPS = ["tenantToWorkspace", "clientToWorkspace", "membershipRoles"];
const RECORD_KEY_FIELDS = ["tenantKey", "clientKey", "membershipKey", "accessKey", "workspaceKey", "userKey"];
const DEFAULT_APPROVED_LEGACY_ROLES = Object.freeze(["OWNER", "CLIENT_USER"]);
const DEFAULT_APPROVED_WORKSPACE_ROLES = Object.freeze([
  "ADMIN",
  "WORKSPACE_MANAGER",
  "TEAM_MEMBER",
  "CLIENT_MANAGER",
  "CLIENT_USER"
]);

export class P2AValidationError extends Error {
  constructor(message, code = "P2A_VALIDATION_BLOCKED") {
    super(message);
    this.name = "P2AValidationError";
    this.code = code;
  }
}

function stableCompare(left, right) {
  return String(left).localeCompare(String(right));
}

function sortedUnique(values) {
  return [...new Set(values)].sort(stableCompare);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort(stableCompare).map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function recordSortKey(record) {
  const field = RECORD_KEY_FIELDS.find((candidate) => typeof record?.[candidate] === "string");
  return field ? record[field] : JSON.stringify(record);
}

function normalizeArray(value) {
  if (!Array.isArray(value)) return value;
  if (value.every((item) => typeof item === "string")) return [...value].sort(stableCompare);
  if (value.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
    return [...value].sort((left, right) => stableCompare(canonicalJson(left), canonicalJson(right))).map(normalizeValue);
  }
  return value.map(normalizeValue);
}

function normalizeValue(value) {
  if (Array.isArray(value)) return normalizeArray(value);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort(stableCompare).map((key) => [key, normalizeValue(value[key])]));
  }
  return value;
}

export function normalizeSnapshotForManifest(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new P2AValidationError("Snapshot must be a JSON object.", "INVALID_SNAPSHOT");
  }
  const withoutManifest = Object.fromEntries(Object.entries(snapshot).filter(([key]) => key !== "manifest"));
  return normalizeValue(withoutManifest);
}

export function computeSnapshotSha256(snapshot) {
  return sha256(canonicalJson(normalizeSnapshotForManifest(snapshot)));
}

export function computeClientUserAccessSha256(records) {
  if (!Array.isArray(records)) throw new P2AValidationError("ClientUserAccess records must be an array.", "INVALID_ACCESS_RECORDS");
  return sha256(canonicalJson(normalizeArray(records)));
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new P2AValidationError(`${label} must be an object.`, "INVALID_SHAPE");
}

function assertString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new P2AValidationError(`${label} must be a non-empty string.`, "INVALID_FIELD");
}

function assertArray(value, label) {
  if (!Array.isArray(value)) throw new P2AValidationError(`${label} must be an array.`, "INVALID_SHAPE");
  return value;
}

function assertUniqueKeys(records, keyField, label) {
  const keys = new Set();
  for (const record of records) {
    assertPlainObject(record, label);
    assertString(record[keyField], `${label}.${keyField}`);
    if (keys.has(record[keyField])) throw new P2AValidationError(`Duplicate ${label} ${keyField} "${record[keyField]}".`, "DUPLICATE_KEY");
    keys.add(record[keyField]);
  }
  return keys;
}

function assertNoForbiddenFields(value, pathLabel = "snapshot") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenFields(item, `${pathLabel}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_FIELD_NAMES.has(key)) throw new P2AValidationError(`Forbidden raw or source field "${pathLabel}.${key}".`, "RAW_FIELD_FORBIDDEN");
    assertNoForbiddenFields(child, `${pathLabel}.${key}`);
  }
}

function isActive(record) {
  return record.status === undefined || record.status === "ACTIVE";
}

function normalizePolicy(policy) {
  assertPlainObject(policy, "policy");
  assertNoForbiddenFields(policy, "policy");
  const knownNoRoleMembershipKeys = sortedUnique(assertArray(policy.knownNoRoleMembershipKeys, "policy.knownNoRoleMembershipKeys"));
  if (knownNoRoleMembershipKeys.length !== 6) throw new P2AValidationError("Exactly six known no-role membership keys are required.", "KNOWN_EXCEPTION_POLICY_INVALID");
  return {
    knownNoRoleMembershipKeys,
    approvedLegacyRoleKeys: new Set(sortedUnique(policy.approvedLegacyRoleKeys ?? DEFAULT_APPROVED_LEGACY_ROLES)),
    approvedWorkspaceRoleKeys: new Set(sortedUnique(policy.approvedWorkspaceRoleKeys ?? DEFAULT_APPROVED_WORKSPACE_ROLES))
  };
}

function assertSelection(snapshot) {
  assertPlainObject(snapshot.selection, "selection");
  assertString(snapshot.selection.tenantLabel, "selection.tenantLabel");
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(snapshot.selection.tenantLabel)) {
    throw new P2AValidationError("selection.tenantLabel must be a pseudonymous label.", "SELECTION_LABEL_INVALID");
  }
  assertString(snapshot.selection.tenantSelectionHash, "selection.tenantSelectionHash");
  if (snapshot.selection.tenantSelectionHash !== sha256(snapshot.selection.tenantLabel)) {
    throw new P2AValidationError("selection.tenantSelectionHash does not match the pseudonymous label.", "SELECTION_HASH_MISMATCH");
  }
}

function assertManifest(snapshot) {
  assertPlainObject(snapshot.manifest, "manifest");
  if (snapshot.manifest.algorithm !== "SHA-256") throw new P2AValidationError("manifest.algorithm must be SHA-256.", "MANIFEST_INVALID");
  if (snapshot.manifest.canonicalization !== P2A_CANONICALIZATION) throw new P2AValidationError("manifest.canonicalization is unsupported.", "MANIFEST_INVALID");
  assertString(snapshot.manifest.inputSha256, "manifest.inputSha256");
  const actual = computeSnapshotSha256(snapshot);
  if (actual !== snapshot.manifest.inputSha256) throw new P2AValidationError("manifest.inputSha256 does not match canonical snapshot content.", "MANIFEST_HASH_MISMATCH");
  return actual;
}

function assertRecordShape(records, keyField, label, requiredFields) {
  assertUniqueKeys(records, keyField, label);
  for (const record of records) {
    for (const field of requiredFields) assertString(record[field], `${label}.${field}`);
  }
}

function findSingleMapping(mappings, keyField, value, label) {
  const matches = mappings.filter((mapping) => mapping[keyField] === value);
  if (matches.length !== 1) throw new P2AValidationError(`${label} requires exactly one mapping for ${keyField} "${value}".`, matches.length === 0 ? "MAPPING_MISSING" : "MAPPING_AMBIGUOUS");
  return matches[0];
}

function assertMappingShape(proposedMappings) {
  assertPlainObject(proposedMappings, "proposedMappings");
  for (const key of REQUIRED_MAPPING_GROUPS) assertArray(proposedMappings[key], `proposedMappings.${key}`);
  const unknownKeys = Object.keys(proposedMappings).filter((key) => !REQUIRED_MAPPING_GROUPS.includes(key));
  if (unknownKeys.length > 0) throw new P2AValidationError(`Unsupported mapping groups: ${unknownKeys.join(", ")}.`, "MAPPING_GROUP_UNSUPPORTED");
  assertUniqueKeys(proposedMappings.tenantToWorkspace, "tenantKey", "tenantToWorkspace");
  assertUniqueKeys(proposedMappings.clientToWorkspace, "clientKey", "clientToWorkspace");
  assertUniqueKeys(proposedMappings.membershipRoles, "membershipKey", "membershipRoles");
  for (const mapping of proposedMappings.tenantToWorkspace) {
    assertString(mapping.workspaceKey, "tenantToWorkspace.workspaceKey");
  }
  for (const mapping of proposedMappings.clientToWorkspace) {
    assertString(mapping.workspaceKey, "clientToWorkspace.workspaceKey");
    assertString(mapping.tenantKey, "clientToWorkspace.tenantKey");
  }
  for (const mapping of proposedMappings.membershipRoles) {
    assertString(mapping.workspaceKey, "membershipRoles.workspaceKey");
    assertString(mapping.userKey, "membershipRoles.userKey");
    assertArray(mapping.workspaceRoleKeys, "membershipRoles.workspaceRoleKeys");
  }
}

export function validateP2aSnapshot(snapshot, policy) {
  assertPlainObject(snapshot, "snapshot");
  if (snapshot.schemaVersion !== P2A_SNAPSHOT_SCHEMA_VERSION) throw new P2AValidationError("Unsupported P2-A snapshot schema version.", "SCHEMA_VERSION_UNSUPPORTED");
  assertNoForbiddenFields(snapshot);
  const normalizedPolicy = normalizePolicy(policy);
  assertSelection(snapshot);
  const manifestSha256 = assertManifest(snapshot);
  assertPlainObject(snapshot.records, "records");
  const tenants = assertArray(snapshot.records.tenants, "records.tenants");
  const clients = assertArray(snapshot.records.clients, "records.clients");
  const memberships = assertArray(snapshot.records.memberships, "records.memberships");
  const accessRecords = assertArray(snapshot.records.clientUserAccess, "records.clientUserAccess");
  const recordGroups = Object.keys(snapshot.records);
  const unknownRecordGroups = recordGroups.filter((key) => !REQUIRED_RECORDS.includes(key));
  if (unknownRecordGroups.length > 0) throw new P2AValidationError(`Unsupported record groups: ${unknownRecordGroups.join(", ")}.`, "RECORD_GROUP_UNSUPPORTED");
  assertRecordShape(tenants, "tenantKey", "tenant", ["status"]);
  assertRecordShape(clients, "clientKey", "client", ["tenantKey", "status"]);
  assertRecordShape(memberships, "membershipKey", "membership", ["tenantKey", "userKey", "status"]);
  assertRecordShape(accessRecords, "accessKey", "clientUserAccess", ["clientKey", "userKey", "status"]);
  const activeTenants = tenants.filter(isActive);
  if (activeTenants.length !== 1) throw new P2AValidationError(`Exactly one active Tenant is required; found ${activeTenants.length}.`, "ACTIVE_TENANT_COUNT_INVALID");
  const selectedTenantKey = activeTenants[0].tenantKey;
  const tenantKeys = new Set(tenants.map((tenant) => tenant.tenantKey));
  const activeClients = clients.filter(isActive);
  for (const client of activeClients) {
    if (!tenantKeys.has(client.tenantKey)) throw new P2AValidationError(`Client "${client.clientKey}" references an unknown tenant.`, "ORPHAN_CLIENT");
    if (client.tenantKey !== selectedTenantKey) throw new P2AValidationError(`Client "${client.clientKey}" crosses the selected tenant boundary.`, "CROSS_TENANT_LINK");
  }
  for (const membership of memberships.filter(isActive)) {
    if (!tenantKeys.has(membership.tenantKey)) throw new P2AValidationError(`Membership "${membership.membershipKey}" references an unknown tenant.`, "ORPHAN_MEMBERSHIP");
    if (membership.tenantKey !== selectedTenantKey) throw new P2AValidationError(`Membership "${membership.membershipKey}" crosses the selected tenant boundary.`, "CROSS_TENANT_LINK");
  }
  const knownNoRoleSet = new Set(normalizedPolicy.knownNoRoleMembershipKeys);
  const activeMemberships = memberships.filter(isActive);
  const knownNoRoleMemberships = [];
  const legacyRoleExceptions = [];
  for (const membership of activeMemberships) {
    const legacyRoleKeys = sortedUnique(Array.isArray(membership.legacyRoleKeys) ? membership.legacyRoleKeys : []);
    for (const role of legacyRoleKeys) {
      if (!normalizedPolicy.approvedLegacyRoleKeys.has(role)) throw new P2AValidationError(`Unknown legacy role "${role}" on membership "${membership.membershipKey}".`, "UNKNOWN_ROLE");
    }
    if (knownNoRoleSet.has(membership.membershipKey)) {
      if (legacyRoleKeys.length > 0) throw new P2AValidationError(`Known no-role membership "${membership.membershipKey}" has a role.`, "KNOWN_EXCEPTION_ROLE_MISMATCH");
      knownNoRoleMemberships.push({ membershipKey: membership.membershipKey, classification: P2A_KNOWN_NO_ROLE_CLASSIFICATION, defaultRole: null, accessGranted: false });
    } else if (legacyRoleKeys.length === 0) {
      throw new P2AValidationError(`Unexpected no-role membership "${membership.membershipKey}" requires a new owner decision.`, "UNAPPROVED_EXCEPTION");
    } else {
      legacyRoleExceptions.push({ membershipKey: membership.membershipKey, legacyRoleKeys });
    }
  }
  if (knownNoRoleMemberships.length !== 6 || knownNoRoleMemberships.some((item) => !knownNoRoleSet.has(item.membershipKey))) {
    throw new P2AValidationError("The six known no-role memberships are not present exactly as expected.", "KNOWN_EXCEPTION_SET_MISMATCH");
  }
  assertMappingShape(snapshot.proposedMappings);
  const tenantMapping = findSingleMapping(snapshot.proposedMappings.tenantToWorkspace, "tenantKey", selectedTenantKey, "tenantToWorkspace");
  const workspaceKey = tenantMapping.workspaceKey;
  if (snapshot.proposedMappings.tenantToWorkspace.some((mapping) => mapping.workspaceKey === workspaceKey && mapping.tenantKey !== selectedTenantKey)) {
    throw new P2AValidationError(`Workspace "${workspaceKey}" maps to more than one tenant.`, "WORKSPACE_COLLISION");
  }
  for (const client of activeClients) {
    const mapping = findSingleMapping(snapshot.proposedMappings.clientToWorkspace, "clientKey", client.clientKey, "clientToWorkspace");
    if (mapping.tenantKey !== selectedTenantKey || mapping.workspaceKey !== workspaceKey) throw new P2AValidationError(`Client "${client.clientKey}" has a cross-tenant or cross-workspace mapping.`, "CROSS_WORKSPACE_LINK");
  }
  const membershipByKey = new Map(activeMemberships.map((membership) => [membership.membershipKey, membership]));
  const roleMappings = [];
  for (const membership of activeMemberships) {
    const mapping = snapshot.proposedMappings.membershipRoles.filter((candidate) => candidate.membershipKey === membership.membershipKey);
    if (knownNoRoleSet.has(membership.membershipKey)) {
      if (mapping.length > 0) throw new P2AValidationError(`No role or access mapping may be proposed for known no-role membership "${membership.membershipKey}".`, "KNOWN_EXCEPTION_MAPPING_FORBIDDEN");
      continue;
    }
    if (mapping.length !== 1) throw new P2AValidationError(`Membership "${membership.membershipKey}" requires exactly one role mapping.`, mapping.length === 0 ? "MAPPING_MISSING" : "MAPPING_AMBIGUOUS");
    const roleMapping = mapping[0];
    if (roleMapping.workspaceKey !== workspaceKey || roleMapping.userKey !== membership.userKey) throw new P2AValidationError(`Membership "${membership.membershipKey}" has a cross-workspace or user mapping.`, "CROSS_WORKSPACE_LINK");
    const workspaceRoleKeys = sortedUnique(roleMapping.workspaceRoleKeys);
    if (workspaceRoleKeys.length === 0) throw new P2AValidationError(`Membership "${membership.membershipKey}" has no proposed Workspace role.`, "UNKNOWN_ROLE");
    for (const role of workspaceRoleKeys) if (!normalizedPolicy.approvedWorkspaceRoleKeys.has(role)) throw new P2AValidationError(`Unknown Workspace role "${role}" on membership "${membership.membershipKey}".`, "UNKNOWN_ROLE");
    roleMappings.push({ membershipKey: membership.membershipKey, workspaceKey, userKey: membership.userKey, workspaceRoleKeys });
  }
  for (const mapping of snapshot.proposedMappings.membershipRoles) {
    if (!membershipByKey.has(mapping.membershipKey)) throw new P2AValidationError(`Role mapping references an unknown or inactive membership "${mapping.membershipKey}".`, "ORPHAN_MAPPING");
  }
  const activeClientKeys = new Set(activeClients.map((client) => client.clientKey));
  const activeUserKeys = new Set(activeMemberships.map((membership) => membership.userKey));
  const knownNoRoleUserKeys = new Set(knownNoRoleMemberships.map((membership) => memberships.find((candidate) => candidate.membershipKey === membership.membershipKey)?.userKey));
  for (const access of accessRecords.filter(isActive)) {
    if (!activeClientKeys.has(access.clientKey)) throw new P2AValidationError(`ClientUserAccess "${access.accessKey}" references an unknown or inactive client.`, "ORPHAN_ACCESS");
    if (!activeUserKeys.has(access.userKey)) throw new P2AValidationError(`ClientUserAccess "${access.accessKey}" references an unknown or inactive user.`, "ORPHAN_ACCESS");
    if (knownNoRoleUserKeys.has(access.userKey)) throw new P2AValidationError(`ClientUserAccess "${access.accessKey}" would grant access to a known no-role user.`, "KNOWN_EXCEPTION_ACCESS_FORBIDDEN");
  }
  assertPlainObject(snapshot.accessInvariant, "accessInvariant");
  if (!Number.isInteger(snapshot.accessInvariant.clientUserAccessCount) || snapshot.accessInvariant.clientUserAccessCount < 0) throw new P2AValidationError("accessInvariant.clientUserAccessCount must be a non-negative integer.", "ACCESS_INVARIANT_INVALID");
  assertString(snapshot.accessInvariant.clientUserAccessSha256, "accessInvariant.clientUserAccessSha256");
  const activeAccessRecords = accessRecords.filter(isActive);
  const actualAccessSha256 = computeClientUserAccessSha256(activeAccessRecords);
  if (snapshot.accessInvariant.clientUserAccessCount !== activeAccessRecords.length || snapshot.accessInvariant.clientUserAccessSha256 !== actualAccessSha256) {
    throw new P2AValidationError("ClientUserAccess count/hash is not preserved.", "ACCESS_INVARIANT_MISMATCH");
  }
  return {
    reportVersion: P2A_REPORT_VERSION,
    snapshotSchemaVersion: snapshot.schemaVersion,
    mode: "OFFLINE_VALIDATION_ONLY",
    status: "VALIDATION_PASSED",
    databaseAccess: false,
    dataMutation: false,
    snapshotProcessing: "NOT_EXECUTED",
    workspaceAuthority: "UNCHANGED",
    featureFlags: "OFF",
    endpointAuthority: "LOCAL_ONLY",
    phase2Runtime: "NOT_STARTED",
    manifest: { algorithm: "SHA-256", canonicalization: P2A_CANONICALIZATION, inputSha256: manifestSha256 },
    selection: { tenantLabel: snapshot.selection.tenantLabel, tenantSelectionHash: snapshot.selection.tenantSelectionHash, activeTenantKey: selectedTenantKey },
    counts: { activeTenants: activeTenants.length, activeClients: activeClients.length, activeMemberships: activeMemberships.length, activeClientUserAccess: activeAccessRecords.length, mappedClients: activeClients.length, mappedRoleMemberships: roleMappings.length, knownNoRoleMemberships: knownNoRoleMemberships.length, blockers: 0 },
    mappings: { tenantToWorkspace: { tenantKey: selectedTenantKey, workspaceKey }, clientToWorkspace: activeClients.map((client) => ({ clientKey: client.clientKey, workspaceKey })).sort((left, right) => stableCompare(left.clientKey, right.clientKey)), membershipRoles: roleMappings.sort((left, right) => stableCompare(left.membershipKey, right.membershipKey)) },
    exceptions: { knownNoRoleMemberships: knownNoRoleMemberships.sort((left, right) => stableCompare(left.membershipKey, right.membershipKey)), legacyRoleExceptions: legacyRoleExceptions.sort((left, right) => stableCompare(left.membershipKey, right.membershipKey)), newExceptions: [] },
    accessInvariant: { expectedCount: snapshot.accessInvariant.clientUserAccessCount, actualCount: activeAccessRecords.length, expectedSha256: snapshot.accessInvariant.clientUserAccessSha256, actualSha256: actualAccessSha256, preserved: true, workspaceDerivedGrants: 0 },
    decisionEvidencePacket: { packetVersion: "DCA_OS_V2_P2_B_DECISION_EVIDENCE_PACKET_V1", decision: "P2_B_GATE_REQUIRED", inputManifestSha256: manifestSha256, realSnapshotConsumed: false, databaseAccess: false, dataMutation: false, reviewerRequired: true, ownerResumeOrRollbackRequired: true }
  };
}

export function parseP2aCliArgs(args) {
  const parsed = { snapshotPath: null, policyPath: null, format: "summary" };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if ([...EXECUTION_FLAGS].some((flag) => argument === flag || argument.startsWith(`${flag}=`))) throw new P2AValidationError(`Execution flag "${argument}" is forbidden: P2-A is OFFLINE VALIDATION ONLY.`, "EXECUTION_FLAG_FORBIDDEN");
    if (argument === "--snapshot") { parsed.snapshotPath = args[index + 1] ?? null; index += 1; continue; }
    if (argument === "--policy") { parsed.policyPath = args[index + 1] ?? null; index += 1; continue; }
    if (argument === "--format") { parsed.format = args[index + 1] ?? null; index += 1; continue; }
    if (argument === "--help") return { help: true };
    throw new P2AValidationError(`Unsupported argument "${argument}".`, "INVALID_ARGUMENT");
  }
  if (!parsed.snapshotPath) throw new P2AValidationError("--snapshot <owner-provided-offline-file.json> is required.", "INVALID_ARGUMENT");
  if (!parsed.policyPath) throw new P2AValidationError("--policy <parameterized-policy.json> is required.", "INVALID_ARGUMENT");
  if (parsed.format !== "json" && parsed.format !== "summary") throw new P2AValidationError("--format must be json or summary.", "INVALID_ARGUMENT");
  return parsed;
}

export function formatP2aSummary(report) {
  return [
    "P2-A OFFLINE VALIDATION ONLY / NO SNAPSHOT CONSUMED",
    `status=${report.status}; activeTenant=${report.counts.activeTenants}; clients=${report.counts.activeClients}; memberships=${report.counts.activeMemberships}; knownNoRole=${report.counts.knownNoRoleMemberships}; blockers=${report.counts.blockers}`,
    `manifestSha256=${report.manifest.inputSha256}; clientUserAccess=${report.accessInvariant.actualCount}; accessHashPreserved=${report.accessInvariant.preserved}; p2bGate=${report.decisionEvidencePacket.decision}`
  ].join("\n");
}

export async function runP2aCli(args, io = { readFile, stdout: process.stdout, stderr: process.stderr }) {
  let options;
  try { options = parseP2aCliArgs(args); } catch (error) { io.stderr.write(`P2-A OFFLINE VALIDATION ONLY / ${error.message}\n`); return error.code === "EXECUTION_FLAG_FORBIDDEN" ? P2A_EXIT_CODES.INVALID_ARGUMENT : P2A_EXIT_CODES.INVALID_ARGUMENT; }
  if (options.help) { io.stdout.write("Usage: node p2-a-offline-foundation.mjs --snapshot <owner-provided-offline-file.json> --policy <policy.json> [--format json|summary]\n"); return P2A_EXIT_CODES.OK; }
  try {
    const snapshot = JSON.parse(await io.readFile(path.resolve(options.snapshotPath), "utf8"));
    const policy = JSON.parse(await io.readFile(path.resolve(options.policyPath ?? options.snapshotPath), "utf8"));
    const report = validateP2aSnapshot(snapshot, policy);
    io.stdout.write(`${options.format === "json" ? JSON.stringify(report, null, 2) : formatP2aSummary(report)}\n`);
    return P2A_EXIT_CODES.OK;
  } catch (error) {
    io.stderr.write(`P2-A OFFLINE VALIDATION ONLY / ${error.message}\n`);
    return error instanceof P2AValidationError ? P2A_EXIT_CODES.VALIDATION_BLOCKED : P2A_EXIT_CODES.INVALID_INPUT;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) process.exitCode = await runP2aCli(process.argv.slice(2));
