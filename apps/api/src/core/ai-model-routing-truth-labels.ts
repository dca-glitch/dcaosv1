/**
 * AI model routing truth labels (G389–G408).
 * Operator-facing labels for routing audit / live-proof status — no live calls.
 */

import {
  AI_MODEL_ROUTING_POLICY_VERSION,
  AI_MODEL_ROUTING_TRUTH_LABELS,
  type AiModelRouteAudit,
  type AiModelRoutingTruthLabel
} from "@dca-os-v1/shared";

export const AI_MODEL_ROUTING_TRUTH_LABELS_VERSION = "AI_MODEL_ROUTING_TRUTH_LABELS_V1";

export type { AiModelRoutingTruthLabel };
export { AI_MODEL_ROUTING_TRUTH_LABELS };

export interface AiModelRoutingTruthLabelRow {
  label: AiModelRoutingTruthLabel;
  active: boolean;
  detail: string;
}

export interface AiModelRoutingTruthSnapshot {
  version: typeof AI_MODEL_ROUTING_TRUTH_LABELS_VERSION;
  policyVersion: typeof AI_MODEL_ROUTING_POLICY_VERSION;
  labels: AiModelRoutingTruthLabelRow[];
}

export function buildAiModelRoutingTruthLabels(input: {
  audit: AiModelRouteAudit;
  liveProviderCalled?: boolean;
  actualCostUsd?: number | null;
  attributionMode?: "preview" | "mocked_completed" | "live_completed";
}): AiModelRoutingTruthSnapshot {
  const liveProviderCalled = input.liveProviderCalled ?? false;
  const attributionMode = input.attributionMode ?? "preview";
  const actualCostUsd = input.actualCostUsd ?? null;

  const labels: AiModelRoutingTruthLabelRow[] = [
    {
      label: "backend_policy_selected",
      active: !input.audit.blocked,
      detail: input.audit.selectionReason
    },
    {
      label: "model_override_rejected",
      active: input.audit.modelOverrideRejected,
      detail: input.audit.modelOverrideRejected
        ? "Unapproved model override rejected; backend policy model retained."
        : "No unapproved model override present."
    },
    {
      label: "route_blocked_admin_review",
      active: input.audit.blocked,
      detail: input.audit.blockedReason ?? "Route is not blocked."
    },
    {
      label: "live_eligible_budget_ledger_required",
      active: input.audit.allowLive && input.audit.requiresBudgetLedger,
      detail: input.audit.allowLive
        ? `Live-eligible route requires budget ledger; maxCostUsdPerRun=$${input.audit.maxCostUsdPerRun}.`
        : "Route is not live-eligible."
    },
    {
      label: "live_disabled_conservative",
      active: !input.audit.allowLive,
      detail: !input.audit.allowLive
        ? "Live disabled for this route until explicit owner approval."
        : "Live is allowed by policy (still subject to env/kill-switch)."
    },
    {
      label: "preview_only_no_live_call",
      active: attributionMode === "preview" && !liveProviderCalled,
      detail: "Preview/plan path must keep liveProviderCalled=false."
    },
    {
      label: "completed_attribution_mocked",
      active: attributionMode === "mocked_completed",
      detail: "Completed attribution under test uses mocked provider execution only."
    },
    {
      label: "actual_cost_null_until_trusted_source",
      active: actualCostUsd == null,
      detail:
        actualCostUsd == null
          ? "actualCostUsd is null until a trusted provider cost source is integrated."
          : `Trusted actualCostUsd=${actualCostUsd} recorded.`
    }
  ];

  return {
    version: AI_MODEL_ROUTING_TRUTH_LABELS_VERSION,
    policyVersion: AI_MODEL_ROUTING_POLICY_VERSION,
    labels
  };
}
