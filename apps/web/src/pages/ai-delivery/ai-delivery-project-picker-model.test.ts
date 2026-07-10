import { describe, expect, it } from "vitest";
import {
  AI_DELIVERY_PROJECT_PICKER_PAGE_SIZE,
  filterProjectsForPicker,
  sliceProjectsForPicker,
} from "./ai-delivery-project-picker-model";
import type { AiDeliveryProjectSummary } from "./AiDeliveryPage";

function makeProject(overrides: Partial<AiDeliveryProjectSummary> & { id: string; name: string }): AiDeliveryProjectSummary {
  return {
    clientId: "c1",
    client: { id: "c1", name: overrides.client?.name ?? "Acme" },
    projectId: null,
    project: null,
    targetMonth: "2026-06",
    plannedContentScopeNotes: null,
    isArchived: false,
    brief: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("ai-delivery-project-picker-model", () => {
  const projects = Array.from({ length: 60 }, (_, index) =>
    makeProject({
      id: `p-${index}`,
      name: index === 40 ? "Zebra Delivery" : `Project ${index}`,
      client: { id: "c1", name: index === 5 ? "Puriva" : "Acme" },
      targetMonth: index % 2 === 0 ? "2026-06" : "2026-07",
    }),
  );

  it("bounds the initial visible slice", () => {
    const slice = sliceProjectsForPicker(projects, AI_DELIVERY_PROJECT_PICKER_PAGE_SIZE, null);
    expect(slice.visibleProjects).toHaveLength(AI_DELIVERY_PROJECT_PICKER_PAGE_SIZE);
    expect(slice.matchCount).toBe(60);
    expect(slice.remainingCount).toBe(60 - AI_DELIVERY_PROJECT_PICKER_PAGE_SIZE);
  });

  it("filters case-insensitively by name and client", () => {
    expect(filterProjectsForPicker(projects, "  zebra  ").map((p) => p.id)).toEqual(["p-40"]);
    expect(filterProjectsForPicker(projects, "PURIVA").map((p) => p.id)).toEqual(["p-5"]);
  });

  it("returns an empty match list when nothing matches", () => {
    expect(filterProjectsForPicker(projects, "no-such-project")).toEqual([]);
  });

  it("pins the selected project when it falls outside the visible window", () => {
    const selectedId = "p-50";
    const slice = sliceProjectsForPicker(projects, AI_DELIVERY_PROJECT_PICKER_PAGE_SIZE, selectedId);
    expect(slice.visibleProjects[0]?.id).toBe(selectedId);
    expect(slice.selectedPinned).toBe(true);
    expect(slice.visibleProjects).toHaveLength(AI_DELIVERY_PROJECT_PICKER_PAGE_SIZE);
  });

  it("does not clear selection semantics when search excludes the selected project", () => {
    const matched = filterProjectsForPicker(projects, "zebra");
    const slice = sliceProjectsForPicker(matched, AI_DELIVERY_PROJECT_PICKER_PAGE_SIZE, "p-0");
    expect(matched.map((p) => p.id)).toEqual(["p-40"]);
    expect(slice.visibleProjects.map((p) => p.id)).toEqual(["p-40"]);
    expect(slice.selectedPinned).toBe(false);
  });

  it("orders matching projects newest-first", () => {
    const mixed = [
      makeProject({ id: "old", name: "Old", updatedAt: "2026-01-01T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z" }),
      makeProject({ id: "new", name: "New", updatedAt: "2026-06-02T00:00:00.000Z", createdAt: "2026-06-01T00:00:00.000Z" }),
    ];
    expect(filterProjectsForPicker(mixed, "").map((p) => p.id)).toEqual(["new", "old"]);
  });

  it("exposes remaining count for show-more disclosure", () => {
    const first = sliceProjectsForPicker(projects, 25, null);
    expect(first.remainingCount).toBe(35);
    const second = sliceProjectsForPicker(projects, 50, null);
    expect(second.remainingCount).toBe(10);
    const all = sliceProjectsForPicker(projects, 100, null);
    expect(all.remainingCount).toBe(0);
  });
});
