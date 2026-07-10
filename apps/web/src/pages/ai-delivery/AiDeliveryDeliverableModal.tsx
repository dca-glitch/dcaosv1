import React from "react";
import { Modal } from "../../components/Modal";
import { StatusBadge } from "../../components/ui";
import {
  AiDeliveryInlineAlert,
  AiDeliveryInlineEmpty,
  AiDeliveryInlineLoading,
  AiDeliveryInlineNotice,
} from "./ai-delivery-shared-ui";
import "./ai-delivery-modals.css";
import type {
  AiDeliveryArticleImageSummary,
  AiDeliveryContentDraftSummary,
  AiDeliveryDeliverableFormValues,
  AiDeliveryDeliverableReviewFormValues,
  AiDeliveryDeliverableReviewSummary,
  AiDeliveryDeliverableSummary,
  AiDeliveryGoogleDocExportResult,
  AiDeliveryProjectSummary,
  AiDeliveryWordPressPreparedDraft,
  AiDeliveryWordPressPublishResult,
} from "./AiDeliveryPage";


const emptyDeliverableForm = (): AiDeliveryDeliverableFormValues => ({
  contentDraftId: null,
  articleImageId: null,
  title: "",
  description: null,
  deliveryType: "CONTENT_PACKAGE",
  status: "DRAFT",
  exportUrl: null,
  storageKey: null,
  notes: null,
  isArchived: false,
});

const emptyDeliverableReview = (): AiDeliveryDeliverableReviewFormValues => ({
  status: "NOT_STARTED",
  reviewerName: "",
  reviewNotes: "",
});

export type AiDeliveryPublicationTargetOption = {
  id: string;
  label: string;
  siteUrl: string;
  isDefault?: boolean;
};

export type AiDeliveryPublicationLogSummary = {
  id: string;
  aiDeliveryProjectId: string | null;
  deliverableId: string | null;
  action: string;
  status: string;
  siteUrlHost?: string | null;
  note?: string | null;
  createdAt: string;
};

export type AiDeliveryPublicationCredentialStatus = {
  configured: boolean;
  encryptionAvailable: boolean;
};

export type AiDeliveryDeliverableModalProps = {
  isOpen: boolean;
  onClose: () => void;
  project: AiDeliveryProjectSummary | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  actionGuidance: string;
  deliverables: AiDeliveryDeliverableSummary[];
  visibleDeliverables: AiDeliveryDeliverableSummary[];
  activeDeliverableCount: number;
  archivedDeliverableCount: number;
  activeDeliverableRecord: AiDeliveryDeliverableSummary | null;
  deliverableEditorId: string | null;
  deliverableForm: AiDeliveryDeliverableFormValues;
  onFormChange: React.Dispatch<React.SetStateAction<AiDeliveryDeliverableFormValues>>;
  onEditorIdChange: (id: string | null) => void;
  deliverableDraftOptions: AiDeliveryContentDraftSummary[];
  deliverableArticleImageOptions: AiDeliveryArticleImageSummary[];
  deliverableLinkedDraftRecord: AiDeliveryContentDraftSummary | null;
  deliverableLinkedImageRecord: AiDeliveryArticleImageSummary | null;
  deliverableRelatedImages: AiDeliveryArticleImageSummary[];
  deliverableHasRecordedReference: boolean;
  deliverableReadinessBlockers: string[];
  deliverableDocumentFiles: Record<string, File | null>;
  onDocumentFilesChange: React.Dispatch<React.SetStateAction<Record<string, File | null>>>;
  deliverableUploadTargetId: string | null;
  deliverableDownloadTargetId: string | null;
  deliverableDownloadRefLoading: boolean;
  deliverableDownloadRefError: { recordId: string; message: string } | null;
  deliverableDownloadRef: {
    recordId: string;
    storageKey: string;
    downloadUrl: string | null;
    expiresSeconds: number | null;
  } | null;
  deliverableWordPressDraftTargetId: string | null;
  deliverableWordPressDraftError: { recordId: string; message: string } | null;
  deliverableWordPressDraft: { recordId: string; wordpressDraft: AiDeliveryWordPressPreparedDraft } | null;
  deliverableWordPressPublishTargetId: string | null;
  deliverableWordPressPublishError: { recordId: string; message: string } | null;
  deliverableWordPressPublishResult: { recordId: string; result: AiDeliveryWordPressPublishResult } | null;
  deliverablePublicationTargets: AiDeliveryPublicationTargetOption[];
  deliverablePublicationTargetId: string;
  onPublicationTargetIdChange: (id: string) => void;
  selectedPublicationTarget: AiDeliveryPublicationTargetOption | null;
  deliverablePublicationCredentialStatus: AiDeliveryPublicationCredentialStatus | null;
  projectPublicationLogs: AiDeliveryPublicationLogSummary[];
  deliverableGoogleDocExportTargetId: string | null;
  deliverableGoogleDocExportError: { recordId: string; message: string } | null;
  deliverableGoogleDocExportResult: { recordId: string; result: AiDeliveryGoogleDocExportResult } | null;
  selectedReviewDeliverable: AiDeliveryDeliverableSummary | null;
  selectedReviewDeliverableId: string | null;
  deliverableReviewsLoading: boolean;
  deliverableReviewsSaving: boolean;
  deliverableReviewsError: string | null;
  deliverableReviews: AiDeliveryDeliverableReviewSummary[];
  deliverableReviewEditorId: string | null;
  deliverableReviewForm: AiDeliveryDeliverableReviewFormValues;
  onReviewFormChange: React.Dispatch<React.SetStateAction<AiDeliveryDeliverableReviewFormValues>>;
  onReviewEditorIdChange: (id: string | null) => void;
  latestSelectedReview: AiDeliveryDeliverableReviewSummary | null;
  loadedDeliverableReviews: Record<string, AiDeliveryDeliverableReviewSummary[]>;
  formatDeliverableStatus: (value?: string | null) => string;
  formatContentDraftStatus: (value?: string | null) => string;
  formatArticleImageStatus: (value?: string | null) => string;
  formatEnumLabel: (value?: string | null) => string;
  formatOptionalDate: (value?: string | null) => string;
  formatPreview: (value?: string | null) => string;
  formatStatusBreakdown: (items: Array<{ status: string }>, emptyLabel: string) => string;
  getDeliverableExportState: (item: AiDeliveryDeliverableSummary) => string;
  getMostRecentReview: (reviews: AiDeliveryDeliverableReviewSummary[]) => AiDeliveryDeliverableReviewSummary | null;
  onEditDeliverable: (item: AiDeliveryDeliverableSummary) => void;
  onSaveDeliverable: (projectId: string) => void;
  onMarkReady: (projectId: string, deliverableId: string) => void;
  onRequestRevision: (projectId: string, deliverableId: string) => void;
  onAccept: (projectId: string, deliverableId: string) => void;
  onArchive: (projectId: string, deliverableId: string) => void;
  onRestore: (projectId: string, deliverableId: string) => void;
  onUploadDocument: (projectId: string, deliverableId: string) => void;
  onOpenDocument: (projectId: string, deliverableId: string) => void;
  onFetchDownloadReference: (projectId: string, deliverableId: string) => void;
  onPrepareWordPressDraft: (projectId: string, deliverableId: string) => void;
  onRequestWordPressPublish: (projectId: string, deliverableId: string, title: string) => void;
  onExportGoogleDoc: (projectId: string, deliverableId: string) => void;
  onOpenReviews: (projectId: string, deliverableId: string) => void;
  onEditReview: (review: AiDeliveryDeliverableReviewSummary) => void;
  onSaveReview: (projectId: string) => void;
};

