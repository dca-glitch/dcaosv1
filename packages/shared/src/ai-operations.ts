import type { AiWorkflowContextUsageSummary, AiWorkflowObservabilitySummary, AiWorkflowResultSummary } from "./ai-workflow-result";

export type AiOperationsWorkflowKind = "ai_delivery_workflow_run" | "market_intelligence_research_run";

export interface AiOperationsRunListItem {
  id: string;
  shortId: string;
  workflowKind: AiOperationsWorkflowKind;
  aiDeliveryProjectId: string | null;
  miProjectId: string | null;
  projectName: string;
  clientId: string | null;
  clientName: string | null;
  linkedProjectId: string | null;
  linkedProjectName: string | null;
  targetMonth: string | null;
  workflowType: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  executedAt: string | null;
  gateway: string | null;
  providerMode: string | null;
  isDeterministic: boolean | null;
  liveProviderCalled: boolean | null;
  model: string | null;
  outputType: string | null;
  contextStatus: AiWorkflowContextUsageSummary["status"];
  approximateInputTokens: number | null;
  maxOutputTokens: number | null;
  budgetPolicy: string | null;
  safeError: string | null;
  executionError: string | null;
  resultVersion: string | null;
  resultType: string | null;
  titlePreview: string | null;
  linkedInsightId: string | null;
  linkedInsightStatus: string | null;
  linkedHandoffStatus: string | null;
}

export interface AiOperationsRunDetail extends AiOperationsRunListItem {
  adminNotes: string | null;
  resultSummary: AiWorkflowResultSummary | null;
  observability: AiWorkflowObservabilitySummary | null;
  contextUsage: AiWorkflowContextUsageSummary;
  executionLogPreview: string | null;
  rawResultJsonPreview: string | null;
  miResultSummaryPreview: string | null;
}

export interface AiOperationsRunsResponse {
  runs: AiOperationsRunListItem[];
}

export interface AiOperationsRunResponse {
  run: AiOperationsRunDetail | null;
}

export interface ListAiOperationsRunsFilters {
  status?: string;
  outputType?: string;
  gateway?: string;
  workflowKind?: AiOperationsWorkflowKind | "all";
  clientId?: string;
  aiDeliveryProjectId?: string;
  miProjectId?: string;
  limit?: number;
}

export function formatAiOperationsWorkflowKindLabel(kind: AiOperationsWorkflowKind): string {
  if (kind === "market_intelligence_research_run") {
    return "Market Intelligence";
  }
  return "AI Delivery";
}
