import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Table } from "./Table";

afterEach(() => {
  cleanup();
});

describe("Table simple adapter", () => {
  it("aligns headers and cells and forwards aria-label to the table", () => {
    render(
      <Table
        aria-label="Demo records"
        headers={[
          { label: "Name", align: "left" },
          { label: "Amount", align: "right" }
        ]}
        rows={[
          {
            key: "1",
            cells: ["Alpha", "$10"]
          }
        ]}
      />
    );

    expect(screen.getByRole("table", { name: "Demo records" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Amount" })).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("$10")).toBeInTheDocument();
  });

  it("renders accessible Actions when header label is empty", () => {
    render(
      <Table
        aria-label="Actionable rows"
        headers={[{ label: "Item" }, { label: "" }]}
        rows={[{ key: "r1", cells: ["One", <button key="a" type="button">Edit</button>] }]}
      />
    );

    expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("keeps header row when there are no data rows", () => {
    render(
      <Table aria-label="Empty set" headers={[{ label: "Col" }]} rows={[]} />
    );
    expect(screen.getByRole("table", { name: "Empty set" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Col" })).toBeInTheDocument();
  });

  it("marks the scrollport as a named region when labeled", () => {
    const { container } = render(
      <Table aria-label="Scroll demo" headers={[{ label: "A" }]} rows={[]} />
    );
    const region = container.querySelector('[role="region"]');
    expect(region).not.toBeNull();
    expect(region?.getAttribute("tabindex")).toBe("0");
    expect(region?.getAttribute("aria-label")).toContain("scrollable");
  });
});
