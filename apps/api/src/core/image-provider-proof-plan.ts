/**
 * Image provider proof plan — typed plan only (G196).
 *
 * Documents the bounded proof sequence: provider selection, no-live preflight,
 * one live generation later, compliance review, reject/cleanup.
 * No live provider call is made by this module.
 */

export const IMAGE_PROVIDER_PROOF_PLAN_VERSION = "IMAGE_PROVIDER_PROOF_PLAN_V2";

export const IMAGE_PROVIDER_PROOF_PHASES = [
  "provider_selection",
  "no_live_preflight",
  "one_live_generation_later",
  "compliance_review",
  "reject_and_cleanup"
] as const;

export type ImageProviderProofPhase = (typeof IMAGE_PROVIDER_PROOF_PHASES)[number];

export type ImageProviderProofPhaseStatus =
  | "planned"
  | "ready_for_owner_approval"
  | "blocked_pending_owner_approval"
  | "explicitly_out_of_scope_this_block";

export type ImageProviderProofPhasePlan = {
  phase: ImageProviderProofPhase;
  status: ImageProviderProofPhaseStatus;
  liveProviderCallAllowed: false | "owner_approved_staging_only";
  objectives: string[];
  stopConditions: string[];
};

export type ImageProviderProofPlan = {
  version: typeof IMAGE_PROVIDER_PROOF_PLAN_VERSION;
  liveProviderCallsInThisBlock: false;
  primaryProviderDirection: "adobe_firefly";
  providerDecisionStatus: "pending_owner_approval";
  phases: ImageProviderProofPhasePlan[];
  evidenceLocation: "$env:TEMP";
  relatedRunbook: "docs/runbooks/IMAGE_GENERATION_PROOF.md";
};

/**
 * Returns the typed, no-live provider proof plan for G196.
 * Pure constant builder — never contacts a provider.
 */
export function buildImageProviderProofPlan(): ImageProviderProofPlan {
  return {
    version: IMAGE_PROVIDER_PROOF_PLAN_VERSION,
    liveProviderCallsInThisBlock: false,
    primaryProviderDirection: "adobe_firefly",
    providerDecisionStatus: "pending_owner_approval",
    evidenceLocation: "$env:TEMP",
    relatedRunbook: "docs/runbooks/IMAGE_GENERATION_PROOF.md",
    phases: [
      {
        phase: "provider_selection",
        status: "blocked_pending_owner_approval",
        liveProviderCallAllowed: false,
        objectives: [
          "Record primary + fallback provider in AI_MODEL_POLICY.md after owner approval",
          "Confirm cost caps and medical-aesthetic safety policy are loaded",
          "Keep Adobe Firefly as approved direction until owner locks exact pair"
        ],
        stopConditions: [
          "Do not wire a live SDK client before owner approval",
          "Do not claim provider readiness from config shape alone"
        ]
      },
      {
        phase: "no_live_preflight",
        status: "ready_for_owner_approval",
        liveProviderCallAllowed: false,
        objectives: [
          "Exercise disabled / missing_config / configured_shape_ok readiness only",
          "Confirm no HTTP, no SDK call, no credential validation against vendor",
          "Confirm reject taxonomy + compliance policy helpers are present"
        ],
        stopConditions: [
          "Preflight must never report verified_live",
          "Preflight must not generate an image"
        ]
      },
      {
        phase: "one_live_generation_later",
        status: "explicitly_out_of_scope_this_block",
        liveProviderCallAllowed: "owner_approved_staging_only",
        objectives: [
          "One bounded generation per hero / supporting / social slot on staging only",
          "Finite attempt cap; no automatic retry loop",
          "Evidence log to $env:TEMP with no secrets"
        ],
        stopConditions: [
          "No production or public WordPress surface",
          "No live call without a separate owner-approved Phase D block"
        ]
      },
      {
        phase: "compliance_review",
        status: "planned",
        liveProviderCallAllowed: false,
        objectives: [
          "Human review against before/after, fake clinician/patient, procedure, guaranteed-results rules",
          "Alt text reviewed separately under alt-text policy",
          "Record structured reject reasons for any failure"
        ],
        stopConditions: [
          "Do not advance non-compliant assets to client review",
          "Do not attach non-final_accepted assets to WordPress"
        ]
      },
      {
        phase: "reject_and_cleanup",
        status: "planned",
        liveProviderCallAllowed: false,
        objectives: [
          "Reject requires structured reason (admin/client/replacement)",
          "Regenerate rejected slots only with lineage preserved",
          "Cleanup: no orphan storageKey; provider URLs never client-exposed"
        ],
        stopConditions: [
          "Do not persist storageKey when R2 is disabled",
          "Do not expose raw prompt or provider metadata to clients"
        ]
      }
    ]
  };
}

export function summarizeImageProviderProofPlan(
  plan: ImageProviderProofPlan = buildImageProviderProofPlan()
): string {
  const phaseSummary = plan.phases.map((phase) => `${phase.phase}:${phase.status}`).join(", ");
  return [
    `Image provider proof plan ${plan.version}`,
    `live_in_block=${plan.liveProviderCallsInThisBlock}`,
    `provider_decision=${plan.providerDecisionStatus}`,
    `phases=[${phaseSummary}]`
  ].join(" · ");
}

export type ImageProviderProofNoLiveGuard = {
  version: typeof IMAGE_PROVIDER_PROOF_PLAN_VERSION;
  liveProviderCallsInThisBlock: false;
  livePhaseOutOfScope: true;
  nonLivePhasesForbidProviderCalls: true;
  primaryProviderDirection: ImageProviderProofPlan["primaryProviderDirection"];
  relatedRunbook: ImageProviderProofPlan["relatedRunbook"];
};

/**
 * G561 — Explicit no-live guard derived from the typed proof plan.
 */
export function buildImageProviderProofNoLiveGuard(
  plan: ImageProviderProofPlan = buildImageProviderProofPlan()
): ImageProviderProofNoLiveGuard {
  const livePhase = plan.phases.find((phase) => phase.phase === "one_live_generation_later");
  if (!livePhase || livePhase.status !== "explicitly_out_of_scope_this_block") {
    throw new Error("Image provider proof plan must keep live generation out of scope.");
  }
  for (const phase of plan.phases) {
    if (phase.phase === "one_live_generation_later") {
      continue;
    }
    if (phase.liveProviderCallAllowed !== false) {
      throw new Error(`Phase ${phase.phase} must forbid live provider calls.`);
    }
  }

  return {
    version: plan.version,
    liveProviderCallsInThisBlock: false,
    livePhaseOutOfScope: true,
    nonLivePhasesForbidProviderCalls: true,
    primaryProviderDirection: plan.primaryProviderDirection,
    relatedRunbook: plan.relatedRunbook
  };
}
