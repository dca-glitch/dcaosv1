import React from "react";
import { Button, EmptyState, Input, MetricCard, SectionPanel, Select, StatusBadge, Textarea, WorkflowPageShell } from "../../components/ui";
import {
  AiDeliveryInlineAlert,
  AiDeliveryInlineEmpty,
  AiDeliveryInlineLoading,
  AiDeliveryInlineNotice,
} from "./ai-delivery-shared-ui";
import "./ai-delivery-modals.css";
import type {
  AiDeliveryContentDraftSummary,
  AiDeliveryContentPlanItemSummary,
  AiDeliveryContentPlanSummary,
  AiDeliveryProjectSummary,
} from "./AiDeliveryPage";

export type AiDeliveryContentPlanItemDraft = {
  localId: string;
  title: string;
  targetKeyword: string;
  searchIntent: string;
  contentType: string;
  notes: string;
  approvalStatus: string;
  clientComment: string;
};

export type AiDeliveryContentPlanWorkflowShell = {
  readiness: string;
  guidance: string;
  researchStep: string;
  sourceStep: string;
  summaryStep: string;
  planStep: string;
  draftStep: string;
  hasResearchRequests: boolean;
  hasResearchSources: boolean;
  hasResearchSummaries: boolean;
  hasPlan: boolean;
  hasPlanItems: boolean;
  hasDraftHandOff: boolean;
  researchCount: number;
  sourceCount: number;
  summaryCount: number;
  planItemCount: number;
  draftCount: number;
};

const CONTENT_PLAN_SEARCH_INTENT_OPTIONS = [
  { value: "", label: "No selection" },
  { value: "informational", label: "Informational" },
  { value: "commercial", label: "Commercial" },
  { value: "transactional", label: "Transactional" },
  { value: "local", label: "Local" },
] as const;

const contentPlanItemApprovalStatuses = ["DRAFT", "CLIENT_APPROVED", "CLIENT_CHANGES_REQUESTED"] as const;

function emptyContentPlanItem(): AiDeliveryContentPlanItemDraft {
  return {
    localId: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: "",
    targetKeyword: "",
    searchIntent: "",
    contentType: "article",
    notes: "",
    approvalStatus: "DRAFT",
    clientComment: "",
  };
}

function moveContentPlanItem(
  items: AiDeliveryContentPlanItemDraft[],
  index: number,
  direction: -1 | 1,
): AiDeliveryContentPlanItemDraft[] {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(index, 1);
  nextItems.splice(targetIndex, 0, movedItem);
  return nextItems;
}

function formatContentPlanSearchIntent(value: string): string {
  const option = CONTENT_PLAN_SEARCH_INTENT_OPTIONS.find((entry) => entry.value === value);
  return option?.label ?? (value ? value.replace(/_/g, " ") : "Not set");
}

export type AiDeliveryContentPlanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  project: AiDeliveryProjectSummary | null;
  loading: boolean;
  saving: boolean;
  busy: boolean;
  error: string | null;
  miContextCount: number;
  plan: AiDeliveryContentPlanSummary | null;
  items: AiDeliveryContentPlanItemDraft[];
  onItemsChange: React.Dispatch<React.SetStateAction<AiDeliveryContentPlanItemDraft[]>>;
  contentDrafts: AiDeliveryContentDraftSummary[];
  generationMessage: string | null;
  pdfMessage: string | null;
  pdfGenerating: boolean;
  pdfReady: boolean | null;
  generatingItemId: string | null;
  workflowShell: AiDeliveryContentPlanWorkflowShell;
  formatContentPlanReviewStatus: (plan: AiDeliveryContentPlanSummary | null) => string;
  formatContentPlanItemApprovalStatus: (value?: string | null) => string;
  formatOptionalDate: (value?: string | null) => string;
  onCreate: (projectId: string) => void;
  onSave: (projectId: string) => void;
  onRequestReview: (projectId: string) => void;
  onRequestChanges: (projectId: string) => void;
  onApprove: (projectId: string) => void;
  onExportPdf: (projectId: string) => void;
  onDownloadPdf: (projectId: string) => void;
  onGenerateDraft: (projectId: string, item: AiDeliveryContentPlanItemSummary) => void;
};

/**
 * P4F Content Plan modal — smoke-compatible dialog name "Monthly SEO / Content Plan".
 * Missing-plan empty state is presentational; classification stays in AiDeliveryPage + ai-delivery-content-plan-load.
 */
