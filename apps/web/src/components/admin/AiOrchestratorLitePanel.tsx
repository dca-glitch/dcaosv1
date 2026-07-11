import { useEffect, useState } from "react";
import { Button, SectionPanel, StatusBadge } from "../ui";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error: { code: string; message: string } };
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type ProviderEntry = {
  providerKey: string;
  displayName: string;
  modelId: string | null;
  enabled: boolean;
  environment: string;
  executionMode: string;
  fallbackProviderKey: string | null;
  timeoutMs: number;
  retryLimit: number;
};

type RoleMapping = {
  role: string;
  primaryProviderKey: string;
  fallbackProviderKey: string | null;
};

type KillSwitchSnapshot = {
  orchestratorLiveSafe: boolean;
  anyLiveProviderEnabled: boolean;
  textGatewayLive: boolean;
  imageGenerationLive: boolean;
  notes: string[];
};

type BudgetLedgerSummary = {
  periodKey: string;
  spentThisPeriodUsd: number;
  entryCount: number;
};

type NotificationEvent = {
  eventType: string;
  message: string;
  workflowReference: string | null;
  noSend: true;
};

type IntegrationBoundary = {
  liveProofPending: boolean;
  purivaBlockers: string[];
  categories: Array<{ category: string; status: string; liveCallsDeferred: true }>;
};

type ModelRoutingAudit = {
  policyVersion: string;
  routingTaskType: string;
  gateway: string;
  primaryModel: string | null;
  fallbackBehavior: string;
  allowLive: boolean;
  requiresBudgetLedger: boolean;
  maxCostUsdPerRun: number;
  complianceProfile: string;
  blocked: boolean;
  modelOverrideRejected: boolean;
  selectionReason: string;
};

type ModelRoutingPolicySnapshot = {
  policyVersion: string;
  approvedModels: string[];
  routes: Array<{ taskType: string; primaryModel: string | null; allowLive: boolean }>;
};

type RegistryPayload = {
  registry: {
    orchestratorVersion: string;
    agentRoles:
      | Array<{ role: string; label: string }>
      | Record<string, { role: string; label: string }>;
    providerRegistry: {
      providers: ProviderEntry[];
      roleMappings: RoleMapping[];
    };
    modelRoutingPolicy?: ModelRoutingPolicySnapshot;
  };
  purivaPolicyProfile: {
    monthlyAiCapUsd: number;
    scope: { website: boolean; socialMedia: boolean; paidAds: boolean };
    workflowPreset: string[];
  };
  killSwitch?: KillSwitchSnapshot;
  budgetLedger?: BudgetLedgerSummary;
  recentNotificationEvents?: NotificationEvent[];
  integrationBoundary?: IntegrationBoundary;
};

type MaterialRoutingPlan = {
  preview: {
    workflow: string;
    step: string;
    agentRoleLabel: string;
    providerKey: string;
    modelId: string | null;
    executionMode: string;
    approvalRequired: boolean;
    estimatedCostUsd: number;
    inputMaterials: Array<{ materialClass: string; label: string }>;
    excludedMaterials: Array<{ materialClass: string; label: string; exclusionReason: string | null }>;
    budget: {
      monthlyCapUsd: number;
      remainingBudgetUsd: number;
      projectedOverBudget: boolean;
      killSwitchActive: boolean;
    };
    audit: { liveProviderCalled: boolean; promptTemplateVersion: string | null };
    modelRouting: ModelRoutingAudit;
  };
  canExecute: boolean;
  blockedReason: string | null;
};

type WorkflowDryRunResult = {
  adapter: {
    adapterVersion: string;
    canProceedToExecution: boolean;
    blockedReason: string | null;
    executionDeferred: true;
    dryRunOutput: {
      contractVersion: string;
      researchPack: unknown | null;
      seoPlan: unknown | null;
      contentDraftBatch: unknown | null;
    };
    plan: MaterialRoutingPlan;
  };
  budgetLedger?: BudgetLedgerSummary;
  recentNotificationEvents?: NotificationEvent[];
};

const PREVIEW_STEPS = [
  { label: "Article draft", step: "article_draft", agentRole: "content_drafting_agent", taskType: "article_draft" },
  { label: "Research pack", step: "research_pack", agentRole: "research_agent", taskType: "research_pack" },
  { label: "SEO plan", step: "seo_plan", agentRole: "seo_planning_agent", taskType: "seo_plan" }
] as const;

