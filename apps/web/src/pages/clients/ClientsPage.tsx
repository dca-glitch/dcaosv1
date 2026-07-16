import { type FormEvent, useMemo, useState } from "react";
import { ClientAccessPanel } from "../../components/clients/ClientAccessPanel";
import { Modal } from "../../components/ui";
import {
  Button,
  EmptyState,
  ErrorState,
  FilterBar,
  Input,
  LoadingState,
  ModalActions,
  PageHeader,
  SectionPanel,
  Select,
  StatusBadge,
  Table,
  Textarea,
  useUrlFilterState,
} from "../../components/ui";
import {
  persistTableDensityPreference,
  readTableDensityPreference,
  type PersistedTableDensity
} from "../../lib/table-density";
import type { ProjectSummary } from "../projects/ProjectsPage";
import {
  buildClientArchiveConfirm,
  buildClientRestoreConfirm,
  type ArchiveConfirmCopy
} from "./archive-confirm-copy";
import { deriveClientHealth, formatClientHealthDetail } from "./client-health";

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
  operatingPackKey: string | null;
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
  operatingPackKey: "" | "PURIVA_OPERATING_PACK_V1";
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

const CLIENT_STATUS_FILTERS = ["all", "active", "archived"] as const;
type ClientStatusFilter = (typeof CLIENT_STATUS_FILTERS)[number];

const CLIENT_KIND_FILTERS = ["all", "AGENCY_CLIENT", "OWN_DOMAIN"] as const;
type ClientKindFilter = (typeof CLIENT_KIND_FILTERS)[number];

