import type { AiDeliveryProjectSummary } from "./AiDeliveryPage";

export type AiDeliveryPipelineStageId =
  | "brief"
  | "research"
  | "plan"
  | "drafting"
  | "internal_review"
  | "images"
  | "client_approval"
  | "wp_draft"
  | "report"
  | "completed";

export type AiDeliveryPipelineStage = {
  id: AiDeliveryPipelineStageId;
  label: string;
  shortLabel: string;
  count: number;
  statusLine: string;
  attention: boolean;
  tone: "indigo" | "amber" | "mauve" | "coral" | "sage" | "muted";
};

export type AiDeliveryDashboardKpis = {
  activeProjects: number;
  pendingReviews: number;
  clientApprovals: number | null;
  imageApprovals: number | null;
  reportsAwaiting: number | null;
  overdueItems: number | null;
};

export type AiDeliveryActionItem = {
  id: string;
  projectId: string;
  priority: "high" | "medium" | "low";
  clientName: string;
  projectName: string;
  deliverableLabel: string;
  actionLabel: string;
  stageLabel: string;
  waitingLabel: string;
  ownerLabel: string;
  dueLabel: string;
};

export type AiDeliveryDashboardRow = {
  id: string;
  clientName: string;
  projectName: string;
  deliverableLabel: string;
  stageLabel: string;
  statusLabel: string;
  ownerLabel: string;
  clientReviewLabel: string;
  dueLabel: string;
  lastUpdateLabel: string;
  nextActionLabel: string;
};

/** Shared next-action labels for queue + table (brief-stage honesty only). */
export function resolveAiDeliveryNextActionLabel(project: AiDeliveryProjectSummary): string {
  if (needsBrief(project)) return "Create brief";
  if (needsBriefCompletion(project)) {
    return isBriefPendingReview(project) ? "Review brief" : "Complete brief";
  }
  return "Open workspace";
}

const PIPELINE_STAGE_DEFS: Array<{
  id: AiDeliveryPipelineStageId;
  label: string;
  shortLabel: string;
}> = [
  { id: "brief", label: "Brief", shortLabel: "Brief" },
  { id: "research", label: "Research", shortLabel: "Research" },
  { id: "plan", label: "Plan", shortLabel: "Plan" },
  { id: "drafting", label: "Drafting", shortLabel: "Draft" },
  { id: "internal_review", label: "Int. Review", shortLabel: "Review" },
  { id: "images", label: "Images", shortLabel: "Images" },
  { id: "client_approval", label: "Client Appr.", shortLabel: "Client" },
  { id: "wp_draft", label: "WP Draft", shortLabel: "WP" },
  { id: "report", label: "Report", shortLabel: "Report" },
  { id: "completed", label: "Completed", shortLabel: "Done" },
];

