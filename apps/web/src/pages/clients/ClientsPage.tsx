import { type FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
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

  function openCreateModal() {
    setEditorClientId(null);
    setDraft(emptyForm());
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
                    <button className="secondary-action" onClick={() => void openEditModal(client)} type="button">
                      Edit
                    </button>
                  ) : null}
                  {canEdit && !client.isArchived ? (
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
                  {canEdit && client.isArchived ? (
                    <button className="secondary-action" onClick={() => void onRestore(client.id)} type="button">
                      Restore
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
                  <span>Country</span>
                  <strong>{client.country || "Not set"}</strong>
                </div>
                <div>
                  <span>Tax/VAT ID</span>
                  <strong>{client.taxId || "Not set"}</strong>
                </div>
                <div>
                  <span>Projects</span>
                  <strong>{client.projectCount}</strong>
                </div>
                <div className="entity-span-2">
                  <span>Billing address</span>
                  <strong>{client.billingAddress || "Not set"}</strong>
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
            setClientAccessUsers([]);
            setAccessUserId("");
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
              <label className="field-span-2">
                Billing address
                <textarea
                  maxLength={4000}
                  onChange={(event) => setDraft((current) => ({ ...current, billingAddress: event.target.value }))}
                  rows={4}
                  value={draft.billingAddress}
                />
              </label>
              <label>
                Tax/VAT ID
                <input
                  maxLength={100}
                  onChange={(event) => setDraft((current) => ({ ...current, taxId: event.target.value }))}
                  value={draft.taxId}
                />
              </label>
              <label>
                Country
                <select
                  onChange={(event) => setDraft((current) => ({ ...current, country: event.target.value }))}
                  value={draft.country}
                >
                  <option value="">Select country</option>
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {selectedClient ? (
              <section className="entity-span-2" aria-labelledby="client-projects-title">
                <h3 id="client-projects-title">Projects for this client</h3>
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
                  <div>
                    {clientAccessUsers.map((access) => (
                      <p key={access.id}>
                        <strong>{access.user.name || access.user.email}</strong> {access.user.name ? access.user.email : ""}
                        <button
                          className="secondary-action"
                          disabled={accessLoading}
                          onClick={() => void handleArchiveAccess(access.user.id)}
                          type="button"
                        >
                          Remove access
                        </button>
                      </p>
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
