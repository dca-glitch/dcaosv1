import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildImagePromptProfile,
  evaluateImageCompliancePolicy,
  getImageApprovalLoopEvent,
  IMAGE_APPROVAL_LOOP_ACTIONS,
  IMAGE_COMPLIANCE_ALLOWED_DIRECTION_EXAMPLES,
  IMAGE_COMPLIANCE_REJECT_CODES,
  validateMandatoryImageRejectReason
} from "./image-compliance-policy";

describe("image-compliance-policy", () => {
  it("G189 rejects before/after concepts before generation", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Create a split-screen before and after treatment showing side-by-side comparison."
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.findings.some((finding) => finding.code === "before_after_risk"));
    assert.ok(decision.checks.includes("REJECT:before_after_risk"));
  });

  it("G189 rejects body transformation framing", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Show a dramatic body transformation photo after the program."
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.findings.some((f) => f.code === "before_after_risk"));
    assert.ok(decision.findings.some((f) => f.matchedRule === "no_body_transformation_framing"));
  });

  it("G189 rejects syringes and procedure staging", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Close-up of a syringe and needle preparing an injection in a treatment chair."
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.findings.some((f) => f.code === "procedure_or_device_risk"));
  });

  it("G189 rejects fake doctor imagery", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Show a fake doctor in a lab coat with a medical badge."
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.findings.some((f) => f.code === "fake_clinician_or_patient_risk"));
  });

  it("G189 rejects fake patient / testimonial imagery", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Include a happy patient testimonial and satisfied patient endorsement."
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.findings.some((f) => f.code === "fake_clinician_or_patient_risk"));
    assert.ok(decision.findings.some((f) => f.matchedRule === "no_fake_patients_or_testimonials"));
  });

  it("G189 rejects guaranteed results language", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "post_generation_output",
      text: "Marketing frame promising guaranteed results and instant results after the service."
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.findings.some((f) => f.code === "treatment_result_risk"));
  });

  it("G189 allows neutral wellness imagery", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Premium abstract wellness composition with soft skincare textures and a calm editorial mood."
    });

    assert.equal(decision.allowed, true);
    assert.deepEqual(decision.findings, []);
    assert.deepEqual(decision.checks, ["ALLOW:neutral_wellness_context"]);
  });

  it("G189 allows clinic ambience without procedure", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: IMAGE_COMPLIANCE_ALLOWED_DIRECTION_EXAMPLES[1]
    });

    assert.equal(decision.allowed, true);
    assert.deepEqual(decision.findings, []);
  });

  it("G189 allows product-neutral lifestyle", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: IMAGE_COMPLIANCE_ALLOWED_DIRECTION_EXAMPLES[2]
    });

    assert.equal(decision.allowed, true);
    assert.deepEqual(decision.findings, []);
  });

  it("defines slot prompt profiles with Puriva aesthetic, forbidden policy, and alt requirements", () => {
    const hero = buildImagePromptProfile("hero");
    const supporting = buildImagePromptProfile("supporting_1");
    const social = buildImagePromptProfile("social_preview");

    assert.equal(hero.kind, "hero");
    assert.equal(supporting.kind, "supporting");
    assert.equal(social.kind, "social");
    assert.equal(hero.purivaAesthetic.tone, "calm_editorial_wellness");
    assert.ok(hero.forbidden.includes("before_after_risk"));
    assert.ok(hero.forbidden.includes("fake_clinician_or_patient_risk"));
    assert.equal(hero.altRequirements.required, true);
    assert.ok(hero.altRequirements.forbiddenContent.includes("provider or model names"));
    assert.ok(hero.purivaAesthetic.visualDirection.includes("product-neutral lifestyle context"));
  });

  it("G192 requires structured reject reason for admin reject, client reject, and replacement", () => {
    assert.equal(validateMandatoryImageRejectReason({ submittedBy: "admin" }).ok, false);

    const adminReject = validateMandatoryImageRejectReason({
      reasonCode: "low_quality",
      submittedBy: "admin",
      context: "admin_reject"
    });
    assert.equal(adminReject.ok, true);
    if (adminReject.ok) {
      assert.equal(adminReject.reason.context, "admin_reject");
    }

    const clientReject = validateMandatoryImageRejectReason({
      reasonCode: "brand_mismatch",
      note: "  Feels off-brand for Puriva  ",
      submittedBy: "client",
      context: "client_reject"
    });
    assert.equal(clientReject.ok, true);
    if (clientReject.ok) {
      assert.equal(clientReject.reason.context, "client_reject");
      assert.equal(clientReject.reason.note, "Feels off-brand for Puriva");
    }

    const replacement = validateMandatoryImageRejectReason({
      reasonCode: "wrong_slot",
      submittedBy: "admin",
      context: "replacement_generation"
    });
    assert.equal(replacement.ok, true);
    if (replacement.ok) {
      assert.equal(replacement.reason.context, "replacement_generation");
    }

    const replacementByClient = validateMandatoryImageRejectReason({
      reasonCode: "wrong_slot",
      submittedBy: "client",
      context: "replacement_generation"
    });
    assert.equal(replacementByClient.ok, false);

    const invalid = validateMandatoryImageRejectReason({
      reasonCode: "unsupported_reason" as (typeof IMAGE_COMPLIANCE_REJECT_CODES)[number],
      submittedBy: "admin"
    });
    assert.equal(invalid.ok, false);

    const otherWithoutNote = validateMandatoryImageRejectReason({
      reasonCode: "other",
      submittedBy: "client"
    });
    assert.equal(otherWithoutNote.ok, false);
  });

  it("maps approval-loop actions to pure events", () => {
    assert.deepEqual(IMAGE_APPROVAL_LOOP_ACTIONS, [
      "admin_reject",
      "admin_approve",
      "client_reject",
      "client_approve",
      "replacement_requested",
      "replacement_ready"
    ]);

    assert.deepEqual(getImageApprovalLoopEvent("admin_reject"), {
      action: "admin_reject",
      eventType: "image.admin_rejected",
      nextStatus: "admin_rejected",
      requiresRejectReason: true,
      notify: ["admin"]
    });

    assert.deepEqual(getImageApprovalLoopEvent("client_reject"), {
      action: "client_reject",
      eventType: "image.client_rejected",
      nextStatus: "client_rejected",
      requiresRejectReason: true,
      notify: ["admin"]
    });

    assert.equal(getImageApprovalLoopEvent("admin_approve").requiresRejectReason, false);
    assert.equal(getImageApprovalLoopEvent("replacement_ready").nextStatus, "admin_review_ready");
  });
});
