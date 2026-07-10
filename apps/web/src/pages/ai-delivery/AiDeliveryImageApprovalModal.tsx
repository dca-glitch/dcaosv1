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
  AiDeliveryArticleImageFormValues,
  AiDeliveryArticleImageSummary,
  AiDeliveryContentDraftSummary,
  AiDeliveryProjectSummary,
} from "./AiDeliveryPage";

export type AiDeliveryImageDownloadRef = {
  recordId: string;
  storageKey: string;
  downloadUrl: string | null;
  expiresSeconds: number | null;
};

export type AiDeliveryImageDownloadRefError = {
  recordId: string;
  message: string;
};

export type AiDeliveryImageApprovalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  project: AiDeliveryProjectSummary | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  actionGuidance: string;
  articleImages: AiDeliveryArticleImageSummary[];
  articleImageDrafts: AiDeliveryContentDraftSummary[];
  form: AiDeliveryArticleImageFormValues;
  onFormChange: React.Dispatch<React.SetStateAction<AiDeliveryArticleImageFormValues>>;
  editorId: string | null;
  activeRecord: AiDeliveryArticleImageSummary | null;
  finalAssetFiles: Record<string, File | null>;
  onFinalAssetFilesChange: React.Dispatch<React.SetStateAction<Record<string, File | null>>>;
  uploadTargetId: string | null;
  downloadTargetId: string | null;
  downloadRefLoading: boolean;
  downloadRefError: AiDeliveryImageDownloadRefError | null;
  downloadRef: AiDeliveryImageDownloadRef | null;
  formatArticleImageStatus: (value?: string | null) => string;
  formatContentDraftStatus: (value?: string | null) => string;
  formatOptionalDate: (value?: string | null) => string;
  onNewImageRequest: () => void;
  onSave: (projectId: string) => void;
  onEdit: (image: AiDeliveryArticleImageSummary) => void;
  onArchive: (projectId: string, imageId: string) => void;
  onMarkPreviewReady: (projectId: string, imageId: string) => void;
  onRequestChanges: (projectId: string, imageId: string) => void;
  onApprove: (projectId: string, imageId: string) => void;
  onMarkFinalReady: (projectId: string, imageId: string) => void;
  onUploadFinalAsset: (projectId: string, imageId: string) => void;
  onOpenPrivateFinalAsset: (projectId: string, imageId: string) => void;
  onFetchDownloadReference: (projectId: string, imageId: string) => void;
  onHandoffToDeliverables: (projectId: string, image: AiDeliveryArticleImageSummary) => void;
};

const ARTICLE_IMAGE_STATUS_OPTIONS = [
  "DRAFT",
  "READY_FOR_GENERATION",
  "PREVIEW_READY",
  "CHANGES_REQUESTED",
  "APPROVED",
  "FINAL_READY",
  "ARCHIVED",
] as const;

/**
 * P4I Article Images / Image Production Planning modal.
 * Accessible dialog name: "Image Production Planning" (smoke-compatible).
 * No alt text field, no live generation, no rejection-reason form.
 */
