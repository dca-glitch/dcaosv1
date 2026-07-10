/**
 * AI orchestrator / model-policy local guards (G625–G631).
 * Pure helpers for no-live safety, blocked routing, disabled-gateway labels,
 * deterministic fallback, sanitization, knowledge inclusion, and metadata redaction.
 * Does not call providers or mutate env.
 */

import type {
  AiOrchestratorLitePlanResult,
  AiRunAuditMetadata
} from "@dca-os-v1/shared";
import {
  buildSanitizedAiWorkflowJsonPreview,
  parseAiWorkflowContextUsageFromExecutionLog,
  type AiWorkflowContextUsageSummary
} from "@dca-os-v1/shared";
import { sanitizeUntrustedContextText } from "./ai-prompt-injection-sanitize";

export const AI_LOCAL_GUARD_ORCHESTRATOR_VERSION = "AI_LOCAL_GUARD_ORCHESTRATOR_V1";

/** Operator-facing disabled-gateway / no-live labels (orchestrator lane; not live claims). */
export const AI_ORCHESTRATOR_DISABLED_GATEWAY_TRUTH_LABELS = [
  "disabled_gateway_no_live",
  "local_deterministic_fallback",
  "preview_only_orchestrator",
  "live_provider_called_false",
  "actual_cost_null_until_trusted"
] as const;

export type AiOrchestratorDisabledGatewayTruthLabel =
  (typeof AI_ORCHESTRATOR_DISABLED_GATEWAY_TRUTH_LABELS)[number];

export interface AiOrchestratorDisabledGatewayTruthLabelRow {
  label: AiOrchestratorDisabledGatewayTruthLabel;
  active: boolean;
  detail: string;
}

export interface AiOrchestratorLocalOnlySafetySnapshot {
  version: typeof AI_LOCAL_GUARD_ORCHESTRATOR_VERSION;
  ok: boolean;
  liveProviderCalled: false;
  executionModeLocalOrDisabled: boolean;
  ledgerLiveProviderCalled: false;
  actualCostUsdNull: boolean;
  violations: string[];
}

export interface AiOrchestratorDeterministicFallbackSnapshot {
  version: typeof AI_LOCAL_GUARD_ORCHESTRATOR_VERSION;
  providerKey: string;
  modelId: string | null;
  executionMode: string;
  liveProviderCalled: false;
  isLocalDeterministic: boolean;
  detail: string;
}

export interface AiOrchestratorKnowledgeInclusionMeta {
  used: boolean;
  selectedCount: number;
  selectedItemTitles: string[];
  skippedReason: string | null;
  sanitizeFlagCount: number;
  trimmed: boolean;
  /** Never includes raw knowledge body text. */
  bodyTextIncluded: false;
}

export interface AiOrchestratorKnowledgeInclusionLogResult {
  lines: string[];
  usage: AiWorkflowContextUsageSummary;
  bodyTextIncluded: false;
}

export interface AiOrchestratorRedactedAuditMetadata {
  orchestratorVersion: string;
  workflowReference: string | null;
  stepReference: string | null;
  clientId: string | null;
  agentRole: string;
  providerKey: string;
  modelId: string | null;
  status: string;
  liveProviderCalled: boolean;
  estimatedCostUsd: number | null;
  actualCostUsd: number | null;
  providerSelectionReason: string;
  /** Sensitive material reference ids redacted. */
  inputMaterialCount: number;
  excludedMaterialCount: number;
  redactedKeys: string[];
}

const SENSITIVE_AUDIT_KEY_PATTERN =
  /(password|secret|token|api[_-]?key|authorization|cookie|session|credential|bearer|sk-or-)/i;

/**
 * G625 — Assert orchestrator plan/preview remains local-only safe (no live call).
 */
