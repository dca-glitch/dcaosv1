import React, { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AiOperationsRunListItem,
  AiOperationsRunsResponse
} from "@dca-os-v1/shared";
import { Button, MetricCard, PageHeader, SectionPanel, StatusBadge } from "../../components/ui";
import { Alert, Spinner } from "../../design-system";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error: { code: string; message: string } };
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

// Daily action item priority tiers
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
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Group runs by status and timestamp
  const runsByStatus = new Map<string, AiOperationsRunListItem[]>();
  runs.forEach((run) => {
    const status = run.status || "unknown";
    if (!runsByStatus.has(status)) {
      runsByStatus.set(status, []);
    }
    runsByStatus.get(status)!.push(run);
  });

  // 1. Failed/errored runs require immediate action
  const failedRuns = runsByStatus.get("failed") || [];
  failedRuns.slice(0, 3).forEach((run) => {
    actions.push({
      id: `failed-${run.id}`,
      priority: "critical",
      category: "blocked",
      title: `Failed: ${run.shortId} (${run.projectName})`,
      context: `${run.workflowType || "workflow"} needs investigation`,
      relatedRun: run,
      timestamp: run.executedAt
    });
  });

  // 2. Pending approval/review runs
  const pendingRuns = runsByStatus.get("pending_approval") || [];
  pendingRuns.slice(0, 3).forEach((run) => {
    actions.push({
      id: `approval-${run.id}`,
      priority: "high",
      category: "approval",
      title: `Awaiting approval: ${run.shortId} (${run.projectName})`,
      context: run.outputType
        ? `${run.outputType} ready for review`
        : "Workflow output ready",
      relatedRun: run,
      timestamp: run.executedAt
    });
  });

  // 3. In-progress/long-running workflows
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

  // 4. Blocked/stalled runs
  const blockedRuns = runsByStatus.get("blocked") || [];
  blockedRuns.slice(0, 2).forEach((run) => {
    actions.push({
      id: `blocked-${run.id}`,
      priority: "high",
      category: "blocked",
      title: `Blocked: ${run.shortId} (${run.projectName})`,
      context: "Awaiting external resource or input",
      relatedRun: run,
      timestamp: run.executedAt
    });
  });

  return actions;
}

function buildCompactMetrics(runs: AiOperationsRunListItem[]): {
  totalRuns: number;
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
  const completedToday = runs.filter((r) => {
    const execTime = r.executedAt || "";
    return execTime >= todayStart && (r.status === "completed" || r.status === "success");
  }).length;

  // Rough cost estimate (based on approximate tokens if available)
  const totalTokens = runs.reduce((sum, r) => {
    return sum + (r.approximateInputTokens || 0);
  }, 0);
  const costEstimate =
    totalTokens > 0 ? `~${Math.round(totalTokens / 1000)}k tokens` : "—";

  return {
    totalRuns,
    failedCount,
    pendingCount,
    completedToday,
    blockedCount,
    costEstimate
  };
}

function ActionStripItem({
  action,
  onViewRun
}: {
  action: DailyAction;
  onViewRun?: (runId: string) => void;
}) {
  const priorityColor =
    action.priority === "critical"
      ? "danger"
      : action.priority === "high"
        ? "info"
        : "muted";

  return (
    <div className="action-strip-item" data-priority={action.priority}>
      <div className="action-strip-badge">
        <StatusBadge status={action.category} />
      </div>
      <div className="action-strip-content flex-1">
        <p className="action-strip-title">{action.title}</p>
        <p className="action-strip-context">{action.context}</p>
      </div>
      {action.relatedRun && onViewRun ? (
        <button
          className="action-strip-action"
          onClick={() => onViewRun(action.relatedRun!.id)}
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

  const criticalCount = dailyActions.filter((a) => a.priority === "critical").length;
  const highCount = dailyActions.filter((a) => a.priority === "high").length;

  const handleViewRun = useCallback(
    (runId: string) => {
      // Navigate to full operations console with run detail open
      window.location.hash = `#/ai-operations?runId=${runId}`;
    },
    []
  );

  return (
    <div className="page-stack" data-density="compact">
      <PageHeader
        eyebrow="Admin Operations"
        title="Daily Operations Cockpit"
        description="Today's next actions, workflow status, approvals, and blockers at a glance."
        actions={
          <Button onClick={() => void loadRuns()} type="button" variant="secondary">
            Refresh
          </Button>
        }
      />

      {error ? <Alert message={error} title="Cockpit blocked" variant="danger" /> : null}

      {loading ? (
        <div className="state-panel loading-state-panel" role="status">
          <Spinner size="md" />
          <span>Loading daily operations…</span>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="stack gap-lg">
          {/* Quick metrics row */}
          <SectionPanel tone="compact" title="Status snapshot" description="Real-time workflow metrics.">
            <div
              className="summary-grid metric-grid"
              aria-label="Daily operations status"
            >
              <MetricCard
                accent={metrics.failedCount > 0 ? "warning" : "success"}
                label="Total runs"
                value={metrics.totalRuns}
                helper={`${metrics.completedToday} completed today`}
              />
              <MetricCard
                accent={metrics.failedCount > 0 ? "warning" : "success"}
                label="Failed/blocked"
                value={metrics.failedCount + metrics.blockedCount}
                helper={`Needs investigation`}
              />
              <MetricCard
                accent={metrics.pendingCount > 0 ? "warning" : "success"}
                label="Pending approvals"
                value={metrics.pendingCount}
                helper={`Ready for review`}
              />
              <MetricCard
                accent="cyan"
                label="Est. cost"
                value={metrics.costEstimate}
                helper={`Input tokens (today)`}
              />
            </div>
          </SectionPanel>

          {/* Next actions strip */}
          {dailyActions.length > 0 ? (
            <SectionPanel
              tone="default"
              title="Next actions"
              description={`${criticalCount} critical, ${highCount} high priority.`}
            >
              <div className="action-strip stack gap-sm">
                {dailyActions.slice(0, 8).map((action) => (
                  <ActionStripItem
                    key={action.id}
                    action={action}
                    onViewRun={handleViewRun}
                  />
                ))}
              </div>
              {dailyActions.length > 8 ? (
                <p className="muted-copy compact">
                  {dailyActions.length - 8} more actions. View full console for details.
                </p>
              ) : null}
            </SectionPanel>
          ) : (
            <SectionPanel
              tone="compact"
              title="Next actions"
              description="All systems operating normally."
            >
              <p className="muted-copy">No critical actions required at this time.</p>
            </SectionPanel>
          )}

          {/* Project summary (by project status) */}
          {runs.length > 0 ? (
            <SectionPanel
              tone="compact"
              title="Project activity"
              description="Running workflows by project."
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

          {/* Operator controls */}
          <SectionPanel
            tone="compact"
            title="Operator controls"
            description="Quick access to full consoles."
          >
            <div className="stack gap-sm">
              <Button
                onClick={() => {
                  window.location.hash = "#/ai-operations";
                }}
                type="button"
                variant="secondary"
              >
                Open full AI Operations console →
              </Button>
              <Button
                onClick={() => {
                  window.location.hash = "#/ai-delivery";
                }}
                type="button"
                variant="secondary"
              >
                Open AI Delivery workspace →
              </Button>
            </div>
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
