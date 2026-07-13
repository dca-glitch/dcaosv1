import { Fragment, type FormEvent, useMemo, useState } from "react";
import { Modal } from "../../components/Modal";
import {
  Button,
  CompoundTable,
  CompoundTableRow,
  EmptyState,
  ErrorState,
  FilterBar,
  Input,
  LoadingState,
  ModalActions,
  PageHeader,
  Select,
  StatusBadge,
  StatusSummaryBar,
  TableBody,
  TableHead,
  Td,
  TdDouble,
  Textarea,
  Th,
} from "../../components/ui";
import type { ClientSummary } from "../clients/ClientsPage";
import {
  buildInvoiceStatusSummary,
  buildRecurringStatusSummary,
  financeDueDateClassName,
  formatFinanceDateLabel,
  formatFinanceMoney,
  isInvoiceOverdue
} from "../finance/finance-display";
import type { InvoiceItemSummary } from "../invoice-items/InvoiceItemsPage";
import type { ProjectSummary } from "../projects/ProjectsPage";
import "../finance/finance.css";

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
  return formatFinanceDateLabel(value);
}

function formatMoney(cents: number, currency: string): string {
  return formatFinanceMoney(cents, currency);
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

  const invoiceStatusSummary = useMemo(() => buildInvoiceStatusSummary(invoices), [invoices]);
  const recurringStatusSummary = useMemo(
    () => buildRecurringStatusSummary(recurringInvoices),
    [recurringInvoices]
  );

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
    <section className="view-section finance-lite" aria-labelledby="invoices-title" data-density="compact">
      <PageHeader
        eyebrow="Finance"
        title="Invoices"
        titleId="invoices-title"
        description="Invoices, payments, and recurring schedules."
        filters={
          <FilterBar
            ariaLabel="Invoice view"
            onChange={(value) => setTab(value as "invoices" | "recurring")}
            options={[
              { value: "invoices", label: "Invoices" },
              { value: "recurring", label: "Recurring" }
            ]}
            value={tab}
          />
        }
        actions={
          canEdit ? (
            <Button
              disabled={clients.length === 0}
              onClick={tab === "invoices" ? openCreateInvoiceModal : openCreateRecurringModal}
              type="button"
              variant="primary"
            >
              {tab === "invoices" ? "New invoice" : "New recurring"}
            </Button>
          ) : null
        }
      />

      <StatusSummaryBar
        ariaLabel={tab === "invoices" ? "Invoice status summary" : "Recurring invoice status summary"}
        items={tab === "invoices" ? invoiceStatusSummary : recurringStatusSummary}
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
              label={invoiceEditorId ? "Update invoice" : "Create invoice"}
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
              <Input
                className="field-span-2"
                fullWidth
                helperText="Used on invoice cards and internal records."
                label="Invoice title / reference - Optional"
                maxLength={255}
                onChange={(event) => setInvoiceDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="PO number, client code, or internal reference"
                value={invoiceDraft.title}
              />
              <Input
                fullWidth
                helperText="Shown on the client-facing invoice."
                label="Invoice number - Required"
                maxLength={120}
                onChange={(event) => setInvoiceDraft((current) => ({ ...current, invoiceNumber: event.target.value }))}
                required
                placeholder="Client invoice number or internal billing reference"
                value={invoiceDraft.invoiceNumber}
              />
              <Input
                fullWidth
                helperText="Used for invoice due tracking."
                label="Invoice date - Required"
                onChange={(event) => setInvoiceDraft((current) => ({ ...current, issueDate: event.target.value }))}
                required
                type="date"
                value={invoiceDraft.issueDate}
              />
              <Input
                fullWidth
                helperText="Used for invoice due tracking."
                label="Due date - Required"
                onChange={(event) => setInvoiceDraft((current) => ({ ...current, dueDate: event.target.value }))}
                required
                type="date"
                value={invoiceDraft.dueDate}
              />
              <Input
                fullWidth
                helperText="Used for invoice totals and line items."
                label="Currency - Required"
                maxLength={3}
                onChange={(event) => setInvoiceDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
                placeholder="USD"
                required
                value={invoiceDraft.currency}
              />
              <Select
                fullWidth
                helperText="Controls invoice lifecycle only. It does not register payment."
                label="Status - Required"
                onChange={(event) => setInvoiceDraft((current) => ({ ...current, status: event.target.value }))}
                options={invoiceStatusOptions.map((status) => ({ value: status.value, label: status.label }))}
                required
                value={invoiceDraft.status}
              />
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
              <Input
                fullWidth
                label={moneyFieldLabel("Subtotal", invoiceDraft.currency)}
                readOnly
                value={centsToMajorInput(invoiceDraft.subtotalCents)}
              />
              <Input
                fullWidth
                label="Tax (%)"
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
              <Input
                fullWidth
                label="Discount (%)"
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
              <Input
                fullWidth
                label={moneyFieldLabel("Total", invoiceDraft.currency)}
                readOnly
                value={centsToMajorInput(invoiceDraft.totalCents)}
              />
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
              label={invoiceEditorId ? "Update invoice" : "Create invoice"}
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
              label={recurringEditorId ? "Update recurring invoice" : "Create recurring invoice"}
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
              <Input
                className="field-span-2"
                fullWidth
                helperText="Used on recurring invoice cards and internal records."
                label="Recurring title / reference - Optional"
                maxLength={255}
                onChange={(event) => setRecurringDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Billing cycle title or internal recurring reference"
                value={recurringDraft.title}
              />
              <Input
                fullWidth
                helperText="Used for the first scheduled billing cycle."
                label="Start date - Required"
                onChange={(event) => setRecurringDraft((current) => ({ ...current, startDate: event.target.value }))}
                required
                type="date"
                value={recurringDraft.startDate}
              />
              <Select
                fullWidth
                helperText="Controls how often the recurring invoice is due."
                label="Frequency - Required"
                onChange={(event) => setRecurringDraft((current) => ({ ...current, interval: event.target.value }))}
                options={recurringIntervalOptions.map((interval) => ({ value: interval, label: interval }))}
                required
                value={recurringDraft.interval}
              />
              <Input
                fullWidth
                helperText="Used for the next due record when present."
                label="Next run date - Optional"
                onChange={(event) => setRecurringDraft((current) => ({ ...current, nextRunDate: event.target.value }))}
                type="date"
                value={recurringDraft.nextRunDate}
              />
              <Select
                fullWidth
                helperText="Paused recurring invoices stay in history and do not generate due records."
                label="Active - Required"
                onChange={(event) => setRecurringDraft((current) => ({ ...current, isActive: event.target.value === "true" }))}
                options={[
                  { value: "true", label: "Active" },
                  { value: "false", label: "Paused" }
                ]}
                required
                value={recurringDraft.isActive ? "true" : "false"}
              />
              <Input
                fullWidth
                helperText="Optional stop date for the schedule."
                label="End date - Optional"
                onChange={(event) => setRecurringDraft((current) => ({ ...current, endDate: event.target.value }))}
                type="date"
                value={recurringDraft.endDate}
              />
              <Input
                fullWidth
                helperText="Used for recurring invoice totals and line items."
                label="Currency - Required"
                maxLength={3}
                onChange={(event) => setRecurringDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
                placeholder="USD"
                required
                value={recurringDraft.currency}
              />
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
              <Input
                fullWidth
                label={moneyFieldLabel("Subtotal", recurringDraft.currency)}
                readOnly
                value={centsToMajorInput(recurringDraft.subtotalCents)}
              />
              <Input
                fullWidth
                label="Tax (%)"
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
              <Input
                fullWidth
                label="Discount (%)"
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
              <Input
                fullWidth
                label={moneyFieldLabel("Total", recurringDraft.currency)}
                readOnly
                value={centsToMajorInput(recurringDraft.totalCents)}
              />
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
              label={recurringEditorId ? "Update recurring invoice" : "Create recurring invoice"}
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
              <Select
                fullWidth
                label="Payment method"
                onChange={(event) => setPaymentDraft((current) => ({ ...current, paymentMethod: event.target.value }))}
                options={paymentMethodOptions.map((option) => ({ value: option.value, label: option.label }))}
                required
                value={paymentDraft.paymentMethod}
              />
              <Input
                fullWidth
                label="Payment date"
                onChange={(event) => setPaymentDraft((current) => ({ ...current, paymentDate: event.target.value }))}
                required
                type="date"
                value={paymentDraft.paymentDate}
              />
              <Input
                fullWidth
                label={moneyFieldLabel("Amount issued", paymentInvoice?.currency ?? "USD")}
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
              <Input
                fullWidth
                label={moneyFieldLabel("Amount received", paymentInvoice?.currency ?? "USD")}
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
              <Textarea
                className="field-span-2"
                fullWidth
                label="Notes"
                maxLength={4000}
                onChange={(event) => setPaymentDraft((current) => ({ ...current, notes: event.target.value }))}
                rows={3}
                value={paymentDraft.notes}
              />
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
    return (
      <EmptyState
        message="Create an invoice to start tracking billing and payments."
        title="No invoices yet"
        variant="inline"
      />
    );
  }

  return (
    <div className="table-wrap finance-table-wrap table-scroll">
      <CompoundTable aria-label="Invoices">
        <TableHead>
          <CompoundTableRow>
            <Th>Invoice</Th>
            <Th>Client</Th>
            <Th>Status</Th>
            <Th align="right">Total</Th>
            <Th align="right">Paid</Th>
            <Th>Due</Th>
            <Th>Actions</Th>
          </CompoundTableRow>
        </TableHead>
        <TableBody>
          {invoices.map((invoice) => {
            const overdue = isInvoiceOverdue(invoice);
            return (
              <Fragment key={invoice.id}>
                <CompoundTableRow>
                  <TdDouble
                    primary={invoice.title}
                    secondary={[invoice.invoiceNumber || "No invoice number", invoice.project?.name ?? "No project"].filter(Boolean).join(" Â· ")}
                  />
                  <Td secondary>{invoice.client.name}</Td>
                  <Td>
                    <StatusBadge status={invoice.isArchived ? "ARCHIVED" : invoice.status} />
                    {invoice.payment ? <> <StatusBadge status="Paid recorded" /></> : null}
                    {overdue ? <> <StatusBadge status="overdue" /></> : null}
                  </Td>
                  <Td mono align="right">{formatMoney(invoice.totalCents, invoice.currency)}</Td>
                  <Td mono align="right">{formatMoney(invoice.amountPaidCents, invoice.currency)}</Td>
                  <Td mono>
                    <span className={financeDueDateClassName(overdue)}>{formatDateLabel(invoice.dueDate)}</span>
                  </Td>
                  <Td>
                    <div className="finance-row-actions">
                      {canEdit ? <Button size="sm" variant="secondary" onClick={() => onEditInvoice(invoice)} type="button">Edit</Button> : null}
                      {canEdit ? (
                        <details className="row-action-menu">
                          <summary>More</summary>
                          <div className="row-action-menu-panel">
                            <div className="row-action-menu-group">
                              <span className="row-action-menu-label">Lifecycle</span>
                              <Button size="sm" variant="secondary" onClick={() => void onMarkInvoiceSent(invoice.id)} type="button">Mark sent</Button>
                              {canRegisterPayment(invoice) ? <Button size="sm" variant="secondary" onClick={() => onRegisterInvoicePayment(invoice)} type="button">Register payment</Button> : null}
                            </div>
                            <div className="row-action-menu-group">
                              <span className="row-action-menu-label">Exceptions</span>
                              <Button size="sm" variant="secondary" onClick={() => void onCancelInvoice(invoice.id)} type="button">Cancel</Button>
                              {canMarkUncollectible(invoice) ? <Button size="sm" variant="secondary" onClick={() => void onMarkInvoiceUncollectible(invoice.id)} type="button">Mark uncollectible</Button> : null}
                              {!invoice.isArchived ? <Button size="sm" variant="secondary" onClick={() => void onArchiveInvoice(invoice.id)} type="button">Archive</Button> : null}
                            </div>
                          </div>
                        </details>
                      ) : null}
                    </div>
                  </Td>
                </CompoundTableRow>
                {invoice.payment ? (
                  <CompoundTableRow key={`${invoice.id}-payment`}>
                    <Td colSpan={7}>
                      <PaymentDetails currency={invoice.currency} payment={invoice.payment} />
                    </Td>
                  </CompoundTableRow>
                ) : null}
              </Fragment>
            );
          })}
        </TableBody>
      </CompoundTable>
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
    return (
      <EmptyState
        message="Configure a recurring schedule to generate invoices on an interval."
        title="No recurring invoices yet"
        variant="inline"
      />
    );
  }

  return (
    <div className="table-wrap finance-table-wrap table-scroll">
      <CompoundTable aria-label="Recurring invoices">
        <TableHead>
          <CompoundTableRow>
            <Th>Schedule</Th>
            <Th>Client</Th>
            <Th>Status</Th>
            <Th align="right">Total</Th>
            <Th>Interval</Th>
            <Th>Next run</Th>
            <Th>Actions</Th>
          </CompoundTableRow>
        </TableHead>
        <TableBody>
          {recurringInvoices.map((recurringInvoice) => (
            <CompoundTableRow key={recurringInvoice.id}>
              <TdDouble
                primary={recurringInvoice.title}
                secondary={recurringInvoice.project?.name ?? "No project"}
              />
              <Td secondary>{recurringInvoice.client.name}</Td>
              <Td>
                <StatusBadge status={recurringInvoice.isArchived ? "ARCHIVED" : recurringInvoice.isActive ? "ACTIVE" : "PAUSED"} />
              </Td>
              <Td mono align="right">{formatMoney(recurringInvoice.totalCents, recurringInvoice.currency)}</Td>
              <Td>{recurringInvoice.interval}</Td>
              <Td mono>{formatDateLabel(recurringInvoice.nextRunDate)}</Td>
              <Td>
                <div className="finance-row-actions">
                  {canEdit ? <Button size="sm" variant="secondary" onClick={() => onEditRecurringInvoice(recurringInvoice)} type="button">Edit</Button> : null}
                  {canEdit ? (
                    <details className="row-action-menu">
                      <summary>More</summary>
                      <div className="row-action-menu-panel">
                        <div className="row-action-menu-group">
                          <span className="row-action-menu-label">Recurring</span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => void onGenerateDueRecurringInvoice(recurringInvoice.id, toLocalDateInputValue())}
                            type="button"
                          >
                            Generate due
                          </Button>
                          {!recurringInvoice.isArchived ? <Button size="sm" variant="secondary" onClick={() => void onArchiveRecurringInvoice(recurringInvoice.id)} type="button">Archive</Button> : null}
                        </div>
                      </div>
                    </details>
                  ) : null}
                </div>
              </Td>
            </CompoundTableRow>
          ))}
        </TableBody>
      </CompoundTable>
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
      <Select
        disabled={clients.length === 0}
        fullWidth
        helperText="Required billing owner for this record."
        label="Client - Required"
        onChange={(event) => onClientChange(event.target.value)}
        options={[
          { value: "", label: "Select client" },
          ...clients.map((client) => ({ value: client.id, label: client.name }))
        ]}
        required
        value={clientId}
      />
      <Select
        fullWidth
        helperText="Optional billing context for this record."
        label="Project / reference - Optional"
        onChange={(event) => onProjectChange(event.target.value)}
        options={[
          { value: "", label: "No project / reference" },
          ...projects.map((project) => ({ value: project.id, label: project.name }))
        ]}
        value={projectId}
      />
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
  const firstDateKey = props.firstDateLabel === "Issue date" ? "issueDate" : "startDate";
  const secondDateKey = props.secondDateLabel === "Due date" ? "dueDate" : "endDate";

  return (
    <>
      <Input
        fullWidth
        label={props.firstDateLabel}
        onChange={(event) => props.onChange({ [firstDateKey]: event.target.value })}
        type="date"
        value={props.firstDateValue}
      />
      <Input
        fullWidth
        label={props.secondDateLabel}
        onChange={(event) => props.onChange({ [secondDateKey]: event.target.value })}
        type="date"
        value={props.dueDate}
      />
      <Input
        fullWidth
        label="Currency"
        maxLength={3}
        onChange={(event) => props.onChange({ currency: event.target.value.toUpperCase() })}
        required
        value={props.currency}
      />
      <Input
        fullWidth
        label={moneyFieldLabel("Subtotal", props.currency)}
        min={0}
        onChange={(event) => props.onChange({ subtotalCents: majorInputToCents(event.target.value) })}
        step="0.01"
        type="number"
        value={centsToMajorInput(props.subtotalCents)}
      />
      <Input
        fullWidth
        label={moneyFieldLabel("Tax", props.currency)}
        min={0}
        onChange={(event) => props.onChange({ taxCents: majorInputToCents(event.target.value) })}
        step="0.01"
        type="number"
        value={centsToMajorInput(props.taxCents)}
      />
      <Input
        fullWidth
        label={moneyFieldLabel("Discount", props.currency)}
        min={0}
        onChange={(event) => props.onChange({ discountCents: majorInputToCents(event.target.value) })}
        step="0.01"
        type="number"
        value={centsToMajorInput(props.discountCents)}
      />
      <Input
        fullWidth
        label={moneyFieldLabel("Total", props.currency)}
        min={0}
        onChange={(event) => props.onChange({ totalCents: majorInputToCents(event.target.value) })}
        step="0.01"
        type="number"
        value={centsToMajorInput(props.totalCents)}
      />
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
      <Textarea
        className="field-span-2"
        fullWidth
        helperText="Shown on client-facing invoice."
        label="Payment instructions - Optional"
        maxLength={4000}
        onChange={(event) => props.onChange({ paymentInstructions: event.target.value })}
        placeholder="Payment terms or client-facing invoice note"
        rows={3}
        value={props.paymentInstructions}
      />
      <Textarea
        className="field-span-2"
        fullWidth
        helperText="Visible only to admin team."
        label="Internal notes - Optional"
        maxLength={4000}
        onChange={(event) => props.onChange({ notes: event.target.value })}
        placeholder="Notes for admin team only"
        rows={3}
        value={props.notes}
      />
      <Input
        className="field-span-2"
        fullWidth
        helperText={props.storageLabel ? "Shown only in admin record." : "Used for admin reference."}
        label={`${props.documentLabel} - Optional`}
        maxLength={2048}
        onChange={(event) => props.onChange(props.storageLabel ? { documentUrl: event.target.value } : { documentFolderHint: event.target.value })}
        placeholder={props.storageLabel ? "PO number, client code, or internal reference" : "Admin document URL or folder hint"}
        value={props.documentValue}
      />
      {props.storageLabel ? (
        <Input
          className="field-span-2"
          fullWidth
          helperText="Visible only to admin team."
          label={`${props.storageLabel} - Optional`}
          maxLength={2048}
          onChange={(event) => props.onChange({ documentStorageKey: event.target.value })}
          placeholder="Storage key or internal document path"
          value={props.storageValue}
        />
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
      description: [invoiceItem.name, invoiceItem.description].filter(Boolean).join(" â€” "),
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
          <Select
            className="field-span-2"
            fullWidth
            helperText="Pick a reusable service to prefill the row."
            label="Service / item - Optional"
            onChange={(event) => selectInvoiceItem(index, event.target.value)}
            options={[
              { value: "", label: "Select a reusable service" },
              ...invoiceItems.map((invoiceItem) => ({ value: invoiceItem.id, label: invoiceItem.name }))
            ]}
            value=""
          />
          <Textarea
            className="field-span-2"
            fullWidth
            helperText="Shown on the client-facing invoice."
            label="Description / details - Optional"
            maxLength={500}
            onChange={(event) => updateLineItem(index, { description: event.target.value })}
            placeholder="Service, deliverable, or billing item"
            rows={3}
            value={item.description}
          />
          <Input
            fullWidth
            helperText="Used to calculate the line total."
            label="Quantity - Required"
            min={0}
            onChange={(event) => updateQuantity(index, event.target.valueAsNumber || 0)}
            placeholder="Number of units, hours, or items"
            type="number"
            value={item.quantity}
          />
          <Input
            fullWidth
            helperText="Shown as the pre-tax rate for this row."
            label={`${moneyFieldLabel("Unit price", currency)} - Required`}
            min={0}
            onChange={(event) => { updateUnitPriceInput(index, event.target.value); updateUnitPrice(index, majorInputToCents(event.target.value)); }}
            placeholder="Price per unit before tax or discount"
            step="0.01"
            type="number"
            value={unitPriceInputs?.[index] ?? centsToMajorInput(item.unitPriceCents)}
          />
          <Input
            fullWidth
            helperText="Calculated from quantity and unit price."
            label={moneyFieldLabel("Line total", currency)}
            readOnly
            value={centsToMajorInput(item.totalCents)}
          />
          <div className="card-actions">
            <Button size="sm" variant="secondary" disabled={lineItems.length === 1} onClick={() => { onChange(lineItems.filter((_, itemIndex) => itemIndex !== index)); onUnitPriceInputsChange?.((unitPriceInputs ?? []).filter((_, itemIndex) => itemIndex !== index)); }} type="button">Remove line</Button>
          </div>
        </div>
      ))}
      <Button size="sm" variant="secondary" onClick={() => { onChange([...lineItems, emptyLineItem(lineItems.length)]); onUnitPriceInputsChange?.([...(unitPriceInputs ?? lineItems.map((item) => centsToMajorInput(item.unitPriceCents))), centsToMajorInput(0)]); }} type="button">Add line item</Button>
    </div>
  );
}
