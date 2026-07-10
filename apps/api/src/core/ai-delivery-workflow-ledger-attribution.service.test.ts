import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AI_MODEL_ROUTING_POLICY_VERSION } from "@dca-os-v1/shared";
import { AI_TEXT_BUDGET_POLICY_NAME } from "./ai-text-budget.policy";
import type { AiWorkflowResultV1 } from "./ai-delivery-workflow-result.contract";
import type { CompletedLedgerAttributionResult } from "./ai-budget-ledger.service";
import {
  buildAiDeliveryWorkflowLedgerPersistenceLogLine,
  buildAiDeliveryWorkflowLedgerStepReference,
  buildProviderExecutionFromWorkflowResult,
  mapWorkflowOutputTypeToOrchestratorTaskType,
  persistAiDeliveryWorkflowCompletedLedger,
  prepareAiDeliveryWorkflowCompletedAttribution,
  shouldPersistAiDeliveryWorkflowCompletedLedger
} from "./ai-delivery-workflow-ledger-attribution.service";

const APPROVED_MODEL = "anthropic/claude-haiku-4.5";
const WORKFLOW_RUN_ID = "6e538323-8e68-4d41-a4c5-9e30ca0cf8a1";

function openRouterSummaryResult(
  overrides: Partial<AiWorkflowResultV1> = {}
): AiWorkflowResultV1 {
  return {
    version: "AI_WORKFLOW_RESULT_V1",
    gateway: "openrouter",
    model: APPROVED_MODEL,
    outputType: "summary",
    generatedAt: "2026-07-10T00:00:00.000Z",
    title: "Smoke workflow summary",
    summary: "Admin-only workflow execution summary.",
    structuredContent: null,
    safeError: null,
    budget: {
      budgetPolicy: AI_TEXT_BUDGET_POLICY_NAME,
      approximateInputTokens: 56,
      maxOutputTokens: 180
    },
    ...overrides
  };
}

function localSummaryResult(): AiWorkflowResultV1 {
  return openRouterSummaryResult({
    gateway: "local",
    model: "local-deterministic",
    budget: {
      budgetPolicy: AI_TEXT_BUDGET_POLICY_NAME,
      approximateInputTokens: 40,
      maxOutputTokens: 180
    }
  });
}

