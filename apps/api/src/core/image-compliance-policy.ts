/**
 * Image compliance policy helpers for medical-aesthetic image workflows.
 *
 * Pure local logic only: no provider calls, no HTTP, no storage, no DB writes.
 * These helpers screen prompt/output concepts, define prompt profile metadata,
 * validate structured rejection reasons, and map approval-loop actions to
 * internal events before any future live image provider proof is considered.
 *
 * G189 / G309–G311 / G553–G554 hardening covers: before/after, syringes/procedure,
 * fake doctor, fake patient, body transformation, guaranteed results, clinical
 * staging, filler/Botox result framing, and likeness risks — while allowing
 * neutral wellness, clinic ambience without procedure, and product-neutral lifestyle.
 */

import type { ImageGenerationVariantSlot } from "./image-generation.execution";

export const IMAGE_COMPLIANCE_POLICY_VERSION = "IMAGE_COMPLIANCE_POLICY_V4";

export const IMAGE_COMPLIANCE_REJECT_CODES = [
  "before_after_risk",
  "fake_clinician_or_patient_risk",
  "procedure_or_device_risk",
  "treatment_result_risk",
  "likeness_consent_risk",
  "unsafe_prescription_or_device_risk",
  "alt_text_issue",
  "brand_mismatch",
  "low_quality",
  "wrong_slot",
  "other"
] as const;

export type ImageComplianceRejectCode = (typeof IMAGE_COMPLIANCE_REJECT_CODES)[number];

export const IMAGE_COMPLIANCE_REJECT_LABEL: Record<ImageComplianceRejectCode, string> = {
  before_after_risk: "Before/after or transformation imagery",
  fake_clinician_or_patient_risk: "Fake clinician, patient, or testimonial",
  procedure_or_device_risk: "Procedure, device, or clinical staging",
  treatment_result_risk: "Treatment-result or outcome claim",
  likeness_consent_risk: "Real-person likeness without documented consent",
  unsafe_prescription_or_device_risk: "Unsafe prescription or medical-device implication",
  alt_text_issue: "Alt text issue",
  brand_mismatch: "Brand mismatch",
  low_quality: "Low quality",
  wrong_slot: "Wrong slot",
  other: "Other"
};

/** Hard-block reject codes used by prompt/output screening (excludes operational codes). */
export const IMAGE_COMPLIANCE_HARD_BLOCK_CODES: ImageComplianceRejectCode[] = [
  "before_after_risk",
  "fake_clinician_or_patient_risk",
  "procedure_or_device_risk",
  "treatment_result_risk",
  "likeness_consent_risk",
  "unsafe_prescription_or_device_risk"
];

export type ImageComplianceReviewStage = "pre_generation_prompt" | "post_generation_output";

export type ImageComplianceReviewInput = {
  text: string;
  stage: ImageComplianceReviewStage;
};

export type ImageComplianceFinding = {
  code: ImageComplianceRejectCode;
  label: string;
  severity: "block";
  matchedRule: string;
};

export type ImageCompliancePolicyDecision = {
  version: typeof IMAGE_COMPLIANCE_POLICY_VERSION;
  stage: ImageComplianceReviewStage;
  allowed: boolean;
  findings: ImageComplianceFinding[];
  checks: string[];
};

