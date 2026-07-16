import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import {
  AiDeliveryResearchModal,
  type AiDeliveryResearchModalProps,
} from "./AiDeliveryResearchModal";
import type {
  AiDeliveryProjectSummary,
  AiDeliveryResearchRequestFormValues,
  AiDeliveryResearchRequestSummary,
  AiDeliveryResearchSourceFormValues,
  AiDeliveryResearchSourceSummary,
  AiDeliveryResearchSummaryFormValues,
  AiDeliveryResearchSummarySummary,
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

const request: AiDeliveryResearchRequestSummary = {
  id: "req-1",
  tenantId: "t1",
  aiDeliveryProjectId: "p1",
  workflowRunId: null,
  workflowRun: null,
  title: "Competitor review request",
  description: "Review top competitors for keyword gaps",
  requestType: "Competitors",
  status: "DRAFT",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

const summary: AiDeliveryResearchSummarySummary = {
  id: "sum-1",
  tenantId: "t1",
  aiDeliveryProjectId: "p1",
  workflowRunId: null,
  workflowRun: null,
  title: "SEO findings summary",
  status: "DRAFT",
  summaryText: "Key research findings for brief revision",
  keyFindings: "Gap in local intent coverage",
  audienceInsights: null,
  competitorInsights: null,
  keywordOpportunities: null,
  contentRecommendations: null,
  briefRevisionNotes: "Clarify target audience in brief",
  sourceNotes: null,
  finalizedAt: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

const source: AiDeliveryResearchSourceSummary = {
  id: "src-1",
  tenantId: "t1",
  aiDeliveryProjectId: "p1",
  researchRequestId: "req-1",
  workflowRunId: null,
  researchRequest: { id: "req-1", title: "Competitor review request", status: "DRAFT" },
  workflowRun: null,
  sourceUrl: "https://example.com/source-page",
  sourceTitle: "Example competitor page",
  sourceType: "WEBSITE",
  status: "PROPOSED",
  reviewNotes: "Useful for positioning notes",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

const emptyRequestForm: AiDeliveryResearchRequestFormValues = {
  workflowRunId: null,
  title: "",
  description: "",
  requestType: "",
  status: "DRAFT",
};

const populatedRequestForm: AiDeliveryResearchRequestFormValues = {
  workflowRunId: null,
  title: "Competitor review request",
  description: "Review top competitors for keyword gaps",
  requestType: "Competitors",
  status: "DRAFT",
};

const emptySummaryForm: AiDeliveryResearchSummaryFormValues = {
  workflowRunId: null,
  title: "",
  status: "DRAFT",
  summaryText: "",
  keyFindings: "",
  audienceInsights: "",
  competitorInsights: "",
  keywordOpportunities: "",
  contentRecommendations: "",
  briefRevisionNotes: "",
  sourceNotes: "",
};

const populatedSummaryForm: AiDeliveryResearchSummaryFormValues = {
  workflowRunId: null,
  title: "SEO findings summary",
  status: "DRAFT",
  summaryText: "Key research findings for brief revision",
  keyFindings: "Gap in local intent coverage",
  audienceInsights: "",
  competitorInsights: "",
  keywordOpportunities: "",
  contentRecommendations: "",
  briefRevisionNotes: "Clarify target audience in brief",
  sourceNotes: "",
};

const emptySourceForm: AiDeliveryResearchSourceFormValues = {
  researchRequestId: null,
  workflowRunId: null,
  sourceUrl: "",
  sourceTitle: "",
  sourceType: "WEBSITE",
  status: "PROPOSED",
  reviewNotes: "",
};

const populatedSourceForm: AiDeliveryResearchSourceFormValues = {
  researchRequestId: "req-1",
  workflowRunId: null,
  sourceUrl: "https://example.com/source-page",
  sourceTitle: "Example competitor page",
  sourceType: "WEBSITE",
  status: "PROPOSED",
  reviewNotes: "Useful for positioning notes",
};

function formatEnumLabel(value?: string | null): string {
  if (!value) return "Not set";
  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/(^|\s)\S/g, (s) => s.toUpperCase());
}

function baseProps(overrides: Partial<AiDeliveryResearchModalProps> = {}): AiDeliveryResearchModalProps {
  return {
    isOpen: true,
    onClose: vi.fn(),
    project,
    loading: false,
    saving: false,
    error: null,
    researchRequests: [],
    researchSummaries: [],
    researchSources: [],
    researchWorkflowRuns: [],
    requestForm: emptyRequestForm,
    onRequestFormChange: vi.fn(),
    requestEditorId: null,
    summaryForm: emptySummaryForm,
    onSummaryFormChange: vi.fn(),
    summaryEditorId: null,
    sourceForm: emptySourceForm,
    onSourceFormChange: vi.fn(),
    sourceEditorId: null,
    formatEnumLabel,
    formatOptionalDate: (value) => (value ? "formatted-date" : "Not set"),
    formatPreview: (value) => ((value ?? "").trim() ? String(value).slice(0, 160) : "Not set"),
    onNewRequest: vi.fn(),
    onSaveRequest: vi.fn(),
    onEditRequest: vi.fn(),
    onNewSummary: vi.fn(),
    onSaveSummary: vi.fn(),
    onEditSummary: vi.fn(),
    onFinalizeSummary: vi.fn(),
    onArchiveSummary: vi.fn(),
    onApplySummaryToBrief: vi.fn(),
    onNewSource: vi.fn(),
    onSaveSource: vi.fn(),
    onEditSource: vi.fn(),
    onApproveSource: vi.fn(),
    onRejectSource: vi.fn(),
    onArchiveSource: vi.fn(),
    ...overrides,
  };
}

function getDialog() {
  const dialogs = screen.getAllByRole("dialog", { name: "Research / Sources" });
  return dialogs[dialogs.length - 1]!;
}

describe("AiDeliveryResearchModal", () => {
  it("opens with the Research / Sources accessible dialog name", () => {
    render(<AiDeliveryResearchModal {...baseProps()} />);
    expect(getDialog()).toBeTruthy();
  });

  it("renders loading state without populated content", () => {
    render(<AiDeliveryResearchModal {...baseProps({ loading: true })} />);
    const dialog = getDialog();
    expect(within(dialog).getByText("Loading research requests and sources")).toBeTruthy();
    expect(within(dialog).queryByText("Research request editor")).toBeNull();
  });

  it("renders empty section states", () => {
    render(<AiDeliveryResearchModal {...baseProps()} />);
    const dialog = getDialog();
    expect(within(dialog).getByText(/No research requests yet\. Add a research request to get started\./)).toBeTruthy();
    expect(
      within(dialog).getByText(/No research summaries yet\. Add a summary after reviewing sources\./),
    ).toBeTruthy();
    expect(within(dialog).getByText(/No research sources yet\. Add a research source to get started\./)).toBeTruthy();
  });

  it("renders project-not-found state", () => {
    render(<AiDeliveryResearchModal {...baseProps({ project: null })} />);
    expect(within(getDialog()).getByText("Project not found.")).toBeTruthy();
  });

  it("renders auth/forbidden and unexpected error states", () => {
    const { rerender } = render(
      <AiDeliveryResearchModal {...baseProps({ error: "Unauthorized: session expired" })} />,
    );
    expect(within(getDialog()).getByText("Research action blocked")).toBeTruthy();
    expect(within(getDialog()).getByText(/Unauthorized/)).toBeTruthy();

    rerender(<AiDeliveryResearchModal {...baseProps({ error: "Forbidden: insufficient permissions" })} />);
    expect(within(getDialog()).getByText(/Forbidden/)).toBeTruthy();

    rerender(<AiDeliveryResearchModal {...baseProps({ error: "Unexpected failure while saving" })} />);
    expect(within(getDialog()).getByText(/Unexpected failure/)).toBeTruthy();
  });

  it("renders critical smoke headings", () => {
    render(<AiDeliveryResearchModal {...baseProps()} />);
    const dialog = getDialog();
    expect(within(dialog).getByRole("heading", { name: "Research request editor" })).toBeTruthy();
    expect(within(dialog).getByRole("heading", { name: "Existing research requests" })).toBeTruthy();
    expect(within(dialog).getByRole("heading", { name: "Research summary editor" })).toBeTruthy();
    expect(within(dialog).getByRole("heading", { name: "Existing research summaries" })).toBeTruthy();
    expect(within(dialog).getByRole("heading", { name: "Research source editor" })).toBeTruthy();
    expect(within(dialog).getByRole("heading", { name: "Existing research sources" })).toBeTruthy();
  });

  it("renders populated request, summary, and source content", () => {
    render(
      <AiDeliveryResearchModal
        {...baseProps({
          requestForm: populatedRequestForm,
          requestEditorId: request.id,
          summaryForm: populatedSummaryForm,
          summaryEditorId: summary.id,
          sourceForm: populatedSourceForm,
          sourceEditorId: source.id,
          researchRequests: [request],
          researchSummaries: [summary],
          researchSources: [source],
        })}
      />,
    );
    const dialog = getDialog();
    expect(within(dialog).getAllByDisplayValue("Competitor review request").length).toBeGreaterThan(0);
    expect(within(dialog).getByDisplayValue("SEO findings summary")).toBeTruthy();
    expect(within(dialog).getByDisplayValue("https://example.com/source-page")).toBeTruthy();
    expect(within(dialog).getByText("Example competitor page")).toBeTruthy();
    expect(within(dialog).getAllByText("Key research findings for brief revision").length).toBeGreaterThan(0);
    expect(within(dialog).getByRole("button", { name: "Apply to brief notes" })).toBeTruthy();
  });

  it("invokes apply-to-brief callback", () => {
    const onApplySummaryToBrief = vi.fn();
    render(
      <AiDeliveryResearchModal
        {...baseProps({
          researchSummaries: [summary],
          onApplySummaryToBrief,
        })}
      />,
    );
    fireEvent.click(within(getDialog()).getByRole("button", { name: "Apply to brief notes" }));
    expect(onApplySummaryToBrief).toHaveBeenCalledWith("p1", "sum-1");
  });

  it("invokes save callbacks for request, summary, and source", () => {
    const onSaveRequest = vi.fn();
    const onSaveSummary = vi.fn();
    const onSaveSource = vi.fn();
    render(
      <AiDeliveryResearchModal
        {...baseProps({
          requestForm: populatedRequestForm,
          summaryForm: populatedSummaryForm,
          sourceForm: populatedSourceForm,
          onSaveRequest,
          onSaveSummary,
          onSaveSource,
        })}
      />,
    );
    const dialog = getDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Create request" }));
    expect(onSaveRequest).toHaveBeenCalledWith("p1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Create summary" }));
    expect(onSaveSummary).toHaveBeenCalledWith("p1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Create source" }));
    expect(onSaveSource).toHaveBeenCalledWith("p1");
  });

  it("invokes edit, finalize, archive, approve, and reject callbacks", () => {
    const onEditRequest = vi.fn();
    const onEditSummary = vi.fn();
    const onFinalizeSummary = vi.fn();
    const onArchiveSummary = vi.fn();
    const onEditSource = vi.fn();
    const onApproveSource = vi.fn();
    const onRejectSource = vi.fn();
    const onArchiveSource = vi.fn();
    render(
      <AiDeliveryResearchModal
        {...baseProps({
          researchRequests: [request],
          researchSummaries: [summary],
          researchSources: [source],
          onEditRequest,
          onEditSummary,
          onFinalizeSummary,
          onArchiveSummary,
          onEditSource,
          onApproveSource,
          onRejectSource,
          onArchiveSource,
        })}
      />,
    );
    const dialog = getDialog();
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Edit" })[0]!);
    expect(onEditRequest).toHaveBeenCalledWith(request);
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Edit" })[1]!);
    expect(onEditSummary).toHaveBeenCalledWith(summary);
    fireEvent.click(within(dialog).getByRole("button", { name: "Finalize" }));
    expect(onFinalizeSummary).toHaveBeenCalledWith("p1", summary);
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Archive" })[0]!);
    expect(onArchiveSummary).toHaveBeenCalledWith("p1", summary);
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Edit" })[2]!);
    expect(onEditSource).toHaveBeenCalledWith(source);
    fireEvent.click(within(dialog).getByRole("button", { name: "Approve" }));
    expect(onApproveSource).toHaveBeenCalledWith("p1", source);
    fireEvent.click(within(dialog).getByRole("button", { name: "Reject" }));
    expect(onRejectSource).toHaveBeenCalledWith("p1", source);
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Archive" })[1]!);
    expect(onArchiveSource).toHaveBeenCalledWith("p1", source);
  });

  it("invokes close and new-entity actions; Escape closes via modal foundation", () => {
    const onClose = vi.fn();
    const onNewRequest = vi.fn();
    const onNewSummary = vi.fn();
    const onNewSource = vi.fn();
    render(
      <AiDeliveryResearchModal {...baseProps({ onClose, onNewRequest, onNewSummary, onNewSource })} />,
    );
    const dialog = getDialog();
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Close" })[0]!);
    expect(onClose).toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "New request" }));
    expect(onNewRequest).toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "New summary" }));
    expect(onNewSummary).toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "New source" }));
    expect(onNewSource).toHaveBeenCalled();

    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("does not render secrets or credential-like strings", () => {
    render(
      <AiDeliveryResearchModal
        {...baseProps({
          researchRequests: [request],
          researchSummaries: [summary],
          researchSources: [source],
          error: "Research action blocked for this project",
        })}
      />,
    );
    const dialog = getDialog();
    expect(within(dialog).queryByText(/sk-|Bearer |OPENAI|api[_-]?key|password|secret/i)).toBeNull();
  });

  it("does not show loading and populated states simultaneously", () => {
    render(
      <AiDeliveryResearchModal
        {...baseProps({
          loading: true,
          requestForm: populatedRequestForm,
          researchRequests: [request],
          researchSummaries: [summary],
          researchSources: [source],
        })}
      />,
    );
    const dialog = getDialog();
    expect(within(dialog).getByText("Loading research requests and sources")).toBeTruthy();
    expect(within(dialog).queryByText("Research request editor")).toBeNull();
    expect(within(dialog).queryByText("Competitor review request")).toBeNull();
  });

  it("disables primary actions while saving", () => {
    render(
      <AiDeliveryResearchModal
        {...baseProps({
          saving: true,
          requestForm: populatedRequestForm,
          summaryForm: populatedSummaryForm,
          sourceForm: populatedSourceForm,
          researchSummaries: [summary],
          researchSources: [source],
        })}
      />,
    );
    const dialog = getDialog();
    expect(within(dialog).getAllByRole("button", { name: "Saving" }).length).toBeGreaterThan(0);
    expect(within(dialog).getAllByRole("button", { name: "Close" })[0]).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "New request" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Apply to brief notes" })).toBeDisabled();
  });
});
