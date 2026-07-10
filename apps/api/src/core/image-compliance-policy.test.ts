import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildImageCompliancePolicySnapshot,
  buildImagePromptProfile,
  evaluateImageCompliancePolicy,
  evaluateImageConceptComplianceBundle,
  getImageApprovalLoopEvent,
  IMAGE_APPROVAL_LOOP_ACTIONS,
  IMAGE_COMPLIANCE_ALLOWED_DIRECTION_EXAMPLES,
  IMAGE_COMPLIANCE_HARD_BLOCK_CODES,
  IMAGE_COMPLIANCE_POLICY_VERSION,
  IMAGE_COMPLIANCE_REJECT_CODES,
  requireImageRejectReasonForApprovalAction,
  validateMandatoryImageRejectReason
} from "./image-compliance-policy";

describe("image-compliance-policy", () => {
  it("G189/G309 rejects before/after concepts before generation", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Create a split-screen before and after treatment showing side-by-side comparison."
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.findings.some((finding) => finding.code === "before_after_risk"));
    assert.ok(decision.checks.includes("REJECT:before_after_risk"));
  });

  it("G309 expands forbidden phrases for progress photos and day-0 comparisons", () => {
    const progress = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Include progress photos and a day 0 vs day 30 comparison."
    });
    assert.equal(progress.allowed, false);
    assert.ok(progress.findings.some((f) => f.code === "before_after_risk"));

    const contour = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Show a contouring result after the program."
    });
    assert.equal(contour.allowed, false);
    assert.ok(contour.findings.some((f) => f.code === "before_after_risk"));
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

  it("G189/G309 rejects syringes, procedure staging, and sterile-field cues", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Close-up of a syringe and needle preparing an injection in a treatment chair."
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.findings.some((f) => f.code === "procedure_or_device_risk"));

    const sterile = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Operating theatre sterile field with a scalpel ready."
    });
    assert.equal(sterile.allowed, false);
    assert.ok(sterile.findings.some((f) => f.code === "procedure_or_device_risk"));
  });

  it("G189 rejects fake doctor imagery", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Show a fake doctor in a lab coat with a medical badge."
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.findings.some((f) => f.code === "fake_clinician_or_patient_risk"));
  });

  it("G309 rejects actor-as-doctor and patient success story framing", () => {
    const actor = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Use an actor as doctor impersonating a clinician for the campaign."
    });
    assert.equal(actor.allowed, false);
    assert.ok(actor.findings.some((f) => f.code === "fake_clinician_or_patient_risk"));

    const story = evaluateImageCompliancePolicy({
      stage: "post_generation_output",
      text: "Caption with a 5-star patient success story endorsement."
    });
    assert.equal(story.allowed, false);
    assert.ok(story.findings.some((f) => f.code === "fake_clinician_or_patient_risk"));
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

  it("G189/G309 rejects guaranteed results and clinically proven result language", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "post_generation_output",
      text: "Marketing frame promising guaranteed results and instant results after the service."
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.findings.some((f) => f.code === "treatment_result_risk"));

    const clinical = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Visual implying a clinically proven result and wrinkle-free result."
    });
    assert.equal(clinical.allowed, false);
    assert.ok(clinical.findings.some((f) => f.code === "treatment_result_risk"));
  });

  it("G309 rejects likeness deepfake and at-home injection kit cues", () => {
    const likeness = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Create a deepfake lookalike of a celebrity without consent."
    });
    assert.equal(likeness.allowed, false);
    assert.ok(likeness.findings.some((f) => f.code === "likeness_consent_risk"));

    const kit = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Show an at-home injection kit and buy Wegovy online packaging."
    });
    assert.equal(kit.allowed, false);
    assert.ok(kit.findings.some((f) => f.code === "unsafe_prescription_or_device_risk"));
  });

  it("G189/G310 allows neutral wellness imagery", () => {
    const decision = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Premium abstract wellness composition with soft skincare textures and a calm editorial mood."
    });

    assert.equal(decision.allowed, true);
    assert.deepEqual(decision.findings, []);
    assert.deepEqual(decision.checks, ["ALLOW:neutral_wellness_context"]);
  });

  it("G310 allows expanded neutral lifestyle directions", () => {
    for (const example of IMAGE_COMPLIANCE_ALLOWED_DIRECTION_EXAMPLES) {
      const decision = evaluateImageCompliancePolicy({
        stage: "pre_generation_prompt",
        text: example
      });
      assert.equal(decision.allowed, true, example);
      assert.deepEqual(decision.findings, []);
    }
  });

  it("G311 builds a stable policy snapshot with hard blocks and no-live flag", () => {
    const snapshot = buildImageCompliancePolicySnapshot();

    assert.equal(snapshot.version, IMAGE_COMPLIANCE_POLICY_VERSION);
    assert.equal(snapshot.liveProviderCallsAllowed, false);
    assert.deepEqual(snapshot.hardBlockCodes, IMAGE_COMPLIANCE_HARD_BLOCK_CODES);
    assert.ok(snapshot.matchedRules.includes("no_before_after_or_transformation_framing"));
    assert.ok(snapshot.matchedRules.includes("no_body_transformation_framing"));
    assert.ok(snapshot.allowedDirectionExamples.length >= 6);
    assert.ok(snapshot.rejectCodes.includes("before_after_risk"));
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

  it("G192/G316 requires structured reject reason for admin reject, client reject, and replacement", () => {
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

    for (const code of IMAGE_COMPLIANCE_HARD_BLOCK_CODES) {
      const result = validateMandatoryImageRejectReason({
        reasonCode: code,
        submittedBy: "admin",
        context: "admin_reject"
      });
      assert.equal(result.ok, true, code);
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

  it("G553/G554 expands filler/Botox result and clinical staging blocks while allowing new neutrals", () => {
    const filler = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Show a lip filler result and Botox result comparison."
    });
    assert.equal(filler.allowed, false);
    assert.ok(filler.findings.some((f) => f.code === "treatment_result_risk"));

    const staging = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Clinical staging in a treatment bay with procedure bay lighting."
    });
    assert.equal(staging.allowed, false);
    assert.ok(staging.findings.some((f) => f.code === "procedure_or_device_risk"));

    const ceramic = evaluateImageCompliancePolicy({
      stage: "pre_generation_prompt",
      text: "Soft daylight on ceramic skincare vessels without brand claims"
    });
    assert.equal(ceramic.allowed, true);

    assert.equal(IMAGE_COMPLIANCE_POLICY_VERSION, "IMAGE_COMPLIANCE_POLICY_V4");
    assert.ok(IMAGE_COMPLIANCE_ALLOWED_DIRECTION_EXAMPLES.length >= 8);
  });

  it("G553 evaluates prompt/alt/output concept bundles without provider contact", () => {
    const ok = evaluateImageConceptComplianceBundle({
      promptText: "Calm editorial wellness composition with soft textures.",
      altText: "Soft linen textures in a quiet wellness interior",
      outputReviewText: "Neutral lifestyle still life with botanical detail"
    });
    assert.equal(ok.allowed, true);
    assert.ok(ok.checks.includes("ALLOW:concept_bundle"));

    const blocked = evaluateImageConceptComplianceBundle({
      promptText: "Neutral wellness hero.",
      altText: "Weight-loss journey photos then vs now"
    });
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.altTextScreen && blocked.altTextScreen.allowed === false);
  });

  it("G557 requires structured reject reasons for reject-like approval actions", () => {
    const missing = requireImageRejectReasonForApprovalAction("admin_reject", {
      submittedBy: "admin"
    });
    assert.equal(missing.ok, false);

    const ok = requireImageRejectReasonForApprovalAction("client_reject", {
      reasonCode: "brand_mismatch",
      submittedBy: "client"
    });
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.reason.context, "client_reject");
    }

    const notRequired = requireImageRejectReasonForApprovalAction("admin_approve", {
      reasonCode: "low_quality",
      submittedBy: "admin"
    });
    assert.equal(notRequired.ok, false);
  });
});
