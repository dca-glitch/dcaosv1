import { type FormEvent, useMemo, useState } from "react";
import { Modal } from "../../components/Modal";
import { Alert, Button, Input, ModalActions, PageHeader, Select, Spinner, StatusBadge, Table, Textarea } from "../../components/ui";
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
    return (
      <div className="state-panel loading-state-panel" role="status">
        <Spinner size="sm" />
        Loading tasks
      </div>
    );
  }

  if (error) {
    return <Alert message={error} title="Tasks unavailable" variant="danger" />;
  }

  return (
    <section className="view-section" aria-labelledby="tasks-title" data-density="compact">
      <PageHeader
        eyebrow="Delivery"
        title="Tasks"
        titleId="tasks-title"
        description="Delivery tasks linked to projects and clients."
        actions={
          <>
            <div className="filter-bar" role="group" aria-label="Tasks filter">
              {(["active", "archived", "all"] as const).map((value) => (
                <Button
                  aria-pressed={filter === value}
                  className={filter === value ? "secondary-action filter-chip is-active" : "secondary-action filter-chip"}
                  key={value}
                  onClick={() => setFilter(value)}
                  type="button"
                  variant="secondary"
                >
                  {value[0].toUpperCase() + value.slice(1)}
                </Button>
              ))}
            </div>
            {canEdit ? (
              <Button onClick={openCreateModal} type="button">
                Add Task
              </Button>
            ) : null}
          </>
        }
      />

      <div className="quick-link-list tasks-quick-links">
        <a className="subtle-action" href="#/projects">Projects</a>
        <a className="subtle-action" href="#/clients">Clients</a>
        <a className="subtle-action" href="#/ai-delivery">AI Delivery</a>
      </div>

      {filteredTasks.length === 0 ? (
        <p className="inline-empty muted-text">No tasks match the current filter.</p>
      ) : (
        <div className="table-wrap finance-table-wrap" aria-label="Tasks">
          <Table
            className="finance-table tasks-table"
            headers={[
              { label: "Task", align: "left" },
              { label: "Project", align: "left" },
              { label: "Client", align: "left" },
              { label: "Status", align: "left" },
              { label: "Recurring", align: "left" },
              { label: "Due", align: "left" },
              { label: "Actions", align: "right" }
            ]}
            rows={filteredTasks.map((task) => ({
              key: task.id,
              cells: [
                <div key={`${task.id}-title`}>
                  <strong>{task.title}</strong>
                  <div className="muted-text">{task.description || "No description"}</div>
                </div>,
                task.project?.name ?? "No project",
                task.project?.client?.name ?? "No client",
                <StatusBadge key={`${task.id}-status`} status={formatStatusLabel(task.status, task.isArchived)} />,
                formatRecurringLabel(task.recurringType),
                formatDateLabel(task.dueDate),
                <div className="finance-row-actions" key={`${task.id}-actions`}>
                  {canEdit ? (
                    <Button onClick={() => openEditModal(task)} size="sm" variant="secondary">
                      Open
                    </Button>
                  ) : null}
                  {canEdit ? (
                    <details className="row-action-menu">
                      <summary>More</summary>
                      <div className="row-action-menu-panel">
                        <div className="row-action-menu-group">
                          <span className="row-action-menu-label">Task</span>
                          {!task.isArchived ? (
                            <Button onClick={() => void onArchive(task.id)} size="sm" variant="secondary">
                              Archive
                            </Button>
                          ) : null}
                          {filter === "archived" && task.isArchived ? (
                            <Button onClick={() => void onRestore(task.id)} size="sm" variant="secondary">
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
      )}

      {isEditorOpen ? (
        <Modal
          eyebrow={editorTaskId ? "Edit" : "Create"}
          onClose={closeEditor}
          size="md"
          title={editorTaskId ? "Edit Task" : "Add Task"}
        >
          <form className="entity-form" onSubmit={handleSubmit}>
            <p className="muted-text">Used by admin team to organize work and delivery. Archived items are hidden from active work but can be restored.</p>
            <ModalActions disabled={saving} label={submitLabel} onCancel={closeEditor} saving={saving} />
            <div className="field-grid">
              <Input
                fullWidth
                helperText="Used by admin team to track the work that needs to be completed."
                label="Task name - Required"
                maxLength={255}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Short action the team needs to complete"
                required
                value={draft.title}
              />
              <Select
                fullWidth
                helperText="Tasks can exist without a project."
                label="Project - Optional"
                onChange={(event) => setDraft((current) => ({ ...current, projectId: event.target.value }))}
                options={[
                  { value: "", label: "Tasks can exist without a project" },
                  ...projects.map((project) => ({
                    value: project.id,
                    label: `${project.name} (${project.client?.name ?? "No client"})`
                  }))
                ]}
                value={draft.projectId}
              />
              <Input
                fullWidth
                helperText="When this task should be completed."
                label="Due date - Required"
                onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                required
                type="date"
                value={draft.dueDate}
              />
              <Select
                fullWidth
                helperText="Use only for work that repeats on a schedule."
                label="Recurring - Optional"
                onChange={(event) => setDraft((current) => ({ ...current, recurringType: event.target.value }))}
                options={recurringOptions.map((recurringType) => ({
                  value: recurringType,
                  label: formatRecurringLabel(recurringType)
                }))}
                value={draft.recurringType}
              />
              <Select
                fullWidth
                helperText="Tracks delivery progress without changing archive rules."
                label="Status - Required"
                onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
                options={statusOptions.map((status) => ({
                  value: status,
                  label: formatStatusLabel(status, false)
                }))}
                value={draft.status}
              />
              <Textarea
                className="field-span-2"
                fullWidth
                helperText="Shown only in admin records."
                label="Description - Optional"
                maxLength={4000}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder="Context, handoff details, or completion notes"
                rows={4}
                value={draft.description}
              />
            </div>
            <ModalActions disabled={saving} label={submitLabel} onCancel={closeEditor} saving={saving} />
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
