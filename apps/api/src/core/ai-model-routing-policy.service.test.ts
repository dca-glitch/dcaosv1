import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PURIVA_AI_MONTHLY_CAP_USD } from "./ai-budget-guard.service";
import {
  AI_MODEL_ROUTING_TABLE,
  isApprovedModelId,
  resolveModelRoute
} from "./ai-model-routing-policy.service";

describe("ai-model-routing-policy.service", () => {
  it("research_pack selects anthropic/claude-haiku-4.5", () => {
    const result = resolveModelRoute({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      contentChannel: "website"
    });
    assert.equal(result.blocked, false);
    assert.equal(result.route.primaryModel, "anthropic/claude-haiku-4.5");
    assert.equal(result.route.gateway, "openrouter");
  });

  it("article_draft maps to content_draft routing task", () => {
    const result = resolveModelRoute({
      orchestratorTaskType: "article_draft",
      clientProfile: "puriva",
      contentChannel: "website"
    });
    assert.equal(result.blocked, false);
    assert.equal(result.route.taskType, "content_draft");
    assert.equal(result.audit.routingTaskType, "content_draft");
  });

  it("image_single route resolves BFL; orchestrator image_generation remains blocked", () => {
    const image = resolveModelRoute({
      orchestratorTaskType: "image_single",
      clientProfile: "puriva"
    });
    assert.equal(image.blocked, false);
    assert.equal(image.route.taskType, "image_single");
    assert.equal(image.route.provider, "bfl");
    assert.equal(image.route.primaryModel, "flux-2-pro");

    for (const taskType of ["image_generation", "vision_technical_qa", "image_prompt"] as const) {
      const result = resolveModelRoute({
        orchestratorTaskType: taskType,
        clientProfile: "puriva"
      });
      assert.equal(result.blocked, true);
      assert.equal(result.route.taskType, "fallback_stop_admin_review");
      assert.equal(result.route.allowLive, false);
    }
  });

  it("seo_plan and content_draft return approved routes", () => {
    for (const taskType of ["seo_plan", "article_draft"] as const) {
      const result = resolveModelRoute({
        orchestratorTaskType: taskType,
        clientProfile: "puriva",
        contentChannel: "social_media"
      });
      assert.equal(result.blocked, false);
      assert.equal(result.route.primaryModel, "anthropic/claude-haiku-4.5");
    }
  });

  it("workflow_summary returns approved low-risk route", () => {
    const result = resolveModelRoute({
      orchestratorTaskType: "report_narrative",
      clientProfile: "puriva"
    });
    assert.equal(result.route.taskType, "workflow_summary");
    assert.equal(result.route.riskLevel, "low");
    assert.equal(result.route.allowLive, true);
  });

  it("medical_compliance_review uses STOP_AND_ADMIN_REVIEW with no weak fallback", () => {
    const result = resolveModelRoute({
      orchestratorTaskType: "compliance_review",
      clientProfile: "puriva"
    });
    assert.equal(result.route.taskType, "medical_compliance_review");
    assert.equal(result.route.fallbackBehavior, "STOP_AND_ADMIN_REVIEW");
    assert.deepEqual(result.route.fallbackModels, []);
    assert.equal(result.route.allowLive, false);
    assert.equal(result.route.complianceProfile, "puriva_medical_strict");
  });

  it("fallback_stop_admin_review is blocked", () => {
    const result = resolveModelRoute({
      orchestratorTaskType: "local_deterministic",
      clientProfile: "puriva"
    });
    assert.equal(result.blocked, true);
    assert.equal(result.route.taskType, "fallback_stop_admin_review");
    assert.equal(result.route.allowLive, false);
  });

  it("paid_ads channel is blocked", () => {
    const result = resolveModelRoute({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      contentChannel: "paid_ads"
    });
    assert.equal(result.blocked, true);
    assert.match(result.blockedReason ?? "", /paid ads/i);
  });

  it("unknown task type is blocked", () => {
    const result = resolveModelRoute({
      orchestratorTaskType: "unknown_task_xyz",
      clientProfile: "puriva"
    });
    assert.equal(result.blocked, true);
    assert.equal(result.route.taskType, "fallback_stop_admin_review");
  });

  it("rejects unapproved model override", () => {
    const result = resolveModelRoute({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      requestedModelOverride: "openrouter/auto"
    });
    assert.equal(result.audit.modelOverrideRejected, true);
    assert.equal(result.route.primaryModel, "anthropic/claude-haiku-4.5");
  });

  it("live-eligible routes require budget ledger and positive maxCostUsdPerRun below monthly cap", () => {
    for (const route of Object.values(AI_MODEL_ROUTING_TABLE)) {
      if (route.allowLive && route.taskType !== "fallback_stop_admin_review") {
        assert.equal(route.requiresBudgetLedger, true);
        assert.ok(route.maxCostUsdPerRun > 0);
        assert.ok(route.maxCostUsdPerRun < PURIVA_AI_MONTHLY_CAP_USD);
      }
    }
  });

  it("long_context_review is high risk with live disabled", () => {
    const route = AI_MODEL_ROUTING_TABLE.long_context_review;
    assert.equal(route.allowLive, false);
    assert.equal(route.riskLevel, "high");
  });

  it("isApprovedModelId only accepts owner-approved models", () => {
    assert.equal(isApprovedModelId("anthropic/claude-haiku-4.5"), true);
    assert.equal(isApprovedModelId("openrouter/auto"), false);
    assert.equal(isApprovedModelId(null), false);
  });

  it("routing audit truth: policy version, selection reason, and no fabricated live call", () => {
    const result = resolveModelRoute({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      contentChannel: "website"
    });
    assert.equal(result.audit.policyVersion, "AI_MODEL_ROUTING_POLICY_V1");
    assert.equal(result.audit.blocked, false);
    assert.equal(result.audit.modelOverrideRejected, false);
    assert.match(result.audit.selectionReason, /Backend policy route/i);
    assert.equal(result.route.requiresBudgetLedger, true);
    assert.ok(result.route.maxCostUsdPerRun > 0);
  });
});
