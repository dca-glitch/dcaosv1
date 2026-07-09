import { useEffect, useState } from "react";
import { Button, SectionPanel, StatusBadge } from "../ui";
import { AiOrchestratorLitePanel } from "./AiOrchestratorLitePanel";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error: { code: string; message: string } };
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type IntegrationCategory = {
  key: string;
  label: string;
  status: "disabled" | "missing_config" | "configured_shape_ok";
  detail: string;
};

type AdminOperationsSummary = {
  generatedAtIso: string;
  database: { status: "ready" | "not_ready"; message: string };
  externalIntegrations: {
    categories: IntegrationCategory[];
    summary: { liveExecutionBlocked: boolean; noLiveCallsInThisLayer: boolean };
  };
  closeoutGuidance: {
    status: "manual_run_required";
    note: string;
    runbookPath: string;
    recommendedCommands: string[];
    logHint: string;
  };
  recoveryHints: Array<{
    key: string;
    title: string;
    symptoms: string;
    steps: string[];
  }>;
  operationalAuditEvents: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: string;
  }>;
  operationalAuditNote: string;
};

function readinessStatusLabel(status: IntegrationCategory["status"]): string {
  if (status === "disabled") return "Disabled";
  if (status === "missing_config") return "Missing config";
  return "Shape OK";
}

function readinessBadgeStatus(status: IntegrationCategory["status"]): string {
  if (status === "configured_shape_ok") return "Ready";
  if (status === "missing_config") return "Warning";
  return "Inactive";
}

function formatAuditActionLabel(action: string): string {
  return action
    .replace(/[.:]/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^|\s)\S/g, (segment) => segment.toUpperCase());
}

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

async function apiRequest<T>(path: string): Promise<ApiResponse<T>> {
  const token = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { headers });
  const body = (await response.json()) as ApiResponse<T>;
  return body;
}

export function AdminOperationsPanel() {
  const [summary, setSummary] = useState<AdminOperationsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedHintKey, setExpandedHintKey] = useState<string | null>(null);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    const response = await apiRequest<{ summary: AdminOperationsSummary }>("/admin/operations/summary");
    if (!response.ok) {
      setSummary(null);
      setError(response.error.message || "Unable to load operational summary.");
      setLoading(false);
      return;
    }

    setSummary(response.data.summary);
    setLoading(false);
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  return (
    <div className="admin-operations-stack" aria-label="Admin operational readiness">
      <SectionPanel
        tone="compact"
        title="Operational readiness"
        description="Read-only local signals — config shape only; no live provider, publish, sync, or bucket calls."
        action={
          <Button onClick={() => void loadSummary()} size="sm" variant="secondary">
            Refresh
          </Button>
        }
      >
        {loading ? (
          <p className="muted-text">Loading operational summary…</p>
        ) : error ? (
          <p className="muted-text" role="alert">{error}</p>
        ) : summary ? (
          <div className="admin-operations-grid">
            <div className="admin-operations-row">
              <span className="muted-text">Database</span>
              <StatusBadge status={summary.database.status === "ready" ? "Ready" : "Warning"} />
              <span className="muted-text">{summary.database.message}</span>
            </div>
            {summary.externalIntegrations.categories.map((category) => (
              <div className="admin-operations-row" key={category.key}>
                <span className="muted-text">{category.label}</span>
                <StatusBadge status={readinessBadgeStatus(category.status)} />
                <span className="muted-text" title={category.detail}>
                  {readinessStatusLabel(category.status)}
                </span>
              </div>
            ))}
            <p className="muted-text admin-operations-footnote">
              Live execution blocked: {summary.externalIntegrations.summary.liveExecutionBlocked ? "yes" : "no"} ·
              readiness layer makes no live calls: {summary.externalIntegrations.summary.noLiveCallsInThisLayer ? "yes" : "no"}
            </p>
          </div>
        ) : null}
      </SectionPanel>

      {summary ? (
        <>
          <SectionPanel
            tone="compact"
            title="Local closeout commands"
            description={summary.closeoutGuidance.note}
          >
            <ul className="admin-operations-command-list muted-text">
              {summary.closeoutGuidance.recommendedCommands.map((command) => (
                <li key={command}>
                  <code>{command}</code>
                </li>
              ))}
            </ul>
            <p className="muted-text">{summary.closeoutGuidance.logHint}</p>
            <p className="muted-text">Runbook: {summary.closeoutGuidance.runbookPath}</p>
          </SectionPanel>

          <SectionPanel tone="compact" title="Recovery hints" description="Common operator failures — no secrets required.">
            <div className="admin-operations-hints">
              {summary.recoveryHints.map((hint) => {
                const expanded = expandedHintKey === hint.key;
                return (
                  <div className="admin-operations-hint" key={hint.key}>
                    <button
                      className="subtle-action admin-operations-hint-toggle"
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setExpandedHintKey(expanded ? null : hint.key)}
                    >
                      {hint.title}
                    </button>
                    <p className="muted-text">{hint.symptoms}</p>
                    {expanded ? (
                      <ol className="muted-text admin-operations-hint-steps">
                        {hint.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </SectionPanel>

          <SectionPanel
            tone="compact"
            title="Operational audit events"
            description={summary.operationalAuditNote}
          >
            {summary.operationalAuditEvents.length === 0 ? (
              <p className="inline-empty muted-text">No matching audit events yet. WordPress config, publication, workflow, or module changes will appear here.</p>
            ) : (
              <div className="audit-feed timeline-list" role="list" aria-label="Operational audit events">
                {summary.operationalAuditEvents.map((event) => (
                  <article className="audit-feed-item timeline-item" key={event.id} role="listitem">
                    <span aria-hidden="true" />
                    <div className="audit-feed-body">
                      <div className="audit-feed-header">
                        <strong>{formatAuditActionLabel(event.action)}</strong>
                        <StatusBadge status="System" />
                      </div>
                      <div className="audit-feed-meta muted-text">{formatTimestamp(event.createdAt)}</div>
                      <div className="audit-feed-entity muted-text">
                        {event.entityType}
                        {event.entityId ? ` · ${event.entityId}` : ""}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionPanel>
        </>
      ) : null}

      <AiOrchestratorLitePanel />
    </div>
  );
}
