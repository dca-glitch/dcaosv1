import { render, screen } from "@testing-library/react";
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
import { StatusBadge, getStatusTone as uiGetStatusTone } from "./StatusBadge";

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
    expect(normalizeStatusKey("SUBMITTED")).toBe("completed");
  });

  it("exposes client-safe vocabulary", () => {
    expect(getClientStatusLabel("draft")).toBe("Planning");
    expect(getClientStatusLabel("completed")).toBe("Delivered");
    expect(isClientVisibleStatus("blocked")).toBe(false);
    expect(isClientVisibleStatus("failed")).toBe(false);
    expect(CLIENT_STATUS_LABELS.changes_requested).toBeNull();
  });
});

describe("StatusBadge public contract", () => {
  it("uses canonical key, default label, data-status, and token style", () => {
    const { container } = render(<StatusBadge status="DRAFT" />);
    const pill = container.querySelector(".ds-status-badge");
    expect(pill).not.toBeNull();
    expect(pill?.getAttribute("data-status")).toBe("draft");
    expect(screen.getByText("Draft")).toBeTruthy();
    expect(pill?.getAttribute("style") ?? "").toContain("var(--status-draft-text)");
  });

  it("resolves aliases to canonical data-status and label", () => {
    const { container } = render(<StatusBadge status="DELIVERED" />);
    expect(container.querySelector("[data-status='completed']")).not.toBeNull();
    expect(screen.getByText("Completed")).toBeTruthy();
  });

  it("uses neutral unknown fallback for unrecognized status", () => {
    const { container } = render(<StatusBadge status="WEIRD_INTERNAL_ENUM" />);
    const pill = container.querySelector(".ds-status-badge");
    expect(pill?.getAttribute("data-status")).toBe("unknown");
    expect(screen.getByText("Weird internal enum")).toBeTruthy();
    expect(pill?.getAttribute("style") ?? "").toContain("var(--status-draft-");
  });

  it("allows displayLabel without changing tone/data-status", () => {
    const { container, rerender } = render(
      <StatusBadge displayLabel="Sent to client" status="AWAITING_CLIENT" />
    );
    const pill = container.querySelector(".ds-status-badge");
    expect(screen.getByText("Sent to client")).toBeTruthy();
    expect(pill?.getAttribute("data-status")).toBe("awaiting_client");
    const toneStyle = pill?.getAttribute("style") ?? "";

    rerender(<StatusBadge status="AWAITING_CLIENT" />);
    const canonical = container.querySelector(".ds-status-badge");
    expect(canonical?.getAttribute("data-status")).toBe("awaiting_client");
    expect(canonical?.getAttribute("style") ?? "").toBe(toneStyle);
    expect(screen.getByText("Pending approval")).toBeTruthy();
  });

  it("forwards className", () => {
    const { container } = render(<StatusBadge className="extra-pill" status="APPROVED" />);
    expect(container.querySelector(".ds-status-badge.extra-pill")).not.toBeNull();
  });
});

describe("publishing status labels", () => {
  it("maps publishing enums to unambiguous display labels", async () => {
    const { getPublishingStatusLabel } = await import("../../design-system/status");
    expect(getPublishingStatusLabel("draft_prepared")).toBe("Draft prepared");
    expect(getPublishingStatusLabel("provider_disabled")).toBe("Publishing disabled");
    expect(getPublishingStatusLabel("published")).toBe("Published");
    expect(getPublishingStatusLabel("credentials_missing")).toBe("Credentials missing");
    expect(getPublishingStatusLabel("unknown_enum")).toBeNull();
  });
});