async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
  const token = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return (await response.json()) as ApiResponse<T>;
}

function executionModeLabel(mode: string): string {
  if (mode === "live") return "Live (config only)";
  if (mode === "local") return "Local";
  return "Disabled";
}

/** Local/config-shape badges — never unqualified Ready for orchestrator proof. */
function localOkBadge(): string {
  return "Local OK";
}

export function AiOrchestratorLitePanel() {
  const [registry, setRegistry] = useState<RegistryPayload | null>(null);
  const [plan, setPlan] = useState<MaterialRoutingPlan | null>(null);
  const [dryRun, setDryRun] = useState<WorkflowDryRunResult | null>(null);
  const [selectedStep, setSelectedStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dryRunLoading, setDryRunLoading] = useState(false);

  const loadRegistry = async () => {
    setLoading(true);
    setError(null);
    const response = await apiRequest<RegistryPayload>("GET", "/ai-orchestrator-lite/registry");
    if (!response.ok) {
      setRegistry(null);
      setError(response.error.message || "Unable to load AI orchestrator registry.");
      setLoading(false);
      return;
    }
    setRegistry(response.data);
    setLoading(false);
  };

  const runPreview = async () => {
    const stepConfig = PREVIEW_STEPS[selectedStep];
    setPreviewLoading(true);
    setError(null);
    const response = await apiRequest<{ plan: MaterialRoutingPlan; budgetLedger?: BudgetLedgerSummary }>(
      "POST",
      "/ai-orchestrator-lite/material-routing-preview",
      {
        workflow: "puriva_content_production",
        step: stepConfig.step,
        agentRole: stepConfig.agentRole,
        taskType: stepConfig.taskType,
        operatingPackKey: "puriva",
        stepReference: `puriva_content_production:${stepConfig.step}`
      }
    );
    if (!response.ok) {
      setPlan(null);
      setError(response.error.message || "Unable to generate material routing preview.");
      setPreviewLoading(false);
      return;
    }
    setPlan(response.data.plan);
    if (response.data.budgetLedger && registry) {
      setRegistry({ ...registry, budgetLedger: response.data.budgetLedger });
    }
    setPreviewLoading(false);
  };

  const runWorkflowDryRun = async () => {
    const stepConfig = PREVIEW_STEPS[selectedStep];
    setDryRunLoading(true);
    setError(null);
    const response = await apiRequest<WorkflowDryRunResult>("POST", "/ai-orchestrator-lite/workflow-dry-run", {
      workflow: "puriva_content_production",
      step: stepConfig.step,
      agentRole: stepConfig.agentRole,
      taskType: stepConfig.taskType,
      operatingPackKey: "puriva",
      stepReference: `puriva_content_production:${stepConfig.step}`
    });
    if (!response.ok) {
      setDryRun(null);
      setError(response.error.message || "Unable to run workflow dry-run.");
      setDryRunLoading(false);
      return;
    }
    setDryRun(response.data);
    setPlan(response.data.adapter.plan);
    if (response.data.budgetLedger && registry) {
      setRegistry({
        ...registry,
        budgetLedger: response.data.budgetLedger,
        recentNotificationEvents: response.data.recentNotificationEvents ?? registry.recentNotificationEvents
      });
    }
    setDryRunLoading(false);
  };

  useEffect(() => {
    void loadRegistry();
  }, []);

  const providers = registry?.registry.providerRegistry.providers ?? [];
  const roleMappings = registry?.registry.providerRegistry.roleMappings ?? [];
  const agentRoles = Array.isArray(registry?.registry.agentRoles)
    ? registry.registry.agentRoles
    : registry?.registry.agentRoles
      ? Object.values(registry.registry.agentRoles)
      : [];
  const killSwitch = registry?.killSwitch;
  const budgetLedger = registry?.budgetLedger;
  const events = registry?.recentNotificationEvents ?? [];

  return (
    <div className="admin-operations-stack" aria-label="AI Orchestrator Lite pre-live panel">
      <SectionPanel
        tone="compact"
        title="AI Orchestrator Lite registry"
        description="Read-only provider/role registry — disabled-safe; no live test buttons or secrets."
        action={
          <Button onClick={() => void loadRegistry()} size="sm" variant="secondary">
            Refresh
          </Button>
        }
      >
        {loading ? (
          <p className="muted-text">Loading orchestrator registry…</p>
        ) : error && !registry ? (
          <p className="muted-text" role="alert">{error}</p>
        ) : registry ? (
          <div className="admin-operations-grid">
            <div className="admin-operations-row">
              <span className="muted-text">Puriva monthly AI cap</span>
              <StatusBadge status={localOkBadge()} />
              <span className="muted-text">${registry.purivaPolicyProfile.monthlyAiCapUsd} USD</span>
            </div>
            <div className="admin-operations-row">
              <span className="muted-text">Orchestrator version</span>
              <StatusBadge status="System" />
              <span className="muted-text">{registry.registry.orchestratorVersion}</span>
            </div>
            {registry.registry.modelRoutingPolicy ? (
              <div className="admin-operations-row">
                <span className="muted-text">Model routing policy</span>
                <StatusBadge status="System" />
                <span className="muted-text">
                  {registry.registry.modelRoutingPolicy.policyVersion} ·{" "}
                  {registry.registry.modelRoutingPolicy.approvedModels.join(", ")}
                </span>
              </div>
            ) : null}
            {budgetLedger ? (
              <div className="admin-operations-row">
                <span className="muted-text">Persistent ledger ({budgetLedger.periodKey})</span>
                <StatusBadge status={budgetLedger.spentThisPeriodUsd > 0 ? "Warning" : localOkBadge()} />
                <span className="muted-text">
                  ${budgetLedger.spentThisPeriodUsd} spent · {budgetLedger.entryCount} entries
                </span>
              </div>
            ) : null}
            {killSwitch ? (
              <div className="admin-operations-row">
                <span className="muted-text">Kill switch / live-safe</span>
                <StatusBadge status={killSwitch.orchestratorLiveSafe ? localOkBadge() : "Warning"} />
                <span className="muted-text">
                  {killSwitch.orchestratorLiveSafe
                    ? "Orchestrator config-safe (no live proof)"
                    : "Live flags detected — preview only"}
                </span>
              </div>
            ) : null}
            <p className="muted-text admin-operations-footnote">
              Dry-run ledger records preview estimates only. No live provider calls from this panel.
            </p>
            {roleMappings.map((mapping) => {
              const provider = providers.find((entry) => entry.providerKey === mapping.primaryProviderKey);
              const roleLabel = agentRoles.find((role) => role.role === mapping.role)?.label ?? mapping.role;
              return (
                <div className="admin-operations-row" key={mapping.role}>
                  <span className="muted-text">{roleLabel}</span>
                  <StatusBadge status={provider?.enabled ? localOkBadge() : "Inactive"} />
                  <span className="muted-text" title={provider?.displayName ?? mapping.primaryProviderKey}>
                    {provider?.displayName ?? mapping.primaryProviderKey} · {executionModeLabel(provider?.executionMode ?? "disabled")}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </SectionPanel>

      <SectionPanel
        tone="compact"
        title="Material routing preview"
        description="Preview-only routing for Puriva workflow steps — no execution."
        action={
          <div className="admin-operations-inline-actions">
            <select
              className="admin-operations-select"
              value={selectedStep}
              onChange={(event) => setSelectedStep(Number(event.target.value))}
              aria-label="Workflow step"
            >
              {PREVIEW_STEPS.map((entry, index) => (
                <option key={entry.step} value={index}>
                  {entry.label}
                </option>
              ))}
            </select>
            <Button onClick={() => void runPreview()} size="sm" variant="secondary" disabled={previewLoading}>
              {previewLoading ? "Previewing…" : "Run preview"}
            </Button>
            <Button onClick={() => void runWorkflowDryRun()} size="sm" variant="secondary" disabled={dryRunLoading}>
              {dryRunLoading ? "Dry-running…" : "Workflow dry-run"}
            </Button>
          </div>
        }
      >
        {error && registry ? (
          <p className="muted-text" role="alert">{error}</p>
        ) : null}
        {plan ? (
          <div className="admin-operations-grid">
            <div className="admin-operations-row">
              <span className="muted-text">Can execute</span>
              <StatusBadge status={plan.canExecute ? localOkBadge() : "Warning"} />
              <span className="muted-text">{plan.blockedReason ?? "Policy and budget checks passed (preview only)."}</span>
            </div>
            <div className="admin-operations-row">
              <span className="muted-text">Provider / model</span>
              <StatusBadge status="System" />
              <span className="muted-text">
                {plan.preview.providerKey}
                {plan.preview.modelId ? ` · ${plan.preview.modelId}` : ""}
              </span>
            </div>
            <div className="admin-operations-row">
              <span className="muted-text">Model routing</span>
              <StatusBadge status={plan.preview.modelRouting.blocked ? "Warning" : localOkBadge()} />
              <span className="muted-text">
                {plan.preview.modelRouting.routingTaskType} · {plan.preview.modelRouting.gateway}
                {plan.preview.modelRouting.primaryModel ? ` · ${plan.preview.modelRouting.primaryModel}` : ""}
              </span>
            </div>
            <div className="admin-operations-row">
              <span className="muted-text">Route cost cap / live</span>
              <StatusBadge status={plan.preview.modelRouting.allowLive ? "Live flag on" : "Inactive"} />
              <span className="muted-text">
                ${plan.preview.modelRouting.maxCostUsdPerRun} cap · live{" "}
                {plan.preview.modelRouting.allowLive ? "flag on (not proven)" : "blocked"} · ledger{" "}
                {plan.preview.modelRouting.requiresBudgetLedger ? "required" : "optional"}
              </span>
            </div>
            <div className="admin-operations-row">
              <span className="muted-text">Budget remaining</span>
              <StatusBadge status={plan.preview.budget.projectedOverBudget ? "Warning" : localOkBadge()} />
              <span className="muted-text">
                ${plan.preview.budget.remainingBudgetUsd} of ${plan.preview.budget.monthlyCapUsd} USD
              </span>
            </div>
            <div className="admin-operations-row">
              <span className="muted-text">Budget kill switch</span>
              <StatusBadge status={plan.preview.budget.killSwitchActive ? "Warning" : "Inactive"} />
              <span className="muted-text">{plan.preview.budget.killSwitchActive ? "active" : "inactive"}</span>
            </div>
            <div className="admin-operations-row">
              <span className="muted-text">Live provider called</span>
              <StatusBadge status="Inactive" />
              <span className="muted-text">{plan.preview.audit.liveProviderCalled ? "yes" : "no"}</span>
            </div>
            <p className="muted-text admin-operations-footnote">
              Included: {plan.preview.inputMaterials.map((m) => m.label).join(", ") || "none"} · Excluded:{" "}
              {plan.preview.excludedMaterials.map((m) => m.label).join(", ") || "none"}
            </p>
          </div>
        ) : (
          <p className="muted-text">Run preview or workflow dry-run to see routing, policy, and budget estimate.</p>
        )}
        {dryRun?.adapter.dryRunOutput ? (
          <p className="muted-text admin-operations-footnote">
            Dry-run contract: {dryRun.adapter.dryRunOutput.contractVersion}
            {dryRun.adapter.dryRunOutput.researchPack ? " · research pack placeholder" : ""}
            {dryRun.adapter.dryRunOutput.seoPlan ? " · SEO plan placeholder" : ""}
            {dryRun.adapter.dryRunOutput.contentDraftBatch ? " · content draft batch placeholder" : ""}
          </p>
        ) : null}
      </SectionPanel>

      {registry?.integrationBoundary ? (
        <SectionPanel
          tone="compact"
          title="Puriva integration boundaries"
          description="Config-shape / dry-run only — not staging or production proof."
        >
          <div className="admin-operations-grid">
            {registry.integrationBoundary.categories.map((category) => (
              <div className="admin-operations-row" key={category.category}>
                <span className="muted-text">{category.category}</span>
                <StatusBadge status={category.status === "disabled" ? "Inactive" : "System"} />
                <span className="muted-text">{category.status}</span>
              </div>
            ))}
            <p className="muted-text admin-operations-footnote">
              Live proof pending: {registry.integrationBoundary.purivaBlockers.slice(0, 3).join("; ")}…
            </p>
          </div>
        </SectionPanel>
      ) : null}

      {events.length > 0 ? (
        <SectionPanel
          tone="compact"
          title="Recent notification events (no-send)"
          description="Internal dry-run events only — no live email delivery."
        >
          <div className="admin-operations-grid">
            {events.map((event, index) => (
              <div className="admin-operations-row" key={`${event.eventType}-${index}`}>
                <span className="muted-text">{event.eventType}</span>
                <StatusBadge status="System" />
                <span className="muted-text">{event.message}</span>
              </div>
            ))}
          </div>
        </SectionPanel>
      ) : null}
    </div>
  );
}
