import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import {
  AiDeliveryContentDraftModal,
  type AiDeliveryContentDraftModalProps,
} from "./AiDeliveryContentDraftModal";
import type {
  AiDeliveryContentDraftFormValues,
  AiDeliveryContentDraftSummary,
  AiDeliveryContentPlanItemSummary,
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

const planItem: AiDeliveryContentPlanItemSummary = {
  id: "item-1",
  title: "Topic Alpha",
  targetKeyword: "alpha keyword",
  contentType: "article",
  notes: "Plan notes",
  sortOrder: 1,
  approvalStatus: "CLIENT_APPROVED",
  clientComment: null,
};

const draft: AiDeliveryContentDraftSummary = {
  id: "d1",
  aiDeliveryProjectId: "p1",
  contentPlanItemId: "item-1",
  contentPlanItem: { id: "item-1", title: "Topic Alpha", sortOrder: 1 },
  title: "Draft Title Alpha",
  slug: "draft-title-alpha",
  draftBody: "Body content for the article draft.",
  status: "DRAFT",
  notes: "Admin notes here",
  reviewRequestedAt: null,
  approvedAt: null,
  revisionCount: 0,
  clientComment: null,
  isArchived: false,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

const emptyForm: AiDeliveryContentDraftFormValues = {
  contentPlanItemId: null,
  title: "",
  slug: "",
  draftBody: "",
  status: "DRAFT",
  notes: "",
};

const populatedForm: AiDeliveryContentDraftFormValues = {
  contentPlanItemId: "item-1",
  title: "Draft Title Alpha",
  slug: "draft-title-alpha",
  draftBody: "Body content for the article draft.",
  status: "DRAFT",
  notes: "Admin notes here",
};

function baseProps(overrides: Partial<AiDeliveryContentDraftModalProps> = {}): AiDeliveryContentDraftModalProps {
  return {
    isOpen: true,
    onClose: vi.fn(),
    project,
    loading: false,
    saving: false,
    error: null,
    handoffMessage: null,
    actionGuidance: "Mark ready for review only after the draft has both a title and body.",
    contentDrafts: [],
    eligiblePlanItems: [planItem],
    form: emptyForm,
    onFormChange: vi.fn(),
    editorId: null,
    activeRecord: null,
    linkedImages: [],
    linkedDeliverables: [],
    activeArticleImageCount: 0,
    activeDeliverableCount: 0,
    editorLinkedPlanLabel: "Unlinked draft (local-only state)",
    saveStateLabel: "New empty draft",
    reviewReadiness: { ready: false, message: "Add a title before moving this draft through admin review." },
    canSave: false,
    canMarkReady: false,
    canReturn: false,
    primaryActionLabel: "Create production record",
    formatContentDraftStatus: (value) => {
      if (!value || value === "DRAFT") return "Draft / preparing";
      if (value === "READY_FOR_REVIEW") return "Ready for review";
      if (value === "CHANGES_REQUESTED") return "Changes requested";
      if (value === "ARCHIVED") return "Archived";
      return value ?? "Not set";
    },
    formatContentPlanItemApprovalStatus: (value) => {
      if (!value || value === "DRAFT") return "Planned";
      if (value === "CLIENT_APPROVED") return "Approved";
      return value ?? "Not set";
    },
    formatOptionalDate: (value) => (value ? "formatted-date" : "Not set"),
    formatPreview: (value) => ((value ?? "").trim() ? String(value).slice(0, 160) : "Not set"),
    formatStatusBreakdown: (items, fallback = "No records") =>
      items.length === 0 ? fallback : items.map((i) => i.status).join(", "),
    onNewDraft: vi.fn(),
    onSave: vi.fn(),
    onStartFromPlanItem: vi.fn(),
    onEdit: vi.fn(),
    onArchive: vi.fn(),
    onRequestReview: vi.fn(),
    onReturnToDraft: vi.fn(),
    onHandoffToImages: vi.fn(),
    onHandoffToDeliverables: vi.fn(),
    ...overrides,
  };
}

function getDialog() {
  const dialogs = screen.getAllByRole("dialog", { name: "AI Content Production" });
  return dialogs[dialogs.length - 1]!;
}

describe("AiDeliveryContentDraftModal", () => {
  it("opens with the AI Content Production accessible dialog name", () => {
    render(<AiDeliveryContentDraftModal {...baseProps()} />);
    expect(getDialog()).toBeTruthy();
  });

  it("renders loading state without populated content", () => {
    render(<AiDeliveryContentDraftModal {...baseProps({ loading: true })} />);
    const dialog = getDialog();
    expect(within(dialog).getByText("Loading content drafts")).toBeTruthy();
    expect(within(dialog).queryByText("Article production planning")).toBeNull();
  });

  it("renders empty/no-draft list state", () => {
    render(<AiDeliveryContentDraftModal {...baseProps({ contentDrafts: [] })} />);
    expect(
      within(getDialog()).getByText(
        /No content drafts yet\. Approve or select a plan item above, then generate the first linked draft for admin editing\./,
      ),
    ).toBeTruthy();
  });

  it("renders project-not-found state", () => {
    render(<AiDeliveryContentDraftModal {...baseProps({ project: null })} />);
    expect(within(getDialog()).getByText("Project not found.")).toBeTruthy();
  });

  it("renders auth/forbidden and unexpected error states", () => {
    const { rerender } = render(
      <AiDeliveryContentDraftModal {...baseProps({ error: "Unauthorized: session expired" })} />,
    );
    expect(within(getDialog()).getByText("Content draft action blocked")).toBeTruthy();
    expect(within(getDialog()).getByText(/Unauthorized/)).toBeTruthy();

    rerender(<AiDeliveryContentDraftModal {...baseProps({ error: "Forbidden: insufficient permissions" })} />);
    expect(within(getDialog()).getByText(/Forbidden/)).toBeTruthy();

    rerender(<AiDeliveryContentDraftModal {...baseProps({ error: "Unexpected failure while saving" })} />);
    expect(within(getDialog()).getByText(/Unexpected failure/)).toBeTruthy();
  });

  it("renders populated draft fields and critical labels", () => {
    render(
      <AiDeliveryContentDraftModal
        {...baseProps({
          form: populatedForm,
          editorId: draft.id,
          activeRecord: draft,
          contentDrafts: [draft],
          canSave: true,
          primaryActionLabel: "Save draft",
          editorLinkedPlanLabel: "1. Topic Alpha",
          saveStateLabel: "Saved",
          reviewReadiness: { ready: true, message: "Ready" },
        })}
      />,
    );
    const dialog = getDialog();
    expect(within(dialog).getByText("Title - Required")).toBeTruthy();
    expect(within(dialog).getByText("Slug - Optional")).toBeTruthy();
    expect(within(dialog).getByText("Draft body - Required before client review")).toBeTruthy();
    expect(within(dialog).getByText("Review / admin notes - Optional")).toBeTruthy();
    expect(within(dialog).getByText("Status - Required")).toBeTruthy();
    expect(within(dialog).getByText("Linked SEO topic / monthly content plan item - Optional")).toBeTruthy();
    expect(within(dialog).getByDisplayValue("Draft Title Alpha")).toBeTruthy();
    expect(within(dialog).getByDisplayValue("draft-title-alpha")).toBeTruthy();
    expect(within(dialog).getByDisplayValue("Body content for the article draft.")).toBeTruthy();
    expect(within(dialog).getByText("Current draft status")).toBeTruthy();
    expect(within(dialog).getByText("Completion and export handoff")).toBeTruthy();
    expect(within(dialog).getByText(/Internal admin handoff/)).toBeTruthy();
  });

  it("renders linked content-plan context", () => {
    render(<AiDeliveryContentDraftModal {...baseProps()} />);
    const dialog = getDialog();
    expect(within(dialog).getByText("Approved / planned content plan items")).toBeTruthy();
    expect(within(dialog).getByText("1. Topic Alpha")).toBeTruthy();
    expect(within(dialog).getByText("Target keyword: alpha keyword")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Create linked draft" })).toBeTruthy();
  });

  it("invokes form change when title is edited", () => {
    const onFormChange = vi.fn();
    render(<AiDeliveryContentDraftModal {...baseProps({ onFormChange, form: populatedForm, canSave: true })} />);
    const titleInput = within(getDialog()).getByDisplayValue("Draft Title Alpha");
    fireEvent.change(titleInput, { target: { value: "Updated Title" } });
    expect(onFormChange).toHaveBeenCalled();
  });

  it("invokes save callback and disables while saving", () => {
    const onSave = vi.fn();
    const { rerender } = render(
      <AiDeliveryContentDraftModal
        {...baseProps({
          onSave,
          canSave: true,
          form: populatedForm,
          primaryActionLabel: "Create production record",
        })}
      />,
    );
    fireEvent.click(within(getDialog()).getByRole("button", { name: "Create production record" }));
    expect(onSave).toHaveBeenCalledWith("p1");

    rerender(
      <AiDeliveryContentDraftModal
        {...baseProps({
          saving: true,
          canSave: true,
          form: populatedForm,
          primaryActionLabel: "Create production record",
        })}
      />,
    );
    expect(within(getDialog()).getByRole("button", { name: "Saving" })).toBeDisabled();
  });

  it("invokes generate-adjacent create linked draft and edit callbacks", () => {
    const onStartFromPlanItem = vi.fn();
    const onEdit = vi.fn();
    render(
      <AiDeliveryContentDraftModal
        {...baseProps({
          onStartFromPlanItem,
          onEdit,
          contentDrafts: [draft],
        })}
      />,
    );
    fireEvent.click(within(getDialog()).getByRole("button", { name: "Edit linked draft" }));
    expect(onStartFromPlanItem).toHaveBeenCalledWith(planItem);

    fireEvent.click(within(getDialog()).getAllByRole("button", { name: "Edit" })[0]!);
    expect(onEdit).toHaveBeenCalledWith(draft);
  });

  it("invokes mark ready, return to draft, archive, and handoff callbacks", () => {
    const onRequestReview = vi.fn();
    const onReturnToDraft = vi.fn();
    const onArchive = vi.fn();
    const onHandoffToImages = vi.fn();
    const onHandoffToDeliverables = vi.fn();
    const readyDraft: AiDeliveryContentDraftSummary = {
      ...draft,
      status: "READY_FOR_REVIEW",
    };
    render(
      <AiDeliveryContentDraftModal
        {...baseProps({
          form: { ...populatedForm, status: "READY_FOR_REVIEW" },
          editorId: readyDraft.id,
          activeRecord: readyDraft,
          contentDrafts: [readyDraft],
          canMarkReady: true,
          canReturn: true,
          canSave: true,
          reviewReadiness: { ready: true, message: "Ready" },
          onRequestReview,
          onReturnToDraft,
          onArchive,
          onHandoffToImages,
          onHandoffToDeliverables,
        })}
      />,
    );
    const dialog = getDialog();
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Mark ready for review" })[0]!);
    expect(onRequestReview).toHaveBeenCalledWith("p1", "d1");
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Return to draft" })[0]!);
    expect(onReturnToDraft).toHaveBeenCalledWith("p1", "d1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Archive" }));
    expect(onArchive).toHaveBeenCalledWith("p1", "d1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Open image planning" }));
    expect(onHandoffToImages).toHaveBeenCalledWith("p1", "d1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Open deliverable packaging" }));
    expect(onHandoffToDeliverables).toHaveBeenCalledWith("p1", "d1");
  });

  it("does not render generate/regenerate or version-history controls in this modal", () => {
    render(
      <AiDeliveryContentDraftModal
        {...baseProps({
          form: populatedForm,
          editorId: draft.id,
          activeRecord: draft,
          contentDrafts: [draft],
        })}
      />,
    );
    const dialog = getDialog();
    expect(within(dialog).queryByRole("button", { name: /Generate admin draft/i })).toBeNull();
    expect(within(dialog).queryByRole("button", { name: /Regenerate/i })).toBeNull();
    expect(within(dialog).queryByText(/version history/i)).toBeNull();
    expect(within(dialog).queryByText(/storageKey|provider|api[_-]?key|prompt payload/i)).toBeNull();
  });

  it("preserves review readiness message and disables mark-ready when not ready", () => {
    render(
      <AiDeliveryContentDraftModal
        {...baseProps({
          form: populatedForm,
          editorId: draft.id,
          activeRecord: draft,
          contentDrafts: [draft],
          canMarkReady: false,
          reviewReadiness: {
            ready: false,
            message: "Save the current draft edits before using the review transition.",
          },
        })}
      />,
    );
    const dialog = getDialog();
    expect(within(dialog).getByText("Save the current draft edits before using the review transition.")).toBeTruthy();
    expect(within(dialog).getAllByRole("button", { name: "Mark ready for review" })[0]).toBeDisabled();
  });

  it("handles long title and body without exposing secrets", () => {
    const longTitle = `Long title ${"x".repeat(200)}`;
    const longBody = `Long body ${"y".repeat(500)}`;
    render(
      <AiDeliveryContentDraftModal
        {...baseProps({
          form: { ...populatedForm, title: longTitle, draftBody: longBody },
          canSave: true,
          contentDrafts: [{ ...draft, title: longTitle, draftBody: longBody }],
        })}
      />,
    );
    const dialog = getDialog();
    const titleInput = within(dialog).getByPlaceholderText("Working article title or draft headline") as HTMLInputElement;
    expect(titleInput.value).toContain("Long title");
    expect(within(dialog).queryByText(/sk-|Bearer |OPENAI|prompt:/i)).toBeNull();
  });

  it("invokes close and new draft; Escape closes via modal foundation", () => {
    const onClose = vi.fn();
    const onNewDraft = vi.fn();
    render(<AiDeliveryContentDraftModal {...baseProps({ onClose, onNewDraft })} />);
    const dialog = getDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "New draft" }));
    expect(onNewDraft).toHaveBeenCalled();

    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("does not show loading and populated states simultaneously", () => {
    render(
      <AiDeliveryContentDraftModal
        {...baseProps({
          loading: true,
          form: populatedForm,
          contentDrafts: [draft],
          activeRecord: draft,
        })}
      />,
    );
    const dialog = getDialog();
    expect(within(dialog).getByText("Loading content drafts")).toBeTruthy();
    expect(within(dialog).queryByText("Article production planning")).toBeNull();
    expect(within(dialog).queryByText("Draft Title Alpha")).toBeNull();
  });
});
