import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./client-portal-api", async () => {
  const actual = await vi.importActual<typeof import("./client-portal-api")>("./client-portal-api");
  return {
    ...actual,
    clientPortalApiRequest: vi.fn(async () => ({
      ok: true as const,
      data: {
        count: 1,
        pendingApprovals: [
          {
            id: "deliverable-1",
            title: "[SMOKE] fixture approve-row",
            projectId: "project-1",
            projectName: "Fixture Project",
            status: "PENDING_CLIENT_REVIEW",
            createdAt: "2026-07-11T00:00:00.000Z",
            updatedAt: "2026-07-11T00:00:00.000Z"
          }
        ]
      }
    })),
    navigateToClientPortalHash: vi.fn()
  };
});

import { PendingApprovalsPage } from "./PendingApprovalsPage";

afterEach(() => {
  cleanup();
});

describe("PendingApprovalsPage", () => {
  it("exposes a stable pending-approval row locator with Phase 6 attention layout", async () => {
    render(<PendingApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("pending-approval-record")).toBeTruthy();
    });

    const row = screen.getByTestId("pending-approval-record");
    expect(row.className).toContain("client-portal-attention-row");
    expect(row.className).toContain("cf-record");
    expect(screen.getByText("[SMOKE] fixture approve-row")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Review & Approve" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Pending approval articles" })).toBeTruthy();
  });
});
