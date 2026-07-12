import React from "react";
import { EmptyState, SectionPanel, StatusBadge } from "../../components/ui";
import type { AiDeliveryRevenueChainReadinessResponse } from "@dca-os-v1/shared";
import type { AiDeliveryProjectSummary } from "./AiDeliveryPage";

export type AiDeliveryProjectWorkspaceSectionsProps = {
  workspaceProject: AiDeliveryProjectSummary | null;
  canEdit: boolean;
  briefCheckpointLabel: string;
  showMiContextButton: boolean;
  showKnowledgeButton: boolean;
  showMonthlyReportButton: boolean;
  revenueChainReadiness: AiDeliveryRevenueChainReadinessResponse | null;
  revenueChainReadinessLoading: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onOpenContentPlan: () => void;
  onOpenBrief: () => void;
  onOpenResearchSources: () => void;
  onOpenMiContext: () => void;
  onOpenKnowledgePanel: () => void;
  onOpenWorkflowRuns: () => void;
  onOpenContentDrafts: () => void;
  onRequestClientInput: () => void;
  onRequestClientRevision: () => void;
  onApproveFinal: () => void;
  onOpenArticleImages: () => void;
  onOpenDeliverables: () => void;
  onOpenMonthlyReport: () => void;
};

export function AiDeliveryProjectWorkspaceSections({
  workspaceProject,
  canEdit,
  briefCheckpointLabel,
  showMiContextButton,
  showKnowledgeButton,
  showMonthlyReportButton,
  onEdit,
  onArchive,
  onOpenContentPlan,
  onOpenBrief,
  onOpenResearchSources,
  onOpenMiContext,
  onOpenKnowledgePanel,
  onOpenWorkflowRuns,
  onOpenContentDrafts,
  onRequestClientInput,
  onRequestClientRevision,
  onApproveFinal,
  onOpenArticleImages,
  onOpenDeliverables,
  onOpenMonthlyReport,
  revenueChainReadiness,
  revenueChainReadinessLoading
}: AiDeliveryProjectWorkspaceSectionsProps) {
  if (!workspaceProject) {
    return (
      <SectionPanel
        className="ai-delivery-section"
        description="Select a project from the list."
        title="Project workspace"
        tone="compact"
      >
        <EmptyState message="Select a project to continue." title="No project selected" />
      </SectionPanel>
    );
  }

  return (
    <>
      <SectionPanel
        action={
          canEdit ? (
            <div className="ai-delivery-action-row">
              <button className="ghost-action" onClick={onEdit} type="button">
                Edit
              </button>
              {!workspaceProject.isArchived ? (
                <button className="ghost-action" onClick={() => void onArchive()} type="button">
                  Archive
                </button>
              ) : null}
            </div>
          ) : null
        }
        className="ai-delivery-section ai-delivery-project-context"
        description={`${workspaceProject.client?.name ?? "No client"} · ${workspaceProject.project?.name ?? "No project reference"} · ${workspaceProject.targetMonth}`}
        title={workspaceProject.name}
        tone="compact"
      >
        <div className="ai-delivery-context-meta">
          <span
            className={`entity-pill entity-pill-${workspaceProject.isArchived ? "archived" : "active"}`}
          >
            {workspaceProject.isArchived ? "Archived" : "Active"}
          </span>
          <StatusBadge status={workspaceProject.brief?.status ?? "Brief not started"} />
          <span className="muted-text">Checkpoint: {briefCheckpointLabel}</span>
        </div>
        <div className="ai-delivery-context-meta" style={{ marginTop: "0.5rem" }}>
          <span className="muted-text">
            <strong>Intake context:</strong>{" "}
            {workspaceProject.brief?.status === "APPROVED"
              ? "Verified intake ready"
              : workspaceProject.brief
                ? `Intake started — ${workspaceProject.brief.status}`
                : "Intake missing — brief required before SEO plan is grounded"}
          </span>
        </div>
        {workspaceProject.plannedContentScopeNotes ? (
          <p className="ai-delivery-context-notes muted-text">{workspaceProject.plannedContentScopeNotes}</p>
        ) : null}
      </SectionPanel>

      <SectionPanel
        className="ai-delivery-section ai-delivery-workflow-lanes"
        title="Content delivery workflow"
        tone="compact"
      >
        <div className="ai-delivery-workflow-container">
          <div className="ai-delivery-lane">
            <div className="ai-delivery-lane-header">
              <span className="ai-delivery-lane-number">1</span>
              <div className="ai-delivery-lane-info">
                <h4>Intake & Verified Facts</h4>
                <span className="muted-text text-xs">Verified intake → approved KB/context → brief → SEO plan</span>
                <StatusBadge status={workspaceProject.brief?.status ?? "Not started"} />
              </div>
            </div>
            {canEdit ? (
              <div className="ai-delivery-lane-actions">
                <button
                  className="primary-action"
                  disabled={!workspaceProject.brief}
                  onClick={() => void onOpenBrief()}
                  type="button"
                >
                  {workspaceProject.brief ? "Edit brief" : "Create brief"}
                </button>
                <button className="ghost-action text-sm" onClick={() => void onOpenResearchSources()} type="button">
                  Research / sources
                </button>
                {showMiContextButton ? (
                  <button className="ghost-action text-sm" onClick={() => void onOpenMiContext()} type="button">
                    MI
                  </button>
                ) : null}
                {showKnowledgeButton ? (
                  <button className="ghost-action text-sm" onClick={onOpenKnowledgePanel} type="button">
                    Knowledge
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="ai-delivery-lane">
            <div className="ai-delivery-lane-header">
              <span className="ai-delivery-lane-number">2</span>
              <div className="ai-delivery-lane-info">
                <h4>SEO Plan</h4>
                <span className="muted-text text-xs">Monthly content plan and review checkpoints</span>
              </div>
            </div>
            {canEdit ? (
              <div className="ai-delivery-lane-actions">
                <button className="primary-action" onClick={() => void onOpenContentPlan()} type="button">
                  SEO / content plan
                </button>
                <button className="ghost-action text-sm" onClick={() => void onOpenWorkflowRuns()} type="button">
                  Workflow runs
                </button>
              </div>
            ) : null}
          </div>

          <div className="ai-delivery-lane">
            <div className="ai-delivery-lane-header">
              <span className="ai-delivery-lane-number">3</span>
              <div className="ai-delivery-lane-info">
                <h4>Content Draft</h4>
                <span className="muted-text text-xs">Article production and review-ready copy</span>
              </div>
            </div>
            {canEdit ? (
              <div className="ai-delivery-lane-actions">
                <button className="primary-action" onClick={() => void onOpenContentDrafts()} type="button">
                  Content production
                </button>
              </div>
            ) : null}
          </div>

          <div className="ai-delivery-lane">
            <div className="ai-delivery-lane-header">
              <span className="ai-delivery-lane-number">4</span>
              <div className="ai-delivery-lane-info">
                <h4>Compliance Review</h4>
                <span className="muted-text text-xs">Admin review → client changes → final approval</span>
              </div>
            </div>
            {canEdit ? (
              <div className="ai-delivery-lane-actions">
                <button className="primary-action" onClick={() => void onApproveFinal()} type="button">
                  Approve final
                </button>
                <button className="ghost-action text-sm" onClick={() => void onRequestClientInput()} type="button">
                  Request input
                </button>
                <button className="ghost-action text-sm" onClick={() => void onRequestClientRevision()} type="button">
                  Revise
                </button>
              </div>
            ) : null}
          </div>

          <div className="ai-delivery-lane">
            <div className="ai-delivery-lane-header">
              <span className="ai-delivery-lane-number">5</span>
              <div className="ai-delivery-lane-info">
                <h4>Image & Assets</h4>
                <span className="muted-text text-xs">Approved or final-ready article imagery</span>
              </div>
            </div>
            {canEdit ? (
              <div className="ai-delivery-lane-actions">
                <button className="primary-action" onClick={() => void onOpenArticleImages()} type="button">
                  Article images
                </button>
              </div>
            ) : null}
          </div>

          <div className="ai-delivery-lane">
            <div className="ai-delivery-lane-header">
              <span className="ai-delivery-lane-number">6</span>
              <div className="ai-delivery-lane-info">
                <h4>WordPress Handoff</h4>
                <span className="muted-text text-xs">Draft-only publication packages</span>
              </div>
            </div>
            {canEdit ? (
              <div className="ai-delivery-lane-actions">
                <button className="primary-action" onClick={() => void onOpenDeliverables()} type="button">
                  Deliverables
                </button>
              </div>
            ) : null}
          </div>

          <div className="ai-delivery-lane">
            <div className="ai-delivery-lane-header">
              <span className="ai-delivery-lane-number">7</span>
              <div className="ai-delivery-lane-info">
                <h4>Monthly report</h4>
                <span className="muted-text text-xs">Monthly final snapshot</span>
              </div>
            </div>
            {canEdit && showMonthlyReportButton ? (
              <div className="ai-delivery-lane-actions">
                <button className="primary-action" onClick={onOpenMonthlyReport} type="button">
                  Monthly report
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </SectionPanel>

      <SectionPanel
        className="ai-delivery-section ai-delivery-revenue-chain-readiness"
        description="Deterministic admin-operated chain. Use verified intake and approved KB/context before SEO, drafts, handoff, and monthly snapshots. Warnings do not block workflow — use for readiness checks only."
        title="Delivery chain readiness"
        tone="compact"
      >
        {revenueChainReadinessLoading ? (
          <p className="muted-text">Loading readiness checklist...</p>
        ) : revenueChainReadiness ? (
          <div className="stack gap-sm">
            <div className="ai-delivery-context-meta">
              <StatusBadge status={revenueChainReadiness.overallStatus} />
              <span className="muted-text">Admin checklist only.</span>
            </div>
            {revenueChainReadiness.checks.length > 0 ? (
              <dl className="ai-delivery-readiness-grid">
                {revenueChainReadiness.checks.map((check) => (
                  <div key={check.key} className="ai-delivery-readiness-item">
                    <dt className="ai-delivery-readiness-label">{check.label}</dt>
                    <dd className="ai-delivery-readiness-status">
                      <StatusBadge status={check.status} />
                      <span className="muted-text text-xs">{check.detail}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {revenueChainReadiness.warnings.length > 0 ? (
              <p className="muted-text text-xs">⚠ {revenueChainReadiness.warnings.join(" · ")}</p>
            ) : null}
          </div>
        ) : (
          <p className="muted-text">Select a project to view delivery chain readiness.</p>
        )}
      </SectionPanel>
    </>
  );
}
