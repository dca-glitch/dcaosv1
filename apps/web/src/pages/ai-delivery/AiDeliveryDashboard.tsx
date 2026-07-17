import React, { useMemo } from "react";
import { Button, MetricCard, SectionPanel } from "../../components/ui";
import type { AiDeliveryProjectSummary } from "./AiDeliveryPage";
import {
  buildAiDeliveryActionQueue,
  buildAiDeliveryDashboardKpis,
  buildAiDeliveryDashboardRows,
  buildAiDeliveryPipelineStages,
} from "./ai-delivery-dashboard-model";
import "./ai-delivery-dashboard.css";

export type AiDeliveryDashboardProps = {
  projects: AiDeliveryProjectSummary[];
  onSelectProject: (projectId: string) => void;
  onCreateProject?: () => void;
  canEdit: boolean;
};

function formatKpiValue(value: number | null): string | number {
  if (value === null) return "—";
  return value;
}

function priorityLabel(priority: "high" | "medium" | "low"): string {
  if (priority === "high") return "High priority";
  if (priority === "medium") return "Medium priority";
  return "Low priority";
}

export function AiDeliveryDashboard({
  projects,
  onSelectProject,
  onCreateProject,
  canEdit,
}: AiDeliveryDashboardProps) {
  const kpis = useMemo(() => buildAiDeliveryDashboardKpis(projects), [projects]);
  const pipelineStages = useMemo(() => buildAiDeliveryPipelineStages(projects), [projects]);
  const actionQueue = useMemo(() => buildAiDeliveryActionQueue(projects), [projects]);
  const tableRows = useMemo(() => buildAiDeliveryDashboardRows(projects), [projects]);

  const statusDistribution = useMemo(() => {
    const active = projects.filter((p) => !p.isArchived);
    const withBrief = active.filter((p) => p.brief).length;
    const approvedBrief = active.filter((p) => p.brief?.status === "APPROVED").length;
    const pendingBrief = active.filter((p) => p.brief && p.brief.status !== "APPROVED").length;
    const noBrief = active.length - withBrief;
    return {
      activeCount: active.length,
      rows: [
        { label: "Active projects", value: active.length },
        { label: "Brief approved", value: approvedBrief },
        { label: "Brief in progress", value: pendingBrief },
        { label: "Brief not started", value: noBrief },
      ],
    };
  }, [projects]);

  return (
    <div className="ai-delivery-dashboard" data-density="compact">
      <SectionPanel
        tone="compact"
        title="Workflow overview"
        description="Counts use project-level data. Open a project workspace for deliverable, image, and report detail."
      >
        <div className="ai-delivery-dashboard__kpi-grid" aria-label="AI Delivery KPIs">
          <MetricCard
            label="Active Projects"
            value={kpis.activeProjects}
            helper="Non-archived delivery projects"
            metricKey="active-projects"
          />
          <MetricCard
            label="Pending Reviews"
            value={kpis.pendingReviews}
            helper="Briefs awaiting admin review"
            metricKey="pending-reviews"
          />
          <MetricCard
            label="Client Approvals"
            value={formatKpiValue(kpis.clientApprovals)}
            helper="Open project workspace for live counts"
            metricKey="client-approvals"
          />
          <MetricCard
            label="Image Approvals"
            value={formatKpiValue(kpis.imageApprovals)}
            helper="Open project workspace for live counts"
            metricKey="image-approvals"
          />
          <MetricCard
            label="Reports Awaiting"
            value={formatKpiValue(kpis.reportsAwaiting)}
            helper="Open project workspace for live counts"
            metricKey="reports-awaiting"
          />
          <MetricCard
            label="Overdue Items"
            value={formatKpiValue(kpis.overdueItems)}
            helper="No due-date aggregate at tenant level"
            metricKey="overdue-items"
          />
        </div>
      </SectionPanel>

      <SectionPanel tone="compact" title="Workflow pipeline" description="Stage counts inferred from brief status only.">
        <div className="ai-delivery-pipeline" aria-label="Delivery pipeline stages">
          {pipelineStages.map((stage, index) => (
            <React.Fragment key={stage.id}>
              <div
                className="ai-delivery-pipeline__stage"
                data-attention={stage.attention ? "true" : "false"}
                data-count={stage.count}
                data-empty={stage.count === 0 ? "true" : "false"}
                data-tone={stage.tone}
              >
                <p className="ai-delivery-pipeline__label">{stage.shortLabel}</p>
                <p className="ai-delivery-pipeline__count">{stage.count === 0 ? "—" : stage.count}</p>
                <p className="ai-delivery-pipeline__status">{stage.statusLine}</p>
              </div>
              {index < pipelineStages.length - 1 ? (
                <span aria-hidden="true" className="ai-delivery-pipeline__chevron">
                  ›
                </span>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </SectionPanel>

      <div className="ai-delivery-dashboard__two-col">
        <SectionPanel
          className="ai-delivery-action-required-panel"
          tone="compact"
          title="Action required"
          description="Projects needing intake or brief completion."
        >
          {actionQueue.length === 0 ? (
            <p className="muted-text">No project-level actions right now. Open a project for lane-specific tasks.</p>
          ) : (
            <div className="ai-delivery-action-queue" role="list">
              {actionQueue.map((item) => (
                <div className="ai-delivery-action-queue__row" key={item.id} role="listitem">
                  <span
                    aria-label={priorityLabel(item.priority)}
                    className="ai-delivery-action-queue__priority"
                    data-priority={item.priority}
                    role="img"
                    title={priorityLabel(item.priority)}
                  />
                  <div className="ai-delivery-action-queue__body">
                    <p className="ai-delivery-action-queue__title">
                      {item.clientName} · {item.deliverableLabel}
                    </p>
                    <p className="ai-delivery-action-queue__meta">
                      {item.stageLabel} · {item.waitingLabel} · {item.dueLabel}
                    </p>
                    <p className="ai-delivery-action-queue__id muted-text" title={item.projectId}>
                      ID {item.projectId}
                    </p>
                  </div>
                  <div className="ai-delivery-action-queue__action">
                    <Button
                      aria-label={`${item.actionLabel} for ${item.deliverableLabel}`}
                      onClick={() => onSelectProject(item.projectId)}
                      type="button"
                      variant="secondary"
                    >
                      {item.actionLabel}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>

        <SectionPanel tone="compact" title="Status distribution" description="Project brief snapshot.">
          {statusDistribution.activeCount === 0 ? (
            <p className="muted-text">No active projects to distribute yet.</p>
          ) : (
            <div className="ai-delivery-status-distribution">
              {statusDistribution.rows.map((row) => (
                <div className="ai-delivery-status-distribution__row" key={row.label}>
                  <span>{row.label}</span>
                  <span className="ai-delivery-deliverables-table__mono">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>
      </div>

      <SectionPanel
        tone="compact"
        title="Delivery projects"
        description="Select a row to open the project workspace."
        action={
          canEdit && onCreateProject ? (
            <Button onClick={onCreateProject} type="button" variant="primary">
              Create Delivery Project
            </Button>
          ) : null
        }
      >
        {tableRows.length === 0 ? (
          <p className="muted-text">No active delivery projects.</p>
        ) : (
          <div className="ai-delivery-deliverables-table-wrap">
            <table aria-label="Delivery projects" className="ai-delivery-deliverables-table">
              <thead>
                <tr>
                  <th scope="col">Client</th>
                  <th scope="col">Project</th>
                  <th scope="col">Deliverable</th>
                  <th scope="col">Stage</th>
                  <th scope="col">Status</th>
                  <th scope="col">Owner</th>
                  <th scope="col">Client Review</th>
                  <th scope="col">Due</th>
                  <th scope="col">Last Update</th>
                  <th scope="col">Next Action</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="ai-delivery-dashboard__cell-primary">{row.clientName}</span>
                    </td>
                    <td>
                      <span className="ai-delivery-dashboard__cell-primary">{row.projectName}</span>
                      <span className="ai-delivery-dashboard__cell-id muted-text" title={row.id}>
                        ID {row.id}
                      </span>
                    </td>
                    <td>
                      <Button
                        aria-label={`Open ${row.deliverableLabel}`}
                        onClick={() => onSelectProject(row.id)}
                        type="button"
                        variant="tertiary"
                      >
                        <span className="ai-delivery-dashboard__cell-primary">{row.deliverableLabel}</span>
                      </Button>
                    </td>
                    <td className="ai-delivery-deliverables-table__mono">{row.stageLabel}</td>
                    <td>{row.statusLabel}</td>
                    <td>{row.ownerLabel}</td>
                    <td>{row.clientReviewLabel}</td>
                    <td>{row.dueLabel}</td>
                    <td className="ai-delivery-deliverables-table__mono">{row.lastUpdateLabel}</td>
                    <td>{row.nextActionLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
