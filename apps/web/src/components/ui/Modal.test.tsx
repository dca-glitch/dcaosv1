import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Modal } from "./Modal";

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

describe("canonical ui/Modal", () => {
  it("does not render when closed", () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Closed dialog">
        Body
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders title with role=dialog, aria-modal, and aria-labelledby", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Invoice editor">
        Body copy
      </Modal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Invoice editor" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    expect(screen.getByText("Body copy")).toBeTruthy();
  });

  it("renders eyebrow as subtitle when provided", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Client" eyebrow="Edit">
        Body
      </Modal>,
    );
    expect(screen.getByText("Edit")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Client" }).getAttribute("aria-describedby")).toBeTruthy();
  });

  it("maps description to subtitle when eyebrow is absent", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Confirm" description="This cannot be undone.">
        Body
      </Modal>,
    );
    expect(screen.getByText("This cannot be undone.")).toBeTruthy();
  });

  it("renders footer content", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="T" footer={<button type="button">Save</button>}>
        Body
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("closes via close button", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Closeable">
        Body
      </Modal>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close modal" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Escapable">
        Body
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on backdrop click when allowed", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Backdrop">
        Body
      </Modal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Backdrop" });
    const backdrop = dialog.parentElement;
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close on backdrop click when closeOnBackdrop is false", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Locked" closeOnBackdrop={false}>
        Body
      </Modal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Locked" });
    fireEvent.click(dialog.parentElement!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not close when clicking inside the dialog panel", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Inside">
        <button type="button">Inner</button>
      </Modal>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Inner" }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("locks body scroll while open and restores on unmount", async () => {
    const { unmount } = render(
      <Modal isOpen onClose={vi.fn()} title="Scroll lock">
        Body
      </Modal>,
    );
    await waitFor(() => {
      expect(document.body.style.overflow).toBe("hidden");
    });
    unmount();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("portals into document.body", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Portaled">
        Body
      </Modal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Portaled" });
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("applies product size mapping classes", () => {
    const { rerender } = render(
      <Modal isOpen onClose={vi.fn()} title="Sized" size="sm">
        Body
      </Modal>,
    );
    expect(screen.getByRole("dialog").className).toContain("max-w-md");

    rerender(
      <Modal isOpen onClose={vi.fn()} title="Sized" size="md">
        Body
      </Modal>,
    );
    expect(screen.getByRole("dialog").className).toContain("max-w-2xl");

    rerender(
      <Modal isOpen onClose={vi.fn()} title="Sized" size="lg">
        Body
      </Modal>,
    );
    expect(screen.getByRole("dialog").className).toContain("max-w-5xl");
  });

  it("moves initial focus into the dialog", async () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Focus">
        <button type="button">Action</button>
      </Modal>,
    );
    await waitFor(() => {
      const active = document.activeElement;
      expect(active).toBeTruthy();
      expect(screen.getByRole("dialog").contains(active)).toBe(true);
    });
  });

  it("keeps Tab / Shift+Tab focus inside the dialog", async () => {
    render(
      <Modal
        isOpen
        onClose={vi.fn()}
        title="Trap"
        footer={<button type="button">Confirm</button>}
      >
        <button type="button">First</button>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Trap" });
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    fireEvent.keyDown(document, { key: "Tab" });
    expect(dialog.contains(document.activeElement)).toBe(true);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("returns focus to the trigger on close", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Open";
    document.body.appendChild(trigger);
    trigger.focus();

    const onClose = vi.fn();
    const { unmount } = render(
      <Modal isOpen onClose={onClose} title="Return focus">
        Body
      </Modal>,
    );
    await waitFor(() => {
      expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
    });
    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
