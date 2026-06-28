import type { AiWorkflowContextUsageSummary, AiWorkflowObservabilitySummary, AiWorkflowResultSummary } from "./ai-workflow-result";

export interface AiOperationsRunListItem {
  id: string;
  shortId: string;
  workflowKind: "ai_delivery_workflow_run";
  aiDeliveryProjectId: string;
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
}

export interface AiOperationsRunDetail extends AiOperationsRunListItem {
  adminNotes: string | null;
  resultSummary: AiWorkflowResultSummary | null;
  observability: AiWorkflowObservabilitySummary | null;
  contextUsage: AiWorkflowContextUsageSummary;
  executionLogPreview: string | null;
  rawResultJsonPreview: string | null;
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
  clientId?: string;
  aiDeliveryProjectId?: string;
  limit?: number;
}