describe("ai-delivery-workflow-ledger-attribution.service", () => {
  it("maps workflow output types to orchestrator task semantics", () => {
    assert.equal(mapWorkflowOutputTypeToOrchestratorTaskType("summary"), "report_narrative");
    assert.equal(mapWorkflowOutputTypeToOrchestratorTaskType("content_plan_draft"), "seo_plan");
    assert.equal(mapWorkflowOutputTypeToOrchestratorTaskType("article_draft"), "article_draft");
  });

  it("builds stable stepReference values for idempotent upsert", () => {
    assert.equal(buildAiDeliveryWorkflowLedgerStepReference("summary"), "ai-delivery-execute:summary");
    assert.equal(
      buildAiDeliveryWorkflowLedgerStepReference("content_plan_draft"),
      "ai-delivery-execute:content_plan_draft"
    );
    assert.equal(
      buildAiDeliveryWorkflowLedgerStepReference("article_draft"),
      "ai-delivery-execute:article_draft"
    );
  });

  it("persists only for openrouter gateway without safeError", () => {
    assert.equal(shouldPersistAiDeliveryWorkflowCompletedLedger(openRouterSummaryResult()), true);
    assert.equal(shouldPersistAiDeliveryWorkflowCompletedLedger(localSummaryResult()), false);
    assert.equal(
      shouldPersistAiDeliveryWorkflowCompletedLedger(
        openRouterSummaryResult({ safeError: "Provider timeout." })
      ),
      false
    );
  });

  it("builds provider execution attribution input from workflow result", () => {
    const workflowResult = openRouterSummaryResult();
    const providerExecution = buildProviderExecutionFromWorkflowResult(
      workflowResult,
      WORKFLOW_RUN_ID
    );
    assert.equal(providerExecution.ok, true);
    assert.equal(providerExecution.providerKey, "openrouter");
    assert.equal(providerExecution.model, APPROVED_MODEL);
    assert.equal(providerExecution.liveProviderCalled, true);
    assert.equal(providerExecution.approximateInputTokens, 56);
    assert.equal(providerExecution.approximateOutputTokens, 180);
    assert.equal(providerExecution.runId, WORKFLOW_RUN_ID);
    assert.equal(providerExecution.actualCostUsd, null);
  });

  it("prepares COMPLETED attribution metadata for mocked openrouter workflow result", () => {
    const attribution = prepareAiDeliveryWorkflowCompletedAttribution({
      workflowResult: openRouterSummaryResult(),
      workflowRunId: WORKFLOW_RUN_ID
    });
    assert.ok(attribution);
    assert.equal(attribution.ok, true);
    assert.equal(attribution.ledgerStatus, "COMPLETED");
    assert.equal(attribution.metadata?.workflowRunId, WORKFLOW_RUN_ID);
    assert.equal(attribution.metadata?.provider, "openrouter");
    assert.equal(attribution.metadata?.model, APPROVED_MODEL);
    assert.equal(attribution.metadata?.liveProviderCalled, true);
    assert.equal(attribution.metadata?.routingTaskType, "workflow_summary");
    assert.equal(attribution.metadata?.policyVersion, AI_MODEL_ROUTING_POLICY_VERSION);
    assert.equal(attribution.metadata?.approximateInputTokens, 56);
    assert.equal(attribution.metadata?.approximateOutputTokens, 180);
    assert.ok(attribution.metadata?.estimatedCostUsd > 0);
  });

  it("skips local deterministic workflow results without preparing attribution", () => {
    const attribution = prepareAiDeliveryWorkflowCompletedAttribution({
      workflowResult: localSummaryResult(),
      workflowRunId: WORKFLOW_RUN_ID
    });
    assert.equal(attribution, null);
  });

  it("persists COMPLETED ledger row through recordCompletedAiLedgerEntry dependency", async () => {
    const calls: Array<{
      tenantId: string;
      workflowRunId: string;
      stepReference: string | null | undefined;
      attribution: CompletedLedgerAttributionResult;
    }> = [];

    const result = await persistAiDeliveryWorkflowCompletedLedger(
      {
        tenantId: "tenant-1",
        clientId: "client-1",
        aiDeliveryProjectId: "project-1",
        workflowRunId: WORKFLOW_RUN_ID,
        workflowResult: openRouterSummaryResult()
      },
      {
        recordCompletedAiLedgerEntry: async (input) => {
          calls.push({
            tenantId: input.tenantId,
            workflowRunId: input.workflowRunId ?? WORKFLOW_RUN_ID,
            stepReference: input.stepReference,
            attribution: input.attribution
          });
          return { recorded: true, reason: null };
        }
      }
    );

    assert.equal(result.attempted, true);
    assert.equal(result.recorded, true);
    assert.equal(result.stepReference, "ai-delivery-execute:summary");
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.workflowRunId, WORKFLOW_RUN_ID);
    assert.equal(calls[0]?.stepReference, "ai-delivery-execute:summary");
    assert.equal(calls[0]?.attribution.ledgerStatus, "COMPLETED");
    assert.equal(calls[0]?.attribution.metadata?.provider, "openrouter");
    assert.equal(calls[0]?.attribution.metadata?.model, APPROVED_MODEL);
    assert.equal(calls[0]?.attribution.metadata?.liveProviderCalled, true);
    assert.ok((calls[0]?.attribution.metadata?.maxCostUsdPerRun ?? 0) > 0);
  });

  it("duplicate completion uses the same stepReference for upsert idempotency", async () => {
    const calls: string[] = [];

    const input = {
      tenantId: "tenant-1",
      clientId: "client-1",
      aiDeliveryProjectId: "project-1",
      workflowRunId: WORKFLOW_RUN_ID,
      workflowResult: openRouterSummaryResult()
    };
    const deps = {
      recordCompletedAiLedgerEntry: async (entry: {
        stepReference?: string | null;
      }) => {
        calls.push(entry.stepReference ?? "");
        return { recorded: true, reason: null };
      }
    };

    await persistAiDeliveryWorkflowCompletedLedger(input, deps);
    await persistAiDeliveryWorkflowCompletedLedger(input, deps);

    assert.equal(calls.length, 2);
    assert.equal(calls[0], "ai-delivery-execute:summary");
    assert.equal(calls[1], "ai-delivery-execute:summary");
  });

  it("skips persistence for local deterministic workflow execution", async () => {
    let called = false;
    const result = await persistAiDeliveryWorkflowCompletedLedger(
      {
        tenantId: "tenant-1",
        workflowRunId: WORKFLOW_RUN_ID,
        workflowResult: localSummaryResult()
      },
      {
        recordCompletedAiLedgerEntry: async () => {
          called = true;
          return { recorded: true, reason: null };
        }
      }
    );

    assert.equal(called, false);
    assert.equal(result.attempted, false);
    assert.equal(result.recorded, false);
    assert.match(result.reason ?? "", /skipped for gateway=local/i);
  });

  it("builds audit-safe persistence log lines without secrets", () => {
    const recordedLine = buildAiDeliveryWorkflowLedgerPersistenceLogLine({
      finishedAtIso: "2026-07-10T00:00:00.000Z",
      result: {
        attempted: true,
        recorded: true,
        reason: null,
        stepReference: "ai-delivery-execute:summary"
      }
    });
    assert.match(recordedLine, /COMPLETED row recorded/);
    assert.match(recordedLine, /ai-delivery-execute:summary/);
    assert.doesNotMatch(recordedLine, /sk-or-|OPENROUTER_API_KEY|password/i);

    const skippedLine = buildAiDeliveryWorkflowLedgerPersistenceLogLine({
      finishedAtIso: "2026-07-10T00:00:00.000Z",
      result: {
        attempted: false,
        recorded: false,
        reason: "Completed ledger persistence skipped for gateway=local.",
        stepReference: "ai-delivery-execute:summary"
      }
    });
    assert.match(skippedLine, /skipped/i);
  });
});
