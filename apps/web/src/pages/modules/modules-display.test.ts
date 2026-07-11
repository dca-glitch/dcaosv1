import { describe, expect, it } from "vitest";
import {
  SECONDARY_MODULE_CATALOG,
  countModuleSurfacesByAvailability,
  moduleEnablementBadgeStatus,
  moduleRegistryStatusBadge,
  moduleSurfaceBadgeStatus,
  selectedModulePlaceholderCopy
} from "./modules-display";

describe("SECONDARY_MODULE_CATALOG", () => {
  it("marks Revenue Hub, POD, and Prompt library as paused without inventing routes", () => {
    const pausedKeys = SECONDARY_MODULE_CATALOG.filter((item) => item.availability === "paused").map(
      (item) => item.key
    );
    expect(pausedKeys).toEqual([
      "revenue-hub",
      "revenue-reporting",
      "pod-ai-toolkit",
      "prompt-library"
    ]);
    for (const item of SECONDARY_MODULE_CATALOG.filter((entry) => entry.availability === "paused")) {
      expect(item.href).toBeUndefined();
    }
  });

  it("keeps available surfaces limited to existing MI and module index UI", () => {
    const available = SECONDARY_MODULE_CATALOG.filter((item) => item.availability === "available");
    expect(available.map((item) => item.key)).toEqual([
      "market-intelligence",
      "keyword-topic-research",
      "competitor-tracking",
      "module-index"
    ]);
    for (const item of available) {
      expect(item.href === "#/ai-market-intelligence" || item.href === "#/modules").toBe(true);
    }
  });
});

describe("moduleSurfaceBadgeStatus", () => {
  it("maps availability to StatusBadge-friendly labels", () => {
    expect(moduleSurfaceBadgeStatus("available")).toBe("Active");
    expect(moduleSurfaceBadgeStatus("paused")).toBe("Paused");
  });
});

describe("moduleEnablementBadgeStatus", () => {
  it("maps tenant enablement", () => {
    expect(moduleEnablementBadgeStatus(true)).toBe("Enabled");
    expect(moduleEnablementBadgeStatus(false)).toBe("Disabled");
  });
});

describe("moduleRegistryStatusBadge", () => {
  it("normalizes known registry statuses", () => {
    expect(moduleRegistryStatusBadge("active")).toBe("Active");
    expect(moduleRegistryStatusBadge("planned")).toBe("Planned");
    expect(moduleRegistryStatusBadge("internal")).toBe("Internal");
    expect(moduleRegistryStatusBadge("custom")).toBe("custom");
  });
});

describe("countModuleSurfacesByAvailability", () => {
  it("counts catalog availability without inventing areas", () => {
    expect(countModuleSurfacesByAvailability()).toEqual({ available: 4, paused: 4 });
  });
});

describe("selectedModulePlaceholderCopy", () => {
  it("uses paused catalog notes when the selected key matches", () => {
    expect(selectedModulePlaceholderCopy("revenue-hub")).toEqual({
      title: "Revenue Hub dashboard",
      body: "No Revenue Hub route or operational UI in this MVP."
    });
  });

  it("falls back to the generic shell copy for registry keys", () => {
    const copy = selectedModulePlaceholderCopy("finance-lite");
    expect(copy.title).toBe("finance-lite");
    expect(copy.body).toContain("next backend-backed pass");
  });
});
