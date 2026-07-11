import { describe, expect, it } from "vitest";
import {
  buildClientArchiveConfirm,
  buildClientRestoreConfirm,
  buildProjectArchiveConfirm,
  buildProjectRestoreConfirm
} from "./archive-confirm-copy";

describe("archive-confirm-copy", () => {
  it("blocks client archive when projects exist", () => {
    const copy = buildClientArchiveConfirm({ name: "Acme", projectCount: 2 });
    expect(copy).toMatchObject({
      blocked: true,
      title: "Archive blocked"
    });
    expect("description" in copy && copy.description).toContain("active projects");
  });

  it("builds explicit client archive confirmation when eligible", () => {
    const copy = buildClientArchiveConfirm({ name: "Acme", projectCount: 0 });
    expect(copy).toMatchObject({
      title: "Archive Acme?",
      confirmLabel: "Archive",
      danger: true
    });
    expect("description" in copy && copy.description).toContain("restored later");
  });

  it("builds client restore confirmation with reactivation clarity", () => {
    const copy = buildClientRestoreConfirm({ name: "Acme" });
    expect(copy.title).toBe("Restore Acme?");
    expect(copy.description).toContain("active clients list");
    expect(copy.confirmLabel).toBe("Restore");
    expect(copy.danger).toBe(false);
  });

  it("includes task impact on project archive and restore", () => {
    const archive = buildProjectArchiveConfirm({
      name: "SEO Retainer",
      openTaskCount: 2,
      taskCount: 5
    });
    expect(archive.title).toBe("Archive SEO Retainer?");
    expect(archive.description).toContain("2 open of 5 total");

    const restore = buildProjectRestoreConfirm({
      name: "SEO Retainer",
      openTaskCount: 2,
      taskCount: 5
    });
    expect(restore.title).toBe("Restore SEO Retainer?");
    expect(restore.description).toContain("active projects list");
    expect(restore.description).toContain("2 open of 5 total");
  });
});
