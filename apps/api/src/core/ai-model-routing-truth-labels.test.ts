import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveModelRoute } from "./ai-model-routing-policy.service";
import {
  AI_MODEL_ROUTING_TRUTH_LABELS_VERSION,
  buildAiModelRoutingTruthLabels
} from "./ai-model-routing-truth-labels";

describe("ai-model-routing-truth-labels", () => {
  it("labels preview research_pack as backend-selected with null actual cost", () => {
    const routing = resolveModelRoute({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      contentChannel: "website"
    });
    const snapshot = buildAiModelRoutingTruthLabels({
      audit: routing.audit,
      liveProviderCalled: false,
      actualCostUsd: null,
      attributionMode: "preview"
    });

    assert.equal(snapshot.version, AI_MODEL_ROUTING_TRUTH_LABELS_VERSION);
    assert.equal(snapshot.policyVersion, "AI_MODEL_ROUTING_POLICY_V1");
    assert.equal(
      snapshot.labels.find((row) => row.label === "backend_policy_selected")?.active,
      true
    );
    assert.equal(
      snapshot.labels.find((row) => row.label === "live_eligible_budget_ledger_required")?.active,
      true
    );
    assert.equal(
      snapshot.labels.find((row) => row.label === "preview_only_no_live_call")?.active,
      true
    );
    assert.equal(
      snapshot.labels.find((row) => row.label === "actual_cost_null_until_trusted_source")?.active,
      true
    );
  });

  it("labels blocked image_generation and rejected model override", () => {
    const blocked = resolveModelRoute({
      orchestratorTaskType: "image_generation",
      clientProfile: "puriva"
    });
    const blockedSnapshot = buildAiModelRoutingTruthLabels({
      audit: blocked.audit,
      attributionMode: "preview"
    });
    assert.equal(
      blockedSnapshot.labels.find((row) => row.label === "route_blocked_admin_review")?.active,
      true
    );
    assert.equal(
      blockedSnapshot.labels.find((row) => row.label === "live_disabled_conservative")?.active,
      true
    );

    const override = resolveModelRoute({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      requestedModelOverride: "openrouter/auto"
    });
    const overrideSnapshot = buildAiModelRoutingTruthLabels({
      audit: override.audit,
      attributionMode: "preview"
    });
    assert.equal(
      overrideSnapshot.labels.find((row) => row.label === "model_override_rejected")?.active,
      true
    );
  });

  it("labels mocked completed attribution without claiming invoice actual", () => {
    const routing = resolveModelRoute({
      orchestratorTaskType: "report_narrative",
      clientProfile: "puriva"
    });
    const snapshot = buildAiModelRoutingTruthLabels({
      audit: routing.audit,
      liveProviderCalled: true,
      actualCostUsd: null,
      attributionMode: "mocked_completed"
    });
    assert.equal(
      snapshot.labels.find((row) => row.label === "completed_attribution_mocked")?.active,
      true
    );
    assert.equal(
      snapshot.labels.find((row) => row.label === "actual_cost_null_until_trusted_source")?.active,
      true
    );
    assert.equal(
      snapshot.labels.find((row) => row.label === "preview_only_no_live_call")?.active,
      false
    );
  });
});
