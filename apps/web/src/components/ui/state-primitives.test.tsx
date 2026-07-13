import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";

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
});
