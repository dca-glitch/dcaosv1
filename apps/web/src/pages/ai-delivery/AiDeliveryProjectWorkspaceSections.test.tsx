import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import {
  AiDeliveryProjectWorkspaceSections,
  type AiDeliveryProjectWorkspaceSectionsProps,
} from "./AiDeliveryProjectWorkspaceSections";
import type { AiDeliveryProjectSummary } from "./AiDeliveryPage";

afterEach(() => {
  cleanup();
});

const project: AiDeliveryProjectSummary = {
  id: "p1",
  clientId: "c1",
  client: { id: "c1", name: "Acme Client With A Very Long Name That Should Wrap" },
  projectId: "pr1",
  project: { id: "pr1", name: "Internal Project Reference With Long Name" },
  name: "AI SEO & Content Delivery — Extremely Long Project Name For Wrap Coverage 2026-06",
  targetMonth: "2026-06",
  plannedContentScopeNotes: "Scope notes",
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
  overrides: Partial<AiDeliveryProjectWorkspaceSectionsProps> = {},
): AiDeliveryProjectWorkspaceSectionsProps {
  return {
    workspaceProject: project,
    canEdit: true,
    briefCheckpointLabel: "Brief Draft",
    showMiContextButton: false,
    showKnowledgeButton: false,
    showMonthlyReportButton: false,
    revenueChainReadiness: null,
    revenueChainReadinessLoading: false,
    onEdit: vi.fn(),
    onArchive: vi.fn(),
    onOpenContentPlan: vi.fn(),
    onOpenBrief: vi.fn(),
    onOpenResearchSources: vi.fn(),
    onOpenMiContext: vi.fn(),
    onOpenKnowledgePanel: vi.fn(),
    onOpenWorkflowRuns: vi.fn(),
    onOpenContentDrafts: vi.fn(),
    onRequestClientInput: vi.fn(),
    onRequestClientRevision: vi.fn(),
    onApproveFinal: vi.fn(),
    onOpenArticleImages: vi.fn(),
    onOpenDeliverables: vi.fn(),
    onOpenMonthlyReport: vi.fn(),
    ...overrides,
  };
}

describe("AiDeliveryProjectWorkspaceSections", () => {
  it("shows Active status hierarchy for non-archived projects", () => {
    render(<AiDeliveryProjectWorkspaceSections {...baseProps()} />);
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("Archive")).toBeTruthy();
  });

  it("shows Archived status and hides Archive action when archived", () => {
    render(
      <AiDeliveryProjectWorkspaceSections
        {...baseProps({
          workspaceProject: { ...project, isArchived: true },
        })}
      />,
    );
    expect(screen.getByText("Archived")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Archive" })).toBeNull();
  });

  it("renders long project name in the context header", () => {
    render(<AiDeliveryProjectWorkspaceSections {...baseProps()} />);
    expect(screen.getByText(project.name)).toBeTruthy();
  });
});
