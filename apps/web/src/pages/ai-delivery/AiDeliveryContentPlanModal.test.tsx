import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import {
  AiDeliveryContentPlanModal,
  type AiDeliveryContentPlanModalProps,
  type AiDeliveryContentPlanItemDraft,
  type AiDeliveryContentPlanWorkflowShell,
} from "./AiDeliveryContentPlanModal";
import type {
  AiDeliveryContentPlanSummary,
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
  brief: { id: "b1", status: "APPROVED", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

const planItemDraft: AiDeliveryContentPlanItemDraft = {
  localId: "item-1",
  title: "Topic Alpha",
  targetKeyword: "seo keyword",
  searchIntent: "informational",
  contentType: "article",
  notes: "Planning notes",
  approvalStatus: "DRAFT",
  clientComment: "",
};

const longItem: AiDeliveryContentPlanItemDraft = {
  ...planItemDraft,
  localId: "item-long",
  title:
    "Extremely long SEO topic title that should wrap safely without breaking the modal layout at narrow widths and without overflowing horizontally",
  targetKeyword: "very-long-keyword-cluster-that-should-wrap-or-truncate-safely-in-narrow-viewports",
};

const plan: AiDeliveryContentPlanSummary = {
  id: "plan-1",
  aiDeliveryProjectId: "p1",
  status: "DRAFT",
  revisionCount: 1,
  reviewRequestedAt: null,
  approvedAt: null,
  items: [
    {
      id: "item-1",
      title: "Topic Alpha",
      targetKeyword: "seo keyword",
      contentType: "article",
      notes: "Planning notes",
      sortOrder: 1,
      approvalStatus: "DRAFT",
      clientComment: null,
    },
  ],
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

const workflowShell: AiDeliveryContentPlanWorkflowShell = {
  readiness: "Create the content plan",
  guidance: "Research, sources, and summaries feed the monthly content plan.",
  researchStep: "Start with manual research requests",
  sourceStep: "Add sources after review",
  summaryStep: "Write an internal research summary",
  planStep: "Create the monthly content plan",
  draftStep: "Generate admin drafts from approved plan items",
  hasResearchRequests: false,
  hasResearchSources: false,
  hasResearchSummaries: false,
  hasPlan: false,
  hasPlanItems: false,
  hasDraftHandOff: false,
  researchCount: 0,
  sourceCount: 0,
  summaryCount: 0,
  planItemCount: 0,
  draftCount: 0,
};

function baseProps(overrides: Partial<AiDeliveryContentPlanModalProps> = {}): AiDeliveryContentPlanModalProps {
  return {
    isOpen: true,
    onClose: vi.fn(),
    project,
    loading: false,
    saving: false,
    busy: false,
    error: null,
    miContextCount: 0,
    plan: null,
    items: [],
    onItemsChange: vi.fn(),
    contentDrafts: [],
    generationMessage: null,
    pdfMessage: null,
    pdfGenerating: false,
    pdfReady: false,
    generatingItemId: null,
    workflowShell,
    formatContentPlanReviewStatus: () => "Draft / preparing",
    formatContentPlanItemApprovalStatus: (v) => v ?? "Planned",
    formatOptionalDate: (v) => v ?? "Not set",
    onCreate: vi.fn(),
    onSave: vi.fn(),
    onRequestReview: vi.fn(),
    onRequestChanges: vi.fn(),
    onApprove: vi.fn(),
    onExportPdf: vi.fn(),
    onDownloadPdf: vi.fn(),
    onGenerateDraft: vi.fn(),
    ...overrides,
  };
}

function getDialog() {
  const dialogs = screen.getAllByRole("dialog", { name: "Monthly SEO / Content Plan" });
  return dialogs[dialogs.length - 1]!;
}

describe("AiDeliveryContentPlanModal", () => {
  it("opens with the Monthly SEO / Content Plan accessible dialog name", () => {
    render(<AiDeliveryContentPlanModal {...baseProps()} />);
    expect(getDialog()).toBeTruthy();
  });

  it("renders loading state", () => {
    render(<AiDeliveryContentPlanModal {...baseProps({ loading: true, project: null })} />);
    expect(within(getDialog()).getByText("Loading content plan")).toBeTruthy();
  });

  it("renders neutral missing-plan empty state", () => {
    render(<AiDeliveryContentPlanModal {...baseProps({ plan: null })} />);
    const dialog = getDialog();
    expect(within(dialog).getByText("No AI SEO content plan yet")).toBeTruthy();
    expect(
      within(dialog).getByText(
        "This project does not have an AI SEO content plan yet. Create or generate a plan to get started.",
      ),
    ).toBeTruthy();
    expect(within(dialog).queryByText(/AI Delivery project was not found/i)).toBeNull();
  });

  it("does not show missing-plan empty and error simultaneously", () => {
    render(
      <AiDeliveryContentPlanModal
        {...baseProps({
          plan: null,
          error: "Unable to save this content plan.",
        })}
      />,
    );
    const dialog = getDialog();
    expect(within(dialog).getByText("No AI SEO content plan yet")).toBeTruthy();
    expect(within(dialog).getByText("Content plan action blocked")).toBeTruthy();
    // Empty create CTA still present; project-not-found must not appear for known project
    expect(within(dialog).queryByText("Project not found.")).toBeNull();
  });

  it("renders actual project-not-found state when project is null after load", () => {
    render(<AiDeliveryContentPlanModal {...baseProps({ project: null, loading: false })} />);
    expect(within(getDialog()).getByText("Project not found.")).toBeTruthy();
    expect(within(getDialog()).queryByText("No AI SEO content plan yet")).toBeNull();
  });

  it("renders unauthorized/forbidden and unexpected error states via error prop", () => {
    const { rerender } = render(
      <AiDeliveryContentPlanModal {...baseProps({ error: "Unauthorized — sign in again." })} />,
    );
    expect(within(getDialog()).getByText("Content plan action blocked")).toBeTruthy();
    expect(within(getDialog()).getByText("Unauthorized — sign in again.")).toBeTruthy();

    rerender(<AiDeliveryContentPlanModal {...baseProps({ error: "Forbidden for this tenant." })} />);
    expect(within(getDialog()).getByText("Forbidden for this tenant.")).toBeTruthy();

    rerender(<AiDeliveryContentPlanModal {...baseProps({ error: "Unexpected content plan failure." })} />);
    expect(within(getDialog()).getByText("Unexpected content plan failure.")).toBeTruthy();
  });

  it("renders populated plan metadata, items, and critical headings", () => {
    render(
      <AiDeliveryContentPlanModal
        {...baseProps({
          plan,
          items: [planItemDraft],
          workflowShell: { ...workflowShell, hasPlan: true, planItemCount: 1, planStep: "Content plan in review" },
          pdfReady: true,
        })}
      />,
    );
    const dialog = getDialog();
    expect(within(dialog).getByText("Workflow readiness")).toBeTruthy();
    expect(within(dialog).getByText(/AI SEO readiness:/)).toBeTruthy();
    expect(within(dialog).getByText("SEO topic/research planning")).toBeTruthy();
    expect(within(dialog).getByText("Monthly plan items")).toBeTruthy();
    expect(within(dialog).getByDisplayValue("Topic Alpha")).toBeTruthy();
    expect(within(dialog).getByText("PDF ready")).toBeTruthy();
  });

  it("handles long topic and keyword values", () => {
    render(
      <AiDeliveryContentPlanModal
        {...baseProps({
          plan: {
            ...plan,
            items: [{ ...plan.items[0]!, id: "item-long", title: longItem.title, targetKeyword: longItem.targetKeyword }],
          },
          items: [longItem],
          workflowShell: { ...workflowShell, hasPlan: true, planItemCount: 1 },
        })}
      />,
    );
    const dialog = getDialog();
    expect(within(dialog).getByDisplayValue(longItem.title)).toBeTruthy();
    expect(within(dialog).getByDisplayValue(longItem.targetKeyword)).toBeTruthy();
    expect(within(dialog).queryByText(/sk_|storage\/|Bearer |token=/i)).toBeNull();
  });

  it("invokes create, save, approval, revision, and export callbacks", () => {
    const onCreate = vi.fn();
    const onSave = vi.fn();
    const onApprove = vi.fn();
    const onRequestChanges = vi.fn();
    const onExportPdf = vi.fn();
    const onDownloadPdf = vi.fn();
    const onClose = vi.fn();

    const { rerender } = render(
      <AiDeliveryContentPlanModal {...baseProps({ plan: null, onCreate, onClose })} />,
    );
    fireEvent.click(within(getDialog()).getByRole("button", { name: "Create content plan" }));
    expect(onCreate).toHaveBeenCalledWith("p1");

    rerender(
      <AiDeliveryContentPlanModal
        {...baseProps({
          plan,
          items: [planItemDraft],
          pdfReady: true,
          onSave,
          onApprove,
          onRequestChanges,
          onExportPdf,
          onDownloadPdf,
          onClose,
          workflowShell: { ...workflowShell, hasPlan: true, planItemCount: 1 },
        })}
      />,
    );
    const dialog = getDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Save draft" }));
    expect(onSave).toHaveBeenCalledWith("p1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Approve plan" }));
    expect(onApprove).toHaveBeenCalledWith("p1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Request changes" }));
    expect(onRequestChanges).toHaveBeenCalledWith("p1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Export PDF" }));
    expect(onExportPdf).toHaveBeenCalledWith("p1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Download PDF" }));
    expect(onDownloadPdf).toHaveBeenCalledWith("p1");
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Close" })[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("invokes onRequestReview when Mark ready for review is clicked", () => {
    const onRequestReview = vi.fn();
    render(
      <AiDeliveryContentPlanModal
        {...baseProps({
          plan,
          items: [planItemDraft],
          onRequestReview,
          workflowShell: { ...workflowShell, hasPlan: true, planItemCount: 1 },
        })}
      />,
    );
    fireEvent.click(within(getDialog()).getByRole("button", { name: "Mark ready for review" }));
    expect(onRequestReview).toHaveBeenCalledWith("p1");
  });

  it("hides download/export controls when no plan exists", () => {
    render(<AiDeliveryContentPlanModal {...baseProps({ plan: null })} />);
    const dialog = getDialog();
    expect(within(dialog).queryByRole("button", { name: "Download PDF" })).toBeNull();
    expect(within(dialog).queryByRole("button", { name: "Export PDF" })).toBeNull();
    expect(within(dialog).getByRole("button", { name: "Create content plan" })).toBeTruthy();
  });

  it("disables download when PDF is not ready and disables save when titles are blank", () => {
    render(
      <AiDeliveryContentPlanModal
        {...baseProps({
          plan,
          items: [{ ...planItemDraft, title: "   " }],
          pdfReady: false,
          workflowShell: { ...workflowShell, hasPlan: true, planItemCount: 1 },
        })}
      />,
    );
    const dialog = getDialog();
    expect(within(dialog).getByRole("button", { name: "Download PDF" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Save draft" })).toBeDisabled();
    expect(within(dialog).getByText("No PDF generated yet")).toBeTruthy();
  });

  it("closes via Escape when the modal foundation supports it", () => {
    const onClose = vi.fn();
    render(<AiDeliveryContentPlanModal {...baseProps({ onClose })} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("does not introduce false placeholder actions", () => {
    render(
      <AiDeliveryContentPlanModal
        {...baseProps({
          plan,
          items: [planItemDraft],
          workflowShell: { ...workflowShell, hasPlan: true, planItemCount: 1 },
        })}
      />,
    );
    expect(within(getDialog()).queryByRole("button", { name: /coming soon|todo|placeholder action/i })).toBeNull();
  });

  it("returns null when closed", () => {
    const { container } = render(<AiDeliveryContentPlanModal {...baseProps({ isOpen: false })} />);
    expect(container.firstChild).toBeNull();
  });
});
