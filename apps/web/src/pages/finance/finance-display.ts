/**
 * Finance Lite display helpers — overdue styling and status strips only.
 * Does not alter totals, tax, discount, or payment calculation logic.
 */

export type InvoiceOverdueInput = {
  status: string;
  dueDate: string | null;
  isArchived: boolean;
};

export type RecurringSummaryInput = {
  isActive: boolean;
  isArchived: boolean;
};

export type BillSummaryInput = {
  isArchived: boolean;
};

export type CreditNoteSummaryInput = {
  status: string;
  isArchived: boolean;
};

export type FinanceStatusSummaryItem = {
  key: string;
  label: string;
  count: number;
};

const SETTLED_INVOICE_STATUSES = new Set([
  "PAID",
  "VOIDED",
  "CANCELLED",
  "CANCELED",
  "UNCOLLECTIBLE"
]);

function normalizeStatus(status: string): string {
  return status.trim().toUpperCase();
}

/** True when an open invoice's due date is in the past (UI cue only). */
export function isInvoiceOverdue(invoice: InvoiceOverdueInput, now: Date = new Date()): boolean {
  if (invoice.isArchived || !invoice.dueDate) {
    return false;
  }

  const status = normalizeStatus(invoice.status);
  if (status === "DRAFT" || SETTLED_INVOICE_STATUSES.has(status)) {
    return false;
  }

  const due = new Date(invoice.dueDate);
  if (Number.isNaN(due.getTime())) {
    return false;
  }

  return due.getTime() < now.getTime();
}

/** Coral text class for overdue due dates — never apply to the whole row. */
export function financeDueDateClassName(overdue: boolean): string {
  return overdue ? "finance-due-date is-overdue" : "finance-due-date";
}

export function formatFinanceDateLabel(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export function formatFinanceMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat(undefined, { currency, style: "currency" }).format(cents / 100);
}

export function buildInvoiceStatusSummary(
  invoices: InvoiceOverdueInput[],
  now: Date = new Date()
): FinanceStatusSummaryItem[] {
  let draft = 0;
  let issued = 0;
  let paid = 0;
  let overdue = 0;
  let archived = 0;

  for (const invoice of invoices) {
    if (invoice.isArchived) {
      archived += 1;
      continue;
    }

    const status = normalizeStatus(invoice.status);
    if (status === "DRAFT") {
      draft += 1;
    } else if (status === "PAID") {
      paid += 1;
    } else if (status === "ISSUED") {
      issued += 1;
    }

    if (isInvoiceOverdue(invoice, now)) {
      overdue += 1;
    }
  }

  return [
    { key: "draft", label: "Draft", count: draft },
    { key: "issued", label: "Issued", count: issued },
    { key: "overdue", label: "Overdue", count: overdue },
    { key: "paid", label: "Paid", count: paid },
    { key: "archived", label: "Archived", count: archived }
  ];
}

export function buildRecurringStatusSummary(items: RecurringSummaryInput[]): FinanceStatusSummaryItem[] {
  let active = 0;
  let paused = 0;
  let archived = 0;

  for (const item of items) {
    if (item.isArchived) {
      archived += 1;
    } else if (item.isActive) {
      active += 1;
    } else {
      paused += 1;
    }
  }

  return [
    { key: "active", label: "Active", count: active },
    { key: "paused", label: "Paused", count: paused },
    { key: "archived", label: "Archived", count: archived }
  ];
}

export function buildBillStatusSummary(bills: BillSummaryInput[]): FinanceStatusSummaryItem[] {
  let active = 0;
  let archived = 0;

  for (const bill of bills) {
    if (bill.isArchived) {
      archived += 1;
    } else {
      active += 1;
    }
  }

  return [
    { key: "active", label: "Active", count: active },
    { key: "archived", label: "Archived", count: archived },
    { key: "all", label: "All", count: bills.length }
  ];
}

export function buildCreditNoteStatusSummary(notes: CreditNoteSummaryInput[]): FinanceStatusSummaryItem[] {
  let draft = 0;
  let issued = 0;
  let voided = 0;
  let archived = 0;

  for (const note of notes) {
    if (note.isArchived) {
      archived += 1;
      continue;
    }

    const status = normalizeStatus(note.status);
    if (status === "DRAFT") {
      draft += 1;
    } else if (status === "ISSUED") {
      issued += 1;
    } else if (status === "VOIDED") {
      voided += 1;
    }
  }

  return [
    { key: "draft", label: "Draft", count: draft },
    { key: "issued", label: "Issued", count: issued },
    { key: "voided", label: "Voided", count: voided },
    { key: "archived", label: "Archived", count: archived },
    { key: "total", label: "Total", count: notes.length }
  ];
}
