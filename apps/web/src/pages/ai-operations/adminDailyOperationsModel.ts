import type { AiOperationsRunListItem } from "@dca-os-v1/shared";
import { normalizeStatusKey, type StatusKey } from "../../components/ui";

export type ActionPriority = "critical" | "high" | "normal";

export type DailyActionCategory = "approval" | "review" | "blocked" | "handoff" | "waiting";

export interface DailyAction {
  id: string;
  priority: ActionPriority;
  category: DailyActionCategory;
  title: string;
  context: string;
  relatedRun?: AiOperationsRunListItem;
  timestamp?: string | null;
  priorityLabel: string;
}

export interface AgencyOpsMetrics {
  blocked: number;
  overdue: number;
  inReview: number;
  ready: number;
  inProgress: number;
  completed: number;
  completedToday: number;
  costEstimate: string;
  totalRuns: number;
  /** Denominator for ring fill — at least 1 so empty rings stay readable. */
  ringMax: number;
}

export interface AgencyHealthSummary {
  clientCount: number;
  projectCount: number;
  overdueCount: number;
}

export interface AgencyActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string | null;
  status: string;
  projectRef: string;
}

export function normalizeRunStatus(status: string | null | undefined): StatusKey | "unknown" {
  if (!status) return "unknown";
  return normalizeStatusKey(status) ?? "unknown";
}

export function buildAgencyOpsMetrics(runs: AiOperationsRunListItem[]): AgencyOpsMetrics {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  let blocked = 0;
  let overdue = 0;
  let inReview = 0;
  let ready = 0;
  let inProgress = 0;
  let completed = 0;
  let completedToday = 0;

  for (const run of runs) {
    const key = normalizeRunStatus(run.status);
    if (key === "blocked") blocked += 1;
    else if (key === "overdue") overdue += 1;
    else if (key === "in_review" || key === "failed" || key === "changes_requested") inReview += 1;
    else if (key === "ready" || key === "awaiting_client") ready += 1;
    else if (key === "in_progress" || key === "draft") inProgress += 1;
    else if (key === "completed" || key === "approved" || key === "published") {
      completed += 1;
      const execTime = run.executedAt || run.finishedAt || "";
      if (execTime >= todayStart) completedToday += 1;
    }
  }

  // Runs have no due-date field in the current contract — overdue stays honest at 0
  // unless a run already carries an overdue status from the API.
  const totalTokens = runs.reduce((sum, r) => sum + (r.approximateInputTokens || 0), 0);
  const costEstimate = totalTokens > 0 ? `~${Math.round(totalTokens / 1000)}k tokens` : "—";
  const peak = Math.max(blocked, overdue, inReview, ready, inProgress, completed, 1);

  return {
    blocked,
    overdue,
    inReview,
    ready,
    inProgress,
    completed,
    completedToday,
    costEstimate,
    totalRuns: runs.length,
    ringMax: peak,
  };
}

