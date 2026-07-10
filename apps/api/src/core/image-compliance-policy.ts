/**
 * Image compliance policy helpers for medical-aesthetic image workflows.
 *
 * Pure local logic only: no provider calls, no HTTP, no storage, no DB writes.
 * These helpers screen prompt/output concepts, define prompt profile metadata,
 * validate structured rejection reasons, and map approval-loop actions to
 * internal events before any future live image provider proof is considered.
 */

import type { ImageGenerationVariantSlot } from "./image-generation.execution";

export const IMAGE_COMPLIANCE_POLICY_VERSION = "IMAGE_COMPLIANCE_POLICY_V1";

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
      /\b(before\s*\/?\s*after|before[-\s]?and[-\s]?after|split[-\s]?screen|transformation|result timeline|measurement comparison|after treatment)\b/i
  },
  {
    code: "fake_clinician_or_patient_risk",
    matchedRule: "no_fake_doctors_patients_or_testimonials",
    pattern:
      /\b(fake\s+doctor|doctor in|doctor with|nurse in|clinician in|patient testimonial|patient review|happy patient|named patient|lab coat|medical badge)\b/i
  },
  {
    code: "procedure_or_device_risk",
    matchedRule: "no_procedure_or_clinical_staging",
    pattern: /\b(injection|injecting|syringe|needle|laser procedure|surgical|operation|clinical procedure|treatment chair)\b/i
  },
  {
    code: "treatment_result_risk",
    matchedRule: "no_treatment_result_or_outcome_claim",
    pattern:
      /\b(clearer skin after|after treatment|guaranteed improvement|visible results?|weight[-\s]?loss result|pain reduction|recovery claim|body change|cure|healed)\b/i
  },
  {
    code: "likeness_consent_risk",
    matchedRule: "no_real_person_likeness_without_consent",
    pattern: /\b(celebrity|public figure|real patient|staff member likeness|client likeness|without consent)\b/i
  },
  {
    code: "unsafe_prescription_or_device_risk",
    matchedRule: "no_unsafe_prescription_or_device_implication",
    pattern: /\b(prescription access|dosage|self-administer|unsupervised use|device efficacy|medical device result)\b/i
  }
];

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

  return {
    version: IMAGE_COMPLIANCE_POLICY_VERSION,
    stage: input.stage,
    allowed: findings.length === 0,
    findings,
    checks: findings.length > 0 ? findings.map((finding) => `REJECT:${finding.code}`) : ["ALLOW:neutral_wellness_context"]
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
        "abstract skin-health or self-care composition"
      ]
    },
    forbidden: [
      "before_after_risk",
      "fake_clinician_or_patient_risk",
      "procedure_or_device_risk",
      "treatment_result_risk",
      "likeness_consent_risk",
      "unsafe_prescription_or_device_risk"
    ],
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

export type ImageRejectReasonValidationInput = {
  reasonCode?: ImageComplianceRejectCode | null;
  note?: string | null;
  submittedBy: "admin" | "client";
};

export type ValidatedImageRejectReason = {
  reasonCode: ImageComplianceRejectCode;
  label: string;
  note: string | null;
  submittedBy: "admin" | "client";
};

export type ImageRejectReasonValidation =
  | { ok: true; reason: ValidatedImageRejectReason }
  | { ok: false; error: string };

export function validateMandatoryImageRejectReason(
  input: ImageRejectReasonValidationInput
): ImageRejectReasonValidation {
  if (!input.reasonCode) {
    return { ok: false, error: "Structured image reject reason is required." };
  }

  if (!IMAGE_COMPLIANCE_REJECT_CODES.includes(input.reasonCode)) {
    return { ok: false, error: `Unknown image reject reason "${input.reasonCode}".` };
  }

  const note = input.note?.trim() || null;
  if (input.reasonCode === "other" && !note) {
    return { ok: false, error: "Free-text note is required when image reject reason is other." };
  }

  return {
    ok: true,
    reason: {
      reasonCode: input.reasonCode,
      label: IMAGE_COMPLIANCE_REJECT_LABEL[input.reasonCode],
      note,
      submittedBy: input.submittedBy
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
