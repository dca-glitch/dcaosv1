import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import {
  AiDeliveryBriefModal,
  type AiDeliveryBriefDetail,
  type AiDeliveryBriefModalProps,
} from "./AiDeliveryBriefModal";
import type { AiDeliveryProjectSummary } from "./AiDeliveryPage";

const project: AiDeliveryProjectSummary = {
  id: "p1",
  clientId: "c1",
  client: { id: "c1", name: "Acme" },
  projectId: null,
  project: { id: "pr1", name: "SEO" },
  name: "June delivery",
  targetMonth: "2026-06",
  plannedContentScopeNotes: "Scope notes for the month",
  isArchived: false,
  brief: {
    id: "b-summary",
    status: "DRAFT",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-02T00:00:00.000Z",
    revisionCount: 1,
  },
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

const brief: AiDeliveryBriefDetail = {
  id: "b1",
  status: "DRAFT",
  clientPriorities: "Priority A",
  productsServicesFocus: "Service B",
  targetAudience: "Audience C",
  marketsCompetitors: "Market D",
  notes: "Internal notes E",
  revisionCount: 2,
  submittedAt: null,
  revisionRequestedAt: null,
  revisedAt: null,
  approvedAt: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

function baseProps(overrides: Partial<AiDeliveryBriefModalProps> = {}): AiDeliveryBriefModalProps {
  return {
    isOpen: true,
    onClose: vi.fn(),
    project,
    loading: false,
    error: null,
    brief,
    onBriefChange: vi.fn(),
    canEdit: true,
    canSave: true,
    formatEnumLabel: (v) => v ?? "Not set",
    onSave: vi.fn(),
    ...overrides,
  };
}

function getDialog() {
  const dialogs = screen.getAllByRole("dialog", { name: "AI Delivery Brief" });
  return dialogs[dialogs.length - 1]!;
}

describe("AiDeliveryBriefModal", () => {
  it("opens with the AI Delivery Brief accessible dialog name", () => {
    render(<AiDeliveryBriefModal {...baseProps()} />);
    expect(getDialog()).toBeTruthy();
  });

  it("renders loading state", () => {
    render(<AiDeliveryBriefModal {...baseProps({ loading: true, brief: null })} />);
    expect(within(getDialog()).getByText("Loading brief")).toBeTruthy();
  });

  it("renders empty/new brief state when project has no brief detail or summary", () => {
    render(
      <AiDeliveryBriefModal
        {...baseProps({
          brief: null,
          project: { ...project, brief: null },
        })}
      />,
    );
    expect(
      within(getDialog()).getByText(
        /No brief is available for this project yet\. Create or open the project record to continue briefing\./,
      ),
    ).toBeTruthy();
  });

  it("renders populated brief fields and critical labels", () => {
    render(<AiDeliveryBriefModal {...baseProps()} />);
    const dialog = getDialog();
    expect(within(dialog).getByText("Client")).toBeTruthy();
    expect(within(dialog).getByText("Acme")).toBeTruthy();
    expect(within(dialog).getByText("AI Delivery project")).toBeTruthy();
    expect(within(dialog).getByText("June delivery")).toBeTruthy();
    expect(within(dialog).getByText("Brief status")).toBeTruthy();
    expect(within(dialog).getByText("Client input / priorities - Optional")).toBeTruthy();
    expect(within(dialog).getByText("Products / services focus - Optional")).toBeTruthy();
    expect(within(dialog).getByText("Target audience - Optional")).toBeTruthy();
    expect(within(dialog).getByText("Research / admin feedback - Optional")).toBeTruthy();
    expect(within(dialog).getByText("Optional internal notes")).toBeTruthy();
    expect(within(dialog).getByDisplayValue("Priority A")).toBeTruthy();
    expect(within(dialog).getByDisplayValue("Service B")).toBeTruthy();
    expect(within(dialog).getByDisplayValue("Audience C")).toBeTruthy();
    expect(within(dialog).getByDisplayValue("Market D")).toBeTruthy();
    expect(within(dialog).getByDisplayValue("Internal notes E")).toBeTruthy();
  });

  it("renders read-only summary fallback when detail is missing but project.brief exists", () => {
    render(<AiDeliveryBriefModal {...baseProps({ brief: null, canEdit: false, canSave: false })} />);
    const dialog = getDialog();
    expect(within(dialog).getByText("Planned content scope notes")).toBeTruthy();
    expect(within(dialog).getByText("Scope notes for the month")).toBeTruthy();
    expect(within(dialog).queryByRole("button", { name: "Save brief" })).toBeNull();
  });

  it("renders read-only populated fields when cannot edit", () => {
    render(<AiDeliveryBriefModal {...baseProps({ canEdit: false, canSave: true })} />);
    const dialog = getDialog();
    expect(within(dialog).getByText("Priority A")).toBeTruthy();
    expect(within(dialog).queryByRole("textbox", { name: "Client input / priorities - Optional" })).toBeNull();
    expect(within(dialog).queryByRole("button", { name: "Save brief" })).toBeNull();
  });

  it("renders project-not-found state", () => {
    render(<AiDeliveryBriefModal {...baseProps({ project: null, brief: null, loading: false })} />);
    expect(within(getDialog()).getByText("Project not found.")).toBeTruthy();
  });

  it("renders auth/forbidden and unexpected error states", () => {
    const { rerender } = render(
      <AiDeliveryBriefModal {...baseProps({ error: "Unauthorized — sign in again." })} />,
    );
    expect(within(getDialog()).getByText("Brief action blocked")).toBeTruthy();
    expect(within(getDialog()).getByText("Unauthorized — sign in again.")).toBeTruthy();

    rerender(<AiDeliveryBriefModal {...baseProps({ error: "Forbidden for this tenant." })} />);
    expect(within(getDialog()).getByText("Forbidden for this tenant.")).toBeTruthy();

    rerender(<AiDeliveryBriefModal {...baseProps({ error: "Unexpected brief failure." })} />);
    expect(within(getDialog()).getByText("Unexpected brief failure.")).toBeTruthy();
  });

  it("does not show loading and populated states simultaneously", () => {
    render(<AiDeliveryBriefModal {...baseProps({ loading: true })} />);
    const dialog = getDialog();
    expect(within(dialog).getByText("Loading brief")).toBeTruthy();
    expect(within(dialog).queryByText("Client input / priorities - Optional")).toBeNull();
  });

  it("invokes onBriefChange when editing a field", () => {
    const onBriefChange = vi.fn();
    render(<AiDeliveryBriefModal {...baseProps({ onBriefChange })} />);
    fireEvent.change(within(getDialog()).getByRole("textbox", { name: "Client input / priorities - Optional" }), {
      target: { value: "Updated priority" },
    });
    expect(onBriefChange).toHaveBeenCalledWith(expect.objectContaining({ clientPriorities: "Updated priority" }));
  });

  it("invokes save and close callbacks", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<AiDeliveryBriefModal {...baseProps({ onSave, onClose })} />);
    const dialog = getDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Save brief" }));
    expect(onSave).toHaveBeenCalledWith("p1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("handles long text without rendering secrets", () => {
    const long = "Long brief note ".repeat(40).trimEnd();
    render(
      <AiDeliveryBriefModal
        {...baseProps({
          brief: { ...brief, notes: long, clientPriorities: long },
        })}
      />,
    );
    const dialog = getDialog();
    const priorities = within(dialog).getByRole("textbox", { name: "Client input / priorities - Optional" }) as HTMLTextAreaElement;
    const notes = within(dialog).getByRole("textbox", { name: "Optional internal notes" }) as HTMLTextAreaElement;
    expect(priorities.value).toBe(long);
    expect(notes.value).toBe(long);
    expect(within(dialog).queryByText(/sk_|Bearer |token=|storage\//i)).toBeNull();
  });

  it("closes via Escape when the modal foundation supports it", () => {
    const onClose = vi.fn();
    render(<AiDeliveryBriefModal {...baseProps({ onClose })} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("does not introduce false placeholder or archive/restore actions in the Brief modal", () => {
    render(<AiDeliveryBriefModal {...baseProps()} />);
    const dialog = getDialog();
    expect(within(dialog).queryByRole("button", { name: /coming soon|todo|placeholder action/i })).toBeNull();
    expect(within(dialog).queryByRole("button", { name: /archive|restore/i })).toBeNull();
    expect(within(dialog).queryByRole("button", { name: /apply to brief/i })).toBeNull();
  });

  it("returns null when closed", () => {
    const { container } = render(<AiDeliveryBriefModal {...baseProps({ isOpen: false })} />);
    expect(container.firstChild).toBeNull();
  });
});