export function AiDeliveryImageApprovalModal({
  isOpen,
  onClose,
  project,
  loading,
  saving,
  error,
  actionGuidance,
  articleImages,
  articleImageDrafts,
  form,
  onFormChange,
  editorId,
  activeRecord,
  finalAssetFiles,
  onFinalAssetFilesChange,
  uploadTargetId,
  downloadTargetId,
  downloadRefLoading,
  downloadRefError,
  downloadRef,
  formatArticleImageStatus,
  formatContentDraftStatus,
  formatOptionalDate,
  onNewImageRequest,
  onSave,
  onEdit,
  onArchive,
  onMarkPreviewReady,
  onRequestChanges,
  onApprove,
  onMarkFinalReady,
  onUploadFinalAsset,
  onOpenPrivateFinalAsset,
  onFetchDownloadReference,
  onHandoffToDeliverables,
}: AiDeliveryImageApprovalModalProps) {
  if (!isOpen) {
    return null;
  }

  const canSave = Boolean(form.contentDraftId && form.title.trim() && form.prompt.trim());

  return (
    <Modal onClose={onClose} size="lg" title="Image Production Planning">
      {loading ? (
        <AiDeliveryInlineLoading label="Loading article image requests" />
      ) : project ? (
        <div className="ai-delivery-modal-panel ai-delivery-lane-modal ai-delivery-article-images-panel stack gap-md">
          {error ? <AiDeliveryInlineAlert message={error} title="Article image action blocked" /> : null}
          <section className="field-panel ai-delivery-section-compact">
            <h3>Image planning workflow</h3>
            <AiDeliveryInlineNotice>{actionGuidance}</AiDeliveryInlineNotice>
            {activeRecord ? (
              <div className="field-panel">
                <h4>Current image status</h4>
                <dl className="brief-grid">
                  <div>
                    <dt>Status</dt>
                    <dd>{formatArticleImageStatus(activeRecord.status)}</dd>
                  </div>
                  <div>
                    <dt>Linked content draft</dt>
                    <dd>{activeRecord.contentDraft?.title ?? "Not linked"}</dd>
                  </div>
                  <div>
                    <dt>Preview image</dt>
                    <dd>{activeRecord.previewImageUrl || "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Final image</dt>
                    <dd>{activeRecord.finalImageUrl || "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Storage reference</dt>
                    <dd>{activeRecord.hasDocument ? "Private final asset stored" : "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{formatOptionalDate(activeRecord.updatedAt)}</dd>
                  </div>
                </dl>
                {activeRecord.hasDocument ? (
                  <div className="panel-divider-top">
                    <button
                      className="secondary-action"
                      disabled={downloadRefLoading}
                      onClick={() => void onFetchDownloadReference(project.id, activeRecord.id)}
                      type="button"
                    >
                      {downloadRefLoading ? "Preparing download..." : "Download private image"}
                    </button>
                    {downloadRefError && downloadRefError.recordId === activeRecord.id ? (
                      <AiDeliveryInlineAlert
                        message={
                          downloadRefError.message.includes("503") || downloadRefError.message.includes("unconfigured")
                            ? "Private image storage is not configured. Contact your administrator."
                            : downloadRefError.message
                        }
                        title="Download unavailable"
                      />
                    ) : null}
                    {downloadRef && downloadRef.recordId === activeRecord.id ? (
                      downloadRef.downloadUrl ? (
                        <AiDeliveryInlineNotice>
                          <strong>Download ready:</strong>{" "}
                          <a href={downloadRef.downloadUrl} target="_blank" rel="noopener noreferrer">
                            Open private image
                          </a>
                          {downloadRef.expiresSeconds ? (
                            <span className="muted-text"> (expires in {Math.floor(downloadRef.expiresSeconds / 60)} min)</span>
                          ) : null}
                        </AiDeliveryInlineNotice>
                      ) : (
                        <AiDeliveryInlineAlert
                          message="The image reference exists but storage is unavailable. Contact your administrator to configure storage."
                          title="Storage not available"
                        />
                      )
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
            {activeRecord ? (
              <div className="field-panel">
                <h4>Packaging handoff</h4>
                <AiDeliveryInlineNotice>
                  Hand off to deliverable packaging when linked draft and final references are ready. No generation, export, or
                  client delivery from this section.
                </AiDeliveryInlineNotice>
                <dl className="brief-grid">
                  <div>
                    <dt>Linked draft</dt>
                    <dd>{activeRecord.contentDraft?.title ?? "Not linked"}</dd>
                  </div>
                  <div>
                    <dt>Image readiness</dt>
                    <dd>{formatArticleImageStatus(activeRecord.status)}</dd>
                  </div>
                  <div>
                    <dt>Preview reference</dt>
                    <dd>{activeRecord.previewImageUrl || "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Final reference</dt>
                    <dd>
                      {activeRecord.finalImageUrl || (activeRecord.hasDocument ? "private asset" : "") || "Not set"}
                    </dd>
                  </div>
                </dl>
                <div className="card-actions card-actions-spaced">
                  <button
                    className="ghost-action"
                    disabled={saving}
                    onClick={() => void onHandoffToDeliverables(project.id, activeRecord)}
                    type="button"
                  >
                    Open deliverable packaging
                  </button>
                </div>
              </div>
            ) : null}
            <div className="field-grid field-grid-compact">
              <label>
                Linked content draft - Required
                <select
                  required
                  value={form.contentDraftId}
                  onChange={(event) => onFormChange((current) => ({ ...current, contentDraftId: event.target.value }))}
                >
                  <option value="">Select draft</option>
                  {articleImageDrafts.map((draftItem) => (
                    <option key={draftItem.id} value={draftItem.id}>
                      {draftItem.title} ({formatContentDraftStatus(draftItem.status)})
                    </option>
                  ))}
                </select>
                <span className="muted-text">Same-project content draft this image supports.</span>
              </label>
              <label>
                Status - Required
                <select
                  value={form.status}
                  onChange={(event) => onFormChange((current) => ({ ...current, status: event.target.value }))}
                >
                  {ARTICLE_IMAGE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {formatArticleImageStatus(status)}
                    </option>
                  ))}
                </select>
                <span className="muted-text">Use action buttons for preview, approval, and final-ready handoff.</span>
              </label>
              <label className="field-span-2">
                Title - Required
                <input
                  maxLength={255}
                  required
                  value={form.title}
                  onChange={(event) => onFormChange((current) => ({ ...current, title: event.target.value }))}
                />
                <span className="muted-text">Working asset name for the linked article image.</span>
              </label>
              <label className="field-span-2">
                Prompt - Required
                <textarea
                  maxLength={4000}
                  required
                  rows={4}
                  value={form.prompt}
                  onChange={(event) => onFormChange((current) => ({ ...current, prompt: event.target.value }))}
                />
                <span className="muted-text">Admin-only prompt. Not exposed to clients.</span>
              </label>
              <label className="field-span-2">
                Style notes - Optional
                <textarea
                  maxLength={4000}
                  rows={3}
                  value={form.styleNotes}
                  onChange={(event) => onFormChange((current) => ({ ...current, styleNotes: event.target.value }))}
                />
                <span className="muted-text">Internal visual direction only.</span>
              </label>
              <label>
                Preview image URL - Optional
                <input
                  maxLength={2048}
                  type="url"
                  value={form.previewImageUrl}
                  onChange={(event) => onFormChange((current) => ({ ...current, previewImageUrl: event.target.value }))}
                />
                <span className="muted-text">Manual admin preview reference.</span>
              </label>
              <label>
                Final image URL - Optional
                <input
                  maxLength={2048}
                  type="url"
                  value={form.finalImageUrl}
                  onChange={(event) => onFormChange((current) => ({ ...current, finalImageUrl: event.target.value }))}
                />
                <span className="muted-text">Manual admin final reference.</span>
              </label>
              <label className="field-span-2">
                Storage key reference - Optional
                <input
                  maxLength={1024}
                  value={form.storageKey}
                  onChange={(event) => onFormChange((current) => ({ ...current, storageKey: event.target.value }))}
                />
                <span className="muted-text">Internal storage reference. Use per-record upload controls below.</span>
              </label>
              <label className="field-span-2">
                Notes - Optional
                <textarea
                  maxLength={4000}
                  rows={3}
                  value={form.notes}
                  onChange={(event) => onFormChange((current) => ({ ...current, notes: event.target.value }))}
                />
                <span className="muted-text">Admin-only review and handoff notes.</span>
              </label>
            </div>
            <div className="modal-footer ai-delivery-modal-footer">
              <button className="ghost-action" disabled={saving} onClick={onClose} type="button">
                Close
              </button>
              <button className="ghost-action" disabled={saving} onClick={onNewImageRequest} type="button">
                New image request
              </button>
              <button
                className="primary-action"
                disabled={saving || !canSave}
                onClick={() => void onSave(project.id)}
                type="button"
              >
                {saving ? "Saving" : editorId ? "Save image request" : "Create image request"}
              </button>
              {activeRecord && !activeRecord.isArchived ? (
                <button
                  className="secondary-action"
                  disabled={
                    saving || !(activeRecord.previewImageUrl ?? "").trim() || activeRecord.status === "PREVIEW_READY"
                  }
                  onClick={() => void onMarkPreviewReady(project.id, activeRecord.id)}
                  type="button"
                >
                  Mark preview ready
                </button>
              ) : null}
              {activeRecord && !activeRecord.isArchived ? (
                <button
                  className="secondary-action"
                  disabled={
                    saving ||
                    !((activeRecord.previewImageUrl ?? "").trim() || (activeRecord.finalImageUrl ?? "").trim())
                  }
                  onClick={() => void onRequestChanges(project.id, activeRecord.id)}
                  type="button"
                >
                  Request changes
                </button>
              ) : null}
              {activeRecord && !activeRecord.isArchived ? (
                <button
                  className="secondary-action"
                  disabled={
                    saving ||
                    !((activeRecord.previewImageUrl ?? "").trim() || (activeRecord.finalImageUrl ?? "").trim()) ||
                    activeRecord.status === "APPROVED"
                  }
                  onClick={() => void onApprove(project.id, activeRecord.id)}
                  type="button"
                >
                  Approve image
                </button>
              ) : null}
              {activeRecord && !activeRecord.isArchived ? (
                <button
                  className="secondary-action"
                  disabled={
                    saving ||
                    !((activeRecord.finalImageUrl ?? "").trim() || activeRecord.hasDocument) ||
                    activeRecord.status === "FINAL_READY"
                  }
                  onClick={() => void onMarkFinalReady(project.id, activeRecord.id)}
                  type="button"
                >
                  Mark final ready
                </button>
              ) : null}
            </div>
          </section>

          <section className="field-panel ai-delivery-section-compact">
            <h3>Existing image production records</h3>
            {articleImages.length === 0 ? (
              <AiDeliveryInlineEmpty>
                No article image records yet. Add an image request after a content draft is ready.
              </AiDeliveryInlineEmpty>
            ) : null}
            {articleImages.map((image) => (
              <article className="entity-card" key={image.id}>
                <div className="entity-card-header">
                  <div>
                    <StatusBadge status={formatArticleImageStatus(image.isArchived ? "ARCHIVED" : image.status)} />
                    <h3>{image.title}</h3>
                    <p>{image.contentDraft ? `Linked to draft: ${image.contentDraft.title}` : "No linked draft"}</p>
                  </div>
                  <div className="card-actions">
                    <button className="ghost-action" disabled={saving} onClick={() => onEdit(image)} type="button">
                      Edit
                    </button>
                    {!image.isArchived ? (
                      <button
                        className="secondary-action"
                        disabled={saving || !image.previewImageUrl || image.status === "PREVIEW_READY"}
                        onClick={() => void onMarkPreviewReady(project.id, image.id)}
                        type="button"
                      >
                        Mark preview ready
                      </button>
                    ) : null}
                    {!image.isArchived ? (
                      <button
                        className="secondary-action"
                        disabled={saving || !(image.previewImageUrl || image.finalImageUrl)}
                        onClick={() => void onRequestChanges(project.id, image.id)}
                        type="button"
                      >
                        Request changes
                      </button>
                    ) : null}
                    {!image.isArchived ? (
                      <button
                        className="secondary-action"
                        disabled={saving || !(image.previewImageUrl || image.finalImageUrl) || image.status === "APPROVED"}
                        onClick={() => void onApprove(project.id, image.id)}
                        type="button"
                      >
                        Approve image
                      </button>
                    ) : null}
                    {!image.isArchived ? (
                      <button
                        className="secondary-action"
                        disabled={
                          saving || !(image.finalImageUrl || image.hasDocument) || image.status === "FINAL_READY"
                        }
                        onClick={() => void onMarkFinalReady(project.id, image.id)}
                        type="button"
                      >
                        Mark final ready
                      </button>
                    ) : null}
                    {!image.isArchived ? (
                      <button
                        className="ghost-action"
                        disabled={saving}
                        onClick={() => void onArchive(project.id, image.id)}
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
                    <dd>{formatArticleImageStatus(image.status)}</dd>
                  </div>
                  <div>
                    <dt>Preview URL</dt>
                    <dd>{image.previewImageUrl || "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Final URL</dt>
                    <dd>{image.finalImageUrl || "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Storage key</dt>
                    <dd>{image.hasDocument ? "Private final asset stored" : "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{formatOptionalDate(image.updatedAt)}</dd>
                  </div>
                  <div>
                    <dt>Private asset</dt>
                    <dd>{image.hasDocument ? "Private final asset stored" : "Not stored yet"}</dd>
                  </div>
                  <div className="field-span-2">
                    <dt>Style notes</dt>
                    <dd>{image.styleNotes || "No style notes"}</dd>
                  </div>
                  <div className="field-span-2">
                    <dt>Prompt</dt>
                    <dd>{image.prompt}</dd>
                  </div>
                  <div className="field-span-2">
                    <dt>Notes</dt>
                    <dd>{image.notes || "No notes"}</dd>
                  </div>
                </dl>
                {!image.isArchived ? (
                  <div className="field-grid brief-grid-spaced-top">
                    <label className="field-span-2">
                      Private final image upload - Optional
                      <input
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) =>
                          onFinalAssetFilesChange((current) => ({
                            ...current,
                            [image.id]: event.target.files?.[0] ?? null,
                          }))
                        }
                        type="file"
                      />
                      <span className="muted-text">Private final asset upload for this record.</span>
                    </label>
                  </div>
                ) : null}
                <div className="card-actions card-actions-spaced">
                  {!image.isArchived ? (
                    <button
                      className="secondary-action"
                      disabled={saving || !finalAssetFiles[image.id]}
                      onClick={() => void onUploadFinalAsset(project.id, image.id)}
                      type="button"
                    >
                      {uploadTargetId === image.id ? "Uploading" : "Upload final asset"}
                    </button>
                  ) : null}
                  {image.hasDocument ? (
                    <button
                      className="secondary-action"
                      disabled={downloadTargetId === image.id}
                      onClick={() => void onOpenPrivateFinalAsset(project.id, image.id)}
                      type="button"
                    >
                      {downloadTargetId === image.id ? "Opening" : "Open private final asset"}
                    </button>
                  ) : null}
                </div>
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
