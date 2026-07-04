import React from "react";
import { EmptyState } from "../../components/EmptyState";
import { SectionPanel, StatusBadge } from "../../components/ui";
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
              <button className="primary-action" onClick={() => void onOpenContentPlan()} type="button">
                Open content plan
              </button>
            </div>
          ) : null
        }
        className="ai-delivery-section ai-delivery-project-context"
        description={`${workspaceProject.client?.name ?? "No client"} · ${workspaceProject.project?.name ?? "No project reference"} · ${workspaceProject.targetMonth}`}
        title={workspaceProject.name}
        tone="compact"
      >
        <div className="ai-delivery-context-meta">
          <StatusBadge status={workspaceProject.brief?.status ?? "Brief not started"} />
          <span className="muted-text">Checkpoint: {briefCheckpointLabel}</span>
        </div>
        {workspaceProject.plannedContentScopeNotes ? (
          <p className="ai-delivery-context-notes muted-text">{workspaceProject.plannedContentScopeNotes}</p>
        ) : null}
      </SectionPanel>

      <SectionPanel
        className="ai-delivery-section ai-delivery-revenue-chain-readiness"
        description="Deterministic admin-operated chain: brief → MI → plan → drafts → images → deliverables → monthly report."
        title="Delivery chain readiness"
        tone="compact"
      >
        {revenueChainReadinessLoading ? (
          <p className="muted-text">Loading readiness checklist...</p>
        ) : revenueChainReadiness ? (
          <div className="stack gap-sm">
            <div className="ai-delivery-context-meta">
              <StatusBadge status={revenueChainReadiness.overallStatus} />
              <span className="muted-text">Admin checklist only — warnings do not block manual workflow.</span>
            </div>
            <dl className="brief-grid">
              {revenueChainReadiness.checks.map((check) => (
                <div key={check.key}>
                  <dt>{check.label}</dt>
                  <dd>
                    <StatusBadge status={check.status} />
                    <span className="muted-text"> {check.detail}</span>
                  </dd>
                </div>
              ))}
            </dl>
            {revenueChainReadiness.warnings.length > 0 ? (
              <p className="muted-text">{revenueChainReadiness.warnings.join(" · ")}</p>
            ) : null}
          </div>
        ) : (
          <p className="muted-text">Select a project to view delivery chain readiness.</p>
        )}
      </SectionPanel>

      <SectionPanel
        action={
          canEdit ? (
            <div className="ai-delivery-action-row">
              <button
                className="primary-action"
                disabled={!workspaceProject.brief}
                onClick={() => void onOpenBrief()}
                type="button"
              >
                Brief
              </button>
              <button className="ghost-action" onClick={() => void onOpenResearchSources()} type="button">
                Research / sources
              </button>
              {showMiContextButton ? (
                <button className="ghost-action" onClick={() => void onOpenMiContext()} type="button">
                  MI context
                </button>
              ) : null}
              {showKnowledgeButton ? (
                <button className="ghost-action" onClick={onOpenKnowledgePanel} type="button">
                  AI knowledge
                </button>
              ) : null}
            </div>
          ) : null
        }
        className="ai-delivery-section"
        description="Brief, research, and knowledge inputs."
        title="Brief & knowledge context"
        tone="compact"
      >
        {null}
      </SectionPanel>

      <SectionPanel
        action={
          canEdit ? (
            <div className="ai-delivery-action-row">
              <button className="primary-action" onClick={() => void onOpenContentPlan()} type="button">
                SEO / content plan
              </button>
              <button className="ghost-action" onClick={() => void onOpenWorkflowRuns()} type="button">
                Workflow runs
              </button>
            </div>
          ) : null
        }
        className="ai-delivery-section"
        description="Monthly SEO plan and workflow runs."
        title="SEO plan & production"
        tone="compact"
      >
        {null}
      </SectionPanel>

      <SectionPanel
        action={
          canEdit ? (
            <button className="primary-action" onClick={() => void onOpenContentDrafts()} type="button">
              Content production
            </button>
          ) : null
        }
        className="ai-delivery-section"
        description="Draft articles for approved plan items."
        title="Content drafts"
        tone="compact"
      >
        {null}
      </SectionPanel>

      <SectionPanel
        action={
          canEdit ? (
            <div className="ai-delivery-action-row">
              <button className="ghost-action" onClick={() => void onRequestClientInput()} type="button">
                Request input
              </button>
              <button className="ghost-action" onClick={() => void onRequestClientRevision()} type="button">
                Request revision
              </button>
              <button className="secondary-action" onClick={() => void onApproveFinal()} type="button">
                Approve final
              </button>
            </div>
          ) : null
        }
        className="ai-delivery-section"
        description="Client and content-plan review checkpoints."
        title="Reviews & approvals"
        tone="compact"
      >
        {null}
      </SectionPanel>

      <SectionPanel
        action={
          canEdit ? (
            <button className="primary-action" onClick={() => void onOpenArticleImages()} type="button">
              Article images
            </button>
          ) : null
        }
        className="ai-delivery-section"
        description="Image requests for content drafts."
        title="Images"
        tone="compact"
      >
        {null}
      </SectionPanel>

      <SectionPanel
        action={
          canEdit ? (
            <button className="primary-action" onClick={() => void onOpenDeliverables()} type="button">
              Deliverables
            </button>
          ) : null
        }
        className="ai-delivery-section"
        description="Publication packages and WordPress prep."
        title="WordPress & publication"
        tone="compact"
      >
        {null}
      </SectionPanel>

      <SectionPanel
        action={
          canEdit && showMonthlyReportButton ? (
            <button className="primary-action" onClick={onOpenMonthlyReport} type="button">
              Monthly report
            </button>
          ) : null
        }
        className="ai-delivery-section"
        description="Monthly summary and client report."
        title="Monthly report"
        tone="compact"
      >
        {null}
      </SectionPanel>
    </>
  );
}
