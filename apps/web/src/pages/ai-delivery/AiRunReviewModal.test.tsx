import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { AiRunReviewModal } from "./AiRunReviewModal";
import type { AiDeliveryProjectSummary, AiDeliveryWorkflowRunSummary } from "./AiDeliveryPage";

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

const run: AiDeliveryWorkflowRunSummary = {
  id: "run-1",
  tenantId: "t1",
  aiDeliveryProjectId: "p1",
  status: "REVIEW",
  adminNotes: "notes",
  resultPlaceholder: '{"summary":"ok"}',
  executionLog: "step 1 complete",
  executionError: null,
  startedAt: null,
  finishedAt: null,
  createdAt: "2026-06-02T00:00:00.000Z",
  updatedAt: "2026-06-02T01:00:00.000Z",
  brief: null,
};

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  project,
  loading: false,
  saving: false,
  executingId: null,
  error: null,
  runs: [run],
  selectedRunId: "run-1",
  form: { status: "REVIEW", adminNotes: "notes", resultPlaceholder: '{"summary":"ok"}' },
  onFormChange: vi.fn(),
  onSelectRun: vi.fn(),
  onClearSelection: vi.fn(),
  onSave: vi.fn(),
  onExecute: vi.fn(),
  canSave: true,
  statusOptions: ["REVIEW", "COMPLETED"],
  statusLabels: { REVIEW: "Needs review", COMPLETED: "Completed" },
  statusHelper: "Allowed next status: Completed.",
  actionGuidance: "Review the latest run output.",
  formatOptionalDate: (v: string | null | undefined) => v ?? "Not set",
  formatPreview: (v: string | null | undefined) => v ?? "Not set",
  parseResultPreview: () => ({ summary: "ok" }),
  canExecuteRun: () => false,
  normalizeStatus: (s: string | null | undefined) => s ?? "DRAFT",
  formatStatusBreakdown: () => "Review: 1",
};

function getWorkflowRunsDialog() {
  const dialogs = screen.getAllByRole("region", { name: "Workflow Runs" });
  return dialogs[dialogs.length - 1]!;
}

