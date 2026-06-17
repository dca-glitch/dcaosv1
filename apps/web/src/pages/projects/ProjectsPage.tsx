import { type FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
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

  function openCreateModal() {
    const firstClientId = clients.find((client) => !client.isArchived)?.id ?? clients[0]?.id ?? "";
    setEditorProjectId(null);
    setDraft(emptyForm(firstClientId));
    setIsEditorOpen(true);
  }

  function openEditModal(project: ProjectSummary) {
    setEditorProjectId(project.id);
    setDraft({
      clientId: project.clientId,
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
        setEditorProjectId(null);
        setDraft(emptyForm(clients[0]?.id ?? ""));
        setIsEditorOpen(false);
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
      <div className="section-header">
        <div>
          <p className="eyebrow">Delivery</p>
          <h1 id="projects-title">Projects</h1>
        </div>
        <div className="toolbar">
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
            <button className="primary-action" disabled={clients.length === 0} onClick={openCreateModal} type="button">
              Add Project
            </button>
          ) : null}
        </div>
      </div>

      {canEdit && clients.length === 0 ? (
        <EmptyState
          title="Add a client first"
          message="Projects need a client to attach to. Create a client before adding projects."
        />
      ) : null}

      {filteredProjects.length === 0 ? (
        <EmptyState message="No projects match the current filter." title="No projects" />
      ) : (
        <div className="entity-grid">
          {filteredProjects.map((project) => (
            <article className="entity-card" key={project.id}>
              <div className="entity-card-header">
                <div>
                  <span className={`entity-pill entity-pill-${project.isArchived ? "archived" : "active"}`}>
                    {project.isArchived ? "Archived" : "Active"}
                  </span>
                  <h2>{project.name}</h2>
                </div>
                <div className="card-actions">
                  {canEdit ? (
                    <button className="secondary-action" onClick={() => openEditModal(project)} type="button">
                      Edit
                    </button>
                  ) : null}
                  {canEdit && !project.isArchived ? (
                    <button className="secondary-action" onClick={() => void onArchive(project.id)} type="button">
                      Archive
                    </button>
                  ) : null}
                  {canEdit && project.isArchived ? (
                    <button className="secondary-action" onClick={() => void onRestore(project.id)} type="button">
                      Restore
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="entity-field-grid">
                <div>
                  <span>Client</span>
                  <strong>{project.client.name}</strong>
                </div>
                <div>
                  <span>Tasks</span>
                  <strong>{project.taskCount}</strong>
                </div>
                <div>
                  <span>Open tasks</span>
                  <strong>{project.openTaskCount}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{project.status}</strong>
                </div>
                <div>
                  <span>Start date</span>
                  <strong>{formatDateLabel(project.startDate)}</strong>
                </div>
                <div>
                  <span>Due date</span>
                  <strong>{formatDateLabel(project.dueDate)}</strong>
                </div>
                <div className="entity-span-2">
                  <span>Description</span>
                  <strong>{project.description || "Not set"}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isEditorOpen ? (
        <Modal
          onClose={() => {
            setEditorProjectId(null);
            setDraft(emptyForm(clients[0]?.id ?? ""));
            setIsEditorOpen(false);
          }}
          title={editorProjectId ? "Edit Project" : "Add Project"}
        >
          <form className="entity-form" onSubmit={handleSubmit}>
            <div className="field-grid">
              <label>
                Client
                <select
                  disabled={clients.length === 0}
                  onChange={(event) => setDraft((current) => ({ ...current, clientId: event.target.value }))}
                  required
                  value={draft.clientId}
                >
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>
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
                Start date
                <input
                  onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))}
                  type="date"
                  value={draft.startDate}
                />
              </label>
              <label>
                Due date
                <input
                  onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  type="date"
                  value={draft.dueDate}
                />
              </label>
              <label>
                Status
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
            {selectedProject ? (
              <section className="field-span-2" aria-labelledby="project-tasks-title">
                <h3 id="project-tasks-title">Tasks for this project</h3>
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
            <div className="modal-footer">
              <button
                className="secondary-action"
                disabled={saving}
                onClick={() => {
                  setEditorProjectId(null);
                  setDraft(emptyForm(clients[0]?.id ?? ""));
                  setIsEditorOpen(false);
                }}
                type="button"
              >
                Cancel
              </button>
              <button className="primary-action" disabled={saving || clients.length === 0} type="submit">
                {saving ? "Saving" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
