import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TablePaginationBar } from "./TablePaginationBar";

afterEach(() => {
  cleanup();
});

describe("TablePaginationBar", () => {
  it("renders nothing when total is zero", () => {
    const { container } = render(
      <TablePaginationBar onNext={() => undefined} onPrev={() => undefined} page={1} perPage={10} total={0} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("announces range and page, and disables previous on first page", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(
      <TablePaginationBar onNext={onNext} onPrev={onPrev} page={1} perPage={10} total={25} />
    );

    expect(screen.getByText(/1–10 of 25\. Page 1\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrev).not.toHaveBeenCalled();
  });

  it("disables next on the last page", () => {
    render(
      <TablePaginationBar onNext={() => undefined} onPrev={() => undefined} page={3} perPage={10} total={25} />
    );
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous page" })).not.toBeDisabled();
    expect(screen.getByText(/21–25 of 25\. Page 3\./)).toBeInTheDocument();
  });
});
