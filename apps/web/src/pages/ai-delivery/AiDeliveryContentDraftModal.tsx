import React from "react";
import { Modal } from "../../components/ui";
import { StatusBadge } from "../../components/ui";
import {
  AiDeliveryInlineAlert,
  AiDeliveryInlineEmpty,
  AiDeliveryInlineLoading,
  AiDeliveryInlineNotice,
} from "./ai-delivery-shared-ui";
import "./ai-delivery-modals.css";
import type {
  AiDeliveryContentDraftFormValues,
  AiDeliveryContentDraftSummary,
  AiDeliveryContentPlanItemSummary,
  AiDeliveryProjectSummary,
} from "./AiDeliveryPage";

export type AiDeliveryContentDraftReviewReadiness = {
  ready: boolean;
  message: string;
};

export type AiDeliveryContentDraftModalProps = {
  isOpen: boolean;
  onClose: () => void;
  project: AiDeliveryProjectSummary | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  handoffMessage: string | null;
  actionGuidance: string;
  contentDrafts: AiDeliveryContentDraftSummary[];
  eligiblePlanItems: AiDeliveryContentPlanItemSummary[];
  form: AiDeliveryContentDraftFormValues;
  onFormChange: React.Dispatch<React.SetStateAction<AiDeliveryContentDraftFormValues>>;
  editorId: string | null;
  activeRecord: AiDeliveryContentDraftSummary | null;
  linkedImages: Array<{ status: string }>;
  linkedDeliverables: Array<{ status: string }>;
  activeArticleImageCount: number;
  activeDeliverableCount: number;
  editorLinkedPlanLabel: string;
  saveStateLabel: string;
  reviewReadiness: AiDeliveryContentDraftReviewReadiness;
  canSave: boolean;
  canMarkReady: boolean;
  canReturn: boolean;
  primaryActionLabel: string;
  formatContentDraftStatus: (value?: string | null) => string;
  formatContentPlanItemApprovalStatus: (value?: string | null) => string;
  formatOptionalDate: (value?: string | null) => string;
  formatPreview: (value?: string | null) => string;
  formatStatusBreakdown: (items: Array<{ status: string }>, fallback?: string) => string;
  onNewDraft: () => void;
  onSave: (projectId: string) => void;
  onStartFromPlanItem: (item: AiDeliveryContentPlanItemSummary) => void;
  onEdit: (draft: AiDeliveryContentDraftSummary) => void;
  onArchive: (projectId: string, draftId: string) => void;
  onRequestReview: (projectId: string, draftId: string) => void;
  onReturnToDraft: (projectId: string, draftId: string) => void;
  onHandoffToImages: (projectId: string, draftId: string) => void;
  onHandoffToDeliverables: (projectId: string, draftId: string) => void;
};

const CONTENT_DRAFT_STATUS_OPTIONS = ["DRAFT", "READY_FOR_REVIEW", "CHANGES_REQUESTED", "ARCHIVED"] as const;

/**
 * P4G Content Draft / AI Content Production modal.
 * Accessible dialog name: "AI Content Production" (smoke-compatible).
 * Generate/regenerate admin drafts remain in the Content Plan lane (P4F).
 * Version history UI is not part of the current Content Draft modal contract.
 */
