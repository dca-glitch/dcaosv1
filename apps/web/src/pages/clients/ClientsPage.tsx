import { type FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import { ModalActions } from "../../components/ui/ModalActions";
import type { ProjectSummary } from "../projects/ProjectsPage";

export type ClientSummary = {
  id: string;
  name: string;
  email: string | null;
  contactPerson: string | null;
  billingAddress: string | null;
  taxId: string | null;
  country: string | null;
  isArchived: boolean;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ClientFormValues = {
  name: string;
  email: string;
  contactPerson: string;
  billingAddress: string;
  taxId: string;
  country: string;
};

export type ClientAccessUserSummary = {
  id: string;
  clientId: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    status: string;
  };
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClientAccessTenantUser = {
  id: string;
  email: string;
  name?: string | null;
  status: string;
};

type ClientsPageProps = {
  clients: ClientSummary[];
  projects: ProjectSummary[];
  canEdit: boolean;
  error: string | null;
  loading: boolean;
  onArchive: (clientId: string) => Promise<boolean>;
  onArchiveUserAccess: (clientId: string, userId: string) => Promise<boolean>;
  onLoadUserAccess: (clientId: string) => Promise<ClientAccessUserSummary[]>;
  onLinkUserAccess: (clientId: string, userId: string) => Promise<boolean>;
  onRestore: (clientId: string) => Promise<boolean>;
  onSave: (clientId: string | null, values: ClientFormValues) => Promise<boolean>;
  tenantUsers: ClientAccessTenantUser[];
};

const COUNTRY_OPTIONS = ["Indonesia", "Poland", "United States", "United Kingdom", "Singapore", "Australia"];

const emptyForm = (): ClientFormValues => ({
  name: "",
  email: "",
  contactPerson: "",
  billingAddress: "",
  taxId: "",
  country: ""
});

export function ClientsPage({
  clients,
  projects,
  canEdit,
  error,
  loading,
  onArchive,
  onArchiveUserAccess,
  onLoadUserAccess,
  onLinkUserAccess,
  onRestore,
  onSave,
  tenantUsers
}: ClientsPageProps) {
  const [filter, setFilter] = useState<"all" | "active" | "archived">("active");
  const [editorClientId, setEditorClientId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<ClientFormValues>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [clientAccessUsers, setClientAccessUsers] = useState<ClientAccessUserSummary[]>([]);
  const [accessUserId, setAccessUserId] = useState("");
  const [accessLoading, setAccessLoading] = useState(false);
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === editorClientId) ?? null,
    [clients, editorClientId]
  );
  const selectedClientProjects = useMemo(
    () => projects.filter((project) => project.clientId === selectedClient?.id),
    [projects, selectedClient]
  );
  const linkableTenantUsers = useMemo(
    () => {
      const linkedUserIds = new Set(clientAccessUsers.map((access) => access.user.id));
      return tenantUsers.filter((user) => user.status === "ACTIVE" && !linkedUserIds.has(user.id));
    },
    [clientAccessUsers, tenantUsers]
  );

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

  const submitLabel = editorClientId ? "Update client" : "Create client";

  function closeEditor() {
    setEditorClientId(null);
    setDraft(emptyForm());
    setClientAccessUsers([]);
    setAccessUserId("");
    setIsEditorOpen(false);
  }

  function openCreateModal() {
    closeEditor();
    setIsEditorOpen(true);
  }

  async function openEditModal(client: ClientSummary) {
    setEditorClientId(client.id);
    setDraft({
      name: client.name,
      email: client.email ?? "",
      contactPerson: client.contactPerson ?? "",
      billingAddress: client.billingAddress ?? "",
      taxId: client.taxId ?? "",
      country: client.country ?? ""
    });
    setClientAccessUsers([]);
    setAccessUserId("");
    setIsEditorOpen(true);
    setAccessLoading(true);
    try {
      setClientAccessUsers(await onLoadUserAccess(client.id));
    } finally {
      setAccessLoading(false);
    }
  }

  async function handleLinkAccess() {
    if (!selectedClient || !accessUserId) return;
    setAccessLoading(true);
    try {
      const ok = await onLinkUserAccess(selectedClient.id, accessUserId);
      if (ok) {
        setAccessUserId("");
        setClientAccessUsers(await onLoadUserAccess(selectedClient.id));
      }
    } finally {
      setAccessLoading(false);
    }
  }

  async function handleArchiveAccess(userId: string) {
    if (!selectedClient) return;
    setAccessLoading(true);
    try {
      const ok = await onArchiveUserAccess(selectedClient.id, userId);
      if (ok) {
        setClientAccessUsers(await onLoadUserAccess(selectedClient.id));
      }
    } finally {
      setAccessLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const ok = await onSave(editorClientId, draft);
      if (ok) {
        closeEditor();
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
        <div className="dense-list">
          {filteredClients.map((client) => (
            <article className="entity-card dense-record" key={client.id}>
              <div className="dense-record-main">
                <div className="dense-title">
                  <div className="dense-kicker">
                    <span className={`entity-pill entity-pill-${client.isArchived ? "archived" : "active"}`}>
                      {client.isArchived ? "Archived" : "Active"}
                    </span>
                  </div>
                  <h2>{client.name}</h2>
                  <div className="dense-meta">
                    <span><strong>{client.contactPerson || "No contact"}</strong></span>
                    <span>{client.email || "No email"}</span>
                    <span>{client.country || "No country"}</span>
                  </div>
                </div>

                <div className="dense-fields">
                  <div className="dense-field">
                    <span>Contact</span>
                    <strong>{client.contactPerson || "Not set"}</strong>
                  </div>
                  <div className="dense-field">
                    <span>Email</span>
                    <strong>{client.email || "Not set"}</strong>
                  </div>
                  <div className="dense-field">
                    <span>Country</span>
                    <strong>{client.country || "Not set"}</strong>
                  </div>
                  <div className="dense-field">
                    <span>Projects</span>
                    <strong>{client.projectCount}</strong>
                  </div>
                </div>

                <div className="dense-actions">
                  {canEdit ? <button className="primary-action" onClick={() => void openEditModal(client)} type="button">Open</button> : null}
                  {canEdit ? (
                    <details className="row-action-menu">
                      <summary>More</summary>
                      <div className="row-action-menu-panel">
                        <div className="row-action-menu-group">
                          <span className="row-action-menu-label">Client</span>
                          {!client.isArchived ? (
                            <button
                              className="secondary-action"
                              disabled={client.projectCount > 0}
                              onClick={() => void onArchive(client.id)}
                              title={client.projectCount > 0 ? "Archive blocked while active projects exist." : undefined}
                              type="button"
                            >
                              Archive
                            </button>
                          ) : null}
                          {client.isArchived ? (
                            <button className="secondary-action" onClick={() => void onRestore(client.id)} type="button">
                              Restore
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
              <div className="dense-row-note">
                Tax/VAT: {client.taxId || "Not set"}. Billing address: {client.billingAddress || "Not set"}.
              </div>
            </article>
          ))}
        </div>
      )}

      {isEditorOpen ? (
        <Modal
          onClose={closeEditor}
          title={editorClientId ? "Edit Client" : "Add Client"}
        >
          <form className="entity-form" onSubmit={handleSubmit}>
            <p className="muted-text">Used by admin team to organize work and billing. Archived clients are hidden from active work but can be restored.</p>
            <ModalActions disabled={saving} label={submitLabel} onCancel={closeEditor} saving={saving} />
            <div className="field-grid">
              <label>
                Client name - Required
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Business or person this work is for"
                  required
                  value={draft.name}
                />
                <span className="muted-text">Used by admin team to organize work and billing.</span>
              </label>
              <label>
                Contact person - Optional
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, contactPerson: event.target.value }))}
                  placeholder="Main person for approvals or communication"
                  value={draft.contactPerson}
                />
                <span className="muted-text">Used for day-to-day approvals and communication.</span>
              </label>
              <label>
                Email - Optional
                <input
                  maxLength={320}
                  onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Client billing or primary contact email"
                  type="email"
                  value={draft.email}
                />
                <span className="muted-text">Shown only in admin records.</span>
              </label>
              <label>
                Tax/VAT ID - Optional
                <input
                  maxLength={100}
                  onChange={(event) => setDraft((current) => ({ ...current, taxId: event.target.value }))}
                  placeholder="Client tax number if used for billing"
                  value={draft.taxId}
                />
                <span className="muted-text">Shown only in admin records.</span>
              </label>
              <label className="field-span-2">
                Billing address - Optional
                <textarea
                  maxLength={4000}
                  onChange={(event) => setDraft((current) => ({ ...current, billingAddress: event.target.value }))}
                  placeholder="Billing address used on invoices or contracts"
                  rows={4}
                  value={draft.billingAddress}
                />
                <span className="muted-text">Used by admin team for billing records.</span>
              </label>
              <label>
                Country - Optional
                <select
                  onChange={(event) => setDraft((current) => ({ ...current, country: event.target.value }))}
                  value={draft.country}
                >
                  <option value="">Country for billing or tax context</option>
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <span className="muted-text">Used by admin team to organize work and billing.</span>
              </label>
            </div>
            {selectedClient ? (
              <section className="entity-span-2" aria-labelledby="client-projects-title">
                <h3 id="client-projects-title">Projects for this client</h3>
                <p className="muted-text">Related projects help the admin team track delivery and billing context.</p>
                {selectedClientProjects.length === 0 ? (
                  <p>No projects for this client.</p>
                ) : (
                  <div>
                    {selectedClientProjects.map((project) => (
                      <p key={project.id}>{project.name}</p>
                    ))}
                  </div>
                )}
              </section>
            ) : null}
            {selectedClient && canEdit ? (
              <section className="entity-span-2" aria-labelledby="client-access-title">
                <h3 id="client-access-title">Client access</h3>
                {accessLoading ? <p>Loading client access...</p> : null}
                {!accessLoading && clientAccessUsers.length === 0 ? <p>No users linked to this client.</p> : null}
                {clientAccessUsers.length > 0 ? (
                  <div className="dense-access-list">
                    {clientAccessUsers.map((access) => (
                      <div className="dense-access-row" key={access.id}>
                        <p>
                          <strong>{access.user.name || access.user.email}</strong>
                          <small>{access.user.name ? access.user.email : access.user.status}</small>
                        </p>
                        <button
                          className="secondary-action"
                          disabled={accessLoading}
                          onClick={() => void handleArchiveAccess(access.user.id)}
                          type="button"
                        >
                          Remove access
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="field-grid">
                  <label>
                    Link tenant user
                    <select disabled={accessLoading || linkableTenantUsers.length === 0} onChange={(event) => setAccessUserId(event.target.value)} value={accessUserId}>
                      <option value="">Select active user</option>
                      {linkableTenantUsers.map((user) => (
                        <option key={user.id} value={user.id}>{user.name ? `${user.name} (${user.email})` : user.email}</option>
                      ))}
                    </select>
                  </label>
                  <div>
                    <span>&nbsp;</span>
                    <button className="secondary-action" disabled={accessLoading || !accessUserId} onClick={() => void handleLinkAccess()} type="button">
                      Link user
                    </button>
                  </div>
                </div>
              </section>
            ) : null}
            <ModalActions disabled={saving} label={submitLabel} onCancel={closeEditor} saving={saving} />
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
