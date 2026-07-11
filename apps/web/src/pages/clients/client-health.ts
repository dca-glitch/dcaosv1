/**
 * Derive client-list health from fields already on the client + related projects.
 * Does not invent deliverable status — only project/task counts and due dates.
 */

export type ClientHealthInput = {
  id: string;
  isArchived: boolean;
  projectCount: number;
};

export type ProjectHealthInput = {
  clientId: string;
  isArchived: boolean;
  status: string;
  dueDate: string | null;
  openTaskCount: number;
};

/** StatusBadge-friendly keys already understood by the status map / label formatter. */
export type ClientHealthStatus = "archived" | "overdue" | "active" | "idle";

export type ClientHealthSummary = {
  status: ClientHealthStatus;
  activeProjectCount: number;
  openTaskCount: number;
  overdueProjectCount: number;
};

function isCompletedStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase().replace(/[\s_]+/g, "-");
  return normalized === "completed" || normalized === "done" || normalized === "archived";
}

function isOverdueProject(project: ProjectHealthInput, now: Date): boolean {
  if (project.isArchived || isCompletedStatus(project.status) || !project.dueDate) {
    return false;
  }
  const due = new Date(project.dueDate);
  if (Number.isNaN(due.getTime())) {
    return false;
  }
  return due.getTime() < now.getTime();
}

export function deriveClientHealth(
  client: ClientHealthInput,
  projects: ProjectHealthInput[],
  now: Date = new Date()
): ClientHealthSummary {
  if (client.isArchived) {
    return {
      status: "archived",
      activeProjectCount: 0,
      openTaskCount: 0,
      overdueProjectCount: 0
    };
  }

  const related = projects.filter((project) => project.clientId === client.id && !project.isArchived);
  const activeRelated = related.filter((project) => !isCompletedStatus(project.status));
  const activeProjectCount = activeRelated.length;
  const openTaskCount = activeRelated.reduce((sum, project) => sum + (project.openTaskCount || 0), 0);
  const overdueProjectCount = activeRelated.filter((project) => isOverdueProject(project, now)).length;

  let status: ClientHealthStatus = "idle";
  if (overdueProjectCount > 0) {
    status = "overdue";
  } else if (activeProjectCount > 0) {
    status = "active";
  }

  return {
    status,
    activeProjectCount,
    openTaskCount,
    overdueProjectCount
  };
}

export function formatClientHealthDetail(health: ClientHealthSummary): string {
  if (health.status === "archived") {
    return "Archived client";
  }
  if (health.activeProjectCount === 0) {
    return "No active projects";
  }
  const parts = [`${health.activeProjectCount} active project${health.activeProjectCount === 1 ? "" : "s"}`];
  if (health.openTaskCount > 0) {
    parts.push(`${health.openTaskCount} open task${health.openTaskCount === 1 ? "" : "s"}`);
  }
  if (health.overdueProjectCount > 0) {
    parts.push(`${health.overdueProjectCount} overdue`);
  }
  return parts.join(" · ");
}
