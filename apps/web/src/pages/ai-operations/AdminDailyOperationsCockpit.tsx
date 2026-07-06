import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { AiOperationsRunListItem, AiOperationsRunsResponse } from "@dca-os-v1/shared";
import { Button, MetricCard, PageHeader, SectionPanel, StatusBadge } from "../../components/ui";
import { Alert, Spinner } from "../../design-system";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error: { code: string; message: string } };
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type ActionPriority = "critical" | "high" | "normal";

interface DailyAction {
  id: string;
  priority: ActionPriority;
  category: "approval" | "review" | "blocked" | "handoff" | "waiting";
  title: string;
  context: string;
  relatedRun?: AiOperationsRunListItem;
  timestamp?: string | null;
}

async function apiRequest<T>(path: string): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { headers });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok && payload.ok) {
    return {
      ok: false,
      error: { code: "REQUEST_FAILED", message: "Request could not be completed." }
    };
  }
  return payload;
}

function generateDailyActions(runs: AiOperationsRunListItem[]): DailyAction[] {
  const actions: DailyAction[] = [];

  const runsByStatus = new Map<string, AiOperationsRunListItem[]>();
  runs.forEach((run) => {
    const status = run.status || "unknown";
    if (!runsByStatus.has(status)) {
      runsByStatus.set(status, []);
    }
    runsByStatus.get(status)!.push(run);
  });

  const failedRuns = runsByStatus.get("failed") || [];
  failedRuns.slice(0, 3).forEach((run) => {
    actions.push({
      id: `failed-${run.id}`,
      priority: "critical",
      category: "review",
      title: `Needs review: ${run.shortId} (${run.projectName})`,
      context: `${run.workflowType || "workflow"} needs follow-up`,
      relatedRun: run,
      timestamp: run.executedAt
    });
  });

  const pendingRuns = runsByStatus.get("pending_approval") || [];
  pendingRuns.slice(0, 3).forEach((run) => {
    actions.push({
      id: `approval-${run.id}`,
      priority: "high",
      category: "approval",
      title: `Ready now: ${run.shortId} (${run.projectName})`,
      context: run.outputType
        ? `${run.outputType} ready for your decision`
        : "Workflow output ready for your decision",
      relatedRun: run,
      timestamp: run.executedAt
    });
  });

  const inProgressRuns = runsByStatus.get("in_progress") || [];
  if (inProgressRuns.length > 0) {
    actions.push({
      id: "long-running",
      priority: "normal",
      category: "waiting",
      title: `${inProgressRuns.length} workflow${inProgressRuns.length !== 1 ? "s" : ""} in progress`,
      context: `Longest running: ${inProgressRuns[0].projectName} (${inProgressRuns[0].workflowType || "standard"})`
    });
  }

  const blockedRuns = runsByStatus.get("blocked") || [];
  blockedRuns.slice(0, 2).forEach((run) => {
    actions.push({
      id: `blocked-${run.id}`,
      priority: "high",
      category: "blocked",
      title: `Blocked: ${run.shortId} (${run.projectName})`,
      context: "Waiting on owner approval, external input, or a missing dependency",
      relatedRun: run,
      timestamp: run.executedAt
    });
  });

  return actions;
}

function buildCompactMetrics(runs: AiOperationsRunListItem[]): {
  totalRuns: number;
  readyCount: number;
  needsReviewCount: number;
  failedCount: number;
  pendingCount: number;
  completedToday: number;
  blockedCount: number;
  costEstimate: string;
} {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const totalRuns = runs.length;
  const failedCount = runs.filter((r) => r.status === "failed").length;
  const pendingCount = runs.filter((r) => r.status === "pending_approval").length;
  const blockedCount = runs.filter((r) => r.status === "blocked").length;
  const readyCount = pendingCount;
  const needsReviewCount = failedCount;
  const completedToday = runs.filter((r) => {
    const execTime = r.executedAt || "";
    return execTime >= todayStart && (r.status === "completed" || r.status === "success");
  }).length;

  const totalTokens = runs.reduce((sum, r) => sum + (r.approximateInputTokens || 0), 0);
  const costEstimate = totalTokens > 0 ? `~${Math.round(totalTokens / 1000)}k tokens` : "—";

  return {
    totalRuns,
    readyCount,
    needsReviewCount,
    failedCount,
    pendingCount,
    completedToday,
    blockedCount,
    costEstimate
  };
}

const PURIVA_DAILY_PATH = [
  "Intake and compliance",
  "Approved KB/context",
  "WorkflowBriefs",
  "AI SEO plan",
  "Content and compliance review",
  "Client approval",
  "Monthly report and archive"
];

