import { createHash } from "node:crypto";
import {
  P2A_EXECUTION_PREPARATION_READ_ONLY_INTENT,
  P2A_EXECUTION_PREPARATION_TARGET,
  P2aExecutionPreparationError,
  assertP2aExecutionPreparationTarget
} from "./p2-a-execution-preparation.mjs";

export const P2A_LOCAL_READ_ONLY_SOURCE_ADAPTER_VERSION = "DCA_OS_V2_P2_A_LOCAL_READ_ONLY_SOURCE_ADAPTER_V1";

const REQUIRED_DELEGATES = ["tenant", "client", "tenantMembership", "clientUserAccess"];
const hash = (value) => createHash("sha256").update(value, "utf8").digest("hex");

export class P2aLocalReadOnlySourceAdapterError extends Error {
  constructor(code) {
    super("P2-A local read-only source adapter request was rejected.");
    this.name = "P2aLocalReadOnlySourceAdapterError";
    this.code = code;
  }
}

function reject(code) {
  throw new P2aLocalReadOnlySourceAdapterError(code);
}

function assertExactKeys(value, expected, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join("|") !== [...expected].sort().join("|")) reject(code);
}

function assertPlainExactKeys(value, expected, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) reject(code);
  if (Object.getOwnPropertySymbols(value).length > 0 || Object.getOwnPropertyNames(value).sort().join("|") !== [...expected].sort().join("|")) reject(code);
  for (const key of expected) if (typeof Object.getOwnPropertyDescriptor(value, key)?.value === "undefined") reject(code);
}

function assertOpaqueString(value, code) {
  if (typeof value !== "string" || value.length === 0) reject(code);
}

function assertActiveStatus(value, archived) {
  return value === "ACTIVE" && archived !== true;
}

function assertReadOnlyClient(client) {
  assertPlainExactKeys(client, REQUIRED_DELEGATES, "CLIENT_CAPABILITY_INVALID");
  for (const delegateName of REQUIRED_DELEGATES) {
    const delegate = client[delegateName];
    assertPlainExactKeys(delegate, ["findMany"], "CLIENT_CAPABILITY_INVALID");
    if (typeof delegate.findMany !== "function") reject("CLIENT_CAPABILITY_INVALID");
  }
}

function assertReadRequest(request) {
  assertExactKeys(request, ["target", "intent"], "READ_REQUEST_INVALID");
  try {
    assertP2aExecutionPreparationTarget(request.target);
  } catch {
    reject("TARGET_INVALID");
  }
  if (request.intent !== P2A_EXECUTION_PREPARATION_READ_ONLY_INTENT) reject("READ_ONLY_INTENT_REQUIRED");
}

function assertRows(rows, code) {
  if (!Array.isArray(rows)) reject(code);
  return rows;
}

function assertExactRow(row, fields) {
  assertExactKeys(row, fields, "SOURCE_ROW_INVALID");
  for (const field of fields) {
    if (field === "membershipRoles") continue;
    if (field === "deletedAt") {
      if (row[field] !== null && typeof row[field] !== "string") reject("SOURCE_ROW_INVALID");
      continue;
    }
    if (typeof row[field] !== "boolean") assertOpaqueString(row[field], "SOURCE_ROW_INVALID");
  }
}

function deriveSourceKey(kind, rawId) {
  return `${kind}-${hash(`${P2A_LOCAL_READ_ONLY_SOURCE_ADAPTER_VERSION}:${kind}:${rawId}`).slice(0, 24)}`;
}

export function deriveP2aAdapterSourceKey(kind, rawId) {
  if (!new Set(["tenant", "client", "membership", "user", "access"]).has(kind)) reject("SOURCE_KEY_KIND_INVALID");
  assertOpaqueString(rawId, "SOURCE_KEY_INVALID");
  return deriveSourceKey(kind, rawId);
}

function uniqueBy(rows, field, code) {
  const values = new Set();
  for (const row of rows) {
    if (values.has(row[field])) reject(code);
    values.add(row[field]);
  }
}

function normalizeLegacyRoles(membership, tenantId) {
  if (!Array.isArray(membership.membershipRoles)) reject("SOURCE_ROW_INVALID");
  const roleKeys = [];
  const roleIds = new Set();
  for (const membershipRole of membership.membershipRoles) {
    assertExactKeys(membershipRole, ["role"], "SOURCE_ROW_INVALID");
    assertExactKeys(membershipRole.role, ["id", "tenantId", "key", "status", "deletedAt"], "SOURCE_ROW_INVALID");
    const role = membershipRole.role;
    assertOpaqueString(role.id, "SOURCE_ROW_INVALID");
    assertOpaqueString(role.tenantId, "SOURCE_ROW_INVALID");
    assertOpaqueString(role.key, "SOURCE_ROW_INVALID");
    assertOpaqueString(role.status, "SOURCE_ROW_INVALID");
    if (role.deletedAt !== null && typeof role.deletedAt !== "string") reject("SOURCE_ROW_INVALID");
    if (role.tenantId !== tenantId) reject("CROSS_TENANT_ROLE");
    if (!assertActiveStatus(role.status, role.deletedAt !== null)) continue;
    if (roleIds.has(role.id) || roleKeys.includes(role.key)) reject("DUPLICATE_ROLE");
    roleIds.add(role.id);
    roleKeys.push(role.key);
  }
  return roleKeys.sort();
}

