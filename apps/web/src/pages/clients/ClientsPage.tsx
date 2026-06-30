import { ClientAccessPanel } from "../../components/clients/ClientAccessPanel";
import { type FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import { Button, ModalActions, PageHeader } from "../../components/ui";
import type { ProjectSummary } from "../projects/ProjectsPage";

export type ClientSummary = {
  id: string;
  name: string;
  email: string | null;
  website: string | null;
  contactPerson: string | null;
  billingAddress: string | null;
  taxId: string | null;
  country: string | null;
  clientKind: "AGENCY_CLIENT" | "OWN_DOMAIN";
  legalEntityName: string | null;
  accountGroupName: string | null;
  migrationStatus: "ACTIVE" | "PLANNED_LICENSEE_TENANT" | "MIGRATED";
  isArchived: boolean;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ClientFormValues = {
  name: string;
  email: string;
  website: string;
  contactPerson: string;
  billingAddress: string;
  taxId: string;
  country: string;
  clientKind: "AGENCY_CLIENT" | "OWN_DOMAIN";
  legalEntityName: string;
  accountGroupName: string;
  migrationStatus: "ACTIVE" | "PLANNED_LICENSEE_TENANT" | "MIGRATED";
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
  onLoadUserAccess: (clientId: string, options?: { includeArchived?: boolean }) => Promise<ClientAccessUserSummary[]>;
  onLinkUserAccess: (clientId: string, userId: string) => Promise<boolean>;
  onRestore: (clientId: string) => Promise<boolean>;
  onSave: (clientId: string | null, values: ClientFormValues) => Promise<boolean>;
  onOpenHub: (client: ClientSummary) => void;
  tenantUsers: ClientAccessTenantUser[];
};

const COUNTRY_OPTIONS = ["Indonesia", "Poland", "United States", "United Kingdom", "Singapore", "Australia"];

const emptyForm = (): ClientFormValues => ({
  name: "",
  email: "",
  website: "",
  contactPerson: "",
  billingAddress: "",
  taxId: "",
  country: "",
  clientKind: "AGENCY_CLIENT",
  legalEntityName: "",
  accountGroupName: "",
  migrationStatus: "ACTIVE"
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
  onOpenHub,
  tenantUsers
}: ClientsPageProps) {
  const [filter, setFilter] = useState<"all" | "active" | "archived">("active");
  const [kindFilter, setKindFilter] = useState<"all" | "AGENCY_CLIENT" | "OWN_DOMAIN">("all");
  const [editorClientId, setEditorClientId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<ClientFormValues>(emptyForm());
  const [saving, setSaving] = useState(false);
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === editorClientId) ?? null,
    [clients, editorClientId]
  );
  const selectedClientProjects = useMemo(
    () => projects.filter((project) => project.clientId === selectedClient?.id),
    [projects, selectedClient]
  );

  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        if (kindFilter !== "all" && client.clientKind !== kindFilter) {
          return false;
        }

        if (filter === "active") {
          return !client.isArchived;
        }

        if (filter === "archived") {
          return client.isArchived;
        }

        return true;
      }),
    [clients, filter, kindFilter]
  );

  const submitLabel = editorClientId ? "Update client" : "Create client";

  function closeEditor() {
    setEditorClientId(null);
    setDraft(emptyForm());
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
      website: client.website ?? "",
      contactPerson: client.contactPerson ?? "",
      billingAddress: client.billingAddress ?? "",
      taxId: client.taxId ?? "",
      country: client.country ?? "",
      clientKind: client.clientKind,
      legalEntityName: client.legalEntityName ?? "",
      accountGroupName: client.accountGroupName ?? "",
      migrationStatus: client.migrationStatus
    });
    setIsEditorOpen(true);
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
      <PageHeader
        eyebrow="CRM"
        title="Clients"
        titleId="clients-title"
        description="Client records, contacts, and delivery links."
        actions={
          <>
            <div className="clients-toolbar-filters">
              <div className="filter-bar" role="group" aria-label="Clients kind filter">
                {(["all", "AGENCY_CLIENT", "OWN_DOMAIN"] as const).map((value) => (
                  <button
                    aria-pressed={kindFilter === value}
                    className={kindFilter === value ? "secondary-action filter-chip is-active" : "secondary-action filter-chip"}
                    key={value}
                    onClick={() => setKindFilter(value)}
                    type="button"
                  >
                    {value === "all" ? "All kinds" : value === "AGENCY_CLIENT" ? "Agency" : "Own domain"}
                  </button>
                ))}
              </div>
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
            </div>
            {canEdit ? (
              <Button onClick={openCreateModal} type="button" variant="primary">
                Add Client
              </Button>
            ) : null}
          </>
        }
      />

      {filteredClients.length === 0 ? (
        <p className="inline-empty muted-text">No clients match the current filter.</p>
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
                    <span className={`entity-pill entity-pill-${client.clientKind === "OWN_DOMAIN" ? "warning" : "info"}`}>
                      {client.clientKind === "OWN_DOMAIN" ? "Own domain" : "Agency client"}
                    </span>
                  </div>
                  <h2>{client.name}</h2>
                  <div className="dense-meta">
                    <span><strong>{client.contactPerson || "No contact"}</strong></span>
                    <span>{client.email || "No email"}</span>
                    <span>{client.website || "No website"}</span>
                    <span>{client.country || "No country"}</span>
                  </div>
                </div>

                <div className="dense-fields">
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
                  <Button size="sm" variant="secondary" onClick={() => onOpenHub(client)} type="button">
                    Open hub
                  </Button>
                  {canEdit ? <Button size="sm" variant="secondary" onClick={() => void openEditModal(client)} type="button">Open</Button> : null}
                  {canEdit ? (
                    <details className="row-action-menu">
                      <summary>More</summary>
                      <div className="row-action-menu-panel">
                        <div className="row-action-menu-group">
                          <span className="row-action-menu-label">Client</span>
                          {!client.isArchived ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={client.projectCount > 0}
                              onClick={() => void onArchive(client.id)}
                              title={client.projectCount > 0 ? "Archive blocked while active projects exist." : undefined}
                              type="button"
                            >
                              Archive
                            </Button>
                          ) : null}
                          {client.isArchived ? (
                            <Button size="sm" variant="secondary" onClick={() => void onRestore(client.id)} type="button">
                              Restore
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
              <div className="dense-row-note">
                Tax/VAT: {client.taxId || "Not set"}. Billing address: {client.billingAddress || "Not set"}.
                {client.legalEntityName ? ` Legal entity: ${client.legalEntityName}.` : ""}
                {client.accountGroupName ? ` Group: ${client.accountGroupName}.` : ""}
              </div>
            </article>
          ))}
        </div>
      )}

      {isEditorOpen ? (
        <Modal
          eyebrow={editorClientId ? "Edit" : "Create"}
          onClose={closeEditor}
          size="md"
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
                Website - Optional
                <input
                  maxLength={500}
                  onChange={(event) => setDraft((current) => ({ ...current, website: event.target.value }))}
                  placeholder="https://example.com"
                  type="url"
                  value={draft.website}
                />
                <span className="muted-text">Canonical domain for this client record.</span>
              </label>
              <label>
                Client kind - Required
                <select
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      clientKind: event.target.value as ClientFormValues["clientKind"]
                    }))
                  }
                  required
                  value={draft.clientKind}
                >
                  <option value="AGENCY_CLIENT">Agency client</option>
                  <option value="OWN_DOMAIN">Own domain</option>
                </select>
                <span className="muted-text">Own domain clients are separate legal entities, not billed in DCA LLC finance.</span>
              </label>
              <label>
                Legal entity name - Optional
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, legalEntityName: event.target.value }))}
                  placeholder="Registered company name"
                  value={draft.legalEntityName}
                />
              </label>
              <label>
                Account group - Optional
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, accountGroupName: event.target.value }))}
                  placeholder="Group label for related domains"
                  value={draft.accountGroupName}
                />
              </label>
              <label>
                Migration status
                <select
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      migrationStatus: event.target.value as ClientFormValues["migrationStatus"]
                    }))
                  }
                  value={draft.migrationStatus}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PLANNED_LICENSEE_TENANT">Planned licensee tenant</option>
                  <option value="MIGRATED">Migrated</option>
                </select>
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
              <ClientAccessPanel
                canEdit={canEdit}
                clientId={selectedClient.id}
                clientName={selectedClient.name}
                onArchiveUserAccess={onArchiveUserAccess}
                onLinkUserAccess={onLinkUserAccess}
                onLoadUserAccess={onLoadUserAccess}
                tenantUsers={tenantUsers}
                tone="compact"
              />
            ) : null}
            <ModalActions disabled={saving} label={submitLabel} onCancel={closeEditor} saving={saving} />
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
