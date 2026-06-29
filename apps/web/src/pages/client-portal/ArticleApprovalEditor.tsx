import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "../../components/Modal";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { PageHeader, SectionPanel, StatusBadge } from "../../components/ui";
import {
  clientPortalApiRequest,
  formatApprovalDate,
  navigateToClientPortalHash,
  type DeliverableForApproval,
  type DeliverableForApprovalResponse,
  type DeliverableImageApproval
} from "./client-portal-api";

type ArticleApprovalEditorProps = {
  deliverableId: string;
};

type ToastTone = "success" | "error";

type ToastState = {
  message: string;
  tone: ToastTone;
} | null;

function imageStatusLabel(status: DeliverableImageApproval["approvalStatus"]): string {
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Rejected";
  return "Pending";
}

export function ArticleApprovalEditor({ deliverableId }: ArticleApprovalEditorProps) {
  const [deliverable, setDeliverable] = useState<DeliverableForApproval | null>(null);
  const [bodyContent, setBodyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [savingBody, setSavingBody] = useState(false);
  const [imageBusyId, setImageBusyId] = useState<string | null>(null);
  const [rejectImageId, setRejectImageId] = useState<string | null>(null);
  const [rejectImageReason, setRejectImageReason] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [articleRejectReason, setArticleRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const saveTimerRef = useRef<number | null>(null);
  const lastSavedBodyRef = useRef("");

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
    lastSavedBodyRef.current = response.data.deliverable.bodyContent;
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

  if (loading) {
    return <LoadingState label="Loading article for approval" />;
  }

  if (error || !deliverable) {
    return (
      <section className="view-section">
        <ErrorState message={error ?? "Article not available."} title="Approval unavailable" />
        <div className="portal-action-row">
          <button className="secondary-action" onClick={() => navigateToClientPortalHash("client-portal/pending-approvals")} type="button">
            Back to pending approvals
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="view-section" aria-labelledby="article-approval-title">
      {toast ? (
        <div className={`portal-toast portal-toast-${toast.tone}`} role="status">
          {toast.message}
        </div>
      ) : null}

      <PageHeader
        description={`${deliverable.projectName} · Created ${formatApprovalDate(deliverable.createdAt)}`}
        eyebrow="Article approval"
        title={deliverable.title}
        titleId="article-approval-title"
      />

      <div className="portal-approval-layout">
        <aside className="portal-approval-meta">
          <SectionPanel title="Article metadata" tone="compact">
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
          <SectionPanel description="Plain text article body. Changes save automatically." title="Article Body">
            <label className="field-label" htmlFor="article-body-content">
              Body Content (editable)
            </label>
            <textarea
              className="entity-form portal-approval-textarea"
              id="article-body-content"
              minLength={0}
              onChange={(event) => setBodyContent(event.target.value)}
              placeholder="Article body..."
              rows={12}
              value={bodyContent}
            />
            {savingBody ? <p className="muted-text">Saving…</p> : null}
          </SectionPanel>

          <SectionPanel description="Approve or reject each image before submitting the article." title="Images">
            {deliverable.images.length === 0 ? (
              <EmptyState message="This article has no images attached." title="No images" variant="inline" />
            ) : (
              <div className="portal-image-approval-grid">
                {deliverable.images.map((image) => (
                  <article className="entity-card portal-image-approval-card" key={image.id}>
                    <div className="portal-image-thumb-wrap">
                      {image.imageUrl ? (
                        <img alt={image.altText} className="portal-image-thumb" src={image.imageUrl} />
                      ) : (
                        <div className="portal-image-thumb portal-image-thumb-placeholder">No preview</div>
                      )}
                    </div>
                    <div className="portal-image-approval-body">
                      <p className="dense-kicker">
                        <StatusBadge status={imageStatusLabel(image.approvalStatus)} />
                      </p>
                      <p className="muted-text">{image.altText}</p>

                      {image.approvalStatus === "PENDING" ? (
                        <div className="portal-action-row">
                          <button
                            className="primary-action"
                            disabled={imageBusyId === image.id}
                            onClick={() => void handleApproveImage(image.id)}
                            type="button"
                          >
                            Approve
                          </button>
                          <button
                            className="secondary-action"
                            disabled={imageBusyId === image.id}
                            onClick={() => {
                              setRejectImageId(image.id);
                              setRejectImageReason("");
                            }}
                            type="button"
                          >
                            Reject
                          </button>
                        </div>
                      ) : null}

                      {image.approvalStatus === "APPROVED" ? (
                        <div className="portal-image-reviewed">
                          <p className="portal-reviewed-label portal-reviewed-label-success">✓ Approved</p>
                          <button className="ghost-action" disabled={imageBusyId === image.id} onClick={() => void handleUndoImage(image.id)} type="button">
                            Undo approval
                          </button>
                        </div>
                      ) : null}

                      {image.approvalStatus === "REJECTED" ? (
                        <div className="portal-image-reviewed">
                          <p className="portal-reviewed-label portal-reviewed-label-danger">✕ Rejected</p>
                          {image.rejectionReason ? <p className="dense-row-note">{image.rejectionReason}</p> : null}
                          <button className="ghost-action" disabled={imageBusyId === image.id} onClick={() => void handleUndoImage(image.id)} type="button">
                            Undo rejection
                          </button>
                        </div>
                      ) : null}

                      {rejectImageId === image.id ? (
                        <div className="portal-inline-reject">
                          <input
                            className="entity-form"
                            onChange={(event) => setRejectImageReason(event.target.value)}
                            placeholder="Rejection reason"
                            type="text"
                            value={rejectImageReason}
                          />
                          <div className="portal-action-row">
                            <button className="primary-action" disabled={!rejectImageReason.trim()} onClick={() => void handleRejectImage(image.id)} type="button">
                              Submit rejection
                            </button>
                            <button className="ghost-action" onClick={() => setRejectImageId(null)} type="button">
                              Cancel
                            </button>
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
        <button className="secondary-action" onClick={() => void saveBody(bodyContent)} type="button">
          Save &amp; Continue
        </button>
        <button className="primary-action" disabled={!allImagesReviewed || submitting} onClick={() => setShowApproveModal(true)} type="button">
          Approve Article
        </button>
        <button className="secondary-action" disabled={submitting} onClick={() => setShowRejectModal(true)} type="button">
          Reject Article
        </button>
      </footer>

      {showApproveModal ? (
        <Modal
          eyebrow="Confirm approval"
          onClose={() => setShowApproveModal(false)}
          size="sm"
          title="Approve this article?"
          footer={
            <div className="modal-footer">
              <button className="secondary-action" disabled={submitting} onClick={() => setShowApproveModal(false)} type="button">
                Cancel
              </button>
              <button className="primary-action" disabled={submitting} onClick={() => void handleApproveArticle()} type="button">
                {submitting ? "Approving…" : "Approve"}
              </button>
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
              <button className="secondary-action" disabled={submitting} onClick={() => setShowRejectModal(false)} type="button">
                Cancel
              </button>
              <button className="primary-action" disabled={submitting || !articleRejectReason.trim()} onClick={() => void handleRejectArticle()} type="button">
                {submitting ? "Submitting…" : "Reject article"}
              </button>
            </div>
          }
        >
          <label className="field-label" htmlFor="article-reject-reason">
            Rejection reason
          </label>
          <textarea
            className="entity-form"
            id="article-reject-reason"
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
