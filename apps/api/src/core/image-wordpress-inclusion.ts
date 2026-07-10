/**
 * WordPress inclusion readiness policy (G195).
 *
 * Pure policy: only `final_accepted` images with hero / supporting / social
 * roles are ready for WordPress draft inclusion. No HTTP, no DB, no WP calls.
 */

import type { ImageApprovalLoopState } from "./image-approval-loop";

export const IMAGE_WORDPRESS_INCLUSION_VERSION = "IMAGE_WORDPRESS_INCLUSION_V2";

export const IMAGE_WORDPRESS_INCLUSION_ROLES = ["hero", "supporting", "social"] as const;

export type ImageWordpressInclusionRole = (typeof IMAGE_WORDPRESS_INCLUSION_ROLES)[number];

export type ImageWordpressInclusionInput = {
  approvalState: ImageApprovalLoopState;
  role: ImageWordpressInclusionRole;
  hasAltText: boolean;
  /** Optional: social role may require a dedicated social preview asset. */
  hasSocialPreviewAsset?: boolean;
};

export type ImageWordpressInclusionDecision = {
  version: typeof IMAGE_WORDPRESS_INCLUSION_VERSION;
  ready: boolean;
  role: ImageWordpressInclusionRole;
  approvalState: ImageApprovalLoopState;
  reasons: string[];
  checks: string[];
};

/**
 * Returns whether an image asset is ready for WordPress draft inclusion.
 * Only `final_accepted` + known roles + alt text (and social asset when role=social).
 */
export function evaluateImageWordpressInclusionReadiness(
  input: ImageWordpressInclusionInput
): ImageWordpressInclusionDecision {
  const reasons: string[] = [];
  const checks: string[] = [];

  if (!(IMAGE_WORDPRESS_INCLUSION_ROLES as readonly string[]).includes(input.role)) {
    reasons.push(`Unknown WordPress inclusion role "${String(input.role)}".`);
    checks.push("REJECT:unknown_role");
  }

  if (input.approvalState !== "final_accepted") {
    reasons.push(
      `WordPress inclusion requires final_accepted; current state is "${input.approvalState}".`
    );
    checks.push("REJECT:not_final_accepted");
  } else {
    checks.push("ALLOW:final_accepted");
  }

  if (!input.hasAltText) {
    reasons.push("Reviewed alt text is required before WordPress inclusion.");
    checks.push("REJECT:missing_alt_text");
  } else {
    checks.push("ALLOW:alt_text_present");
  }

  if (input.role === "social" && input.hasSocialPreviewAsset === false) {
    reasons.push("Social role requires a dedicated social preview asset.");
    checks.push("REJECT:missing_social_preview_asset");
  } else if (input.role === "social") {
    checks.push("ALLOW:social_preview_role");
  }

  if (input.role === "hero") {
    checks.push("ALLOW:hero_role");
  }
  if (input.role === "supporting") {
    checks.push("ALLOW:supporting_role");
  }

  const ready = reasons.length === 0;

  return {
    version: IMAGE_WORDPRESS_INCLUSION_VERSION,
    ready,
    role: input.role,
    approvalState: input.approvalState,
    reasons,
    checks: ready ? [...checks, "READY:wordpress_draft_inclusion"] : checks
  };
}

export function isWordpressInclusionRole(value: string): value is ImageWordpressInclusionRole {
  return (IMAGE_WORDPRESS_INCLUSION_ROLES as readonly string[]).includes(value);
}

export type ImageWordpressInclusionBundleInput = {
  approvalState: ImageApprovalLoopState;
  role: ImageWordpressInclusionRole;
  hasAltText: boolean;
  hasSocialPreviewAsset?: boolean;
  altTextAllowed?: boolean;
  complianceAllowed?: boolean;
};

/**
 * G560 — Combines WP role readiness with optional alt/compliance gates.
 * Still pure policy; does not call WordPress or Lane 7 serializers.
 */
export function evaluateImageWordpressInclusionBundle(
  input: ImageWordpressInclusionBundleInput
): ImageWordpressInclusionDecision {
  const base = evaluateImageWordpressInclusionReadiness({
    approvalState: input.approvalState,
    role: input.role,
    hasAltText: input.hasAltText,
    hasSocialPreviewAsset: input.hasSocialPreviewAsset
  });

  const reasons = [...base.reasons];
  const checks = [...base.checks];

  if (input.altTextAllowed === false) {
    reasons.push("Alt text policy must allow the reviewed alt text before WordPress inclusion.");
    checks.push("REJECT:alt_text_policy");
  } else if (input.altTextAllowed === true) {
    checks.push("ALLOW:alt_text_policy");
  }

  if (input.complianceAllowed === false) {
    reasons.push("Image compliance policy must allow the asset before WordPress inclusion.");
    checks.push("REJECT:compliance_policy");
  } else if (input.complianceAllowed === true) {
    checks.push("ALLOW:compliance_policy");
  }

  const ready = reasons.length === 0;
  return {
    version: IMAGE_WORDPRESS_INCLUSION_VERSION,
    ready,
    role: input.role,
    approvalState: input.approvalState,
    reasons,
    checks: ready
      ? [...checks.filter((c) => c !== "READY:wordpress_draft_inclusion"), "READY:wordpress_draft_inclusion"]
      : checks.filter((c) => c !== "READY:wordpress_draft_inclusion")
  };
}