const POLICY_RULES: Array<{
  code: ImageComplianceRejectCode;
  matchedRule: string;
  pattern: RegExp;
}> = [
  {
    code: "before_after_risk",
    matchedRule: "no_before_after_or_transformation_framing",
    pattern:
      /\b(before\s*\/?\s*after|before[-\s]?and[-\s]?after|split[-\s]?screen|result timeline|measurement comparison|after treatment|side[-\s]?by[-\s]?side comparison|progress\s+photos?|then\s+vs\s+now|day\s*0\s+vs\s+day\s*\d+)\b/i
  },
  {
    code: "before_after_risk",
    matchedRule: "no_body_transformation_framing",
    pattern:
      /\b(body\s+transformation|dramatic\s+transformation|glow[-\s]?up|makeover\s+result|transformation\s+(?:shot|photo|image|visual|timeline)|slimmed\s+down\s+result|contouring\s+result)\b/i
  },
  {
    code: "fake_clinician_or_patient_risk",
    matchedRule: "no_fake_doctors_or_clinicians",
    pattern:
      /\b(fake\s+doctor|doctor in|doctor with|nurse in|clinician in|lab coat|medical badge|white coat doctor|posed\s+doctor|stock\s+doctor|actor\s+as\s+doctor|impersonat(?:e|ing)\s+(?:a\s+)?(?:doctor|nurse|clinician))\b/i
  },
  {
    code: "fake_clinician_or_patient_risk",
    matchedRule: "no_fake_patients_or_testimonials",
    pattern:
      /\b(fake\s+patient|patient testimonial|patient review|happy patient|named patient|satisfied patient|patient endorsement|real patient story|5[-\s]?star patient|patient success story)\b/i
  },
  {
    code: "procedure_or_device_risk",
    matchedRule: "no_syringe_or_procedure_staging",
    pattern:
      /\b(injection|injecting|syringe|needle|cannula|laser procedure|surgical|operation|clinical procedure|treatment chair|procedure room staging|iv drip|scalpel|operating\s+theatre|sterile\s+field|clinical\s+staging|treatment\s+bay|procedure\s+bay)\b/i
  },
  {
    code: "treatment_result_risk",
    matchedRule: "no_guaranteed_or_outcome_claim",
    pattern:
      /\b(guaranteed\s+results?|guaranteed\s+improvement|clearer skin after|visible results?|weight[-\s]?loss result|pain reduction|recovery claim|body change|cure|healed|proven results?|instant results?|wrinkle[-\s]?free\s+result|fat\s+melting\s+result|clinically\s+proven\s+result|botox\s+result|filler\s+result|lip\s+filler\s+(?:result|comparison)|weight[-\s]?loss\s+journey\s+photos?)\b/i
  },
  {
    code: "likeness_consent_risk",
    matchedRule: "no_real_person_likeness_without_consent",
    pattern:
      /\b(celebrity|public figure|real patient|staff member likeness|client likeness|without consent|lookalike\s+of|deepfake|face\s+swap)\b/i
  },
  {
    code: "unsafe_prescription_or_device_risk",
    matchedRule: "no_unsafe_prescription_or_device_implication",
    pattern:
      /\b(prescription access|dosage|self-administer|unsupervised use|device efficacy|medical device result|buy\s+wegovy\s+online|compounded\s+semaglutide\s+kit|at[-\s]?home\s+injection\s+kit)\b/i
  }
];

/** Phrases that should remain allowed when no hard-exclusion rule matches. */
export const IMAGE_COMPLIANCE_ALLOWED_DIRECTION_EXAMPLES = [
  "neutral wellness composition with soft skincare textures",
  "calm clinic ambience without procedure staging",
  "product-neutral lifestyle self-care moment",
  "abstract botanical wellness still life with soft daylight",
  "editorial linen textures and calm spa-adjacent interior detail",
  "gentle morning self-care ritual without treatment claims",
  "soft daylight on ceramic skincare vessels without brand claims",
  "quiet waiting-lounge architecture detail with natural materials"
] as const;

export type ImageCompliancePolicySnapshot = {
  version: typeof IMAGE_COMPLIANCE_POLICY_VERSION;
  hardBlockCodes: ImageComplianceRejectCode[];
  rejectCodes: readonly ImageComplianceRejectCode[];
  matchedRules: string[];
  allowedDirectionExamples: readonly string[];
  liveProviderCallsAllowed: false;
};

/**
 * G311 — Stable policy snapshot for docs/tests. Pure; no provider contact.
 */
export function buildImageCompliancePolicySnapshot(): ImageCompliancePolicySnapshot {
  return {
    version: IMAGE_COMPLIANCE_POLICY_VERSION,
    hardBlockCodes: [...IMAGE_COMPLIANCE_HARD_BLOCK_CODES],
    rejectCodes: IMAGE_COMPLIANCE_REJECT_CODES,
    matchedRules: POLICY_RULES.map((rule) => rule.matchedRule),
    allowedDirectionExamples: IMAGE_COMPLIANCE_ALLOWED_DIRECTION_EXAMPLES,
    liveProviderCallsAllowed: false
  };
}

