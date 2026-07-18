import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const P1_2A_REPORT_VERSION = "DCA_OS_V2_P1_2A_MAPPING_DRY_RUN_V1";
export const EXIT_CODES = Object.freeze({
  OK: 0,
  VALIDATION_BLOCKED: 2,
  INVALID_ARGUMENT: 64,
  INVALID_INPUT: 65
});

const EXECUTION_FLAGS = new Set(["--apply", "--execute", "--mutation", "--mutate", "--write"]);

function stableCompare(left, right) {
  return String(left).localeCompare(String(right));
}

function sortById(records) {
  return [...records].sort((left, right) => stableCompare(left.id, right.id));
}

function uniqueSorted(values) {
  return [...new Set(values)].sort(stableCompare);
}

function assertArray(value, field) {
  if (!Array.isArray(value)) throw new Error(`Snapshot field "${field}" must be an array.`);
  return value;
}

function assertId(record, collection) {
  if (!record || typeof record.id !== "string" || record.id.length === 0) {
    throw new Error(`Every ${collection} record must have a non-empty string id.`);
  }
}

function assertUniqueIds(records, collection) {
  const ids = new Set();
  for (const record of records) {
    assertId(record, collection);
    if (ids.has(record.id)) throw new Error(`Duplicate ${collection} id "${record.id}" is unsupported.`);
    ids.add(record.id);
  }
}

function isExecutionFlag(argument) {
  return [...EXECUTION_FLAGS].some((flag) => argument === flag || argument.startsWith(`${flag}=`));
}

function isActive(record) {
  return record.status === undefined || record.status === "ACTIVE";
}

/**
 * Validates only a supplied, sanitized snapshot. It deliberately has no database
 * client, no SQL path, and no execution/apply mode.
 */
