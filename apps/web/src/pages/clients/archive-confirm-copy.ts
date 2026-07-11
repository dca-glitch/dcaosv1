/**
 * Explicit archive/restore confirmation copy for clients and projects.
 * Preserves existing user-facing action labels (Archive / Restore).
 */

export type ArchiveConfirmCopy = {
  title: string;
  description: string;
  confirmLabel: string;
  danger: boolean;
};

export function buildClientArchiveConfirm(client: {
  name: string;
  projectCount: number;
}): ArchiveConfirmCopy | { blocked: true; title: string; description: string } {
  if (client.projectCount > 0) {
    return {
      blocked: true as const,
      title: "Archive blocked",
      description: `Archive blocked while active projects exist. Move or archive projects for ${client.name} before archiving this client.`
    };
  }

  return {
    title: `Archive ${client.name}?`,
    description:
      "This hides the client from active work. Publication targets, credentials, and catalog edits become read-only until restore. The client can be restored later from the Archived filter.",
    confirmLabel: "Archive",
    danger: true
  };
}

export function buildClientRestoreConfirm(client: { name: string }): ArchiveConfirmCopy {
  return {
    title: `Restore ${client.name}?`,
    description:
      "This returns the client to the active clients list and re-enables hub edits for publication targets, credentials, and catalog when you have edit access.",
    confirmLabel: "Restore",
    danger: false
  };
}

export function buildProjectArchiveConfirm(project: {
  name: string;
  openTaskCount: number;
  taskCount: number;
}): ArchiveConfirmCopy {
  const taskNote =
    project.taskCount > 0
      ? ` Related tasks stay linked (${project.openTaskCount} open of ${project.taskCount} total) but the project is hidden from active delivery lists.`
      : " The project is hidden from active delivery lists.";

  return {
    title: `Archive ${project.name}?`,
    description: `Archiving removes this project from active work.${taskNote} You can restore it later from the Archived filter.`,
    confirmLabel: "Archive",
    danger: true
  };
}

export function buildProjectRestoreConfirm(project: {
  name: string;
  openTaskCount: number;
  taskCount: number;
}): ArchiveConfirmCopy {
  const taskNote =
    project.taskCount > 0
      ? ` Linked tasks remain available (${project.openTaskCount} open of ${project.taskCount} total).`
      : "";

  return {
    title: `Restore ${project.name}?`,
    description: `This returns the project to the active projects list.${taskNote}`,
    confirmLabel: "Restore",
    danger: false
  };
}
