import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import {
  AiDeliveryProjectEditorModal,
  type AiDeliveryProjectEditorModalProps,
} from "./AiDeliveryProjectEditorModal";
import type { AiDeliveryProjectFormValues, AiDeliveryProjectSummary } from "./AiDeliveryPage";
import type { ClientSummary } from "../clients/ClientsPage";

afterEach(() => {
  cleanup();
});

const emptyDraft: AiDeliveryProjectFormValues = {
  clientId: "c1",
  projectId: null,
  name: "",
  targetMonth: "2026-06",
  plannedContentScopeNotes: "",
};

const client: ClientSummary = {
  id: "c1",
  name: "Acme",
  email: null,
  website: null,
  contactPerson: null,
  billingAddress: null,
  taxId: null,
  country: null,
  clientKind: "AGENCY_CLIENT",
  legalEntityName: null,
  accountGroupName: null,
  migrationStatus: "ACTIVE",
  isArchived: false,
  projectCount: 1,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

const selectedProject: AiDeliveryProjectSummary = {
  id: "p1",
  clientId: "c1",
  client: { id: "c1", name: "Acme" },
  projectId: null,
  project: null,
  name: "June delivery",
  targetMonth: "2026-06",
  plannedContentScopeNotes: null,
  isArchived: false,
  brief: {
    id: "b1",
    status: "DRAFT",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-02T00:00:00.000Z",
    revisionCount: 0,
  },
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

function baseProps(
  overrides: Partial<AiDeliveryProjectEditorModalProps> = {},
): AiDeliveryProjectEditorModalProps {
  return {
    isOpen: true,
    isEdit: false,
    draft: emptyDraft,
    clients: [client],
    linkableProjects: [{ id: "pr1", name: "Internal SEO" }],
    selectedProject: null,
    saving: false,
    formatEnumLabel: (value) => (value ? String(value) : "Not set"),
    onClose: vi.fn(),
    onDraftChange: vi.fn(),
    onSubmit: vi.fn((event) => event.preventDefault()),
    ...overrides,
  };
}

function getDialog(name: string) {
  const dialogs = screen.getAllByRole("dialog", { name });
  return dialogs[dialogs.length - 1]!;
}

describe("AiDeliveryProjectEditorModal", () => {
  it("renders Add AI Delivery title for create mode", () => {
    render(<AiDeliveryProjectEditorModal {...baseProps()} />);
    expect(getDialog("Add AI Delivery")).toBeTruthy();
    expect(within(getDialog("Add AI Delivery")).getByRole("button", { name: "Create AI Delivery" })).toBeTruthy();
  });

  it("renders Edit AI Delivery title for edit mode", () => {
    render(
      <AiDeliveryProjectEditorModal
        {...baseProps({
          isEdit: true,
          selectedProject,
          draft: {
            ...emptyDraft,
            name: "June delivery",
          },
        })}
      />,
    );
    expect(getDialog("Edit AI Delivery")).toBeTruthy();
    expect(within(getDialog("Edit AI Delivery")).getByRole("button", { name: "Update AI Delivery" })).toBeTruthy();
  });

  it("returns null when closed", () => {
    const { container } = render(<AiDeliveryProjectEditorModal {...baseProps({ isOpen: false })} />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("shows archived project status when selected project is archived", () => {
    render(
      <AiDeliveryProjectEditorModal
        {...baseProps({
          isEdit: true,
          selectedProject: { ...selectedProject, isArchived: true },
        })}
      />,
    );
    expect(within(getDialog("Edit AI Delivery")).getByText("Archived")).toBeTruthy();
  });

  it("calls onClose from Cancel", () => {
    const onClose = vi.fn();
    render(<AiDeliveryProjectEditorModal {...baseProps({ onClose })} />);
    fireEvent.click(within(getDialog("Add AI Delivery")).getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onDraftChange when project name changes", () => {
    const onDraftChange = vi.fn();
    render(<AiDeliveryProjectEditorModal {...baseProps({ onDraftChange })} />);
    const nameInput = within(getDialog("Add AI Delivery")).getByPlaceholderText(
      "AI SEO & Content - June 2026",
    );
    fireEvent.change(nameInput, { target: { value: "New name" } });
    expect(onDraftChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: "New name", clientId: "c1" }),
    );
  });
});
