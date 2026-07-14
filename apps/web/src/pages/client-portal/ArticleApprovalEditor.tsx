import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "../../components/ui";
import { Alert, Button, EmptyState, Input, LoadingState, PageHeader, SectionPanel, StatusBadge, Textarea, Toast } from "../../components/ui";
import {
  DEFAULT_APPROVAL_CHECKLIST,
  createEmptyApprovalChecklistState,
  isApprovalChecklistComplete
} from "./approval-checklist";
import { ClientPortalStatusBadge } from "./ClientPortalStatusBadge";
import { isClientPortalStatusVisible } from "./client-portal-status";
import {
  clientPortalApiRequest,
  formatApprovalDate,
  navigateToClientPortalHash,
  type DeliverableForApproval,
  type DeliverableForApprovalResponse,
  type DeliverableImageApproval,
  type DeliverableMetadataPatchResponse
} from "./client-portal-api";
import "./client-portal.css";

type ArticleApprovalEditorProps = {
  deliverableId: string;
};

type ToastTone = "success" | "error";

type ToastState = {
  message: string;
  tone: ToastTone;
} | null;

type MetadataFormState = {
  title: string;
  description: string;
  category: string;
  tagsInput: string;
  scheduledPublishAt: string;
};

function tagsToInput(tags: string[]): string {
  return tags.join(", ");
}

function inputToTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function metadataFromDeliverable(deliverable: DeliverableForApproval): MetadataFormState {
  return {
    title: deliverable.title,
    description: deliverable.description ?? "",
    category: deliverable.category ?? "",
    tagsInput: tagsToInput(deliverable.tags),
    scheduledPublishAt: toDatetimeLocalValue(deliverable.scheduledPublishAt)
  };
}

function metadataPayload(state: MetadataFormState) {
  return {
    title: state.title,
    description: state.description.trim() ? state.description : null,
    category: state.category.trim() ? state.category : null,
    tags: inputToTags(state.tagsInput),
    scheduledPublishAt: fromDatetimeLocalValue(state.scheduledPublishAt)
  };
}

function metadataStatesEqual(a: MetadataFormState, b: MetadataFormState): boolean {
  return (
    a.title === b.title &&
    a.description === b.description &&
    a.category === b.category &&
    a.tagsInput === b.tagsInput &&
    a.scheduledPublishAt === b.scheduledPublishAt
  );
}

function imageStatusLabel(status: DeliverableImageApproval["approvalStatus"]): string {
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Pending updates";
  return "Pending";
}

function PortalInlineLoading({ label }: { label: string }) {
  return <LoadingState label={label} variant="inline" />;
}

function ApprovalBackLink() {
  return (
    <div className="portal-action-row cf-approval-back-row">
      <Button
        onClick={() => navigateToClientPortalHash("client-portal/pending-approvals")}
        type="button"
        variant="tertiary"
      >
        Back to pending reviews
      </Button>
    </div>
  );
}