/**
 * P4B Deliverable Detail modal — smoke-compatible dialog name "Deliverables".
 */
export function AiDeliveryDeliverableModal(props: AiDeliveryDeliverableModalProps) {
  const {
    isOpen,
    onClose,
    project,
    loading,
    saving,
    error,
    actionGuidance: deliverableActionGuidance,
    deliverables,
    visibleDeliverables,
    activeDeliverableCount,
    archivedDeliverableCount,
    activeDeliverableRecord,
    deliverableEditorId,
    deliverableForm,
    onFormChange,
    onEditorIdChange,
    deliverableDraftOptions,
    deliverableArticleImageOptions,
    deliverableLinkedDraftRecord,
    deliverableLinkedImageRecord,
    deliverableRelatedImages,
    deliverableHasRecordedReference,
    deliverableReadinessBlockers,
    deliverableDocumentFiles,
    onDocumentFilesChange,
    deliverableUploadTargetId,
    deliverableDownloadTargetId,
    deliverableDownloadRefLoading,
    deliverableDownloadRefError,
    deliverableDownloadRef,
    deliverableWordPressDraftTargetId,
    deliverableWordPressDraftError,
    deliverableWordPressDraft,
    deliverableWordPressPublishTargetId,
    deliverableWordPressPublishError,
    deliverableWordPressPublishResult,
    deliverablePublicationTargets,
    deliverablePublicationTargetId,
    onPublicationTargetIdChange,
    selectedPublicationTarget,
    deliverablePublicationCredentialStatus,
    projectPublicationLogs,
    deliverableGoogleDocExportTargetId,
    deliverableGoogleDocExportError,
    deliverableGoogleDocExportResult,
    selectedReviewDeliverable,
    selectedReviewDeliverableId,
    deliverableReviewsLoading,
    deliverableReviewsSaving,
    deliverableReviewsError,
    deliverableReviews,
    deliverableReviewEditorId,
    deliverableReviewForm,
    onReviewFormChange,
    onReviewEditorIdChange,
    latestSelectedReview,
    loadedDeliverableReviews,
    formatDeliverableStatus,
    formatContentDraftStatus,
    formatArticleImageStatus,
    formatEnumLabel,
    formatOptionalDate,
    formatPreview,
    formatStatusBreakdown,
    getDeliverableExportState,
    getMostRecentReview,
    onEditDeliverable: editDeliverable,
    onSaveDeliverable: saveDeliverable,
    onMarkReady: markDeliverableReady,
    onRequestRevision: requestDeliverableRevision,
    onAccept: acceptDeliverable,
    onArchive: archiveDeliverable,
    onRestore: restoreDeliverable,
    onUploadDocument: uploadDeliverableDocument,
    onOpenDocument: openDeliverableDocument,
    onFetchDownloadReference: fetchDeliverableDownloadReference,
    onPrepareWordPressDraft: prepareDeliverableWordPressDraft,
    onRequestWordPressPublish: requestWordPressPublish,
    onExportGoogleDoc: exportDeliverableToGoogleDoc,
    onOpenReviews: openDeliverableReviews,
    onEditReview: editDeliverableReview,
    onSaveReview: saveDeliverableReview,
  } = props;

  if (!isOpen) {
    return null;
  }

  return (
    <Modal onClose={onClose} size="lg" title="Deliverables">
        {loading ? (
          <AiDeliveryInlineLoading label="Loading deliverables" />
        ) : project ? (
          <div className="ai-delivery-modal-panel ai-delivery-lane-modal ai-delivery-deliverables-panel stack gap-md">
            {error ? <AiDeliveryInlineAlert message={error} title="Deliverable action blocked" /> : null}
            <section className="field-panel ai-delivery-section-compact">
              <h3>Deliverable editor</h3>
              <AiDeliveryInlineNotice>{deliverableActionGuidance}</AiDeliveryInlineNotice>
              {activeDeliverableRecord ? (
                <div className="field-panel">
                  <h4>Current deliverable status</h4>
                  <dl className="brief-grid">
                    <div>
                      <dt>Status</dt>
                      <dd>{formatDeliverableStatus(activeDeliverableRecord.isArchived ? "ARCHIVED" : activeDeliverableRecord.status)}</dd>
                    </div>
                    <div>
                      <dt>Linked content draft</dt>
                      <dd>{activeDeliverableRecord.contentDraft ? `${activeDeliverableRecord.contentDraft.title} (${formatContentDraftStatus(activeDeliverableRecord.contentDraft.status)})` : "Not linked"}</dd>
                    </div>
                    <div>
                      <dt>Linked article image</dt>
                      <dd>{activeDeliverableRecord.articleImage ? `${activeDeliverableRecord.articleImage.title} (${formatArticleImageStatus(activeDeliverableRecord.articleImage.status)})` : "Not linked"}</dd>
                    </div>
                    <div>
                      <dt>Export reference</dt>
                      <dd>{activeDeliverableRecord.exportUrl || "Not set"}</dd>
                    </div>
                    <div>
                      <dt>Storage reference</dt>
                      <dd>{activeDeliverableRecord.hasDocument ? "Private document stored" : "Not set"}</dd>
                    </div>
                    <div>
                      <dt>Archived state</dt>
                      <dd>{activeDeliverableRecord.isArchived ? "Archived" : "Active admin packaging record"}</dd>
                    </div>
                  </dl>
                  {activeDeliverableRecord.hasDocument ? (
                    <div className="panel-divider-top">
                      <button
                        className="secondary-action"
                        disabled={deliverableDownloadRefLoading}
                        onClick={() => void fetchDeliverableDownloadReference(project.id, activeDeliverableRecord.id)}
                        type="button"
                      >
                        {deliverableDownloadRefLoading ? "Preparing download..." : "Download private document"}
                      </button>
                      {deliverableDownloadRefError && deliverableDownloadRefError.recordId === activeDeliverableRecord.id ? (
                        <AiDeliveryInlineAlert
                          message={deliverableDownloadRefError.message.includes("503") || deliverableDownloadRefError.message.includes("unconfigured") ? "Private document storage is not configured. Contact your administrator." : deliverableDownloadRefError.message}
                          title="Download unavailable"
                        />
                      ) : null}
                      {deliverableDownloadRef && deliverableDownloadRef.recordId === activeDeliverableRecord.id ? (
                        deliverableDownloadRef.downloadUrl ? (
                          <AiDeliveryInlineNotice>
                            <strong>Download ready:</strong>{" "}
                            <a href={deliverableDownloadRef.downloadUrl} target="_blank" rel="noopener noreferrer">Open private document</a>
                            {deliverableDownloadRef.expiresSeconds ? <span className="muted-text"> (expires in {Math.floor(deliverableDownloadRef.expiresSeconds / 60)} min)</span> : null}
                          </AiDeliveryInlineNotice>
                        ) : (
                          <AiDeliveryInlineAlert message="The document reference exists but storage is unavailable. Contact your administrator to configure storage." title="Storage not available" />
                        )
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="field-panel">
                <h4>Package completeness summary</h4>
                <AiDeliveryInlineNotice>Internal readiness check from linked draft, image, and deliverable data only. Does not generate exports or client delivery.</AiDeliveryInlineNotice>
                <AiDeliveryInlineNotice>
                  <strong>Handoff context:</strong>{" "}
                  {deliverableLinkedDraftRecord?.status === "APPROVED" && deliverableReadinessBlockers.length === 0
                    ? "Context ready — approved draft linked and readiness guard clear."
                    : "Context missing or blocked — link an approved draft and clear readiness blockers before this package can advance."}
                </AiDeliveryInlineNotice>
                <dl className="brief-grid">
                  <div>
                    <dt>Linked content draft</dt>
                    <dd>{deliverableLinkedDraftRecord ? `${deliverableLinkedDraftRecord.title} (${formatContentDraftStatus(deliverableLinkedDraftRecord.status)})` : "Missing"}</dd>
                  </div>
                  <div>
                    <dt>Linked image records</dt>
                    <dd>{formatStatusBreakdown(deliverableRelatedImages, "No linked image records yet")}</dd>
                  </div>
                  <div>
                    <dt>Direct package image</dt>
                    <dd>{deliverableLinkedImageRecord ? `${deliverableLinkedImageRecord.title} (${formatArticleImageStatus(deliverableLinkedImageRecord.status)})` : "Not linked"}</dd>
                  </div>
                  <div>
                    <dt>Final reference</dt>
                    <dd>{deliverableHasRecordedReference ? "Recorded" : "Missing"}</dd>
                  </div>
                  <div>
                    <dt>Package status</dt>
                    <dd>{formatDeliverableStatus(deliverableForm.status)}</dd>
                  </div>
                  <div>
                    <dt>Ready-state guard</dt>
                    <dd>{deliverableReadinessBlockers.length === 0 ? "Clear" : "Blocked"}</dd>
                  </div>
                </dl>
                {deliverableReadinessBlockers.length === 0 ? (
                  <AiDeliveryInlineNotice>Linked draft, image readiness, and final reference details are sufficient for internal handoff tracking.</AiDeliveryInlineNotice>
                ) : (
                  <AiDeliveryInlineAlert
                    message={deliverableReadinessBlockers.join(" · ")}
                    title="Ready-state blockers"
                  />
                )}
              </div>
              <div className="field-panel">
                <h4>Internal final handoff view</h4>
                <AiDeliveryInlineNotice>Internal admin summary only — no client delivery, publication, WordPress transfer, or export output.</AiDeliveryInlineNotice>
                <AiDeliveryInlineNotice>
                  Client Portal and monthly reports show only FINAL or approved deliverables. This internal view must not be shared with the client until compliance review and admin review pass.
                </AiDeliveryInlineNotice>
                <dl className="brief-grid">
                  <div>
                    <dt>Article / package title</dt>
                    <dd>{deliverableLinkedDraftRecord?.title || activeDeliverableRecord?.title || deliverableForm.title || "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Draft status</dt>
                    <dd>{deliverableLinkedDraftRecord ? formatContentDraftStatus(deliverableLinkedDraftRecord.status) : "No linked draft loaded"}</dd>
                  </div>
                  <div className="field-span-2">
                    <dt>Draft body preview</dt>
                    <dd>{deliverableLinkedDraftRecord ? formatPreview(deliverableLinkedDraftRecord.draftBody) : "No linked draft body available"}</dd>
                  </div>
                  <div>
                    <dt>Image planning records</dt>
                    <dd>{deliverableRelatedImages.length}</dd>
                  </div>
                  <div>
                    <dt>Image readiness mix</dt>
                    <dd>{formatStatusBreakdown(deliverableRelatedImages, "No linked image records yet")}</dd>
                  </div>
                  <div className="field-span-2">
                    <dt>Image references</dt>
                    <dd>
                      {deliverableRelatedImages.length > 0
                        ? deliverableRelatedImages.map((image) => `${image.title}: ${image.finalImageUrl || (image.hasDocument ? "private asset" : "") || image.previewImageUrl || "No reference yet"}`).join(" | ")
                        : "No linked image references yet"}
                    </dd>
                  </div>
                  <div>
                    <dt>Package delivery type</dt>
                    <dd>{formatEnumLabel(deliverableForm.deliveryType)}</dd>
                  </div>
                  <div>
                    <dt>Package status</dt>
                    <dd>{formatDeliverableStatus(activeDeliverableRecord?.isArchived ? "ARCHIVED" : deliverableForm.status)}</dd>
                  </div>
                  <div className="field-span-2">
                    <dt>Package notes</dt>
                    <dd>{formatPreview(deliverableForm.notes ?? activeDeliverableRecord?.notes)}</dd>
                  </div>
                  <div className="field-span-2">
                    <dt>Latest internal review notes</dt>
                    <dd>
                      {selectedReviewDeliverableId === activeDeliverableRecord?.id && latestSelectedReview
                        ? formatPreview(latestSelectedReview.reviewNotes)
                        : "Open Reviews on this deliverable to load internal review placeholder notes."}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="field-grid field-grid-compact">
                <label>
                  Linked content draft - Optional
                  <select value={deliverableForm.contentDraftId || ""} onChange={(e) => onFormChange((current: AiDeliveryDeliverableFormValues) => ({ ...current, contentDraftId: e.target.value || null }))}>
                    <option value="">None</option>
                    {deliverableDraftOptions.map((draftItem) => (
                      <option key={draftItem.id} value={draftItem.id}>{draftItem.title} ({formatContentDraftStatus(draftItem.status)})</option>
                    ))}
                  </select>
                  <span className="muted-text">Approved draft for this package record.</span>
                </label>
                <label>
                  Linked article image - Optional
                  <select value={deliverableForm.articleImageId || ""} onChange={(e) => onFormChange((current: AiDeliveryDeliverableFormValues) => ({ ...current, articleImageId: e.target.value || null }))}>
                    <option value="">None</option>
                    {deliverableArticleImageOptions.map((ai) => (
                      <option key={ai.id} value={ai.id}>{ai.title} ({formatArticleImageStatus(ai.status)})</option>
                    ))}
                  </select>
                  <span className="muted-text">Approved or final-ready image for the client-safe package.</span>
                </label>
                <label className="field-span-2">
                  Title - Required
                  <input maxLength={255} placeholder="Internal package name for this content or image handoff record" required value={deliverableForm.title || ""} onChange={(e) => onFormChange((current: AiDeliveryDeliverableFormValues) => ({ ...current, title: e.target.value }))} />
                  <span className="muted-text">Platform-neutral package name.</span>
                </label>
                <label className="field-span-2">
                  Description - Optional
                  <textarea maxLength={4000} placeholder="What this deliverable contains and what stage it is in" rows={3} value={deliverableForm.description || ""} onChange={(e) => onFormChange((current: AiDeliveryDeliverableFormValues) => ({ ...current, description: e.target.value }))} />
                  <span className="muted-text">Internal packaging summary only.</span>
                </label>
                <label>
                  Delivery type - Required
                  <select value={deliverableForm.deliveryType || "CONTENT_PACKAGE"} onChange={(e) => onFormChange((current: AiDeliveryDeliverableFormValues) => ({ ...current, deliveryType: e.target.value }))}>
                    {(["CONTENT_PACKAGE","ARTICLE_DRAFT","ARTICLE_IMAGE","CLIENT_HANDOFF","OTHER"] as const).map((dt) => <option key={dt} value={dt}>{dt}</option>)}
                  </select>
                  <span className="muted-text">Platform-neutral classification.</span>
                </label>
                <label>
                  Status - {deliverableEditorId ? "Workflow-controlled" : "Required"}
                  {deliverableEditorId ? (
                    <>
                      <input type="text" readOnly value={formatDeliverableStatus(activeDeliverableRecord?.isArchived ? "ARCHIVED" : deliverableForm.status)} />
                      <span className="muted-text">Status is driven by workflow actions (mark ready, send for client review, accept, archive/restore). Saving other fields will not change it.</span>
                    </>
                  ) : (
                    <>
                      <select value={deliverableForm.status || "DRAFT"} onChange={(e) => onFormChange((current: AiDeliveryDeliverableFormValues) => ({ ...current, status: e.target.value }))}>
                        {(["DRAFT","READY","DELIVERED","REVISION_REQUESTED","ACCEPTED","ARCHIVED"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <span className="muted-text">Use action buttons for ready, revision, accept, and restore.</span>
                    </>
                  )}
                </label>
                <label>
                  Export reference - Optional
                  <input maxLength={2048} type="url" placeholder="Safe export URL for client handoff (e.g., shared Google Docs or approved PDF link)" value={deliverableForm.exportUrl || ""} onChange={(e) => onFormChange((current: AiDeliveryDeliverableFormValues) => ({ ...current, exportUrl: e.target.value }))} />
                  <span className="muted-text">Client-visible in Client Portal. Safe URLs only.</span>
                </label>
                <label className="field-span-2">
                  Storage key reference - Optional
                  <input maxLength={1024} placeholder="Internal private-storage reference, if already assigned elsewhere" value={deliverableForm.storageKey || ""} onChange={(e) => onFormChange((current: AiDeliveryDeliverableFormValues) => ({ ...current, storageKey: e.target.value }))} />
                  <span className="muted-text">Internal reference. Use per-record upload controls below.</span>
                </label>
                <label className="field-span-2">
                  Packaging notes - Optional
                  <textarea maxLength={4000} placeholder="Internal QA notes, packaging context, or revision details for the admin team" rows={3} value={deliverableForm.notes || ""} onChange={(e) => onFormChange((current: AiDeliveryDeliverableFormValues) => ({ ...current, notes: e.target.value }))} />
                  <span className="muted-text">Admin and review placeholders only.</span>
                </label>
              </div>
              <div className="modal-footer ai-delivery-modal-footer">
                <button className="ghost-action" disabled={saving} onClick={onClose} type="button">Close</button>
                <button className="ghost-action" disabled={saving} onClick={() => { onEditorIdChange(null); onFormChange(emptyDeliverableForm()); }} type="button">New deliverable</button>
                <button className="primary-action" disabled={saving || !(deliverableForm.title || "").trim()} onClick={() => void saveDeliverable(project.id)} type="button">{saving ? "Saving" : deliverableEditorId ? "Save deliverable" : "Create deliverable"}</button>
                {activeDeliverableRecord && !activeDeliverableRecord.isArchived ? (
                  <button className="secondary-action" disabled={saving || activeDeliverableRecord.status === "READY"} onClick={() => void markDeliverableReady(project.id, activeDeliverableRecord.id)} type="button">Mark ready</button>
                ) : null}
                {activeDeliverableRecord && !activeDeliverableRecord.isArchived ? (
                  <button className="secondary-action" disabled={saving || !["READY", "ACCEPTED", "DELIVERED"].includes(activeDeliverableRecord.status)} onClick={() => void requestDeliverableRevision(project.id, activeDeliverableRecord.id)} type="button">Request revision</button>
                ) : null}
                {activeDeliverableRecord && !activeDeliverableRecord.isArchived ? (
                  <button className="secondary-action" disabled={saving || !["READY", "DELIVERED"].includes(activeDeliverableRecord.status)} onClick={() => void acceptDeliverable(project.id, activeDeliverableRecord.id)} type="button">Internal accept</button>
                ) : null}
                {activeDeliverableRecord?.isArchived ? (
                  <button className="secondary-action" disabled={saving} onClick={() => void restoreDeliverable(project.id, activeDeliverableRecord.id)} type="button">Restore deliverable</button>
                ) : null}
              </div>
            </section>

            <section className="field-panel ai-delivery-section-compact">
              <h3>Website publishing workflow (draft-only handoff)</h3>
              <AiDeliveryInlineNotice>
                Prepare the client WordPress draft payload here. This flow is draft-only in the current block; live publish remains deferred unless a separately approved block enables <code>WORDPRESS_PUBLISH_ENABLED=true</code>.
              </AiDeliveryInlineNotice>
              <AiDeliveryInlineNotice>
                <strong>Context readiness:</strong>{" "}
                {deliverableLinkedDraftRecord && deliverableLinkedDraftRecord.status === "APPROVED" && deliverableReadinessBlockers.length === 0
                  ? "Linked draft and package readiness are sufficient for a draft-only WordPress handoff."
                  : "Linked draft is missing, not approved, or package readiness blockers exist. Resolve these before treating any WordPress payload as draft-prep eligible."}
              </AiDeliveryInlineNotice>
              <AiDeliveryInlineNotice>
                No prepared WordPress draft is final client copy. Compliance review and admin review must pass before final archive or client delivery.
              </AiDeliveryInlineNotice>
              {deliverablePublicationTargets.length === 0 ? (
                <AiDeliveryInlineEmpty>No publication targets for this client yet. Add one in Client Hub before website publishing.</AiDeliveryInlineEmpty>
              ) : (
                <>
                  <label>
                    Publication target
                    <select
                      onChange={(event) => onPublicationTargetIdChange(event.target.value)}
                      value={deliverablePublicationTargetId}
                    >
                      {deliverablePublicationTargets.map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.label} ({target.siteUrl}){target.isDefault ? " — default" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <dl className="brief-grid brief-grid-spaced-top">
                    <div>
                      <dt>Selected site</dt>
                      <dd>{selectedPublicationTarget?.siteUrl ?? "Not set"}</dd>
                    </div>
                    <div>
                      <dt>Credentials</dt>
                      <dd>
                        {deliverablePublicationCredentialStatus?.configured ? (
                          <StatusBadge status="CONFIGURED" />
                        ) : (
                          <StatusBadge status="NOT_CONFIGURED" />
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Encryption ready</dt>
                      <dd>{deliverablePublicationCredentialStatus?.encryptionAvailable ? "Yes" : "No"}</dd>
                    </div>
                  </dl>
                  {projectPublicationLogs.length > 0 ? (
                    <div style={{ marginTop: "0.75rem" }}>
                      <strong>Recent publication log</strong>
                      <ul className="entity-list">
                        {projectPublicationLogs.slice(0, 5).map((log) => (
                          <li key={log.id}>
                            <StatusBadge status={log.status} /> {log.action} — {log.siteUrlHost ?? "unknown host"} —{" "}
                            {new Date(log.createdAt).toLocaleString()}
                            {log.note ? ` — ${log.note}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              )}
            </section>

            <section className="field-panel ai-delivery-section-compact">
              <h3>Existing deliverables</h3>
              <p className="muted-text">Active: {activeDeliverableCount} · Archived: {archivedDeliverableCount}</p>
              {!error && deliverables.length === 0 ? (
                <AiDeliveryInlineEmpty>No deliverables yet. Package approved assets when ready.</AiDeliveryInlineEmpty>
              ) : null}
              {visibleDeliverables.map((d) => {
                const latestPublicationLog = projectPublicationLogs.find((log) => log.deliverableId === d.id) ?? null;
                return (
                <article className="entity-card" key={d.id}>
                  <div className="entity-card-header">
                    <div>
                      <StatusBadge status={formatDeliverableStatus(d.isArchived ? "ARCHIVED" : d.status)} />
                      <h3>{d.title}</h3>
                      <p>{formatEnumLabel(d.deliveryType)} - Updated {formatOptionalDate(d.updatedAt)}</p>
                    </div>
                    <div className="card-actions">
                      <button className="ghost-action" disabled={saving} onClick={() => editDeliverable(d)} type="button">Edit</button>
                      {!d.isArchived ? <button className="secondary-action" disabled={saving || d.status === "READY"} onClick={() => void markDeliverableReady(project.id, d.id)} type="button">Mark ready</button> : null}
                      {!d.isArchived ? <button className="secondary-action" disabled={saving || !["READY", "ACCEPTED", "DELIVERED"].includes(d.status)} onClick={() => void requestDeliverableRevision(project.id, d.id)} type="button">Request revision</button> : null}
                      {!d.isArchived ? <button className="secondary-action" disabled={saving || !["READY", "DELIVERED"].includes(d.status)} onClick={() => void acceptDeliverable(project.id, d.id)} type="button">Internal accept</button> : null}
                      {!d.isArchived ? (
                        <button className="secondary-action" disabled={saving || deliverableWordPressDraftTargetId === d.id} onClick={() => void prepareDeliverableWordPressDraft(project.id, d.id)} type="button">
                          {deliverableWordPressDraftTargetId === d.id ? "Fetching..." : "Prepare WordPress draft"}
                        </button>
                      ) : null}
                      {!d.isArchived ? (
                        <button className="secondary-action" disabled={saving || deliverableWordPressPublishTargetId === d.id} onClick={() => requestWordPressPublish(project.id, d.id, d.title)} type="button">
                          {deliverableWordPressPublishTargetId === d.id ? "Publishing..." : "Publish to WordPress"}
                        </button>
                      ) : null}
                      {!d.isArchived ? (
                        <button className="ghost-action" disabled={saving || deliverableGoogleDocExportTargetId === d.id} onClick={() => void exportDeliverableToGoogleDoc(project.id, d.id)} type="button">
                          {deliverableGoogleDocExportTargetId === d.id ? "Exporting..." : "Export to Google Doc"}
                        </button>
                      ) : null}
                      <button className="ghost-action" disabled={saving || deliverableReviewsLoading} onClick={() => void openDeliverableReviews(project.id, d.id)} type="button">Reviews</button>
                      {!d.isArchived ? <button className="ghost-action" disabled={saving} onClick={() => void archiveDeliverable(project.id, d.id)} type="button">Archive</button> : null}
                      {d.isArchived ? <button className="ghost-action" disabled={saving} onClick={() => void restoreDeliverable(project.id, d.id)} type="button">Restore</button> : null}
                    </div>
                  </div>
                  <dl className="brief-grid">
                    <div>
                      <dt>Context readiness</dt>
                      <dd>{d.contentDraft?.status === "APPROVED" ? "Ready — approved draft linked" : "Missing / blocked — approved draft required"}</dd>
                    </div>
                    <div>
                      <dt>Linked content draft</dt>
                      <dd>{d.contentDraft ? `${d.contentDraft.title} (${formatContentDraftStatus(d.contentDraft.status)})` : "Not linked"}</dd>
                    </div>
                    <div>
                      <dt>Linked article image</dt>
                      <dd>{d.articleImage ? `${d.articleImage.title} (${formatArticleImageStatus(d.articleImage.status)})` : "Not linked"}</dd>
                    </div>
                    <div>
                      <dt>Export reference</dt>
                      <dd>{d.exportUrl || "Not set"}</dd>
                    </div>
                    <div>
                      <dt>Storage key reference</dt>
                      <dd>{d.hasDocument ? "Private document stored" : "Not set"}</dd>
                    </div>
                    <div>
                      <dt>Export / storage state</dt>
                      <dd>{getDeliverableExportState(d)}</dd>
                    </div>
                    <div>
                      <dt>Visibility</dt>
                      <dd>{d.isArchived ? "Archived admin packaging record" : "Visible in active admin list only"}</dd>
                    </div>
                    <div>
                      <dt>Private asset</dt>
                      <dd>{d.hasDocument ? "Private asset stored" : "Not stored yet"}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd><StatusBadge status={formatDeliverableStatus(d.isArchived ? "ARCHIVED" : d.status)} /></dd>
                    </div>
                    <div>
                      <dt>Latest publication</dt>
                      <dd>
                        {latestPublicationLog
                          ? `${latestPublicationLog.action} — ${latestPublicationLog.status}`
                          : "No publication events yet"}
                      </dd>
                    </div>
                    <div>
                      <dt>Latest internal review</dt>
                      <dd>
                        {loadedDeliverableReviews[d.id] ? (
                          (() => {
                            const latestReview = getMostRecentReview(loadedDeliverableReviews[d.id]);
                            return latestReview ? (
                              <span>
                                <StatusBadge status={latestReview.status} /> {latestReview.reviewerName ? `by ${latestReview.reviewerName}` : "(no reviewer name)"} • {formatOptionalDate(latestReview.updatedAt)}
                              </span>
                            ) : "No review placeholders yet";
                          })()
                        ) : "Open Reviews to load review status."}
                      </dd>
                    </div>
                    <div className="field-span-2">
                      <dt>Notes</dt>
                      <dd>{d.notes || "No notes"}</dd>
                    </div>
                  </dl>
                  {deliverableWordPressDraftError && deliverableWordPressDraftError.recordId === d.id ? (
                    <AiDeliveryInlineAlert message={deliverableWordPressDraftError.message} />
                  ) : null}
                  {deliverableWordPressDraft && deliverableWordPressDraft.recordId === d.id ? (
                    <div className="field-panel">
                      <h4>WordPress prepared draft</h4>
                      <dl className="brief-grid">
                        <div>
                          <dt>Title</dt>
                          <dd>{deliverableWordPressDraft.wordpressDraft.title}</dd>
                        </div>
                        <div>
                          <dt>Source type</dt>
                          <dd>{deliverableWordPressDraft.wordpressDraft.sourceType}</dd>
                        </div>
                        {deliverableWordPressDraft.wordpressDraft.slug ? (
                          <div>
                            <dt>Slug</dt>
                            <dd>{deliverableWordPressDraft.wordpressDraft.slug}</dd>
                          </div>
                        ) : null}
                        {deliverableWordPressDraft.wordpressDraft.publishGateStatus ? (
                          <div>
                            <dt>Publish gate</dt>
                            <dd>
                              <StatusBadge status={deliverableWordPressDraft.wordpressDraft.publishGateStatus} />
                              {deliverableWordPressDraft.wordpressDraft.credentialConfigured === false
                                ? " · credentials not configured"
                                : ""}
                            </dd>
                          </div>
                        ) : null}
                        <div>
                          <dt>Source ID</dt>
                          <dd>{deliverableWordPressDraft.wordpressDraft.sourceId}</dd>
                        </div>
                        <div className="field-span-2">
                          <dt>Body preview</dt>
                          <dd>{formatPreview(deliverableWordPressDraft.wordpressDraft.body)}</dd>
                        </div>
                        <div className="field-span-2">
                          <dt>Note</dt>
                          <dd>{deliverableWordPressDraft.wordpressDraft.note}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}
                  {deliverableWordPressPublishError && deliverableWordPressPublishError.recordId === d.id ? (
                    <AiDeliveryInlineAlert message={deliverableWordPressPublishError.message} />
                  ) : null}
                  {deliverableWordPressPublishResult && deliverableWordPressPublishResult.recordId === d.id ? (
                    <div className="field-panel">
                      <h4>WordPress publish result</h4>
                     <dl className="brief-grid">
                       <div>
                         <dt>Provider status</dt>
                         <dd><StatusBadge status={deliverableWordPressPublishResult.result.status} /></dd>
                       </div>
                       <div>
                         <dt>External post ID</dt>
                         <dd>{deliverableWordPressPublishResult.result.wordpressPostId || "Not returned"}</dd>
                       </div>
                       {deliverableWordPressPublishResult.result.wordpressPostUrl ? (
                         <div className="field-span-2">
                           <dt>Published URL</dt>
                           <dd>
                             <a href={deliverableWordPressPublishResult.result.wordpressPostUrl} rel="noreferrer" target="_blank">
                               {deliverableWordPressPublishResult.result.wordpressPostUrl}
                             </a>
                           </dd>
                         </div>
                       ) : null}
                       <div className="field-span-2">
                         <dt>Message</dt>
                         <dd>
                           {deliverableWordPressPublishResult.result.providerDisabledReason
                             || deliverableWordPressPublishResult.result.errorMessage
                             || (deliverableWordPressPublishResult.result.status === "published"
                               ? "Published to WordPress."
                               : deliverableWordPressPublishResult.result.status === "draft_prepared"
                                 ? "Draft prepared locally — not published."
                                 : deliverableWordPressPublishResult.result.status === "provider_disabled"
                                   ? "Provider disabled — no external publish."
                                   : deliverableWordPressPublishResult.result.ok
                                     ? "Publish request finished."
                                     : "Publish did not complete.")}
                         </dd>
                       </div>
                     </dl>
                    </div>
                  ) : null}
                  {deliverableGoogleDocExportError && deliverableGoogleDocExportError.recordId === d.id ? (
                    <AiDeliveryInlineAlert message={deliverableGoogleDocExportError.message} />
                  ) : null}
                  {deliverableGoogleDocExportResult && deliverableGoogleDocExportResult.recordId === d.id ? (
                    <div className="field-panel">
                      <h4>Google Doc export result</h4>
                      <dl className="brief-grid">
                        <div>
                          <dt>Provider status</dt>
                          <dd><StatusBadge status={deliverableGoogleDocExportResult.result.providerStatus} /></dd>
                        </div>
                        <div>
                          <dt>Export available</dt>
                          <dd>{deliverableGoogleDocExportResult.result.hasGoogleDocExport ? "Yes" : "No"}</dd>
                        </div>
                        {deliverableGoogleDocExportResult.result.docTitle ? (
                          <div>
                            <dt>Document title</dt>
                            <dd>{deliverableGoogleDocExportResult.result.docTitle}</dd>
                          </div>
                        ) : null}
                        {deliverableGoogleDocExportResult.result.folderPath ? (
                          <div>
                            <dt>Folder path</dt>
                            <dd>{deliverableGoogleDocExportResult.result.folderPath}</dd>
                          </div>
                        ) : null}
                        <div className="field-span-2">
                          <dt>Export link</dt>
                          <dd>
                            {deliverableGoogleDocExportResult.result.exportUrl
                              ? <a href={deliverableGoogleDocExportResult.result.exportUrl} rel="noreferrer" target="_blank">Open in Google Docs</a>
                              : (deliverableGoogleDocExportResult.result.providerDisabledReason || "Google Drive provider is not configured. Enable GOOGLE_DRIVE_EXPORT_ENABLED and provide service account credentials to activate.")}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}
                  {!d.isArchived ? (
                    <div className="field-grid brief-grid-spaced-top">
                      <label className="field-span-2">
                        Private document upload - Optional
                        <input
                          accept=".pdf,image/png,image/jpeg,image/webp"
                          onChange={(event) =>
                            onDocumentFilesChange((current) => ({
                              ...current,
                              [d.id]: event.target.files?.[0] ?? null
                            }))
                          }
                          type="file"
                        />
                        <span className="muted-text">Private asset upload for this record.</span>
                      </label>
                    </div>
                  ) : null}
                  <div className="card-actions card-actions-spaced">
                    {!d.isArchived ? (
                      <button
                        className="secondary-action"
                        disabled={saving || !deliverableDocumentFiles[d.id]}
                        onClick={() => void uploadDeliverableDocument(project.id, d.id)}
                        type="button"
                      >
                        {deliverableUploadTargetId === d.id ? "Uploading" : "Upload private document"}
                      </button>
                    ) : null}
                    {d.hasDocument ? (
                      <button
                        className="secondary-action"
                        disabled={deliverableDownloadTargetId === d.id}
                        onClick={() => void openDeliverableDocument(project.id, d.id)}
                        type="button"
                      >
                        {deliverableDownloadTargetId === d.id ? "Opening" : "Open private document"}
                      </button>
                    ) : null}
                  </div>
                </article>
                );
              })}
            </section>
            {!selectedReviewDeliverable && deliverables.length > 0 ? (
              <AiDeliveryInlineEmpty>Select Reviews on a deliverable to view or create admin/operator review placeholders.</AiDeliveryInlineEmpty>
            ) : null}
            {selectedReviewDeliverable ? (
              <section className="field-panel ai-delivery-section-compact">
                <h3>Deliverable reviews: {selectedReviewDeliverable.title}</h3>
                <AiDeliveryInlineNotice>Add or update an internal review placeholder for QA tracking.</AiDeliveryInlineNotice>
                <dl className="brief-grid">
                  <div>
                    <dt>Deliverable status</dt>
                    <dd><StatusBadge status={formatDeliverableStatus(selectedReviewDeliverable.isArchived ? "ARCHIVED" : selectedReviewDeliverable.status)} /></dd>
                  </div>
                  <div>
                    <dt>Latest review status</dt>
                    <dd>{latestSelectedReview ? <StatusBadge status={latestSelectedReview.status} /> : "No review placeholder yet"}</dd>
                  </div>
                  <div>
                    <dt>Review placeholders</dt>
                    <dd>{deliverableReviews.length}</dd>
                  </div>
                  <div>
                    <dt>Last review update</dt>
                    <dd>{latestSelectedReview ? formatOptionalDate(latestSelectedReview.updatedAt) : "Not set"}</dd>
                  </div>
                </dl>
                {selectedReviewDeliverable.isArchived ? (
                  <AiDeliveryInlineNotice>This deliverable is archived. Existing review placeholders remain visible for admin history.</AiDeliveryInlineNotice>
                ) : null}
                {deliverableReviewsLoading ? (
                  <AiDeliveryInlineLoading label="Loading deliverable reviews" />
                ) : (
                  <>
                    {deliverableReviewsError ? <AiDeliveryInlineAlert message={deliverableReviewsError} title="Deliverable reviews unavailable" /> : null}
                    <div className="field-grid field-grid-compact">
                      <div className="field-span-2">
                        <span>Deliverable context</span>
                        <strong>{selectedReviewDeliverable.title}</strong>
                        <span className="muted-text">Review placeholder for this deliverable only.</span>
                      </div>
                      <label>
                        Review status - Required
                        <select value={deliverableReviewForm.status} onChange={(event) => onReviewFormChange((current) => ({ ...current, status: event.target.value }))}>
                          {(["NOT_STARTED", "ADMIN_REVIEW", "CHANGES_REQUESTED", "APPROVED", "ARCHIVED"] as const).map((status) => <option key={status} value={status}>{formatEnumLabel(status)}</option>)}
                        </select>
                        <span className="muted-text">Current internal review status.</span>
                      </label>
                      <label>
                        Reviewer name - Optional
                        <input
                          maxLength={255}
                          placeholder="Admin reviewer or operator name"
                          value={deliverableReviewForm.reviewerName}
                          onChange={(event) => onReviewFormChange((current) => ({ ...current, reviewerName: event.target.value }))}
                        />
                        <span className="muted-text">Admin-only.</span>
                      </label>
                      <label className="field-span-2">
                        Review notes / change request - Optional
                        <textarea
                          maxLength={4000}
                          placeholder="Change requests, approval notes, or internal review context"
                          rows={3}
                          value={deliverableReviewForm.reviewNotes}
                          onChange={(event) => onReviewFormChange((current) => ({ ...current, reviewNotes: event.target.value }))}
                        />
                        <span className="muted-text">Not shown to client.</span>
                      </label>
                    </div>
                    <div className="modal-footer ai-delivery-modal-footer">
                      <button className="ghost-action" disabled={deliverableReviewsSaving} onClick={onClose} type="button">Close</button>
                      <button className="ghost-action" disabled={deliverableReviewsSaving} onClick={() => { onReviewEditorIdChange(null); onReviewFormChange(emptyDeliverableReview()); }} type="button">New review placeholder</button>
                      <button className="primary-action" disabled={deliverableReviewsSaving} onClick={() => void saveDeliverableReview(project.id)} type="button">
                        {deliverableReviewsSaving ? "Saving" : deliverableReviewEditorId ? "Save review" : "Create review placeholder"}
                      </button>
                    </div>

                    <h4>Existing review placeholders ({deliverableReviews.length})</h4>
                    {!deliverableReviewsError && deliverableReviews.length === 0 ? (
                      <AiDeliveryInlineEmpty>No review placeholders yet. Add one to continue internal QA.</AiDeliveryInlineEmpty>
                    ) : null}
                    {[...deliverableReviews].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((review) => (
                      <article className="entity-card" key={review.id}>
                        <div className="entity-card-header">
                          <div>
                            <StatusBadge status={review.status} />
                            <h3>{review.reviewerName || "Unnamed reviewer"}</h3>
                            <p>Updated {formatOptionalDate(review.updatedAt)}</p>
                          </div>
                          <div className="card-actions">
                            <button className="ghost-action" disabled={deliverableReviewsSaving} onClick={() => editDeliverableReview(review)} type="button">Edit review</button>
                          </div>
                        </div>
                        <dl className="brief-grid">
                          <div>
                            <dt>Created</dt>
                            <dd>{formatOptionalDate(review.createdAt)}</dd>
                          </div>
                          <div>
                            <dt>Status</dt>
                            <dd><StatusBadge status={review.status} /></dd>
                          </div>
                          <div>
                            <dt>Reviewer</dt>
                            <dd>{review.reviewerName || "Unnamed reviewer"}</dd>
                          </div>
                          <div className="field-span-2">
                            <dt>Review notes</dt>
                            <dd>{review.reviewNotes || "No review notes"}</dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </>
                )}
              </section>
            ) : null}
          </div>
        ) : <div>Project not found.</div>}

    </Modal>
  );
}
