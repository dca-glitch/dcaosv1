import { type FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import { StatusBadge } from "../../components/ui";

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
  onArchiveVendor: (vendorId: string) => Promise<boolean>;
  onCreateVendor: (values: VendorFormValues) => Promise<boolean>;
  onRestoreBill: (billId: string) => Promise<boolean>;
  onRestoreVendor: (vendorId: string) => Promise<boolean>;
  onSaveBill: (billId: string | null, values: BillFormValues) => Promise<BillSummary | null>;
  onSaveVendor: (vendorId: string | null, values: VendorFormValues) => Promise<boolean>;
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
  return vendors.find((vendor) => !vendor.isArchived)?.id ?? "";
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
  onArchiveVendor,
  onCreateVendor,
  onRestoreVendor,
  onRestoreBill,
  onSaveBill,
  onSaveVendor,
  onUploadBillDocument
}: BillsPageProps) {
  const [filter, setFilter] = useState<"active" | "archived" | "all">("active");
  const [billEditorId, setBillEditorId] = useState<string | null>(null);
  const [isBillEditorOpen, setIsBillEditorOpen] = useState(false);
  const [isVendorEditorOpen, setIsVendorEditorOpen] = useState(false);
  const [vendorEditorId, setVendorEditorId] = useState<string | null>(null);
  const [billDraft, setBillDraft] = useState<BillFormValues>(emptyBillForm());
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [vendorDraft, setVendorDraft] = useState<VendorFormValues>({ name: "" });
  const [saving, setSaving] = useState(false);
  const activeVendorCount = vendors.filter((vendor) => !vendor.isArchived).length;
  const hasActiveVendors = activeVendorCount > 0;

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
      const ok = vendorEditorId ? await onSaveVendor(vendorEditorId, vendorDraft) : await onCreateVendor(vendorDraft);
      if (ok) {
        setVendorDraft({ name: "" });
        setVendorEditorId(null);
        setIsVendorEditorOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  function openCreateVendorModal() {
    setVendorEditorId(null);
    setVendorDraft({ name: "" });
    setIsVendorEditorOpen(true);
  }

  function openEditVendorModal(vendor: VendorSummary) {
    setVendorEditorId(vendor.id);
    setVendorDraft({ name: vendor.name });
    setIsVendorEditorOpen(true);
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
              <button className="secondary-action" onClick={openCreateVendorModal} type="button">
                Add Vendor
              </button>
              <button
                className="primary-action"
                disabled={!hasActiveVendors}
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
          <strong>{activeVendorCount}</strong>
          <small>{vendors.length} total</small>
        </article>
      </div>

      {canEdit && !hasActiveVendors ? (
        <EmptyState title="Add a vendor first" message="Bills need a vendor before they can be created." />
      ) : null}

      {vendors.length > 0 ? (
        <div className="dense-list">
          {vendors.map((vendor) => (
            <article className="entity-card dense-record" key={vendor.id}>
              <div className="dense-record-main">
                <div className="dense-title">
                  <div className="dense-kicker">
                    <StatusBadge status={vendor.isArchived ? "ARCHIVED" : "ACTIVE"} />
                  </div>
                  <h2>{vendor.name}</h2>
                  <div className="dense-meta">
                    <span><strong>{vendor.billCount}</strong> bill(s)</span>
                    <span>Updated {formatDateLabel(vendor.updatedAt)}</span>
                  </div>
                </div>

                <div className="dense-fields">
                  <div className="dense-field">
                    <span>Bills</span>
                    <strong>{vendor.billCount}</strong>
                  </div>
                  <div className="dense-field">
                    <span>Status</span>
                    <strong>{vendor.isArchived ? "Archived" : "Active"}</strong>
                  </div>
                  <div className="dense-field">
                    <span>Updated</span>
                    <strong>{formatDateLabel(vendor.updatedAt)}</strong>
                  </div>
                  <div className="dense-field">
                    <span>Created</span>
                    <strong>{formatDateLabel(vendor.createdAt)}</strong>
                  </div>
                </div>

                <div className="dense-actions">
                  {canEdit ? <button className="primary-action" onClick={() => openEditVendorModal(vendor)} type="button">Open</button> : null}
                  {canEdit ? (
                    <details className="row-action-menu">
                      <summary>More</summary>
                      <div className="row-action-menu-panel">
                        <div className="row-action-menu-group">
                          <span className="row-action-menu-label">Vendor</span>
                          {!vendor.isArchived ? <button className="secondary-action" onClick={() => void onArchiveVendor(vendor.id)} type="button">Archive</button> : null}
                          {vendor.isArchived ? <button className="secondary-action" onClick={() => void onRestoreVendor(vendor.id)} type="button">Restore</button> : null}
                        </div>
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {filteredBills.length === 0 ? (
        <EmptyState message="No bills match the current filter." title="No bills" />
      ) : (
        <div className="dense-list">
          {filteredBills.map((bill) => (
            <article className="entity-card dense-record" key={bill.id}>
              <div className="dense-record-main">
                <div className="dense-title">
                  <div className="dense-kicker">
                    <StatusBadge status={bill.isArchived ? "ARCHIVED" : "ACTIVE"} />
                  </div>
                  <h2>{bill.vendor.name}</h2>
                  <div className="dense-meta">
                    <span><strong>{formatMoney(bill.amountCents)}</strong></span>
                    <span>{formatPaymentForm(bill.paymentForm)}</span>
                    <span>{bill.category || "No category"}</span>
                  </div>
                </div>

                <div className="dense-fields">
                  <div className="dense-field">
                    <span>Amount</span>
                    <strong>{formatMoney(bill.amountCents)}</strong>
                  </div>
                  <div className="dense-field">
                    <span>Payment</span>
                    <strong>{formatPaymentForm(bill.paymentForm)}</strong>
                  </div>
                  <div className="dense-field">
                    <span>Paid</span>
                    <strong>{formatDateLabel(bill.paymentDate)}</strong>
                  </div>
                  <div className="dense-field">
                    <span>Due</span>
                    <strong>{formatDateLabel(bill.dueDate)}</strong>
                  </div>
                </div>

                <div className="dense-actions">
                  {canEdit ? <button className="primary-action" onClick={() => openEditBillModal(bill)} type="button">Open</button> : null}
                  {canEdit ? (
                    <details className="row-action-menu">
                      <summary>More</summary>
                      <div className="row-action-menu-panel">
                        <div className="row-action-menu-group">
                          <span className="row-action-menu-label">Bill</span>
                          {!bill.isArchived ? <button className="secondary-action" onClick={() => void onArchiveBill(bill.id)} type="button">Archive</button> : null}
                          {bill.isArchived ? <button className="secondary-action" onClick={() => void onRestoreBill(bill.id)} type="button">Restore</button> : null}
                        </div>
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
              <div className="dense-row-note">
                Bill date: {formatDateLabel(bill.billDate)}. Reference: {bill.referenceNumber || "Not set"}. Document: {bill.documentUrl || bill.documentStorageKey || "Not set"}. Notes: {bill.notes || "Not set"}.
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
              <button className="primary-action" disabled={saving || !hasActiveVendors} type="submit">{saving ? "Saving" : billEditorId ? "Update bill" : "Create bill"}</button>
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
              <button className="primary-action" disabled={saving || !hasActiveVendors} type="submit">{saving ? "Saving" : billEditorId ? "Update bill" : "Create bill"}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {isVendorEditorOpen ? (
        <Modal onClose={() => setIsVendorEditorOpen(false)} title={vendorEditorId ? "Edit Vendor" : "Add Vendor"}>
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
              <button className="primary-action" disabled={saving} type="submit">{saving ? "Saving" : vendorEditorId ? "Update Vendor" : "Save Vendor"}</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
