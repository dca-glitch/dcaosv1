/**
 * Invoice / recurring invoice editor hashes.
 * Hub: `#/invoices`
 * Invoice create/edit: `#/invoices/new`, `#/invoices/e/{id}/edit`
 * Recurring: `#/invoices/recurring/new`, `#/invoices/recurring/e/{id}/edit`
 */

export type InvoiceEditorRoute =
  | { kind: "hub" }
  | { kind: "invoice-new" }
  | { kind: "invoice-edit"; id: string }
  | { kind: "recurring-new" }
  | { kind: "recurring-edit"; id: string };

function stripHash(hash: string): string {
  return hash.replace(/^#\/?/, "").replace(/\/+$/, "").split("?")[0] ?? "";
}

export function parseInvoiceEditorHash(hash: string): InvoiceEditorRoute {
  const value = stripHash(hash);
  if (!value || value === "invoices") {
    return { kind: "hub" };
  }
  if (value === "invoices/new") {
    return { kind: "invoice-new" };
  }
  if (value === "invoices/recurring/new") {
    return { kind: "recurring-new" };
  }
  const invoiceEdit = /^invoices\/e\/([^/]+)\/edit$/.exec(value);
  if (invoiceEdit?.[1]) {
    return { kind: "invoice-edit", id: decodeURIComponent(invoiceEdit[1]) };
  }
  const recurringEdit = /^invoices\/recurring\/e\/([^/]+)\/edit$/.exec(value);
  if (recurringEdit?.[1]) {
    return { kind: "recurring-edit", id: decodeURIComponent(recurringEdit[1]) };
  }
  if (value.startsWith("invoices/")) {
    return { kind: "hub" };
  }
  return { kind: "hub" };
}

export function buildInvoiceEditorHash(route: InvoiceEditorRoute): string {
  switch (route.kind) {
    case "hub":
      return "#/invoices";
    case "invoice-new":
      return "#/invoices/new";
    case "invoice-edit":
      return `#/invoices/e/${encodeURIComponent(route.id)}/edit`;
    case "recurring-new":
      return "#/invoices/recurring/new";
    case "recurring-edit":
      return `#/invoices/recurring/e/${encodeURIComponent(route.id)}/edit`;
  }
}
