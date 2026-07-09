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

type RegistryPayload = {
  registry: {
    orchestratorVersion: string;
    agentRoles: Array<{ role: string; label: string }>;
    providerRegistry: {
      providers: ProviderEntry[];
      roleMappings: RoleMapping[];
    };
  };
  purivaPolicyProfile: {
    monthlyAiCapUsd: number;
    scope: { website: boolean; socialMedia: boolean; paidAds: boolean };
  };
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
  };
  canExecute: boolean;
  blockedReason: string | null;
};

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
  if (mode === "live") return "Live";
  if (mode === "local") return "Local";
  return "Disabled";
}

export function AiOrchestratorLitePanel() {
  const [registry, setRegistry] = useState<RegistryPayload | null>(null);
  const [plan, setPlan] = useState<MaterialRoutingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);

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
    setPreviewLoading(true);
    setError(null);
    const response = await apiRequest<{ plan: MaterialRoutingPlan }>(
      "POST",
      "/ai-orchestrator-lite/material-routing-preview",
      {
        workflow: "puriva_content_production",
        step: "article_draft",
        agentRole: "content_drafting_agent",
        taskType: "article_draft",
        operatingPackKey: "puriva"
      }
    );
    if (!response.ok) {
      setPlan(null);
      setError(response.error.message || "Unable to generate material routing preview.");
      setPreviewLoading(false);
      return;
    }
    setPlan(response.data.plan);
    setPreviewLoading(false);
  };

  useEffect(() => {
    void loadRegistry();
  }, []);

  const providers = registry?.registry.providerRegistry.providers ?? [];
  const roleMappings = registry?.registry.providerRegistry.roleMappings ?? [];

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
              <StatusBadge status="Ready" />
              <span className="muted-text">${registry.purivaPolicyProfile.monthlyAiCapUsd} USD</span>
            </div>
            <div className="admin-operations-row">
              <span className="muted-text">Orchestrator version</span>
              <StatusBadge status="System" />
              <span className="muted-text">{registry.registry.orchestratorVersion}</span>
            </div>
            <p className="muted-text admin-operations-footnote">
              Actual live spend ledger is deferred — estimates only. No live provider calls from this panel.
            </p>
            {roleMappings.map((mapping) => {
              const provider = providers.find((entry) => entry.providerKey === mapping.primaryProviderKey);
              const roleLabel =
                registry.registry.agentRoles.find((role) => role.role === mapping.role)?.label ?? mapping.role;
              return (
                <div className="admin-operations-row" key={mapping.role}>
                  <span className="muted-text">{roleLabel}</span>
                  <StatusBadge status={provider?.enabled ? "Ready" : "Inactive"} />
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
        description="Preview-only routing for Puriva article draft step — no execution."
        action={
          <Button onClick={() => void runPreview()} size="sm" variant="secondary" disabled={previewLoading}>
            {previewLoading ? "Previewing…" : "Run sample preview"}
          </Button>
        }
      >
        {error && registry ? (
          <p className="muted-text" role="alert">{error}</p>
        ) : null}
        {plan ? (
          <div className="admin-operations-grid">
            <div className="admin-operations-row">
              <span className="muted-text">Can execute</span>
              <StatusBadge status={plan.canExecute ? "Ready" : "Warning"} />
              <span className="muted-text">{plan.blockedReason ?? "Policy and budget checks passed."}</span>
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
              <span className="muted-text">Budget remaining</span>
              <StatusBadge status={plan.preview.budget.projectedOverBudget ? "Warning" : "Ready"} />
              <span className="muted-text">
                ${plan.preview.budget.remainingBudgetUsd} of ${plan.preview.budget.monthlyCapUsd} USD
              </span>
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
          <p className="muted-text">Run sample preview to see routing, policy, and budget estimate.</p>
        )}
      </SectionPanel>
    </div>
  );
}
