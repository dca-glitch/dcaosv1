/**
 * Admin-facing proof-state vocabulary helpers.
 * Labels describe evidence maturity only — they never imply staging/production readiness.
 */

export type ProofState =
  | "not_started"
  | "local_only"
  | "disabled_safe"
  | "config_shape_ok"
  | "owner_gated"
  | "staging_proven"
  | "production_proven"
  | "blocked";

export type IntegrationTruthTone = "neutral" | "local" | "warning" | "success" | "danger";

/** Local / Staging / Production truth-matrix chip keys (design-only until UI mounts). */
export type IntegrationTruthChip =
  | "not_proven"
  | "pass_local"
  | "pass_disabled_safe"
  | "pass_recorded"
  | "na";

const PROOF_STATE_LABELS: Record<ProofState, string> = {
  not_started: "Not started",
  local_only: "Local only",
  disabled_safe: "Disabled-safe",
  config_shape_ok: "Config shape OK",
  owner_gated: "Owner-gated",
  staging_proven: "Staging proven",
  production_proven: "Production proven",
  blocked: "Blocked"
};

const PROOF_STATE_TONES: Record<ProofState, IntegrationTruthTone> = {
  not_started: "neutral",
  local_only: "local",
  disabled_safe: "local",
  config_shape_ok: "local",
  owner_gated: "warning",
  staging_proven: "success",
  production_proven: "success",
  blocked: "danger"
};

const INTEGRATION_TRUTH_CHIP_LABELS: Record<IntegrationTruthChip, string> = {
  not_proven: "Not proven",
  pass_local: "PASS local",
  pass_disabled_safe: "PASS disabled-safe",
  pass_recorded: "PASS (recorded)",
  na: "N/A"
};

const INTEGRATION_TRUTH_CHIP_TONES: Record<IntegrationTruthChip, IntegrationTruthTone> = {
  not_proven: "warning",
  pass_local: "local",
  pass_disabled_safe: "local",
  pass_recorded: "success",
  na: "neutral"
};

/** Copy that must never appear as an unqualified live/production claim on admin surfaces. */
const LIVE_OVERCLAIM_PATTERNS: RegExp[] = [
  /\blive\s+synced\b/i,
  /\blive\s+ready\b/i,
  /\blaunch\s+ready\b/i,
  /\bproduction\s+ready\b/i,
  /\bstaging\s+proven\b/i,
  /\bfully\s+connected\b/i,
  /\blive\s+GA\/GSC\b/i,
  /\bpublish\s+enabled\b/i
];

/** If present, the phrase is treated as explicitly non-claiming (deferred / gated / recorded). */
const SAFE_QUALIFIER = /\b(deferred|not\s+proven|pending|disabled|owner-?gated|gated|recorded|opt-in\s+only|no\s+live\s+calls)\b/i;

const PROOF_STATE_SET = new Set<string>(Object.keys(PROOF_STATE_LABELS));

export function isProofState(value: string): value is ProofState {
  return PROOF_STATE_SET.has(value);
}

export function formatProofStateLabel(state: ProofState): string {
  return PROOF_STATE_LABELS[state];
}

export function proofStateTone(state: ProofState): IntegrationTruthTone {
  return PROOF_STATE_TONES[state];
}

export function formatIntegrationTruthChip(chip: IntegrationTruthChip): string {
  return INTEGRATION_TRUTH_CHIP_LABELS[chip];
}

export function integrationTruthChipTone(chip: IntegrationTruthChip): IntegrationTruthTone {
  return INTEGRATION_TRUTH_CHIP_TONES[chip];
}

/**
 * Returns true when copy appears to overclaim live/staging/production readiness.
 * Conservative: only flags known unsafe phrases; safe deferred wording passes.
 */
export function looksLikeLiveOverclaim(copy: string): boolean {
  const text = copy.trim();
  if (!text) return false;
  if (SAFE_QUALIFIER.test(text)) return false;
  return LIVE_OVERCLAIM_PATTERNS.some((pattern) => pattern.test(text));
}

export function safeAdminIntegrationHint(state: ProofState): string {
  switch (state) {
    case "not_started":
      return "No proof recorded. Do not treat as connected.";
    case "local_only":
      return "Local/admin evidence only. Staging and production remain unproven.";
    case "disabled_safe":
      return "Disabled-safe path verified locally. Live calls remain deferred.";
    case "config_shape_ok":
      return "Config shape validated. Does not imply live provider success.";
    case "owner_gated":
      return "Next step requires explicit owner approval before any live call.";
    case "staging_proven":
      return "Staging proof recorded. Production proof is separate.";
    case "production_proven":
      return "Production proof recorded for this integration row only.";
    case "blocked":
      return "Blocked. Do not claim readiness until the blocker clears.";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}
