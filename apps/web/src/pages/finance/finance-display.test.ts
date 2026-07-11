import { describe, expect, it } from "vitest";
import {
  buildBillStatusSummary,
  buildCreditNoteStatusSummary,
  buildInvoiceStatusSummary,
  buildRecurringStatusSummary,
  financeDueDateClassName,
  formatFinanceDateLabel,
  formatFinanceMoney,
  isInvoiceOverdue
} from "./finance-display";

describe("isInvoiceOverdue", () => {
  const now = new Date("2026-07-11T12:00:00.000Z");

  it("marks issued invoices with past due dates as overdue", () => {
    expect(
      isInvoiceOverdue(
        { status: "ISSUED", dueDate: "2026-07-01T00:00:00.000Z", isArchived: false },
        now
      )
    ).toBe(true);
  });

  it("does not mark draft, paid, voided, or archived invoices as overdue", () => {
    expect(
      isInvoiceOverdue({ status: "DRAFT", dueDate: "2026-07-01T00:00:00.000Z", isArchived: false }, now)
    ).toBe(false);
    expect(
      isInvoiceOverdue({ status: "PAID", dueDate: "2026-07-01T00:00:00.000Z", isArchived: false }, now)
    ).toBe(false);
    expect(
      isInvoiceOverdue({ status: "VOIDED", dueDate: "2026-07-01T00:00:00.000Z", isArchived: false }, now)
    ).toBe(false);
    expect(
      isInvoiceOverdue({ status: "ISSUED", dueDate: "2026-07-01T00:00:00.000Z", isArchived: true }, now)
    ).toBe(false);
  });

  it("does not mark future due dates as overdue", () => {
    expect(
      isInvoiceOverdue(
        { status: "ISSUED", dueDate: "2026-08-01T00:00:00.000Z", isArchived: false },
        now
      )
    ).toBe(false);
  });
});

describe("financeDueDateClassName", () => {
  it("applies overdue class only when overdue", () => {
    expect(financeDueDateClassName(true)).toBe("finance-due-date is-overdue");
    expect(financeDueDateClassName(false)).toBe("finance-due-date");
  });
});

describe("buildInvoiceStatusSummary", () => {
  const now = new Date("2026-07-11T12:00:00.000Z");

  it("counts statuses from loaded invoices without inventing totals", () => {
    const items = buildInvoiceStatusSummary(
      [
        { status: "DRAFT", dueDate: null, isArchived: false },
        { status: "ISSUED", dueDate: "2026-07-01T00:00:00.000Z", isArchived: false },
        { status: "ISSUED", dueDate: "2026-08-01T00:00:00.000Z", isArchived: false },
        { status: "PAID", dueDate: "2026-06-01T00:00:00.000Z", isArchived: false },
        { status: "ISSUED", dueDate: "2026-06-01T00:00:00.000Z", isArchived: true }
      ],
      now
    );

    expect(items).toEqual([
      { key: "draft", label: "Draft", count: 1 },
      { key: "issued", label: "Issued", count: 2 },
      { key: "overdue", label: "Overdue", count: 1 },
      { key: "paid", label: "Paid", count: 1 },
      { key: "archived", label: "Archived", count: 1 }
    ]);
  });
});

describe("buildRecurringStatusSummary", () => {
  it("counts active, paused, and archived schedules", () => {
    expect(
      buildRecurringStatusSummary([
        { isActive: true, isArchived: false },
        { isActive: false, isArchived: false },
        { isActive: true, isArchived: true }
      ])
    ).toEqual([
      { key: "active", label: "Active", count: 1 },
      { key: "paused", label: "Paused", count: 1 },
      { key: "archived", label: "Archived", count: 1 }
    ]);
  });
});

describe("buildBillStatusSummary", () => {
  it("counts active and archived bills from loaded rows", () => {
    expect(buildBillStatusSummary([{ isArchived: false }, { isArchived: true }, { isArchived: false }])).toEqual([
      { key: "active", label: "Active", count: 2 },
      { key: "archived", label: "Archived", count: 1 },
      { key: "all", label: "All", count: 3 }
    ]);
  });
});

describe("buildCreditNoteStatusSummary", () => {
  it("counts credit note statuses from loaded rows", () => {
    expect(
      buildCreditNoteStatusSummary([
        { status: "DRAFT", isArchived: false },
        { status: "ISSUED", isArchived: false },
        { status: "VOIDED", isArchived: false },
        { status: "DRAFT", isArchived: true }
      ])
    ).toEqual([
      { key: "draft", label: "Draft", count: 1 },
      { key: "issued", label: "Issued", count: 1 },
      { key: "voided", label: "Voided", count: 1 },
      { key: "archived", label: "Archived", count: 1 },
      { key: "total", label: "Total", count: 4 }
    ]);
  });
});

describe("formatFinanceDateLabel / formatFinanceMoney", () => {
  it("formats empty dates and money without changing cents math", () => {
    expect(formatFinanceDateLabel(null)).toBe("Not set");
    expect(formatFinanceMoney(1250, "USD")).toContain("12.50");
  });
});
