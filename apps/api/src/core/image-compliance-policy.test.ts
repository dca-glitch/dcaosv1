import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildImagePromptProfile,
  evaluateImageCompliancePolicy,
  getImageApprovalLoopEvent,
  IMAGE_APPROVAL_LOOP_ACTIONS,
  IMAGE_COMPLIANCE_REJECT_CODES,
  validateMandatoryImageRejectReason
} from "./image-compliance-policy";

describe("image-compliance-policy", () => {
  it("rejects before/after concepts before generation", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Create a split-screen before and after treatment transformation showing visible results."
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.findings.some((finding) => finding.code === "before_after_risk"));
    assert.ok(decision.findings.some((finding) => finding.code === "treatment_result_risk"));
    assert.ok(decision.checks.includes("REJECT:before_after_risk"));
  });

  it("rejects fake doctors and patients before generation", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Show a doctor in a lab coat beside a happy patient testimonial."
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.findings.some((finding) => finding.code === "fake_clinician_or_patient_risk"));
  });

  it("rejects procedure and treatment-result output after generation", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "post_generation_output",
      text: "Output review: person on a treatment chair receiving an injection with clearer skin after treatment."
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.findings.some((finding) => finding.code === "procedure_or_device_risk"));
    assert.ok(decision.findings.some((finding) => finding.code === "treatment_result_risk"));
  });

  it("allows neutral wellness imagery", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Premium abstract wellness composition with soft skincare textures and a calm editorial clinic-adjacent mood."
    });

    assert.equal(decision.allowed, true);
    assert.deepEqual(decision.findings, []);
    assert.deepEqual(decision.checks, ["ALLOW:neutral_wellness_context"]);
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
  });

  it("requires a structured reject reason", () => {
    assert.equal(validateMandatoryImageRejectReason({ submittedBy: "admin" }).ok, false);

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

  it("returns sanitized validated reject reason metadata", () => {
    const result = validateMandatoryImageRejectReason({
      reasonCode: "brand_mismatch",
      note: "  Feels off-brand for Puriva  ",
      submittedBy: "client"
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.reason.reasonCode, "brand_mismatch");
      assert.equal(result.reason.label, "Brand mismatch");
      assert.equal(result.reason.note, "Feels off-brand for Puriva");
      assert.equal(result.reason.submittedBy, "client");
    }
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
