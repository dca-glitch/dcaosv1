import { describe, expect, it } from "vitest";
import {
  CLIENT_STATUS_LABELS,
  STATUS,
  STATUS_KEYS,
  getClientStatusLabel,
  getStatusTone,
  isClientVisibleStatus,
  normalizeStatusKey,
} from "../../design-system/status";
import { getStatusTone as uiGetStatusTone } from "./StatusBadge";

describe("getStatusTone", () => {
  it("maps success statuses", () => {
    expect(getStatusTone("DELIVERED")).toBe("success");
    expect(getStatusTone("accepted")).toBe("success");
    expect(uiGetStatusTone("DELIVERED")).toBe("success");
  });

  it("maps info statuses", () => {
    expect(getStatusTone("DRAFT")).toBe("info");
    expect(getStatusTone("pending")).toBe("info");
  });

  it("maps danger statuses", () => {
    expect(getStatusTone("REJECTED")).toBe("danger");
    expect(getStatusTone("failed")).toBe("danger");
  });

  it("maps muted statuses", () => {
    expect(getStatusTone("archived")).toBe("muted");
  });

  it("defaults unknown statuses to neutral", () => {
    expect(getStatusTone("custom-status")).toBe("neutral");
  });
});

describe("STATUS map", () => {
  it("defines all 13 canonical keys", () => {
    expect(STATUS_KEYS).toHaveLength(13);
    for (const key of STATUS_KEYS) {
      expect(STATUS[key].label.length).toBeGreaterThan(0);
      expect(STATUS[key].text).toMatch(/^var\(--status-/);
      expect(STATUS[key].bg).toMatch(/^var\(--status-/);
      expect(STATUS[key].border).toMatch(/^var\(--status-/);
    }
  });

  it("normalizes common aliases to canonical keys", () => {
    expect(normalizeStatusKey("DRAFT")).toBe("draft");
    expect(normalizeStatusKey("in-progress")).toBe("in_progress");
    expect(normalizeStatusKey("PENDING_CLIENT_REVIEW")).toBe("awaiting_client");
    expect(normalizeStatusKey("Admin review")).toBe("in_review");
    expect(normalizeStatusKey("OVERDUE")).toBe("overdue");
  });

  it("exposes client-safe vocabulary", () => {
    expect(getClientStatusLabel("draft")).toBe("Planning");
    expect(getClientStatusLabel("completed")).toBe("Delivered");
    expect(isClientVisibleStatus("blocked")).toBe(false);
    expect(isClientVisibleStatus("failed")).toBe(false);
    expect(CLIENT_STATUS_LABELS.changes_requested).toBeNull();
  });
});
