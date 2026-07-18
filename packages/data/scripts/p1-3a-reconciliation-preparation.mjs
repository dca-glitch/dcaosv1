import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createP12aDryRunReport } from "./p1-2a-mapping-dry-run.mjs";

export const P1_3A_REPORT_VERSION = "DCA_OS_V2_P1_3A_RECONCILIATION_PREPARATION_V1";
export const P1_3A_FEATURE_FLAGS = Object.freeze({ workspaceReconciliationPreview: false, workspaceAuthoritySwitch: false });
export const P1_3A_ROLLBACK_PLAN = Object.freeze({
  execution: "NOT_EXECUTED",
  authority: "TENANT_CLIENT_REMAINS_AUTHORITATIVE",
  checkpoints: ["approved_mapping", "dry_run_clean", "backup_restore_proof", "security_isolation_proof", "staging_rehearsal", "owner_acceptance"],
  abortConditions: ["mapping_exception", "cross_workspace_access", "missing_membership", "role_translation_exception", "reconciliation_mismatch"],
  recovery: ["stop_execution", "preserve_evidence", "restore_verified_backup", "return_to_tenant_client_authority", "owner_review"]
});
const EXECUTION = /^(--apply|--execute|--reconcile|--switch|--write|--mutate)(=|$)/;
const sort = (items, key = "id") => [...items].sort((a, b) => String(a[key]).localeCompare(String(b[key])));

export function createP13aPreparationReport(snapshot) {
  const p12a = createP12aDryRunReport(snapshot);
  const expected = Array.isArray(snapshot.expectedWorkspaceState) ? snapshot.expectedWorkspaceState : [];
  const expectedByWorkspace = new Map(expected.map((item) => [item.workspaceId, item]));
  const conflicts = [];
  const missingExpectedState = [];
  const crossWorkspaceAccess = [];
  const missingMembership = [];
  const invalidRoles = [];
  const allowedRoles = new Set(["ADMIN", "WORKSPACE_MANAGER", "TEAM_MEMBER", "CLIENT_MANAGER", "CLIENT_USER"]);
  for (const binding of p12a.plannedBindings) {
    const state = expectedByWorkspace.get(binding.workspaceId);
    if (!state) missingExpectedState.push({ tenantId: binding.tenantId, workspaceId: binding.workspaceId, reason: "EXPECTED_WORKSPACE_STATE_MISSING" });
    else if (state.tenantId !== binding.tenantId) conflicts.push({ tenantId: binding.tenantId, workspaceId: binding.workspaceId, expectedTenantId: state.tenantId, reason: "WORKSPACE_TENANT_CONFLICT" });
  }
  for (const item of expected) {
    if (!Array.isArray(item.memberships)) continue;
    for (const membership of item.memberships) {
      if (membership.workspaceId !== item.workspaceId) crossWorkspaceAccess.push({ workspaceId: item.workspaceId, membershipWorkspaceId: membership.workspaceId ?? null, reason: "CROSS_WORKSPACE_MEMBERSHIP" });
      if (!membership.userId || membership.status !== "ACTIVE") missingMembership.push({ workspaceId: item.workspaceId, userId: membership.userId ?? null, reason: "ACTIVE_MEMBERSHIP_REQUIRED" });
      for (const role of membership.roleKeys ?? []) if (!allowedRoles.has(role)) invalidRoles.push({ workspaceId: item.workspaceId, role, reason: "UNSUPPORTED_WORKSPACE_ROLE" });
    }
  }
  const exceptions = { ...p12a.exceptions, missingExpectedState: sort(missingExpectedState, "workspaceId"), conflicts: sort(conflicts, "workspaceId"), crossWorkspaceAccess: sort(crossWorkspaceAccess, "workspaceId"), missingMembership: sort(missingMembership, "workspaceId"), invalidRoles: sort(invalidRoles, "workspaceId") };
  const blockers = Object.values(exceptions).reduce((sum, values) => sum + values.length, 0);
  return { reportVersion: P1_3A_REPORT_VERSION, mode: "PREPARATION_ONLY", dataMutation: false, reconciliationExecuted: false, workspaceAuthorityActivated: false, featureFlags: P1_3A_FEATURE_FLAGS, status: blockers ? "PREPARATION_BLOCKED" : "PREPARATION_READY", p12a, expectedWorkspaceState: sort(expected, "workspaceId"), exceptions, counts: { blockers, reconciliationCandidates: p12a.plannedBindings.length }, rollbackPlan: P1_3A_ROLLBACK_PLAN };
}
export function formatP13aSummary(report) { return `P1.3A PREPARATION ONLY / NO DATA MUTATION\nstatus=${report.status}; candidates=${report.counts.reconciliationCandidates}; blockers=${report.counts.blockers}; flags=OFF`; }
export async function runP13aCli(args, io = { readFile, stdout: process.stdout, stderr: process.stderr }) {
  if (args.some((arg) => EXECUTION.test(arg))) { io.stderr.write("P1.3A PREPARATION ONLY / execution flags are forbidden\n"); return 64; }
  const snapshotIndex = args.indexOf("--snapshot"); const format = args.includes("--format") ? args[args.indexOf("--format") + 1] : "summary";
  if (snapshotIndex < 0 || !args[snapshotIndex + 1] || !["json", "summary"].includes(format)) { io.stderr.write("Usage: --snapshot <sanitized.json> [--format json|summary]\n"); return 64; }
  try { const report = createP13aPreparationReport(JSON.parse(await io.readFile(path.resolve(args[snapshotIndex + 1]), "utf8"))); io.stdout.write(`${format === "json" ? JSON.stringify(report, null, 2) : formatP13aSummary(report)}\n`); return report.status === "PREPARATION_READY" ? 0 : 2; } catch (error) { io.stderr.write(`P1.3A PREPARATION ONLY / ${error.message}\n`); return 65; }
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) process.exitCode = await runP13aCli(process.argv.slice(2));
