import { Fragment, type FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import { PageHeader, StatusBadge } from "../../components/ui";
import type { ClientSummary } from "../clients/ClientsPage";
import type { InvoiceItemSummary } from "../invoice-items/InvoiceItemsPage";
import type { ProjectSummary } from "../projects/ProjectsPage";

export type InvoiceLineItemFormValues = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  sortOrder: number;
};

export type InvoicePaymentSummary = {
  id: string;
  invoiceId: string;
  paymentMethod: string;
  amountIssuedCents: number;
  amountReceivedCents: number;
  differenceCents: number;
  paymentDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceSummary = {
  id: string;
  clientId: string;
  projectId: string | null;
  client: {
    id: string;
    name: string;
  };
  project: {
    id: string;
    name: string;
  } | null;
  invoiceNumber: string;
  title: string;
  status: string;
  issueDate: string | null;
  dueDate: string | null;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  amountPaidCents: number;
  notes: string | null;
  paymentInstructions: string | null;
  documentUrl: string | null;
  documentStorageKey: string | null;
  lineItems: InvoiceLineItemFormValues[];
  payment: InvoicePaymentSummary | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RecurringInvoiceSummary = {
  id: string;
  clientId: string;
  projectId: string | null;
  client: {
    id: string;
    name: string;
  };
  project: {
    id: string;
    name: string;
  } | null;
  title: string;
  interval: string;
  startDate: string | null;
  endDate: string | null;
  nextRunDate: string | null;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  notes: string | null;
  paymentInstructions: string | null;
  documentFolderHint: string | null;
  isActive: boolean;
  isArchived: boolean;
  lineItems: InvoiceLineItemFormValues[];
  createdAt: string;
  updatedAt: string;
};

export type InvoiceFormValues = {
  clientId: string;
  projectId: string;
  invoiceNumber: string;
  title: string;
  status: string;
  issueDate: string;
  dueDate: string;
  paidAt?: string | null;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  amountPaidCents: number;
  notes: string;
  paymentInstructions: string;
  documentUrl: string;
  documentStorageKey: string;
  lineItems: InvoiceLineItemFormValues[];
};

export type RecurringInvoiceFormValues = {
  clientId: string;
  projectId: string;
  title: string;
  interval: string;
  startDate: string;
  endDate: string;
  nextRunDate: string;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  notes: string;
  paymentInstructions: string;
  documentFolderHint: string;
  isActive: boolean;
  lineItems: InvoiceLineItemFormValues[];
};

export type InvoicePaymentFormValues = {
  paymentMethod: string;
  amountIssuedCents: number;
  amountReceivedCents: number;
  paymentDate: string;
  notes: string;
};

type InvoicesPageProps = {
  invoices: InvoiceSummary[];
  recurringInvoices: RecurringInvoiceSummary[];
  invoiceItems: InvoiceItemSummary[];
  clients: ClientSummary[];
  projects: ProjectSummary[];
  canEdit: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  onSaveInvoice: (invoiceId: string | null, values: InvoiceFormValues) => Promise<boolean>;
  onArchiveInvoice: (invoiceId: string) => Promise<boolean>;
  onMarkInvoiceSent: (invoiceId: string) => Promise<boolean>;
  onCancelInvoice: (invoiceId: string) => Promise<boolean>;
  onMarkInvoiceUncollectible: (invoiceId: string) => Promise<boolean>;
  onRegisterInvoicePayment: (invoiceId: string, values: InvoicePaymentFormValues) => Promise<boolean>;
  onSaveRecurringInvoice: (recurringInvoiceId: string | null, values: RecurringInvoiceFormValues) => Promise<boolean>;
  onArchiveRecurringInvoice: (recurringInvoiceId: string) => Promise<boolean>;
  onGenerateDueRecurringInvoice: (recurringInvoiceId: string, targetDate: string) => Promise<boolean>;
};

const invoiceStatusOptions = [
  { label: "Draft", value: "DRAFT" },
  { label: "Issued", value: "ISSUED" },
  { label: "Paid", value: "PAID" },
  { label: "Voided", value: "VOIDED" },
  { label: "Uncollectible", value: "UNCOLLECTIBLE" }
] as const;
const recurringIntervalOptions = ["WEEKLY", "MONTHLY", "YEARLY"] as const;
const paymentMethodOptions = [
  { label: "Cash", value: "CASH" },
  { label: "Revolut bank", value: "REVOLUT_BANK" },
  { label: "Wise bank", value: "WISE_BANK" },
  { label: "Revolut card", value: "REVOLUT_CARD" },
  { label: "Wise card", value: "WISE_CARD" },
  { label: "Card processor", value: "CARD_PROCESSOR" },
  { label: "Other", value: "OTHER" }
] as const;

const emptyLineItem = (sortOrder = 0): InvoiceLineItemFormValues => ({
  description: "",
  quantity: 1,
  unitPriceCents: 0,
  totalCents: 0,
  sortOrder
});

const emptyInvoiceForm = (clientId = ""): InvoiceFormValues => ({
  clientId,
  projectId: "",
  invoiceNumber: "",
  title: "",
  status: "DRAFT",
  issueDate: "",
  dueDate: "",
  currency: "USD",
  subtotalCents: 0,
  taxCents: 0,
  discountCents: 0,
  totalCents: 0,
  amountPaidCents: 0,
  notes: "",
  paymentInstructions: "",
  documentUrl: "",
  documentStorageKey: "",
  lineItems: [emptyLineItem()]
});

const emptyRecurringForm = (clientId = ""): RecurringInvoiceFormValues => ({
  clientId,
  projectId: "",
  title: "",
  interval: "MONTHLY",
  startDate: "",
  endDate: "",
  nextRunDate: "",
  currency: "USD",
  subtotalCents: 0,
  taxCents: 0,
  discountCents: 0,
  totalCents: 0,
  notes: "",
  paymentInstructions: "",
  documentFolderHint: "",
  isActive: true,
  lineItems: [emptyLineItem()]
});

const emptyPaymentForm = (): InvoicePaymentFormValues => ({
  paymentMethod: "CASH",
  amountIssuedCents: 0,
  amountReceivedCents: 0,
  paymentDate: toLocalDateInputValue(),
  notes: ""
});

function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

function toLocalDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { currency, style: "currency" }).format(cents / 100);
}

function moneyFieldLabel(label: string, currency: string): string {
  return `${label} (${currency || "USD"})`;
}

function centsToMajorInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

