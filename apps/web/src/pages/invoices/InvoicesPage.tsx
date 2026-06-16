import { type FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import type { ClientSummary } from "../clients/ClientsPage";
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
  clients: ClientSummary[];
  projects: ProjectSummary[];
  canEdit: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  onSaveInvoice: (invoiceId: string | null, values: InvoiceFormValues) => Promise<boolean>;
  onArchiveInvoice: (invoiceId: string) => Promise<boolean>;
  onMarkInvoiceSent: (invoiceId: string) => Promise<boolean>;
  onCancelInvoice: (invoiceId: string) => Promise<boolean>;
  onRegisterInvoicePayment: (invoiceId: string, values: InvoicePaymentFormValues) => Promise<boolean>;
  onSaveRecurringInvoice: (recurringInvoiceId: string | null, values: RecurringInvoiceFormValues) => Promise<boolean>;
  onArchiveRecurringInvoice: (recurringInvoiceId: string) => Promise<boolean>;
  onGenerateDueRecurringInvoice: (recurringInvoiceId: string, targetDate: string) => Promise<boolean>;
};

const invoiceStatusOptions = ["DRAFT", "SENT", "PAID", "CANCELLED"] as const;
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

function formatPaymentMethod(value: string): string {
  return paymentMethodOptions.find((option) => option.value === value)?.label ?? value;
}

function firstClientId(clients: ClientSummary[]): string {
  return clients.find((client) => !client.isArchived)?.id ?? clients[0]?.id ?? "";
}

