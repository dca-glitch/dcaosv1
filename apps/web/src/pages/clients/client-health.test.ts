import { describe, expect, it } from "vitest";
import { deriveClientHealth, formatClientHealthDetail } from "./client-health";

const now = new Date("2026-07-11T12:00:00.000Z");

describe("deriveClientHealth", () => {
  it("marks archived clients as archived regardless of projects", () => {
    const health = deriveClientHealth(
      { id: "c1", isArchived: true, projectCount: 2 },
      [
        {
          clientId: "c1",
          isArchived: false,
          status: "Active",
          dueDate: "2026-01-01",
          openTaskCount: 3
        }
      ],
      now
    );
    expect(health).toEqual({
      status: "archived",
      activeProjectCount: 0,
      openTaskCount: 0,
      overdueProjectCount: 0
    });
  });

  it("marks clients with no active projects as idle", () => {
    const health = deriveClientHealth(
      { id: "c1", isArchived: false, projectCount: 1 },
      [
        {
          clientId: "c1",
          isArchived: true,
          status: "Archived",
          dueDate: null,
          openTaskCount: 0
        }
      ],
      now
    );
    expect(health.status).toBe("idle");
    expect(health.activeProjectCount).toBe(0);
    expect(formatClientHealthDetail(health)).toBe("No active projects");
  });

  it("marks clients with overdue active projects as overdue", () => {
    const health = deriveClientHealth(
      { id: "c1", isArchived: false, projectCount: 1 },
      [
        {
          clientId: "c1",
          isArchived: false,
          status: "Active",
          dueDate: "2026-06-01T00:00:00.000Z",
          openTaskCount: 2
        }
      ],
      now
    );
    expect(health.status).toBe("overdue");
    expect(health.overdueProjectCount).toBe(1);
    expect(health.openTaskCount).toBe(2);
    expect(formatClientHealthDetail(health)).toContain("overdue");
  });

  it("marks clients with active non-overdue projects as active", () => {
    const health = deriveClientHealth(
      { id: "c1", isArchived: false, projectCount: 1 },
      [
        {
          clientId: "c1",
          isArchived: false,
          status: "Active",
          dueDate: "2026-08-01T00:00:00.000Z",
          openTaskCount: 1
        },
        {
          clientId: "other",
          isArchived: false,
          status: "Active",
          dueDate: "2026-01-01T00:00:00.000Z",
          openTaskCount: 9
        }
      ],
      now
    );
    expect(health.status).toBe("active");
    expect(health.activeProjectCount).toBe(1);
    expect(health.openTaskCount).toBe(1);
    expect(health.overdueProjectCount).toBe(0);
  });

  it("treats only completed projects as idle and not overdue", () => {
    const health = deriveClientHealth(
      { id: "c1", isArchived: false, projectCount: 1 },
      [
        {
          clientId: "c1",
          isArchived: false,
          status: "Completed",
          dueDate: "2026-01-01T00:00:00.000Z",
          openTaskCount: 0
        }
      ],
      now
    );
    expect(health.status).toBe("idle");
    expect(health.activeProjectCount).toBe(0);
    expect(health.overdueProjectCount).toBe(0);
  });
});
