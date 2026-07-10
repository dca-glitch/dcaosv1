/**
 * G471 — R2 no-IO readiness invariant.
 * Aggregates config-shape / proof-stage / cleanup / target-plan invariants.
 * Never performs live R2 IO and never claims live bucket proof.
 */

import { getR2ConfigRedactedSummary, toR2ConfigRedactedSummarySnapshot } from "./r2.config";
import {
  getR2PartialConfigDiagnostics,
  toR2PartialConfigDiagnosticsSnapshot
} from "./r2-partial-config-diagnostics";
import {
  assertR2ProofNoIoOnlyLabelInvariant,
  claimsLiveBucketProof,
  R2_PROOF_STAGE_KEYS,
  toR2ProofStageSnapshot
} from "./r2-proof-stage";
import { assertR2CleanupProofPlanNoIoInvariant } from "./r2-cleanup-proof-plan";
import { assertR2TargetEnvironmentProofPlanNoIoInvariant } from "./r2-target-environment-proof-plan";

export type R2NoIoReadinessInvariantResult = {
  ok: boolean;
  liveIoPerformed: false;
  claimsLiveBucketProof: false;
  liveProven: false;
  proofStagesOk: boolean;
  cleanupPlanOk: boolean;
  targetPlanOk: boolean;
  redactedSummaryLiveProvenFalse: boolean;
  diagnosticsLiveProvenFalse: boolean;
  reason: string;
};

/**
 * Assert that current local readiness helpers remain no-IO / not live-proven.
 */
export function assertR2NoIoReadinessInvariant(): R2NoIoReadinessInvariantResult {
  const proofStagesOk = R2_PROOF_STAGE_KEYS.every((key) => {
    const labelOk = assertR2ProofNoIoOnlyLabelInvariant(key).ok;
    const noClaimWithoutIo = claimsLiveBucketProof(key, false) === false;
    return labelOk && noClaimWithoutIo;
  });
  const cleanupPlanOk = assertR2CleanupProofPlanNoIoInvariant().ok;
  const targetPlanOk = assertR2TargetEnvironmentProofPlanNoIoInvariant().ok;
  const redacted = getR2ConfigRedactedSummary();
  const diagnostics = getR2PartialConfigDiagnostics();
  const redactedSummaryLiveProvenFalse = redacted.liveProven === false;
  const diagnosticsLiveProvenFalse =
    diagnostics.liveProven === false && diagnostics.liveIoPerformed === false;

  const ok =
    proofStagesOk &&
    cleanupPlanOk &&
    targetPlanOk &&
    redactedSummaryLiveProvenFalse &&
    diagnosticsLiveProvenFalse;

  return {
    ok,
    liveIoPerformed: false,
    claimsLiveBucketProof: false,
    liveProven: false,
    proofStagesOk,
    cleanupPlanOk,
    targetPlanOk,
    redactedSummaryLiveProvenFalse,
    diagnosticsLiveProvenFalse,
    reason: ok
      ? "R2 readiness helpers are no-IO only; live bucket proof is not claimed."
      : "R2 no-IO readiness invariant violated."
  };
}

/**
 * Snapshot for tests — booleans and labels only; never secret values.
 */
export function toR2NoIoReadinessInvariantSnapshot(
  result: R2NoIoReadinessInvariantResult = assertR2NoIoReadinessInvariant()
): {
  ok: boolean;
  liveIoPerformed: false;
  claimsLiveBucketProof: false;
  liveProven: false;
  proofStageCount: number;
  proofStagesClaimLiveWithoutIo: false;
  redactedReadinessLabel: string;
  diagnosticsReadinessLabel: string;
  cleanupPlanOk: boolean;
  targetPlanOk: boolean;
} {
  const redactedSnap = toR2ConfigRedactedSummarySnapshot();
  const diagnosticsSnap = toR2PartialConfigDiagnosticsSnapshot();
  const stageSnap = toR2ProofStageSnapshot();

  return {
    ok: result.ok,
    liveIoPerformed: false,
    claimsLiveBucketProof: false,
    liveProven: false,
    proofStageCount: stageSnap.length,
    proofStagesClaimLiveWithoutIo: false,
    redactedReadinessLabel: redactedSnap.readinessLabel,
    diagnosticsReadinessLabel: diagnosticsSnap.readinessLabel,
    cleanupPlanOk: result.cleanupPlanOk,
    targetPlanOk: result.targetPlanOk
  };
}
