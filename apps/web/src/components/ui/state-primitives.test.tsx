import { describe, expect, it, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";

afterEach(() => {
  cleanup();
});

describe("canonical state primitives", () => {
  it("LoadingState announces politely with optional inline variant", () => {
    const { rerender } = render(<LoadingState label="Loading projects" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading projects");
    rerender(<LoadingState label="Loading section" variant="inline" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading section");
  });

  it("EmptyState inline avoids double periods when title already ends with one", () => {
    render(<EmptyState title="No briefs found." message="Try another filter." variant="inline" />);
    expect(screen.getByText(/No briefs found\./)).toBeInTheDocument();
    expect(screen.queryByText(/No briefs found\.\./)).not.toBeInTheDocument();
  });

  it("EmptyState exposes data-empty-kind for filtered and first-use", () => {
    const { rerender, container } = render(
      <EmptyState kind="filtered" message="Try another filter." title="No matches" variant="inline" />
    );
    expect(container.querySelector('[data-empty-kind="filtered"]')).not.toBeNull();
    rerender(
      <EmptyState kind="first-use" message="Create your first record." title="No items yet" variant="inline" />
    );
    expect(container.querySelector('[data-empty-kind="first-use"]')).not.toBeNull();
  });

  it("EmptyState inline supports message-only copy without inventing a title", () => {
    const { container } = render(
      <EmptyState kind="first-use" message="No deliverables yet. Package approved assets when ready." variant="inline" />
    );
    expect(container.querySelector(".inline-empty-title")).toBeNull();
    expect(screen.getByText("No deliverables yet. Package approved assets when ready.")).toBeInTheDocument();
  });

  it("ErrorState supports retry action", () => {
    render(
      <ErrorState
        action={<button type="button">Try again</button>}
        message="Network failed"
        title="Unavailable"
      />
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("ErrorState page and inline variants both expose an alert", () => {
    const { rerender, container } = render(
      <ErrorState message="Failed to load" title="Unavailable" variant="page" />
    );
    expect(container.querySelector(".error-state-panel")).not.toBeNull();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    rerender(<ErrorState message="Failed to load" title="Unavailable" variant="inline" />);
    expect(container.querySelector(".error-state-inline")).not.toBeNull();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
