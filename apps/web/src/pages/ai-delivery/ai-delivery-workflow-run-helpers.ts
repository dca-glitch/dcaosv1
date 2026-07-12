export const workflowRunStatuses = ["DRAFT", "READY", "IN_PROGRESS", "REVIEW", "COMPLETED", "FAILED", "ARCHIVED"] as const;
export const workflowRunLifecycleStatuses = ["DRAFT", "READY", "IN_PROGRESS", "REVIEW", "COMPLETED", "ARCHIVED"] as const;
export type WorkflowRunStatus = (typeof workflowRunStatuses)[number];
export const workflowRunStatusLabels: Record<WorkflowRunStatus, string> = {
  DRAFT: "Draft",
  READY: "Ready",
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  COMPLETED: "Completed",
  FAILED: "Failed",
  ARCHIVED: "Archived"
};

export function normalizeWorkflowRunStatus(status: string | null | undefined): WorkflowRunStatus {
  return workflowRunStatuses.includes(status as WorkflowRunStatus) ? (status as WorkflowRunStatus) : "DRAFT";
}

export function getWorkflowRunNextStatus(status: string | null | undefined): WorkflowRunStatus | null {
  const currentIndex = workflowRunLifecycleStatuses.indexOf(normalizeWorkflowRunStatus(status) as (typeof workflowRunLifecycleStatuses)[number]);
  return currentIndex >= 0 && currentIndex < workflowRunLifecycleStatuses.length - 1 ? workflowRunLifecycleStatuses[currentIndex + 1] : null;
}

export function getWorkflowRunStatusOptions(status: string | null | undefined): WorkflowRunStatus[] {
  if (!status) return ["DRAFT"];
  const currentStatus = normalizeWorkflowRunStatus(status);
  if (currentStatus === "FAILED") {
    return ["FAILED", "ARCHIVED"];
  }
  const nextStatus = getWorkflowRunNextStatus(currentStatus);
  const options: WorkflowRunStatus[] = nextStatus ? [currentStatus, nextStatus] : [currentStatus];
  if (currentStatus === "IN_PROGRESS" || currentStatus === "REVIEW") {
    options.push("FAILED");
  }
  return options;
}

export function getWorkflowRunStatusHelper(status: string | null | undefined): string {
  if (!status) return "New workflow runs start in Draft.";
  const currentStatus = normalizeWorkflowRunStatus(status);
  if (currentStatus === "FAILED") return "Failed runs can be archived or rerun through the controlled stub execution action.";
  const nextStatus = getWorkflowRunNextStatus(currentStatus);
  const failedNote = currentStatus === "IN_PROGRESS" || currentStatus === "REVIEW" ? " You can also mark the run as Failed." : "";
  if (!nextStatus) return `No further status transitions are available. Same-status save is allowed for notes/result edits.${failedNote}`;
  return `Allowed next status: ${workflowRunStatusLabels[nextStatus]}. Same-status save is allowed for notes/result edits.${failedNote}`;
}

export function canExecuteWorkflowRun(status: string | null | undefined): boolean {
  const currentStatus = normalizeWorkflowRunStatus(status);
  return currentStatus === "DRAFT" || currentStatus === "READY" || currentStatus === "FAILED";
}