export function createP12aDryRunReport(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error("Snapshot must be a JSON object.");
  }

  const tenants = assertArray(snapshot.tenants, "tenants");
  const clients = assertArray(snapshot.clients, "clients");
  const workspaces = assertArray(snapshot.workspaces, "workspaces");
  const tenantMemberships = assertArray(snapshot.tenantMemberships, "tenantMemberships");
  const proposedMappings = assertArray(snapshot.proposedTenantWorkspaceMappings, "proposedTenantWorkspaceMappings");

  assertUniqueIds(tenants, "tenant");
  assertUniqueIds(clients, "client");
  assertUniqueIds(workspaces, "workspace");
  assertUniqueIds(tenantMemberships, "tenantMembership");

  const tenantById = new Map(sortById(tenants).map((tenant) => [tenant.id, tenant]));
  const workspaceById = new Map(sortById(workspaces).map((workspace) => [workspace.id, workspace]));
  const activeTenants = sortById(tenants.filter(isActive));
  const mappingByTenant = new Map();
  const duplicateMappings = [];

  for (const mapping of proposedMappings) {
    if (!mapping || typeof mapping.tenantId !== "string" || typeof mapping.workspaceId !== "string") {
      throw new Error("Every proposed mapping must contain string tenantId and workspaceId values.");
    }
    const candidates = mappingByTenant.get(mapping.tenantId) ?? [];
    candidates.push(mapping.workspaceId);
    mappingByTenant.set(mapping.tenantId, candidates);
  }

  const ambiguousMappings = [];
  const validCandidates = [];
  const missingMappings = [];
  const unsupportedMappings = [];
  const workspaceOwners = new Map();

  for (const tenant of activeTenants) {
    const workspaceIds = uniqueSorted(mappingByTenant.get(tenant.id) ?? []);
    if (workspaceIds.length === 0) {
      missingMappings.push({ tenantId: tenant.id, reason: "NO_PROPOSED_MAPPING" });
      continue;
    }
    if (workspaceIds.length > 1) {
      ambiguousMappings.push({ tenantId: tenant.id, workspaceIds, reason: "MULTIPLE_PROPOSED_WORKSPACES" });
      continue;
    }
    const workspaceId = workspaceIds[0];
    if (!workspaceById.has(workspaceId)) {
      missingMappings.push({ tenantId: tenant.id, workspaceId, reason: "WORKSPACE_NOT_IN_SNAPSHOT" });
      continue;
    }
    const owners = workspaceOwners.get(workspaceId) ?? [];
    owners.push(tenant.id);
    workspaceOwners.set(workspaceId, owners);
    validCandidates.push({ tenantId: tenant.id, workspaceId });
  }

  for (const [tenantId, workspaceIds] of [...mappingByTenant.entries()].sort(([left], [right]) => stableCompare(left, right))) {
    const tenant = tenantById.get(tenantId);
    if (!tenant) {
      unsupportedMappings.push({ tenantId, workspaceIds: uniqueSorted(workspaceIds), reason: "TENANT_NOT_IN_SNAPSHOT" });
    } else if (!isActive(tenant)) {
      unsupportedMappings.push({ tenantId, workspaceIds: uniqueSorted(workspaceIds), reason: "TENANT_NOT_ACTIVE" });
    }
  }

  for (const [tenantId, workspaceIds] of [...mappingByTenant.entries()].sort(([left], [right]) => stableCompare(left, right))) {
    const uniqueWorkspaceIds = uniqueSorted(workspaceIds);
    if (workspaceIds.length > uniqueWorkspaceIds.length) {
      duplicateMappings.push({ tenantId, workspaceIds: uniqueWorkspaceIds, reason: "DUPLICATE_PROPOSED_MAPPING" });
    }
  }
  for (const [workspaceId, tenantIds] of [...workspaceOwners.entries()].sort(([left], [right]) => stableCompare(left, right))) {
    if (uniqueSorted(tenantIds).length > 1) {
      duplicateMappings.push({ workspaceId, tenantIds: uniqueSorted(tenantIds), reason: "WORKSPACE_COLLISION" });
    }
  }

  const orphanedLegacyRecords = [];
  for (const client of sortById(clients)) {
    if (typeof client.tenantId !== "string" || !tenantById.has(client.tenantId)) {
      orphanedLegacyRecords.push({ recordType: "CLIENT", recordId: client.id, tenantId: client.tenantId ?? null });
    }
  }
  for (const membership of sortById(tenantMemberships)) {
    if (typeof membership.tenantId !== "string" || !tenantById.has(membership.tenantId)) {
      orphanedLegacyRecords.push({ recordType: "TENANT_MEMBERSHIP", recordId: membership.id, tenantId: membership.tenantId ?? null });
    }
  }

  const membershipRoleExceptions = [];
  for (const membership of sortById(tenantMemberships.filter(isActive))) {
    const roleKeys = uniqueSorted(Array.isArray(membership.roleKeys) ? membership.roleKeys.filter((role) => typeof role === "string") : []);
    if (roleKeys.length > 0) {
      membershipRoleExceptions.push({
        tenantMembershipId: membership.id,
        tenantId: membership.tenantId ?? null,
        roleKeys,
        reason: "LEGACY_ROLE_TRANSLATION_NOT_AUTHORIZED"
      });
    }
  }

  const blockedTenantIds = new Set([
    ...ambiguousMappings.map((item) => item.tenantId),
    ...missingMappings.map((item) => item.tenantId),
    ...duplicateMappings.flatMap((item) => item.tenantIds ?? (item.tenantId ? [item.tenantId] : [])),
    ...unsupportedMappings.map((item) => item.tenantId),
    ...orphanedLegacyRecords.map((item) => item.tenantId),
    ...membershipRoleExceptions.map((item) => item.tenantId)
  ].filter(Boolean));

  const plannedBindings = validCandidates
    .filter((candidate) => !blockedTenantIds.has(candidate.tenantId))
    .map((candidate) => ({
      operation: "PLAN_TENANT_TO_WORKSPACE_BINDING",
      tenantId: candidate.tenantId,
      workspaceId: candidate.workspaceId,
      clientIds: sortById(clients.filter((client) => client.tenantId === candidate.tenantId)).map((client) => client.id),
      execution: "NOT_EXECUTED"
    }))
    .sort((left, right) => stableCompare(left.tenantId, right.tenantId));

  const exceptions = {
    missingMappings: missingMappings.sort((left, right) => stableCompare(left.tenantId, right.tenantId)),
    ambiguousMappings: ambiguousMappings.sort((left, right) => stableCompare(left.tenantId, right.tenantId)),
    duplicateMappings: duplicateMappings.sort((left, right) => stableCompare(JSON.stringify(left), JSON.stringify(right))),
    unsupportedMappings: unsupportedMappings.sort((left, right) => stableCompare(left.tenantId, right.tenantId)),
    orphanedLegacyRecords: orphanedLegacyRecords.sort((left, right) => stableCompare(`${left.recordType}:${left.recordId}`, `${right.recordType}:${right.recordId}`)),
    membershipRoleExceptions: membershipRoleExceptions.sort((left, right) => stableCompare(left.tenantMembershipId, right.tenantMembershipId))
  };
  const blockerCount = Object.values(exceptions).reduce((total, entries) => total + entries.length, 0);

  return {
    reportVersion: P1_2A_REPORT_VERSION,
    mode: "DRY_RUN_ONLY",
    dataMutation: false,
    executionApplyMode: "DISABLED_BY_DESIGN",
    tenantClientAuthority: "UNCHANGED",
    workspaceRuntimeAuthority: "NOT_ACTIVATED",
    status: blockerCount === 0 ? "VALIDATION_PASSED" : "VALIDATION_BLOCKED",
    counts: {
      activeTenants: activeTenants.length,
      clients: clients.length,
      workspaces: workspaces.length,
      validDeterministicCandidates: validCandidates.length,
      plannedBindings: plannedBindings.length,
      missingMappings: exceptions.missingMappings.length,
      ambiguousMappings: exceptions.ambiguousMappings.length,
      duplicateMappings: exceptions.duplicateMappings.length,
      unsupportedMappings: exceptions.unsupportedMappings.length,
      orphanedLegacyRecords: exceptions.orphanedLegacyRecords.length,
      membershipRoleExceptions: exceptions.membershipRoleExceptions.length,
      blockers: blockerCount
    },
    validDeterministicCandidates: validCandidates.sort((left, right) => stableCompare(left.tenantId, right.tenantId)),
    plannedBindings,
    exceptions
  };
}

