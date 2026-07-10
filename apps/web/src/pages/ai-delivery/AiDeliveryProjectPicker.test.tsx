import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { AiDeliveryProjectPicker } from "./AiDeliveryProjectPicker";
import { AI_DELIVERY_PROJECT_PICKER_PAGE_SIZE } from "./ai-delivery-project-picker-model";
import type { AiDeliveryProjectSummary } from "./AiDeliveryPage";

afterEach(() => {
  cleanup();
});

function makeProject(index: number): AiDeliveryProjectSummary {
  return {
    id: `p-${index}`,
    clientId: "c1",
    client: { id: "c1", name: index === 3 ? "Puriva" : "Acme" },
    projectId: null,
    project: null,
    name: index === 40 ? "Zebra Delivery" : `Project ${index}`,
    targetMonth: "2026-06",
    plannedContentScopeNotes: null,
    isArchived: false,
    brief: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-02T00:00:00.000Z",
  };
}

const projects = Array.from({ length: 60 }, (_, index) => makeProject(index));

function getSearchInput() {
  const inputs = screen.getAllByLabelText("Search projects");
  return inputs[inputs.length - 1] as HTMLInputElement;
}

function getProjectsList() {
  const lists = screen.getAllByRole("list", { name: "AI delivery projects" });
  return lists[lists.length - 1]!;
}

describe("AiDeliveryProjectPicker", () => {
  it("renders a bounded initial list and accessible search control", () => {
    render(
      <AiDeliveryProjectPicker
        filteredProjects={projects}
        onSelectProject={vi.fn()}
        workspaceProjectId={null}
      />,
    );
    expect(getSearchInput()).toBeTruthy();
    expect(screen.getAllByRole("status").some((el) => /Showing 25 of 60/i.test(el.textContent ?? ""))).toBe(true);
    expect(within(getProjectsList()).getAllByRole("button")).toHaveLength(AI_DELIVERY_PROJECT_PICKER_PAGE_SIZE);
  });

  it("supports case-insensitive search and no-match empty state", () => {
    render(
      <AiDeliveryProjectPicker
        filteredProjects={projects}
        onSelectProject={vi.fn()}
        workspaceProjectId={null}
      />,
    );
    const search = getSearchInput();
    fireEvent.change(search, { target: { value: "zebra" } });
    expect(within(getProjectsList()).getByText("Zebra Delivery")).toBeTruthy();
    fireEvent.change(search, { target: { value: "definitely-missing" } });
    expect(screen.getAllByText("No matching projects").length).toBeGreaterThan(0);
  });

  it("reveals additional results via Show more", () => {
    render(
      <AiDeliveryProjectPicker
        filteredProjects={projects}
        onSelectProject={vi.fn()}
        workspaceProjectId={null}
      />,
    );
    const showMore = screen.getAllByRole("button", { name: /Show more/i }).at(-1)!;
    fireEvent.click(showMore);
    expect(screen.getAllByRole("status").some((el) => /Showing 50 of 60/i.test(el.textContent ?? ""))).toBe(true);
  });

  it("preserves selection when searching and keeps selected item pinned when outside the window", () => {
    const onSelectProject = vi.fn();
    render(
      <AiDeliveryProjectPicker
        filteredProjects={projects}
        onSelectProject={onSelectProject}
        workspaceProjectId="p-50"
      />,
    );
    const list = getProjectsList();
    expect(within(list).getAllByRole("button")[0]?.textContent).toMatch(/Project 50/);
    fireEvent.change(getSearchInput(), { target: { value: "zebra" } });
    expect(screen.getAllByText(/Current selection is hidden by search/i).length).toBeGreaterThan(0);
    expect(onSelectProject).not.toHaveBeenCalled();
  });
});
