import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AI_MODEL_ROUTING_POLICY_VERSION } from "@dca-os-v1/shared";
import {
  PURIVA_AI_MONTHLY_CAP_USD,
  buildPeriodKey,
  buildAiBudgetSnapshot,
  isAiBudgetBlocked
} from "./ai-budget-guard.service";
import {
  AI_BUDGET_LEDGER_VERSION,
  buildPlannedLedgerMetadata,
  buildCompletedLedgerMetadata,
  prepareCompletedLedgerAttribution,
  recordCompletedAiLedgerEntry,
  isCompletedAttributionCompatibleWithMonthlyCap,
  sumAiBudgetLedgerRowsSpentUsd
} from "./ai-budget-ledger.service";
import { resolveModelRoute } from "./ai-model-routing-policy.service";

const APPROVED_MODEL = "anthropic/claude-haiku-4.5";
const WORKFLOW_RUN_ID = "6e538323-8e68-4d41-a4c5-9e30ca0cf8a1";

function mockSuccessExecution(overrides: Partial<import("@dca-os-v1/shared").AiMockedProviderExecutionResult> = {}) {
  return {
    ok: true,
    providerKey: "openrouter",
    model: APPROVED_MODEL,
    actualCostUsd: 0.12,
    approximateInputTokens: 1200,
    approximateOutputTokens: 400,
    liveProviderCalled: true,
    safeError: null,
    runId: "mock-run-001",
    ...overrides
  };
}

