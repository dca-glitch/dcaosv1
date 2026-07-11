import { type FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import {
  Button,
  FilterBar,
  ModalActions,
  PageHeader,
  SectionPanel,
  StatusBadge,
  StatusSummaryBar,
  Table
} from "../../components/ui";
import { Input, Select, Textarea } from "../../design-system";
import {
  buildBillStatusSummary,
  formatFinanceDateLabel,
  formatFinanceMoney
} from "../finance/finance-display";
import "../finance/finance.css";

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
  return formatFinanceDateLabel(value);
}

function formatMoney(cents: number): string {
  return formatFinanceMoney(cents, "USD");
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

  const billStatusSummary = useMemo(() => buildBillStatusSummary(bills), [bills]);

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

  const billSubmitLabel = billEditorId ? "Update bill" : "Create bill";
  const vendorSubmitLabel = vendorEditorId ? "Update Vendor" : "Save Vendor";

  return (
    <section className="view-section finance-lite" aria-labelledby="bills-title" data-density="compact">
      <PageHeader
        eyebrow="Expenses"
        title="Bills"
        titleId="bills-title"
        description="Vendor bills, payment status, and document references."
        filters={
          <FilterBar
            ariaLabel="Bill view"
            onChange={(value) => setFilter(value as "active" | "archived" | "all")}
            options={[
              { value: "active", label: "Active" },
              { value: "archived", label: "Archived" },
              { value: "all", label: "All" }
            ]}
            value={filter}
          />
        }
        actions={
          canEdit ? (
            <>
              <Button onClick={openCreateVendorModal} type="button" variant="secondary">
                New vendor
              </Button>
              <Button
                disabled={!hasActiveVendors}
                onClick={openCreateBillModal}
                type="button"
              >
                New bill
              </Button>
            </>
          ) : null
        }
      />

      <StatusSummaryBar ariaLabel="Bill status summary" items={billStatusSummary} />

      <div className="summary-grid finance-summary-strip" aria-label="Bill totals from loaded records">
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
        <SectionPanel tone="compact" title="Vendors" description="Vendors used for bill entry.">
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
                    <span>Updated</span>
                    <strong>{formatDateLabel(vendor.updatedAt)}</strong>
                  </div>
                </div>

                <div className="dense-actions">
                  {canEdit ? <Button onClick={() => openEditVendorModal(vendor)} size="sm" variant="secondary" type="button">Edit</Button> : null}
                  {canEdit ? (
                    <details className="row-action-menu">
                      <summary>More</summary>
                      <div className="row-action-menu-panel">
                        <div className="row-action-menu-group">
                          <span className="row-action-menu-label">Vendor</span>
                          {!vendor.isArchived ? <Button onClick={() => void onArchiveVendor(vendor.id)} size="sm" variant="secondary" type="button">Archive</Button> : null}
                          {vendor.isArchived ? <Button onClick={() => void onRestoreVendor(vendor.id)} size="sm" variant="secondary" type="button">Restore</Button> : null}
                        </div>
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
          </div>
        </SectionPanel>
      ) : null}

      <SectionPanel tone="compact" title="Bills" description="Active and archived bill records for the workspace.">
      {filteredBills.length === 0 ? (
        <EmptyState message="No bills match the current filter." title="No bills" variant="inline" />
      ) : (
        <div className="table-wrap finance-table-wrap" aria-label="Bills">
          <Table
            className="finance-table"
            headers={[
              { label: "Vendor", align: "left" },
              { label: "Category", align: "left" },
              { label: "Status", align: "left" },
              { label: "Amount", align: "right" },
              { label: "Payment", align: "left" },
              { label: "Due", align: "left" },
              { label: "Actions", align: "right" }
            ]}
            rows={filteredBills.map((bill) => ({
              key: bill.id,
              cells: [
                <div key={`${bill.id}-vendor`}>
                  <strong>{bill.vendor.name}</strong>
                  <div className="muted-text">{bill.referenceNumber || "No reference"}</div>
                </div>,
                bill.category || "No category",
                <StatusBadge key={`${bill.id}-status`} status={bill.isArchived ? "ARCHIVED" : "ACTIVE"} />,
                formatMoney(bill.amountCents),
                formatPaymentForm(bill.paymentForm),
                formatDateLabel(bill.dueDate),
                <div className="finance-row-actions" key={`${bill.id}-actions`}>
                  {canEdit ? <Button onClick={() => openEditBillModal(bill)} size="sm" variant="secondary" type="button">Edit</Button> : null}
                  {canEdit ? (
                    <details className="row-action-menu">
                      <summary>More</summary>
                      <div className="row-action-menu-panel">
                        <div className="row-action-menu-group">
                          <span className="row-action-menu-label">Bill</span>
                          {!bill.isArchived ? <Button onClick={() => void onArchiveBill(bill.id)} size="sm" variant="secondary" type="button">Archive</Button> : null}
                          {bill.isArchived ? <Button onClick={() => void onRestoreBill(bill.id)} size="sm" variant="secondary" type="button">Restore</Button> : null}
                        </div>
                      </div>
                    </details>
                  ) : null}
                </div>
              ]
            }))}
          />
        </div>
      )}
      </SectionPanel>

      {isBillEditorOpen ? (
        <Modal
          eyebrow={billEditorId ? "Edit" : "Create"}
          onClose={() => {
            setBillEditorId(null);
            setBillDraft(emptyBillForm(firstActiveVendorId(vendors)));
            setDocumentFile(null);
            setIsBillEditorOpen(false);
          }}
          size="md"
          title={billEditorId ? "Edit Bill" : "New Bill"}
        >
          <form className="entity-form" onSubmit={handleBillSubmit}>
            <ModalActions
              disabled={saving || !hasActiveVendors}
              label={billSubmitLabel}
              onCancel={() => setIsBillEditorOpen(false)}
              saving={saving}
            />
            <div className="field-grid">
              <Select
                disabled={vendors.length === 0}
                fullWidth
                helperText="Used for expense tracking."
                label="Vendor - Required"
                onChange={(event) => setBillDraft((current) => ({ ...current, vendorId: event.target.value }))}
                options={[
                  { value: "", label: "Select vendor" },
                  ...vendors.filter((vendor) => !vendor.isArchived || vendor.id === billDraft.vendorId).map((vendor) => ({
                    value: vendor.id,
                    label: vendor.name
                  }))
                ]}
                required
                value={billDraft.vendorId}
              />
              <Input
                fullWidth
                helperText="Shown only in admin records."
                label="Bill reference - Optional"
                maxLength={500}
                onChange={(event) => setBillDraft((current) => ({ ...current, referenceNumber: event.target.value }))}
                placeholder="Vendor invoice number, receipt ID, or reference"
                value={billDraft.referenceNumber}
              />
              <Input
                fullWidth
                helperText="Used for expense tracking."
                label="Bill date - Required"
                onChange={(event) => setBillDraft((current) => ({ ...current, billDate: event.target.value }))}
                required
                type="date"
                value={billDraft.billDate}
              />
              <Input
                fullWidth
                helperText="Used to track when this bill should be paid."
                label="Due date - Required"
                onChange={(event) => setBillDraft((current) => ({ ...current, dueDate: event.target.value }))}
                required
                type="date"
                value={billDraft.dueDate}
              />
              <Input
                fullWidth
                helperText="Recorded in cents for the bill total."
                label="Amount - Required"
                min={1}
                onChange={(event) => setBillDraft((current) => ({ ...current, amountCents: event.target.valueAsNumber || 0 }))}
                placeholder="Total bill amount before payment tracking"
                required
                type="number"
                value={billDraft.amountCents}
              />
              <Select
                fullWidth
                helperText="Does not create a bank transaction."
                label="Payment status / method - Required"
                onChange={(event) => setBillDraft((current) => ({ ...current, paymentForm: event.target.value }))}
                options={paymentFormOptions.map((option) => ({ value: option.value, label: option.label }))}
                required
                value={billDraft.paymentForm}
              />
              <Input
                fullWidth
                helperText="Used only when a payment date is known."
                label="Payment date - Optional"
                onChange={(event) => setBillDraft((current) => ({ ...current, paymentDate: event.target.value }))}
                type="date"
                value={billDraft.paymentDate}
              />
              <Input
                fullWidth
                helperText="Used for admin reporting and filtering."
                label="Category - Optional"
                maxLength={500}
                onChange={(event) => setBillDraft((current) => ({ ...current, category: event.target.value }))}
                placeholder="Supplies, software, subcontractor, or service"
                value={billDraft.category}
              />
              <Input
                className="field-span-2"
                fullWidth
                helperText="Shown only in admin records."
                label="Document URL / reference - Optional"
                maxLength={2048}
                onChange={(event) => setBillDraft((current) => ({ ...current, documentUrl: event.target.value }))}
                placeholder="Receipt, invoice file, or folder reference"
                value={billDraft.documentUrl}
              />
              <Input
                className="field-span-2"
                fullWidth
                helperText="Visible only to admin team."
                label="Document storage key - Optional"
                maxLength={2048}
                onChange={(event) => setBillDraft((current) => ({ ...current, documentStorageKey: event.target.value }))}
                placeholder="Storage key or internal document path"
                value={billDraft.documentStorageKey}
              />
              <Textarea
                className="field-span-2"
                fullWidth
                helperText="Visible only to admin team."
                label="Internal notes - Optional"
                maxLength={4000}
                onChange={(event) => setBillDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Notes for admin team only"
                rows={3}
                value={billDraft.notes}
              />
              <Input
                accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                className="field-span-2"
                fullWidth
                helperText="Optional. Allowed: PDF, PNG, JPG, WebP up to 5 MB. Uploading does not create a payment."
                label="Upload document"
                onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)}
                type="file"
              />
            </div>
            <ModalActions
              disabled={saving || !hasActiveVendors}
              label={billSubmitLabel}
              onCancel={() => setIsBillEditorOpen(false)}
              saving={saving}
            />
          </form>
        </Modal>
      ) : null}

      {isVendorEditorOpen ? (
        <Modal eyebrow={vendorEditorId ? "Edit" : "Create"} onClose={() => setIsVendorEditorOpen(false)} size="sm" title={vendorEditorId ? "Edit Vendor" : "New Vendor"}>
          <form className="entity-form" onSubmit={handleVendorSubmit}>
            <div className="field-grid">
              <Input
                className="field-span-2"
                fullWidth
                label="Vendor name"
                maxLength={255}
                onChange={(event) => setVendorDraft({ name: event.target.value })}
                required
                value={vendorDraft.name}
              />
            </div>
            <ModalActions
              disabled={saving}
              label={vendorSubmitLabel}
              onCancel={() => setIsVendorEditorOpen(false)}
              saving={saving}
            />
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