export function createP2aLocalReadOnlySourceAdapter({ client, target = P2A_EXECUTION_PREPARATION_TARGET, intent = P2A_EXECUTION_PREPARATION_READ_ONLY_INTENT }) {
  assertReadOnlyClient(client);
  assertReadRequest({ target, intent });
  return async function readP2aLocalPopulation(request) {
    assertReadRequest(request);
    if (request.target.host !== target.host || request.target.port !== target.port || request.intent !== intent) reject("READ_REQUEST_OVERRIDE_REJECTED");
    assertReadOnlyClient(client);
    const [tenantRows, clientRows, membershipRows, accessRows] = await Promise.all([
      client.tenant.findMany({ where: { status: "ACTIVE", deletedAt: null }, select: { id: true, status: true, deletedAt: true } }),
      client.client.findMany({ where: { isArchived: false, migrationStatus: "ACTIVE" }, select: { id: true, tenantId: true, isArchived: true, migrationStatus: true } }),
      client.tenantMembership.findMany({ where: { status: "ACTIVE", deletedAt: null }, select: { id: true, tenantId: true, userId: true, status: true, deletedAt: true, membershipRoles: { select: { role: { select: { id: true, tenantId: true, key: true, status: true, deletedAt: true } } } } } }),
      client.clientUserAccess.findMany({ where: { isArchived: false }, select: { id: true, tenantId: true, clientId: true, userId: true, isArchived: true } })
    ]);
    const tenants = assertRows(tenantRows, "SOURCE_ROWS_INVALID").filter((row) => {
      assertExactRow(row, ["id", "status", "deletedAt"]);
      return assertActiveStatus(row.status, row.deletedAt !== null);
    });
    if (tenants.length !== 1) reject("ACTIVE_TENANT_COUNT_INVALID");
    uniqueBy(tenants, "id", "DUPLICATE_TENANT");
    const tenantId = tenants[0].id;
    const activeClients = assertRows(clientRows, "SOURCE_ROWS_INVALID").filter((row) => {
      assertExactRow(row, ["id", "tenantId", "isArchived", "migrationStatus"]);
      return row.isArchived === false && row.migrationStatus === "ACTIVE";
    });
    const activeMemberships = assertRows(membershipRows, "SOURCE_ROWS_INVALID").filter((row) => {
      assertExactRow(row, ["id", "tenantId", "userId", "status", "deletedAt", "membershipRoles"]);
      return assertActiveStatus(row.status, row.deletedAt !== null);
    });
    const activeAccess = assertRows(accessRows, "SOURCE_ROWS_INVALID").filter((row) => {
      assertExactRow(row, ["id", "tenantId", "clientId", "userId", "isArchived"]);
      return row.isArchived === false;
    });
    for (const row of [...activeClients, ...activeMemberships, ...activeAccess]) if (row.tenantId !== tenantId) reject("CROSS_TENANT_LINK");
    uniqueBy(activeClients, "id", "DUPLICATE_CLIENT");
    uniqueBy(activeMemberships, "id", "DUPLICATE_MEMBERSHIP");
    uniqueBy(activeAccess, "id", "DUPLICATE_ACCESS");
    uniqueBy(activeMemberships.map((row) => ({ value: `${row.tenantId}:${row.userId}` })), "value", "DUPLICATE_MEMBERSHIP_LINK");
    uniqueBy(activeAccess.map((row) => ({ value: `${row.tenantId}:${row.clientId}:${row.userId}` })), "value", "DUPLICATE_ACCESS_LINK");
    const clientIds = new Set(activeClients.map((row) => row.id));
    const userIds = new Set(activeMemberships.map((row) => row.userId));
    for (const row of activeAccess) if (!clientIds.has(row.clientId) || !userIds.has(row.userId)) reject("ORPHAN_ACCESS");
    const tenantSourceKey = deriveSourceKey("tenant", tenantId);
    return Object.freeze({
      tenants: Object.freeze([{ sourceKey: tenantSourceKey, status: "ACTIVE" }]),
      clients: Object.freeze(activeClients.map((row) => Object.freeze({ sourceKey: deriveSourceKey("client", row.id), tenantSourceKey, status: "ACTIVE" })).sort((a, b) => a.sourceKey.localeCompare(b.sourceKey))),
      memberships: Object.freeze(activeMemberships.map((row) => Object.freeze({ sourceKey: deriveSourceKey("membership", row.id), tenantSourceKey, userSourceKey: deriveSourceKey("user", row.userId), status: "ACTIVE", legacyRoleKeys: Object.freeze(normalizeLegacyRoles(row, tenantId)) })).sort((a, b) => a.sourceKey.localeCompare(b.sourceKey))),
      clientUserAccess: Object.freeze(activeAccess.map((row) => Object.freeze({ sourceKey: deriveSourceKey("access", row.id), clientSourceKey: deriveSourceKey("client", row.clientId), userSourceKey: deriveSourceKey("user", row.userId), status: "ACTIVE" })).sort((a, b) => a.sourceKey.localeCompare(b.sourceKey)))
    });
  };
}

export function createP2aInjectedReadPopulationContract(options) {
  const reader = createP2aLocalReadOnlySourceAdapter(options);
  return async (request) => {
    try {
      return await reader(request);
    } catch (error) {
      if (error instanceof P2aLocalReadOnlySourceAdapterError) throw error;
      throw new P2aExecutionPreparationError("READER_ATTEMPT_FAILED");
    }
  };
}
