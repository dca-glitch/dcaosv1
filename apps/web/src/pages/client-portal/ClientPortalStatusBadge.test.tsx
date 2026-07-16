import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ClientPortalStatusBadge } from "./ClientPortalStatusBadge";
import { toBriefStatusPresentation, toClientPortalStatusLabel } from "./client-portal-status";

afterEach(() => {
  cleanup();
});

describe("ClientPortalStatusBadge", () => {
  it.each([
    ["ADMIN_REVIEW", "Under review", "in_review"],
    ["SENT_TO_CLIENT", "Shared with you", "awaiting_client"],
    ["PENDING_CLIENT_REVIEW", "Needs your review", "awaiting_client"],
    ["FINAL", "Complete", "completed"],
    ["DELIVERED", "Delivered", "completed"],
    ["APPROVED", "Approved", "approved"],
  ] as const)(
    "renders %s with client-safe label and semantic data-status",
    (status, label, dataStatus) => {
      const { container } = render(<ClientPortalStatusBadge status={status} />);
      const pill = container.querySelector(".ds-status-badge");
      expect(pill?.textContent).toContain(label);
      expect(pill?.getAttribute("data-status")).toBe(dataStatus);
    }
  );

  it("hides blocked / failed / changes_requested and unknown internals", () => {
    for (const status of ["BLOCKED", "FAILED", "CHANGES_REQUESTED", "OPENROUTER_JOB"]) {
      const { container } = render(<ClientPortalStatusBadge status={status} />);
      expect(container.querySelector(".ds-status-badge")).toBeNull();
      expect(toClientPortalStatusLabel(status)).toBeNull();
      cleanup();
    }
  });

  it("keeps LABEL_FIRST tone on semantic status, not display text", () => {
    const { container } = render(<ClientPortalStatusBadge status="ADMIN_REVIEW" />);
    const pill = container.querySelector(".ds-status-badge");
    expect(pill?.getAttribute("data-status")).toBe("in_review");
    expect(pill?.textContent).toContain("Under review");
    expect(pill?.getAttribute("data-status")).not.toBe("unknown");
  });
});

describe("brief status surfaces", () => {
  it("preserves admin and client brief labels for lifecycle statuses", () => {
    expect(toBriefStatusPresentation("DRAFT", "admin").label).toBe("Draft");
    expect(toBriefStatusPresentation("DRAFT", "client").label).toBe("Draft");
    expect(toBriefStatusPresentation("AWAITING_CLIENT", "admin").label).toBe("Sent to client");
    expect(toBriefStatusPresentation("AWAITING_CLIENT", "client").label).toBe("Awaiting your input");
    expect(toBriefStatusPresentation("SUBMITTED", "admin").label).toBe("Submitted");
    expect(toBriefStatusPresentation("SUBMITTED", "client").label).toBe("Submitted");
  });
});
