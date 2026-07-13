import type { AiMockedProviderExecutionResult } from "@dca-os-v1/shared";
import type { AiWorkflowOutputType } from "./ai-text-budget.policy";
import type { AiWorkflowResultV1 } from "./ai-delivery-workflow-result.contract";
import {
  prepareCompletedLedgerAttribution,
  recordCompletedAiLedgerEntry,
  type CompletedLedgerAttributionResult
} from "./ai-budget-ledger.service";
import { resolveModelRoute } from "./ai-model-routing-policy.service";

export const AI_DELIVERY_WORKFLOW_LEDGER_ATTRIBUTION_VERSION =
  "AI_DELIVERY_WORKFLOW_LEDGER_ATTRIBUTION_V1";

const OUTPUT_TYPE_TO_ORCHESTRATOR_TASK: Record<AiWorkflowOutputType, string> = {
  summary: "report_narrative",
  content_plan_draft: "seo_plan",
  article_draft: "article_draft"
};

const DEFAULT_OPERATING_PACK_KEY = null;

export function mapWorkflowOutputTypeToOrchestratorTaskType(
  outputType: AiWorkflowOutputType
): string {
  return OUTPUT_TYPE_TO_ORCHESTRATOR_TASK[outputType];
}

export function buildAiDeliveryWorkflowLedgerStepReference(
  outputType: AiWorkflowOutputType
): string {
  return `ai-delivery-execute:${outputType}`;
}

export function shouldPersistAiDeliveryWorkflowCompletedLedger(
  workflowResult: AiWorkflowResultV1
): boolean {
  return workflowResult.gateway === "openrouter" && workflowResult.safeError === null;
}

export function buildProviderExecutionFromWorkflowResult(
  workflowResult: AiWorkflowResultV1,
  workflowRunId: string
): AiMockedProviderExecutionResult {
  const liveProviderCalled = workflowResult.gateway === "openrouter";
  return {
    ok: workflowResult.safeError === null,
    providerKey:
      workflowResult.gateway === "openrouter"
        ? "openrouter"
        : workflowResult.gateway === "local"
          ? "local_deterministic"
          : "disabled",
    model: workflowResult.model,
    actualCostUsd: null,
    approximateInputTokens: workflowResult.budget.approximateInputTokens,
    approximateOutputTokens: workflowResult.budget.maxOutputTokens,
    liveProviderCalled,
    safeError: workflowResult.safeError,
    runId: workflowRunId
  };
}

export function prepareAiDeliveryWorkflowCompletedAttribution(input: {
  workflowResult: AiWorkflowResultV1;
  workflowRunId: string;
  operatingPackKey?: string | null;
  contentChannel?: string | null;
}): CompletedLedgerAttributionResult | null {
  if (!shouldPersistAiDeliveryWorkflowCompletedLedger(input.workflowResult)) {
    return null;
  }

  const orchestratorTaskType = mapWorkflowOutputTypeToOrchestratorTaskType(
    input.workflowResult.outputType
  );
  const operatingPackKey = input.operatingPackKey ?? DEFAULT_OPERATING_PACK_KEY;
  const routing = resolveModelRoute({
    orchestratorTaskType,
    clientProfile: operatingPackKey,
    contentChannel: input.contentChannel ?? "website"
  });

  return prepareCompletedLedgerAttribution({
    orchestratorTaskType,
    clientProfile: operatingPackKey,
    contentChannel: input.contentChannel ?? "website",
    routingAudit: routing.audit,
    providerExecution: buildProviderExecutionFromWorkflowResult(
      input.workflowResult,
      input.workflowRunId
    ),
    estimatedCostUsd: routing.audit.maxCostUsdPerRun,
    workflowRunId: input.workflowRunId
  });
}

export interface PersistAiDeliveryWorkflowCompletedLedgerResult {
  attempted: boolean;
  recorded: boolean;
  reason: string | null;
  stepReference: string | null;
}

export interface PersistAiDeliveryWorkflowCompletedLedgerDeps {
  recordCompletedAiLedgerEntry: typeof recordCompletedAiLedgerEntry;
}

const defaultPersistDeps: PersistAiDeliveryWorkflowCompletedLedgerDeps = {
  recordCompletedAiLedgerEntry
};

export async function persistAiDeliveryWorkflowCompletedLedger(
  input: {
    tenantId: string;
    clientId?: string | null;
    aiDeliveryProjectId?: string | null;
    workflowRunId: string;
    workflowResult: AiWorkflowResultV1;
    operatingPackKey?: string | null;
    contentChannel?: string | null;
  },
  deps: PersistAiDeliveryWorkflowCompletedLedgerDeps = defaultPersistDeps
): Promise<PersistAiDeliveryWorkflowCompletedLedgerResult> {
  const stepReference = buildAiDeliveryWorkflowLedgerStepReference(input.workflowResult.outputType);

  if (!shouldPersistAiDeliveryWorkflowCompletedLedger(input.workflowResult)) {
    return {
      attempted: false,
      recorded: false,
      reason: `Completed ledger persistence skipped for gateway=${input.workflowResult.gateway}.`,
      stepReference
    };
  }

  const attribution = prepareAiDeliveryWorkflowCompletedAttribution(input);
  if (!attribution) {
    return {
      attempted: false,
      recorded: false,
      reason: "Completed attribution could not be prepared.",
      stepReference
    };
  }

  if (!attribution.ok || attribution.ledgerStatus !== "COMPLETED" || !attribution.metadata) {
    return {
      attempted: true,
      recorded: false,
      reason:
        attribution.blockedReason ??
        `Completed ledger persistence skipped for status=${attribution.ledgerStatus}.`,
      stepReference
    };
  }

  const result = await deps.recordCompletedAiLedgerEntry({
    tenantId: input.tenantId,
    clientId: input.clientId,
    aiDeliveryProjectId: input.aiDeliveryProjectId,
    workflowRunId: input.workflowRunId,
    stepReference,
    attribution
  });

  return {
    attempted: true,
    recorded: result.recorded,
    reason: result.reason,
    stepReference
  };
}

export function buildAiDeliveryWorkflowLedgerPersistenceLogLine(input: {
  finishedAtIso: string;
  result: PersistAiDeliveryWorkflowCompletedLedgerResult;
}): string {
  const timestamp = input.finishedAtIso;
  if (input.result.recorded) {
    return `[${timestamp}] AI budget ledger COMPLETED row recorded (stepReference=${input.result.stepReference}).`;
  }
  if (input.result.attempted) {
    return `[${timestamp}] AI budget ledger COMPLETED row not recorded: ${input.result.reason ?? "unknown reason"}.`;
  }
  return `[${timestamp}] AI budget ledger COMPLETED row skipped: ${input.result.reason ?? "not applicable"}.`;
}