export function InvoicesPage({
  invoices,
  recurringInvoices,
  clients,
  projects,
  canEdit,
  isLoading,
  errorMessage,
  onSaveInvoice,
  onArchiveInvoice,
  onMarkInvoiceSent,
  onCancelInvoice,
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

  function openCreateInvoiceModal() {
    setInvoiceEditorId(null);
    setInvoiceDraft(emptyInvoiceForm(firstClientId(clients)));
    setIsInvoiceEditorOpen(true);
  }

  function openEditInvoiceModal(invoice: InvoiceSummary) {
    setInvoiceEditorId(invoice.id);
    setInvoiceDraft({
      clientId: invoice.clientId,
      projectId: invoice.projectId ?? "",
      invoiceNumber: invoice.invoiceNumber,
      title: invoice.title,
      status: invoiceStatusOptions.includes(invoice.status as (typeof invoiceStatusOptions)[number]) ? invoice.status : "DRAFT",
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
      lineItems: invoice.lineItems.length > 0 ? invoice.lineItems : [emptyLineItem()]
    });
    setIsInvoiceEditorOpen(true);
  }

  function openCreateRecurringModal() {
    setRecurringEditorId(null);
    setRecurringDraft(emptyRecurringForm(firstClientId(clients)));
    setIsRecurringEditorOpen(true);
  }

  function openEditRecurringModal(recurringInvoice: RecurringInvoiceSummary) {
    setRecurringEditorId(recurringInvoice.id);
    setRecurringDraft({
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
      lineItems: recurringInvoice.lineItems.length > 0 ? recurringInvoice.lineItems : [emptyLineItem()]
    });
    setIsRecurringEditorOpen(true);
  }

  function openPaymentModal(invoice: InvoiceSummary) {
    setPaymentInvoice(invoice);
    setPaymentDraft({
      ...emptyPaymentForm(),
      amountIssuedCents: invoice.totalCents,
      amountReceivedCents: invoice.totalCents
    });
    setIsPaymentEditorOpen(true);
  }

  async function handleInvoiceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const ok = await onSaveInvoice(invoiceEditorId, invoiceDraft);
      if (ok) {
        setInvoiceEditorId(null);
        setInvoiceDraft(emptyInvoiceForm(firstClientId(clients)));
        setIsInvoiceEditorOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRecurringSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const ok = await onSaveRecurringInvoice(recurringEditorId, recurringDraft);
      if (ok) {
        setRecurringEditorId(null);
        setRecurringDraft(emptyRecurringForm(firstClientId(clients)));
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
      <div className="section-header">
        <div>
          <p className="eyebrow">Finance</p>
          <h1 id="invoices-title">Invoices</h1>
        </div>
        <div className="toolbar">
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
        </div>
      </div>

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
          onClose={() => {
            setInvoiceEditorId(null);
            setInvoiceDraft(emptyInvoiceForm(firstClientId(clients)));
            setIsInvoiceEditorOpen(false);
          }}
          title={invoiceEditorId ? "Edit Invoice" : "Add Invoice"}
        >
          <form className="entity-form" onSubmit={handleInvoiceSubmit}>
            <div className="field-grid">
              <ClientProjectFields
                clients={clients}
                clientId={invoiceDraft.clientId}
                onClientChange={(clientId) => setInvoiceDraft((current) => ({ ...current, clientId, projectId: "" }))}
                onProjectChange={(projectId) => setInvoiceDraft((current) => ({ ...current, projectId }))}
                projectId={invoiceDraft.projectId}
                projects={invoiceProjects}
              />
              <label>
                Invoice number
                <input
                  maxLength={120}
                  onChange={(event) => setInvoiceDraft((current) => ({ ...current, invoiceNumber: event.target.value }))}
                  required
                  value={invoiceDraft.invoiceNumber}
                />
              </label>
              <label>
                Title
                <input
                  maxLength={255}
                  onChange={(event) => setInvoiceDraft((current) => ({ ...current, title: event.target.value }))}
                  required
                  value={invoiceDraft.title}
                />
              </label>
              <label>
                Status
                <select onChange={(event) => setInvoiceDraft((current) => ({ ...current, status: event.target.value }))} value={invoiceDraft.status}>
                  {invoiceStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <DateAndMoneyFields
                currency={invoiceDraft.currency}
                discountCents={invoiceDraft.discountCents}
                dueDate={invoiceDraft.dueDate}
                firstDateLabel="Issue date"
                firstDateValue={invoiceDraft.issueDate}
                onChange={(values) => setInvoiceDraft((current) => ({ ...current, ...values }))}
                secondDateLabel="Due date"
                subtotalCents={invoiceDraft.subtotalCents}
                taxCents={invoiceDraft.taxCents}
                totalCents={invoiceDraft.totalCents}
              />
              <label>
                Amount paid cents
                <input
                  min={0}
                  onChange={(event) => setInvoiceDraft((current) => ({ ...current, amountPaidCents: event.target.valueAsNumber || 0 }))}
                  type="number"
                  value={invoiceDraft.amountPaidCents}
                />
              </label>
              <TextAreaFields
                documentLabel="Document URL"
                documentValue={invoiceDraft.documentUrl}
                notes={invoiceDraft.notes}
                onChange={(values) => setInvoiceDraft((current) => ({ ...current, ...values }))}
                paymentInstructions={invoiceDraft.paymentInstructions}
                storageLabel="Document storage key"
                storageValue={invoiceDraft.documentStorageKey}
              />
            </div>
            <LineItemsEditor
              lineItems={invoiceDraft.lineItems}
              onChange={(lineItems) => setInvoiceDraft((current) => ({ ...current, lineItems }))}
            />
            <ModalActions disabled={saving || clients.length === 0} onCancel={() => setIsInvoiceEditorOpen(false)} saving={saving} />
          </form>
        </Modal>
      ) : null}

      {isRecurringEditorOpen ? (
        <Modal
          onClose={() => {
            setRecurringEditorId(null);
            setRecurringDraft(emptyRecurringForm(firstClientId(clients)));
            setIsRecurringEditorOpen(false);
          }}
          title={recurringEditorId ? "Edit Recurring Invoice" : "Add Recurring Invoice"}
        >
          <form className="entity-form" onSubmit={handleRecurringSubmit}>
            <div className="field-grid">
              <ClientProjectFields
                clients={clients}
                clientId={recurringDraft.clientId}
                onClientChange={(clientId) => setRecurringDraft((current) => ({ ...current, clientId, projectId: "" }))}
                onProjectChange={(projectId) => setRecurringDraft((current) => ({ ...current, projectId }))}
                projectId={recurringDraft.projectId}
                projects={recurringProjects}
              />
              <label>
                Title
                <input
                  maxLength={255}
                  onChange={(event) => setRecurringDraft((current) => ({ ...current, title: event.target.value }))}
                  required
                  value={recurringDraft.title}
                />
              </label>
              <label>
                Interval
                <select onChange={(event) => setRecurringDraft((current) => ({ ...current, interval: event.target.value }))} value={recurringDraft.interval}>
                  {recurringIntervalOptions.map((interval) => (
                    <option key={interval} value={interval}>
                      {interval}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Active
                <select
                  onChange={(event) => setRecurringDraft((current) => ({ ...current, isActive: event.target.value === "true" }))}
                  value={recurringDraft.isActive ? "true" : "false"}
                >
                  <option value="true">Active</option>
                  <option value="false">Paused</option>
                </select>
              </label>
              <DateAndMoneyFields
                currency={recurringDraft.currency}
                discountCents={recurringDraft.discountCents}
                dueDate={recurringDraft.endDate}
                firstDateLabel="Start date"
                firstDateValue={recurringDraft.startDate}
                onChange={(values) => setRecurringDraft((current) => ({ ...current, ...values }))}
                secondDateLabel="End date"
                subtotalCents={recurringDraft.subtotalCents}
                taxCents={recurringDraft.taxCents}
                totalCents={recurringDraft.totalCents}
              />
              <label>
                Next run date
                <input
                  onChange={(event) => setRecurringDraft((current) => ({ ...current, nextRunDate: event.target.value }))}
                  type="date"
                  value={recurringDraft.nextRunDate}
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
            <LineItemsEditor
              lineItems={recurringDraft.lineItems}
              onChange={(lineItems) => setRecurringDraft((current) => ({ ...current, lineItems }))}
            />
            <ModalActions disabled={saving || clients.length === 0} onCancel={() => setIsRecurringEditorOpen(false)} saving={saving} />
          </form>
        </Modal>
      ) : null}

      {isPaymentEditorOpen ? (
        <Modal
          onClose={() => {
            setPaymentInvoice(null);
            setPaymentDraft(emptyPaymentForm());
            setIsPaymentEditorOpen(false);
          }}
          title="Register Payment"
        >
          <form className="entity-form" onSubmit={handlePaymentSubmit}>
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
                Amount issued cents
                <input
                  min={0}
                  onChange={(event) => setPaymentDraft((current) => ({ ...current, amountIssuedCents: event.target.valueAsNumber || 0 }))}
                  required
                  type="number"
                  value={paymentDraft.amountIssuedCents}
                />
              </label>
              <label>
                Amount received cents
                <input
                  min={0}
                  onChange={(event) => setPaymentDraft((current) => ({ ...current, amountReceivedCents: event.target.valueAsNumber || 0 }))}
                  required
                  type="number"
                  value={paymentDraft.amountReceivedCents}
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
  onRegisterInvoicePayment: (invoice: InvoiceSummary) => void;
};

function canRegisterPayment(invoice: InvoiceSummary): boolean {
  return !invoice.payment && !invoice.isArchived && !["PAID", "VOIDED", "CANCELLED", "UNCOLLECTIBLE"].includes(invoice.status);
}

function InvoiceCards({ invoices, canEdit, onEditInvoice, onArchiveInvoice, onMarkInvoiceSent, onCancelInvoice, onRegisterInvoicePayment }: InvoiceCardsProps) {
  if (invoices.length === 0) {
    return <EmptyState message="No invoices have been created yet." title="No invoices" />;
  }

  return (
    <div className="entity-grid">
      {invoices.map((invoice) => (
        <article className="entity-card" key={invoice.id}>
          <div className="entity-card-header">
            <div>
              <span className={`entity-pill entity-pill-${invoice.isArchived ? "archived" : "active"}`}>{invoice.status}</span>
              <h2>{invoice.title}</h2>
            </div>
            <div className="card-actions">
              {canEdit ? <button className="secondary-action" onClick={() => onEditInvoice(invoice)} type="button">Edit</button> : null}
              {canEdit ? <button className="secondary-action" onClick={() => void onMarkInvoiceSent(invoice.id)} type="button">Mark sent</button> : null}
              {canEdit && canRegisterPayment(invoice) ? <button className="secondary-action" onClick={() => onRegisterInvoicePayment(invoice)} type="button">Register payment</button> : null}
              {canEdit ? <button className="secondary-action" onClick={() => void onCancelInvoice(invoice.id)} type="button">Cancel</button> : null}
              {canEdit && !invoice.isArchived ? <button className="secondary-action" onClick={() => void onArchiveInvoice(invoice.id)} type="button">Archive</button> : null}
            </div>
          </div>
          <InvoiceFieldGrid
            amountPaidCents={invoice.amountPaidCents}
            clientName={invoice.client.name}
            currency={invoice.currency}
            discountCents={invoice.discountCents}
            documentLabel="Document"
            documentValue={invoice.documentUrl || invoice.documentStorageKey || "Not set"}
            dueDate={invoice.dueDate}
            firstDateLabel="Issue date"
            firstDateValue={invoice.issueDate}
            notes={invoice.notes}
            paymentInstructions={invoice.paymentInstructions}
            projectName={invoice.project?.name ?? "Not set"}
            referenceLabel="Invoice number"
            referenceValue={invoice.invoiceNumber}
            subtotalCents={invoice.subtotalCents}
            taxCents={invoice.taxCents}
            totalCents={invoice.totalCents}
          />
          {invoice.payment ? <PaymentDetails currency={invoice.currency} payment={invoice.payment} /> : null}
        </article>
      ))}
    </div>
  );
}

function PaymentDetails({ currency, payment }: { currency: string; payment: InvoicePaymentSummary }) {
  return (
    <div className="entity-field-grid">
      <div><span>Payment method</span><strong>{formatPaymentMethod(payment.paymentMethod)}</strong></div>
      <div><span>Payment date</span><strong>{formatDateLabel(payment.paymentDate)}</strong></div>
      <div><span>Amount issued</span><strong>{formatMoney(payment.amountIssuedCents, currency)}</strong></div>
      <div><span>Amount received</span><strong>{formatMoney(payment.amountReceivedCents, currency)}</strong></div>
      <div><span>Difference</span><strong>{formatMoney(payment.differenceCents, currency)}</strong></div>
      <div className="entity-span-2"><span>Payment notes</span><strong>{payment.notes || "Not set"}</strong></div>
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
    return <EmptyState message="No recurring invoices have been configured yet." title="No recurring invoices" />;
  }

  return (
    <div className="entity-grid">
      {recurringInvoices.map((recurringInvoice) => (
        <article className="entity-card" key={recurringInvoice.id}>
          <div className="entity-card-header">
            <div>
              <span className={`entity-pill entity-pill-${recurringInvoice.isArchived ? "archived" : "active"}`}>
                {recurringInvoice.isActive ? "Active" : "Paused"}
              </span>
              <h2>{recurringInvoice.title}</h2>
            </div>
            <div className="card-actions">
              {canEdit ? <button className="secondary-action" onClick={() => onEditRecurringInvoice(recurringInvoice)} type="button">Edit</button> : null}
              {canEdit ? (
                <button
                  className="secondary-action"
                  onClick={() => void onGenerateDueRecurringInvoice(recurringInvoice.id, toLocalDateInputValue())}
                  type="button"
                >
                  Generate due
                </button>
              ) : null}
              {canEdit && !recurringInvoice.isArchived ? <button className="secondary-action" onClick={() => void onArchiveRecurringInvoice(recurringInvoice.id)} type="button">Archive</button> : null}
            </div>
          </div>
          <InvoiceFieldGrid
            amountPaidCents={null}
            clientName={recurringInvoice.client.name}
            currency={recurringInvoice.currency}
            discountCents={recurringInvoice.discountCents}
            documentLabel="Folder hint"
            documentValue={recurringInvoice.documentFolderHint || "Not set"}
            dueDate={recurringInvoice.nextRunDate}
            firstDateLabel="Start date"
            firstDateValue={recurringInvoice.startDate}
            notes={recurringInvoice.notes}
            paymentInstructions={recurringInvoice.paymentInstructions}
            projectName={recurringInvoice.project?.name ?? "Not set"}
            referenceLabel="Interval"
            referenceValue={recurringInvoice.interval}
            subtotalCents={recurringInvoice.subtotalCents}
            taxCents={recurringInvoice.taxCents}
            totalCents={recurringInvoice.totalCents}
          />
        </article>
      ))}
    </div>
  );
}

type InvoiceFieldGridProps = {
  clientName: string;
  projectName: string;
  referenceLabel: string;
  referenceValue: string;
  firstDateLabel: string;
  firstDateValue: string | null;
  dueDate: string | null;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  amountPaidCents: number | null;
  notes: string | null;
  paymentInstructions: string | null;
  documentLabel: string;
  documentValue: string;
};

function InvoiceFieldGrid(props: InvoiceFieldGridProps) {
  return (
    <div className="entity-field-grid">
      <div><span>Client</span><strong>{props.clientName}</strong></div>
      <div><span>Project</span><strong>{props.projectName}</strong></div>
      <div><span>{props.referenceLabel}</span><strong>{props.referenceValue || "Not set"}</strong></div>
      <div><span>{props.firstDateLabel}</span><strong>{formatDateLabel(props.firstDateValue)}</strong></div>
      <div><span>Due / next run</span><strong>{formatDateLabel(props.dueDate)}</strong></div>
      <div><span>Total</span><strong>{formatMoney(props.totalCents, props.currency)}</strong></div>
      <div><span>Subtotal</span><strong>{formatMoney(props.subtotalCents, props.currency)}</strong></div>
      <div><span>Tax</span><strong>{formatMoney(props.taxCents, props.currency)}</strong></div>
      <div><span>Discount</span><strong>{formatMoney(props.discountCents, props.currency)}</strong></div>
      {props.amountPaidCents === null ? null : <div><span>Amount paid</span><strong>{formatMoney(props.amountPaidCents, props.currency)}</strong></div>}
      <div className="entity-span-2"><span>Payment instructions</span><strong>{props.paymentInstructions || "Not set"}</strong></div>
      <div className="entity-span-2"><span>{props.documentLabel}</span><strong>{props.documentValue}</strong></div>
      <div className="entity-span-2"><span>Notes</span><strong>{props.notes || "Not set"}</strong></div>
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
        Client
        <select disabled={clients.length === 0} onChange={(event) => onClientChange(event.target.value)} required value={clientId}>
          <option value="">Select client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </label>
      <label>
        Project
        <select onChange={(event) => onProjectChange(event.target.value)} value={projectId}>
          <option value="">No project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
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
      <label>Subtotal cents<input min={0} onChange={(event) => props.onChange({ subtotalCents: event.target.valueAsNumber || 0 })} type="number" value={props.subtotalCents} /></label>
      <label>Tax cents<input min={0} onChange={(event) => props.onChange({ taxCents: event.target.valueAsNumber || 0 })} type="number" value={props.taxCents} /></label>
      <label>Discount cents<input min={0} onChange={(event) => props.onChange({ discountCents: event.target.valueAsNumber || 0 })} type="number" value={props.discountCents} /></label>
      <label>Total cents<input min={0} onChange={(event) => props.onChange({ totalCents: event.target.valueAsNumber || 0 })} type="number" value={props.totalCents} /></label>
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
      <label className="field-span-2">Notes<textarea maxLength={4000} onChange={(event) => props.onChange({ notes: event.target.value })} rows={3} value={props.notes} /></label>
      <label className="field-span-2">Payment instructions<textarea maxLength={4000} onChange={(event) => props.onChange({ paymentInstructions: event.target.value })} rows={3} value={props.paymentInstructions} /></label>
      <label className="field-span-2">{props.documentLabel}<input maxLength={2048} onChange={(event) => props.onChange(props.storageLabel ? { documentUrl: event.target.value } : { documentFolderHint: event.target.value })} value={props.documentValue} /></label>
      {props.storageLabel ? <label className="field-span-2">{props.storageLabel}<input maxLength={2048} onChange={(event) => props.onChange({ documentStorageKey: event.target.value })} value={props.storageValue} /></label> : null}
    </>
  );
}

type LineItemsEditorProps = {
  lineItems: InvoiceLineItemFormValues[];
  onChange: (lineItems: InvoiceLineItemFormValues[]) => void;
};

function LineItemsEditor({ lineItems, onChange }: LineItemsEditorProps) {
  function updateLineItem(index: number, values: Partial<InvoiceLineItemFormValues>) {
    onChange(lineItems.map((item, itemIndex) => (itemIndex === index ? { ...item, ...values } : item)));
  }

  return (
    <div className="entity-form">
      <h3>Line items</h3>
      {lineItems.map((item, index) => (
        <div className="field-grid" key={index}>
          <label className="field-span-2">Description<input maxLength={500} onChange={(event) => updateLineItem(index, { description: event.target.value })} value={item.description} /></label>
          <label>Quantity<input min={0} onChange={(event) => updateLineItem(index, { quantity: event.target.valueAsNumber || 0 })} type="number" value={item.quantity} /></label>
          <label>Unit price cents<input min={0} onChange={(event) => updateLineItem(index, { unitPriceCents: event.target.valueAsNumber || 0 })} type="number" value={item.unitPriceCents} /></label>
          <label>Total cents<input min={0} onChange={(event) => updateLineItem(index, { totalCents: event.target.valueAsNumber || 0 })} type="number" value={item.totalCents} /></label>
          <label>Sort order<input min={0} onChange={(event) => updateLineItem(index, { sortOrder: event.target.valueAsNumber || 0 })} type="number" value={item.sortOrder} /></label>
          <div className="card-actions">
            <button className="secondary-action" disabled={lineItems.length === 1} onClick={() => onChange(lineItems.filter((_, itemIndex) => itemIndex !== index))} type="button">Remove line</button>
          </div>
        </div>
      ))}
      <button className="secondary-action" onClick={() => onChange([...lineItems, emptyLineItem(lineItems.length)])} type="button">Add line item</button>
    </div>
  );
}

type ModalActionsProps = {
  disabled: boolean;
  saving: boolean;
  onCancel: () => void;
};

function ModalActions({ disabled, saving, onCancel }: ModalActionsProps) {
  return (
    <div className="modal-footer">
      <button className="secondary-action" disabled={saving} onClick={onCancel} type="button">Cancel</button>
      <button className="primary-action" disabled={disabled} type="submit">{saving ? "Saving" : "Save"}</button>
    </div>
  );
}
