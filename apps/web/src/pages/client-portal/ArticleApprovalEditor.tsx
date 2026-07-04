import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "../../components/Modal";
import { EmptyState } from "../../components/EmptyState";
import { Button, PageHeader, SectionPanel, StatusBadge } from "../../components/ui";
import { Alert, Input, Spinner, Textarea, Toast } from "../../design-system";
import {
  clientPortalApiRequest,
  formatApprovalDate,
  navigateToClientPortalHash,
  type DeliverableForApproval,
  type DeliverableForApprovalResponse,
  type DeliverableImageApproval,
  type DeliverableMetadataPatchResponse
} from "./client-portal-api";

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
  if (status === "REJECTED") return "Rejected";
  return "Pending";
}

function PortalInlineLoading({ label }: { label: string }) {
  return (
    <p className="cf-inline-loading" role="status">
      <Spinner size="sm" />
      {label}
    </p>
  );
}

function ApprovalBackLink() {
  return (
    <div className="portal-action-row cf-approval-back-row">
      <Button
        onClick={() => navigateToClientPortalHash("client-portal/pending-approvals")}
        type="button"
        variant="tertiary"
      >
        Back to pending approvals
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
    showToast("Article approved! DCA has been notified.");
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
    showToast("Article rejected. DCA has been notified.");
    window.setTimeout(() => navigateToClientPortalHash("client-portal/pending-approvals"), 600);
  }

  const pageTitle = deliverable ? metadata.title || deliverable.title : "Article approval";
  const pageDescription = deliverable
    ? `${deliverable.projectName} · Created ${formatApprovalDate(deliverable.createdAt)}`
    : "Review article drafts and images before publication.";

  return (
    <section className="view-section cf-page" aria-labelledby="article-approval-title" data-density="comfortable">
      {toast ? (
        <Toast message={toast.message} variant={toast.tone === "error" ? "danger" : "success"} />
      ) : null}

      <PageHeader
        description={pageDescription}
        eyebrow="Article approval"
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
          <SectionPanel title="Review context" tone="compact">
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
                  <StatusBadge status={deliverable.status} />
                </dd>
              </div>
            </dl>
          </SectionPanel>
        </aside>

        <div className="portal-approval-main">
          <SectionPanel
            description="Title, description, tags, category, and optional publish date. Changes save automatically."
            title="Article metadata"
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
              label="Description"
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
              label="Scheduled publish date"
              onChange={(event) => setMetadata((current) => ({ ...current, scheduledPublishAt: event.target.value }))}
              type="datetime-local"
              value={metadata.scheduledPublishAt}
            />
            {savingMetadata ? <PortalInlineLoading label="Saving metadata" /> : null}
          </SectionPanel>

          <SectionPanel
            description="Plain text article body. Changes save automatically."
            title="Article Body"
            tone="compact"
          >
            <Textarea
              className="entity-form portal-approval-textarea"
              id="article-body-content"
              label="Body Content (editable)"
              minLength={0}
              onChange={(event) => setBodyContent(event.target.value)}
              placeholder="Article body..."
              rows={12}
              value={bodyContent}
            />
            {savingBody ? <PortalInlineLoading label="Saving" /> : null}
          </SectionPanel>

          <SectionPanel
            description="Approve or reject each image before submitting the article."
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
                            Approve
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
                            Reject
                          </Button>
                        </div>
                      ) : null}

                      {image.approvalStatus === "APPROVED" ? (
                        <div className="portal-image-reviewed">
                          <p className="portal-reviewed-label portal-reviewed-label-success">✓ Approved</p>
                          <Button disabled={imageBusyId === image.id} onClick={() => void handleUndoImage(image.id)} size="sm" variant="tertiary">
                            Undo approval
                          </Button>
                        </div>
                      ) : null}

                      {image.approvalStatus === "REJECTED" ? (
                        <div className="portal-image-reviewed">
                          <p className="portal-reviewed-label portal-reviewed-label-danger">✕ Rejected</p>
                          {image.rejectionReason ? <p className="cf-record-note">{image.rejectionReason}</p> : null}
                          <Button disabled={imageBusyId === image.id} onClick={() => void handleUndoImage(image.id)} size="sm" variant="tertiary">
                            Undo rejection
                          </Button>
                        </div>
                      ) : null}

                      {rejectImageId === image.id ? (
                        <div className="portal-inline-reject">
                          <Input
                            className="entity-form"
                            onChange={(event) => setRejectImageReason(event.target.value)}
                            placeholder="Rejection reason"
                            type="text"
                            value={rejectImageReason}
                          />
                          <div className="portal-action-row">
                            <Button disabled={!rejectImageReason.trim()} onClick={() => void handleRejectImage(image.id)} size="sm">
                              Submit rejection
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

      <footer className="portal-approval-actions">
        <Button disabled={!allImagesReviewed || submitting} onClick={() => setShowApproveModal(true)}>
          Approve Article
        </Button>
        <Button
          onClick={() => {
            void saveMetadata(metadata);
            void saveBody(bodyContent);
          }}
          variant="tertiary"
        >
          Save &amp; Continue
        </Button>
        <Button disabled={submitting} onClick={() => setShowRejectModal(true)} variant="tertiary">
          Reject Article
        </Button>
      </footer>
        </>
      ) : null}

      {showApproveModal ? (
        <Modal
          eyebrow="Confirm approval"
          onClose={() => setShowApproveModal(false)}
          size="sm"
          title="Approve this article?"
          footer={
            <div className="modal-footer">
              <Button disabled={submitting} onClick={() => setShowApproveModal(false)} variant="secondary">
                Cancel
              </Button>
              <Button disabled={submitting} onClick={() => void handleApproveArticle()}>
                {submitting ? "Approving…" : "Approve"}
              </Button>
            </div>
          }
        >
          <p>DCA will be notified that you approved this article.</p>
        </Modal>
      ) : null}

      {showRejectModal ? (
        <Modal
          eyebrow="Reject article"
          onClose={() => setShowRejectModal(false)}
          size="md"
          title="Reject this article?"
          footer={
            <div className="modal-footer">
              <Button disabled={submitting} onClick={() => setShowRejectModal(false)} variant="secondary">
                Cancel
              </Button>
              <Button disabled={submitting || !articleRejectReason.trim()} onClick={() => void handleRejectArticle()}>
                {submitting ? "Submitting…" : "Reject article"}
              </Button>
            </div>
          }
        >
          <Textarea
            className="entity-form"
            id="article-reject-reason"
            label="Rejection reason"
            onChange={(event) => setArticleRejectReason(event.target.value)}
            placeholder="Tell DCA what needs to change…"
            rows={5}
            value={articleRejectReason}
          />
        </Modal>
      ) : null}
    </section>
  );
}
