import { type FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import type { InvoiceItemSummary } from "../invoice-items/InvoiceItemsPage";
import type { InvoiceSummary } from "../invoices/InvoicesPage";

type CreditNoteLineItemFormValues = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  sortOrder: number;
};

export type CreditNoteSummary = {
  id: string;
  invoiceId: string;
  creditNoteNumber: string;
  status: "DRAFT" | "ISSUED" | "VOIDED" | string;
  issueDate: string | null;
  reason: string;
  amountCents: number;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  documentUrl?: string | null;
  documentStorageKey?: string | null;
  isArchived: boolean;
  lineItems: Array<CreditNoteLineItemFormValues & { id?: string }>;
  createdAt: string;
  updatedAt: string;
};

export type CreditNoteFormValues = {
  reason: string;
  amountCents: number;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  documentUrl: string;
  documentStorageKey: string;
  lineItems: CreditNoteLineItemFormValues[];
};

type InvoiceWithCreditNotes = InvoiceSummary & {
  creditNotes?: CreditNoteSummary[];
};

type CreditNoteWithInvoice = CreditNoteSummary & {
  invoice: InvoiceWithCreditNotes;
};

type CreditNotesPageProps = {
  invoices: InvoiceWithCreditNotes[];
  invoiceItems: InvoiceItemSummary[];
  canEdit: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  onIssueCreditNote: (creditNoteId: string) => Promise<boolean>;
  onSaveCreditNote: (invoiceId: string, creditNoteId: string | null, values: CreditNoteFormValues) => Promise<boolean>;
  onVoidCreditNote: (creditNoteId: string) => Promise<boolean>;
};

const creditNoteStatusOptions = [
  { label: "Draft", value: "DRAFT" },
  { label: "Issued", value: "ISSUED" },
  { label: "Voided", value: "VOIDED" }
] as const;

const emptyLineItem = (sortOrder = 0): CreditNoteLineItemFormValues => ({
  description: "",
  quantity: 1,
  sortOrder,
  totalCents: 0,
  unitPriceCents: 0
});

const emptyCreditNoteForm = (currency = "USD"): CreditNoteFormValues => ({
  amountCents: 0,
  currency,
  discountCents: 0,
  documentStorageKey: "",
  documentUrl: "",
  lineItems: [emptyLineItem()],
  reason: "",
  subtotalCents: 0,
  taxCents: 0,
  totalCents: 0
});

function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : "";
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