export function evaluateImageCompliancePolicy(
  input: ImageComplianceReviewInput
): ImageCompliancePolicyDecision {
  const normalized = input.text.trim();
  const findings = POLICY_RULES.filter((rule) => rule.pattern.test(normalized)).map((rule) => ({
    code: rule.code,
    label: IMAGE_COMPLIANCE_REJECT_LABEL[rule.code],
    severity: "block" as const,
    matchedRule: rule.matchedRule
  }));

  // Deduplicate by code+matchedRule while preserving order
  const seen = new Set<string>();
  const uniqueFindings = findings.filter((finding) => {
    const key = `${finding.code}:${finding.matchedRule}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return {
    version: IMAGE_COMPLIANCE_POLICY_VERSION,
    stage: input.stage,
    allowed: uniqueFindings.length === 0,
    findings: uniqueFindings,
    checks:
      uniqueFindings.length > 0
        ? uniqueFindings.map((finding) => `REJECT:${finding.code}`)
        : ["ALLOW:neutral_wellness_context"]
  };
}

export type ImagePromptProfileKind = "hero" | "supporting" | "social";

export type ImagePromptProfile = {
  kind: ImagePromptProfileKind;
  slot: ImageGenerationVariantSlot;
  purivaAesthetic: {
    tone: "calm_editorial_wellness";
    visualDirection: string[];
  };
  forbidden: ImageComplianceRejectCode[];
  altRequirements: {
    required: true;
    mustDescribeApprovedAsset: true;
    forbiddenContent: string[];
  };
};

export function buildImagePromptProfile(slot: ImageGenerationVariantSlot): ImagePromptProfile {
  const kind: ImagePromptProfileKind = slot === "hero" ? "hero" : slot === "social_preview" ? "social" : "supporting";

  return {
    kind,
    slot,
    purivaAesthetic: {
      tone: "calm_editorial_wellness",
      visualDirection: [
        "neutral wellness context",
        "clinic-adjacent environment without identifiable clinicians or patients",
        "premium skincare editorial lighting",
        "abstract skin-health or self-care composition",
        "product-neutral lifestyle context",
        "clinic ambience without procedure staging"
      ]
    },
    forbidden: [...IMAGE_COMPLIANCE_HARD_BLOCK_CODES],
    altRequirements: {
      required: true,
      mustDescribeApprovedAsset: true,
      forbiddenContent: [
        "raw prompt text",
        "provider or model names",
        "medical claims",
        "unsupported treatment outcomes",
        "internal compliance taxonomy"
      ]
    }
  };
}

export type ImageRejectReasonContext = "admin_reject" | "client_reject" | "replacement_generation";

export type ImageRejectReasonValidationInput = {
  reasonCode?: ImageComplianceRejectCode | null;
  note?: string | null;
  submittedBy: "admin" | "client";
  /** G192: reject context — admin reject, client reject, or replacement generation. */
  context?: ImageRejectReasonContext;
};

export type ValidatedImageRejectReason = {
  reasonCode: ImageComplianceRejectCode;
  label: string;
  note: string | null;
  submittedBy: "admin" | "client";
  context: ImageRejectReasonContext;
};

export type ImageRejectReasonValidation =
  | { ok: true; reason: ValidatedImageRejectReason }
  | { ok: false; error: string };

function resolveRejectContext(input: ImageRejectReasonValidationInput): ImageRejectReasonContext {
  if (input.context) {
    return input.context;
  }
  return input.submittedBy === "client" ? "client_reject" : "admin_reject";
}

/**
 * G192 — Structured reject reason is mandatory for admin reject, client reject,
 * and replacement generation. `other` additionally requires a free-text note.
 */
export function validateMandatoryImageRejectReason(
  input: ImageRejectReasonValidationInput
): ImageRejectReasonValidation {
  const context = resolveRejectContext(input);

  if (!input.reasonCode) {
    return {
      ok: false,
      error: `Structured image reject reason is required for ${context.replace(/_/g, " ")}.`
    };
  }

  if (!IMAGE_COMPLIANCE_REJECT_CODES.includes(input.reasonCode)) {
    return { ok: false, error: `Unknown image reject reason "${input.reasonCode}".` };
  }

  const note = input.note?.trim() || null;
  if (input.reasonCode === "other" && !note) {
    return { ok: false, error: "Free-text note is required when image reject reason is other." };
  }

  if (context === "replacement_generation" && input.submittedBy !== "admin") {
    return {
      ok: false,
      error: "Replacement generation reject reason must be submitted by admin."
    };
  }

  return {
    ok: true,
    reason: {
      reasonCode: input.reasonCode,
      label: IMAGE_COMPLIANCE_REJECT_LABEL[input.reasonCode],
      note,
      submittedBy: input.submittedBy,
      context
    }
  };
}

export const IMAGE_APPROVAL_LOOP_ACTIONS = [
  "admin_reject",
  "admin_approve",
  "client_reject",
  "client_approve",
  "replacement_requested",
  "replacement_ready"
] as const;

export type ImageApprovalLoopAction = (typeof IMAGE_APPROVAL_LOOP_ACTIONS)[number];

export type ImageApprovalLoopEvent = {
  action: ImageApprovalLoopAction;
  eventType:
    | "image.admin_rejected"
    | "image.admin_approved"
    | "image.client_rejected"
    | "image.client_approved"
    | "image.replacement_requested"
    | "image.replacement_ready";
  nextStatus:
    | "admin_rejected"
    | "client_review_ready"
    | "client_rejected"
    | "approved"
    | "replacement_queued"
    | "admin_review_ready";
  requiresRejectReason: boolean;
  notify: Array<"admin" | "client">;
};

export const IMAGE_APPROVAL_LOOP_EVENT_MAP: Record<ImageApprovalLoopAction, ImageApprovalLoopEvent> = {
  admin_reject: {
    action: "admin_reject",
    eventType: "image.admin_rejected",
    nextStatus: "admin_rejected",
    requiresRejectReason: true,
    notify: ["admin"]
  },
  admin_approve: {
    action: "admin_approve",
    eventType: "image.admin_approved",
    nextStatus: "client_review_ready",
    requiresRejectReason: false,
    notify: ["client"]
  },
  client_reject: {
    action: "client_reject",
    eventType: "image.client_rejected",
    nextStatus: "client_rejected",
    requiresRejectReason: true,
    notify: ["admin"]
  },
  client_approve: {
    action: "client_approve",
    eventType: "image.client_approved",
    nextStatus: "approved",
    requiresRejectReason: false,
    notify: ["admin"]
  },
  replacement_requested: {
    action: "replacement_requested",
    eventType: "image.replacement_requested",
    nextStatus: "replacement_queued",
    requiresRejectReason: true,
    notify: ["admin"]
  },
  replacement_ready: {
    action: "replacement_ready",
    eventType: "image.replacement_ready",
    nextStatus: "admin_review_ready",
    requiresRejectReason: false,
    notify: ["admin"]
  }
};

export function getImageApprovalLoopEvent(action: ImageApprovalLoopAction): ImageApprovalLoopEvent {
  return IMAGE_APPROVAL_LOOP_EVENT_MAP[action];
}

export type ImageConceptComplianceBundleInput = {
  promptText: string;
  altText?: string | null;
  outputReviewText?: string | null;
};

export type ImageConceptComplianceBundle = {
  version: typeof IMAGE_COMPLIANCE_POLICY_VERSION;
  allowed: boolean;
  prompt: ImageCompliancePolicyDecision;
  altTextScreen: ImageCompliancePolicyDecision | null;
  output: ImageCompliancePolicyDecision | null;
  checks: string[];
};

/**
 * G553 — Screens prompt (+ optional alt / post-output text) as one concept bundle.
 * Pure; never contacts a provider.
 */
export function evaluateImageConceptComplianceBundle(
  input: ImageConceptComplianceBundleInput
): ImageConceptComplianceBundle {
  const prompt = evaluateImageCompliancePolicy({
    stage: "pre_generation_prompt",
    text: input.promptText
  });
  const altTrimmed = input.altText?.trim() ?? "";
  const altTextScreen = altTrimmed
    ? evaluateImageCompliancePolicy({
        stage: "pre_generation_prompt",
        text: altTrimmed
      })
    : null;
  const outputTrimmed = input.outputReviewText?.trim() ?? "";
  const output = outputTrimmed
    ? evaluateImageCompliancePolicy({
        stage: "post_generation_output",
        text: outputTrimmed
      })
    : null;

  const allowed =
    prompt.allowed && (altTextScreen?.allowed ?? true) && (output?.allowed ?? true);
  const checks = [
    ...prompt.checks.map((check) => `PROMPT:${check}`),
    ...(altTextScreen?.checks.map((check) => `ALT:${check}`) ?? ["ALT:SKIPPED:not_provided"]),
    ...(output?.checks.map((check) => `OUTPUT:${check}`) ?? ["OUTPUT:SKIPPED:not_provided"])
  ];

  return {
    version: IMAGE_COMPLIANCE_POLICY_VERSION,
    allowed,
    prompt,
    altTextScreen,
    output,
    checks: allowed ? [...checks, "ALLOW:concept_bundle"] : checks
  };
}

/**
 * G557 — Ties approval-loop reject transitions to mandatory structured reject reasons.
 */
export function requireImageRejectReasonForApprovalAction(
  action: ImageApprovalLoopAction,
  input: ImageRejectReasonValidationInput
): ImageRejectReasonValidation {
  const event = getImageApprovalLoopEvent(action);
  if (!event.requiresRejectReason) {
    return {
      ok: false,
      error: `Action "${action}" does not require a reject reason.`
    };
  }

  const context: ImageRejectReasonContext =
    input.context ??
    (action === "replacement_requested"
      ? "replacement_generation"
      : action === "client_reject"
        ? "client_reject"
        : "admin_reject");

  return validateMandatoryImageRejectReason({
    ...input,
    context
  });
}