export function AiDeliveryContentDraftModal({
  isOpen,
  onClose,
  project,
  loading,
  saving,
  error,
  handoffMessage,
  actionGuidance,
  contentDrafts,
  eligiblePlanItems,
  form,
  onFormChange,
  editorId,
  activeRecord,
  linkedImages,
  linkedDeliverables,
  activeArticleImageCount,
  activeDeliverableCount,
  editorLinkedPlanLabel,
  saveStateLabel,
  reviewReadiness,
  canSave,
  canMarkReady,
  canReturn,
  primaryActionLabel,
  formatContentDraftStatus,
  formatContentPlanItemApprovalStatus,
  formatOptionalDate,
  formatPreview,
  formatStatusBreakdown,
  onNewDraft,
  onSave,
  onStartFromPlanItem,
  onEdit,
  onArchive,
  onRequestReview,
  onReturnToDraft,
  onHandoffToImages,
  onHandoffToDeliverables,
}: AiDeliveryContentDraftModalProps) {
  if (!isOpen) {
    return null;
  }

  const activeDraftCount = contentDrafts.filter((draft) => !draft.isArchived).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="AI Content Production">
      {loading ? (
        <AiDeliveryInlineLoading label="Loading content drafts" />
      ) : project ? (
        <div className="ai-delivery-modal-panel ai-delivery-lane-modal ai-delivery-content-drafts-panel stack gap-md">
          {error ? <AiDeliveryInlineAlert message={error} title="Content draft action blocked" /> : null}
          <AiDeliveryInlineNotice>
            <strong>Production chain:</strong> plan item → draft → images → deliverable → report.
            {" · "}
            {project.targetMonth} · {eligiblePlanItems.length} ready plan item(s) · {activeDraftCount} active draft(s) · {activeArticleImageCount} image record(s) · {activeDeliverableCount} deliverable record(s)
          </AiDeliveryInlineNotice>
          <section className="field-panel ai-delivery-section-compact">
            <h3>Article production planning</h3>
            <AiDeliveryInlineNotice>{actionGuidance}</AiDeliveryInlineNotice>
            {handoffMessage ? <AiDeliveryInlineNotice>{handoffMessage}</AiDeliveryInlineNotice> : null}
            <div className="field-panel">
              <h4>Editor summary</h4>
              <dl className="brief-grid">
                <div>
                  <dt>Editor mode</dt>
                  <dd>{editorId ? "Editing saved draft" : "Preparing new draft"}</dd>
                </div>
                <div>
                  <dt>Save state</dt>
                  <dd>{saveStateLabel}</dd>
                </div>
                <div>
                  <dt>Linked plan item</dt>
                  <dd>{editorLinkedPlanLabel}</dd>
                </div>
                <div>
                  <dt>Review readiness</dt>
                  <dd>{reviewReadiness.ready ? "Ready for admin review" : "Needs attention before review"}</dd>
                </div>
                <div>
                  <dt>Ready items available</dt>
                  <dd>{eligiblePlanItems.length}</dd>
                </div>
                {activeRecord ? (
                  <>
                    <div>
                      <dt>Linked images</dt>
                      <dd>{linkedImages.length}</dd>
                    </div>
                    <div>
                      <dt>Linked deliverables</dt>
                      <dd>{linkedDeliverables.length}</dd>
                    </div>
                  </>
                ) : null}
              </dl>
              {!reviewReadiness.ready ? <p className="muted-text">{reviewReadiness.message}</p> : null}
            </div>
            <div className="field-panel">
              <h4>Approved / planned content plan items</h4>
              {eligiblePlanItems.length === 0 ? (
                <AiDeliveryInlineEmpty>No ready plan items yet. Approve or add content plan items to continue draft production.</AiDeliveryInlineEmpty>
              ) : null}
              {eligiblePlanItems.map((item) => {
                const linkedDraft = contentDrafts.find((draftItem) => draftItem.contentPlanItemId === item.id && !draftItem.isArchived) ?? null;
                return (
                  <article className="entity-card" key={item.id ?? `${item.sortOrder}-${item.title}`}>
                    <div className="entity-card-header">
                      <div>
                        <StatusBadge status={formatContentPlanItemApprovalStatus(item.approvalStatus)} />
                        <h4>
                          {item.sortOrder}. {item.title}
                        </h4>
                        <p>{item.targetKeyword ? `Target keyword: ${item.targetKeyword}` : "No target keyword recorded yet."}</p>
                      </div>
                      <div className="card-actions">
                        <button
                          className={linkedDraft ? "ghost-action" : "primary-action"}
                          disabled={saving}
                          onClick={() => onStartFromPlanItem(item)}
                          type="button"
                        >
                          {linkedDraft ? "Edit linked draft" : "Create linked draft"}
                        </button>
                      </div>
                    </div>
                    <dl className="brief-grid">
                      <div>
                        <dt>Plan approval</dt>
                        <dd>{formatContentPlanItemApprovalStatus(item.approvalStatus)}</dd>
                      </div>
                      <div>
                        <dt>Linked draft</dt>
                        <dd>{linkedDraft ? linkedDraft.title : "No active draft linked yet"}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Planning notes</dt>
                        <dd>{item.notes ?? "No plan item notes"}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Client note</dt>
                        <dd>{item.clientComment ?? "No client note"}</dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
            {activeRecord ? (
              <div className="field-panel">
                <h4>Current draft status</h4>
                <dl className="brief-grid">
                  <div>
                    <dt>Status</dt>
                    <dd>{formatContentDraftStatus(activeRecord.status)}</dd>
                  </div>
                  <div>
                    <dt>Linked plan item</dt>
                    <dd>{editorLinkedPlanLabel}</dd>
                  </div>
                  <div>
                    <dt>Review requested</dt>
                    <dd>{formatOptionalDate(activeRecord.reviewRequestedAt)}</dd>
                  </div>
                  <div>
                    <dt>Approved</dt>
                    <dd>{formatOptionalDate(activeRecord.approvedAt)}</dd>
                  </div>
                  <div>
                    <dt>Revision count</dt>
                    <dd>{activeRecord.revisionCount ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Client comment</dt>
                    <dd>{activeRecord.clientComment ?? "No client comment"}</dd>
                  </div>
                </dl>
              </div>
            ) : null}
            {activeRecord ? (
              <div className="field-panel">
                <h4>Completion and export handoff</h4>
                <AiDeliveryInlineNotice>
                  Same-project image planning and deliverable records only. Internal admin handoff — does not publish, export, or expose client delivery.
                </AiDeliveryInlineNotice>
                <dl className="brief-grid">
                  <div>
                    <dt>Linked image records</dt>
                    <dd>{linkedImages.length}</dd>
                  </div>
                  <div>
                    <dt>Image status mix</dt>
                    <dd>{formatStatusBreakdown(linkedImages, "No linked image records yet")}</dd>
                  </div>
                  <div>
                    <dt>Linked deliverables</dt>
                    <dd>{linkedDeliverables.length}</dd>
                  </div>
                  <div>
                    <dt>Deliverable status mix</dt>
                    <dd>{formatStatusBreakdown(linkedDeliverables, "No linked deliverables yet")}</dd>
                  </div>
                </dl>
                <div className="card-actions card-actions-spaced">
                  <button
                    className="ghost-action"
                    disabled={saving}
                    onClick={() => void onHandoffToImages(project.id, activeRecord.id)}
                    type="button"
                  >
                    Open image planning
                  </button>
                  <button
                    className="ghost-action"
                    disabled={saving}
                    onClick={() => void onHandoffToDeliverables(project.id, activeRecord.id)}
                    type="button"
                  >
                    Open deliverable packaging
                  </button>
                </div>
              </div>
            ) : null}
            <div className="field-grid field-grid-compact">
              <label>
                Status - Required
                <select
                  value={form.status}
                  onChange={(event) => onFormChange((current) => ({ ...current, status: event.target.value }))}
                >
                  {CONTENT_DRAFT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {formatContentDraftStatus(status)}
                    </option>
                  ))}
                </select>
                <span className="muted-text">Admin-only production state.</span>
              </label>
              <label>
                Linked SEO topic / monthly content plan item - Optional
                <select
                  value={form.contentPlanItemId ?? ""}
                  onChange={(event) =>
                    onFormChange((current) => ({ ...current, contentPlanItemId: event.target.value || null }))
                  }
                >
                  <option value="">Manual / unlinked production record</option>
                  {eligiblePlanItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sortOrder}. {item.title} ({formatContentPlanItemApprovalStatus(item.approvalStatus)})
                    </option>
                  ))}
                </select>
                <span className="muted-text">Link to the monthly content plan item this draft fulfills.</span>
              </label>
              <label className="field-span-2">
                Title - Required
                <input
                  maxLength={255}
                  placeholder="Working article title or draft headline"
                  required
                  value={form.title}
                  onChange={(event) => onFormChange((current) => ({ ...current, title: event.target.value }))}
                />
                <span className="muted-text">Platform-neutral article title for admin editing.</span>
              </label>
              <label>
                Slug - Optional
                <input
                  maxLength={255}
                  placeholder="Optional URL slug or short working slug"
                  value={form.slug}
                  onChange={(event) => onFormChange((current) => ({ ...current, slug: event.target.value }))}
                />
                <span className="muted-text">Admin-only.</span>
              </label>
              <label className="field-span-2">
                Draft body - Required before client review
                <textarea
                  maxLength={4000}
                  placeholder="Manual draft body, article outline, sections, and review-ready copy"
                  rows={8}
                  value={form.draftBody}
                  onChange={(event) => onFormChange((current) => ({ ...current, draftBody: event.target.value }))}
                />
                <span className="muted-text">Save before using ready-for-review.</span>
              </label>
              <label className="field-span-2">
                Review / admin notes - Optional
                <textarea
                  maxLength={4000}
                  placeholder="Admin comments, blockers, revision guidance, or handoff notes"
                  rows={3}
                  value={form.notes}
                  onChange={(event) => onFormChange((current) => ({ ...current, notes: event.target.value }))}
                />
                <span className="muted-text">Admin-only. Client comments appear in draft status above.</span>
              </label>
            </div>
            <div className="modal-footer ai-delivery-modal-footer">
              <button className="ghost-action" disabled={saving} onClick={onClose} type="button">
                Close
              </button>
              <button className="ghost-action" disabled={saving} onClick={onNewDraft} type="button">
                New draft
              </button>
              <button
                className="primary-action"
                disabled={saving || !canSave}
                onClick={() => void onSave(project.id)}
                type="button"
              >
                {saving ? "Saving" : primaryActionLabel}
              </button>
              {activeRecord && !activeRecord.isArchived ? (
                <button
                  className="secondary-action"
                  disabled={saving || !canMarkReady}
                  onClick={() => void onRequestReview(project.id, activeRecord.id)}
                  type="button"
                >
                  Mark ready for review
                </button>
              ) : null}
              {activeRecord && !activeRecord.isArchived && activeRecord.status !== "DRAFT" ? (
                <button
                  className="secondary-action"
                  disabled={saving || !canReturn}
                  onClick={() => void onReturnToDraft(project.id, activeRecord.id)}
                  type="button"
                >
                  Return to draft
                </button>
              ) : null}
            </div>
          </section>

          <section className="field-panel ai-delivery-section-compact">
            <h3>Existing article production records</h3>
            {contentDrafts.length === 0 ? (
              <AiDeliveryInlineEmpty>
                No content drafts yet. Approve or select a plan item above, then generate the first linked draft for admin editing.
              </AiDeliveryInlineEmpty>
            ) : null}
            {contentDrafts.map((draftItem) => (
              <article className="entity-card" key={draftItem.id}>
                <div className="entity-card-header">
                  <div>
                    <StatusBadge status={formatContentDraftStatus(draftItem.isArchived ? "ARCHIVED" : draftItem.status)} />
                    <h3>{draftItem.title}</h3>
                    <p>
                      {draftItem.contentPlanItem
                        ? `Linked to SEO topic: ${draftItem.contentPlanItem.title}`
                        : "Manual / unlinked production record"}
                    </p>
                  </div>
                  <div className="card-actions">
                    <button className="ghost-action" disabled={saving} onClick={() => onEdit(draftItem)} type="button">
                      Edit
                    </button>
                    {!draftItem.isArchived ? (
                      <button
                        className="secondary-action"
                        disabled={saving || !draftItem.draftBody.trim() || draftItem.status === "READY_FOR_REVIEW"}
                        onClick={() => void onRequestReview(project.id, draftItem.id)}
                        type="button"
                      >
                        Mark ready for review
                      </button>
                    ) : null}
                    {!draftItem.isArchived && draftItem.status !== "DRAFT" ? (
                      <button
                        className="ghost-action"
                        disabled={saving}
                        onClick={() => void onReturnToDraft(project.id, draftItem.id)}
                        type="button"
                      >
                        Return to draft
                      </button>
                    ) : null}
                    {!draftItem.isArchived ? (
                      <button
                        className="ghost-action"
                        disabled={saving}
                        onClick={() => void onArchive(project.id, draftItem.id)}
                        type="button"
                      >
                        Archive
                      </button>
                    ) : null}
                  </div>
                </div>
                <dl className="brief-grid">
                  <div>
                    <dt>Status</dt>
                    <dd>{formatContentDraftStatus(draftItem.status)}</dd>
                  </div>
                  <div>
                    <dt>Slug</dt>
                    <dd>{draftItem.slug ?? "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Review requested</dt>
                    <dd>{formatOptionalDate(draftItem.reviewRequestedAt)}</dd>
                  </div>
                  <div>
                    <dt>Approved</dt>
                    <dd>{formatOptionalDate(draftItem.approvedAt)}</dd>
                  </div>
                  <div>
                    <dt>Revisions</dt>
                    <dd>{draftItem.revisionCount ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Client comment</dt>
                    <dd>{draftItem.clientComment ?? "No client comment"}</dd>
                  </div>
                  <div className="field-span-2">
                    <dt>Draft body preview</dt>
                    <dd>{formatPreview(draftItem.draftBody)}</dd>
                  </div>
                  <div className="field-span-2">
                    <dt>Admin notes preview</dt>
                    <dd>{formatPreview(draftItem.notes)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </section>
        </div>
      ) : (
        <div>Project not found.</div>
      )}
    </Modal>
  );
}
