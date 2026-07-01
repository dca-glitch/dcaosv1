/**
 * Deterministic content production seeding from workflow brief production plan + SEO outputs.
 * No live provider dependency — maps plan clusters/topics into AI Delivery content plan items.
 */
import type { WorkflowBriefSeoReportContent } from "./workflow-brief-ai.execution";

export const WORKFLOW_BRIEF_CONTENT_SEED_VERSION = "WORKFLOW_BRIEF_CONTENT_SEED_V1";
export const WORKFLOW_BRIEF_SEED_MARKER = "workflow-brief-seed:v1";
const MAX_SEED_ITEMS = 12;
const MAX_TOPICS_PER_CLUSTER = 3;

export interface WorkflowBriefSeedContentPlanItemDraft {
  title: string;
  targetKeyword: string | null;
  contentType: string;
  notes: string | null;
  sortOrder: number;
}

export interface WorkflowBriefContentClusterSeed {
  name?: string;
  topics?: unknown;
}

function truncateText(value: string | null | undefined, maxLength: number): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3).trim()}...` : normalized;
}

function readStringList(value: unknown, maxItems = 8): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === "string" ? truncateText(entry, 200) : null))
    .filter(Boolean) as string[];
}

function readClusters(value: unknown): WorkflowBriefContentClusterSeed[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry)) as WorkflowBriefContentClusterSeed[];
}

export function buildWorkflowBriefSeedLineageNote(
  briefId: string,
  productionPlanId: string,
  detail?: string | null
): string {
  const base = `[${WORKFLOW_BRIEF_SEED_MARKER} brief=${briefId} plan=${productionPlanId}]`;
  const normalizedDetail = truncateText(detail, 240);
  return normalizedDetail ? `${base} ${normalizedDetail}` : base;
}

export function isWorkflowBriefSeedItemForBrief(notes: string | null | undefined, briefId: string): boolean {
  return (notes ?? "").includes(`${WORKFLOW_BRIEF_SEED_MARKER} brief=${briefId}`);
}

export function readSeoReportForSeed(reportJson: unknown): WorkflowBriefSeoReportContent {
  if (!reportJson || typeof reportJson !== "object" || Array.isArray(reportJson)) {
    return {
      keywordClusters: [],
      topicIdeas: [],
      contentAngles: [],
      internalLinkIdeas: [],
      seoNotes: []
    };
  }
  const record = reportJson as Record<string, unknown>;
  return {
    keywordClusters: readStringList(record.keywordClusters),
    topicIdeas: readStringList(record.topicIdeas),
    contentAngles: readStringList(record.contentAngles),
    internalLinkIdeas: readStringList(record.internalLinkIdeas),
    seoNotes: readStringList(record.seoNotes)
  };
}

export function buildWorkflowBriefSeedContentPlanItems(input: {
  briefId: string;
  productionPlanId: string;
  planJson: unknown;
  clientVisibleSnapshotJson?: unknown;
  seoReportJson: unknown;
}): WorkflowBriefSeedContentPlanItemDraft[] {
  const planRecord =
    input.planJson && typeof input.planJson === "object" && !Array.isArray(input.planJson)
      ? (input.planJson as Record<string, unknown>)
      : {};
  const snapshotRecord =
    input.clientVisibleSnapshotJson &&
    typeof input.clientVisibleSnapshotJson === "object" &&
    !Array.isArray(input.clientVisibleSnapshotJson)
      ? (input.clientVisibleSnapshotJson as Record<string, unknown>)
      : {};

  const clusters = readClusters(planRecord.suggestedContentClusters ?? snapshotRecord.suggestedContentClusters);
  const priorityTopics = readStringList(planRecord.priorityTopics ?? snapshotRecord.priorityTopics);
  const seoFocusAreas = readStringList(planRecord.seoFocusAreas ?? snapshotRecord.seoFocusAreas);
  const recommendedDirection =
    typeof planRecord.recommendedContentDirection === "string"
      ? planRecord.recommendedContentDirection
      : typeof snapshotRecord.recommendedContentDirection === "string"
        ? snapshotRecord.recommendedContentDirection
        : null;

  const seo = readSeoReportForSeed(input.seoReportJson);
  const seenTitles = new Set<string>();
  const items: WorkflowBriefSeedContentPlanItemDraft[] = [];

  function pushItem(
    title: string,
    targetKeyword: string | null,
    detail: string | null,
    contentType = "article"
  ): void {
    const normalizedTitle = truncateText(title, 180);
    if (!normalizedTitle) {
      return;
    }
    const key = normalizedTitle.toLowerCase();
    if (seenTitles.has(key) || items.length >= MAX_SEED_ITEMS) {
      return;
    }
    seenTitles.add(key);
    items.push({
      title: normalizedTitle,
      targetKeyword: truncateText(targetKeyword, 120),
      contentType,
      notes: buildWorkflowBriefSeedLineageNote(input.briefId, input.productionPlanId, detail),
      sortOrder: items.length
    });
  }

  clusters.forEach((cluster, clusterIndex) => {
    const clusterName = truncateText(typeof cluster.name === "string" ? cluster.name : null, 120);
    const topics = readStringList(cluster.topics, MAX_TOPICS_PER_CLUSTER);
    const contentAngle = seo.contentAngles[clusterIndex] ?? recommendedDirection;

    topics.forEach((topic) => {
      pushItem(
        topic,
        clusterName ?? seo.keywordClusters[clusterIndex] ?? seoFocusAreas[clusterIndex] ?? null,
        contentAngle ? `Content angle: ${contentAngle}` : clusterName ? `Cluster: ${clusterName}` : null
      );
    });

    if (topics.length === 0 && clusterName) {
      pushItem(
        clusterName,
        seo.keywordClusters[clusterIndex] ?? clusterName,
        contentAngle ? `Content angle: ${contentAngle}` : `Cluster hub: ${clusterName}`
      );
    }
  });

  priorityTopics.forEach((topic, index) => {
    pushItem(
      topic,
      seoFocusAreas[index] ?? seo.keywordClusters[index] ?? null,
      recommendedDirection ? `Priority topic — ${recommendedDirection}` : "Priority topic from production plan"
    );
  });

  seo.topicIdeas.slice(0, 4).forEach((topic, index) => {
    pushItem(topic, seo.keywordClusters[index] ?? null, seo.contentAngles[index] ?? "SEO topic idea");
  });

  if (items.length === 0) {
    pushItem(
      "Core content piece from production plan",
      seo.keywordClusters[0] ?? null,
      recommendedDirection ?? "Seed fallback item — review production plan"
    );
  }

  return items;
}