describe("AiRunReviewModal", () => {
  it("uses smoke-compatible dialog accessible name", () => {
    render(<AiRunReviewModal {...baseProps} />);
    expect(getWorkflowRunsDialog()).toBeTruthy();
  });

  it("exposes accessible Overview, Context & Logs, and Raw Output tabs", () => {
    render(<AiRunReviewModal {...baseProps} />);
    const dialog = getWorkflowRunsDialog();
    const tablist = within(dialog).getByRole("tablist");
    expect(within(tablist).getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    expect(within(tablist).getByRole("tab", { name: "Context & Logs" })).toHaveAttribute("aria-selected", "false");
    expect(within(tablist).getByRole("tab", { name: "Raw Output" })).toHaveAttribute("aria-selected", "false");
    expect(within(dialog).getByRole("tabpanel", { name: "Overview" })).toBeTruthy();
  });

  it("shows empty-run overview without inventing run cards", () => {
    render(<AiRunReviewModal {...baseProps} runs={[]} selectedRunId={null} />);
    const dialog = getWorkflowRunsDialog();
    expect(within(dialog).getByRole("heading", { name: "Existing workflow runs" })).toBeTruthy();
    expect(within(dialog).getByText("No workflow runs yet. Create a workflow run to start.")).toBeTruthy();
    expect(within(dialog).queryByRole("button", { name: /Review/i })).toBeNull();
  });

  it("shows execution log on overview for smoke-compatible run cards", () => {
    render(<AiRunReviewModal {...baseProps} selectedRunId={null} />);
    const dialog = getWorkflowRunsDialog();
    expect(within(dialog).getByRole("heading", { name: "Existing workflow runs" })).toBeTruthy();
    expect(within(dialog).getByText("step 1 complete")).toBeTruthy();
  });

  it("keeps populated run data visible when switching tabs", () => {
    render(<AiRunReviewModal {...baseProps} />);
    const dialog = getWorkflowRunsDialog();
    expect(within(dialog).getByText(/Review the latest run output/i)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("tab", { name: "Context & Logs" }));
    expect(within(dialog).getByRole("tabpanel", { name: "Context & Logs" })).toBeTruthy();
    expect(within(dialog).getByText(/Execution log/i)).toBeTruthy();
    expect(within(dialog).getByText("step 1 complete")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("tab", { name: "Raw Output" }));
    expect(within(dialog).getByRole("tabpanel", { name: "Raw Output" })).toBeTruthy();
    expect(within(dialog).getByText('{"summary":"ok"}')).toBeTruthy();
  });

  it("renders workflow history panel on Context & Logs", () => {
    render(<AiRunReviewModal {...baseProps} />);
    const dialog = getWorkflowRunsDialog();
    fireEvent.click(within(dialog).getByRole("tab", { name: "Context & Logs" }));
    expect(within(dialog).getByRole("heading", { name: "Workflow history" })).toBeTruthy();
    expect(within(dialog).getByRole("list", { name: "Workflow run history" })).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: /Review run/i })).toBeTruthy();
  });

  it("shows history empty state when no runs exist", () => {
    render(<AiRunReviewModal {...baseProps} runs={[]} selectedRunId={null} />);
    const dialog = getWorkflowRunsDialog();
    fireEvent.click(within(dialog).getByRole("tab", { name: "Context & Logs" }));
    expect(within(dialog).getByText("No workflow runs recorded yet. Create a workflow run to start.")).toBeTruthy();
  });

  it("selects a run from overview Review action", () => {
    const onSelectRun = vi.fn();
    render(<AiRunReviewModal {...baseProps} selectedRunId={null} onSelectRun={onSelectRun} />);
    const dialog = getWorkflowRunsDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: /Review workflow run/i }));
    expect(onSelectRun).toHaveBeenCalledWith(run);
  });

  it("selects a run from history Review run action", () => {
    const onSelectRun = vi.fn();
    render(<AiRunReviewModal {...baseProps} onSelectRun={onSelectRun} />);
    const dialog = getWorkflowRunsDialog();
    fireEvent.click(within(dialog).getByRole("tab", { name: "Context & Logs" }));
    fireEvent.click(within(dialog).getByRole("button", { name: /Review run/i }));
    expect(onSelectRun).toHaveBeenCalledWith(run);
  });

  it("shows empty log state safely", () => {
    render(
      <AiRunReviewModal
        {...baseProps}
        runs={[{ ...run, executionLog: null }]}
      />,
    );
    const dialog = getWorkflowRunsDialog();
    fireEvent.click(within(dialog).getByRole("tab", { name: "Context & Logs" }));
    expect(within(dialog).getAllByText("Not set").length).toBeGreaterThan(0);
  });

  it("shows raw output safely when no run is selected", () => {
    render(<AiRunReviewModal {...baseProps} selectedRunId={null} />);
    const dialog = getWorkflowRunsDialog();
    fireEvent.click(within(dialog).getByRole("tab", { name: "Raw Output" }));
    expect(within(dialog).getByRole("heading", { name: "Raw output" })).toBeTruthy();
    expect(within(dialog).getByText("Not set")).toBeTruthy();
  });

  it("shows error alert when run failed", () => {
    render(
      <AiRunReviewModal
        {...baseProps}
        runs={[{ ...run, status: "FAILED", executionError: "Safe failure" }]}
        selectedRunId="run-1"
      />,
    );
    expect(screen.getByText(/Run ended with an error/i)).toBeTruthy();
  });

  it("surfaces action error without losing overview shell", () => {
    render(<AiRunReviewModal {...baseProps} error="Status transition blocked" />);
    const dialog = getWorkflowRunsDialog();
    expect(within(dialog).getByText("Workflow run action blocked")).toBeTruthy();
    expect(within(dialog).getByText("Status transition blocked")).toBeTruthy();
    expect(within(dialog).getByRole("heading", { name: "Existing workflow runs" })).toBeTruthy();
  });

  it("does not render fake footer actions", () => {
    render(<AiRunReviewModal {...baseProps} />);
    expect(screen.queryByRole("button", { name: "Request Changes" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Flag for Manual Review" })).toBeNull();
  });
});
