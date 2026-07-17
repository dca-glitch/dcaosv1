import { describe, expect, it } from "vitest";
import { buildEntityEditorHash, parseEntityEditorHash } from "./entity-editor-hash";

describe("entity-editor-hash", () => {
  it("parses hub, new, and edit for clients", () => {
    expect(parseEntityEditorHash("#/clients", "clients")).toEqual({ kind: "hub" });
    expect(parseEntityEditorHash("#/clients/new", "clients")).toEqual({ kind: "new" });
    expect(parseEntityEditorHash("#/clients/e/abc-123/edit", "clients")).toEqual({
      kind: "edit",
      id: "abc-123"
    });
  });

  it("builds matching hashes", () => {
    expect(buildEntityEditorHash("tasks", { kind: "hub" })).toBe("#/tasks");
    expect(buildEntityEditorHash("tasks", { kind: "new" })).toBe("#/tasks/new");
    expect(buildEntityEditorHash("tasks", { kind: "edit", id: "t1" })).toBe("#/tasks/e/t1/edit");
  });

  it("treats unknown nested paths as hub", () => {
    expect(parseEntityEditorHash("#/invoices/weird", "invoices")).toEqual({ kind: "hub" });
  });

  it("supports hyphenated bases", () => {
    expect(parseEntityEditorHash("#/credit-notes/new", "credit-notes")).toEqual({ kind: "new" });
    expect(parseEntityEditorHash("#/credit-notes/e/cn1/edit", "credit-notes")).toEqual({
      kind: "edit",
      id: "cn1"
    });
  });
});
