import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { AiOperationsRunListItem, AiOperationsRunsResponse } from "@dca-os-v1/shared";
import { Alert, Button, PageHeader, RingMetricTile, SectionPanel, Spinner, StatusBadge } from "../../components/ui";
import { ActivityItem } from "../../design-system/components/Table";
import {
  DEFERRED_GATED_ITEMS,
  PURIVA_DAILY_PATH,
  buildAgencyActivity,
  buildAgencyHealth,
  buildAgencyOpsMetrics,
  formatRelativeTimestamp,
  generateDailyActions,
  normalizeRunStatus,
  type DailyAction,
} from "./adminDailyOperationsModel";
import "./admin-daily-operations.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error: { code: string; message: string } };
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type WorkflowTabId = "ready" | "review" | "blocked";

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
      error: { code: "REQUEST_FAILED", message: "Request could not be completed." },
    };
  }
  return payload;
}

function ActionStripItem({
  action,
  onViewRun,
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
  const viewLabel = relatedRun
    ? `Continue ${relatedRun.shortId} (${relatedRun.projectName})`
    : "Continue";

  return (
    <div
      className="action-strip-item"
      data-priority={action.priority}
      aria-label={`${action.priorityLabel} priority. ${action.title}`}
    >
      <div className="action-strip-badge">
        <StatusBadge status={badgeStatus} />
      </div>
      <div className="action-strip-content flex-1">
        <p className="action-strip-title">{action.title}</p>
        <p className="action-strip-context">{action.context}</p>
        <p className="action-strip-meta">
          <span className="action-strip-priority">{action.priorityLabel} priority</span>
          {action.timestamp ? (
            <span className="action-strip-time">{formatRelativeTimestamp(action.timestamp)}</span>
          ) : null}
        </p>
      </div>
      {relatedRun && onViewRun ? (
        <button
          className="agency-ops-continue"
          onClick={() => onViewRun(relatedRun.id)}
          type="button"
        >
          {viewLabel}
        </button>
      ) : null}
    </div>
  );
}

function ActionQueue({
  actions,
  emptyCopy,
  onViewRun,
}: {
  actions: DailyAction[];
  emptyCopy: string;
  onViewRun: (runId: string) => void;
}) {
  if (actions.length === 0) {
    return <p className="muted-copy">{emptyCopy}</p>;
  }
  return (
    <div className="action-strip" role="list">
      {actions.map((action) => (
        <div key={action.id} role="listitem">
          <ActionStripItem action={action} onViewRun={onViewRun} />
        </div>
      ))}
    </div>
  );
}

export function AdminDailyOperationsCockpit() {
  const titleId = useId();
  const [runs, setRuns] = useState<AiOperationsRunListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<WorkflowTabId>("ready");

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
  const metrics = useMemo(() => buildAgencyOpsMetrics(runs), [runs]);
  const health = useMemo(() => buildAgencyHealth(runs), [runs]);
  const activity = useMemo(() => buildAgencyActivity(runs), [runs]);

  const readyNowActions = dailyActions.filter((action) => action.category === "approval");
  const needsReviewActions = dailyActions.filter((action) => action.category === "review");
  const blockedOrWaitingActions = dailyActions.filter(
    (action) => action.category === "blocked" || action.category === "waiting",
  );

  const handleViewRun = useCallback((runId: string) => {
    window.location.hash = `#/ai-operations?runId=${runId}`;
  }, []);

  const navigateTo = useCallback((hash: string) => {
    window.location.hash = hash;
  }, []);

  const scrollToQueue = useCallback((tab: WorkflowTabId) => {
    setActiveTab(tab);
    const id =
      tab === "ready"
        ? "agency-ops-queue-ready"
        : tab === "review"
          ? "agency-ops-queue-review"
          : "agency-ops-queue-blocked";
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const projectSummaries = useMemo(() => {
    const map = new Map<string, typeof runs>();
    for (const run of runs) {
      if (!map.has(run.projectName)) map.set(run.projectName, []);
      map.get(run.projectName)!.push(run);
    }
    return Array.from(map.entries()).slice(0, 5);
  }, [runs]);

  return (
    <section className="page-stack agency-ops-dashboard" data-density="compact" aria-labelledby={titleId}>
      <PageHeader
        eyebrow="Admin Operations"
        title="Daily Operations Cockpit"
        titleId={titleId}
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
          <div className="agency-ops-stack">
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
        <div className="agency-ops-stack agency-ops-stack--lg">
          <SectionPanel
            tone="compact"
            title="Status snapshot"
            description="Compact view of what needs attention right now."
          >
            <div className="agency-ops-kpi-grid" aria-label="Daily operations status">
              <RingMetricTile
                label="Blocked"
                value={metrics.blocked}
                max={metrics.ringMax}
                helper="Owner or dependency blockers"
                tone="blocked"
                alert={metrics.blocked > 0}
                metricKey="blocked"
              />
              <RingMetricTile
                label="Overdue"
                value={metrics.overdue}
                max={metrics.ringMax}
                helper="Due dates not on run records"
                tone="overdue"
                alert={metrics.overdue > 0}
                metricKey="overdue"
              />
              <RingMetricTile
                label="In Review"
                value={metrics.inReview}
                max={metrics.ringMax}
                helper="Failed or follow-up items"
                tone="in_review"
                alert={metrics.inReview > 0}
                metricKey="in-review"
              />
              <RingMetricTile
                label="Ready"
                value={metrics.ready}
                max={metrics.ringMax}
                helper="Awaiting your decision"
                tone="ready"
                alert={metrics.ready > 0}
                metricKey="ready"
              />
              <RingMetricTile
                label="In Progress"
                value={metrics.inProgress}
                max={metrics.ringMax}
                helper="Active workflow runs"
                tone="in_progress"
                metricKey="in-progress"
              />
              <RingMetricTile
                label="Completed"
                value={metrics.completed}
                max={metrics.ringMax}
                helper={`${metrics.completedToday} today · est. ${metrics.costEstimate}`}
                tone="completed"
                metricKey="completed"
              />
            </div>
          </SectionPanel>

          <div className="agency-ops-workflow" aria-label="Workflow queues">
            <div className="agency-ops-tabs" role="tablist" aria-label="Workflow focus">
              {(
                [
                  { id: "ready" as const, label: "Ready Now", count: readyNowActions.length },
                  { id: "review" as const, label: "In Review", count: needsReviewActions.length },
                  { id: "blocked" as const, label: "Blocked", count: blockedOrWaitingActions.length },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={
                    activeTab === tab.id ? "agency-ops-tab agency-ops-tab--active" : "agency-ops-tab"
                  }
                  onClick={() => scrollToQueue(tab.id)}
                >
                  {tab.label}
                  <span className="agency-ops-tab__count">{tab.count}</span>
                </button>
              ))}
            </div>

            <div id="agency-ops-queue-ready">
              <SectionPanel
                tone="compact"
                title="Ready now"
                description="Admin actions that can be handled immediately."
              >
                <ActionQueue
                  actions={readyNowActions}
                  emptyCopy="No ready items at the moment."
                  onViewRun={handleViewRun}
                />
              </SectionPanel>
            </div>

            <div id="agency-ops-queue-review">
              <SectionPanel
                tone="compact"
                title="Needs review"
                description="Items that need inspection before they can move forward."
              >
                <ActionQueue
                  actions={needsReviewActions}
                  emptyCopy="No review items waiting right now."
                  onViewRun={handleViewRun}
                />
              </SectionPanel>
            </div>

            <div id="agency-ops-queue-blocked">
              <SectionPanel
                tone="compact"
                title="Blocked / waiting"
                description="Items waiting on approval, dependency, or external input."
              >
                <ActionQueue
                  actions={blockedOrWaitingActions}
                  emptyCopy="No blocked or waiting items."
                  onViewRun={handleViewRun}
                />
              </SectionPanel>
            </div>
          </div>

          <SectionPanel
            tone="compact"
            title="Agency health"
            description="Clients and projects represented in current operations runs."
          >
            <div className="agency-ops-health" role="list" aria-label="Agency health summary">
              <div className="agency-ops-health__item" role="listitem">
                <span className="agency-ops-health__label">Clients</span>
                <span className="agency-ops-health__value">{health.clientCount}</span>
              </div>
              <div className="agency-ops-health__item" role="listitem">
                <span className="agency-ops-health__label">Active Projects</span>
                <span className="agency-ops-health__value">{health.projectCount}</span>
              </div>
              <div className="agency-ops-health__item" role="listitem">
                <span className="agency-ops-health__label">Overdue Items</span>
                <span className="agency-ops-health__value">{health.overdueCount}</span>
                <span className="agency-ops-health__hint">From run status only</span>
              </div>
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
                        <span className="entity-pill">{`Step ${index + 1}`}</span>
                        <span className="agency-ops-guide-label">Guide</span>
                      </div>
                      <h3>{step}</h3>
                      <div className="dense-meta">
                        <span>
                          {index === 0
                            ? "Start here"
                            : index === 6
                              ? "Client-safe end state"
                              : "Continue in order"}
                        </span>
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

          {runs.length > 0 ? (
            <SectionPanel
              tone="compact"
              title="Project activity"
              description="Current workflows grouped by project."
            >
              <div className="project-summary-list">
                {projectSummaries.map(([projectName, projectRuns]) => {
                  const statusKeys = Array.from(
                    new Set(projectRuns.map((r) => normalizeRunStatus(r.status))),
                  );
                  const primaryStatus =
                    statusKeys.find((s) => s === "failed" || s === "blocked") ??
                    statusKeys.find((s) => s === "in_review") ??
                    statusKeys.find((s) => s === "ready") ??
                    statusKeys[0] ??
                    "unknown";
                  return (
                    <div key={projectName} className="project-summary-item agency-ops-project-row">
                      <div className="flex-1 min-w-0">
                        <p className="agency-ops-project-name">{projectName}</p>
                        <p className="agency-ops-project-meta">
                          {projectRuns.length} run(s)
                          {statusKeys.length > 1
                            ? ` · ${statusKeys.length} status groups`
                            : null}
                        </p>
                      </div>
                      <StatusBadge status={primaryStatus === "unknown" ? "pending" : primaryStatus} />
                    </div>
                  );
                })}
              </div>
            </SectionPanel>
          ) : null}

          <SectionPanel
            tone="compact"
            title="Recent activity"
            description="Most recent operations runs with internal status labels."
          >
            {activity.length > 0 ? (
              <ul className="agency-ops-activity">
                {activity.map((item, index) => {
                  const tone = normalizeRunStatus(item.status);
                  return (
                    <li key={item.id}>
                      <ActivityItem
                        title={item.title}
                        description={item.description}
                        timestamp={formatRelativeTimestamp(item.timestamp)}
                        status={tone === "unknown" ? undefined : tone}
                        className={index === activity.length - 1 ? "agency-ops-activity__last" : undefined}
                      />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted-copy">No recent run activity yet.</p>
            )}
          </SectionPanel>

          <SectionPanel
            tone="compact"
            title="Handoffs"
            description="Jump directly into each surface used by the local operator path."
          >
            <nav className="agency-ops-handoffs" aria-label="Operator handoffs">
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
            </nav>
          </SectionPanel>

          <SectionPanel
            tone="compact"
            title="Deferred / gated (not active locally)"
            description="These stay explicitly outside local/admin scope until a separate owner-approved block runs."
          >
            <div className="cf-record-list">
              {DEFERRED_GATED_ITEMS.map((label) => (
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
            <p className="agency-ops-refreshed" aria-live="polite">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
