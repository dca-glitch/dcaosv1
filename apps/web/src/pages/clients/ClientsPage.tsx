import { type FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";

export type ClientSummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  billingDetails: string | null;
  contactPerson: string | null;
  notes: string | null;
  isArchived: boolean;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ClientFormValues = {
  name: string;
  email: string;
  phone: string;
  website: string;
  billingDetails: string;
  contactPerson: string;
  notes: string;
};

type ClientsPageProps = {
  clients: ClientSummary[];
  canEdit: boolean;
  error: string | null;
  loading: boolean;
  onArchive: (clientId: string) => Promise<boolean>;
  onSave: (clientId: string | null, values: ClientFormValues) => Promise<boolean>;
};

const emptyForm = (): ClientFormValues => ({
  name: "",
  email: "",
  phone: "",
  website: "",
  billingDetails: "",
  contactPerson: "",
  notes: ""
});

export function ClientsPage({ clients, canEdit, error, loading, onArchive, onSave }: ClientsPageProps) {
  const [filter, setFilter] = useState<"all" | "active" | "archived">("active");
  const [editorClientId, setEditorClientId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<ClientFormValues>(emptyForm());
  const [saving, setSaving] = useState(false);

  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        if (filter === "active") {
          return !client.isArchived;
        }

        if (filter === "archived") {
          return client.isArchived;
        }

        return true;
      }),
    [clients, filter]
  );

  function openCreateModal() {
    setEditorClientId(null);
    setDraft(emptyForm());
    setIsEditorOpen(true);
  }

  function openEditModal(client: ClientSummary) {
    setEditorClientId(client.id);
    setDraft({
      name: client.name,
      email: client.email ?? "",
      phone: client.phone ?? "",
      website: client.website ?? "",
      billingDetails: client.billingDetails ?? "",
      contactPerson: client.contactPerson ?? "",
      notes: client.notes ?? ""
    });
    setIsEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const ok = await onSave(editorClientId, draft);
      if (ok) {
        setEditorClientId(null);
        setDraft(emptyForm());
        setIsEditorOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading clients" />;
  }

  if (error) {
    return <ErrorState message={error} title="Clients unavailable" />;
  }

  return (
    <section className="view-section" aria-labelledby="clients-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">CRM</p>
          <h1 id="clients-title">Clients</h1>
        </div>
        <div className="toolbar">
          <div className="filter-bar" role="group" aria-label="Clients filter">
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
            <button className="primary-action" onClick={openCreateModal} type="button">
              Add Client
            </button>
          ) : null}
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <EmptyState message="No clients match the current filter." title="No clients" />
      ) : (
        <div className="entity-grid">
          {filteredClients.map((client) => (
            <article className="entity-card" key={client.id}>
              <div className="entity-card-header">
                <div>
                  <span className={`entity-pill entity-pill-${client.isArchived ? "archived" : "active"}`}>
                    {client.isArchived ? "Archived" : "Active"}
                  </span>
                  <h2>{client.name}</h2>
                </div>
                <div className="card-actions">
                  {canEdit ? (
                    <button className="secondary-action" onClick={() => openEditModal(client)} type="button">
                      Edit
                    </button>
                  ) : null}
                  {canEdit && !client.isArchived ? (
                    <button className="secondary-action" onClick={() => void onArchive(client.id)} type="button">
                      Archive
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="entity-field-grid">
                <div>
                  <span>Contact person</span>
                  <strong>{client.contactPerson || "Not set"}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{client.email || "Not set"}</strong>
                </div>
                <div>
                  <span>Phone</span>
                  <strong>{client.phone || "Not set"}</strong>
                </div>
                <div>
                  <span>Projects</span>
                  <strong>{client.projectCount}</strong>
                </div>
                <div className="entity-span-2">
                  <span>Billing details</span>
                  <strong>{client.billingDetails || "Not set"}</strong>
                </div>
                <div className="entity-span-2">
                  <span>Notes</span>
                  <strong>{client.notes || "Not set"}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isEditorOpen ? (
        <Modal
          onClose={() => {
            setEditorClientId(null);
            setDraft(emptyForm());
            setIsEditorOpen(false);
          }}
          title={editorClientId ? "Edit Client" : "Add Client"}
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
                Contact person
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, contactPerson: event.target.value }))}
                  value={draft.contactPerson}
                />
              </label>
              <label>
                Email
                <input
                  maxLength={320}
                  onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                  type="email"
                  value={draft.email}
                />
              </label>
              <label>
                Phone
                <input
                  maxLength={60}
                  onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                  value={draft.phone}
                />
              </label>
              <label>
                Website
                <input
                  maxLength={2048}
                  onChange={(event) => setDraft((current) => ({ ...current, website: event.target.value }))}
                  type="url"
                  value={draft.website}
                />
              </label>
              <label className="field-span-2">
                Billing details
                <textarea
                  maxLength={4000}
                  onChange={(event) => setDraft((current) => ({ ...current, billingDetails: event.target.value }))}
                  rows={4}
                  value={draft.billingDetails}
                />
              </label>
              <label className="field-span-2">
                Notes
                <textarea
                  maxLength={4000}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  rows={4}
                  value={draft.notes}
                />
              </label>
            </div>
            <div className="modal-footer">
              <button className="secondary-action" disabled={saving} onClick={() => setEditorClientId(null)} type="button">
                Cancel
              </button>
              <button className="primary-action" disabled={saving} type="submit">
                {saving ? "Saving" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