export function ArticleApprovalEditor({ deliverableId }: ArticleApprovalEditorProps) {
  const [deliverable, setDeliverable] = useState<DeliverableForApproval | null>(null);
  const [bodyContent, setBodyContent] = useState("");
  const [metadata, setMetadata] = useState<MetadataFormState>({
    title: "",
    description: "",
    category: "",
    tagsInput: "",
    scheduledPublishAt: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [savingBody, setSavingBody] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [imageBusyId, setImageBusyId] = useState<string | null>(null);
  const [rejectImageId, setRejectImageId] = useState<string | null>(null);
  const [rejectImageReason, setRejectImageReason] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [articleRejectReason, setArticleRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checklistState, setChecklistState] = useState(() => createEmptyApprovalChecklistState());
  const saveTimerRef = useRef<number | null>(null);
  const metadataSaveTimerRef = useRef<number | null>(null);
  const lastSavedBodyRef = useRef("");
  const lastSavedMetadataRef = useRef<MetadataFormState>({
    title: "",
    description: "",
    category: "",
    tagsInput: "",
    scheduledPublishAt: ""
  });

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const loadDeliverable = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await clientPortalApiRequest<DeliverableForApprovalResponse>(`/deliverables/${deliverableId}/for-approval`);
    if (!response.ok) {
      setError(response.error.message);
      setDeliverable(null);
      setLoading(false);
      return;
    }
    setDeliverable(response.data.deliverable);
    setBodyContent(response.data.deliverable.bodyContent);
    const nextMetadata = metadataFromDeliverable(response.data.deliverable);
    setMetadata(nextMetadata);
    lastSavedBodyRef.current = response.data.deliverable.bodyContent;
    lastSavedMetadataRef.current = nextMetadata;
    setLoading(false);
  }, [deliverableId]);

  useEffect(() => {
    void loadDeliverable();
  }, [loadDeliverable]);

  const saveBody = useCallback(async (nextBody: string) => {
    if (nextBody === lastSavedBodyRef.current) return;
    setSavingBody(true);
    const response = await clientPortalApiRequest<{ deliverable: { bodyContent: string } }>(`/deliverables/${deliverableId}/body`, {
      method: "PATCH",
      body: { bodyContent: nextBody }
    });
    setSavingBody(false);
    if (!response.ok) {
      showToast(response.error.message, "error");
      return;
    }
    lastSavedBodyRef.current = response.data.deliverable.bodyContent;
    showToast("Saved");
  }, [deliverableId, showToast]);

  const saveMetadata = useCallback(async (nextMetadata: MetadataFormState) => {
    if (metadataStatesEqual(nextMetadata, lastSavedMetadataRef.current)) return;
    setSavingMetadata(true);
    const response = await clientPortalApiRequest<DeliverableMetadataPatchResponse>(`/deliverables/${deliverableId}/metadata`, {
      method: "PATCH",
      body: metadataPayload(nextMetadata)
    });
    setSavingMetadata(false);
    if (!response.ok) {
      showToast(response.error.message, "error");
      return;
    }
    const savedMetadata = metadataFromDeliverable({
      ...(deliverable ?? {
        id: deliverableId,
        status: "PENDING_CLIENT_REVIEW",
        bodyContent: "",
        projectId: "",
        projectName: "",
        clientId: "",
        clientName: null,
        createdAt: new Date().toISOString(),
        images: []
      }),
      title: response.data.deliverable.title,
      description: response.data.deliverable.description,
      tags: response.data.deliverable.tags,
      category: response.data.deliverable.category,
      scheduledPublishAt: response.data.deliverable.scheduledPublishAt
    });
    lastSavedMetadataRef.current = savedMetadata;
    setMetadata(savedMetadata);
    setDeliverable((current) =>
      current
        ? {
            ...current,
            title: response.data.deliverable.title,
            description: response.data.deliverable.description,
            tags: response.data.deliverable.tags,
            category: response.data.deliverable.category,
            scheduledPublishAt: response.data.deliverable.scheduledPublishAt
          }
        : current
    );
    showToast("Metadata saved");
  }, [deliverable, deliverableId, showToast]);

  useEffect(() => {
    if (loading || !deliverable) return;
    if (bodyContent === lastSavedBodyRef.current) return;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void saveBody(bodyContent);
    }, 700);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [bodyContent, deliverable, loading, saveBody]);

  useEffect(() => {
    if (loading || !deliverable) return;
    if (metadataStatesEqual(metadata, lastSavedMetadataRef.current)) return;

    if (metadataSaveTimerRef.current) {
      window.clearTimeout(metadataSaveTimerRef.current);
    }
    metadataSaveTimerRef.current = window.setTimeout(() => {
      void saveMetadata(metadata);
    }, 700);

    return () => {
      if (metadataSaveTimerRef.current) {
        window.clearTimeout(metadataSaveTimerRef.current);
      }
    };
  }, [metadata, deliverable, loading, saveMetadata]);

  const allImagesReviewed = useMemo(() => {
    if (!deliverable || deliverable.images.length === 0) return true;
    return deliverable.images.every((image) => image.approvalStatus === "APPROVED" || image.approvalStatus === "REJECTED");
  }, [deliverable]);

  const checklistComplete = useMemo(
    () => isApprovalChecklistComplete(checklistState),
    [checklistState]
  );

  const canApproveArticle = allImagesReviewed && checklistComplete && !submitting;

  const reviewNextActionLabel = deliverable
    ? !allImagesReviewed
      ? "Next action: Review the body and image approvals"
      : !checklistComplete
        ? "Next action: Complete the approval checklist"
        : "Next action: Approve this version or request changes"
    : "Next action: Load the article review";

  function openApproveModal() {
    setChecklistState(createEmptyApprovalChecklistState());
    setShowApproveModal(true);
  }

  async function handleApproveImage(imageId: string) {
    setImageBusyId(imageId);
    const response = await clientPortalApiRequest<{ imageApproval: { articleImageId: string; status: string } }>(
      `/deliverables/${deliverableId}/images/${imageId}/approve`,
      { method: "PATCH" }
    );
    setImageBusyId(null);
    if (!response.ok) {
      showToast(response.error.message, "error");
      return;
    }
    setDeliverable((current) =>
      current
        ? {
            ...current,
            images: current.images.map((image) =>
              image.id === imageId ? { ...image, approvalStatus: "APPROVED", rejectionReason: null } : image
            )
          }
        : current
    );
  }

  async function handleRejectImage(imageId: string) {
    const reason = rejectImageReason.trim();
    if (!reason) return;
    setImageBusyId(imageId);
    const response = await clientPortalApiRequest<{ imageApproval: { articleImageId: string; status: string; rejectionReason: string | null } }>(
      `/deliverables/${deliverableId}/images/${imageId}/reject`,
      { method: "PATCH", body: { rejectionReason: reason } }
    );
    setImageBusyId(null);
    if (!response.ok) {
      showToast(response.error.message, "error");
      return;
    }
    setRejectImageId(null);
    setRejectImageReason("");
    setDeliverable((current) =>
      current
        ? {
            ...current,
            images: current.images.map((image) =>
              image.id === imageId ? { ...image, approvalStatus: "REJECTED", rejectionReason: reason } : image
            )
          }
        : current
    );
  }

  async function handleUndoImage(imageId: string) {
    setImageBusyId(imageId);
    const response = await clientPortalApiRequest<{ imageApproval: { articleImageId: string; status: string } }>(
      `/deliverables/${deliverableId}/images/${imageId}/undo`,
      { method: "PATCH" }
    );
    setImageBusyId(null);
    if (!response.ok) {
      showToast(response.error.message, "error");
      return;
    }
    setDeliverable((current) =>
      current
        ? {
            ...current,
            images: current.images.map((image) =>
              image.id === imageId ? { ...image, approvalStatus: "PENDING", rejectionReason: null } : image
            )
          }
        : current
    );
  }

  async function handleApproveArticle() {
    setSubmitting(true);
    const response = await clientPortalApiRequest(`/deliverables/${deliverableId}/approve`, { method: "PATCH" });
    setSubmitting(false);
    setShowApproveModal(false);
    if (!response.ok) {
      showToast(response.error.message, "error");
      return;
    }
    showToast("Article approved.");
    window.setTimeout(() => navigateToClientPortalHash("client-portal/pending-approvals"), 600);
  }

  async function handleRejectArticle() {
    const reason = articleRejectReason.trim();
    if (!reason) return;
    setSubmitting(true);
    const response = await clientPortalApiRequest(`/deliverables/${deliverableId}/reject`, {
      method: "PATCH",
      body: { rejectionReason: reason }
    });
    setSubmitting(false);
    setShowRejectModal(false);
    if (!response.ok) {
      showToast(response.error.message, "error");
      return;
    }
    showToast("Changes requested. Your team will review these updates.");
    window.setTimeout(() => navigateToClientPortalHash("client-portal/pending-approvals"), 600);
  }

  const pageTitle = deliverable ? metadata.title || deliverable.title : "Article approval";
  const pageDescription = deliverable
    ? `${deliverable.projectName} · Created ${formatApprovalDate(deliverable.createdAt)}`
    : "Review the current draft, then approve it or request changes.";

  return (
    <section className="view-section cf-page" aria-labelledby="article-approval-title" data-density="comfortable">
      {toast ? (
        <Toast message={toast.message} variant={toast.tone === "error" ? "danger" : "success"} />
      ) : null}

      <PageHeader
        description={pageDescription}
        eyebrow="Article review"
        meta={<span className="muted-text">{deliverable ? `${deliverable.projectName} · ${reviewNextActionLabel}` : reviewNextActionLabel}</span>}
        title={pageTitle}
        titleId="article-approval-title"
      />

      <ApprovalBackLink />

      {loading ? <PortalInlineLoading label="Loading article for approval" /> : null}

      {!loading && (error || !deliverable) ? (
        <>
          <Alert message={error ?? "Article not available."} title="Approval unavailable" variant="danger" />
          <div className="portal-action-row">
            <Button onClick={() => void loadDeliverable()} variant="secondary">
              Try again
            </Button>
          </div>
        </>
      ) : null}

      {!loading && deliverable ? (
        <>
      <div className="portal-approval-layout">
        <aside className="portal-approval-meta">
          <SectionPanel description="Details for this draft." title="Review summary" tone="compact">
            <dl className="field-grid">
              <div>
                <dt>Project</dt>
                <dd>{deliverable.projectName}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatApprovalDate(deliverable.createdAt)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  {isClientPortalStatusVisible(deliverable.status) ? (
                    <ClientPortalStatusBadge status={deliverable.status} />
                  ) : (
                    <span className="muted-text">In review</span>
                  )}
                </dd>
              </div>
            </dl>
          </SectionPanel>
        </aside>

        <div className="portal-approval-main">
          <SectionPanel
            description="Title, summary, tags, category, and optional planned release date. Changes save automatically."
            title="Article details"
            tone="compact"
          >
            <Input
              className="entity-form"
              id="article-title"
              label="Title"
              onChange={(event) => setMetadata((current) => ({ ...current, title: event.target.value }))}
              type="text"
              value={metadata.title}
            />

            <Input
              className="entity-form"
              id="article-category"
              label="Category"
              onChange={(event) => setMetadata((current) => ({ ...current, category: event.target.value }))}
              placeholder="e.g. Wellness"
              type="text"
              value={metadata.category}
            />

            <Textarea
              className="entity-form"
              id="article-description"
              label="Summary"
              onChange={(event) => setMetadata((current) => ({ ...current, description: event.target.value }))}
              placeholder="Short summary or excerpt"
              rows={3}
              value={metadata.description}
            />

            <Input
              className="entity-form"
              id="article-tags"
              label="Tags"
              onChange={(event) => setMetadata((current) => ({ ...current, tagsInput: event.target.value }))}
              placeholder="Comma-separated tags"
              type="text"
              value={metadata.tagsInput}
            />

            <Input
              className="entity-form"
              id="article-scheduled-publish"
              label="Planned release date"
              onChange={(event) => setMetadata((current) => ({ ...current, scheduledPublishAt: event.target.value }))}
              type="datetime-local"
              value={metadata.scheduledPublishAt}
            />
            {savingMetadata ? <PortalInlineLoading label="Saving metadata" /> : null}
          </SectionPanel>

          <SectionPanel
            description="Plain text article body. Changes save automatically."
            title="Article body"
            tone="compact"
          >
            <Textarea
              className="entity-form portal-approval-textarea"
              id="article-body-content"
              label="Article text"
              minLength={0}
              onChange={(event) => setBodyContent(event.target.value)}
              placeholder="Article body..."
              rows={12}
              value={bodyContent}
            />
            {savingBody ? <PortalInlineLoading label="Saving" /> : null}
          </SectionPanel>

          <SectionPanel
            description="Approve or request changes for each image before you finish this review."
            title="Images"
            tone="compact"
          >
            {deliverable.images.length === 0 ? (
              <EmptyState message="This article has no images attached." title="No images" variant="inline" />
            ) : (
              <div className="cf-record-list portal-image-approval-grid">
                {deliverable.images.map((image) => (
                  <article className="cf-record portal-image-approval-card" key={image.id}>
                    <div className="portal-image-thumb-wrap">
                      {image.imageUrl ? (
                        <img alt={image.altText} className="portal-image-thumb" src={image.imageUrl} />
                      ) : (
                        <div className="portal-image-thumb portal-image-thumb-placeholder">No preview</div>
                      )}
                    </div>
                    <div className="portal-image-approval-body">
                      <div className="cf-record-kicker">
                        <StatusBadge status={imageStatusLabel(image.approvalStatus)} />
                      </div>
                      <p className="cf-record-note">{image.altText}</p>

                      {image.approvalStatus === "PENDING" ? (
                        <div className="portal-action-row">
                          <Button disabled={imageBusyId === image.id} onClick={() => void handleApproveImage(image.id)} size="sm">
                            Approve image
                          </Button>
                          <Button
                            disabled={imageBusyId === image.id}
                            onClick={() => {
                              setRejectImageId(image.id);
                              setRejectImageReason("");
                            }}
                            size="sm"
                            variant="secondary"
                          >
                            Request changes
                          </Button>
                        </div>
                      ) : null}

                      {image.approvalStatus === "APPROVED" ? (
                        <div className="portal-image-reviewed">
                          <p className="portal-reviewed-label portal-reviewed-label-success">✓ Approved</p>
                          <Button disabled={imageBusyId === image.id} onClick={() => void handleUndoImage(image.id)} size="sm" variant="tertiary">
                            Undo decision
                          </Button>
                        </div>
                      ) : null}

                      {image.approvalStatus === "REJECTED" ? (
                        <div className="portal-image-reviewed">
                          <p className="portal-reviewed-label portal-reviewed-label-danger">✕ Changes requested</p>
                          {image.rejectionReason ? <p className="cf-record-note">{image.rejectionReason}</p> : null}
                          <Button disabled={imageBusyId === image.id} onClick={() => void handleUndoImage(image.id)} size="sm" variant="tertiary">
                            Undo decision
                          </Button>
                        </div>
                      ) : null}

                      {rejectImageId === image.id ? (
                        <div className="portal-inline-reject">
                          <Input
                            className="entity-form"
                            label="What should change?"
                            onChange={(event) => setRejectImageReason(event.target.value)}
                            placeholder="Describe the image changes you'd like to see…"
                            type="text"
                            value={rejectImageReason}
                          />
                          <div className="portal-action-row">
                            <Button disabled={!rejectImageReason.trim()} onClick={() => void handleRejectImage(image.id)} size="sm">
                              Request changes
                            </Button>
                            <Button onClick={() => setRejectImageId(null)} size="sm" variant="tertiary">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionPanel>
        </div>
      </div>

      <footer className="portal-approval-actions is-sticky">
        <Button
          aria-disabled={!allImagesReviewed || submitting}
          disabled={!allImagesReviewed || submitting}
          onClick={() => openApproveModal()}
          title={
            !allImagesReviewed
              ? "Review all images before approving"
              : "Open approval checklist to confirm and approve"
          }
        >
          Approve this version
        </Button>
        <Button
          onClick={() => {
            void saveMetadata(metadata);
            void saveBody(bodyContent);
          }}
          variant="tertiary"
        >
          Save changes
        </Button>
        <Button disabled={submitting} onClick={() => setShowRejectModal(true)} variant="tertiary">
          Request changes
        </Button>
      </footer>
        </>
      ) : null}

      {showApproveModal ? (
        <Modal isOpen
          eyebrow="Deliverable Approval"
          onClose={() => setShowApproveModal(false)}
          size="md"
          title="Approve article"
          footer={
            <div className="modal-footer">
              <Button disabled={submitting} onClick={() => setShowApproveModal(false)} variant="secondary">
                Close
              </Button>
              <Button
                aria-disabled={!checklistComplete || submitting}
                disabled={!checklistComplete || submitting}
                onClick={() => void handleApproveArticle()}
                title={
                  checklistComplete
                    ? undefined
                    : "Complete all checklist items before approving"
                }
              >
                {submitting ? "Approving…" : "Approve"}
              </Button>
            </div>
          }
        >
          <p>
            Confirm you have reviewed this article. Completing the checklist enables Approve.
            After approval, your team will move this work to the next step.
          </p>
          <ul className="approval-checklist" aria-label="Approval checklist">
            {DEFAULT_APPROVAL_CHECKLIST.map((item) => (
              <li className="approval-checklist-item" key={item.id}>
                <input
                  checked={checklistState[item.id] === true}
                  id={`approval-check-${item.id}`}
                  onChange={(event) =>
                    setChecklistState((current) => ({
                      ...current,
                      [item.id]: event.target.checked
                    }))
                  }
                  type="checkbox"
                />
                <label htmlFor={`approval-check-${item.id}`}>{item.label}</label>
              </li>
            ))}
          </ul>
          {!checklistComplete ? (
            <p className="approval-checklist-hint muted-text">
              Check every item above to enable Approve.
            </p>
          ) : null}
        </Modal>
      ) : null}

      {showRejectModal ? (
        <Modal isOpen
          eyebrow="Request changes"
          onClose={() => setShowRejectModal(false)}
          size="md"
          title="Request changes"
          footer={
            <div className="modal-footer">
              <Button disabled={submitting} onClick={() => setShowRejectModal(false)} variant="secondary">
                Cancel
              </Button>
              <Button
                aria-disabled={submitting || !articleRejectReason.trim()}
                disabled={submitting || !articleRejectReason.trim()}
                onClick={() => void handleRejectArticle()}
                title={
                  !articleRejectReason.trim()
                    ? "Describe the changes you want before submitting"
                    : undefined
                }
              >
                {submitting ? "Submitting…" : "Request changes"}
              </Button>
            </div>
          }
        >
          <Textarea
            className="entity-form"
            id="article-reject-reason"
            label="What should change?"
            onChange={(event) => setArticleRejectReason(event.target.value)}
            placeholder="Describe the changes you'd like to see…"
            rows={5}
            value={articleRejectReason}
          />
        </Modal>
      ) : null}
    </section>
  );
}
