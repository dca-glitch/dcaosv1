import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Input, Textarea, Select } from "./FormFields";

afterEach(() => {
  cleanup();
});

describe("FormFields accessibility", () => {
  it("associates Input error text via aria-describedby", () => {
    render(<Input error="Required field" id="client-name" label="Client name" />);
    const input = screen.getByLabelText("Client name");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("client-name-error");
    expect(document.getElementById("client-name-error")?.textContent).toBe("Required field");
  });

  it("associates Textarea helper text via aria-describedby", () => {
    render(<Textarea helperText="Keep it short" id="notes" label="Notes" />);
    const field = screen.getByLabelText("Notes");
    expect(field.getAttribute("aria-describedby")).toBe("notes-helper");
    expect(document.getElementById("notes-helper")?.textContent).toBe("Keep it short");
  });

  it("associates Select error text via aria-describedby", () => {
    render(
      <Select
        error="Pick one"
        id="status"
        label="Status"
        options={[{ value: "open", label: "Open" }]}
      />
    );
    const field = screen.getByLabelText("Status");
    expect(field.getAttribute("aria-describedby")).toBe("status-error");
    expect(document.getElementById("status-error")?.textContent).toBe("Pick one");
  });
});
