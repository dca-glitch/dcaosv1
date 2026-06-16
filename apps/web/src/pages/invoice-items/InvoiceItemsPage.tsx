import { type FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import { MetricCard, PageHeader, SectionPanel, StatusBadge } from "../../components/ui";

export type InvoiceItemSummary = {
  id: string;
  name: string;
  description: string | null;
  unitPriceCents: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceItemFormValues = {
  name: string;
  description: string;
  unitPriceCents: number;
};

type InvoiceItemsPageProps = {
  activeItems: InvoiceItemSummary[];
  archivedItems: InvoiceItemSummary[];
  canEdit: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  onSaveInvoiceItem: (invoiceItemId: string | null, values: InvoiceItemFormValues) => Promise<boolean>;
  onArchiveInvoiceItem: (invoiceItemId: string) => Promise<boolean>;
  onRestoreInvoiceItem: (invoiceItemId: string) => Promise<boolean>;
};

const emptyInvoiceItemForm: InvoiceItemFormValues = {
  name: "",
  description: "",
  unitPriceCents: 0
};

function formatMoney(cents: number): string {
  return new Intl.NumberFormat(undefined, { currency: "USD", style: "currency" }).format(cents / 100);
}

export function InvoiceItemsPage({
  activeItems,
  archivedItems,
  canEdit,
  isLoading,
  errorMessage,
  onSaveInvoiceItem,
  onArchiveInvoiceItem,
  onRestoreInvoiceItem
}: InvoiceItemsPageProps) {
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [editorId, setEditorId] = useState<string | null>(null);
  const [draft, setDraft] = useState<InvoiceItemFormValues>(emptyInvoiceItemForm);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const visibleItems = tab === "active" ? activeItems : archivedItems;
  const totalActiveValue = useMemo(
    () => activeItems.reduce((total, item) => total + item.unitPriceCents, 0),
    [activeItems]
  );

  function openCreateModal() {
    setEditorId(null);
    setDraft(emptyInvoiceItemForm);
    setIsEditorOpen(true);
  }

  function openEditModal(item: InvoiceItemSummary) {
    setEditorId(item.id);
    setDraft({
      name: item.name,
      description: item.description ?? "",
      unitPriceCents: item.unitPriceCents
    });
    setIsEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const ok = await onSaveInvoiceItem(editorId, draft);
      if (ok) {
        setEditorId(null);
        setDraft(emptyInvoiceItemForm);
        setIsEditorOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading services library" />;
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} title="Services library unavailable" />;
  }

  return (
    <section className="view-section" aria-labelledby="invoice-items-title">
      <PageHeader
        eyebrow="Finance"
        title="Services Library"
        titleId="invoice-items-title"
        description="Reusable invoice items and service prices scoped to the active tenant. Use this library to standardize future invoice line items."
        actions={
          canEdit ? (
            <button className="primary-action" onClick={openCreateModal} type="button">
              Add Service
            </button>
          ) : null
        }
      />

      <div className="summary-grid metric-grid">
        <MetricCard label="Active services" value={String(activeItems.length)} helper="Available for invoice drafting" accent="cyan" />
        <MetricCard label="Archived services" value={String(archivedItems.length)} helper="Hidden from active library" accent={archivedItems.length ? "warning" : "success"} />
        <MetricCard label="Catalog value" value={formatMoney(totalActiveValue)} helper="Sum of active unit prices" accent="purple" />
      </div>

      <SectionPanel
        title="Invoice Items / Services"
        description="Create, update, archive, and restore reusable service entries. Payments, credit notes, downloads, and project documents are intentionally out of scope here."
        action={
          <div className="filter-bar" role="group" aria-label="Service library view">
            <button
              aria-pressed={tab === "active"}
              className={tab === "active" ? "secondary-action filter-chip is-active" : "secondary-action filter-chip"}
              onClick={() => setTab("active")}
              type="button"
            >
              Active
            </button>
            <button
              aria-pressed={tab === "archived"}
              className={tab === "archived" ? "secondary-action filter-chip is-active" : "secondary-action filter-chip"}
              onClick={() => setTab("archived")}
              type="button"
            >
              Archived
            </button>
          </div>
        }
      >
        {visibleItems.length === 0 ? (
          <EmptyState
            title={tab === "active" ? "No active services" : "No archived services"}
            message={tab === "active" ? "Add your first reusable service to build the invoice item library." : "Archived services will appear here when available."}
          />
        ) : (
          <div className="entity-grid">
            {visibleItems.map((item) => (
              <article className="entity-card" key={item.id}>
                <div className="entity-card-header">
                  <div>
                    <StatusBadge status={item.isArchived ? "Archived" : "Active"} />
                    <h2>{item.name}</h2>
                  </div>
                  <div className="card-actions">
                    {canEdit && !item.isArchived ? <button className="secondary-action" onClick={() => openEditModal(item)} type="button">Edit</button> : null}
                    {canEdit && !item.isArchived ? <button className="secondary-action" onClick={() => void onArchiveInvoiceItem(item.id)} type="button">Archive</button> : null}
                    {canEdit && item.isArchived ? <button className="secondary-action" onClick={() => void onRestoreInvoiceItem(item.id)} type="button">Restore</button> : null}
                  </div>
                </div>
                <div className="entity-field-grid">
                  <div><span>Unit price</span><strong>{formatMoney(item.unitPriceCents)}</strong></div>
                  <div><span>Status</span><strong>{item.isArchived ? "Archived" : "Active"}</strong></div>
                  <div className="entity-span-2"><span>Description</span><strong>{item.description || "No description"}</strong></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionPanel>

      {isEditorOpen ? (
        <Modal
          onClose={() => {
            setEditorId(null);
            setDraft(emptyInvoiceItemForm);
            setIsEditorOpen(false);
          }}
          title={editorId ? "Edit Service" : "Add Service"}
        >
          <form className="entity-form" onSubmit={handleSubmit}>
            <div className="field-grid">
              <label>
                Name
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  required
                  value={draft.name}
                />
              </label>
              <label>
                Unit price cents
                <input
                  min={0}
                  onChange={(event) => setDraft((current) => ({ ...current, unitPriceCents: event.target.valueAsNumber || 0 }))}
                  required
                  type="number"
                  value={draft.unitPriceCents}
                />
              </label>
              <label className="field-span-2">
                Description
                <textarea
                  maxLength={4000}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  rows={4}
                  value={draft.description}
                />
              </label>
            </div>
            <div className="modal-footer">
              <button className="secondary-action" disabled={saving} onClick={() => setIsEditorOpen(false)} type="button">Cancel</button>
              <button className="primary-action" disabled={saving || !draft.name.trim()} type="submit">{saving ? "Saving" : "Save"}</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}