import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import {
  AiDeliveryImageApprovalModal,
  type AiDeliveryImageApprovalModalProps,
} from "./AiDeliveryImageApprovalModal";
import type {
  AiDeliveryArticleImageFormValues,
  AiDeliveryArticleImageSummary,
  AiDeliveryContentDraftSummary,
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
  plannedContentScopeNotes: "Scope notes",
  isArchived: false,
  brief: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

const draft: AiDeliveryContentDraftSummary = {
  id: "draft-1",
  aiDeliveryProjectId: "p1",
  contentPlanItemId: null,
  contentPlanItem: null,
  title: "Approved Draft Alpha",
  slug: "approved-draft-alpha",
  draftBody: "Body content",
  status: "APPROVED",
  notes: null,
  reviewRequestedAt: null,
  approvedAt: "2026-06-01T00:00:00.000Z",
  revisionCount: 0,
  clientComment: null,
  isArchived: false,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

const image: AiDeliveryArticleImageSummary = {
  id: "img-1",
  aiDeliveryProjectId: "p1",
  contentDraftId: "draft-1",
  contentDraft: { id: "draft-1", title: "Approved Draft Alpha" },
  title: "Hero Image Alpha",
  prompt: "Create a professional hero image for the article",
  styleNotes: "Clean and modern",
  status: "DRAFT",
  previewImageUrl: "https://example.com/preview.png",
  finalImageUrl: "https://example.com/final.png",
  hasDocument: true,
  notes: "Admin notes",
  isArchived: false,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

const emptyForm: AiDeliveryArticleImageFormValues = {
  contentDraftId: "",
  title: "",
  prompt: "",
  styleNotes: "",
  status: "DRAFT",
  previewImageUrl: "",
  finalImageUrl: "",
  storageKey: "",
  notes: "",
};

const populatedForm: AiDeliveryArticleImageFormValues = {
  contentDraftId: "draft-1",
  title: "Hero Image Alpha",
  prompt: "Create a professional hero image for the article",
  styleNotes: "Clean and modern",
  status: "DRAFT",
  previewImageUrl: "https://example.com/preview.png",
  finalImageUrl: "https://example.com/final.png",
  storageKey: "",
  notes: "Admin notes",
};

function formatArticleImageStatus(value?: string | null): string {
  if (!value || value === "DRAFT") return "Draft";
  if (value === "READY_FOR_GENERATION") return "Ready for generation";
  if (value === "PREVIEW_READY") return "Preview ready";
  if (value === "CHANGES_REQUESTED") return "Changes requested";
  if (value === "APPROVED") return "Approved";
  if (value === "FINAL_READY") return "Final ready";
  if (value === "ARCHIVED") return "Archived";
  return value ?? "Not set";
}

function baseProps(overrides: Partial<AiDeliveryImageApprovalModalProps> = {}): AiDeliveryImageApprovalModalProps {
  return {
    isOpen: true,
    onClose: vi.fn(),
    project,
    loading: false,
    saving: false,
    error: null,
    actionGuidance: "Add an image request after a content draft is ready.",
    articleImages: [],
    articleImageDrafts: [draft],
    form: emptyForm,
    onFormChange: vi.fn(),
    editorId: null,
    activeRecord: null,
    finalAssetFiles: {},
    onFinalAssetFilesChange: vi.fn(),
    uploadTargetId: null,
    downloadTargetId: null,
    downloadRefLoading: false,
    downloadRefError: null,
    downloadRef: null,
    formatArticleImageStatus,
    formatContentDraftStatus: (value) => value ?? "Not set",
    formatOptionalDate: (value) => (value ? "formatted-date" : "Not set"),
    onNewImageRequest: vi.fn(),
    onSave: vi.fn(),
    onEdit: vi.fn(),
    onArchive: vi.fn(),
    onMarkPreviewReady: vi.fn(),
    onRequestChanges: vi.fn(),
    onApprove: vi.fn(),
    onMarkFinalReady: vi.fn(),
    onUploadFinalAsset: vi.fn(),
    onOpenPrivateFinalAsset: vi.fn(),
    onFetchDownloadReference: vi.fn(),
    onHandoffToDeliverables: vi.fn(),
    ...overrides,
  };
}

function getDialog() {
  const dialogs = screen.getAllByRole("dialog", { name: "Image Production Planning" });
  return dialogs[dialogs.length - 1]!;
}

describe("AiDeliveryImageApprovalModal", () => {
  it("opens with the Image Production Planning accessible dialog name", () => {
    render(<AiDeliveryImageApprovalModal {...baseProps()} />);
    expect(getDialog()).toBeTruthy();
  });

  it("renders loading state without populated content", () => {
    render(<AiDeliveryImageApprovalModal {...baseProps({ loading: true })} />);
    const dialog = getDialog();
    expect(within(dialog).getByText("Loading article image requests")).toBeTruthy();
    expect(within(dialog).queryByText("Image planning workflow")).toBeNull();
  });

  it("renders empty/no-image list state", () => {
    render(<AiDeliveryImageApprovalModal {...baseProps({ articleImages: [] })} />);
    expect(
      within(getDialog()).getByText(
        /No article image records yet\. Add an image request after a content draft is ready\./,
      ),
    ).toBeTruthy();
  });

  it("renders project-not-found state", () => {
    render(<AiDeliveryImageApprovalModal {...baseProps({ project: null })} />);
    expect(within(getDialog()).getByText("Project not found.")).toBeTruthy();
  });

  it("renders auth/forbidden and unexpected error states", () => {
    const { rerender } = render(
      <AiDeliveryImageApprovalModal {...baseProps({ error: "Unauthorized: session expired" })} />,
    );
    expect(within(getDialog()).getByText("Article image action blocked")).toBeTruthy();
    expect(within(getDialog()).getByText(/Unauthorized/)).toBeTruthy();

    rerender(<AiDeliveryImageApprovalModal {...baseProps({ error: "Forbidden: insufficient permissions" })} />);
    expect(within(getDialog()).getByText(/Forbidden/)).toBeTruthy();

    rerender(<AiDeliveryImageApprovalModal {...baseProps({ error: "Unexpected failure while saving" })} />);
    expect(within(getDialog()).getByText(/Unexpected failure/)).toBeTruthy();
  });

  it("renders populated image fields and critical labels", () => {
    render(
      <AiDeliveryImageApprovalModal
        {...baseProps({
          form: populatedForm,
          editorId: image.id,
          activeRecord: image,
          articleImages: [image],
        })}
      />,
    );
    const dialog = getDialog();
    expect(within(dialog).getByText("Linked content draft - Required")).toBeTruthy();
    expect(within(dialog).getByText("Status - Required")).toBeTruthy();
    expect(within(dialog).getByText("Title - Required")).toBeTruthy();
    expect(within(dialog).getByText("Prompt - Required")).toBeTruthy();
    expect(within(dialog).getByText("Style notes - Optional")).toBeTruthy();
    expect(within(dialog).getByText("Preview image URL - Optional")).toBeTruthy();
    expect(within(dialog).getByText("Final image URL - Optional")).toBeTruthy();
    expect(within(dialog).getByText("Storage key reference - Optional")).toBeTruthy();
    expect(within(dialog).getByText("Notes - Optional")).toBeTruthy();
    expect(within(dialog).getByDisplayValue("Hero Image Alpha")).toBeTruthy();
    expect(within(dialog).getByDisplayValue("Create a professional hero image for the article")).toBeTruthy();
    expect(within(dialog).getByText("Current image status")).toBeTruthy();
    expect(within(dialog).getByText("Packaging handoff")).toBeTruthy();
    expect(within(dialog).getByText("Existing image production records")).toBeTruthy();
    expect(
      within(dialog).getByText(
        /Hand off to deliverable packaging when linked draft and final references are ready/,
      ),
    ).toBeTruthy();
    expect(within(dialog).getAllByText("Private final asset stored").length).toBeGreaterThan(0);
    expect(within(dialog).queryByText(/alt text/i)).toBeNull();
  });

  it("invokes form change when title is edited", () => {
    const onFormChange = vi.fn();
    render(
      <AiDeliveryImageApprovalModal {...baseProps({ onFormChange, form: populatedForm })} />,
    );
    const titleInput = within(getDialog()).getByDisplayValue("Hero Image Alpha");
    fireEvent.change(titleInput, { target: { value: "Updated Image Title" } });
    expect(onFormChange).toHaveBeenCalled();
  });

  it("invokes save callback and disables while saving", () => {
    const onSave = vi.fn();
    const { rerender } = render(
      <AiDeliveryImageApprovalModal
        {...baseProps({
          onSave,
          form: populatedForm,
        })}
      />,
    );
    fireEvent.click(within(getDialog()).getByRole("button", { name: "Create image request" }));
    expect(onSave).toHaveBeenCalledWith("p1");

    rerender(
      <AiDeliveryImageApprovalModal
        {...baseProps({
          saving: true,
          form: populatedForm,
        })}
      />,
    );
    expect(within(getDialog()).getByRole("button", { name: "Saving" })).toBeDisabled();
  });

  it("invokes mark preview, request changes, approve, final ready, archive, and handoff", () => {
    const onMarkPreviewReady = vi.fn();
    const onRequestChanges = vi.fn();
    const onApprove = vi.fn();
    const onMarkFinalReady = vi.fn();
    const onArchive = vi.fn();
    const onHandoffToDeliverables = vi.fn();
    const onEdit = vi.fn();
    render(
      <AiDeliveryImageApprovalModal
        {...baseProps({
          form: populatedForm,
          editorId: image.id,
          activeRecord: image,
          articleImages: [image],
          onMarkPreviewReady,
          onRequestChanges,
          onApprove,
          onMarkFinalReady,
          onArchive,
          onHandoffToDeliverables,
          onEdit,
        })}
      />,
    );
    const dialog = getDialog();
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Mark preview ready" })[0]!);
    expect(onMarkPreviewReady).toHaveBeenCalledWith("p1", "img-1");
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Request changes" })[0]!);
    expect(onRequestChanges).toHaveBeenCalledWith("p1", "img-1");
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Approve image" })[0]!);
    expect(onApprove).toHaveBeenCalledWith("p1", "img-1");
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Mark final ready" })[0]!);
    expect(onMarkFinalReady).toHaveBeenCalledWith("p1", "img-1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Archive" }));
    expect(onArchive).toHaveBeenCalledWith("p1", "img-1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Open deliverable packaging" }));
    expect(onHandoffToDeliverables).toHaveBeenCalledWith("p1", image);
    fireEvent.click(within(dialog).getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith(image);
  });

  it("does not render raw storage keys from hasDocument records or secrets", () => {
    const secretKey = "private/tenant/secret-storage-key-abc123";
    render(
      <AiDeliveryImageApprovalModal
        {...baseProps({
          form: { ...populatedForm, storageKey: secretKey },
          editorId: image.id,
          activeRecord: image,
          articleImages: [image],
        })}
      />,
    );
    const dialog = getDialog();
    expect(within(dialog).queryByText(secretKey)).toBeNull();
    expect(within(dialog).queryByText(/sk-|Bearer |OPENAI|api[_-]?key/i)).toBeNull();
    expect(within(dialog).getAllByText("Private final asset stored").length).toBeGreaterThan(0);
    expect(within(dialog).queryByRole("button", { name: /Generate/i })).toBeNull();
    expect(within(dialog).queryByText(/rejection reason/i)).toBeNull();
  });

  it("invokes close and new image request; Escape closes via modal foundation", () => {
    const onClose = vi.fn();
    const onNewImageRequest = vi.fn();
    render(<AiDeliveryImageApprovalModal {...baseProps({ onClose, onNewImageRequest })} />);
    const dialog = getDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "New image request" }));
    expect(onNewImageRequest).toHaveBeenCalled();

    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("does not show loading and populated states simultaneously", () => {
    render(
      <AiDeliveryImageApprovalModal
        {...baseProps({
          loading: true,
          form: populatedForm,
          articleImages: [image],
          activeRecord: image,
        })}
      />,
    );
    const dialog = getDialog();
    expect(within(dialog).getByText("Loading article image requests")).toBeTruthy();
    expect(within(dialog).queryByText("Image planning workflow")).toBeNull();
    expect(within(dialog).queryByText("Hero Image Alpha")).toBeNull();
  });

  it("disables primary actions while saving", () => {
    render(
      <AiDeliveryImageApprovalModal
        {...baseProps({
          saving: true,
          form: populatedForm,
          editorId: image.id,
          activeRecord: image,
          articleImages: [image],
        })}
      />,
    );
    const dialog = getDialog();
    expect(within(dialog).getByRole("button", { name: "Saving" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "New image request" })).toBeDisabled();
    expect(within(dialog).getAllByRole("button", { name: "Mark preview ready" })[0]).toBeDisabled();
  });
});
