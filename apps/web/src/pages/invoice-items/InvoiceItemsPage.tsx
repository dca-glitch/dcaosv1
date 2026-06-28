import { type FormEvent, useMemo, useState } from "react";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import { MetricCard, PageHeader, SectionPanel, StatusBadge } from "../../components/ui";
import { ModalActions } from "../../components/ui/ModalActions";

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
  const submitLabel = editorId ? "Update service" : "Create service";

  function closeEditor() {
    setEditorId(null);
    setDraft(emptyInvoiceItemForm);
    setIsEditorOpen(false);
  }

  function openCreateModal() {
    closeEditor();
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
        closeEditor();
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

      <div className="summary-grid metric-grid dashboard-command-metrics--compact">
        <MetricCard label="Active services" value={String(activeItems.length)} helper="Available for invoice drafting" accent="cyan" />
        <MetricCard label="Archived services" value={String(archivedItems.length)} helper="Hidden from active library" accent={archivedItems.length ? "warning" : "success"} />
        <MetricCard label="Catalog value" value={formatMoney(totalActiveValue)} helper="Sum of active unit prices" accent="purple" />
      </div>

      <SectionPanel
        tone="compact"
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
          <p className="inline-empty muted-text">
            {tab === "active"
              ? "Add your first reusable service to build the invoice item library."
              : "Archived services will appear here when available."}
          </p>
        ) : (
          <div className="dense-list">
            {visibleItems.map((item) => (
              <article className="entity-card dense-record" key={item.id}>
                <div className="dense-record-main">
                  <div className="dense-title">
                    <div className="dense-kicker">
                      <StatusBadge status={item.isArchived ? "Archived" : "Active"} />
                    </div>
                    <h2>{item.name}</h2>
                    <div className="dense-meta">
                      <span><strong>{formatMoney(item.unitPriceCents)}</strong></span>
                      <span>{item.description || "No description"}</span>
                    </div>
                  </div>

                  <div className="dense-fields">
                    <div className="dense-field">
                      <span>Unit price</span>
                      <strong>{formatMoney(item.unitPriceCents)}</strong>
                    </div>
                    <div className="dense-field">
                      <span>Status</span>
                      <strong>{item.isArchived ? "Archived" : "Active"}</strong>
                    </div>
                    <div className="dense-field">
                      <span>Description</span>
                      <strong>{item.description || "No description"}</strong>
                    </div>
                    <div className="dense-field">
                      <span>Updated</span>
                      <strong>{new Date(item.updatedAt).toLocaleDateString()}</strong>
                    </div>
                  </div>

                  <div className="dense-actions">
                    {canEdit && !item.isArchived ? <button className="primary-action" onClick={() => openEditModal(item)} type="button">Open</button> : null}
                    {canEdit ? (
                      <details className="row-action-menu">
                        <summary>More</summary>
                        <div className="row-action-menu-panel">
                          <div className="row-action-menu-group">
                            <span className="row-action-menu-label">Service</span>
                            {!item.isArchived ? <button className="secondary-action" onClick={() => void onArchiveInvoiceItem(item.id)} type="button">Archive</button> : null}
                            {item.isArchived ? <button className="secondary-action" onClick={() => void onRestoreInvoiceItem(item.id)} type="button">Restore</button> : null}
                          </div>
                        </div>
                      </details>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionPanel>

      {isEditorOpen ? (
        <Modal
          onClose={closeEditor}
          title={editorId ? "Edit Service" : "Add Service"}
        >
          <form className="entity-form" onSubmit={handleSubmit}>
            <p className="muted-text">Used as reusable invoice line items. Changing this does not update existing invoices.</p>
            <ModalActions disabled={saving || !draft.name.trim()} label={submitLabel} onCancel={closeEditor} saving={saving} />
            <div className="field-grid">
              <label>
                Service name - Required
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="SEO article, monthly retainer, website maintenance"
                  required
                  value={draft.name}
                />
                <span className="muted-text">Used as reusable invoice line items.</span>
              </label>
              <label className="field-span-2">
                Description - Optional
                <textarea
                  maxLength={4000}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Default line item description used on invoices"
                  rows={4}
                  value={draft.description}
                />
                <span className="muted-text">Changing this does not update existing invoices.</span>
              </label>
              <label>
                Unit price - Required
                <input
                  min={0}
                  onChange={(event) => setDraft((current) => ({ ...current, unitPriceCents: event.target.valueAsNumber || 0 }))}
                  placeholder="Default price before tax or discount"
                  required
                  type="number"
                  value={draft.unitPriceCents}
                />
                <span className="muted-text">Stored as the reusable default price for future invoice drafting.</span>
              </label>
            </div>
            <ModalActions disabled={saving || !draft.name.trim()} label={submitLabel} onCancel={closeEditor} saving={saving} />
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
