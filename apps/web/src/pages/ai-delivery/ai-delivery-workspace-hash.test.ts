import { describe, expect, it } from "vitest";
import {
  buildAiDeliveryWorkspaceHash,
  isAiDeliveryWorkspaceHash,
  parseAiDeliveryWorkspaceHash
} from "./ai-delivery-workspace-hash";

describe("ai-delivery-workspace-hash", () => {
  it("parses hub and new routes", () => {
    expect(parseAiDeliveryWorkspaceHash("#/ai-delivery")).toEqual({ projectId: null, panel: "hub" });
    expect(parseAiDeliveryWorkspaceHash("#/ai-delivery/new")).toEqual({ projectId: null, panel: "new" });
  });

  it("parses project panel routes", () => {
    expect(parseAiDeliveryWorkspaceHash("#/ai-delivery/p/proj-1/brief")).toEqual({
      projectId: "proj-1",
      panel: "brief"
    });
    expect(parseAiDeliveryWorkspaceHash("#/ai-delivery/p/proj%2F2/content-plan")).toEqual({
      projectId: "proj/2",
      panel: "content-plan"
    });
  });

  it("falls back to hub for unknown panels", () => {
    expect(parseAiDeliveryWorkspaceHash("#/ai-delivery/p/proj-1/unknown")).toEqual({
      projectId: null,
      panel: "hub"
    });
  });

  it("builds hashes for hub, new, and panels", () => {
    expect(buildAiDeliveryWorkspaceHash(null, "hub")).toBe("#/ai-delivery");
    expect(buildAiDeliveryWorkspaceHash(null, "new")).toBe("#/ai-delivery/new");
    expect(buildAiDeliveryWorkspaceHash("proj-1", "deliverables")).toBe(
      "#/ai-delivery/p/proj-1/deliverables"
    );
  });

  it("detects ai-delivery workspace hashes", () => {
    expect(isAiDeliveryWorkspaceHash("#/ai-delivery")).toBe(true);
    expect(isAiDeliveryWorkspaceHash("#/ai-delivery/p/x/brief")).toBe(true);
    expect(isAiDeliveryWorkspaceHash("#/clients")).toBe(false);
  });
});