function formatBriefStatus(status: string | null | undefined): string {
  if (!status) return "Not started";
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

/** Infers the earliest known pipeline stage from project-level data only (no fabricated downstream state). */
export function inferProjectPipelineStage(project: AiDeliveryProjectSummary): AiDeliveryPipelineStageId {
  if (project.isArchived) return "completed";
  if (!project.brief) return "brief";
  const status = project.brief.status;
  if (status === "APPROVED") return "research";
  if (status === "REVISION_REQUESTED" || status === "SUBMITTED" || status === "DRAFT") return "brief";
  return "brief";
}

function isBriefPendingReview(project: AiDeliveryProjectSummary): boolean {
  if (!project.brief || project.isArchived) return false;
  return project.brief.status === "SUBMITTED" || project.brief.status === "REVISION_REQUESTED";
}

function needsBrief(project: AiDeliveryProjectSummary): boolean {
  return !project.isArchived && !project.brief;
}

function needsBriefCompletion(project: AiDeliveryProjectSummary): boolean {
  if (project.isArchived || !project.brief) return false;
  return project.brief.status !== "APPROVED";
}

export function buildAiDeliveryDashboardKpis(projects: AiDeliveryProjectSummary[]): AiDeliveryDashboardKpis {
  const active = projects.filter((p) => !p.isArchived);
  const pendingReviews = active.filter(isBriefPendingReview).length;

  return {
    activeProjects: active.length,
    pendingReviews,
    clientApprovals: null,
    imageApprovals: null,
    reportsAwaiting: null,
    overdueItems: null,
  };
}

export function buildAiDeliveryPipelineStages(projects: AiDeliveryProjectSummary[]): AiDeliveryPipelineStage[] {
  const active = projects.filter((p) => !p.isArchived);
  const counts = new Map<AiDeliveryPipelineStageId, number>();
  for (const def of PIPELINE_STAGE_DEFS) {
    counts.set(def.id, 0);
  }
  for (const project of active) {
    const stage = inferProjectPipelineStage(project);
    counts.set(stage, (counts.get(stage) ?? 0) + 1);
  }

  return PIPELINE_STAGE_DEFS.map((def) => {
    const count = counts.get(def.id) ?? 0;
    const attention = def.id === "brief" && count > 0;
    let statusLine = "—";
    let tone: AiDeliveryPipelineStage["tone"] = "muted";

    if (count > 0) {
      if (def.id === "brief") {
        statusLine = "Needs intake";
        tone = "coral";
      } else if (def.id === "research") {
        statusLine = "Brief approved";
        tone = "indigo";
      } else {
        statusLine = "Open project";
        tone = "indigo";
      }
    }

    return {
      id: def.id,
      label: def.label,
      shortLabel: def.shortLabel,
      count,
      statusLine,
      attention,
      tone,
    };
  });
}

export function buildAiDeliveryActionQueue(projects: AiDeliveryProjectSummary[]): AiDeliveryActionItem[] {
  const items: AiDeliveryActionItem[] = [];

  for (const project of projects) {
    if (project.isArchived) continue;

    if (needsBrief(project)) {
      items.push({
        id: `${project.id}-brief-missing`,
        projectId: project.id,
        priority: "high",
        clientName: project.client?.name ?? "No client",
        projectName: project.project?.name ?? project.name,
        deliverableLabel: project.name,
        actionLabel: resolveAiDeliveryNextActionLabel(project),
        stageLabel: "Brief",
        waitingLabel: "Intake",
        ownerLabel: "Admin",
        dueLabel: project.targetMonth,
      });
      continue;
    }

    if (needsBriefCompletion(project)) {
      const priority = isBriefPendingReview(project) ? "high" : "medium";
      items.push({
        id: `${project.id}-brief-pending`,
        projectId: project.id,
        priority,
        clientName: project.client?.name ?? "No client",
        projectName: project.project?.name ?? project.name,
        deliverableLabel: project.name,
        actionLabel: resolveAiDeliveryNextActionLabel(project),
        stageLabel: "Brief",
        waitingLabel: formatBriefStatus(project.brief?.status),
        ownerLabel: "Admin",
        dueLabel: project.targetMonth,
      });
    }
  }

  return items.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.priority] - rank[b.priority];
  });
}

export function buildAiDeliveryDashboardRows(projects: AiDeliveryProjectSummary[]): AiDeliveryDashboardRow[] {
  return projects
    .filter((p) => !p.isArchived)
    .map((project) => {
      const stage = inferProjectPipelineStage(project);
      const stageDef = PIPELINE_STAGE_DEFS.find((s) => s.id === stage);
      return {
        id: project.id,
        clientName: project.client?.name ?? "—",
        projectName: project.project?.name ?? "—",
        deliverableLabel: project.name,
        stageLabel: stageDef?.label ?? "Brief",
        statusLabel: project.brief ? formatBriefStatus(project.brief.status) : "Brief not started",
        ownerLabel: "Admin",
        clientReviewLabel: "—",
        dueLabel: project.targetMonth || "—",
        lastUpdateLabel: project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : "—",
        nextActionLabel: resolveAiDeliveryNextActionLabel(project),
      };
    });
}
