import { type FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { SectionPanel } from "../../components/ui";
import { Modal } from "../../components/Modal";
import { StatusBadge } from "../../components/ui";
import type { ProjectSummary } from "../projects/ProjectsPage";

export type TaskSummary = {
  id: string;
  projectId: string | null;
  project: {
    id: string;
    name: string;
    client: {
      id: string;
      name: string;
    };
  } | null;
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

const statusOptions = ["TODO", "IN_PROGRESS", "DONE"] as const;
const recurringOptions = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

const emptyForm = (projectId = ""): TaskFormValues => ({
  projectId,
  title: "",
  description: "",
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

function formatStatusLabel(status: string, isArchived: boolean): string {
  if (isArchived) {
    return "Archived";
  }

  switch (status) {
    case "TODO":
      return "To Do";
    case "IN_PROGRESS":
      return "In Progress";
    case "DONE":
      return "Done";
    default:
      return status;
  }
}

function formatRecurringLabel(recurringType: string): string {
  switch (recurringType) {
    case "NONE":
      return "None";
    case "DAILY":
      return "Daily";
    case "WEEKLY":
      return "Weekly";
    case "MONTHLY":
      return "Monthly";
    case "YEARLY":
      return "Yearly";
    default:
      return recurringType;
  }
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

  const submitLabel = editorTaskId ? "Update task" : "Create task";

  function closeEditor() {
    setEditorTaskId(null);
    setDraft(emptyForm(""));
    setIsEditorOpen(false);
  }

  function openCreateModal() {
    closeEditor();
    setIsEditorOpen(true);
  }

  function openEditModal(task: TaskSummary) {
    setEditorTaskId(task.id);
    setDraft({
      projectId: task.projectId ?? "",
      title: task.title,
      description: task.description ?? "",
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
        closeEditor();
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
            <button className="primary-action" onClick={openCreateModal} type="button">
              Add Task
            </button>
          ) : null}
        </div>
      </div>

      <SectionPanel
        tone="compact"
        title="Delivery cross-links"
        description="Tasks stay linked to projects and clients. Filter chips match Projects and Clients list behavior."
      >
        <div className="quick-link-list">
          <a href="#/projects">Open Projects</a>
          <a href="#/clients">Open Clients</a>
          <a href="#/ai-delivery">Open AI Delivery</a>
        </div>
      </SectionPanel>

      {filteredTasks.length === 0 ? (
        <EmptyState message="No tasks match the current filter." title="No tasks" />
      ) : (
        <div className="dense-list">
          {filteredTasks.map((task) => (
            <article className="entity-card dense-record" key={task.id}>
              <div className="dense-record-main">
                <div className="dense-title">
                  <div className="dense-kicker">
                    <StatusBadge status={formatStatusLabel(task.status, task.isArchived)} />
                  </div>
                  <h2>{task.title}</h2>
                  <div className="dense-meta">
                    <span><strong>{task.project?.name ?? "No project"}</strong></span>
                    <span>{task.project?.client?.name ?? "No client"}</span>
                    <span>{formatRecurringLabel(task.recurringType)}</span>
                  </div>
                </div>

                <div className="dense-fields">
                  <div className="dense-field">
                    <span>Project</span>
                    <strong>{task.project?.name ?? "No project"}</strong>
                  </div>
                  <div className="dense-field">
                    <span>Client</span>
                    <strong>{task.project?.client?.name ?? "No client"}</strong>
                  </div>
                  <div className="dense-field">
                    <span>Recurring</span>
                    <strong>{formatRecurringLabel(task.recurringType)}</strong>
                  </div>
                  <div className="dense-field">
                    <span>Due</span>
                    <strong>{formatDateLabel(task.dueDate)}</strong>
                  </div>
                </div>

                <div className="dense-actions">
                  {canEdit ? <button className="primary-action" onClick={() => openEditModal(task)} type="button">Open</button> : null}
                  {canEdit ? (
                    <details className="row-action-menu">
                      <summary>More</summary>
                      <div className="row-action-menu-panel">
                        <div className="row-action-menu-group">
                          <span className="row-action-menu-label">Task</span>
                          {!task.isArchived ? (
                            <button className="secondary-action" onClick={() => void onArchive(task.id)} type="button">
                              Archive
                            </button>
                          ) : null}
                          {filter === "archived" && task.isArchived ? (
                            <button className="secondary-action" onClick={() => void onRestore(task.id)} type="button">
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
                Description: {task.description || "Not set"}.
              </div>
            </article>
          ))}
        </div>
      )}

      {isEditorOpen ? (
        <Modal
          onClose={closeEditor}
          title={editorTaskId ? "Edit Task" : "Add Task"}
        >
          <form className="entity-form" onSubmit={handleSubmit}>
            <p className="muted-text">Used by admin team to organize work and delivery. Archived items are hidden from active work but can be restored.</p>
            <TaskModalActions disabled={saving} label={submitLabel} onCancel={closeEditor} saving={saving} />
            <div className="field-grid">
              <label>
                Task name - Required
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Short action the team needs to complete"
                  required
                  value={draft.title}
                />
                <span className="muted-text">Used by admin team to track the work that needs to be completed.</span>
              </label>
              <label>
                Project - Optional
                <select
                  onChange={(event) => setDraft((current) => ({ ...current, projectId: event.target.value }))}
                  value={draft.projectId}
                >
                  <option value="">Tasks can exist without a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.client?.name ?? "No client"})
                    </option>
                  ))}
                </select>
                <span className="muted-text">Tasks can exist without a project.</span>
              </label>
              <label>
                Due date - Required
                <input
                  onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  required
                  type="date"
                  value={draft.dueDate}
                />
                <span className="muted-text">When this task should be completed.</span>
              </label>
              <label>
                Recurring - Optional
                <select
                  onChange={(event) => setDraft((current) => ({ ...current, recurringType: event.target.value }))}
                  value={draft.recurringType}
                >
                  {recurringOptions.map((recurringType) => (
                    <option key={recurringType} value={recurringType}>
                      {formatRecurringLabel(recurringType)}
                    </option>
                  ))}
                </select>
                <span className="muted-text">Use only for work that repeats on a schedule.</span>
              </label>
              <label>
                Status - Required
                <select
                  onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
                  value={draft.status}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {formatStatusLabel(status, false)}
                    </option>
                  ))}
                </select>
                <span className="muted-text">Tracks delivery progress without changing archive rules.</span>
              </label>
              <label className="field-span-2">
                Description - Optional
                <textarea
                  maxLength={4000}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Context, handoff details, or completion notes"
                  rows={4}
                  value={draft.description}
                />
                <span className="muted-text">Shown only in admin records.</span>
              </label>
            </div>
            <TaskModalActions disabled={saving} label={submitLabel} onCancel={closeEditor} saving={saving} />
          </form>
        </Modal>
      ) : null}
    </section>
  );
}

type TaskModalActionsProps = {
  disabled: boolean;
  label: string;
  onCancel: () => void;
  saving: boolean;
};

function TaskModalActions({ disabled, label, onCancel, saving }: TaskModalActionsProps) {
  return (
    <div className="modal-footer">
      <button className="secondary-action" disabled={saving} onClick={onCancel} type="button">Cancel</button>
      <button className="primary-action" disabled={disabled} type="submit">{saving ? "Saving" : label}</button>
    </div>
  );
}
