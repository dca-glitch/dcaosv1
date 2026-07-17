import { describe, expect, it } from "vitest";
import { buildInvoiceEditorHash, parseInvoiceEditorHash } from "./invoice-editor-hash";

describe("invoice-editor-hash", () => {
  it("parses invoice and recurring editor routes", () => {
    expect(parseInvoiceEditorHash("#/invoices")).toEqual({ kind: "hub" });
    expect(parseInvoiceEditorHash("#/invoices/new")).toEqual({ kind: "invoice-new" });
    expect(parseInvoiceEditorHash("#/invoices/e/inv1/edit")).toEqual({ kind: "invoice-edit", id: "inv1" });
    expect(parseInvoiceEditorHash("#/invoices/recurring/new")).toEqual({ kind: "recurring-new" });
    expect(parseInvoiceEditorHash("#/invoices/recurring/e/r1/edit")).toEqual({
      kind: "recurring-edit",
      id: "r1"
    });
  });

  it("builds matching hashes", () => {
    expect(buildInvoiceEditorHash({ kind: "hub" })).toBe("#/invoices");
    expect(buildInvoiceEditorHash({ kind: "invoice-new" })).toBe("#/invoices/new");
    expect(buildInvoiceEditorHash({ kind: "recurring-edit", id: "r1" })).toBe(
      "#/invoices/recurring/e/r1/edit"
    );
  });
});
