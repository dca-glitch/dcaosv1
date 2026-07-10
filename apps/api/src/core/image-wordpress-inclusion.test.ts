import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateImageWordpressInclusionBundle,
  evaluateImageWordpressInclusionReadiness,
  IMAGE_WORDPRESS_INCLUSION_ROLES
} from "./image-wordpress-inclusion";

describe("image-wordpress-inclusion", () => {
  it("G195 allows only final_accepted hero/supporting/social with alt text", () => {
    assert.deepEqual(IMAGE_WORDPRESS_INCLUSION_ROLES, ["hero", "supporting", "social"]);

    for (const role of IMAGE_WORDPRESS_INCLUSION_ROLES) {
      const decision = evaluateImageWordpressInclusionReadiness({
        approvalState: "final_accepted",
        role,
        hasAltText: true,
        hasSocialPreviewAsset: role === "social" ? true : undefined
      });
      assert.equal(decision.ready, true, role);
      assert.ok(decision.checks.includes("READY:wordpress_draft_inclusion"));
    }
  });

  it("G195 rejects non-final states", () => {
    for (const state of [
      "candidate_generated",
      "admin_approved",
      "admin_rejected",
      "client_approved",
      "client_rejected",
      "replacement_requested"
    ] as const) {
      const decision = evaluateImageWordpressInclusionReadiness({
        approvalState: state,
        role: "hero",
        hasAltText: true
      });
      assert.equal(decision.ready, false, state);
      assert.ok(decision.reasons.some((r) => r.includes("final_accepted")));
    }
  });

  it("G195/G320 rejects missing alt text and missing social asset", () => {
    const noAlt = evaluateImageWordpressInclusionReadiness({
      approvalState: "final_accepted",
      role: "supporting",
      hasAltText: false
    });
    assert.equal(noAlt.ready, false);
    assert.ok(noAlt.checks.includes("REJECT:missing_alt_text"));

    const noSocial = evaluateImageWordpressInclusionReadiness({
      approvalState: "final_accepted",
      role: "social",
      hasAltText: true,
      hasSocialPreviewAsset: false
    });
    assert.equal(noSocial.ready, false);
    assert.ok(noSocial.checks.includes("REJECT:missing_social_preview_asset"));
  });

  it("G320/G321 ties WordPress readiness to final_accepted only", () => {
    const ready = evaluateImageWordpressInclusionReadiness({
      approvalState: "final_accepted",
      role: "hero",
      hasAltText: true
    });
    assert.equal(ready.ready, true);
    assert.ok(ready.checks.includes("ALLOW:final_accepted"));

    const clientApprovedOnly = evaluateImageWordpressInclusionReadiness({
      approvalState: "client_approved",
      role: "hero",
      hasAltText: true
    });
    assert.equal(clientApprovedOnly.ready, false);
    assert.ok(clientApprovedOnly.checks.includes("REJECT:not_final_accepted"));
  });

  it("G560 bundles WP readiness with alt and compliance gates", () => {
    const ready = evaluateImageWordpressInclusionBundle({
      approvalState: "final_accepted",
      role: "hero",
      hasAltText: true,
      altTextAllowed: true,
      complianceAllowed: true
    });
    assert.equal(ready.ready, true);
    assert.ok(ready.checks.includes("READY:wordpress_draft_inclusion"));
    assert.ok(ready.checks.includes("ALLOW:alt_text_policy"));
    assert.ok(ready.checks.includes("ALLOW:compliance_policy"));

    const badAlt = evaluateImageWordpressInclusionBundle({
      approvalState: "final_accepted",
      role: "supporting",
      hasAltText: true,
      altTextAllowed: false,
      complianceAllowed: true
    });
    assert.equal(badAlt.ready, false);
    assert.ok(badAlt.checks.includes("REJECT:alt_text_policy"));

    const badCompliance = evaluateImageWordpressInclusionBundle({
      approvalState: "final_accepted",
      role: "social",
      hasAltText: true,
      hasSocialPreviewAsset: true,
      complianceAllowed: false
    });
    assert.equal(badCompliance.ready, false);
    assert.ok(badCompliance.checks.includes("REJECT:compliance_policy"));
  });
});
