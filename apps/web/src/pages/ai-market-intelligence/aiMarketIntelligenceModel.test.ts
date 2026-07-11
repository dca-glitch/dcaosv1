import { describe, expect, it } from "vitest";
import {
  MI_PROJECT_FILTER_OPTIONS,
  filterMiProjects,
  formatMiDateLabel,
  formatMiLastUpdatedLabel,
  formatMiResultFieldLabel,
  parseMiListField,
  resolveMiLastUpdated
} from "./aiMarketIntelligenceModel";

describe("MI_PROJECT_FILTER_OPTIONS", () => {
  it("exposes active/archived/all filters", () => {
    expect(MI_PROJECT_FILTER_OPTIONS.map((option) => option.value)).toEqual([
      "active",
      "archived",
      "all"
    ]);
  });
});

describe("formatMiDateLabel", () => {
  it("returns Not set for empty values", () => {
    expect(formatMiDateLabel(null)).toBe("Not set");
    expect(formatMiDateLabel(undefined)).toBe("Not set");
    expect(formatMiDateLabel("")).toBe("Not set");
  });

  it("formats valid ISO dates", () => {
    expect(formatMiDateLabel("2026-07-11T12:00:00.000Z")).toMatch(/\d/);
  });

  it("passes through unparseable strings", () => {
    expect(formatMiDateLabel("not-a-date")).toBe("not-a-date");
  });
});

describe("parseMiListField", () => {
  it("splits comma and newline lists", () => {
    expect(parseMiListField("AI tools, SaaS pricing")).toEqual(["AI tools", "SaaS pricing"]);
    expect(parseMiListField("Acme\nRival Co")).toEqual(["Acme", "Rival Co"]);
  });

  it("returns empty for blank input", () => {
    expect(parseMiListField(null)).toEqual([]);
    expect(parseMiListField("  ,  \n ")).toEqual([]);
  });
});

describe("resolveMiLastUpdated", () => {
  it("returns null when no timestamps exist", () => {
    expect(resolveMiLastUpdated([])).toBeNull();
    expect(resolveMiLastUpdated([{ updatedAt: null }])).toBeNull();
  });

  it("picks the latest existing timestamp without inventing values", () => {
    const latest = resolveMiLastUpdated([
      { updatedAt: "2026-01-01T00:00:00.000Z" },
      { executedAt: "2026-06-01T00:00:00.000Z", createdAt: "2025-01-01T00:00:00.000Z" },
      { appliedAt: "2026-03-01T00:00:00.000Z" }
    ]);
    expect(latest).toBe("2026-06-01T00:00:00.000Z");
  });
});

describe("formatMiLastUpdatedLabel", () => {
  it("returns null when nothing to show", () => {
    expect(formatMiLastUpdatedLabel([])).toBeNull();
  });

  it("formats the resolved timestamp", () => {
    expect(formatMiLastUpdatedLabel([{ updatedAt: "2026-07-11T12:00:00.000Z" }])).toMatch(/\d/);
  });
});

describe("formatMiResultFieldLabel", () => {
  it("title-cases camelCase keys", () => {
    expect(formatMiResultFieldLabel("audienceSignals")).toBe("Audience Signals");
  });
});

describe("filterMiProjects", () => {
  const projects = [
    { id: "a", isArchived: false },
    { id: "b", isArchived: true }
  ];

  it("filters by active/archived/all", () => {
    expect(filterMiProjects(projects, "active").map((p) => p.id)).toEqual(["a"]);
    expect(filterMiProjects(projects, "archived").map((p) => p.id)).toEqual(["b"]);
    expect(filterMiProjects(projects, "all").map((p) => p.id)).toEqual(["a", "b"]);
  });
});
