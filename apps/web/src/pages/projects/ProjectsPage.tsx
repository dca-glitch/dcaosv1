import { type FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { PageHeader, StatusBadge } from "../../components/ui";
import { Modal } from "../../components/Modal";
import type { ClientSummary } from "../clients/ClientsPage";
import type { TaskSummary } from "../tasks/TasksPage";

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
  const [filter, setFilter] = useState<"all" | "active" | "archived">("active");
  const [editorProjectId, setEditorProjectId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<ProjectFormValues>(emptyForm());
  const [saving, setSaving] = useState(false);
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

  function closeEditor() {
    setEditorProjectId(null);
    setDraft(emptyForm());
    setIsEditorOpen(false);
  }

  function openCreateModal() {
    closeEditor();
    setIsEditorOpen(true);
  }

  function openEditModal(project: ProjectSummary) {
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

  if (loading) {
    return <LoadingState label="Loading projects" />;
  }

  if (error) {
    return <ErrorState message={error} title="Projects unavailable" />;
  }

  return (
    <section className="view-section" aria-labelledby="projects-title">
      <PageHeader
        eyebrow="Delivery"
        title="Projects"
        titleId="projects-title"
        description="Organize delivery work by client. Related: Clients, AI Delivery, Tasks."
        actions={
          <>
            <div className="filter-bar" role="group" aria-label="Projects filter">
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
                Add Project
              </button>
            ) : null}
          </>
        }
      />

      <div className="quick-link-list projects-quick-links">
        <a className="subtle-action" href="#/clients">Clients</a>
        <a className="subtle-action" href="#/ai-delivery">AI Delivery</a>
        <a className="subtle-action" href="#/tasks">Tasks</a>
      </div>

      {filteredProjects.length === 0 ? (
        <EmptyState message="No projects match the current filter." title="No projects" />
      ) : (
        <div className="dense-list">
          {filteredProjects.map((project) => (
            <article className="entity-card dense-record" key={project.id}>
              <div className="dense-record-main">
                <div className="dense-title">
                  <div className="dense-kicker">
                    <StatusBadge status={project.isArchived ? "ARCHIVED" : project.status} />
                  </div>
                  <h2>{project.name}</h2>
                  <div className="dense-meta">
                    <span><strong>{project.client?.name ?? "No client"}</strong></span>
                    <span>{project.taskCount} task(s)</span>
                    <span>{project.openTaskCount} open</span>
                  </div>
                </div>

                <div className="dense-fields">
                  <div className="dense-field">
                    <span>Open tasks</span>
                    <strong>{project.openTaskCount} / {project.taskCount}</strong>
                  </div>
                  <div className="dense-field">
                    <span>Due</span>
                    <strong>{formatDateLabel(project.dueDate)}</strong>
                  </div>
                </div>

                <div className="dense-actions">
                  {canEdit ? <button className="secondary-action" onClick={() => openEditModal(project)} type="button">Open</button> : null}
                  {canEdit ? (
                    <details className="row-action-menu">
                      <summary>More</summary>
                      <div className="row-action-menu-panel">
                        <div className="row-action-menu-group">
                          <span className="row-action-menu-label">Project</span>
                          {!project.isArchived ? (
                            <button className="secondary-action" onClick={() => void onArchive(project.id)} type="button">
                              Archive
                            </button>
                          ) : null}
                          {project.isArchived ? (
                            <button className="secondary-action" onClick={() => void onRestore(project.id)} type="button">
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
                Start: {formatDateLabel(project.startDate)}. Description: {project.description || "Not set"}.
              </div>
            </article>
          ))}
        </div>
      )}

      {isEditorOpen ? (
        <Modal
          onClose={closeEditor}
          title={editorProjectId ? "Edit Project" : "Add Project"}
        >
          <form className="entity-form" onSubmit={handleSubmit}>
            <p className="muted-text">Used by admin team to organize work and billing. Archived items are hidden from active work but can be restored.</p>
            <ProjectModalActions disabled={saving} label={submitLabel} onCancel={closeEditor} saving={saving} />
            <div className="field-grid">
              <label>
                Project name - Required
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Website build, SEO retainer, monthly content, support"
                  required
                  value={draft.name}
                />
                <span className="muted-text">Used by admin team to organize work and billing.</span>
              </label>
              <label>
                Client - Optional
                <select
                  onChange={(event) => setDraft((current) => ({ ...current, clientId: event.target.value }))}
                  value={draft.clientId}
                >
                  <option value="">Client can be added later if this is internal work</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                <span className="muted-text">Client can be added later if this is internal work.</span>
              </label>
              <label>
                Project status - Required
                <select
                  onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
                  value={draft.status}
                >
                  {PROJECT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <span className="muted-text">Used to show whether delivery is active, paused, completed, or archived.</span>
              </label>
              <label className="field-span-2">
                Description - Optional
                <textarea
                  maxLength={4000}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="What this project covers, key scope, or delivery notes"
                  rows={4}
                  value={draft.description}
                />
                <span className="muted-text">Shown only in admin records.</span>
              </label>
              <label>
                Start date - Optional
                <input
                  onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))}
                  type="date"
                  value={draft.startDate}
                />
                <span className="muted-text">Use when the project has a defined start date.</span>
              </label>
              <label>
                Due date - Optional
                <input
                  onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  type="date"
                  value={draft.dueDate}
                />
                <span className="muted-text">Use when delivery has a target completion date.</span>
              </label>
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
            <ProjectModalActions disabled={saving} label={submitLabel} onCancel={closeEditor} saving={saving} />
          </form>
        </Modal>
      ) : null}
    </section>
  );
}

type ProjectModalActionsProps = {
  disabled: boolean;
  label: string;
  onCancel: () => void;
  saving: boolean;
};

function ProjectModalActions({ disabled, label, onCancel, saving }: ProjectModalActionsProps) {
  return (
    <div className="modal-footer">
      <button className="secondary-action" disabled={saving} onClick={onCancel} type="button">Cancel</button>
      <button className="primary-action" disabled={disabled} type="submit">{saving ? "Saving" : label}</button>
    </div>
  );
}