export function AiDeliveryContentPlanModal(props: AiDeliveryContentPlanModalProps) {
  const {
    isOpen,
    onClose,
    project,
    loading,
    saving,
    busy,
    error,
    miContextCount,
    plan,
    items,
    onItemsChange,
    contentDrafts,
    generationMessage,
    pdfMessage,
    pdfGenerating,
    pdfReady,
    generatingItemId,
    workflowShell,
    formatContentPlanReviewStatus,
    formatContentPlanItemApprovalStatus,
    formatOptionalDate,
    onCreate,
    onSave,
    onRequestReview,
    onRequestChanges,
    onApprove,
    onExportPdf,
    onDownloadPdf,
    onGenerateDraft,
  } = props;

  if (!isOpen) {
    return null;
  }

  return (
    <WorkflowPageShell onClose={onClose} title="Monthly SEO / Content Plan" titleId="ai-delivery-content-plan-title">
        {loading ? (
          <AiDeliveryInlineLoading label="Loading content plan" />
        ) : project ? (
            <div className="ai-delivery-modal-panel ai-delivery-lane-modal ai-delivery-content-plan-panel stack gap-md">
            {error ? <AiDeliveryInlineAlert message={error} title="Content plan action blocked" /> : null}
            <p className="muted-text">
              <strong>{project.name}</strong>
              {" · "}
              Target month: {project.targetMonth}
              {miContextCount > 0
                ? ` · ${miContextCount} MI context item${miContextCount === 1 ? "" : "s"} applied`
                : " · No MI context applied"}
            </p>
            <AiDeliveryInlineNotice>
              <strong>Context readiness:</strong>{" "}
              {project.brief?.status === "APPROVED" && miContextCount > 0
                ? "Verified intake and context are in place. The plan can be treated as grounded."
                : project.brief?.status === "APPROVED"
                  ? "Intake is approved, but no MI/knowledge context is applied yet. The plan is still a scaffold."
                  : project.brief
                    ? "Intake is started but not approved. Finalize the brief before treating the plan as grounded."
                    : "Intake is missing. The SEO plan should not be treated as final until verified intake and approved context are in place."}
            </AiDeliveryInlineNotice>
            <SectionPanel
              title="Workflow readiness"
              description="Research, plan, draft handoff, and final-readiness status."
              className="metrics-section"
              tone="compact"
            >
              <p className="muted-text">
                <strong>AI SEO readiness:</strong> {workflowShell.readiness}
                {" · "}
                {workflowShell.guidance}
              </p>
              <dl className="brief-grid" style={{ marginTop: "1rem" }}>
                <div>
                  <dt>Research requests</dt>
                  <dd>{workflowShell.researchCount}</dd>
                </div>
                <div>
                  <dt>Research sources</dt>
                  <dd>{workflowShell.sourceCount}</dd>
                </div>
                <div>
                  <dt>Research summaries</dt>
                  <dd>{workflowShell.summaryCount}</dd>
                </div>
                <div>
                  <dt>Content plan items</dt>
                  <dd>{workflowShell.planItemCount}</dd>
                </div>
                <div>
                  <dt>Draft handoffs</dt>
                  <dd>{workflowShell.draftCount}</dd>
                </div>
                <div>
                  <dt>Plan state</dt>
                  <dd>{workflowShell.hasPlan ? formatContentPlanReviewStatus(plan) : "Not created yet"}</dd>
                </div>
              </dl>
              <div className="field-panel" style={{ marginTop: "1rem" }}>
                <div className="summary-grid" style={{ marginTop: "0.5rem" }}>
                  <MetricCard label="Research" value={workflowShell.hasResearchRequests ? "Started" : "Pending"} helper={workflowShell.researchStep} />
                  <MetricCard label="Sources" value={workflowShell.hasResearchSources ? "Recorded" : "Pending"} helper={workflowShell.sourceStep} />
                  <MetricCard label="Summaries" value={workflowShell.hasResearchSummaries ? "Ready" : "Pending"} helper={workflowShell.summaryStep} />
                  <MetricCard label="Content plan" value={workflowShell.hasPlan ? "Open" : "Pending"} helper={workflowShell.planStep} />
                  <MetricCard label="Draft handoff" value={workflowShell.hasDraftHandOff ? "Ready" : "Pending"} helper={workflowShell.draftStep} />
                </div>
              </div>
            </SectionPanel>
            {plan ? (
              <>
                <section className="field-panel ai-delivery-section-compact">
                  <h3>SEO topic/research planning</h3>
                  <AiDeliveryInlineNotice>
                    Planning items are objectives only. Generated admin drafts are internal scaffolds — not final client copy — until the compliance review checkpoint and admin review pass.
                  </AiDeliveryInlineNotice>
                  {generationMessage ? <AiDeliveryInlineNotice>{generationMessage}</AiDeliveryInlineNotice> : null}
                  {pdfMessage ? <AiDeliveryInlineNotice>{pdfMessage}</AiDeliveryInlineNotice> : null}
                </section>
                <dl className="brief-grid">
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <StatusBadge
                        displayLabel={formatContentPlanReviewStatus(plan)}
                        status={plan?.status ?? "DRAFT"}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt>Revisions</dt>
                    <dd>{plan.revisionCount ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Review requested</dt>
                    <dd>{formatOptionalDate(plan.reviewRequestedAt)}</dd>
                  </div>
                  <div>
                    <dt>Approved</dt>
                    <dd>{formatOptionalDate(plan.approvedAt)}</dd>
                  </div>
                </dl>

                <section className="field-panel ai-delivery-section-compact">
                  <h3>Monthly plan items</h3>
                  {items.length === 0 ? (
                    <AiDeliveryInlineEmpty>No monthly plan items yet. Add a topic to start planning.</AiDeliveryInlineEmpty>
                  ) : null}
                  {items.map((item, index) => {
                    const persistedItem = plan.items.find((planItem) => planItem.id === item.localId) ?? null;
                    const linkedDraft = persistedItem?.id
                      ? contentDrafts.find((draftItem) => draftItem.contentPlanItemId === persistedItem.id && !draftItem.isArchived) ?? null
                      : null;

                    return (
                    <div className="field-grid" key={item.localId}>
                      <Input
                        className="field-span-2"
                        fullWidth
                        helperText="Used by admin to prepare monthly platform-neutral SEO/content work."
                        label="Topic / working title - Required"
                        maxLength={255}
                        onChange={(event) => onItemsChange((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, title: event.target.value } : draftItem))}
                        placeholder="Main topic, keyword cluster, or service page focus"
                        required
                        value={item.title}
                      />
                      <Input
                        fullWidth
                        helperText="Visible only to admin team."
                        label="Target keyword - Optional"
                        maxLength={80}
                        onChange={(event) => onItemsChange((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, targetKeyword: event.target.value } : draftItem))}
                        placeholder="Primary keyword or search phrase"
                        value={item.targetKeyword}
                      />
                      <Select
                        fullWidth
                        helperText="Stored with the plan item for monthly SEO planning."
                        label="Search intent - Optional"
                        onChange={(event) => onItemsChange((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, searchIntent: event.target.value } : draftItem))}
                        options={CONTENT_PLAN_SEARCH_INTENT_OPTIONS.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                        value={item.searchIntent}
                      />
                      <Textarea
                        className="field-span-2"
                        fullWidth
                        helperText="Admin-only notes for this monthly plan item."
                        label="Planning notes - Optional"
                        maxLength={4000}
                        onChange={(event) => onItemsChange((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, notes: event.target.value } : draftItem))}
                        placeholder="Audience angle, SERP notes, internal review context"
                        rows={3}
                        value={item.notes}
                      />
                      <Input
                        fullWidth
                        helperText="Internal planning label for the monthly content plan."
                        label="Production type - Optional"
                        maxLength={80}
                        onChange={(event) => onItemsChange((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, contentType: event.target.value } : draftItem))}
                        placeholder="Blog post, service page, landing page, or other"
                        value={item.contentType}
                      />
                      <Select
                        fullWidth
                        helperText="Internal review state for this monthly plan item."
                        label="Item status - Required"
                        onChange={(event) => onItemsChange((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, approvalStatus: event.target.value } : draftItem))}
                        options={contentPlanItemApprovalStatuses.map((status) => ({
                          value: status,
                          label: formatContentPlanItemApprovalStatus(status),
                        }))}
                        value={item.approvalStatus}
                      />
                      <div>
                        <span>Priority</span>
                        <strong>{index + 1}</strong>
                        <span className="muted-text">{formatContentPlanSearchIntent(item.searchIntent)} intent • lower numbers publish first.</span>
                        <div className="modal-footer modal-footer--flush ai-delivery-modal-footer">
                          <Button
                            disabled={busy || index === 0}
                            onClick={() => onItemsChange((current) => moveContentPlanItem(current, index, -1))}
                            type="button"
                            variant="tertiary"
                          >
                            Move up
                          </Button>
                          <Button
                            disabled={busy || index === items.length - 1}
                            onClick={() => onItemsChange((current) => moveContentPlanItem(current, index, 1))}
                            type="button"
                            variant="tertiary"
                          >
                            Move down
                          </Button>
                        </div>
                      </div>
                      <div>
                        <span>Current item status</span>
                        <strong>{formatContentPlanItemApprovalStatus(plan.items[index]?.approvalStatus)}</strong>
                        <span className="muted-text">Latest persisted approval state for this record.</span>
                      </div>
                      <div className="field-span-2">
                        <Textarea
                          fullWidth
                          helperText="Use for internal approval context and any revision note that may later support review handling."
                          label="Approval / revision note - Optional"
                          maxLength={4000}
                          onChange={(event) => onItemsChange((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, clientComment: event.target.value } : draftItem))}
                          placeholder="Why this item is approved, still planned, or needs revision before review"
                          rows={3}
                          value={item.clientComment}
                        />
                      </div>
                      <div className="field-span-2">
                        <span>Saved approval / revision note</span>
                        <strong>{persistedItem?.clientComment ?? "No approval note yet"}</strong>
                        <span className="muted-text">Latest persisted approval or revision note for this item.</span>
                      </div>
                      <div className="field-span-2">
                        <div className="modal-footer modal-footer--flush ai-delivery-modal-footer">
                          <Button
                            disabled={busy || !persistedItem?.id || persistedItem.approvalStatus === "CLIENT_CHANGES_REQUESTED"}
                            onClick={() => (persistedItem ? onGenerateDraft(project.id, persistedItem) : undefined)}
                            title={!persistedItem?.id ? "Save the monthly content plan before generating a draft from this item." : undefined}
                            type="button"
                            variant="tertiary"
                          >
                            {generatingItemId === persistedItem?.id ? "Generating draft" : linkedDraft ? "Regenerate admin draft" : "Generate admin draft"}
                          </Button>
                        </div>
                        <span className="muted-text">
                          {!persistedItem?.id
                            ? "Save the plan before generating a linked admin draft."
                            : "Admin-only draft scaffold from this plan item. Not final client copy until compliance review and admin review pass."}
                        </span>
                      </div>
                      <div className="field-span-2">
                        <Button
                          disabled={busy}
                          onClick={() => onItemsChange((current) => current.filter((draftItem) => draftItem.localId !== item.localId))}
                          type="button"
                          variant="destructive"
                        >
                          Remove topic
                        </Button>
                      </div>
                    </div>
                    );
                  })}
                  <Button
                    disabled={busy}
                    onClick={() => onItemsChange((current) => [...current, emptyContentPlanItem()])}
                    type="button"
                    variant="secondary"
                  >
                    Add monthly plan item
                  </Button>
                </section>

                <div className="modal-footer ai-delivery-modal-footer">
                  <Button disabled={busy} onClick={onClose} type="button" variant="tertiary">Close</Button>
                  <Button disabled={busy || pdfGenerating} onClick={() => onExportPdf(project.id)} type="button" variant="tertiary">
                    {pdfGenerating ? "Generating PDF…" : "Export PDF"}
                  </Button>
                  <Button disabled={busy || pdfGenerating || pdfReady !== true} onClick={() => onDownloadPdf(project.id)} type="button" variant="tertiary">Download PDF</Button>
                  <span className="muted-text" role="status">{pdfReady === true ? "PDF ready" : pdfReady === false ? "No PDF generated yet" : ""}</span>
                  <Button disabled={busy} onClick={() => onRequestReview(project.id)} type="button" variant="secondary">Mark ready for review</Button>
                  <Button disabled={busy} onClick={() => onRequestChanges(project.id)} type="button" variant="secondary">Request changes</Button>
                  <Button disabled={busy} onClick={() => onApprove(project.id)} type="button" variant="secondary">Approve plan</Button>
                  <Button disabled={busy || items.some((item) => !item.title.trim())} onClick={() => onSave(project.id)} type="button" variant="primary">
                    {saving ? "Saving" : "Save draft"}
                  </Button>
                </div>
                </>

            ) : (
              <div>
                <EmptyState
                  title="No AI SEO content plan yet"
                  message="This project does not have an AI SEO content plan yet. Create or generate a plan to get started."
                  action={(
                    <Button disabled={busy} onClick={() => onCreate(project.id)} type="button" variant="primary">
                      {saving ? "Creating" : "Create content plan"}
                    </Button>
                  )}
                />
              </div>
            )}
          </div>
        ) : (
          <div>Project not found.</div>
        )}

    </WorkflowPageShell>
  );
}