export function generateDailyActions(runs: AiOperationsRunListItem[]): DailyAction[] {
  const actions: DailyAction[] = [];
  const byKey = new Map<string, AiOperationsRunListItem[]>();

  for (const run of runs) {
    const key = normalizeRunStatus(run.status);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(run);
  }

  const failedRuns = byKey.get("failed") || [];
  failedRuns.slice(0, 3).forEach((run) => {
    actions.push({
      id: `failed-${run.id}`,
      priority: "critical",
      priorityLabel: "Critical",
      category: "review",
      title: `Needs review: ${run.shortId} (${run.projectName})`,
      context: `${run.workflowType || "workflow"} needs follow-up`,
      relatedRun: run,
      timestamp: run.executedAt,
    });
  });

  const reviewRuns = byKey.get("in_review") || [];
  reviewRuns.slice(0, 3).forEach((run) => {
    actions.push({
      id: `review-${run.id}`,
      priority: "high",
      priorityLabel: "High",
      category: "review",
      title: `Needs review: ${run.shortId} (${run.projectName})`,
      context: run.outputType
        ? `${run.outputType} awaiting inspection`
        : "Workflow output awaiting inspection",
      relatedRun: run,
      timestamp: run.executedAt,
    });
  });

  const readyRuns = [
    ...(byKey.get("ready") || []),
    ...(byKey.get("awaiting_client") || []),
  ];
  readyRuns.slice(0, 3).forEach((run) => {
    actions.push({
      id: `approval-${run.id}`,
      priority: "high",
      priorityLabel: "High",
      category: "approval",
      title: `Ready now: ${run.shortId} (${run.projectName})`,
      context: run.outputType
        ? `${run.outputType} ready for your decision`
        : "Workflow output ready for your decision",
      relatedRun: run,
      timestamp: run.executedAt,
    });
  });

  const inProgressRuns = [
    ...(byKey.get("in_progress") || []),
    ...(byKey.get("draft") || []),
  ];
  if (inProgressRuns.length > 0) {
    actions.push({
      id: "long-running",
      priority: "normal",
      priorityLabel: "Normal",
      category: "waiting",
      title: `${inProgressRuns.length} workflow${inProgressRuns.length !== 1 ? "s" : ""} in progress`,
      context: `Longest running: ${inProgressRuns[0].projectName} (${inProgressRuns[0].workflowType || "standard"})`,
    });
  }

  const blockedRuns = byKey.get("blocked") || [];
  blockedRuns.slice(0, 2).forEach((run) => {
    actions.push({
      id: `blocked-${run.id}`,
      priority: "high",
      priorityLabel: "High",
      category: "blocked",
      title: `Blocked: ${run.shortId} (${run.projectName})`,
      context: "Waiting on owner approval, external input, or a missing dependency",
      relatedRun: run,
      timestamp: run.executedAt,
    });
  });

  const priorityRank: Record<ActionPriority, number> = {
    critical: 0,
    high: 1,
    normal: 2,
  };
  return actions.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
}

export function buildAgencyHealth(runs: AiOperationsRunListItem[]): AgencyHealthSummary {
  const clients = new Set<string>();
  const projects = new Set<string>();
  let overdueCount = 0;

  for (const run of runs) {
    if (run.clientName) clients.add(run.clientName);
    else if (run.clientId) clients.add(run.clientId);
    if (run.projectName) projects.add(run.projectName);
    if (normalizeRunStatus(run.status) === "overdue") overdueCount += 1;
  }

  return {
    clientCount: clients.size,
    projectCount: projects.size,
    overdueCount,
  };
}

export function buildAgencyActivity(runs: AiOperationsRunListItem[], limit = 8): AgencyActivityItem[] {
  return [...runs]
    .sort((a, b) => {
      const aTime = a.executedAt || a.updatedAt || a.createdAt || "";
      const bTime = b.executedAt || b.updatedAt || b.createdAt || "";
      return bTime.localeCompare(aTime);
    })
    .slice(0, limit)
    .map((run) => {
      const key = normalizeRunStatus(run.status);
      const statusLabel =
        key === "unknown"
          ? run.status
          : key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        id: run.id,
        title: `${run.shortId} · ${statusLabel}`,
        description: `${run.projectName}${run.workflowType ? ` · ${run.workflowType}` : ""}`,
        timestamp: run.executedAt || run.updatedAt || run.createdAt,
        status: run.status,
        projectRef: run.shortId,
      };
    });
}

export function formatRelativeTimestamp(iso: string | null | undefined): string {
  if (!iso) return "No timestamp";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "No timestamp";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const PURIVA_DAILY_PATH = [
  "Intake and compliance",
  "Approved KB/context",
  "WorkflowBriefs",
  "AI SEO plan",
  "Content and compliance review",
  "Client approval",
  "Monthly report and archive",
] as const;

export const DEFERRED_GATED_ITEMS = [
  "Staging deploy / environment proof",
  "Production deploy / readiness",
  "Live AI provider execution (OpenRouter)",
  "Live WordPress publish",
  "GA/GSC live sync — WITHDRAWN",
  "R2 live bucket IO",
] as const;