export function assertOrchestratorLocalOnlySafety(
  plan: AiOrchestratorLitePlanResult
): AiOrchestratorLocalOnlySafetySnapshot {
  const violations: string[] = [];
  const liveProviderCalled = plan.preview.audit.liveProviderCalled;
  const ledgerLive = plan.plannedLedgerMetadata.liveProviderCalled;
  const executionMode = plan.preview.executionMode;
  const executionModeLocalOrDisabled = executionMode === "local" || executionMode === "disabled";
  const actualCostUsdNull = plan.preview.audit.actualCostUsd == null;

  if (liveProviderCalled !== false) {
    violations.push("preview.audit.liveProviderCalled must be false on plan/preview.");
  }
  if (ledgerLive !== false) {
    violations.push("plannedLedgerMetadata.liveProviderCalled must be false.");
  }
  if (!executionModeLocalOrDisabled) {
    violations.push(`executionMode "${executionMode}" is not local/disabled.`);
  }
  if (!actualCostUsdNull) {
    violations.push("preview.audit.actualCostUsd must remain null until trusted ingestion.");
  }

  return {
    version: AI_LOCAL_GUARD_ORCHESTRATOR_VERSION,
    ok: violations.length === 0,
    liveProviderCalled: false,
    executionModeLocalOrDisabled,
    ledgerLiveProviderCalled: false,
    actualCostUsdNull,
    violations
  };
}

/**
 * G626 — Normalize blocked routing reason for operator-safe assertions.
 */
export function summarizeOrchestratorBlockedRouting(plan: AiOrchestratorLitePlanResult): {
  blocked: boolean;
  canExecute: boolean;
  ledgerStatus: "PREVIEW" | "BLOCKED";
  routingBlocked: boolean;
  blockedReason: string | null;
  routingTaskType: string;
} {
  return {
    blocked: !plan.canExecute,
    canExecute: plan.canExecute,
    ledgerStatus: plan.plannedLedgerMetadata.ledgerStatus,
    routingBlocked: plan.preview.modelRouting.blocked,
    blockedReason: plan.blockedReason,
    routingTaskType: plan.preview.modelRouting.routingTaskType
  };
}

/**
 * G627 — Disabled-gateway / no-live truth labels for orchestrator preview paths.
 */
export function buildOrchestratorDisabledGatewayTruthLabels(input: {
  plan: AiOrchestratorLitePlanResult;
  textGateway?: "disabled" | "local" | "openrouter" | null;
}): { version: typeof AI_LOCAL_GUARD_ORCHESTRATOR_VERSION; labels: AiOrchestratorDisabledGatewayTruthLabelRow[] } {
  const plan = input.plan;
  const textGateway = input.textGateway ?? "local";
  const liveProviderCalled = plan.preview.audit.liveProviderCalled;
  const isDeterministicFallback =
    plan.preview.providerKey === "local_deterministic" ||
    plan.preview.executionMode === "local" ||
    plan.preview.executionMode === "disabled";

  const labels: AiOrchestratorDisabledGatewayTruthLabelRow[] = [
    {
      label: "disabled_gateway_no_live",
      active: textGateway === "disabled" || plan.preview.executionMode === "disabled",
      detail:
        textGateway === "disabled" || plan.preview.executionMode === "disabled"
          ? "AI text gateway/execution is disabled; no live provider call."
          : "Gateway is not in disabled mode."
    },
    {
      label: "local_deterministic_fallback",
      active: isDeterministicFallback && !liveProviderCalled,
      detail: isDeterministicFallback
        ? `Fallback/local path active (providerKey=${plan.preview.providerKey}).`
        : "Not on local deterministic fallback."
    },
    {
      label: "preview_only_orchestrator",
      active: plan.preview.audit.status === "preview" || plan.preview.audit.status === "blocked",
      detail: `Orchestrator audit status=${plan.preview.audit.status}; execution deferred.`
    },
    {
      label: "live_provider_called_false",
      active: liveProviderCalled === false,
      detail: "Plan/preview must keep liveProviderCalled=false."
    },
    {
      label: "actual_cost_null_until_trusted",
      active: plan.preview.audit.actualCostUsd == null,
      detail:
        plan.preview.audit.actualCostUsd == null
          ? "actualCostUsd remains null until trusted provider cost source."
          : "actualCostUsd is set (trusted path only)."
    }
  ];

  return { version: AI_LOCAL_GUARD_ORCHESTRATOR_VERSION, labels };
}

/**
 * G628 — Local deterministic fallback snapshot from orchestrator plan.
 */
