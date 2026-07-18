import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createP12aDryRunReport } from "./p1-2a-mapping-dry-run.mjs";
import { createP13aPreparationReport } from "./p1-3a-reconciliation-preparation.mjs";

export const P1_4A_REPORT_VERSION = "DCA_OS_V2_P1_4A_STAGING_REHEARSAL_GATE_PACKET_V1";
export const P1_4A_EXECUTION_FLAGS = Object.freeze(["--apply", "--approve", "--authorize", "--backfill", "--cleanup", "--execute", "--mutation", "--mutate", "--reconcile", "--reconciliation", "--switch", "--write"]);
const EVIDENCE_STATUSES = new Set(["PRESENT", "MISSING", "FAILED"]);
const SENSITIVE_KEY = /(credential|email|name|note|password|secret|storagekey|token|url|connection)/i;

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  return value;
}

export function sha256(value) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function assertSanitized(value) {
  if (Array.isArray(value)) return value.forEach(assertSanitized);
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) throw new Error(`Sensitive field "${key}" is forbidden in a P1.4a snapshot.`);
    assertSanitized(child);
  }
}

function assertEvidence(evidence, key) {
  const item = evidence?.[key];
  if (!item || typeof item !== "object" || !EVIDENCE_STATUSES.has(item.status) || typeof item.reference !== "string" || item.reference.length === 0) {
    throw new Error(`Evidence "${key}" requires status PRESENT|MISSING|FAILED and a sanitized reference.`);
  }
  return { id: key, status: item.status, reference: item.reference };
}

function assertIdentity(identity) {
  if (!identity || !/^[0-9a-f]{40}$/i.test(identity.commitSha) || !/^[0-9a-f]{64}$/i.test(identity.diffSha) || /^0{64}$/i.test(identity.diffSha)) {
    throw new Error("Identity requires a 40-character commitSha and non-zero 64-character diffSha.");
  }
  return { commitSha: identity.commitSha.toLowerCase(), diffSha: identity.diffSha.toLowerCase() };
}

export function getLocalExactIdentity() {
  const commitSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const diff = execFileSync("git", ["diff", "--binary", "HEAD"], { encoding: "buffer" });
  return assertIdentity({ commitSha, diffSha: createHash("sha256").update(diff).digest("hex") });
}

function executionFlag(argument) {
  return P1_4A_EXECUTION_FLAGS.some((flag) => argument === flag || argument.startsWith(`${flag}=`));
}

function optionValue(args, index, option) {
  const value = args[index + 1];
  if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) throw new Error(`${option} requires a non-flag value.`);
  return value;
}

export function parseP14aCliArgs(args) {
  const parsed = { snapshotPath: null, format: "summary" };
  let hasFormat = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (executionFlag(argument)) throw new Error(`Execution flag "${argument}" is forbidden: P1.4a is PREPARATION ONLY.`);
    if (argument === "--snapshot") {
      if (parsed.snapshotPath) throw new Error("--snapshot may be provided only once.");
      parsed.snapshotPath = optionValue(args, index, "--snapshot");
      index += 1;
    } else if (argument === "--format") {
      if (hasFormat) throw new Error("--format may be provided only once.");
      hasFormat = true;
      parsed.format = optionValue(args, index, "--format");
      index += 1;
    } else if (argument === "--help") return { help: true };
    else throw new Error(`Unsupported argument "${argument}".`);
  }
  if (!parsed.snapshotPath) throw new Error("--snapshot <sanitized-snapshot.json> is required.");
  if (!["json", "summary"].includes(parsed.format)) throw new Error("--format must be json or summary.");
  return parsed;
}

function gate(id, status, detail, category = "EVIDENCE") {
  return { id, category, status, detail };
}