export function parseP12aCliArgs(args) {
  const parsed = { snapshotPath: null, format: "summary" };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (isExecutionFlag(argument)) throw new Error(`Execution flag "${argument}" is forbidden: P1.2a is DRY RUN ONLY.`);
    if (argument === "--snapshot") {
      parsed.snapshotPath = args[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (argument === "--format") {
      parsed.format = args[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (argument === "--help") return { help: true };
    throw new Error(`Unsupported argument "${argument}".`);
  }
  if (!parsed.snapshotPath) throw new Error("--snapshot <sanitized-snapshot.json> is required.");
  if (parsed.format !== "json" && parsed.format !== "summary") throw new Error("--format must be json or summary.");
  return parsed;
}

export function formatP12aSummary(report) {
  const { counts } = report;
  return [
    "P1.2A DRY RUN / NO DATA MUTATION",
    `status=${report.status}; plannedBindings=${counts.plannedBindings}; blockers=${counts.blockers}`,
    `missing=${counts.missingMappings}; ambiguous=${counts.ambiguousMappings}; duplicates=${counts.duplicateMappings}; unsupported=${counts.unsupportedMappings}; orphans=${counts.orphanedLegacyRecords}; membershipRoleExceptions=${counts.membershipRoleExceptions}`
  ].join("\n");
}

export async function runP12aCli(args, io = { readFile, stdout: process.stdout, stderr: process.stderr }) {
  let options;
  try {
    options = parseP12aCliArgs(args);
  } catch (error) {
    io.stderr.write(`P1.2A DRY RUN / NO DATA MUTATION\n${error.message}\n`);
    return EXIT_CODES.INVALID_ARGUMENT;
  }
  if (options.help) {
    io.stdout.write("Usage: node p1-2a-mapping-dry-run.mjs --snapshot <sanitized-snapshot.json> [--format json|summary]\n");
    return EXIT_CODES.OK;
  }
  try {
    const snapshot = JSON.parse(await io.readFile(path.resolve(options.snapshotPath), "utf8"));
    const report = createP12aDryRunReport(snapshot);
    io.stdout.write(`${options.format === "json" ? JSON.stringify(report, null, 2) : formatP12aSummary(report)}\n`);
    return report.status === "VALIDATION_PASSED" ? EXIT_CODES.OK : EXIT_CODES.VALIDATION_BLOCKED;
  } catch (error) {
    io.stderr.write(`P1.2A DRY RUN / NO DATA MUTATION\n${error.message}\n`);
    return EXIT_CODES.INVALID_INPUT;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const exitCode = await runP12aCli(process.argv.slice(2));
  process.exitCode = exitCode;
}
