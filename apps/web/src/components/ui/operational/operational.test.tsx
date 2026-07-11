import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionQueue } from "./ActionQueue";
import { BulkActionToolbar } from "./BulkActionToolbar";
import { ExportButton } from "./ExportButton";
import { FilterBar } from "./FilterBar";
import { StatusSummaryBar } from "./StatusSummaryBar";

afterEach(() => {
  cleanup();
});

describe("ActionQueue", () => {
  it("renders items and invokes onAction", () => {
    const onAction = vi.fn();
    render(
      <ActionQueue
        items={[
          {
            id: "1",
            title: "Approve deliverable",
            description: "Client waiting",
            priority: "high",
          },
        ]}
        onAction={onAction}
      />,
    );

    expect(screen.getByRole("list", { name: "Action queue" })).toBeTruthy();
    expect(screen.getByText("Approve deliverable")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction.mock.calls[0]?.[0]?.id).toBe("1");
  });

  it("shows empty message when there are no items", () => {
    render(<ActionQueue emptyMessage="Nothing queued." items={[]} />);
    expect(screen.getByText("Nothing queued.")).toBeTruthy();
  });
});

describe("BulkActionToolbar", () => {
  it("hides when selectionCount is zero", () => {
    const { container } = render(
      <BulkActionToolbar
        actions={[{ id: "archive", label: "Archive", onClick: vi.fn() }]}
        selectionCount={0}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows selection count and runs action callbacks", () => {
    const onArchive = vi.fn();
    const onClear = vi.fn();
    render(
      <BulkActionToolbar
        actions={[{ id: "archive", label: "Archive", onClick: onArchive }]}
        onClear={onClear}
        selectionCount={3}
      />,
    );

    expect(screen.getByText("3 selected")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe("FilterBar", () => {
  it("preserves accessible name and filter labels", () => {
    const onChange = vi.fn();
    render(
      <FilterBar
        ariaLabel="Projects filter"
        onChange={onChange}
        options={[
          { value: "active", label: "Active" },
          { value: "archived", label: "Archived" },
          { value: "all", label: "All" },
        ]}
        value="active"
      />,
    );

    expect(screen.getByRole("group", { name: "Projects filter" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Active" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Archived" }));
    expect(onChange).toHaveBeenCalledWith("archived");
  });
});

describe("ExportButton", () => {
  it("calls onExport and does not invent success UI", () => {
    const onExport = vi.fn();
    render(<ExportButton disabled={false} label="Export CSV" onExport={onExport} />);
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(onExport).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/success/i)).toBeNull();
  });
});

describe("StatusSummaryBar", () => {
  it("renders compact status count chips", () => {
    render(
      <StatusSummaryBar
        ariaLabel="Visible run status counts"
        items={[
          { key: "COMPLETED", label: "COMPLETED", count: 2 },
          { key: "FAILED", label: "FAILED", count: 1 },
        ]}
      />,
    );
    const group = screen.getByRole("group", { name: "Visible run status counts" });
    expect(group.textContent).toContain("COMPLETED");
    expect(group.textContent).toContain("2");
    expect(group.textContent).toContain("FAILED");
  });
});