function percentInputToNumber(value: string): number {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function toNonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function calculateCreditNoteTotals(lineItems: CreditNoteLineItemFormValues[], taxPercentInput: string, discountPercentInput: string) {
  const subtotalCents = lineItems.reduce((sum, item) => sum + item.totalCents, 0);
  const taxCents = Math.round((subtotalCents * percentInputToNumber(taxPercentInput)) / 100);
  const discountCents = Math.round((subtotalCents * percentInputToNumber(discountPercentInput)) / 100);
  const totalCents = Math.max(0, subtotalCents + taxCents - discountCents);
  return { amountCents: totalCents, discountCents, subtotalCents, taxCents, totalCents };
}

function percentFromCents(amountCents: number, subtotalCents: number): string {
  if (subtotalCents <= 0 || amountCents <= 0) {
    return "0";
  }

  return String(Math.round((amountCents / subtotalCents) * 10000) / 100);
}

function formatCreditNoteStatus(value: string): string {
  const status = value.trim().toUpperCase();
  return creditNoteStatusOptions.find((option) => option.value === status)?.label ?? "Draft";
}

function formatLineItemSummary(lineItems: CreditNoteSummary["lineItems"], currency: string): string {
  if (lineItems.length === 0) {
    return "No line items";
  }

  return lineItems
    .map((lineItem) => `${lineItem.description} × ${lineItem.quantity} (${formatMoney(lineItem.totalCents, currency)})`)
    .join("; ");
}

function normalizeLineItems(lineItems: CreditNoteLineItemFormValues[], fallbackDescription: string): CreditNoteLineItemFormValues[] {
  return lineItems.map((item, index) => {
    const quantity = Math.max(1, toNonNegativeInteger(item.quantity));
    const unitPriceCents = toNonNegativeInteger(item.unitPriceCents);
    return {
      description: item.description.trim() || fallbackDescription,
      quantity,
      sortOrder: index,
      totalCents: quantity * unitPriceCents,
      unitPriceCents
    };
  });
}

function lineItemsFromInvoice(invoice: InvoiceWithCreditNotes): CreditNoteLineItemFormValues[] {
  const lineItems = invoice.lineItems.length > 0 ? invoice.lineItems : [emptyLineItem()];
  return lineItems.map((lineItem, index) => ({
    description: lineItem.description,
    quantity: lineItem.quantity,
    sortOrder: index,
    totalCents: lineItem.totalCents,
    unitPriceCents: lineItem.unitPriceCents
  }));
}

function firstAvailableInvoice(invoices: InvoiceWithCreditNotes[]): InvoiceWithCreditNotes | null {
  return invoices.find((invoice) => !invoice.isArchived) ?? invoices[0] ?? null;
}

export function CreditNotesPage({
  invoices,
  invoiceItems,
  canEdit,
  errorMessage,
  isLoading,
  onIssueCreditNote,
  onSaveCreditNote,
  onVoidCreditNote
}: CreditNotesPageProps) {
  const [editorId, setEditorId] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<CreditNoteFormValues>(emptyCreditNoteForm());
  const [unitPriceInputs, setUnitPriceInputs] = useState<string[]>([centsToMajorInput(0)]);
  const [taxPercentInput, setTaxPercentInput] = useState("0");
  const [discountPercentInput, setDiscountPercentInput] = useState("0");
  const [saving, setSaving] = useState(false);

  const creditNotes = useMemo(
    () =>
      invoices
        .flatMap((invoice) => (invoice.creditNotes ?? []).map((creditNote) => ({ ...creditNote, invoice })))
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [invoices]
  );

  const totals = useMemo(() => {
    const activeNotes = creditNotes.filter((creditNote) => !creditNote.isArchived && creditNote.status !== "VOIDED");
    return {
      draftCount: creditNotes.filter((creditNote) => creditNote.status === "DRAFT").length,
      issuedCents: activeNotes
        .filter((creditNote) => creditNote.status === "ISSUED")
        .reduce((sum, creditNote) => sum + creditNote.totalCents, 0),
      totalCount: creditNotes.length,
      voidedCount: creditNotes.filter((creditNote) => creditNote.status === "VOIDED").length
    };
  }, [creditNotes]);

  function setDraftWithCalculatedTotals(values: CreditNoteFormValues, nextTaxPercent = taxPercentInput, nextDiscountPercent = discountPercentInput) {
    const lineItems = values.lineItems.map((item, index) => ({
      ...item,
      sortOrder: index,
      totalCents: Math.round(item.quantity * item.unitPriceCents)
    }));
    setDraft({ ...values, ...calculateCreditNoteTotals(lineItems, nextTaxPercent, nextDiscountPercent), lineItems });
  }

  function updateLineItems(lineItems: CreditNoteLineItemFormValues[], nextTaxPercent = taxPercentInput, nextDiscountPercent = discountPercentInput) {
    setDraft((current) => {
      const normalizedLineItems = lineItems.map((item, index) => ({
        ...item,
        sortOrder: index,
        totalCents: Math.round(item.quantity * item.unitPriceCents)
      }));
      return {
        ...current,
        ...calculateCreditNoteTotals(normalizedLineItems, nextTaxPercent, nextDiscountPercent),
        lineItems: normalizedLineItems
      };
    });
  }

  function resetEditor() {
    setEditorId(null);
    setInvoiceId("");
    setDraft(emptyCreditNoteForm());
    setUnitPriceInputs([centsToMajorInput(0)]);
    setTaxPercentInput("0");
    setDiscountPercentInput("0");
    setIsEditorOpen(false);
  }

  function applyInvoice(invoice: InvoiceWithCreditNotes) {
    const lineItems = lineItemsFromInvoice(invoice);
    const taxPercent = percentFromCents(invoice.taxCents, invoice.subtotalCents);
    const discountPercent = percentFromCents(invoice.discountCents, invoice.subtotalCents);
    setInvoiceId(invoice.id);
    setTaxPercentInput(taxPercent);
    setDiscountPercentInput(discountPercent);
    setUnitPriceInputs(lineItems.map((lineItem) => centsToMajorInput(lineItem.unitPriceCents)));
    setDraftWithCalculatedTotals(
      {
        ...emptyCreditNoteForm(invoice.currency),
        lineItems,
        reason: `Credit for invoice ${invoice.invoiceNumber}`
      },
      taxPercent,
      discountPercent
    );
  }

  function openCreateModal() {
    setEditorId(null);
    const invoice = firstAvailableInvoice(invoices);
    if (invoice) {
      applyInvoice(invoice);
    } else {
      setDraft(emptyCreditNoteForm());
    }
    setIsEditorOpen(true);
  }

  function openEditModal(creditNote: CreditNoteWithInvoice) {
    const lineItems = creditNote.lineItems.length > 0 ? creditNote.lineItems : [emptyLineItem()];
    const subtotalCents = lineItems.reduce((sum, lineItem) => sum + lineItem.totalCents, 0);
    const taxPercent = percentFromCents(creditNote.taxCents, subtotalCents);
    const discountPercent = percentFromCents(creditNote.discountCents, subtotalCents);
    const nextLineItems = lineItems.map((lineItem, index) => ({
      description: lineItem.description,
      quantity: lineItem.quantity,
      sortOrder: index,
      totalCents: lineItem.totalCents,
      unitPriceCents: lineItem.unitPriceCents
    }));
    setEditorId(creditNote.id);
    setInvoiceId(creditNote.invoiceId);
    setTaxPercentInput(taxPercent);
    setDiscountPercentInput(discountPercent);
    setUnitPriceInputs(nextLineItems.map((lineItem) => centsToMajorInput(lineItem.unitPriceCents)));
    setDraftWithCalculatedTotals(
      {
        amountCents: creditNote.amountCents,
        currency: creditNote.currency,
        discountCents: creditNote.discountCents,
        documentStorageKey: creditNote.documentStorageKey ?? "",
        documentUrl: creditNote.documentUrl ?? "",
        lineItems: nextLineItems,
        reason: creditNote.reason,
        subtotalCents: creditNote.subtotalCents,
        taxCents: creditNote.taxCents,
        totalCents: creditNote.totalCents
      },
      taxPercent,
      discountPercent
    );
    setIsEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fallbackReason = draft.reason.trim() || "Credit note";
    const lineItems = normalizeLineItems(draft.lineItems, fallbackReason);
    const calculatedTotals = calculateCreditNoteTotals(lineItems, taxPercentInput, discountPercentInput);
    setSaving(true);
    try {
      const ok = await onSaveCreditNote(invoiceId, editorId, {
        ...draft,
        ...calculatedTotals,
        currency: draft.currency.trim().toUpperCase(),
        lineItems,
        reason: fallbackReason
      });
      if (ok) {
        resetEditor();
      }
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading credit notes" />;
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} title="Credit notes unavailable" />;
  }

  return (
    <section className="view-section" aria-labelledby="credit-notes-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">Finance</p>
          <h1 id="credit-notes-title">Credit Notes</h1>
        </div>
        {canEdit ? (
          <button className="primary-action" disabled={invoices.length === 0} onClick={openCreateModal} type="button">
            Add Credit Note
          </button>
        ) : null}
      </div>

      <div className="summary-grid">
        <article className="summary-panel"><small>Total notes</small><strong>{totals.totalCount}</strong></article>
        <article className="summary-panel"><small>Draft</small><strong>{totals.draftCount}</strong></article>
        <article className="summary-panel"><small>Issued value</small><strong>{formatMoney(totals.issuedCents, "USD")}</strong></article>
        <article className="summary-panel"><small>Voided</small><strong>{totals.voidedCount}</strong></article>
      </div>

      {canEdit && invoices.length === 0 ? (
        <EmptyState title="Create an invoice first" message="Credit notes must be attached to an existing invoice." />
      ) : null}

      <CreditNoteCards
        canEdit={canEdit}
        creditNotes={creditNotes}
        onEditCreditNote={openEditModal}
        onIssueCreditNote={onIssueCreditNote}
        onVoidCreditNote={onVoidCreditNote}
      />

      {isEditorOpen ? (
        <Modal onClose={resetEditor} title={editorId ? "Edit Credit Note" : "Add Credit Note"}>
          <form className="entity-form" onSubmit={handleSubmit}>
            <div className="field-grid">
              <label>
                Invoice
                <select
                  disabled={Boolean(editorId)}
                  onChange={(event) => {
                    const selectedInvoice = invoices.find((invoice) => invoice.id === event.target.value);
                    if (selectedInvoice) {
                      applyInvoice(selectedInvoice);
                    }
                  }}
                  required
                  value={invoiceId}
                >
                  <option value="">Select invoice</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} — {invoice.client.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <input readOnly value={editorId ? "DRAFT" : "DRAFT"} />
              </label>
              <label>
                Issue date
                <input readOnly value="Set when issued" />
              </label>
              <label>
                Currency
                <input
                  maxLength={3}
                  onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
                  required
                  value={draft.currency}
                />
              </label>
              <label className="field-span-2">
                Reason / notes
                <textarea
                  maxLength={4000}
                  onChange={(event) => setDraft((current) => ({ ...current, reason: event.target.value }))}
                  required
                  rows={3}
                  value={draft.reason}
                />
              </label>
            </div>

            <CreditNoteLineItemsEditor
              currency={draft.currency}
              invoiceItems={invoiceItems}
              lineItems={draft.lineItems}
              onChange={updateLineItems}
              onUnitPriceInputsChange={setUnitPriceInputs}
              unitPriceInputs={unitPriceInputs}
            />

            <div className="field-grid">
              <label>{moneyFieldLabel("Subtotal", draft.currency)}<input readOnly value={centsToMajorInput(draft.subtotalCents)} /></label>
              <label>
                Tax (%)
                <input
                  min={0}
                  onChange={(event) => {
                    const nextTaxPercent = event.target.value;
                    setTaxPercentInput(nextTaxPercent);
                    updateLineItems(draft.lineItems, nextTaxPercent, discountPercentInput);
                  }}
                  step="0.01"
                  type="number"
                  value={taxPercentInput}
                />
              </label>
              <label>
                Discount (%)
                <input
                  min={0}
                  onChange={(event) => {
                    const nextDiscountPercent = event.target.value;
                    setDiscountPercentInput(nextDiscountPercent);
                    updateLineItems(draft.lineItems, taxPercentInput, nextDiscountPercent);
                  }}
                  step="0.01"
                  type="number"
                  value={discountPercentInput}
                />
              </label>
              <label>{moneyFieldLabel("Total", draft.currency)}<input readOnly value={centsToMajorInput(draft.totalCents)} /></label>
              <label className="field-span-2">
                Document URL
                <input
                  maxLength={2048}
                  onChange={(event) => setDraft((current) => ({ ...current, documentUrl: event.target.value }))}
                  value={draft.documentUrl}
                />
              </label>
              <label className="field-span-2">
                Document storage key
                <input
                  maxLength={2048}
                  onChange={(event) => setDraft((current) => ({ ...current, documentStorageKey: event.target.value }))}
                  value={draft.documentStorageKey}
                />
              </label>
            </div>
            <div className="modal-footer">
              <button className="secondary-action" disabled={saving} onClick={resetEditor} type="button">Cancel</button>
              <button className="primary-action" disabled={saving || !invoiceId || draft.totalCents <= 0} type="submit">
                {saving ? "Saving" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}

type CreditNoteCardsProps = {
  creditNotes: CreditNoteWithInvoice[];
  canEdit: boolean;
  onEditCreditNote: (creditNote: CreditNoteWithInvoice) => void;
  onIssueCreditNote: (creditNoteId: string) => Promise<boolean>;
  onVoidCreditNote: (creditNoteId: string) => Promise<boolean>;
};

function CreditNoteCards({ creditNotes, canEdit, onEditCreditNote, onIssueCreditNote, onVoidCreditNote }: CreditNoteCardsProps) {
  if (creditNotes.length === 0) {
    return <EmptyState message="No credit notes have been created yet." title="No credit notes" />;
  }

  return (
    <div className="entity-grid">
      {creditNotes.map((creditNote) => (
        <article className="entity-card" key={creditNote.id}>
          <div className="entity-card-header">
            <div>
              <span className={`entity-pill entity-pill-${creditNote.isArchived ? "archived" : "active"}`}>
                {formatCreditNoteStatus(creditNote.status)}
              </span>
              <h2>{creditNote.creditNoteNumber}</h2>
            </div>
            <div className="card-actions">
              {canEdit && creditNote.status === "DRAFT" ? <button className="secondary-action" onClick={() => onEditCreditNote(creditNote)} type="button">Edit</button> : null}
              {canEdit && creditNote.status === "DRAFT" ? <button className="secondary-action" onClick={() => void onIssueCreditNote(creditNote.id)} type="button">Issue</button> : null}
              {canEdit && creditNote.status !== "VOIDED" ? <button className="secondary-action" onClick={() => void onVoidCreditNote(creditNote.id)} type="button">Void</button> : null}
            </div>
          </div>
          <div className="entity-field-grid">
            <div><span>Client</span><strong>{creditNote.invoice.client.name}</strong></div>
            <div><span>Invoice</span><strong>{creditNote.invoice.invoiceNumber}</strong></div>
            <div><span>Issue date</span><strong>{formatDateLabel(creditNote.issueDate)}</strong></div>
            <div><span>Total</span><strong>{formatMoney(creditNote.totalCents, creditNote.currency)}</strong></div>
            <div><span>Subtotal</span><strong>{formatMoney(creditNote.subtotalCents, creditNote.currency)}</strong></div>
            <div><span>Tax</span><strong>{formatMoney(creditNote.taxCents, creditNote.currency)}</strong></div>
            <div><span>Discount</span><strong>{formatMoney(creditNote.discountCents, creditNote.currency)}</strong></div>
            <div><span>Line items</span><strong>{creditNote.lineItems.length}</strong></div>
            <div className="entity-span-2"><span>Line item details</span><strong>{formatLineItemSummary(creditNote.lineItems, creditNote.currency)}</strong></div>
            <div className="entity-span-2"><span>Reason / notes</span><strong>{creditNote.reason || "Not set"}</strong></div>
            <div className="entity-span-2"><span>Document</span><strong>{creditNote.documentUrl || creditNote.documentStorageKey || "Not set"}</strong></div>
          </div>
        </article>
      ))}
    </div>
  );
}

type CreditNoteLineItemsEditorProps = {
  currency: string;
  invoiceItems: InvoiceItemSummary[];
  lineItems: CreditNoteLineItemFormValues[];
  onChange: (lineItems: CreditNoteLineItemFormValues[]) => void;
  onUnitPriceInputsChange: (unitPriceInputs: string[]) => void;
  unitPriceInputs: string[];
};

function CreditNoteLineItemsEditor({
  currency,
  invoiceItems,
  lineItems,
  onChange,
  onUnitPriceInputsChange,
  unitPriceInputs
}: CreditNoteLineItemsEditorProps) {
  function updateLineItem(index: number, values: Partial<CreditNoteLineItemFormValues>) {
    onChange(lineItems.map((item, itemIndex) => (itemIndex === index ? { ...item, ...values } : item)));
  }

  function updateUnitPriceInput(index: number, value: string) {
    onUnitPriceInputsChange(lineItems.map((item, itemIndex) => (itemIndex === index ? value : unitPriceInputs[itemIndex] ?? centsToMajorInput(item.unitPriceCents))));
  }

  function selectInvoiceItem(index: number, invoiceItemId: string) {
    const invoiceItem = invoiceItems.find((item) => item.id === invoiceItemId);
    if (!invoiceItem) {
      return;
    }

    updateLineItem(index, {
      description: [invoiceItem.name, invoiceItem.description].filter(Boolean).join(" — "),
      quantity: 1,
      totalCents: invoiceItem.unitPriceCents,
      unitPriceCents: invoiceItem.unitPriceCents
    });
    updateUnitPriceInput(index, centsToMajorInput(invoiceItem.unitPriceCents));
  }

  return (
    <div className="entity-form">
      <h3>Line items</h3>
      {lineItems.map((item, index) => (
        <div className="field-grid" key={index}>
          <label className="field-span-2">
            Service / item
            <select onChange={(event) => selectInvoiceItem(index, event.target.value)} value="">
              <option value="">Select service</option>
              {invoiceItems.map((invoiceItem) => (
                <option key={invoiceItem.id} value={invoiceItem.id}>{invoiceItem.name}</option>
              ))}
            </select>
          </label>
          <label className="field-span-2">
            Description / details
            <textarea maxLength={500} onChange={(event) => updateLineItem(index, { description: event.target.value })} rows={3} value={item.description} />
          </label>
          <label>
            Quantity
            <input
              min={1}
              onChange={(event) => {
                const quantity = Math.max(1, event.target.valueAsNumber || 1);
                updateLineItem(index, { quantity, totalCents: quantity * item.unitPriceCents });
              }}
              type="number"
              value={item.quantity}
            />
          </label>
          <label>
            {moneyFieldLabel("Unit price", currency)}
            <input
              min={0}
              onChange={(event) => {
                const unitPriceCents = majorInputToCents(event.target.value);
                updateUnitPriceInput(index, event.target.value);
                updateLineItem(index, { totalCents: item.quantity * unitPriceCents, unitPriceCents });
              }}
              step="0.01"
              type="number"
              value={unitPriceInputs[index] ?? centsToMajorInput(item.unitPriceCents)}
            />
          </label>
          <label>{moneyFieldLabel("Line total", currency)}<input readOnly value={centsToMajorInput(item.totalCents)} /></label>
          <div className="card-actions">
            <button
              className="secondary-action"
              disabled={lineItems.length === 1}
              onClick={() => {
                onChange(lineItems.filter((_, itemIndex) => itemIndex !== index));
                onUnitPriceInputsChange(unitPriceInputs.filter((_, itemIndex) => itemIndex !== index));
              }}
              type="button"
            >
              Remove line
            </button>
          </div>
        </div>
      ))}
      <button
        className="secondary-action"
        onClick={() => {
          onChange([...lineItems, emptyLineItem(lineItems.length)]);
          onUnitPriceInputsChange([...unitPriceInputs, centsToMajorInput(0)]);
        }}
        type="button"
      >
        Add line item
      </button>
    </div>
  );
}