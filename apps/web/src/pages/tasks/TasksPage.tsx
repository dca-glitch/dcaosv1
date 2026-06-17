import { type FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import type { ProjectSummary } from "../projects/ProjectsPage";

export type TaskSummary = {
  id: string;
  projectId: string;
  project: {
    id: string;
    name: string;
    client: {
      id: string;
      name: string;
    };
  };
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  recurringType: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TaskFormValues = {
  projectId: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
  recurringType: string;
};

type TasksPageProps = {
  tasks: TaskSummary[];
  projects: ProjectSummary[];
  canEdit: boolean;
  error: string | null;
  loading: boolean;
  onArchive: (taskId: string) => Promise<boolean>;
  onRestore: (taskId: string) => Promise<boolean>;
  onSave: (taskId: string | null, values: TaskFormValues) => Promise<boolean>;
};

const priorityOptions = ["LOW", "NORMAL", "HIGH"] as const;
const statusOptions = ["TODO", "IN_PROGRESS", "DONE"] as const;
const recurringOptions = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

const emptyForm = (projectId = ""): TaskFormValues => ({
  projectId,
  title: "",
  description: "",
  priority: "NORMAL",
  status: "TODO",
  dueDate: "",
  recurringType: "NONE"
});

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

export function TasksPage({ tasks, projects, canEdit, error, loading, onArchive, onRestore, onSave }: TasksPageProps) {
  const [filter, setFilter] = useState<"all" | "active" | "archived">("active");
  const [editorTaskId, setEditorTaskId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<TaskFormValues>(emptyForm());
  const [saving, setSaving] = useState(false);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (filter === "active") {
          return !task.isArchived;
        }

        if (filter === "archived") {
          return task.isArchived;
        }

        return true;
      }),
    [filter, tasks]
  );

  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);

  function openCreateModal() {
    const firstProjectId = projects.find((project) => !project.isArchived)?.id ?? projects[0]?.id ?? "";
    setEditorTaskId(null);
    setDraft(emptyForm(firstProjectId));
    setIsEditorOpen(true);
  }

  function openEditModal(task: TaskSummary) {
    setEditorTaskId(task.id);
    setDraft({
      projectId: task.projectId,
      title: task.title,
      description: task.description ?? "",
      priority: priorityOptions.includes(task.priority as (typeof priorityOptions)[number])
        ? task.priority
        : "NORMAL",
      status: statusOptions.includes(task.status as (typeof statusOptions)[number]) ? task.status : "TODO",
      dueDate: toDateInputValue(task.dueDate),
      recurringType: recurringOptions.includes(task.recurringType as (typeof recurringOptions)[number])
        ? task.recurringType
        : "NONE"
    });
    setIsEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const ok = await onSave(editorTaskId, draft);
      if (ok) {
        setEditorTaskId(null);
        setDraft(emptyForm(projects[0]?.id ?? ""));
        setIsEditorOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading tasks" />;
  }

  if (error) {
    return <ErrorState message={error} title="Tasks unavailable" />;
  }

  return (
    <section className="view-section" aria-labelledby="tasks-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">Delivery</p>
          <h1 id="tasks-title">Tasks</h1>
        </div>
        <div className="toolbar">
          <div className="filter-bar" role="group" aria-label="Tasks filter">
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
            <button className="primary-action" disabled={projects.length === 0} onClick={openCreateModal} type="button">
              Add Task
            </button>
          ) : null}
        </div>
      </div>

      {canEdit && projects.length === 0 ? (
        <EmptyState
          title="Add a project first"
          message="Tasks need a project to attach to. Create a project before adding tasks."
        />
      ) : null}

      {filteredTasks.length === 0 ? (
        <EmptyState message="No tasks match the current filter." title="No tasks" />
      ) : (
        <div className="entity-grid">
          {filteredTasks.map((task) => (
            <article className="entity-card" key={task.id}>
              <div className="entity-card-header">
                <div>
                  <span className={`entity-pill entity-pill-${task.isArchived ? "archived" : "active"}`}>
                    {task.isArchived ? "Archived" : "Active"}
                  </span>
                  <h2>{task.title}</h2>
                </div>
                <div className="card-actions">
                  {canEdit ? (
                    <button className="secondary-action" onClick={() => openEditModal(task)} type="button">
                      Edit
                    </button>
                  ) : null}
                  {canEdit && !task.isArchived ? (
                    <button className="secondary-action" onClick={() => void onArchive(task.id)} type="button">
                      Archive
                    </button>
                  ) : null}
                  {canEdit && filter === "archived" && task.isArchived ? (
                    <button className="secondary-action" onClick={() => void onRestore(task.id)} type="button">
                      Restore
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="entity-field-grid">
                <div>
                  <span>Project</span>
                  <strong>{task.project.name}</strong>
                </div>
                <div>
                  <span>Client</span>
                  <strong>{task.project.client.name}</strong>
                </div>
                <div>
                  <span>Priority</span>
                  <strong>{task.priority}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{task.status}</strong>
                </div>
                <div>
                  <span>Recurring</span>
                  <strong>{task.recurringType}</strong>
                </div>
                <div>
                  <span>Due date</span>
                  <strong>{formatDateLabel(task.dueDate)}</strong>
                </div>
                <div className="entity-span-2">
                  <span>Description</span>
                  <strong>{task.description || "Not set"}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isEditorOpen ? (
        <Modal
          onClose={() => {
            setEditorTaskId(null);
            setDraft(emptyForm(projects[0]?.id ?? ""));
            setIsEditorOpen(false);
          }}
          title={editorTaskId ? "Edit Task" : "Add Task"}
        >
          <form className="entity-form" onSubmit={handleSubmit}>
            <div className="field-grid">
              <label>
                Project
                <select
                  disabled={projects.length === 0}
                  onChange={(event) => setDraft((current) => ({ ...current, projectId: event.target.value }))}
                  required
                  value={draft.projectId}
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.client.name})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Title
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  required
                  value={draft.title}
                />
              </label>
              <label>
                Priority
                <select
                  onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}
                  value={draft.priority}
                >
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select
                  onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
                  value={draft.status}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Recurring
                <select
                  onChange={(event) => setDraft((current) => ({ ...current, recurringType: event.target.value }))}
                  value={draft.recurringType}
                >
                  {recurringOptions.map((recurringType) => (
                    <option key={recurringType} value={recurringType}>
                      {recurringType}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Due date
                <input
                  onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  type="date"
                  value={draft.dueDate}
                />
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
            <div className="modal-footer">
              <button
                className="secondary-action"
                disabled={saving}
                onClick={() => {
                  setEditorTaskId(null);
                  setDraft(emptyForm(projects[0]?.id ?? ""));
                  setIsEditorOpen(false);
                }}
                type="button"
              >
                Cancel
              </button>
              <button className="primary-action" disabled={saving || projects.length === 0} type="submit">
                {saving ? "Saving" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