function majorInputToCents(value: string): number {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

function toNonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function percentInputToNumber(value: string): number {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function calculateInvoiceTotals(lineItems: InvoiceLineItemFormValues[], taxPercentInput: string, discountPercentInput: string) {
  const subtotalCents = lineItems.reduce((sum, item) => sum + item.totalCents, 0);
  const taxCents = Math.round((subtotalCents * percentInputToNumber(taxPercentInput)) / 100);
  const discountCents = Math.round((subtotalCents * percentInputToNumber(discountPercentInput)) / 100);
  const totalCents = subtotalCents + taxCents - discountCents;
  return { subtotalCents, taxCents, discountCents, totalCents };
}

function buildSafeInvoiceLineItems(lineItems: InvoiceLineItemFormValues[], fallbackDescription: string): InvoiceLineItemFormValues[] {
  return lineItems.map((item, index) => {
    const quantity = Math.max(1, toNonNegativeInteger(item.quantity));
    const unitPriceCents = toNonNegativeInteger(item.unitPriceCents);
    return {
      description: item.description.trim() || fallbackDescription,
      quantity,
      unitPriceCents,
      totalCents: toNonNegativeInteger(quantity * unitPriceCents),
      sortOrder: index
    };
  });
}

function percentFromCents(amountCents: number, subtotalCents: number): string {
  if (subtotalCents <= 0 || amountCents <= 0) {
    return "0";
  }

  return String(Math.round((amountCents / subtotalCents) * 10000) / 100);
}

function normalizeInvoiceStatus(value: string): string {
  const status = value.trim().toUpperCase();
  return invoiceStatusOptions.some((option) => option.value === status) ? status : "DRAFT";
}

function normalizeRecurringInterval(value: string): string {
  const interval = value.trim().toUpperCase();
  return recurringIntervalOptions.includes(interval as (typeof recurringIntervalOptions)[number]) ? interval : "MONTHLY";
}

function formatPaymentMethod(value: string): string {
  return paymentMethodOptions.find((option) => option.value === value)?.label ?? value;
}

function firstClientId(clients: ClientSummary[]): string {
  return clients.find((client) => !client.isArchived)?.id ?? clients[0]?.id ?? "";
}

export function InvoicesPage({
  invoices,
  recurringInvoices,
  invoiceItems,
  clients,
  projects,
  canEdit,
  isLoading,
  errorMessage,
  onSaveInvoice,
  onArchiveInvoice,
  onMarkInvoiceSent,
  onCancelInvoice,
  onMarkInvoiceUncollectible,
  onRegisterInvoicePayment,
  onSaveRecurringInvoice,
  onArchiveRecurringInvoice,
  onGenerateDueRecurringInvoice
}: InvoicesPageProps) {
  const [tab, setTab] = useState<"invoices" | "recurring">("invoices");
  const [invoiceEditorId, setInvoiceEditorId] = useState<string | null>(null);
  const [recurringEditorId, setRecurringEditorId] = useState<string | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceSummary | null>(null);
  const [isInvoiceEditorOpen, setIsInvoiceEditorOpen] = useState(false);
  const [isRecurringEditorOpen, setIsRecurringEditorOpen] = useState(false);
  const [isPaymentEditorOpen, setIsPaymentEditorOpen] = useState(false);
  const [invoiceDraft, setInvoiceDraft] = useState<InvoiceFormValues>(emptyInvoiceForm());
  const [recurringDraft, setRecurringDraft] = useState<RecurringInvoiceFormValues>(emptyRecurringForm());
  const [paymentDraft, setPaymentDraft] = useState<InvoicePaymentFormValues>(emptyPaymentForm());
  const [invoiceUnitPriceInputs, setInvoiceUnitPriceInputs] = useState<string[]>([centsToMajorInput(0)]);
  const [recurringUnitPriceInputs, setRecurringUnitPriceInputs] = useState<string[]>([centsToMajorInput(0)]);
  const [invoiceTaxPercentInput, setInvoiceTaxPercentInput] = useState("0");
  const [invoiceDiscountPercentInput, setInvoiceDiscountPercentInput] = useState("0");
  const [recurringTaxPercentInput, setRecurringTaxPercentInput] = useState("0");
  const [recurringDiscountPercentInput, setRecurringDiscountPercentInput] = useState("0");
  const [paymentAmountIssuedInput, setPaymentAmountIssuedInput] = useState(centsToMajorInput(0));
  const [paymentAmountReceivedInput, setPaymentAmountReceivedInput] = useState(centsToMajorInput(0));
  const [saving, setSaving] = useState(false);

  const projectByClientId = useMemo(() => {
    const grouped = new Map<string, ProjectSummary[]>();
    projects.forEach((project) => {
      const existing = grouped.get(project.clientId) ?? [];
      grouped.set(project.clientId, [...existing, project]);
    });
    return grouped;
  }, [projects]);

  const invoiceProjects = projectByClientId.get(invoiceDraft.clientId) ?? [];
  const recurringProjects = projectByClientId.get(recurringDraft.clientId) ?? [];

  function setInvoiceDraftWithCalculatedTotals(
    values: InvoiceFormValues,
    taxPercentInput = invoiceTaxPercentInput,
    discountPercentInput = invoiceDiscountPercentInput
  ) {
    const lineItems = values.lineItems.map((item, index) => ({
      ...item,
      totalCents: Math.round(item.quantity * item.unitPriceCents),
      sortOrder: index
    }));
    const totals = calculateInvoiceTotals(lineItems, taxPercentInput, discountPercentInput);
    setInvoiceDraft({ ...values, ...totals, lineItems });
  }

  function updateInvoiceLineItems(
    lineItems: InvoiceLineItemFormValues[],
    taxPercentInput = invoiceTaxPercentInput,
    discountPercentInput = invoiceDiscountPercentInput
  ) {
    setInvoiceDraft((current) => {
      const normalizedLineItems = lineItems.map((item, index) => ({
        ...item,
        totalCents: Math.round(item.quantity * item.unitPriceCents),
        sortOrder: index
      }));
      return {
        ...current,
        ...calculateInvoiceTotals(normalizedLineItems, taxPercentInput, discountPercentInput),
        lineItems: normalizedLineItems
      };
    });
  }

  function setRecurringDraftWithCalculatedTotals(
    values: RecurringInvoiceFormValues,
    taxPercentInput = recurringTaxPercentInput,
    discountPercentInput = recurringDiscountPercentInput
  ) {
    const lineItems = values.lineItems.map((item, index) => ({
      ...item,
      totalCents: Math.round(item.quantity * item.unitPriceCents),
      sortOrder: index
    }));
    const totals = calculateInvoiceTotals(lineItems, taxPercentInput, discountPercentInput);
    setRecurringDraft({ ...values, ...totals, lineItems });
  }

  function updateRecurringLineItems(
    lineItems: InvoiceLineItemFormValues[],
    taxPercentInput = recurringTaxPercentInput,
    discountPercentInput = recurringDiscountPercentInput
  ) {
    setRecurringDraft((current) => {
      const normalizedLineItems = lineItems.map((item, index) => ({
        ...item,
        totalCents: Math.round(item.quantity * item.unitPriceCents),
        sortOrder: index
      }));
      return {
        ...current,
        ...calculateInvoiceTotals(normalizedLineItems, taxPercentInput, discountPercentInput),
        lineItems: normalizedLineItems
      };
    });
  }

  function openCreateInvoiceModal() {
    const nextDraft = emptyInvoiceForm(firstClientId(clients));
    setInvoiceEditorId(null);
    setInvoiceUnitPriceInputs(nextDraft.lineItems.map((item) => centsToMajorInput(item.unitPriceCents)));
    setInvoiceTaxPercentInput("0");
    setInvoiceDiscountPercentInput("0");
    setInvoiceDraftWithCalculatedTotals(nextDraft, "0", "0");
    setIsInvoiceEditorOpen(true);
  }

  function openEditInvoiceModal(invoice: InvoiceSummary) {
    const lineItems = invoice.lineItems.length > 0 ? invoice.lineItems : [emptyLineItem()];
    const subtotalCents = lineItems.reduce((sum, item) => sum + item.totalCents, 0);
    const taxPercentInput = percentFromCents(invoice.taxCents, subtotalCents);
    const discountPercentInput = percentFromCents(invoice.discountCents, subtotalCents);
    const nextDraft = {
      clientId: invoice.clientId,
      projectId: invoice.projectId ?? "",
      invoiceNumber: invoice.invoiceNumber,
      title: invoice.title,
      status: normalizeInvoiceStatus(invoice.status),
      issueDate: toDateInputValue(invoice.issueDate),
      dueDate: toDateInputValue(invoice.dueDate),
      currency: invoice.currency,
      subtotalCents: invoice.subtotalCents,
      taxCents: invoice.taxCents,
      discountCents: invoice.discountCents,
      totalCents: invoice.totalCents,
      amountPaidCents: invoice.amountPaidCents,
      notes: invoice.notes ?? "",
      paymentInstructions: invoice.paymentInstructions ?? "",
      documentUrl: invoice.documentUrl ?? "",
      documentStorageKey: invoice.documentStorageKey ?? "",
      lineItems
    };
    setInvoiceEditorId(invoice.id);
    setInvoiceUnitPriceInputs(lineItems.map((item) => centsToMajorInput(item.unitPriceCents)));
    setInvoiceTaxPercentInput(taxPercentInput);
    setInvoiceDiscountPercentInput(discountPercentInput);
    setInvoiceDraftWithCalculatedTotals(nextDraft, taxPercentInput, discountPercentInput);
    setIsInvoiceEditorOpen(true);
  }

  function openCreateRecurringModal() {
    const nextDraft = emptyRecurringForm(firstClientId(clients));
    setRecurringEditorId(null);
    setRecurringUnitPriceInputs(nextDraft.lineItems.map((item) => centsToMajorInput(item.unitPriceCents)));
    setRecurringTaxPercentInput("0");
    setRecurringDiscountPercentInput("0");
    setRecurringDraftWithCalculatedTotals(nextDraft, "0", "0");
    setIsRecurringEditorOpen(true);
  }

  function openEditRecurringModal(recurringInvoice: RecurringInvoiceSummary) {
    const lineItems = recurringInvoice.lineItems.length > 0 ? recurringInvoice.lineItems : [emptyLineItem()];
    const subtotalCents = lineItems.reduce((sum, item) => sum + item.totalCents, 0);
    const taxPercentInput = percentFromCents(recurringInvoice.taxCents, subtotalCents);
    const discountPercentInput = percentFromCents(recurringInvoice.discountCents, subtotalCents);
    setRecurringEditorId(recurringInvoice.id);
    const nextDraft = {
      clientId: recurringInvoice.clientId,
      projectId: recurringInvoice.projectId ?? "",
      title: recurringInvoice.title,
      interval: recurringIntervalOptions.includes(recurringInvoice.interval as (typeof recurringIntervalOptions)[number])
        ? recurringInvoice.interval
        : "MONTHLY",
      startDate: toDateInputValue(recurringInvoice.startDate),
      endDate: toDateInputValue(recurringInvoice.endDate),
      nextRunDate: toDateInputValue(recurringInvoice.nextRunDate),
      currency: recurringInvoice.currency,
      subtotalCents: recurringInvoice.subtotalCents,
      taxCents: recurringInvoice.taxCents,
      discountCents: recurringInvoice.discountCents,
      totalCents: recurringInvoice.totalCents,
      notes: recurringInvoice.notes ?? "",
      paymentInstructions: recurringInvoice.paymentInstructions ?? "",
      documentFolderHint: recurringInvoice.documentFolderHint ?? "",
      isActive: recurringInvoice.isActive,
      lineItems
    };
    setRecurringUnitPriceInputs(lineItems.map((item) => centsToMajorInput(item.unitPriceCents)));
    setRecurringTaxPercentInput(taxPercentInput);
    setRecurringDiscountPercentInput(discountPercentInput);
    setRecurringDraftWithCalculatedTotals(nextDraft, taxPercentInput, discountPercentInput);
    setIsRecurringEditorOpen(true);
  }

  function openPaymentModal(invoice: InvoiceSummary) {
    const amountInput = centsToMajorInput(invoice.totalCents);
    setPaymentInvoice(invoice);
    setPaymentDraft({
      ...emptyPaymentForm(),
      amountIssuedCents: invoice.totalCents,
      amountReceivedCents: invoice.totalCents
    });
    setPaymentAmountIssuedInput(amountInput);
    setPaymentAmountReceivedInput(amountInput);
    setIsPaymentEditorOpen(true);
  }

  async function handleInvoiceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fallbackTitle = invoiceDraft.title.trim() || invoiceDraft.invoiceNumber.trim() || "Untitled invoice";
    const lineItems = buildSafeInvoiceLineItems(invoiceDraft.lineItems, fallbackTitle);
    const totals = calculateInvoiceTotals(lineItems, invoiceTaxPercentInput, invoiceDiscountPercentInput);
    setSaving(true);
    try {
      const ok = await onSaveInvoice(invoiceEditorId, {
        ...invoiceDraft,
        amountPaidCents: toNonNegativeInteger(invoiceDraft.amountPaidCents),
        currency: invoiceDraft.currency.trim().toUpperCase(),
        discountCents: toNonNegativeInteger(totals.discountCents),
        lineItems,
        paidAt: null,
        status: normalizeInvoiceStatus(invoiceDraft.status),
        subtotalCents: toNonNegativeInteger(totals.subtotalCents),
        taxCents: toNonNegativeInteger(totals.taxCents),
        title: fallbackTitle,
        totalCents: toNonNegativeInteger(totals.totalCents)
      });
      if (ok) {
        setInvoiceEditorId(null);
        setInvoiceDraft(emptyInvoiceForm(firstClientId(clients)));
        setInvoiceUnitPriceInputs([centsToMajorInput(0)]);
        setInvoiceTaxPercentInput("0");
        setInvoiceDiscountPercentInput("0");
        setIsInvoiceEditorOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRecurringSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstLineItemDescription = recurringDraft.lineItems.find((item) => item.description.trim())?.description.trim();
    const fallbackTitle = recurringDraft.title.trim() || firstLineItemDescription || "Recurring invoice";
    const lineItems = buildSafeInvoiceLineItems(recurringDraft.lineItems, fallbackTitle);
    const totals = calculateInvoiceTotals(lineItems, recurringTaxPercentInput, recurringDiscountPercentInput);
    const startDate = recurringDraft.startDate || toLocalDateInputValue();
    const nextRunDate = recurringDraft.nextRunDate || startDate;
    setSaving(true);
    try {
      const ok = await onSaveRecurringInvoice(recurringEditorId, {
        ...recurringDraft,
        currency: recurringDraft.currency.trim().toUpperCase(),
        discountCents: toNonNegativeInteger(totals.discountCents),
        endDate: recurringDraft.endDate,
        interval: normalizeRecurringInterval(recurringDraft.interval),
        lineItems,
        nextRunDate,
        startDate,
        subtotalCents: toNonNegativeInteger(totals.subtotalCents),
        taxCents: toNonNegativeInteger(totals.taxCents),
        title: fallbackTitle,
        totalCents: toNonNegativeInteger(totals.totalCents)
      });
      if (ok) {
        setRecurringEditorId(null);
        setRecurringDraft(emptyRecurringForm(firstClientId(clients)));
        setRecurringUnitPriceInputs([centsToMajorInput(0)]);
        setRecurringTaxPercentInput("0");
        setRecurringDiscountPercentInput("0");
        setIsRecurringEditorOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentInvoice) {
      return;
    }

    setSaving(true);
    try {
      const ok = await onRegisterInvoicePayment(paymentInvoice.id, paymentDraft);
      if (ok) {
        setPaymentInvoice(null);
        setPaymentDraft(emptyPaymentForm());
        setPaymentAmountIssuedInput(centsToMajorInput(0));
        setPaymentAmountReceivedInput(centsToMajorInput(0));
        setIsPaymentEditorOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading invoices" />;
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} title="Invoices unavailable" />;
  }

  return (
    <section className="view-section" aria-labelledby="invoices-title">
      <PageHeader
        eyebrow="Finance"
        title="Invoices"
        titleId="invoices-title"
        description="Invoice lifecycle, payments, and recurring schedules."
        actions={
          <>
            <div className="filter-bar" role="group" aria-label="Invoice view">
              <button
                aria-pressed={tab === "invoices"}
                className={tab === "invoices" ? "secondary-action filter-chip is-active" : "secondary-action filter-chip"}
                onClick={() => setTab("invoices")}
                type="button"
              >
                Invoices
              </button>
              <button
                aria-pressed={tab === "recurring"}
                className={tab === "recurring" ? "secondary-action filter-chip is-active" : "secondary-action filter-chip"}
                onClick={() => setTab("recurring")}
                type="button"
              >
                Recurring
              </button>
            </div>
            {canEdit ? (
              <button
                className="primary-action"
                disabled={clients.length === 0}
                onClick={tab === "invoices" ? openCreateInvoiceModal : openCreateRecurringModal}
                type="button"
              >
                {tab === "invoices" ? "Add Invoice" : "Add Recurring"}
              </button>
            ) : null}
          </>
        }
      />

      {canEdit && clients.length === 0 ? (
        <EmptyState title="Add a client first" message="Invoices need a client to attach to before they can be created." />
      ) : null}

      {tab === "invoices" ? (
        <InvoiceCards
          canEdit={canEdit}
          invoices={invoices}
          onArchiveInvoice={onArchiveInvoice}
          onCancelInvoice={onCancelInvoice}
          onEditInvoice={openEditInvoiceModal}
          onMarkInvoiceSent={onMarkInvoiceSent}
          onMarkInvoiceUncollectible={onMarkInvoiceUncollectible}
          onRegisterInvoicePayment={openPaymentModal}
        />
      ) : (
        <RecurringInvoiceCards
          canEdit={canEdit}
          onArchiveRecurringInvoice={onArchiveRecurringInvoice}
          onEditRecurringInvoice={openEditRecurringModal}
          onGenerateDueRecurringInvoice={onGenerateDueRecurringInvoice}
          recurringInvoices={recurringInvoices}
        />
      )}

      {isInvoiceEditorOpen ? (
        <Modal
          eyebrow={invoiceEditorId ? "Edit" : "Create"}
          onClose={() => {
            setInvoiceEditorId(null);
            setInvoiceDraft(emptyInvoiceForm(firstClientId(clients)));
            setInvoiceUnitPriceInputs([centsToMajorInput(0)]);
            setInvoiceTaxPercentInput("0");
            setInvoiceDiscountPercentInput("0");
            setIsInvoiceEditorOpen(false);
          }}
          size="lg"
          title={invoiceEditorId ? "Edit Invoice" : "Add Invoice"}
        >
          <form className="entity-form invoice-form-compact" onSubmit={handleInvoiceSubmit}>
            <ModalActions
              actionLabel={invoiceEditorId ? "Update invoice" : "Create invoice"}
              disabled={saving || clients.length === 0}
              onCancel={() => setIsInvoiceEditorOpen(false)}
              saving={saving}
            />
            <div className="field-grid">
              <ClientProjectFields
                clients={clients}
                clientId={invoiceDraft.clientId}
                onClientChange={(clientId) => setInvoiceDraft((current) => ({ ...current, clientId, projectId: "" }))}
                onProjectChange={(projectId) => setInvoiceDraft((current) => ({ ...current, projectId }))}
                projectId={invoiceDraft.projectId}
                projects={invoiceProjects}
              />
              <label className="field-span-2">
                Invoice title / reference - Optional
                <input
                  maxLength={255}
                  onChange={(event) => setInvoiceDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="PO number, client code, or internal reference"
                  value={invoiceDraft.title}
                />
                <span className="muted-text">Used on invoice cards and internal records.</span>
              </label>
              <label>
                Invoice number - Required
                <input
                  maxLength={120}
                  onChange={(event) => setInvoiceDraft((current) => ({ ...current, invoiceNumber: event.target.value }))}
                  required
                  placeholder="Client invoice number or internal billing reference"
                  value={invoiceDraft.invoiceNumber}
                />
                <span className="muted-text">Shown on the client-facing invoice.</span>
              </label>
              <label>
                Invoice date - Required
                <input
                  onChange={(event) => setInvoiceDraft((current) => ({ ...current, issueDate: event.target.value }))}
                  required
                  type="date"
                  value={invoiceDraft.issueDate}
                />
                <span className="muted-text">Used for invoice due tracking.</span>
              </label>
              <label>
                Due date - Required
                <input
                  onChange={(event) => setInvoiceDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  required
                  type="date"
                  value={invoiceDraft.dueDate}
                />
                <span className="muted-text">Used for invoice due tracking.</span>
              </label>
              <label>
                Currency - Required
                <input
                  maxLength={3}
                  onChange={(event) => setInvoiceDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
                  required
                  placeholder="USD"
                  value={invoiceDraft.currency}
                />
                <span className="muted-text">Used for invoice totals and line items.</span>
              </label>
              <label>
                Status - Required
                <select onChange={(event) => setInvoiceDraft((current) => ({ ...current, status: event.target.value }))} required value={invoiceDraft.status}>
                  {invoiceStatusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <span className="muted-text">Controls invoice lifecycle only. It does not register payment.</span>
              </label>
            </div>
            <LineItemsEditor
              currency={invoiceDraft.currency}
              invoiceItems={invoiceItems}
              lineItems={invoiceDraft.lineItems}
              onChange={updateInvoiceLineItems}
              onUnitPriceInputsChange={setInvoiceUnitPriceInputs}
              unitPriceInputs={invoiceUnitPriceInputs}
            />
            <div className="field-grid">
              <label>
                {moneyFieldLabel("Subtotal", invoiceDraft.currency)}
                <input
                  readOnly
                  value={centsToMajorInput(invoiceDraft.subtotalCents)}
                />
              </label>
              <label>
                Tax (%)
                <input
                  min={0}
                  onChange={(event) => {
                    const taxPercentInput = event.target.value;
                    setInvoiceTaxPercentInput(taxPercentInput);
                    updateInvoiceLineItems(invoiceDraft.lineItems, taxPercentInput, invoiceDiscountPercentInput);
                  }}
                  step="0.01"
                  type="number"
                  value={invoiceTaxPercentInput}
                />
              </label>
              <label>
                Discount (%)
                <input
                  min={0}
                  onChange={(event) => {
                    const discountPercentInput = event.target.value;
                    setInvoiceDiscountPercentInput(discountPercentInput);
                    updateInvoiceLineItems(invoiceDraft.lineItems, invoiceTaxPercentInput, discountPercentInput);
                  }}
                  step="0.01"
                  type="number"
                  value={invoiceDiscountPercentInput}
                />
              </label>
              <label>
                {moneyFieldLabel("Total", invoiceDraft.currency)}
                <input
                  readOnly
                  value={centsToMajorInput(invoiceDraft.totalCents)}
                />
              </label>
              <TextAreaFields
                documentLabel="Document URL"
                documentValue={invoiceDraft.documentUrl}
                notes={invoiceDraft.notes}
                onChange={(values) => setInvoiceDraft((current) => ({ ...current, ...values }))}
                paymentInstructions={invoiceDraft.paymentInstructions}
                storageLabel={null}
                storageValue={invoiceDraft.documentStorageKey}
              />
            </div>
            <ModalActions
              actionLabel={invoiceEditorId ? "Update invoice" : "Create invoice"}
              disabled={saving || clients.length === 0}
              onCancel={() => setIsInvoiceEditorOpen(false)}
              saving={saving}
            />
          </form>
        </Modal>
      ) : null}

      {isRecurringEditorOpen ? (
        <Modal
          eyebrow={recurringEditorId ? "Edit" : "Create"}
          onClose={() => {
            setRecurringEditorId(null);
            setRecurringDraft(emptyRecurringForm(firstClientId(clients)));
            setRecurringUnitPriceInputs([centsToMajorInput(0)]);
            setRecurringTaxPercentInput("0");
            setRecurringDiscountPercentInput("0");
            setIsRecurringEditorOpen(false);
          }}
          size="lg"
          title={recurringEditorId ? "Edit Recurring Invoice" : "Add Recurring Invoice"}
        >
          <form className="entity-form" onSubmit={handleRecurringSubmit}>
            <ModalActions
              actionLabel={recurringEditorId ? "Update recurring invoice" : "Create recurring invoice"}
              disabled={saving || clients.length === 0}
              onCancel={() => setIsRecurringEditorOpen(false)}
              saving={saving}
            />
            <div className="field-grid">
              <ClientProjectFields
                clients={clients}
                clientId={recurringDraft.clientId}
                onClientChange={(clientId) => setRecurringDraft((current) => ({ ...current, clientId, projectId: "" }))}
                onProjectChange={(projectId) => setRecurringDraft((current) => ({ ...current, projectId }))}
                projectId={recurringDraft.projectId}
                projects={recurringProjects}
              />
              <label className="field-span-2">
                Recurring title / reference - Optional
                <input
                  maxLength={255}
                  onChange={(event) => setRecurringDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Billing cycle title or internal recurring reference"
                  value={recurringDraft.title}
                />
                <span className="muted-text">Used on recurring invoice cards and internal records.</span>
              </label>
              <label>
                Start date - Required
                <input
                  onChange={(event) => setRecurringDraft((current) => ({ ...current, startDate: event.target.value }))}
                  required
                  type="date"
                  value={recurringDraft.startDate}
                />
                <span className="muted-text">Used for the first scheduled billing cycle.</span>
              </label>
              <label>
                Frequency - Required
                <select onChange={(event) => setRecurringDraft((current) => ({ ...current, interval: event.target.value }))} required value={recurringDraft.interval}>
                  {recurringIntervalOptions.map((interval) => (
                    <option key={interval} value={interval}>
                      {interval}
                    </option>
                  ))}
                </select>
                <span className="muted-text">Controls how often the recurring invoice is due.</span>
              </label>
              <label>
                Next run date - Optional
                <input
                  onChange={(event) => setRecurringDraft((current) => ({ ...current, nextRunDate: event.target.value }))}
                  type="date"
                  value={recurringDraft.nextRunDate}
                />
                <span className="muted-text">Used for the next due record when present.</span>
              </label>
              <label>
                Active - Required
                <select
                  onChange={(event) => setRecurringDraft((current) => ({ ...current, isActive: event.target.value === "true" }))}
                  required
                  value={recurringDraft.isActive ? "true" : "false"}
                >
                  <option value="true">Active</option>
                  <option value="false">Paused</option>
                </select>
                <span className="muted-text">Paused recurring invoices stay in history and do not generate due records.</span>
              </label>
              <label>
                End date - Optional
                <input
                  onChange={(event) => setRecurringDraft((current) => ({ ...current, endDate: event.target.value }))}
                  type="date"
                  value={recurringDraft.endDate}
                />
                <span className="muted-text">Optional stop date for the schedule.</span>
              </label>
              <label>
                Currency - Required
                <input
                  maxLength={3}
                  onChange={(event) => setRecurringDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
                  required
                  placeholder="USD"
                  value={recurringDraft.currency}
                />
                <span className="muted-text">Used for recurring invoice totals and line items.</span>
              </label>
            </div>
            <LineItemsEditor
              currency={recurringDraft.currency}
              invoiceItems={invoiceItems}
              lineItems={recurringDraft.lineItems}
              onChange={updateRecurringLineItems}
              onUnitPriceInputsChange={setRecurringUnitPriceInputs}
              unitPriceInputs={recurringUnitPriceInputs}
            />
            <div className="field-grid">
              <label>
                {moneyFieldLabel("Subtotal", recurringDraft.currency)}
                <input
                  readOnly
                  value={centsToMajorInput(recurringDraft.subtotalCents)}
                />
              </label>
              <label>
                Tax (%)
                <input
                  min={0}
                  onChange={(event) => {
                    const taxPercentInput = event.target.value;
                    setRecurringTaxPercentInput(taxPercentInput);
                    updateRecurringLineItems(recurringDraft.lineItems, taxPercentInput, recurringDiscountPercentInput);
                  }}
                  step="0.01"
                  type="number"
                  value={recurringTaxPercentInput}
                />
              </label>
              <label>
                Discount (%)
                <input
                  min={0}
                  onChange={(event) => {
                    const discountPercentInput = event.target.value;
                    setRecurringDiscountPercentInput(discountPercentInput);
                    updateRecurringLineItems(recurringDraft.lineItems, recurringTaxPercentInput, discountPercentInput);
                  }}
                  step="0.01"
                  type="number"
                  value={recurringDiscountPercentInput}
                />
              </label>
              <label>
                {moneyFieldLabel("Total", recurringDraft.currency)}
                <input
                  readOnly
                  value={centsToMajorInput(recurringDraft.totalCents)}
                />
              </label>
              <TextAreaFields
                documentLabel="Document folder hint"
                documentValue={recurringDraft.documentFolderHint}
                notes={recurringDraft.notes}
                onChange={(values) => setRecurringDraft((current) => ({ ...current, ...values }))}
                paymentInstructions={recurringDraft.paymentInstructions}
                storageLabel={null}
                storageValue=""
              />
            </div>
            <ModalActions
              actionLabel={recurringEditorId ? "Update recurring invoice" : "Create recurring invoice"}
              disabled={saving || clients.length === 0}
              onCancel={() => setIsRecurringEditorOpen(false)}
              saving={saving}
            />
          </form>
        </Modal>
      ) : null}

      {isPaymentEditorOpen ? (
        <Modal
          eyebrow="Payment"
          onClose={() => {
            setPaymentInvoice(null);
            setPaymentDraft(emptyPaymentForm());
            setPaymentAmountIssuedInput(centsToMajorInput(0));
            setPaymentAmountReceivedInput(centsToMajorInput(0));
            setIsPaymentEditorOpen(false);
          }}
          size="md"
          title="Register Payment"
        >
          <form className="entity-form invoice-form-compact" onSubmit={handlePaymentSubmit}>
            <div className="field-grid">
              <label>
                Payment method
                <select
                  onChange={(event) => setPaymentDraft((current) => ({ ...current, paymentMethod: event.target.value }))}
                  required
                  value={paymentDraft.paymentMethod}
                >
                  {paymentMethodOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Payment date
                <input
                  onChange={(event) => setPaymentDraft((current) => ({ ...current, paymentDate: event.target.value }))}
                  required
                  type="date"
                  value={paymentDraft.paymentDate}
                />
              </label>
              <label>
                {moneyFieldLabel("Amount issued", paymentInvoice?.currency ?? "USD")}
                <input
                  min={0}
                  onChange={(event) => {
                    const amountInput = event.target.value;
                    setPaymentAmountIssuedInput(amountInput);
                    setPaymentDraft((current) => ({ ...current, amountIssuedCents: majorInputToCents(amountInput) }));
                  }}
                  required
                  step="0.01"
                  type="number"
                  value={paymentAmountIssuedInput}
                />
              </label>
              <label>
                {moneyFieldLabel("Amount received", paymentInvoice?.currency ?? "USD")}
                <input
                  min={0}
                  onChange={(event) => {
                    const amountInput = event.target.value;
                    setPaymentAmountReceivedInput(amountInput);
                    setPaymentDraft((current) => ({ ...current, amountReceivedCents: majorInputToCents(amountInput) }));
                  }}
                  required
                  step="0.01"
                  type="number"
                  value={paymentAmountReceivedInput}
                />
              </label>
              <label className="field-span-2">
                Notes
                <textarea
                  maxLength={4000}
                  onChange={(event) => setPaymentDraft((current) => ({ ...current, notes: event.target.value }))}
                  rows={3}
                  value={paymentDraft.notes}
                />
              </label>
            </div>
            <ModalActions disabled={saving || !paymentDraft.paymentDate} onCancel={() => setIsPaymentEditorOpen(false)} saving={saving} />
          </form>
        </Modal>
      ) : null}
    </section>
  );
}

type InvoiceCardsProps = {
  invoices: InvoiceSummary[];
  canEdit: boolean;
  onEditInvoice: (invoice: InvoiceSummary) => void;
  onArchiveInvoice: (invoiceId: string) => Promise<boolean>;
  onMarkInvoiceSent: (invoiceId: string) => Promise<boolean>;
  onCancelInvoice: (invoiceId: string) => Promise<boolean>;
  onMarkInvoiceUncollectible: (invoiceId: string) => Promise<boolean>;
  onRegisterInvoicePayment: (invoice: InvoiceSummary) => void;
};

function canRegisterPayment(invoice: InvoiceSummary): boolean {
  return !invoice.payment && !invoice.isArchived && !["PAID", "VOIDED", "CANCELLED", "UNCOLLECTIBLE"].includes(invoice.status);
}

function canMarkUncollectible(invoice: InvoiceSummary): boolean {
  return invoice.status === "ISSUED" && !invoice.isArchived;
}

function InvoiceCards({ invoices, canEdit, onEditInvoice, onArchiveInvoice, onMarkInvoiceSent, onCancelInvoice, onMarkInvoiceUncollectible, onRegisterInvoicePayment }: InvoiceCardsProps) {
  if (invoices.length === 0) {
    return <p className="inline-empty muted-text">No invoices have been created yet.</p>;
  }

  return (
    <div className="table-wrap finance-table-wrap" aria-label="Invoices">
      <table className="finance-table dense-table">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Client</th>
            <th>Status</th>
            <th className="finance-amount-col">Total</th>
            <th className="finance-amount-col">Paid</th>
            <th>Due</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <Fragment key={invoice.id}>
              <tr>
                <td>
                  <strong>{invoice.title}</strong>
                  <div className="muted-text">{invoice.invoiceNumber || "No invoice number"}</div>
                  <div className="muted-text">{invoice.project?.name ?? "No project"}</div>
                </td>
                <td>{invoice.client.name}</td>
                <td>
                  <StatusBadge status={invoice.isArchived ? "ARCHIVED" : invoice.status} />
                  {invoice.payment ? <StatusBadge status="Paid recorded" /> : null}
                </td>
                <td className="finance-amount-col">{formatMoney(invoice.totalCents, invoice.currency)}</td>
                <td className="finance-amount-col">{formatMoney(invoice.amountPaidCents, invoice.currency)}</td>
                <td>{formatDateLabel(invoice.dueDate)}</td>
                <td>
                  <div className="finance-row-actions">
                    {canEdit ? <button className="secondary-action" onClick={() => onEditInvoice(invoice)} type="button">Open</button> : null}
                    {canEdit ? (
                      <details className="row-action-menu">
                        <summary>More</summary>
                        <div className="row-action-menu-panel">
                          <div className="row-action-menu-group">
                            <span className="row-action-menu-label">Lifecycle</span>
                            <button className="secondary-action" onClick={() => void onMarkInvoiceSent(invoice.id)} type="button">Mark sent</button>
                            {canRegisterPayment(invoice) ? <button className="secondary-action" onClick={() => onRegisterInvoicePayment(invoice)} type="button">Register payment</button> : null}
                          </div>
                          <div className="row-action-menu-group">
                            <span className="row-action-menu-label">Exceptions</span>
                            <button className="secondary-action" onClick={() => void onCancelInvoice(invoice.id)} type="button">Cancel</button>
                            {canMarkUncollectible(invoice) ? <button className="secondary-action" onClick={() => void onMarkInvoiceUncollectible(invoice.id)} type="button">Mark uncollectible</button> : null}
                            {!invoice.isArchived ? <button className="secondary-action" onClick={() => void onArchiveInvoice(invoice.id)} type="button">Archive</button> : null}
                          </div>
                        </div>
                      </details>
                    ) : null}
                  </div>
                </td>
              </tr>
              {invoice.payment ? (
                <tr className="finance-table-detail-row" key={`${invoice.id}-payment`}>
                  <td colSpan={7}>
                    <PaymentDetails currency={invoice.currency} payment={invoice.payment} />
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentDetails({ currency, payment }: { currency: string; payment: InvoicePaymentSummary }) {
  return (
    <div className="entity-field-grid field-grid-compact invoice-payment-detail">
      <div><span className="compact-meta">Payment method</span><strong className="compact-value">{formatPaymentMethod(payment.paymentMethod)}</strong></div>
      <div><span className="compact-meta">Payment date</span><strong className="compact-value">{formatDateLabel(payment.paymentDate)}</strong></div>
      <div><span className="compact-meta">Amount issued</span><strong className="compact-value">{formatMoney(payment.amountIssuedCents, currency)}</strong></div>
      <div><span className="compact-meta">Amount received</span><strong className="compact-value">{formatMoney(payment.amountReceivedCents, currency)}</strong></div>
      <div><span className="compact-meta">Difference</span><strong className="compact-value">{formatMoney(payment.differenceCents, currency)}</strong></div>
      <div className="entity-span-2"><span className="compact-meta">Payment notes</span><strong className="compact-value">{payment.notes || "Not set"}</strong></div>
    </div>
  );
}

type RecurringInvoiceCardsProps = {
  recurringInvoices: RecurringInvoiceSummary[];
  canEdit: boolean;
  onEditRecurringInvoice: (recurringInvoice: RecurringInvoiceSummary) => void;
  onArchiveRecurringInvoice: (recurringInvoiceId: string) => Promise<boolean>;
  onGenerateDueRecurringInvoice: (recurringInvoiceId: string, targetDate: string) => Promise<boolean>;
};

function RecurringInvoiceCards({ recurringInvoices, canEdit, onEditRecurringInvoice, onArchiveRecurringInvoice, onGenerateDueRecurringInvoice }: RecurringInvoiceCardsProps) {
  if (recurringInvoices.length === 0) {
    return <p className="inline-empty muted-text">No recurring invoices have been configured yet.</p>;
  }

  return (
    <div className="table-wrap finance-table-wrap" aria-label="Recurring invoices">
      <table className="finance-table dense-table">
        <thead>
          <tr>
            <th>Schedule</th>
            <th>Client</th>
            <th>Status</th>
            <th className="finance-amount-col">Total</th>
            <th>Interval</th>
            <th>Next run</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {recurringInvoices.map((recurringInvoice) => (
            <tr key={recurringInvoice.id}>
              <td>
                <strong>{recurringInvoice.title}</strong>
                <div className="muted-text">{recurringInvoice.project?.name ?? "No project"}</div>
              </td>
              <td>{recurringInvoice.client.name}</td>
              <td>
                <StatusBadge status={recurringInvoice.isArchived ? "ARCHIVED" : recurringInvoice.isActive ? "ACTIVE" : "PAUSED"} />
              </td>
              <td className="finance-amount-col">{formatMoney(recurringInvoice.totalCents, recurringInvoice.currency)}</td>
              <td>{recurringInvoice.interval}</td>
              <td>{formatDateLabel(recurringInvoice.nextRunDate)}</td>
              <td>
                <div className="finance-row-actions">
                  {canEdit ? <button className="secondary-action" onClick={() => onEditRecurringInvoice(recurringInvoice)} type="button">Open</button> : null}
                  {canEdit ? (
                    <details className="row-action-menu">
                      <summary>More</summary>
                      <div className="row-action-menu-panel">
                        <div className="row-action-menu-group">
                          <span className="row-action-menu-label">Recurring</span>
                          <button
                            className="secondary-action"
                            onClick={() => void onGenerateDueRecurringInvoice(recurringInvoice.id, toLocalDateInputValue())}
                            type="button"
                          >
                            Generate due
                          </button>
                          {!recurringInvoice.isArchived ? <button className="secondary-action" onClick={() => void onArchiveRecurringInvoice(recurringInvoice.id)} type="button">Archive</button> : null}
                        </div>
                      </div>
                    </details>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ClientProjectFieldsProps = {
  clients: ClientSummary[];
  projects: ProjectSummary[];
  clientId: string;
  projectId: string;
  onClientChange: (clientId: string) => void;
  onProjectChange: (projectId: string) => void;
};

function ClientProjectFields({ clients, projects, clientId, projectId, onClientChange, onProjectChange }: ClientProjectFieldsProps) {
  return (
    <>
      <label>
        Client - Required
        <select disabled={clients.length === 0} onChange={(event) => onClientChange(event.target.value)} required value={clientId}>
          <option value="">Select client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
        <span className="muted-text">Required billing owner for this record.</span>
      </label>
      <label>
        Project / reference - Optional
        <select onChange={(event) => onProjectChange(event.target.value)} value={projectId}>
          <option value="">No project / reference</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
        <span className="muted-text">Optional billing context for this record.</span>
      </label>
    </>
  );
}

type DateAndMoneyFieldsProps = {
  firstDateLabel: string;
  firstDateValue: string;
  secondDateLabel: string;
  dueDate: string;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  onChange: (values: Partial<InvoiceFormValues & RecurringInvoiceFormValues>) => void;
};

function DateAndMoneyFields(props: DateAndMoneyFieldsProps) {
  return (
    <>
      <label>{props.firstDateLabel}<input onChange={(event) => props.onChange({ [props.firstDateLabel === "Issue date" ? "issueDate" : "startDate"]: event.target.value })} type="date" value={props.firstDateValue} /></label>
      <label>{props.secondDateLabel}<input onChange={(event) => props.onChange({ [props.secondDateLabel === "Due date" ? "dueDate" : "endDate"]: event.target.value })} type="date" value={props.dueDate} /></label>
      <label>Currency<input maxLength={3} onChange={(event) => props.onChange({ currency: event.target.value.toUpperCase() })} required value={props.currency} /></label>
      <label>{moneyFieldLabel("Subtotal", props.currency)}<input min={0} onChange={(event) => props.onChange({ subtotalCents: majorInputToCents(event.target.value) })} step="0.01" type="number" value={centsToMajorInput(props.subtotalCents)} /></label>
      <label>{moneyFieldLabel("Tax", props.currency)}<input min={0} onChange={(event) => props.onChange({ taxCents: majorInputToCents(event.target.value) })} step="0.01" type="number" value={centsToMajorInput(props.taxCents)} /></label>
      <label>{moneyFieldLabel("Discount", props.currency)}<input min={0} onChange={(event) => props.onChange({ discountCents: majorInputToCents(event.target.value) })} step="0.01" type="number" value={centsToMajorInput(props.discountCents)} /></label>
      <label>{moneyFieldLabel("Total", props.currency)}<input min={0} onChange={(event) => props.onChange({ totalCents: majorInputToCents(event.target.value) })} step="0.01" type="number" value={centsToMajorInput(props.totalCents)} /></label>
    </>
  );
}

type TextAreaFieldsProps = {
  notes: string;
  paymentInstructions: string;
  documentLabel: string;
  documentValue: string;
  storageLabel: string | null;
  storageValue: string;
  onChange: (values: Partial<InvoiceFormValues & RecurringInvoiceFormValues>) => void;
};

function TextAreaFields(props: TextAreaFieldsProps) {
  return (
    <>
      <label className="field-span-2">
        Payment instructions - Optional
        <textarea
          maxLength={4000}
          onChange={(event) => props.onChange({ paymentInstructions: event.target.value })}
          placeholder="Payment terms or client-facing invoice note"
          rows={3}
          value={props.paymentInstructions}
        />
        <span className="muted-text">Shown on client-facing invoice.</span>
      </label>
      <label className="field-span-2">
        Internal notes - Optional
        <textarea
          maxLength={4000}
          onChange={(event) => props.onChange({ notes: event.target.value })}
          placeholder="Notes for admin team only"
          rows={3}
          value={props.notes}
        />
        <span className="muted-text">Visible only to admin team.</span>
      </label>
      <label className="field-span-2">
        {props.documentLabel} - Optional
        <input
          maxLength={2048}
          onChange={(event) => props.onChange(props.storageLabel ? { documentUrl: event.target.value } : { documentFolderHint: event.target.value })}
          placeholder={props.storageLabel ? "PO number, client code, or internal reference" : "Admin document URL or folder hint"}
          value={props.documentValue}
        />
        <span className="muted-text">{props.storageLabel ? "Shown only in admin record." : "Used for admin reference."}</span>
      </label>
      {props.storageLabel ? (
        <label className="field-span-2">
          {props.storageLabel} - Optional
          <input
            maxLength={2048}
            onChange={(event) => props.onChange({ documentStorageKey: event.target.value })}
            placeholder="Storage key or internal document path"
            value={props.storageValue}
          />
          <span className="muted-text">Visible only to admin team.</span>
        </label>
      ) : null}
    </>
  );
}

type LineItemsEditorProps = {
  currency: string;
  invoiceItems: InvoiceItemSummary[];
  lineItems: InvoiceLineItemFormValues[];
  onChange: (lineItems: InvoiceLineItemFormValues[]) => void;
  unitPriceInputs?: string[];
  onUnitPriceInputsChange?: (unitPriceInputs: string[]) => void;
};

function LineItemsEditor({ currency, invoiceItems, lineItems, onChange, unitPriceInputs, onUnitPriceInputsChange }: LineItemsEditorProps) {
  function updateLineItem(index: number, values: Partial<InvoiceLineItemFormValues>) {
    onChange(lineItems.map((item, itemIndex) => (itemIndex === index ? { ...item, ...values } : item)));
  }

  function updateUnitPriceInput(index: number, value: string) {
    onUnitPriceInputsChange?.(lineItems.map((item, itemIndex) => (itemIndex === index ? value : unitPriceInputs?.[itemIndex] ?? centsToMajorInput(item.unitPriceCents))));
  }

  function selectInvoiceItem(index: number, invoiceItemId: string) {
    const invoiceItem = invoiceItems.find((item) => item.id === invoiceItemId);
    if (!invoiceItem) {
      return;
    }

    const quantity = 1;
    updateLineItem(index, {
      description: [invoiceItem.name, invoiceItem.description].filter(Boolean).join(" — "),
      quantity,
      unitPriceCents: invoiceItem.unitPriceCents,
      totalCents: quantity * invoiceItem.unitPriceCents
    });
    updateUnitPriceInput(index, centsToMajorInput(invoiceItem.unitPriceCents));
  }

  function updateQuantity(index: number, quantity: number) {
    const item = lineItems[index];
    updateLineItem(index, {
      quantity,
      totalCents: quantity * (item?.unitPriceCents ?? 0)
    });
  }

  function updateUnitPrice(index: number, unitPriceCents: number) {
    const item = lineItems[index];
    updateLineItem(index, {
      unitPriceCents,
      totalCents: (item?.quantity ?? 0) * unitPriceCents
    });
  }

  return (
    <div className="entity-form">
      <h3>Line items</h3>
      <p className="muted-text">Add billing rows for the work being invoiced. Line descriptions appear on the invoice and feed the totals below.</p>
      {lineItems.map((item, index) => (
        <div className="field-grid" key={index}>
          <label className="field-span-2">
            Service / item - Optional
            <select onChange={(event) => selectInvoiceItem(index, event.target.value)} value="">
              <option value="">Select a reusable service</option>
              {invoiceItems.map((invoiceItem) => (
                <option key={invoiceItem.id} value={invoiceItem.id}>{invoiceItem.name}</option>
              ))}
            </select>
            <span className="muted-text">Pick a reusable service to prefill the row.</span>
          </label>
          <label className="field-span-2">
            Description / details - Optional
            <textarea
              maxLength={500}
              onChange={(event) => updateLineItem(index, { description: event.target.value })}
              placeholder="Service, deliverable, or billing item"
              rows={3}
              value={item.description}
            />
            <span className="muted-text">Shown on the client-facing invoice.</span>
          </label>
          <label>
            Quantity - Required
            <input min={0} onChange={(event) => updateQuantity(index, event.target.valueAsNumber || 0)} placeholder="Number of units, hours, or items" type="number" value={item.quantity} />
            <span className="muted-text">Used to calculate the line total.</span>
          </label>
          <label>
            {moneyFieldLabel("Unit price", currency)} - Required
            <input
              min={0}
              onChange={(event) => { updateUnitPriceInput(index, event.target.value); updateUnitPrice(index, majorInputToCents(event.target.value)); }}
              placeholder="Price per unit before tax or discount"
              step="0.01"
              type="number"
              value={unitPriceInputs?.[index] ?? centsToMajorInput(item.unitPriceCents)}
            />
            <span className="muted-text">Shown as the pre-tax rate for this row.</span>
          </label>
          <label>
            {moneyFieldLabel("Line total", currency)}
            <input readOnly value={centsToMajorInput(item.totalCents)} />
            <span className="muted-text">Calculated from quantity and unit price.</span>
          </label>
          <div className="card-actions">
            <button className="secondary-action" disabled={lineItems.length === 1} onClick={() => { onChange(lineItems.filter((_, itemIndex) => itemIndex !== index)); onUnitPriceInputsChange?.((unitPriceInputs ?? []).filter((_, itemIndex) => itemIndex !== index)); }} type="button">Remove line</button>
          </div>
        </div>
      ))}
      <button className="secondary-action" onClick={() => { onChange([...lineItems, emptyLineItem(lineItems.length)]); onUnitPriceInputsChange?.([...(unitPriceInputs ?? lineItems.map((item) => centsToMajorInput(item.unitPriceCents))), centsToMajorInput(0)]); }} type="button">Add line item</button>
    </div>
  );
}

type ModalActionsProps = {
  disabled: boolean;
  saving: boolean;
  onCancel: () => void;
  actionLabel?: string;
};

function ModalActions({ disabled, saving, onCancel, actionLabel = "Save" }: ModalActionsProps) {
  return (
    <div className="modal-footer">
      <button className="secondary-action" disabled={saving} onClick={onCancel} type="button">Cancel</button>
      <button className="primary-action" disabled={disabled} type="submit">{saving ? "Saving" : actionLabel}</button>
    </div>
  );
}
