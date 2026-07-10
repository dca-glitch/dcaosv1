import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildImageProviderProofPlan,
  IMAGE_PROVIDER_PROOF_PHASES,
  summarizeImageProviderProofPlan
} from "./image-provider-proof-plan";

describe("image-provider-proof-plan", () => {
  it("G196 returns typed no-live proof plan covering all phases", () => {
    const plan = buildImageProviderProofPlan();

    assert.equal(plan.liveProviderCallsInThisBlock, false);
    assert.equal(plan.providerDecisionStatus, "pending_owner_approval");
    assert.equal(plan.primaryProviderDirection, "adobe_firefly");
    assert.deepEqual(
      plan.phases.map((p) => p.phase),
      [...IMAGE_PROVIDER_PROOF_PHASES]
    );

    const livePhase = plan.phases.find((p) => p.phase === "one_live_generation_later");
    assert.ok(livePhase);
    assert.equal(livePhase.status, "explicitly_out_of_scope_this_block");
    assert.equal(livePhase.liveProviderCallAllowed, "owner_approved_staging_only");

    const preflight = plan.phases.find((p) => p.phase === "no_live_preflight");
    assert.ok(preflight);
    assert.equal(preflight.liveProviderCallAllowed, false);

    for (const phase of plan.phases) {
      if (phase.phase !== "one_live_generation_later") {
        assert.equal(phase.liveProviderCallAllowed, false);
      }
    }
  });

  it("G196 summarize helper stays free of secrets and live claims", () => {
    const summary = summarizeImageProviderProofPlan();
    assert.ok(summary.includes("live_in_block=false"));
    assert.ok(summary.includes("pending_owner_approval"));
    assert.ok(!/api[_-]?key|secret|password/i.test(summary));
  });
});
