import { type FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import {
  Button,
  MetricCard,
  ModalActions,
  PageHeader,
  StatusBadge,
  StatusSummaryBar,
  Table
} from "../../components/ui";
import { Input, Select, Textarea } from "../../design-system";
import {
  buildCreditNoteStatusSummary,
  formatFinanceDateLabel,
  formatFinanceMoney
} from "../finance/finance-display";
import type { InvoiceItemSummary } from "../invoice-items/InvoiceItemsPage";
import type { InvoiceSummary } from "../invoices/InvoicesPage";
import "../finance/finance.css";

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

function formatInvoiceOptionLabel(invoice: InvoiceWithCreditNotes): string {
  return [invoice.invoiceNumber, invoice.client.name, invoice.project?.name].filter(Boolean).join(" — ");
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
  const creditNoteStatusSummary = useMemo(() => buildCreditNoteStatusSummary(creditNotes), [creditNotes]);
  const selectedInvoice = useMemo(() => invoices.find((invoice) => invoice.id === invoiceId) ?? null, [invoiceId, invoices]);
  const submitLabel = editorId ? "Update credit note" : "Create credit note";

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
    <section className="view-section finance-lite" aria-labelledby="credit-notes-title" data-density="compact">
      <PageHeader
        eyebrow="Finance"
        title="Credit Notes"
        titleId="credit-notes-title"
        description="Invoice corrections and billing adjustments."
        actions={
          canEdit ? (
            <Button disabled={invoices.length === 0} onClick={openCreateModal} type="button">
              New credit note
            </Button>
          ) : null
        }
      />

      <StatusSummaryBar ariaLabel="Credit note status summary" items={creditNoteStatusSummary} />

      <div className="summary-grid finance-summary-strip" aria-label="Credit note totals from loaded records">
        <MetricCard
          accent="cyan"
          helper={`${totals.totalCount} notes · ${totals.draftCount} draft · ${totals.voidedCount} voided`}
          label="Issued value"
          value={formatMoney(totals.issuedCents, "USD")}
        />
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
        <Modal eyebrow={editorId ? "Edit" : "Create"} onClose={resetEditor} size="lg" title={editorId ? "Edit Credit Note" : "New Credit Note"}>
          <form className="entity-form" onSubmit={handleSubmit}>
            <p className="muted-text">Used to document a refund, correction, or billing adjustment. This does not register a payment by itself.</p>
            <ModalActions
              disabled={saving || !invoiceId || draft.totalCents <= 0}
              label={submitLabel}
              onCancel={resetEditor}
              saving={saving}
            />
            <div className="field-grid">
              <Select
                disabled={Boolean(editorId)}
                fullWidth
                helperText={
                  selectedInvoice
                    ? `Client: ${selectedInvoice.client.name}${selectedInvoice.project ? `; Project: ${selectedInvoice.project.name}.` : "."} Use when the credit note relates to a specific invoice.`
                    : "Client and project context come from the selected invoice. Use when the credit note relates to a specific invoice."
                }
                label="Linked invoice - Required"
                onChange={(event) => {
                  const selected = invoices.find((invoice) => invoice.id === event.target.value);
                  if (selected) {
                    applyInvoice(selected);
                  }
                }}
                options={[
                  { value: "", label: "Invoice this credit note corrects, if applicable" },
                  ...invoices.map((invoice) => ({ value: invoice.id, label: formatInvoiceOptionLabel(invoice) }))
                ]}
                required
                value={invoiceId}
              />
              <Input
                fullWidth
                helperText="Starts as draft here. Issue and void actions stay separate from save and cancel."
                label="Status - Automatic"
                readOnly
                value={editorId ? "DRAFT" : "DRAFT"}
              />
              <Input
                fullWidth
                helperText="Recorded when the credit note is issued."
                label="Credit note date - Automatic"
                readOnly
                value="Set when issued"
              />
              <Input
                fullWidth
                helperText="Used for line item amounts and totals on this credit note."
                label="Currency - Required"
                maxLength={3}
                onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
                placeholder="Three-letter currency code such as USD"
                required
                value={draft.currency}
              />
              <Textarea
                className="field-span-2"
                fullWidth
                helperText="Used to document a refund, correction, or billing adjustment."
                label="Reason - Required"
                maxLength={4000}
                onChange={(event) => setDraft((current) => ({ ...current, reason: event.target.value }))}
                placeholder="Refund, correction, overpayment, billing adjustment"
                required
                rows={3}
                value={draft.reason}
              />
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
              <Input
                fullWidth
                helperText="Calculated from the credit note line items below."
                label={moneyFieldLabel("Subtotal", draft.currency)}
                readOnly
                value={centsToMajorInput(draft.subtotalCents)}
              />
              <Input
                fullWidth
                helperText="Applied after the subtotal when needed."
                label="Tax (%) - Optional"
                min={0}
                onChange={(event) => {
                  const nextTaxPercent = event.target.value;
                  setTaxPercentInput(nextTaxPercent);
                  updateLineItems(draft.lineItems, nextTaxPercent, discountPercentInput);
                }}
                placeholder="Tax percentage for this credit note"
                step="0.01"
                type="number"
                value={taxPercentInput}
              />
              <Input
                fullWidth
                helperText="Use for admin-side adjustments before issuing the credit note."
                label="Discount (%) - Optional"
                min={0}
                onChange={(event) => {
                  const nextDiscountPercent = event.target.value;
                  setDiscountPercentInput(nextDiscountPercent);
                  updateLineItems(draft.lineItems, taxPercentInput, nextDiscountPercent);
                }}
                placeholder="Discount percentage for this credit note"
                step="0.01"
                type="number"
                value={discountPercentInput}
              />
              <Input
                fullWidth
                helperText="Credit amount to be issued. This does not register a payment by itself."
                label={moneyFieldLabel("Total", draft.currency)}
                readOnly
                value={centsToMajorInput(draft.totalCents)}
              />
              <Input
                className="field-span-2"
                fullWidth
                helperText="Shown only in admin records."
                label="Document URL / reference - Optional"
                maxLength={2048}
                onChange={(event) => setDraft((current) => ({ ...current, documentUrl: event.target.value }))}
                placeholder="Credit note file, folder link, or internal reference"
                value={draft.documentUrl}
              />
              <Input
                className="field-span-2"
                fullWidth
                helperText="Visible only to admin team."
                label="Document storage key - Optional"
                maxLength={2048}
                onChange={(event) => setDraft((current) => ({ ...current, documentStorageKey: event.target.value }))}
                placeholder="Storage key or internal document path"
                value={draft.documentStorageKey}
              />
            </div>
            <ModalActions
              disabled={saving || !invoiceId || draft.totalCents <= 0}
              label={submitLabel}
              onCancel={resetEditor}
              saving={saving}
            />
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
    return (
      <EmptyState
        message="Create a credit note to document a refund, correction, or billing adjustment."
        title="No credit notes yet"
        variant="inline"
      />
    );
  }

  return (
    <div className="table-wrap finance-table-wrap" aria-label="Credit notes">
      <Table
        className="finance-table"
        headers={[
          { label: "Credit note", align: "left" },
          { label: "Client", align: "left" },
          { label: "Invoice", align: "left" },
          { label: "Status", align: "left" },
          { label: "Total", align: "right" },
          { label: "Issue date", align: "left" },
          { label: "Actions", align: "right" }
        ]}
        rows={creditNotes.map((creditNote) => ({
          key: creditNote.id,
          cells: [
            <div key={`${creditNote.id}-number`}>
              <strong>{creditNote.creditNoteNumber}</strong>
              <div className="muted-text">{creditNote.lineItems.length} line item(s)</div>
            </div>,
            creditNote.invoice.client.name,
            creditNote.invoice.invoiceNumber,
            <StatusBadge key={`${creditNote.id}-status`} status={creditNote.isArchived ? "ARCHIVED" : creditNote.status} />,
            formatMoney(creditNote.totalCents, creditNote.currency),
            formatDateLabel(creditNote.issueDate),
            <div className="finance-row-actions" key={`${creditNote.id}-actions`}>
              {canEdit && creditNote.status === "DRAFT" ? (
                <Button onClick={() => onEditCreditNote(creditNote)} size="sm" variant="secondary" type="button">Edit</Button>
              ) : null}
              {canEdit ? (
                <details className="row-action-menu">
                  <summary>More</summary>
                  <div className="row-action-menu-panel">
                    <div className="row-action-menu-group">
                      <span className="row-action-menu-label">Credit note</span>
                      {creditNote.status === "DRAFT" ? (
                        <Button onClick={() => void onIssueCreditNote(creditNote.id)} size="sm" variant="secondary" type="button">Issue</Button>
                      ) : null}
                      {creditNote.status !== "VOIDED" ? (
                        <Button onClick={() => void onVoidCreditNote(creditNote.id)} size="sm" variant="secondary" type="button">Void</Button>
                      ) : null}
                    </div>
                  </div>
                </details>
              ) : null}
            </div>
          ]
        }))}
      />
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
      <p className="muted-text">Use line items to define the credited amount. These rows feed the subtotal and total above.</p>
      {lineItems.map((item, index) => (
        <div className="field-grid" key={index}>
          <Select
            className="field-span-2"
            fullWidth
            helperText="Pick a reusable service to prefill the credit line."
            label="Service / item - Optional"
            onChange={(event) => selectInvoiceItem(index, event.target.value)}
            options={[
              { value: "", label: "Select a reusable service from the linked invoice" },
              ...invoiceItems.map((invoiceItem) => ({ value: invoiceItem.id, label: invoiceItem.name }))
            ]}
            value=""
          />
          <Textarea
            className="field-span-2"
            fullWidth
            helperText="Shown on the credit note to explain the adjustment."
            label="Description / details - Optional"
            maxLength={500}
            onChange={(event) => updateLineItem(index, { description: event.target.value })}
            placeholder="What is being refunded, corrected, or adjusted"
            rows={3}
            value={item.description}
          />
          <Input
            fullWidth
            helperText="Used to calculate the line total."
            label="Quantity - Required"
            min={1}
            onChange={(event) => {
              const quantity = Math.max(1, event.target.valueAsNumber || 1);
              updateLineItem(index, { quantity, totalCents: quantity * item.unitPriceCents });
            }}
            placeholder="Number of units being credited"
            type="number"
            value={item.quantity}
          />
          <Input
            fullWidth
            helperText="Sets the credited rate for this line item."
            label={`${moneyFieldLabel("Unit price", currency)} - Required`}
            min={0}
            onChange={(event) => {
              const unitPriceCents = majorInputToCents(event.target.value);
              updateUnitPriceInput(index, event.target.value);
              updateLineItem(index, { totalCents: item.quantity * unitPriceCents, unitPriceCents });
            }}
            placeholder="Credit amount per unit before tax or discount"
            step="0.01"
            type="number"
            value={unitPriceInputs[index] ?? centsToMajorInput(item.unitPriceCents)}
          />
          <Input
            fullWidth
            helperText="Calculated from quantity and unit price."
            label={moneyFieldLabel("Line total", currency)}
            readOnly
            value={centsToMajorInput(item.totalCents)}
          />
          <div className="card-actions">
            <Button
              disabled={lineItems.length === 1}
              onClick={() => {
                onChange(lineItems.filter((_, itemIndex) => itemIndex !== index));
                onUnitPriceInputsChange(unitPriceInputs.filter((_, itemIndex) => itemIndex !== index));
              }}
              size="sm"
              type="button"
              variant="secondary"
            >
              Remove line
            </Button>
          </div>
        </div>
      ))}
      <Button
        onClick={() => {
          onChange([...lineItems, emptyLineItem(lineItems.length)]);
          onUnitPriceInputsChange([...unitPriceInputs, centsToMajorInput(0)]);
        }}
        size="sm"
        type="button"
        variant="secondary"
      >
        Add line item
      </Button>
    </div>
  );
}
