import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import {
  AiDeliveryDeliverableModal,
  type AiDeliveryDeliverableModalProps,
} from "./AiDeliveryDeliverableModal";
import type {
  AiDeliveryDeliverableReviewSummary,
  AiDeliveryDeliverableSummary,
  AiDeliveryProjectSummary,
} from "./AiDeliveryPage";

const project: AiDeliveryProjectSummary = {
  id: "p1",
  clientId: "c1",
  client: { id: "c1", name: "Acme" },
  projectId: null,
  project: { id: "pr1", name: "SEO" },
  name: "June delivery",
  targetMonth: "2026-06",
  plannedContentScopeNotes: null,
  isArchived: false,
  brief: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

const deliverable: AiDeliveryDeliverableSummary = {
  id: "d1",
  aiDeliveryProjectId: "p1",
  contentDraftId: "draft-1",
  articleImageId: null,
  contentDraft: { id: "draft-1", title: "Approved draft", status: "APPROVED" },
  articleImage: null,
  title: "Package Alpha",
  description: "Handoff package",
  deliveryType: "CONTENT_PACKAGE",
  status: "READY",
  exportUrl: "https://example.com/export/very-long-path-that-should-wrap-safely",
  hasDocument: true,
  notes: "QA notes",
  isArchived: false,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

const longTitleDeliverable: AiDeliveryDeliverableSummary = {
  ...deliverable,
  id: "d-long",
  title:
    "Extremely long deliverable title that should wrap safely without breaking the modal layout at narrow widths and without overflowing horizontally",
  exportUrl: null,
  hasDocument: false,
  status: "DRAFT",
};

function identityLabel(value?: string | null): string {
  return value ?? "Not set";
}

function baseProps(overrides: Partial<AiDeliveryDeliverableModalProps> = {}): AiDeliveryDeliverableModalProps {
  return {
    isOpen: true,
    onClose: vi.fn(),
    project,
    loading: false,
    saving: false,
    error: null,
    actionGuidance: "Create or update packaging records for approved assets.",
    deliverables: [deliverable],
    visibleDeliverables: [deliverable],
    activeDeliverableCount: 1,
    archivedDeliverableCount: 0,
    activeDeliverableRecord: deliverable,
    deliverableEditorId: deliverable.id,
    deliverableForm: {
      contentDraftId: "draft-1",
      articleImageId: null,
      title: "Package Alpha",
      description: "Handoff package",
      deliveryType: "CONTENT_PACKAGE",
      status: "READY",
      exportUrl: "https://example.com/export",
      storageKey: null,
      notes: "QA notes",
      isArchived: false,
    },
    onFormChange: vi.fn(),
    onEditorIdChange: vi.fn(),
    deliverableDraftOptions: [],
    deliverableArticleImageOptions: [],
    deliverableLinkedDraftRecord: {
      id: "draft-1",
      aiDeliveryProjectId: "p1",
      contentPlanItemId: null,
      contentPlanItem: null,
      title: "Approved draft",
      slug: "approved-draft",
      draftBody: "Body",
      status: "APPROVED",
      notes: null,
      reviewRequestedAt: null,
      approvedAt: "2026-06-01T12:00:00.000Z",
      revisionCount: 0,
      clientComment: null,
      isArchived: false,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
    },
    deliverableLinkedImageRecord: null,
    deliverableRelatedImages: [],
    deliverableHasRecordedReference: true,
    deliverableReadinessBlockers: [],
    deliverableDocumentFiles: {},
    onDocumentFilesChange: vi.fn(),
    deliverableUploadTargetId: null,
    deliverableDownloadTargetId: null,
    deliverableDownloadRefLoading: false,
    deliverableDownloadRefError: null,
    deliverableDownloadRef: null,
    deliverableWordPressDraftTargetId: null,
    deliverableWordPressDraftError: null,
    deliverableWordPressDraft: null,
    deliverableWordPressPublishTargetId: null,
    deliverableWordPressPublishError: null,
    deliverableWordPressPublishResult: null,
    deliverablePublicationTargets: [],
    deliverablePublicationTargetId: "",
    onPublicationTargetIdChange: vi.fn(),
    selectedPublicationTarget: null,
    deliverablePublicationCredentialStatus: null,
    projectPublicationLogs: [],
    deliverableGoogleDocExportTargetId: null,
    deliverableGoogleDocExportError: null,
    deliverableGoogleDocExportResult: null,
    selectedReviewDeliverable: null,
    selectedReviewDeliverableId: null,
    deliverableReviewsLoading: false,
    deliverableReviewsSaving: false,
    deliverableReviewsError: null,
    deliverableReviews: [],
    deliverableReviewEditorId: null,
    deliverableReviewForm: { status: "NOT_STARTED", reviewerName: "", reviewNotes: "" },
    onReviewFormChange: vi.fn(),
    onReviewEditorIdChange: vi.fn(),
    latestSelectedReview: null,
    loadedDeliverableReviews: {},
    formatDeliverableStatus: identityLabel,
    formatContentDraftStatus: identityLabel,
    formatArticleImageStatus: identityLabel,
    formatEnumLabel: identityLabel,
    formatOptionalDate: () => "Jun 2, 2026",
    formatPreview: (value) => value || "—",
    formatStatusBreakdown: () => "None",
    getDeliverableExportState: () => "Recorded",
    getMostRecentReview: () => null,
    onEditDeliverable: vi.fn(),
    onSaveDeliverable: vi.fn(),
    onMarkReady: vi.fn(),
    onRequestRevision: vi.fn(),
    onAccept: vi.fn(),
    onArchive: vi.fn(),
    onRestore: vi.fn(),
    onUploadDocument: vi.fn(),
    onOpenDocument: vi.fn(),
    onFetchDownloadReference: vi.fn(),
    onPrepareWordPressDraft: vi.fn(),
    onRequestWordPressPublish: vi.fn(),
    onExportGoogleDoc: vi.fn(),
    onOpenReviews: vi.fn(),
    onEditReview: vi.fn(),
    onSaveReview: vi.fn(),
    ...overrides,
  };
}

function getDeliverablesDialog() {
  const dialogs = screen.getAllByRole("dialog", { name: "Deliverables" });
  return dialogs[dialogs.length - 1]!;
}

describe("AiDeliveryDeliverableModal", () => {
  it("opens with the Deliverables accessible dialog name", () => {
    render(<AiDeliveryDeliverableModal {...baseProps()} />);
    expect(getDeliverablesDialog()).toBeTruthy();
  });

  it("renders loading state", () => {
    render(<AiDeliveryDeliverableModal {...baseProps({ loading: true, project: null })} />);
    expect(within(getDeliverablesDialog()).getByText("Loading deliverables")).toBeTruthy();
  });

  it("renders blocked readiness state", () => {
    render(
      <AiDeliveryDeliverableModal
        {...baseProps({
          deliverableReadinessBlockers: ["Linked draft is missing"],
          deliverableHasRecordedReference: false,
        })}
      />,
    );
    const dialog = getDeliverablesDialog();
    expect(within(dialog).getByText("Package completeness summary")).toBeTruthy();
    expect(within(dialog).getByText("Ready-state blockers")).toBeTruthy();
    expect(within(dialog).getByText("Blocked")).toBeTruthy();
    expect(within(dialog).getAllByText(/Linked draft is missing/).length).toBeGreaterThan(0);
  });

  it("renders empty deliverables state", () => {
    render(
      <AiDeliveryDeliverableModal
        {...baseProps({
          deliverables: [],
          visibleDeliverables: [],
          activeDeliverableCount: 0,
          activeDeliverableRecord: null,
          deliverableEditorId: null,
        })}
      />,
    );
    expect(
      within(getDeliverablesDialog()).getByText("No deliverables yet. Package approved assets when ready."),
    ).toBeTruthy();
  });

  it("renders populated deliverables and preserves critical headings", () => {
    render(<AiDeliveryDeliverableModal {...baseProps()} />);
    const dialog = getDeliverablesDialog();
    expect(within(dialog).getByText("Deliverable editor")).toBeTruthy();
    expect(within(dialog).getByText("Existing deliverables")).toBeTruthy();
    expect(within(dialog).getAllByText("Package Alpha").length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText("Private document stored").length).toBeGreaterThan(0);
  });

  it("handles long deliverable titles without rendering storage keys from hasDocument records", () => {
    render(
      <AiDeliveryDeliverableModal
        {...baseProps({
          deliverables: [longTitleDeliverable],
          visibleDeliverables: [longTitleDeliverable],
          activeDeliverableRecord: longTitleDeliverable,
          deliverableEditorId: longTitleDeliverable.id,
        })}
      />,
    );
    const dialog = getDeliverablesDialog();
    expect(within(dialog).getByText(longTitleDeliverable.title)).toBeTruthy();
    expect(within(dialog).queryByText(/sk_|storage\/|private\/objects/i)).toBeNull();
  });

  it("invokes primary and secondary action callbacks", () => {
    const onSaveDeliverable = vi.fn();
    const onMarkReady = vi.fn();
    const onClose = vi.fn();
    render(
      <AiDeliveryDeliverableModal
        {...baseProps({
          onSaveDeliverable,
          onMarkReady,
          onClose,
          activeDeliverableRecord: { ...deliverable, status: "DRAFT" },
          deliverableForm: {
            contentDraftId: "draft-1",
            articleImageId: null,
            title: "Package Alpha",
            description: null,
            deliveryType: "CONTENT_PACKAGE",
            status: "DRAFT",
            exportUrl: null,
            storageKey: null,
            notes: null,
            isArchived: false,
          },
        })}
      />,
    );

    const dialog = getDeliverablesDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Save deliverable" }));
    expect(onSaveDeliverable).toHaveBeenCalledWith("p1");

    fireEvent.click(within(dialog).getAllByRole("button", { name: "Mark ready" })[0]);
    expect(onMarkReady).toHaveBeenCalled();

    fireEvent.click(within(dialog).getAllByRole("button", { name: "Close" })[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("closes via Escape when the modal foundation supports it", () => {
    const onClose = vi.fn();
    render(<AiDeliveryDeliverableModal {...baseProps({ onClose })} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("does not introduce false placeholder actions", () => {
    render(<AiDeliveryDeliverableModal {...baseProps()} />);
    const dialog = getDeliverablesDialog();
    expect(within(dialog).queryByRole("button", { name: /coming soon|todo|placeholder action/i })).toBeNull();
  });

  it("renders error state", () => {
    render(
      <AiDeliveryDeliverableModal
        {...baseProps({ error: "Unable to save deliverable right now." })}
      />,
    );
    const dialog = getDeliverablesDialog();
    expect(within(dialog).getByText("Deliverable action blocked")).toBeTruthy();
    expect(within(dialog).getByText("Unable to save deliverable right now.")).toBeTruthy();
  });

  it("disables save when title is empty", () => {
    render(
      <AiDeliveryDeliverableModal
        {...baseProps({
          deliverableEditorId: null,
          activeDeliverableRecord: null,
          deliverableForm: {
            contentDraftId: null,
            articleImageId: null,
            title: "   ",
            description: null,
            deliveryType: "CONTENT_PACKAGE",
            status: "DRAFT",
            exportUrl: null,
            storageKey: null,
            notes: null,
            isArchived: false,
          },
        })}
      />,
    );
    expect(within(getDeliverablesDialog()).getByRole("button", { name: "Create deliverable" })).toBeDisabled();
  });

  it("returns null when closed", () => {
    const { container } = render(<AiDeliveryDeliverableModal {...baseProps({ isOpen: false })} />);
    expect(container.firstChild).toBeNull();
  });

  it("invokes onOpenReviews when Reviews is clicked", () => {
    const onOpenReviews = vi.fn();
    render(<AiDeliveryDeliverableModal {...baseProps({ onOpenReviews })} />);
    const dialog = getDeliverablesDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Reviews" }));
    expect(onOpenReviews).toHaveBeenCalledWith("p1", "d1");
  });

  it("renders embedded Deliverable reviews panel when selectedReviewDeliverable is set", () => {
    render(
      <AiDeliveryDeliverableModal
        {...baseProps({
          selectedReviewDeliverable: deliverable,
          selectedReviewDeliverableId: deliverable.id,
          deliverableReviews: [],
          deliverableReviewEditorId: null,
          deliverableReviewForm: { status: "NOT_STARTED", reviewerName: "", reviewNotes: "" },
        })}
      />,
    );
    const dialog = getDeliverablesDialog();
    expect(within(dialog).getByText("Deliverable reviews: Package Alpha")).toBeTruthy();
    expect(within(dialog).getByText("Add or update an internal review placeholder for QA tracking.")).toBeTruthy();
    expect(within(dialog).getByText("Review status - Required")).toBeTruthy();
    expect(within(dialog).getByText("Reviewer name - Optional")).toBeTruthy();
    expect(within(dialog).getByText("Review notes / change request - Optional")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Create review placeholder" })).toBeTruthy();
    expect(within(dialog).queryByText("Select Reviews on a deliverable to view or create admin/operator review placeholders.")).toBeNull();
  });

  it("invokes onSaveReview from Create review placeholder and Save review", () => {
    const onSaveReview = vi.fn();
    const existingReview: AiDeliveryDeliverableReviewSummary = {
      id: "rev-1",
      aiDeliveryProjectId: "p1",
      deliverableId: "d1",
      status: "ADMIN_REVIEW",
      reviewerName: "Ops Reviewer",
      reviewNotes: "Check packaging notes",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
    };

    const { rerender } = render(
      <AiDeliveryDeliverableModal
        {...baseProps({
          selectedReviewDeliverable: deliverable,
          selectedReviewDeliverableId: deliverable.id,
          onSaveReview,
          deliverableReviewEditorId: null,
        })}
      />,
    );
    fireEvent.click(within(getDeliverablesDialog()).getByRole("button", { name: "Create review placeholder" }));
    expect(onSaveReview).toHaveBeenCalledWith("p1");

    onSaveReview.mockClear();
    rerender(
      <AiDeliveryDeliverableModal
        {...baseProps({
          selectedReviewDeliverable: deliverable,
          selectedReviewDeliverableId: deliverable.id,
          onSaveReview,
          deliverableReviews: [existingReview],
          deliverableReviewEditorId: existingReview.id,
          deliverableReviewForm: {
            status: existingReview.status,
            reviewerName: existingReview.reviewerName ?? "",
            reviewNotes: existingReview.reviewNotes ?? "",
          },
          latestSelectedReview: existingReview,
        })}
      />,
    );
    fireEvent.click(within(getDeliverablesDialog()).getByRole("button", { name: "Save review" }));
    expect(onSaveReview).toHaveBeenCalledWith("p1");
  });

  it("invokes Request revision and Internal accept callbacks", () => {
    const onRequestRevision = vi.fn();
    const onAccept = vi.fn();
    render(
      <AiDeliveryDeliverableModal
        {...baseProps({
          onRequestRevision,
          onAccept,
          activeDeliverableRecord: deliverable,
          deliverableForm: {
            contentDraftId: "draft-1",
            articleImageId: null,
            title: "Package Alpha",
            description: "Handoff package",
            deliveryType: "CONTENT_PACKAGE",
            status: "READY",
            exportUrl: "https://example.com/export",
            storageKey: null,
            notes: "QA notes",
            isArchived: false,
          },
        })}
      />,
    );
    const dialog = getDeliverablesDialog();
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Request revision" })[0]);
    expect(onRequestRevision).toHaveBeenCalledWith("p1", "d1");
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Internal accept" })[0]);
    expect(onAccept).toHaveBeenCalledWith("p1", "d1");
  });
});