export function buildOrchestratorDeterministicFallbackSnapshot(
  plan: AiOrchestratorLitePlanResult
): AiOrchestratorDeterministicFallbackSnapshot {
  const providerKey = plan.preview.providerKey;
  const isLocalDeterministic =
    providerKey === "local_deterministic" ||
    plan.preview.modelId === "local-deterministic-v1" ||
    plan.preview.executionMode === "local" ||
    plan.preview.executionMode === "disabled";

  return {
    version: AI_LOCAL_GUARD_ORCHESTRATOR_VERSION,
    providerKey,
    modelId: plan.preview.modelId,
    executionMode: plan.preview.executionMode,
    liveProviderCalled: false,
    isLocalDeterministic,
    detail: isLocalDeterministic
      ? "Local deterministic / disabled-safe path; no live provider call."
      : "Plan is not on local deterministic fallback."
  };
}

/**
 * G629 — Sanitize untrusted orchestrator context/prompt edges (wraps shared sanitizer).
 */
export function sanitizeOrchestratorUntrustedContext(value: string): {
  sanitizedText: string;
  flags: string[];
  wasSanitized: boolean;
  emptyInput: boolean;
} {
  const emptyInput = value.trim().length === 0;
  const result = sanitizeUntrustedContextText(value);
  return {
    ...result,
    emptyInput
  };
}

/**
 * G630 — Build approved-knowledge inclusion log lines without raw body text.
 */
export function buildOrchestratorKnowledgeInclusionLog(
  knowledge: AiOrchestratorKnowledgeInclusionMeta | null
): AiOrchestratorKnowledgeInclusionLogResult {
  if (!knowledge) {
    const lines = ["Approved knowledge context: not loaded."];
    return {
      lines,
      usage: parseAiWorkflowContextUsageFromExecutionLog(lines.join("\n")),
      bodyTextIncluded: false
    };
  }

  if (!knowledge.used) {
    const lines = [
      `Approved knowledge context skipped: ${knowledge.skippedReason ?? "none eligible"}.`
    ];
    return {
      lines,
      usage: parseAiWorkflowContextUsageFromExecutionLog(lines.join("\n")),
      bodyTextIncluded: false
    };
  }

  const titles = knowledge.selectedItemTitles.slice(0, 3).join(", ");
  const lines = [
    `Approved knowledge context included: ${knowledge.selectedCount} item(s)${titles ? ` (${titles})` : ""}.`
  ];
  if (knowledge.trimmed) {
    lines.push("Knowledge context trimmed to satisfy workflow token budget.");
  }
  if (knowledge.sanitizeFlagCount > 0) {
    lines.push(
      `Knowledge context sanitized (${knowledge.sanitizeFlagCount} item(s) with flags).`
    );
  }

  return {
    lines,
    usage: parseAiWorkflowContextUsageFromExecutionLog(lines.join("\n")),
    bodyTextIncluded: false
  };
}

/**
 * G631 — Redact orchestrator audit metadata for operator-safe previews (no secrets).
 */
export function redactOrchestratorAuditMetadata(
  audit: AiRunAuditMetadata
): AiOrchestratorRedactedAuditMetadata {
  const redactedKeys: string[] = [];
  let providerSelectionReason = audit.providerSelectionReason;
  if (SENSITIVE_AUDIT_KEY_PATTERN.test(providerSelectionReason)) {
    providerSelectionReason = providerSelectionReason.replace(
      SENSITIVE_AUDIT_KEY_PATTERN,
      "[REDACTED]"
    );
    redactedKeys.push("providerSelectionReason");
  }

  return {
    orchestratorVersion: audit.orchestratorVersion,
    workflowReference: audit.workflowReference,
    stepReference: audit.stepReference,
    clientId: audit.clientId,
    agentRole: audit.agentRole,
    providerKey: audit.providerKey,
    modelId: audit.modelId,
    status: audit.status,
    liveProviderCalled: audit.liveProviderCalled,
    estimatedCostUsd: audit.estimatedCostUsd,
    actualCostUsd: audit.actualCostUsd,
    providerSelectionReason,
    inputMaterialCount: audit.inputMaterials.length,
    excludedMaterialCount: audit.excludedMaterials.length,
    redactedKeys
  };
}

/**
 * G631 helper — sanitize workflow result JSON preview (shared contract; no secrets).
 */
export function redactOrchestratorWorkflowResultPreview(
  resultPlaceholder: string | null | undefined,
  maxLength = 4000
): string | null {
  return buildSanitizedAiWorkflowJsonPreview(resultPlaceholder, maxLength);
}
