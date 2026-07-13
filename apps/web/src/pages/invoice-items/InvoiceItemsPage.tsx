import { type FormEvent, useMemo, useState } from "react";
import { Modal } from "../../components/ui";
import {
  Button,
  EmptyState,
  ErrorState,
  FilterBar,
  Input,
  LoadingState,
  MetricCard,
  ModalActions,
  PageHeader,
  SectionPanel,
  StatusBadge,
  Textarea,
} from "../../components/ui";
import "../finance/finance.css";

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
    <section className="view-section finance-lite" aria-labelledby="invoice-items-title" data-density="compact">
      <PageHeader
        eyebrow="Finance"
        title="Service library"
        titleId="invoice-items-title"
        description="Reusable service prices for invoice drafting."
        filters={
          <FilterBar
            ariaLabel="Service library view"
            onChange={(value) => setTab(value as "active" | "archived")}
            options={[
              { value: "active", label: "Active" },
              { value: "archived", label: "Archived" }
            ]}
            value={tab}
          />
        }
        actions={
          canEdit ? (
            <Button onClick={openCreateModal} type="button">
              New service
            </Button>
          ) : null
        }
      />

      <div className="summary-grid metric-grid dashboard-command-metrics--compact finance-summary-strip" aria-label="Service library summary from loaded records">
        <MetricCard label="Active services" value={String(activeItems.length)} helper="Available for invoice drafting" accent="cyan" />
        <MetricCard label="Archived services" value={String(archivedItems.length)} helper="Hidden from active library" accent={archivedItems.length ? "warning" : "success"} />
        <MetricCard label="Catalog value" value={formatMoney(totalActiveValue)} helper="Sum of active unit prices" accent="purple" />
      </div>

      <SectionPanel
        tone="compact"
        title="Services"
        description="Create, update, archive, and restore reusable service entries."
      >
        {visibleItems.length === 0 ? (
          <EmptyState
            message={
              tab === "active"
                ? "Add your first reusable service."
                : "Archived services will appear here when available."
            }
            title={tab === "active" ? "No active services" : "No archived services"}
            variant="inline"
          />
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
                    {canEdit && !item.isArchived ? (
                      <Button onClick={() => openEditModal(item)} type="button">
                        Edit
                      </Button>
                    ) : null}
                    {canEdit ? (
                      <details className="row-action-menu">
                        <summary>More</summary>
                        <div className="row-action-menu-panel">
                          <div className="row-action-menu-group">
                            <span className="row-action-menu-label">Service</span>
                            {!item.isArchived ? (
                              <Button onClick={() => void onArchiveInvoiceItem(item.id)} size="sm" type="button" variant="secondary">
                                Archive
                              </Button>
                            ) : null}
                            {item.isArchived ? (
                              <Button onClick={() => void onRestoreInvoiceItem(item.id)} size="sm" type="button" variant="secondary">
                                Restore
                              </Button>
                            ) : null}
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
        <Modal isOpen
          onClose={closeEditor}
          title={editorId ? "Edit Service" : "Add Service"}
        >
          <form className="entity-form" onSubmit={handleSubmit}>
            <p className="muted-text">Used as reusable invoice line items. Changing this does not update existing invoices.</p>
            <ModalActions disabled={saving || !draft.name.trim()} label={submitLabel} onCancel={closeEditor} saving={saving} />
            <div className="field-grid">
              <Input
                fullWidth
                helperText="Used as reusable invoice line items."
                label="Service name - Required"
                maxLength={255}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="SEO article, monthly retainer, website maintenance"
                required
                value={draft.name}
              />
              <Textarea
                className="field-span-2"
                fullWidth
                helperText="Changing this does not update existing invoices."
                label="Description - Optional"
                maxLength={4000}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder="Default line item description used on invoices"
                rows={4}
                value={draft.description}
              />
              <Input
                fullWidth
                helperText="Stored as the reusable default price for future invoice drafting."
                label="Unit price - Required"
                min={0}
                onChange={(event) => setDraft((current) => ({ ...current, unitPriceCents: event.target.valueAsNumber || 0 }))}
                placeholder="Default price before tax or discount"
                required
                type="number"
                value={draft.unitPriceCents}
              />
            </div>
            <ModalActions disabled={saving || !draft.name.trim()} label={submitLabel} onCancel={closeEditor} saving={saving} />
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