function ActionStripItem({
  action,
  onViewRun
}: {
  action: DailyAction;
  onViewRun?: (runId: string) => void;
}) {
  const badgeStatus =
    action.category === "approval"
      ? "ready"
      : action.category === "waiting"
        ? "pending"
        : action.category;
  const relatedRun = action.relatedRun;

  return (
    <div className="action-strip-item" data-priority={action.priority}>
      <div className="action-strip-badge">
        <StatusBadge status={badgeStatus} />
      </div>
      <div className="action-strip-content flex-1">
        <p className="action-strip-title">{action.title}</p>
        <p className="action-strip-context">{action.context}</p>
      </div>
      {relatedRun && onViewRun ? (
        <button
          className="action-strip-action"
          onClick={() => onViewRun(relatedRun.id)}
          type="button"
        >
          View
        </button>
      ) : null}
    </div>
  );
}

export function AdminDailyOperationsCockpit() {
  const [runs, setRuns] = useState<AiOperationsRunListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<AiOperationsRunsResponse>("/ai-operations/runs?limit=100");
      if (!response.ok) {
        setError(response.error.message);
        setRuns([]);
        return;
      }
      setRuns(response.data.runs);
      setLastRefreshed(new Date());
    } catch {
      setError("Unable to load operations cockpit.");
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const dailyActions = useMemo(() => generateDailyActions(runs), [runs]);
  const metrics = useMemo(() => buildCompactMetrics(runs), [runs]);
  const readyNowActions = dailyActions.filter((action) => action.category === "approval");
  const needsReviewActions = dailyActions.filter((action) => action.category === "review");
  const blockedOrWaitingActions = dailyActions.filter(
    (action) => action.category === "blocked" || action.category === "waiting"
  );

  const handleViewRun = useCallback((runId: string) => {
    window.location.hash = `#/ai-operations?runId=${runId}`;
  }, []);

  const navigateTo = useCallback((hash: string) => {
    window.location.hash = hash;
  }, []);

  return (
    <div className="page-stack" data-density="compact">
      <PageHeader
        eyebrow="Admin Operations"
        title="Daily Operations Cockpit"
        description="Start with ready items, then clear blockers and keep the Puriva path moving."
        actions={
          <Button onClick={() => void loadRuns()} type="button" variant="secondary">
            Refresh
          </Button>
        }
      />

      {error ? <Alert message={error} title="Cockpit blocked" variant="danger" /> : null}

      {!loading && !error ? (
        <SectionPanel
          tone="compact"
          title="Start here — first client"
          description="New to this? Follow the local practice path in order: pick one client and month, add a brief, run the SEO plan, review a draft, package a deliverable, then finalize the monthly report for client archive visibility."
        >
          <div className="stack gap-sm">
            <Button onClick={() => navigateTo("#/workflow-briefs")} type="button" variant="primary">
              Start with Workflow Briefs / AI SEO
            </Button>
            <p className="muted-copy compact">
              This is a local/admin practice path only. It does not imply staging, production, or live-integration readiness.
            </p>
          </div>
        </SectionPanel>
      ) : null}

      {loading ? (
        <div className="state-panel loading-state-panel" role="status">
          <Spinner size="md" />
          <span>Loading daily operations...</span>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="stack gap-lg">
          <SectionPanel
            tone="compact"
            title="Status snapshot"
            description="Compact view of what needs attention right now."
          >
            <div className="summary-grid metric-grid" aria-label="Daily operations status">
              <MetricCard
                accent={metrics.readyCount > 0 ? "warning" : "success"}
                label="Ready now"
                value={metrics.readyCount}
                helper="Awaiting your review"
              />
              <MetricCard
                accent={metrics.needsReviewCount > 0 ? "warning" : "success"}
                label="Needs review"
                value={metrics.needsReviewCount}
                helper="Failed or follow-up items"
              />
              <MetricCard
                accent={metrics.blockedCount > 0 ? "warning" : "success"}
                label="Blocked / waiting"
                value={metrics.blockedCount}
                helper="Owner, dependency, or input needed"
              />
              <MetricCard
                accent="cyan"
                label="Completed today"
                value={metrics.completedToday}
                helper={`Done today · est. ${metrics.costEstimate}`}
              />
            </div>
          </SectionPanel>

          <SectionPanel
            tone="compact"
            title="Daily path"
            description="Use this sequence to keep Puriva work moving without mixing in blocked or future work. This is also the first-client operator path — see docs/operator/first-client-next-actions.md for the full local practice run."
          >
            <div className="cf-record-list">
              {PURIVA_DAILY_PATH.map((step, index) => (
                <article className="cf-record dense-record" key={step}>
                  <div className="dense-record-main">
                    <div className="dense-title">
                      <div className="dense-kicker">
                        <StatusBadge status={index < 2 ? "Active" : index === 6 ? "Complete" : "Review"} />
                        <span className="entity-pill">{`Step ${index + 1}`}</span>
                      </div>
                      <h3>{step}</h3>
                      <div className="dense-meta">
                        <span>{index === 0 ? "Start here" : index === 6 ? "Client-safe end state" : "Continue in order"}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="muted-copy compact">
              No production readiness is implied. If an environment step appears, stop and use the approved owner gate first.
            </p>
          </SectionPanel>

          <SectionPanel tone="compact" title="Ready now" description="Admin actions that can be handled immediately.">
            {readyNowActions.length > 0 ? (
              <div className="action-strip stack gap-sm">
                {readyNowActions.map((action) => (
                  <ActionStripItem key={action.id} action={action} onViewRun={handleViewRun} />
                ))}
              </div>
            ) : (
              <p className="muted-copy">No ready items at the moment.</p>
            )}
          </SectionPanel>

          <SectionPanel tone="compact" title="Needs review" description="Items that need inspection before they can move forward.">
            {needsReviewActions.length > 0 ? (
              <div className="action-strip stack gap-sm">
                {needsReviewActions.map((action) => (
                  <ActionStripItem key={action.id} action={action} onViewRun={handleViewRun} />
                ))}
              </div>
            ) : (
              <p className="muted-copy">No review items waiting right now.</p>
            )}
          </SectionPanel>

          <SectionPanel
            tone="compact"
            title="Blocked / waiting"
            description="Items waiting on approval, dependency, or external input."
          >
            {blockedOrWaitingActions.length > 0 ? (
              <div className="action-strip stack gap-sm">
                {blockedOrWaitingActions.map((action) => (
                  <ActionStripItem key={action.id} action={action} onViewRun={handleViewRun} />
                ))}
              </div>
            ) : (
              <p className="muted-copy">No blocked or waiting items.</p>
            )}
          </SectionPanel>

          {runs.length > 0 ? (
            <SectionPanel
              tone="compact"
              title="Project activity"
              description="Current workflows grouped by project."
            >
              <div className="project-summary-list">
                {Array.from(
                  runs.reduce(
                    (acc, run) => {
                      if (!acc.has(run.projectName)) {
                        acc.set(run.projectName, []);
                      }
                      acc.get(run.projectName)!.push(run);
                      return acc;
                    },
                    new Map<string, AiOperationsRunListItem[]>()
                  )
                )
                  .slice(0, 5)
                  .map(([projectName, projectRuns]) => {
                    const statuses = new Set(projectRuns.map((r) => r.status));
                    const statusStr = Array.from(statuses).join(", ");
                    return (
                      <div
                        key={projectName}
                        className="project-summary-item flex items-center gap-3 py-2 px-3 bg-surface rounded-lg border border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{projectName}</p>
                          <p className="text-xs text-text-muted">{projectRuns.length} run(s)</p>
                        </div>
                        <StatusBadge status={statusStr} />
                      </div>
                    );
                  })}
              </div>
            </SectionPanel>
          ) : null}

          <SectionPanel
            tone="compact"
            title="Handoffs"
            description="Jump directly into each surface used by the local operator path."
          >
            <div className="stack gap-sm">
              <Button onClick={() => navigateTo("#/workflow-briefs")} type="button" variant="secondary">
                Open Workflow Briefs / AI SEO plan
              </Button>
              <Button
                onClick={() => {
                  window.location.hash = "#/ai-delivery";
                }}
                type="button"
                variant="secondary"
              >
                Open AI Delivery workspace
              </Button>
              <Button onClick={() => navigateTo("#/monthly-reports")} type="button" variant="secondary">
                Preview Monthly Reports (client-safe view)
              </Button>
              <Button onClick={() => navigateTo("#/archive")} type="button" variant="secondary">
                Preview Client Portal archive (client-safe, read-only)
              </Button>
              <Button onClick={() => navigateTo("#/ai-market-intelligence")} type="button" variant="secondary">
                Open Market Intelligence
              </Button>
              <Button onClick={() => navigateTo("#/invoices")} type="button" variant="secondary">
                Open Finance Lite (Invoices)
              </Button>
              <Button
                onClick={() => {
                  window.location.hash = "#/ai-operations";
                }}
                type="button"
                variant="secondary"
              >
                Open full AI Operations console
              </Button>
            </div>
          </SectionPanel>

          <SectionPanel
            tone="compact"
            title="Deferred / gated (not active locally)"
            description="These stay explicitly outside local/admin scope until a separate owner-approved block runs."
          >
            <div className="cf-record-list">
              {[
                "Staging deploy / environment proof",
                "Production deploy / readiness",
                "Live AI provider execution (OpenRouter)",
                "Live WordPress publish",
                "GA/GSC live sync",
                "R2 live bucket IO"
              ].map((label) => (
                <article className="cf-record dense-record" key={label}>
                  <div className="dense-record-main">
                    <div className="dense-title">
                      <div className="dense-kicker">
                        <StatusBadge status="Deferred" />
                      </div>
                      <h3>{label}</h3>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="muted-copy compact">
              No environment proof has run. Owner approval is required before any of the above starts, and Sonnet is required for any future environment execution.
            </p>
          </SectionPanel>

          {lastRefreshed ? (
            <p className="text-xs text-text-muted text-center">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
