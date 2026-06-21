import { type FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";

export type VendorSummary = {
  id: string;
  name: string;
  isArchived: boolean;
  billCount: number;
  createdAt: string;
  updatedAt: string;
};

export type BillSummary = {
  id: string;
  vendorId: string;
  vendor: {
    id: string;
    name: string;
  };
  amountCents: number;
  paymentForm: string;
  paymentDate: string;
  billDate: string | null;
  dueDate: string | null;
  referenceNumber: string | null;
  category: string | null;
  notes: string | null;
  documentUrl: string | null;
  documentStorageKey: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BillFormValues = {
  vendorId: string;
  amountCents: number;
  paymentForm: string;
  paymentDate: string;
  billDate: string;
  dueDate: string;
  referenceNumber: string;
  category: string;
  notes: string;
  documentUrl: string;
  documentStorageKey: string;
};

export type VendorFormValues = {
  name: string;
};

export type BillDocumentUploadValues = {
  file: File;
};

type BillsPageProps = {
  bills: BillSummary[];
  vendors: VendorSummary[];
  canEdit: boolean;
  errorMessage: string | null;
  isLoading: boolean;
  onArchiveBill: (billId: string) => Promise<boolean>;
  onCreateVendor: (values: VendorFormValues) => Promise<boolean>;
  onRestoreBill: (billId: string) => Promise<boolean>;
  onSaveBill: (billId: string | null, values: BillFormValues) => Promise<BillSummary | null>;
  onUploadBillDocument: (billId: string, values: BillDocumentUploadValues) => Promise<BillSummary | null>;
};

const paymentFormOptions = [
  { label: "Cash", value: "CASH" },
  { label: "Revolut Bank", value: "REVOLUT_BANK" },
  { label: "Wise Bank", value: "WISE_BANK" },
  { label: "Revolut Card", value: "REVOLUT_CARD" },
  { label: "Wise Card", value: "WISE_CARD" },
  { label: "Other", value: "OTHER" }
] as const;

const emptyBillForm = (vendorId = ""): BillFormValues => ({
  vendorId,
  amountCents: 0,
  paymentForm: "CASH",
  paymentDate: toLocalDateInputValue(),
  billDate: "",
  dueDate: "",
  referenceNumber: "",
  category: "",
  notes: "",
  documentUrl: "",
  documentStorageKey: ""
});

function firstActiveVendorId(vendors: VendorSummary[]): string {
  return vendors.find((vendor) => !vendor.isArchived)?.id ?? vendors[0]?.id ?? "";
}

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

function formatMoney(cents: number): string {
  return new Intl.NumberFormat(undefined, { currency: "USD", style: "currency" }).format(cents / 100);
}

function formatPaymentForm(value: string): string {
  return paymentFormOptions.find((option) => option.value === value)?.label ?? value;
}

export function BillsPage({
  bills,
  vendors,
  canEdit,
  errorMessage,
  isLoading,
  onArchiveBill,
  onCreateVendor,
  onRestoreBill,
  onSaveBill,
  onUploadBillDocument
}: BillsPageProps) {
  const [filter, setFilter] = useState<"active" | "archived" | "all">("active");
  const [billEditorId, setBillEditorId] = useState<string | null>(null);
  const [isBillEditorOpen, setIsBillEditorOpen] = useState(false);
  const [isVendorEditorOpen, setIsVendorEditorOpen] = useState(false);
  const [billDraft, setBillDraft] = useState<BillFormValues>(emptyBillForm());
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [vendorDraft, setVendorDraft] = useState<VendorFormValues>({ name: "" });
  const [saving, setSaving] = useState(false);

  const filteredBills = useMemo(
    () =>
      bills.filter((bill) => {
        if (filter === "active") {
          return !bill.isArchived;
        }

        if (filter === "archived") {
          return bill.isArchived;
        }

        return true;
      }),
    [bills, filter]
  );

  const totals = useMemo(() => {
    const activeBills = bills.filter((bill) => !bill.isArchived);
    const archivedBills = bills.filter((bill) => bill.isArchived);
    return {
      activeCents: activeBills.reduce((total, bill) => total + bill.amountCents, 0),
      archivedCents: archivedBills.reduce((total, bill) => total + bill.amountCents, 0),
      activeCount: activeBills.length,
      archivedCount: archivedBills.length
    };
  }, [bills]);

  function openCreateBillModal() {
    setBillEditorId(null);
    setBillDraft(emptyBillForm(firstActiveVendorId(vendors)));
    setDocumentFile(null);
    setIsBillEditorOpen(true);
  }

  function openEditBillModal(bill: BillSummary) {
    setBillEditorId(bill.id);
    setBillDraft({
      vendorId: bill.vendorId,
      amountCents: bill.amountCents,
      paymentForm: paymentFormOptions.some((option) => option.value === bill.paymentForm) ? bill.paymentForm : "OTHER",
      paymentDate: toDateInputValue(bill.paymentDate),
      billDate: toDateInputValue(bill.billDate),
      dueDate: toDateInputValue(bill.dueDate),
      referenceNumber: bill.referenceNumber ?? "",
      category: bill.category ?? "",
      notes: bill.notes ?? "",
      documentUrl: bill.documentUrl ?? "",
      documentStorageKey: bill.documentStorageKey ?? ""
    });
    setDocumentFile(null);
    setIsBillEditorOpen(true);
  }

  async function handleBillSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const savedBill = await onSaveBill(billEditorId, billDraft);
      if (savedBill && documentFile) {
        const uploadedBill = await onUploadBillDocument(savedBill.id, { file: documentFile });
        if (!uploadedBill) {
          return;
        }
      }

      if (savedBill) {
        setBillEditorId(null);
        setBillDraft(emptyBillForm(firstActiveVendorId(vendors)));
        setDocumentFile(null);
        setIsBillEditorOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleVendorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const ok = await onCreateVendor(vendorDraft);
      if (ok) {
        setVendorDraft({ name: "" });
        setIsVendorEditorOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading bills" />;
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} title="Bills unavailable" />;
  }

  return (
    <section className="view-section" aria-labelledby="bills-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">Expenses</p>
          <h1 id="bills-title">Bills</h1>
        </div>
        <div className="toolbar">
          <div className="filter-bar" role="group" aria-label="Bill view">
            {(["active", "archived", "all"] as const).map((value) => (
              <button
                aria-pressed={filter === value}
                className={filter === value ? "secondary-action filter-chip is-active" : "secondary-action filter-chip"}
                key={value}
                onClick={() => setFilter(value)}
                type="button"
              >
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
          {canEdit ? (
            <>
              <button className="secondary-action" onClick={() => setIsVendorEditorOpen(true)} type="button">
                Add Vendor
              </button>
              <button
                className="primary-action"
                disabled={vendors.length === 0}
                onClick={openCreateBillModal}
                type="button"
              >
                Add Bill
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="summary-grid">
        <article className="summary-panel">
          <span>Active Bills</span>
          <strong>{formatMoney(totals.activeCents)}</strong>
          <small>{totals.activeCount} records</small>
        </article>
        <article className="summary-panel">
          <span>Archived Bills</span>
          <strong>{formatMoney(totals.archivedCents)}</strong>
          <small>{totals.archivedCount} records</small>
        </article>
        <article className="summary-panel">
          <span>Vendors</span>
          <strong>{vendors.filter((vendor) => !vendor.isArchived).length}</strong>
          <small>{vendors.length} total</small>
        </article>
      </div>

      {canEdit && vendors.length === 0 ? (
        <EmptyState title="Add a vendor first" message="Bills need a vendor before they can be created." />
      ) : null}

      {filteredBills.length === 0 ? (
        <EmptyState message="No bills match the current filter." title="No bills" />
      ) : (
        <div className="entity-grid">
          {filteredBills.map((bill) => (
            <article className="entity-card" key={bill.id}>
              <div className="entity-card-header">
                <div>
                  <span className={`entity-pill entity-pill-${bill.isArchived ? "archived" : "active"}`}>
                    {bill.isArchived ? "Archived" : "Active"}
                  </span>
                  <h2>{bill.vendor.name}</h2>
                </div>
                <div className="card-actions">
                  {canEdit ? <button className="secondary-action" onClick={() => openEditBillModal(bill)} type="button">Edit</button> : null}
                  {canEdit && !bill.isArchived ? <button className="secondary-action" onClick={() => void onArchiveBill(bill.id)} type="button">Archive</button> : null}
                  {canEdit && bill.isArchived ? <button className="secondary-action" onClick={() => void onRestoreBill(bill.id)} type="button">Restore</button> : null}
                </div>
              </div>
              <div className="entity-field-grid">
                <div><span>Amount</span><strong>{formatMoney(bill.amountCents)}</strong></div>
                <div><span>Payment form</span><strong>{formatPaymentForm(bill.paymentForm)}</strong></div>
                <div><span>Date of payment</span><strong>{formatDateLabel(bill.paymentDate)}</strong></div>
                <div><span>Bill date</span><strong>{formatDateLabel(bill.billDate)}</strong></div>
                <div><span>Due date</span><strong>{formatDateLabel(bill.dueDate)}</strong></div>
                <div><span>Category</span><strong>{bill.category || "Not set"}</strong></div>
                <div><span>Reference</span><strong>{bill.referenceNumber || "Not set"}</strong></div>
                <div><span>Document</span><strong>{bill.documentUrl || bill.documentStorageKey || "Not set"}</strong></div>
                <div className="entity-span-2"><span>Notes</span><strong>{bill.notes || "Not set"}</strong></div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isBillEditorOpen ? (
        <Modal
          onClose={() => {
            setBillEditorId(null);
            setBillDraft(emptyBillForm(firstActiveVendorId(vendors)));
            setDocumentFile(null);
            setIsBillEditorOpen(false);
          }}
          title={billEditorId ? "Edit Bill" : "Add Bill"}
        >
          <form className="entity-form" onSubmit={handleBillSubmit}>
            <div className="modal-footer">
              <button className="secondary-action" disabled={saving} onClick={() => setIsBillEditorOpen(false)} type="button">Cancel</button>
              <button className="primary-action" disabled={saving || vendors.length === 0} type="submit">{saving ? "Saving" : billEditorId ? "Update bill" : "Create bill"}</button>
            </div>
            <div className="field-grid">
              <label>
                Vendor - Required
                <select
                  disabled={vendors.length === 0}
                  onChange={(event) => setBillDraft((current) => ({ ...current, vendorId: event.target.value }))}
                  required
                  value={billDraft.vendorId}
                >
                  <option value="">Select vendor</option>
                  {vendors.filter((vendor) => !vendor.isArchived || vendor.id === billDraft.vendorId).map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </select>
                <small>Used for expense tracking.</small>
              </label>
              <label>
                Bill reference - Optional
                <input
                  maxLength={500}
                  onChange={(event) => setBillDraft((current) => ({ ...current, referenceNumber: event.target.value }))}
                  placeholder="Vendor invoice number, receipt ID, or reference"
                  value={billDraft.referenceNumber}
                />
                <small>Shown only in admin records.</small>
              </label>
              <label>
                Bill date - Required
                <input
                  onChange={(event) => setBillDraft((current) => ({ ...current, billDate: event.target.value }))}
                  required
                  type="date"
                  value={billDraft.billDate}
                />
                <small>Used for expense tracking.</small>
              </label>
              <label>
                Due date - Required
                <input
                  onChange={(event) => setBillDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  required
                  type="date"
                  value={billDraft.dueDate}
                />
                <small>Used to track when this bill should be paid.</small>
              </label>
              <label>
                Amount - Required
                <input
                  min={1}
                  onChange={(event) => setBillDraft((current) => ({ ...current, amountCents: event.target.valueAsNumber || 0 }))}
                  placeholder="Total bill amount before payment tracking"
                  required
                  type="number"
                  value={billDraft.amountCents}
                />
                <small>Recorded in cents for the bill total.</small>
              </label>
              <label>
                Payment status / method - Required
                <select
                  onChange={(event) => setBillDraft((current) => ({ ...current, paymentForm: event.target.value }))}
                  required
                  value={billDraft.paymentForm}
                >
                  {paymentFormOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <small>Does not create a bank transaction.</small>
              </label>
              <label>
                Payment date - Optional
                <input
                  onChange={(event) => setBillDraft((current) => ({ ...current, paymentDate: event.target.value }))}
                  type="date"
                  value={billDraft.paymentDate}
                />
                <small>Used only when a payment date is known.</small>
              </label>
              <label>
                Category - Optional
                <input
                  maxLength={500}
                  onChange={(event) => setBillDraft((current) => ({ ...current, category: event.target.value }))}
                  placeholder="Supplies, software, subcontractor, or service"
                  value={billDraft.category}
                />
                <small>Used for admin reporting and filtering.</small>
              </label>
              <label className="field-span-2">
                Document URL / reference - Optional
                <input
                  maxLength={2048}
                  onChange={(event) => setBillDraft((current) => ({ ...current, documentUrl: event.target.value }))}
                  placeholder="Receipt, invoice file, or folder reference"
                  value={billDraft.documentUrl}
                />
                <small>Shown only in admin records.</small>
              </label>
              <label className="field-span-2">
                Document storage key - Optional
                <input
                  maxLength={2048}
                  onChange={(event) => setBillDraft((current) => ({ ...current, documentStorageKey: event.target.value }))}
                  placeholder="Storage key or internal document path"
                  value={billDraft.documentStorageKey}
                />
                <small>Visible only to admin team.</small>
              </label>
              <label className="field-span-2">
                Internal notes - Optional
                <textarea
                  maxLength={4000}
                  onChange={(event) => setBillDraft((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Notes for admin team only"
                  rows={3}
                  value={billDraft.notes}
                />
                <small>Visible only to admin team.</small>
              </label>
              <label className="field-span-2">
                Upload document
                <input
                  accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                  onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)}
                  type="file"
                />
                <small>Optional. Allowed: PDF, PNG, JPG, WebP up to 5 MB. Uploading does not create a payment.</small>
              </label>
            </div>
            <div className="modal-footer">
              <button className="secondary-action" disabled={saving} onClick={() => setIsBillEditorOpen(false)} type="button">Cancel</button>
              <button className="primary-action" disabled={saving || vendors.length === 0} type="submit">{saving ? "Saving" : billEditorId ? "Update bill" : "Create bill"}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {isVendorEditorOpen ? (
        <Modal onClose={() => setIsVendorEditorOpen(false)} title="Add Vendor">
          <form className="entity-form" onSubmit={handleVendorSubmit}>
            <div className="field-grid">
              <label className="field-span-2">
                Vendor name
                <input
                  maxLength={255}
                  onChange={(event) => setVendorDraft({ name: event.target.value })}
                  required
                  value={vendorDraft.name}
                />
              </label>
            </div>
            <div className="modal-footer">
              <button className="secondary-action" disabled={saving} onClick={() => setIsVendorEditorOpen(false)} type="button">Cancel</button>
              <button className="primary-action" disabled={saving} type="submit">{saving ? "Saving" : "Save Vendor"}</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
