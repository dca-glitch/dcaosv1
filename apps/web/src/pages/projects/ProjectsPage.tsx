import { type FormEvent, useMemo, useState } from "react";
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
  WorkflowPageShell,
  useUrlFilterState,
} from "../../components/ui";
import { useEntityEditorHash } from "../../lib/use-entity-editor-hash";
import {
  persistTableDensityPreference,
  readTableDensityPreference,
  type PersistedTableDensity
} from "../../lib/table-density";
import {
  buildProjectArchiveConfirm,
  buildProjectRestoreConfirm,
  type ArchiveConfirmCopy
} from "../clients/archive-confirm-copy";
import type { ClientSummary } from "../clients/ClientsPage";
import type { TaskSummary } from "../tasks/TasksPage";
import "../ai-delivery/ai-delivery-workflow.css";

const PROJECT_FILTERS = ["all", "active", "archived"] as const;
type ProjectFilter = (typeof PROJECT_FILTERS)[number];

export type ProjectSummary = {
  id: string;
  clientId: string;
  client: {
    id: string;
    name: string;
  };
  name: string;
  description: string | null;
  startDate: string | null;
  dueDate: string | null;
  status: string;
  isArchived: boolean;
  taskCount: number;
  openTaskCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectFormValues = {
  clientId: string;
  name: string;
  description: string;
  startDate: string;
  dueDate: string;
  status: string;
};

type ProjectsPageProps = {
  projects: ProjectSummary[];
  clients: ClientSummary[];
  tasks: TaskSummary[];
  canEdit: boolean;
  error: string | null;
  loading: boolean;
  onArchive: (projectId: string) => Promise<boolean>;
  onRestore: (projectId: string) => Promise<boolean>;
  onSave: (projectId: string | null, values: ProjectFormValues) => Promise<boolean>;
};

const emptyForm = (clientId = ""): ProjectFormValues => ({
  clientId,
  name: "",
  description: "",
  startDate: "",
  dueDate: "",
  status: "Active"
});

const PROJECT_STATUS_OPTIONS = ["Active", "Paused", "Completed", "Archived"] as const;

type PendingLifecycle = {
  action: "archive" | "restore";
  project: ProjectSummary;
  copy: ArchiveConfirmCopy;
};

function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

function formatDateLabel(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export function ProjectsPage({
  projects,
  clients,
  tasks,
  canEdit,
  error,
  loading,
  onArchive,
  onRestore,
  onSave
}: ProjectsPageProps) {
  const [filter, setFilter] = useUrlFilterState<ProjectFilter>({
    key: "filter",
    defaultValue: "active",
    allowed: PROJECT_FILTERS
  });
  const [tableDensity, setTableDensity] = useState<PersistedTableDensity>(() => readTableDensityPreference());
  const setDensity = (next: PersistedTableDensity) => {
    setTableDensity(next);
    persistTableDensityPreference(next);
  };
  const [editorProjectId, setEditorProjectId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<ProjectFormValues>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [pendingLifecycle, setPendingLifecycle] = useState<PendingLifecycle | null>(null);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === editorProjectId) ?? null,
    [editorProjectId, projects]
  );
  const selectedProjectTasks = useMemo(
    () => tasks.filter((task) => task.projectId === selectedProject?.id),
    [selectedProject, tasks]
  );

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        if (filter === "active") {
          return !project.isArchived;
        }

        if (filter === "archived") {
          return project.isArchived;
        }

        return true;
      }),
    [filter, projects]
  );

  const submitLabel = editorProjectId ? "Update project" : "Create project";

  function closeEditorState() {
    setEditorProjectId(null);
    setDraft(emptyForm());
    setIsEditorOpen(false);
  }

  function applyProjectDraft(project: ProjectSummary) {
    setEditorProjectId(project.id);
    setDraft({
      clientId: project.clientId ?? "",
      name: project.name,
      description: project.description ?? "",
      startDate: toDateInputValue(project.startDate),
      dueDate: toDateInputValue(project.dueDate),
      status: project.status
    });
    setIsEditorOpen(true);
  }

  const { navigateEditor } = useEntityEditorHash({
    base: "projects",
    listRevision: projects,
    openCreateFromHash: () => {
      setEditorProjectId(null);
      setDraft(emptyForm());
      setIsEditorOpen(true);
    },
    openEditFromHash: (id) => {
      const project = projects.find((entry) => entry.id === id);
      if (!project) return false;
      applyProjectDraft(project);
      return true;
    },
    closeFromHash: closeEditorState
  });

  function closeEditor() {
    closeEditorState();
    navigateEditor({ kind: "hub" });
  }

  function openCreateModal() {
    setEditorProjectId(null);
    setDraft(emptyForm());
    setIsEditorOpen(true);
    navigateEditor({ kind: "new" });
  }

  function openEditModal(project: ProjectSummary) {
    applyProjectDraft(project);
    navigateEditor({ kind: "edit", id: project.id });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const ok = await onSave(editorProjectId, draft);
      if (ok) {
        closeEditor();
      }
    } finally {
      setSaving(false);
    }
  }

  function requestArchive(project: ProjectSummary) {
    setPendingLifecycle({
      action: "archive",
      project,
      copy: buildProjectArchiveConfirm(project)
    });
  }

  function requestRestore(project: ProjectSummary) {
    setPendingLifecycle({
      action: "restore",
      project,
      copy: buildProjectRestoreConfirm(project)
    });
  }

  async function confirmLifecycle() {
    if (!pendingLifecycle) {
      return;
    }
    setLifecycleBusy(true);
    try {
      const ok =
        pendingLifecycle.action === "archive"
          ? await onArchive(pendingLifecycle.project.id)
          : await onRestore(pendingLifecycle.project.id);
      if (ok) {
        setPendingLifecycle(null);
      }
    } finally {
      setLifecycleBusy(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading projects" />;
  }

  if (error) {
    return <ErrorState message={error} title="Projects unavailable" />;
  }

  return (
    <section className="view-section entity-editor-page" aria-labelledby="projects-title" data-density={tableDensity}>
      {isEditorOpen ? (
        <WorkflowPageShell
          backLabel="Back to Projects"
          eyebrow={editorProjectId ? "Edit" : "Create"}
          onClose={closeEditor}
          title={editorProjectId ? "Edit Project" : "Add Project"}
          titleId="projects-editor-title"
        >
          <form className="entity-form entity-editor-form" onSubmit={handleSubmit}>
            <p className="muted-text">
              Used by admin team to organize work and billing. Archived items are hidden from active work but can be
              restored.
            </p>
            <ModalActions disabled={saving} label={submitLabel} onCancel={closeEditor} saving={saving} />
            <div className="field-grid">
              <Input
                fullWidth
                helperText="Used by admin team to organize work and billing."
                label="Project name - Required"
                maxLength={255}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Website build, SEO retainer, monthly content, support"
                required
                value={draft.name}
              />
              <Select
                fullWidth
                helperText="Client can be added later if this is internal work."
                label="Client - Optional"
                onChange={(event) => setDraft((current) => ({ ...current, clientId: event.target.value }))}
                options={[
                  { value: "", label: "Client can be added later if this is internal work" },
                  ...clients.map((client) => ({ value: client.id, label: client.name }))
                ]}
                value={draft.clientId}
              />
              <Select
                fullWidth
                helperText="Used to show whether delivery is active, paused, completed, or archived."
                label="Project status - Required"
                onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
                options={PROJECT_STATUS_OPTIONS.map((status) => ({ value: status, label: status }))}
                value={draft.status}
              />
              <Textarea
                className="field-span-2"
                fullWidth
                helperText="Shown only in admin records."
                label="Description - Optional"
                maxLength={4000}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder="What this project covers, key scope, or delivery notes"
                rows={4}
                value={draft.description}
              />
              <Input
                fullWidth
                helperText="Use when the project has a defined start date."
                label="Start date - Optional"
                onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))}
                type="date"
                value={draft.startDate}
              />
              <Input
                fullWidth
                helperText="Use when delivery has a target completion date."
                label="Due date - Optional"
                onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                type="date"
                value={draft.dueDate}
              />
            </div>
            {selectedProject ? (
              <section className="field-span-2" aria-labelledby="project-tasks-title">
                <h3 id="project-tasks-title">Tasks for this project</h3>
                <p className="muted-text">Related tasks help the admin team track delivery progress for this project.</p>
                {selectedProjectTasks.length === 0 ? (
                  <p>No tasks for this project.</p>
                ) : (
                  <div>
                    {selectedProjectTasks.map((task) => (
                      <p key={task.id}>{task.title}</p>
                    ))}
                  </div>
                )}
              </section>
            ) : null}
            <ModalActions disabled={saving} label={submitLabel} onCancel={closeEditor} saving={saving} />
          </form>
        </WorkflowPageShell>
      ) : null}

      {!isEditorOpen ? (
      <>
      <PageHeader
        eyebrow="Delivery"
        title="Projects"
        titleId="projects-title"
        description="Organize delivery work by client. Related: Clients, AI Delivery, Tasks."
        actions={
          <>
            <FilterBar
              ariaLabel="Projects filter"
              onChange={(value) => setFilter(value as ProjectFilter)}
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
            {canEdit ? <Button onClick={openCreateModal}>Add project</Button> : null}
          </>
        }
      />

      <div className="quick-link-list projects-quick-links">
        <a className="subtle-action" href="#/clients">
          Clients
        </a>
        <a className="subtle-action" href="#/ai-delivery">
          AI Delivery
        </a>
        <a className="subtle-action" href="#/tasks">
          Tasks
        </a>
      </div>

      {filteredProjects.length === 0 ? (
        <EmptyState
          kind={projects.length === 0 ? "first-use" : "filtered"}
          message={
            projects.length === 0
              ? "Create a project to start tracking client work."
              : "No projects match the current filter."
          }
          title={projects.length === 0 ? "No projects yet" : "No projects"}
          variant="inline"
        />
      ) : (
        <SectionPanel title="Project delivery" tone="compact">
          <div className="table-wrap table-scroll">
            <Table
              aria-label="Projects"
              density={tableDensity}
              headers={[
                { label: "Project", align: "left" },
                { label: "Client", align: "left" },
                { label: "Status", align: "left" },
                { label: "Tasks", align: "right" },
                { label: "Due", align: "right" },
                { label: "Action", align: "right" }
              ]}
              rows={filteredProjects.map((project) => ({
                key: project.id,
                cells: [
                  <div key={`${project.id}-name`}>
                    <strong>{project.name}</strong>
                    <div className="muted-text">Start: {formatDateLabel(project.startDate)}</div>
                  </div>,
                  project.client?.name ?? "No client",
                  <StatusBadge
                    key={`${project.id}-status`}
                    status={project.isArchived ? "ARCHIVED" : project.status}
                  />,
                  <span key={`${project.id}-tasks`}>
                    {project.openTaskCount} / {project.taskCount}
                  </span>,
                  formatDateLabel(project.dueDate),
                  <div className="dense-actions" key={`${project.id}-actions`}>
                    {canEdit ? (
                      <Button onClick={() => openEditModal(project)} size="sm" variant="secondary">
                        Open
                      </Button>
                    ) : null}
                    {canEdit ? (
                      <details className="row-action-menu">
                        <summary>More</summary>
                        <div className="row-action-menu-panel">
                          <div className="row-action-menu-group">
                            <span className="row-action-menu-label">Project</span>
                            {!project.isArchived ? (
                              <Button
                                onClick={() => requestArchive(project)}
                                size="sm"
                                variant="secondary"
                              >
                                Archive
                              </Button>
                            ) : null}
                            {project.isArchived ? (
                              <Button
                                onClick={() => requestRestore(project)}
                                size="sm"
                                variant="secondary"
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
              }))}
            />
          </div>
        </SectionPanel>
      )}
      </>
      ) : null}

      {pendingLifecycle ? (
        <Modal isOpen
          eyebrow="Review action"
          onClose={() => {
            if (!lifecycleBusy) {
              setPendingLifecycle(null);
            }
          }}
          size="sm"
          title={pendingLifecycle.copy.title}
          footer={
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
          }
        >
          <p>{pendingLifecycle.copy.description}</p>
        </Modal>
      ) : null}
    </section>
  );
}