type PendingLifecycle =
  | { action: "archive" | "restore"; client: ClientSummary; copy: ArchiveConfirmCopy }
  | { action: "blocked"; client: ClientSummary; title: string; description: string };

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
  migrationStatus: "ACTIVE",
  operatingPackKey: ""
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
  const [filter, setFilter] = useUrlFilterState<ClientStatusFilter>({
    key: "filter",
    defaultValue: "active",
    allowed: CLIENT_STATUS_FILTERS
  });
  const [kindFilter, setKindFilter] = useUrlFilterState<ClientKindFilter>({
    key: "kind",
    defaultValue: "all",
    allowed: CLIENT_KIND_FILTERS
  });
  const [tableDensity, setTableDensity] = useState<PersistedTableDensity>(() => readTableDensityPreference());
  const setDensity = (next: PersistedTableDensity) => {
    setTableDensity(next);
    persistTableDensityPreference(next);
  };
  const [editorClientId, setEditorClientId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<ClientFormValues>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [pendingLifecycle, setPendingLifecycle] = useState<PendingLifecycle | null>(null);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);

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
      migrationStatus: client.migrationStatus,
      operatingPackKey:
        client.operatingPackKey === "PURIVA_OPERATING_PACK_V1" || client.operatingPackKey === "puriva"
          ? "PURIVA_OPERATING_PACK_V1"
          : ""
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

  function requestArchive(client: ClientSummary) {
    const copy = buildClientArchiveConfirm(client);
    if ("blocked" in copy) {
      setPendingLifecycle({
        action: "blocked",
        client,
        title: copy.title,
        description: copy.description
      });
      return;
    }
    setPendingLifecycle({ action: "archive", client, copy });
  }

  function requestRestore(client: ClientSummary) {
    setPendingLifecycle({
      action: "restore",
      client,
      copy: buildClientRestoreConfirm(client)
    });
  }

  async function confirmLifecycle() {
    if (!pendingLifecycle || pendingLifecycle.action === "blocked") {
      setPendingLifecycle(null);
      return;
    }
    setLifecycleBusy(true);
    try {
      const ok =
        pendingLifecycle.action === "archive"
          ? await onArchive(pendingLifecycle.client.id)
          : await onRestore(pendingLifecycle.client.id);
      if (ok) {
        setPendingLifecycle(null);
      }
    } finally {
      setLifecycleBusy(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading clients" />;
  }

  if (error) {
    return <ErrorState message={error} title="Clients unavailable" />;
  }

  return (
    <section className="view-section" aria-labelledby="clients-title" data-density={tableDensity}>
      <PageHeader
        eyebrow="CRM"
        title="Clients"
        titleId="clients-title"
        description="Client records, contacts, and delivery links."
        filters={
          <div className="clients-toolbar-filters">
            <FilterBar
              ariaLabel="Clients kind filter"
              onChange={(value) => setKindFilter(value as ClientKindFilter)}
              options={[
                { value: "all", label: "All kinds" },
                { value: "AGENCY_CLIENT", label: "Agency" },
                { value: "OWN_DOMAIN", label: "Own domain" }
              ]}
              value={kindFilter}
            />
            <FilterBar
              ariaLabel="Clients filter"
              onChange={(value) => setFilter(value as ClientStatusFilter)}
              options={[
                { value: "active", label: "Active" },
                { value: "archived", label: "Archived" },
                { value: "all", label: "All" }
              ]}
              value={filter}
            />
            <div className="filter-bar" role="group" aria-label="Table density">
              <Button
                aria-pressed={tableDensity === "comfortable"}
                className={tableDensity === "comfortable" ? "secondary-action filter-chip is-active" : "secondary-action filter-chip"}
                onClick={() => setDensity("comfortable")}
                type="button"
                variant="secondary"
              >
                Comfortable
              </Button>
              <Button
                aria-pressed={tableDensity === "compact"}
                className={tableDensity === "compact" ? "secondary-action filter-chip is-active" : "secondary-action filter-chip"}
                onClick={() => setDensity("compact")}
                type="button"
                variant="secondary"
              >
                Compact
              </Button>
            </div>
          </div>
        }
        actions={
          canEdit ? (
            <Button onClick={openCreateModal} type="button" variant="primary">
              Add client
            </Button>
          ) : null
        }
      />

      {filteredClients.length === 0 ? (
        <EmptyState
          message={
            clients.length === 0
              ? "Add your first client to start delivery, approvals, and reporting."
              : "No clients match the current filter."
          }
          title={clients.length === 0 ? "No clients yet" : "No clients"}
          variant="inline"
        />
      ) : (
        <SectionPanel title="Client records" tone="compact">
          <div className="table-wrap table-scroll">
            <Table
              aria-label="Clients"
              density={tableDensity}
              headers={[
                { label: "Client", align: "left" },
                { label: "Kind", align: "left" },
                { label: "Pack", align: "left" },
                { label: "Health", align: "left" },
                { label: "Projects", align: "right" },
                { label: "Contact", align: "left" },
                { label: "Action", align: "right" }
              ]}
              rows={filteredClients.map((client) => {
                const health = deriveClientHealth(client, projects);
                return {
                  key: client.id,
                  cells: [
                    <div key={`${client.id}-name`}>
                      <strong>{client.name}</strong>
                      <div className="muted-text">
                        <StatusBadge status={client.isArchived ? "archived" : "active"} />
                      </div>
                      <div className="muted-text">{client.website || "No website"}</div>
                    </div>,
                    <StatusBadge
                      key={`${client.id}-kind`}
                      status={client.clientKind === "OWN_DOMAIN" ? "own-domain" : "agency-client"}
                    />,
                    <span key={`${client.id}-pack`} className="muted-text">
                      {client.operatingPackKey ?? "Unbound"}
                    </span>,
                    <div key={`${client.id}-health`}>
                      <StatusBadge status={health.status} />
                      <div className="muted-text">{formatClientHealthDetail(health)}</div>
                    </div>,
                    <span key={`${client.id}-projects`}>{client.projectCount}</span>,
                    <div key={`${client.id}-contact`}>
                      <div>{client.contactPerson || "No contact"}</div>
                      <div className="muted-text">{client.email || "No email"}</div>
                      <div className="muted-text">{client.country || "No country"}</div>
                    </div>,
                    <div className="dense-actions" key={`${client.id}-actions`}>
                      <Button size="sm" variant="secondary" onClick={() => onOpenHub(client)} type="button">
                        Open hub
                      </Button>
                      {canEdit ? (
                        <Button size="sm" variant="secondary" onClick={() => void openEditModal(client)} type="button">
                          Open
                        </Button>
                      ) : null}
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
                                  onClick={() => requestArchive(client)}
                                  title={
                                    client.projectCount > 0
                                      ? "Archive blocked while active projects exist."
                                      : undefined
                                  }
                                  type="button"
                                >
                                  Archive
                                </Button>
                              ) : null}
                              {client.isArchived ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => requestRestore(client)}
                                  type="button"
                                >
                                  Restore
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </details>
                      ) : null}
                    </div>
                  ]
                };
              })}
            />
          </div>
        </SectionPanel>
      )}

      {pendingLifecycle ? (
        <Modal isOpen
          eyebrow={pendingLifecycle.action === "blocked" ? "Blocked" : "Confirm"}
          onClose={() => {
            if (!lifecycleBusy) {
              setPendingLifecycle(null);
            }
          }}
          size="sm"
          title={
            pendingLifecycle.action === "blocked"
              ? pendingLifecycle.title
              : pendingLifecycle.copy.title
          }
          footer={
            pendingLifecycle.action === "blocked" ? (
              <Button
                onClick={() => setPendingLifecycle(null)}
                type="button"
                variant="secondary"
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  disabled={lifecycleBusy}
                  onClick={() => setPendingLifecycle(null)}
                  type="button"
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  disabled={lifecycleBusy}
                  onClick={() => void confirmLifecycle()}
                  type="button"
                  variant={pendingLifecycle.copy.danger ? "destructive" : "primary"}
                >
                  {lifecycleBusy ? "Working…" : pendingLifecycle.copy.confirmLabel}
                </Button>
              </>
            )
          }
        >
          <p>
            {pendingLifecycle.action === "blocked"
              ? pendingLifecycle.description
              : pendingLifecycle.copy.description}
          </p>
        </Modal>
      ) : null}

      {isEditorOpen ? (
        <Modal isOpen
          eyebrow={editorClientId ? "Edit" : "Create"}
          onClose={closeEditor}
          size="md"
          title={editorClientId ? "Edit Client" : "Add Client"}
        >
          <form className="entity-form" onSubmit={handleSubmit}>
            <p className="muted-text">Used by admin team to organize work and billing. Archived clients are hidden from active work but can be restored.</p>
            <ModalActions disabled={saving} label={submitLabel} onCancel={closeEditor} saving={saving} />
            <div className="field-grid">
              <Input
                fullWidth
                helperText="Used by admin team to organize work and billing."
                label="Client name - Required"
                maxLength={255}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Business or person this work is for"
                required
                value={draft.name}
              />
              <Input
                fullWidth
                helperText="Used for day-to-day approvals and communication."
                label="Contact person - Optional"
                maxLength={255}
                onChange={(event) => setDraft((current) => ({ ...current, contactPerson: event.target.value }))}
                placeholder="Main person for approvals or communication"
                value={draft.contactPerson}
              />
              <Input
                fullWidth
                helperText="Shown only in admin records."
                label="Email - Optional"
                maxLength={320}
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                placeholder="Client billing or primary contact email"
                type="email"
                value={draft.email}
              />
              <Input
                fullWidth
                helperText="Canonical domain for this client record."
                label="Website - Optional"
                maxLength={500}
                onChange={(event) => setDraft((current) => ({ ...current, website: event.target.value }))}
                placeholder="https://example.com"
                type="url"
                value={draft.website}
              />
              <Select
                fullWidth
                helperText="Explicit Client Operating Pack binding. Unbound clients do not receive Puriva rules."
                label="Operating pack"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    operatingPackKey: event.target.value as ClientFormValues["operatingPackKey"]
                  }))
                }
                options={[
                  { value: "", label: "Unbound (no pack)" },
                  { value: "PURIVA_OPERATING_PACK_V1", label: "Puriva Operating Pack v1" }
                ]}
                value={draft.operatingPackKey}
              />
              <Select
                fullWidth
                helperText="Own domain clients are separate legal entities, not billed in DCA LLC finance."
                label="Client kind - Required"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    clientKind: event.target.value as ClientFormValues["clientKind"]
                  }))
                }
                options={[
                  { value: "AGENCY_CLIENT", label: "Agency client" },
                  { value: "OWN_DOMAIN", label: "Own domain" }
                ]}
                required
                value={draft.clientKind}
              />
              <Input
                fullWidth
                label="Legal entity name - Optional"
                maxLength={255}
                onChange={(event) => setDraft((current) => ({ ...current, legalEntityName: event.target.value }))}
                placeholder="Registered company name"
                value={draft.legalEntityName}
              />
              <Input
                fullWidth
                label="Account group - Optional"
                maxLength={255}
                onChange={(event) => setDraft((current) => ({ ...current, accountGroupName: event.target.value }))}
                placeholder="Group label for related domains"
                value={draft.accountGroupName}
              />
              <Select
                fullWidth
                label="Migration status"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    migrationStatus: event.target.value as ClientFormValues["migrationStatus"]
                  }))
                }
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "PLANNED_LICENSEE_TENANT", label: "Planned licensee tenant" },
                  { value: "MIGRATED", label: "Migrated" }
                ]}
                value={draft.migrationStatus}
              />
              <Input
                fullWidth
                helperText="Shown only in admin records."
                label="Tax/VAT ID - Optional"
                maxLength={100}
                onChange={(event) => setDraft((current) => ({ ...current, taxId: event.target.value }))}
                placeholder="Client tax number if used for billing"
                value={draft.taxId}
              />
              <Textarea
                className="field-span-2"
                fullWidth
                helperText="Used by admin team for billing records."
                label="Billing address - Optional"
                maxLength={4000}
                onChange={(event) => setDraft((current) => ({ ...current, billingAddress: event.target.value }))}
                placeholder="Billing address used on invoices or contracts"
                rows={4}
                value={draft.billingAddress}
              />
              <Select
                fullWidth
                helperText="Used by admin team to organize work and billing."
                label="Country - Optional"
                onChange={(event) => setDraft((current) => ({ ...current, country: event.target.value }))}
                options={[
                  { value: "", label: "Country for billing or tax context" },
                  ...COUNTRY_OPTIONS.map((country) => ({ value: country, label: country }))
                ]}
                value={draft.country}
              />
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