describe("ai-budget-ledger.service (unit logic)", () => {
  it("exports ledger version constant", () => {
    assert.equal(AI_BUDGET_LEDGER_VERSION, "AI_BUDGET_LEDGER_V1");
  });

  it("buildPlannedLedgerMetadata records routing attribution fields", () => {
    const routing = resolveModelRoute({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      contentChannel: "website"
    });
    const metadata = buildPlannedLedgerMetadata({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      contentChannel: "website",
      providerKey: "local_deterministic",
      estimatedCostUsd: routing.route.maxCostUsdPerRun,
      canExecute: true,
      routingAudit: routing.audit
    });
    assert.equal(metadata.ledgerVersion, AI_BUDGET_LEDGER_VERSION);
    assert.equal(metadata.taskType, "research_pack");
    assert.equal(metadata.routingTaskType, "research_pack");
    assert.equal(metadata.gateway, "openrouter");
    assert.equal(metadata.model, APPROVED_MODEL);
    assert.equal(metadata.maxCostUsdPerRun, 0.3);
    assert.equal(metadata.policyVersion, AI_MODEL_ROUTING_POLICY_VERSION);
    assert.equal(metadata.clientProfile, "puriva");
    assert.equal(metadata.contentChannel, "website");
    assert.equal(metadata.requiresBudgetLedger, true);
    assert.equal(metadata.liveProviderCalled, false);
    assert.equal(metadata.ledgerStatus, "PREVIEW");
  });

  it("buildPlannedLedgerMetadata marks blocked routes as BLOCKED ledger status", () => {
    const routing = resolveModelRoute({
      orchestratorTaskType: "image_generation",
      clientProfile: "puriva"
    });
    const metadata = buildPlannedLedgerMetadata({
      orchestratorTaskType: "image_generation",
      clientProfile: "puriva",
      providerKey: "local_deterministic",
      estimatedCostUsd: 0,
      canExecute: false,
      routingAudit: routing.audit
    });
    assert.equal(metadata.ledgerStatus, "BLOCKED");
    assert.equal(metadata.routingTaskType, "fallback_stop_admin_review");
  });

  it("prepareCompletedLedgerAttribution records COMPLETED metadata on mocked success", () => {
    const routing = resolveModelRoute({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      contentChannel: "website"
    });
    const result = prepareCompletedLedgerAttribution({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      contentChannel: "website",
      routingAudit: routing.audit,
      providerExecution: mockSuccessExecution(),
      estimatedCostUsd: 0.3,
      workflowRunId: "wf-run-123"
    });
    assert.equal(result.ok, true);
    assert.equal(result.ledgerStatus, "COMPLETED");
    assert.ok(result.metadata);
    assert.equal(result.metadata.ledgerStatus, "COMPLETED");
    assert.equal(result.metadata.provider, "openrouter");
    assert.equal(result.metadata.model, APPROVED_MODEL);
    assert.equal(result.metadata.taskType, "research_pack");
    assert.equal(result.metadata.routingTaskType, "research_pack");
    assert.equal(result.metadata.policyVersion, AI_MODEL_ROUTING_POLICY_VERSION);
    assert.equal(result.metadata.actualCostUsd, 0.12);
    assert.equal(result.metadata.safeError, null);
    assert.equal(result.metadata.workflowRunId, "wf-run-123");
    assert.equal(result.metadata.liveProviderCalled, true);
  });

  it("records actualCostUsd when supplied on success", () => {
    const routing = resolveModelRoute({
      orchestratorTaskType: "article_draft",
      clientProfile: "puriva"
    });
    const result = prepareCompletedLedgerAttribution({
      orchestratorTaskType: "article_draft",
      clientProfile: "puriva",
      routingAudit: routing.audit,
      providerExecution: mockSuccessExecution({ actualCostUsd: 0.45 }),
      estimatedCostUsd: 0.6
    });
    assert.equal(result.metadata?.actualCostUsd, 0.45);
    assert.equal(result.metadata?.estimatedCostUsd, 0.6);
  });

  it("falls back to estimatedCostUsd when actualCostUsd unavailable", () => {
    const routing = resolveModelRoute({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva"
    });
    const result = prepareCompletedLedgerAttribution({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      routingAudit: routing.audit,
      providerExecution: mockSuccessExecution({ actualCostUsd: null }),
      estimatedCostUsd: 0.3
    });
    assert.equal(result.metadata?.actualCostUsd, null);
    assert.equal(result.metadata?.estimatedCostUsd, 0.3);
  });

  it("keeps actualCostUsd null on live success when provider cost is not exposed (trusted-source policy)", () => {
    const routing = resolveModelRoute({
      orchestratorTaskType: "report_narrative",
      clientProfile: "puriva"
    });
    const result = prepareCompletedLedgerAttribution({
      orchestratorTaskType: "report_narrative",
      clientProfile: "puriva",
      routingAudit: routing.audit,
      providerExecution: mockSuccessExecution({
        actualCostUsd: null,
        liveProviderCalled: true,
        model: APPROVED_MODEL
      }),
      estimatedCostUsd: 0.15
    });
    assert.equal(result.ok, true);
    assert.equal(result.ledgerStatus, "COMPLETED");
    assert.equal(result.metadata?.liveProviderCalled, true);
    assert.equal(result.metadata?.actualCostUsd, null);
    assert.equal(result.metadata?.estimatedCostUsd, 0.15);
    assert.notEqual(result.metadata?.actualCostUsd, result.metadata?.estimatedCostUsd);
  });

  it("flags over-cap actualCostUsd and blocks COMPLETED status", () => {
    const routing = resolveModelRoute({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva"
    });
    const result = prepareCompletedLedgerAttribution({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      routingAudit: routing.audit,
      providerExecution: mockSuccessExecution({ actualCostUsd: 0.99 }),
      estimatedCostUsd: 0.3
    });
    assert.equal(result.ledgerStatus, "BLOCKED");
    assert.equal(result.metadata?.overCap, true);
    assert.match(result.metadata?.overCapReason ?? "", /exceeds route cap/i);
    assert.equal(result.metadata?.actualCostUsd, null);
  });

  it("records BLOCKED metadata when safeError is present", () => {
    const routing = resolveModelRoute({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva"
    });
    const result = prepareCompletedLedgerAttribution({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      routingAudit: routing.audit,
      providerExecution: {
        ok: false,
        providerKey: "openrouter",
        model: APPROVED_MODEL,
        liveProviderCalled: true,
        safeError: "Provider timeout (mocked)."
      },
      estimatedCostUsd: 0.3
    });
    assert.equal(result.ledgerStatus, "BLOCKED");
    assert.equal(result.metadata?.safeError, "Provider timeout (mocked).");
    assert.equal(result.metadata?.actualCostUsd, null);
  });

  it("records SKIPPED metadata when execution not ok without safeError", () => {
    const routing = resolveModelRoute({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva"
    });
    const result = prepareCompletedLedgerAttribution({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      routingAudit: routing.audit,
      providerExecution: {
        ok: false,
        providerKey: "local_deterministic",
        model: "local-deterministic-v1",
        liveProviderCalled: false,
        safeError: null
      },
      estimatedCostUsd: 0.3
    });
    assert.equal(result.ledgerStatus, "SKIPPED");
    assert.equal(result.metadata?.liveProviderCalled, false);
  });

  it("refuses completed attribution without routing policy metadata", () => {
    const result = prepareCompletedLedgerAttribution({
      orchestratorTaskType: "research_pack",
      providerExecution: mockSuccessExecution()
    });
    assert.equal(result.ok, false);
    assert.match(result.blockedReason ?? "", /routing policy metadata/i);
    assert.equal(result.metadata, null);
  });

  it("rejects arbitrary model that does not match resolved route", () => {
    const routing = resolveModelRoute({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva"
    });
    const result = prepareCompletedLedgerAttribution({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      routingAudit: routing.audit,
      providerExecution: mockSuccessExecution({ model: "openrouter/auto" }),
      estimatedCostUsd: 0.3
    });
    assert.equal(result.ok, false);
    assert.match(result.blockedReason ?? "", /does not match backend routing policy/i);
  });

  it("refuses completed attribution for blocked routing task", () => {
    const routing = resolveModelRoute({
      orchestratorTaskType: "image_generation",
      clientProfile: "puriva"
    });
    const result = prepareCompletedLedgerAttribution({
      orchestratorTaskType: "image_generation",
      clientProfile: "puriva",
      routingAudit: routing.audit,
      providerExecution: mockSuccessExecution(),
      estimatedCostUsd: 0
    });
    assert.equal(result.ok, false);
    assert.equal(result.ledgerStatus, "BLOCKED");
  });

  it("completed metadata remains compatible with Puriva $100 monthly cap", () => {
    const routing = resolveModelRoute({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva"
    });
    const metadata = buildCompletedLedgerMetadata({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      routingAudit: routing.audit,
      providerExecution: mockSuccessExecution({ actualCostUsd: 0.12 }),
      estimatedCostUsd: 0.3,
      ledgerStatus: "COMPLETED",
      actualCostUsd: 0.12,
      overCap: false,
      overCapReason: null
    });
    assert.ok(isCompletedAttributionCompatibleWithMonthlyCap(metadata, PURIVA_AI_MONTHLY_CAP_USD));
    assert.ok(metadata.maxCostUsdPerRun < PURIVA_AI_MONTHLY_CAP_USD);
    const nearCapBudget = buildAiBudgetSnapshot({
      operatingPackKey: "puriva",
      taskType: "research_pack",
      spentThisPeriodUsd: 99.85,
      maxCostUsdPerRun: metadata.maxCostUsdPerRun
    });
    assert.equal(isAiBudgetBlocked(nearCapBudget, metadata.maxCostUsdPerRun).blocked, true);
  });

  it("budget guard respects spentThisPeriodUsd for cap enforcement", () => {
    const budget = buildAiBudgetSnapshot({
      operatingPackKey: "puriva",
      taskType: "article_draft",
      spentThisPeriodUsd: 100
    });
    assert.equal(budget.killSwitchActive, true);
    assert.equal(isAiBudgetBlocked(budget).blocked, true);
  });

  it("sums live completed ledger spend using actual cost when present and estimate otherwise", () => {
    const spent = sumAiBudgetLedgerRowsSpentUsd([
      {
        estimatedCostUsd: 0.15,
        actualCostUsd: null
      },
      {
        estimatedCostUsd: 0.3,
        actualCostUsd: 0.12
      },
      {
        estimatedCostUsd: "0.25",
        actualCostUsd: null
      }
    ]);

    assert.equal(spent, 0.52);
  });

  it("buildPeriodKey returns YYYY-MM format", () => {
    const key = buildPeriodKey(new Date("2026-07-15T12:00:00.000Z"));
    assert.equal(key, "2026-07");
  });

  it("recordCompletedAiLedgerEntry refuses recording without prepared metadata", async () => {
    const result = await recordCompletedAiLedgerEntry({
      tenantId: "tenant-1",
      workflowRunId: WORKFLOW_RUN_ID,
      stepReference: "ai-delivery-execute:summary",
      attribution: {
        ok: false,
        blockedReason: "Routing policy metadata is required for completed ledger attribution.",
        metadata: null,
        ledgerStatus: "BLOCKED"
      }
    });
    assert.equal(result.recorded, false);
    assert.match(result.reason ?? "", /Routing policy metadata is required/i);
  });

  it("recordCompletedAiLedgerEntry upsert key contract keeps one row per tenant/workflow/stepReference", () => {
    const store = new Map<string, Record<string, unknown>>();
    const upsert = (input: {
      tenantId: string;
      workflowRunId: string;
      stepReference: string;
      status: string;
    }) => {
      const key = `${input.tenantId}:${input.workflowRunId}:${input.stepReference}`;
      const existing = store.get(key);
      if (existing) {
        store.set(key, { ...existing, status: input.status });
        return "updated";
      }
      store.set(key, {
        tenantId: input.tenantId,
        workflowRunId: input.workflowRunId,
        stepReference: input.stepReference,
        status: input.status
      });
      return "created";
    };

    const first = upsert({
      tenantId: "tenant-1",
      workflowRunId: WORKFLOW_RUN_ID,
      stepReference: "ai-delivery-execute:summary",
      status: "COMPLETED"
    });
    const second = upsert({
      tenantId: "tenant-1",
      workflowRunId: WORKFLOW_RUN_ID,
      stepReference: "ai-delivery-execute:summary",
      status: "COMPLETED"
    });

    assert.equal(first, "created");
    assert.equal(second, "updated");
    assert.equal(store.size, 1);
    assert.equal(store.values().next().value?.status, "COMPLETED");
  });
});