export function createP14aExecutionGatePacket(input, identity = getLocalExactIdentity()) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("P1.4a input must be a JSON object.");
  assertSanitized(input);
  if (!input.snapshot || !input.evidence) throw new Error("P1.4a input requires snapshot and evidence.");
  const exactIdentity = assertIdentity(identity);
  const evidence = [assertEvidence(input.evidence, "approvedMapping"), assertEvidence(input.evidence, "backupRestore"), assertEvidence(input.evidence, "ciTests")];
  const p12a = createP12aDryRunReport(input.snapshot);
  const p13a = createP13aPreparationReport(input.snapshot);
  const approvedMapping = evidence.find((item) => item.id === "approvedMapping");
  const backupRestore = evidence.find((item) => item.id === "backupRestore");
  const ciTests = evidence.find((item) => item.id === "ciTests");
  const cleanP12a = p12a.status === "VALIDATION_PASSED";
  const cleanP13a = p13a.status === "PREPARATION_READY";
  const rehearsalPassed = cleanP12a && cleanP13a && approvedMapping.status === "PRESENT" && backupRestore.status === "PRESENT" && ciTests.status === "PRESENT";
  const gates = [
    gate("approved_mapping_evidence", approvedMapping.status, approvedMapping.reference),
    gate("p1_2a_dry_run", cleanP12a ? "PRESENT" : "FAILED", p12a.status),
    gate("p1_3a_comparison_isolation", cleanP13a ? "PRESENT" : "FAILED", p13a.status),
    gate("backup_restore_proof", backupRestore.status, backupRestore.reference),
    gate("rollback_plan", "PRESENT", p13a.rollbackPlan.execution),
    gate("staging_like_rehearsal", rehearsalPassed ? "PRESENT" : "FAILED", rehearsalPassed ? "LOCAL_SANITIZED_REHEARSAL_PASSED" : "LOCAL_SANITIZED_REHEARSAL_BLOCKED"),
    gate("exact_commit_diff_identity", "PRESENT", exactIdentity.commitSha),
    gate("ci_test_evidence", ciTests.status, ciTests.reference),
    gate("owner_acceptance", "OWNER_ACCEPTANCE_REQUIRED", "Future owner-critical decision required.", "OWNER_CRITICAL"),
    gate("execution_authorization", "EXECUTION_NOT_AUTHORIZED", "P1.4a cannot authorize or execute P1.2b-P1.4b.", "EXECUTION_FORBIDDEN")
  ];
  const missingEvidence = gates.filter((item) => item.category === "EVIDENCE" && item.status !== "PRESENT").map((item) => item.id);
  return {
    reportVersion: P1_4A_REPORT_VERSION,
    mode: "LOCAL_STAGING_LIKE_REHEARSAL_ONLY",
    inputManifest: { algorithm: "SHA-256", snapshotHash: sha256(input.snapshot), inputHash: sha256(input), identity: exactIdentity },
    safety: { dataMutation: false, backfillExecuted: false, reconciliationExecuted: false, workspaceAuthorityActivated: false, featureFlagsActivated: false, executionGateApproved: false, productionVpsTouched: false, remoteStagingTouched: false, tenantClientAuthority: "UNCHANGED" },
    rehearsal: { status: rehearsalPassed ? "LOCAL_REHEARSAL_PASSED" : "LOCAL_REHEARSAL_BLOCKED", p12a: { reportVersion: p12a.reportVersion, status: p12a.status, blockers: p12a.counts.blockers }, p13a: { reportVersion: p13a.reportVersion, status: p13a.status, blockers: p13a.counts.blockers, featureFlags: p13a.featureFlags } },
    gates,
    evidenceManifest: evidence,
    missingEvidence,
    ownerCriticalRequirements: ["owner_acceptance"],
    executionGate: { status: "EXECUTION_NOT_AUTHORIZED", ownerAcceptanceRequired: true, nextEligiblePackage: "P1.2b-P1.4b only after future owner-critical gate" },
    readiness: missingEvidence.length === 0 ? "PREPARATION_EVIDENCE_COMPLETE_EXECUTION_NOT_AUTHORIZED" : "PREPARATION_BLOCKED_EXECUTION_NOT_AUTHORIZED"
  };
}

export function formatP14aSummary(packet) {
  return `P1.4A LOCAL STAGING-LIKE REHEARSAL / EXECUTION NOT AUTHORIZED\nrehearsal=${packet.rehearsal.status}; missingEvidence=${packet.missingEvidence.length}; ownerAcceptance=REQUIRED; execution=FORBIDDEN`;
}

export async function runP14aCli(args, io = { readFile, stdout: process.stdout, stderr: process.stderr }) {
  let options;
  try { options = parseP14aCliArgs(args); } catch (error) { io.stderr.write(`P1.4A PREPARATION ONLY / ${error.message}\n`); return 64; }
  if (options.help) { io.stdout.write("Usage: node p1-4a-staging-rehearsal-gate-packet.mjs --snapshot <sanitized-snapshot.json> [--format json|summary]\n"); return 0; }
  try {
    const packet = createP14aExecutionGatePacket(JSON.parse(await io.readFile(path.resolve(options.snapshotPath), "utf8")), io.getLocalExactIdentity ? io.getLocalExactIdentity() : getLocalExactIdentity());
    io.stdout.write(`${options.format === "json" ? JSON.stringify(packet, null, 2) : formatP14aSummary(packet)}\n`);
    return packet.readiness.startsWith("PREPARATION_EVIDENCE_COMPLETE") ? 0 : 2;
  } catch (error) { io.stderr.write(`P1.4A PREPARATION ONLY / ${error.message}\n`); return 65; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) process.exitCode = await runP14aCli(process.argv.slice(2));
