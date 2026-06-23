import React, { FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import { MetricCard, SectionPanel, StatusBadge } from "../../components/ui";
import type { ClientSummary } from "../clients/ClientsPage";
import type { ProjectSummary as ProjectLinkSummary } from "../projects/ProjectsPage";

export type AiDeliveryBriefSummary = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  revisionCount?: number;
};

export type AiDeliveryProjectSummary = {
  id: string;
  clientId: string;
  client: { id: string; name: string } | null;
  projectId: string | null;
  project: { id: string; name: string } | null;
  name: string;
  targetMonth: string;
  plannedContentScopeNotes: string | null;
  isArchived: boolean;
  brief: AiDeliveryBriefSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type AiDeliveryProjectFormValues = {
  clientId: string;
  projectId: string | null;
  name: string;
  targetMonth: string;
  plannedContentScopeNotes: string;
};

export type AiDeliveryContentPlanItemSummary = {
  id?: string;
  title: string;
  targetKeyword: string | null;
  contentType: string | null;
  notes: string | null;
  sortOrder: number;
  approvalStatus?: string | null;
  clientComment?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AiDeliveryContentPlanSummary = {
  id: string;
  aiDeliveryProjectId: string;
  status: string;
  revisionCount: number;
  reviewRequestedAt: string | null;
  approvedAt: string | null;
  items: AiDeliveryContentPlanItemSummary[];
  createdAt: string;
  updatedAt: string;
};

export type AiDeliveryContentPlanFormValues = {
  items: Array<{
    title: string;
    targetKeyword?: string | null;
    contentType?: string | null;
    notes?: string | null;
    sortOrder: number;
    approvalStatus?: string | null;
    clientComment?: string | null;
  }>;
};

export type AiDeliveryContentDraftSummary = {
  id: string;
  aiDeliveryProjectId: string;
  contentPlanItemId: string | null;
  contentPlanItem: { id: string; title: string; sortOrder: number } | null;
  title: string;
  slug: string | null;
  draftBody: string;
  status: string;
  notes: string | null;
  reviewRequestedAt: string | null;
  approvedAt: string | null;
  revisionCount: number;
  clientComment: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AiDeliveryContentDraftFormValues = {
  contentPlanItemId: string | null;
  title: string;
  slug: string;
  draftBody: string;
  status: string;
  notes: string;
};

export type AiDeliveryArticleImageSummary = {
  id: string;
  aiDeliveryProjectId: string;
  contentDraftId: string;
  contentDraft: { id: string; title: string };
  title: string;
  prompt: string;
  styleNotes: string | null;
  status: string;
  previewImageUrl: string | null;
  finalImageUrl: string | null;
  storageKey: string | null;
  notes: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AiDeliveryArticleImageFormValues = {
  contentDraftId: string;
  title: string;
  prompt: string;
  styleNotes: string;
  status: string;
  previewImageUrl: string;
  finalImageUrl: string;
  storageKey: string;
  notes: string;
};

export type AiDeliveryPrivateAssetUploadValues = {
  file: File;
};

export type AiDeliveryDeliverableSummary = {
  id: string;
  aiDeliveryProjectId: string;
  contentDraftId?: string | null;
  articleImageId?: string | null;
  contentDraft?: { id: string; title: string; status: string; approvedAt?: string | null } | null;
  articleImage?: { id: string; title: string; status: string } | null;
  title: string;
  description?: string | null;
  deliveryType: string;
  status: string;
  exportUrl?: string | null;
  storageKey?: string | null;
  notes?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AiDeliveryDeliverableFormValues = {
  contentDraftId: string | null;
  articleImageId: string | null;
  title: string;
  description?: string | null;
  deliveryType: string;
  status: string;
  exportUrl?: string | null;
  storageKey?: string | null;
  notes?: string | null;
  isArchived?: boolean;
};

export type AiDeliveryDeliverableReviewSummary = {
  id: string;
  tenantId?: string;
  aiDeliveryProjectId: string;
  deliverableId: string;
  workflowRunId?: string | null;
  status: string;
  reviewerName?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiDeliveryDeliverableReviewFormValues = {
  status: string;
  reviewerName: string;
  reviewNotes: string;
};

export type AiDeliveryWorkflowRunSummary = {
  id: string;
  tenantId: string;
  aiDeliveryProjectId: string;
  status: string;
  adminNotes: string | null;
  resultPlaceholder: string | null;
  executionLog: string | null;
  executionError: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  brief: AiDeliveryBriefSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type AiDeliveryWorkflowRunFormValues = {
  status: string;
  adminNotes: string;
  resultPlaceholder: string;
};

export type AiDeliveryResearchRequestSummary = {
  id: string;
  tenantId: string;
  aiDeliveryProjectId: string;
  workflowRunId: string | null;
  workflowRun: { id: string; status: string } | null;
  title: string;
  description: string | null;
  requestType: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AiDeliveryResearchRequestFormValues = {
  workflowRunId: string | null;
  title: string;
  description: string;
  requestType: string;
  status: string;
};

export type AiDeliveryResearchSummarySummary = {
  id: string;
  tenantId: string;
  aiDeliveryProjectId: string;
  workflowRunId: string | null;
  workflowRun: { id: string; status: string } | null;
  title: string;
  status: string;
  summaryText: string;
  keyFindings: string | null;
  audienceInsights: string | null;
  competitorInsights: string | null;
  keywordOpportunities: string | null;
  contentRecommendations: string | null;
  briefRevisionNotes: string | null;
  sourceNotes: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiDeliveryResearchSummaryFormValues = {
  workflowRunId: string | null;
  title: string;
  status: string;
  summaryText: string;
  keyFindings: string;
  audienceInsights: string;
  competitorInsights: string;
  keywordOpportunities: string;
  contentRecommendations: string;
  briefRevisionNotes: string;
  sourceNotes: string;
};

export type AiDeliveryResearchSourceSummary = {
  id: string;
  tenantId: string;
  aiDeliveryProjectId: string;
  researchRequestId: string | null;
  workflowRunId: string | null;
  researchRequest: { id: string; title: string; status: string } | null;
  workflowRun: { id: string; status: string } | null;
  sourceUrl: string;
  sourceTitle: string | null;
  sourceType: string;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiDeliveryResearchSourceFormValues = {
  researchRequestId: string | null;
  workflowRunId: string | null;
  sourceUrl: string;
  sourceTitle: string;
  sourceType: string;
  status: string;
  reviewNotes: string;
};

type ContentPlanItemDraft = {
  localId: string;
  title: string;
  targetKeyword: string;
  contentType: string;
  notes: string;
  approvalStatus: string;
  clientComment: string;
};

export type AiDeliveryProjectsProps = {
  projects: AiDeliveryProjectSummary[];
  clients: ClientSummary[];
  projectsList: ProjectLinkSummary[];
  canEdit: boolean;
  loading: boolean;
  error: string | null;
  onArchive: (projectId: string) => Promise<boolean>;
  onSave: (projectId: string | null, values: AiDeliveryProjectFormValues) => Promise<boolean>;
  onRequestClientInput: (projectId: string) => Promise<boolean>;
  onRequestClientRevision: (projectId: string) => Promise<boolean>;
  onApproveFinal: (projectId: string) => Promise<boolean>;
  onFetchBrief?: (projectId: string) => Promise<null | {
    id: string;
    status: string;
    clientPriorities: string | null;
    productsServicesFocus: string | null;
    targetAudience: string | null;
    marketsCompetitors: string | null;
    notes: string | null;
    revisionCount: number;
    submittedAt: string | null;
    revisionRequestedAt: string | null;
    revisedAt: string | null;
    approvedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  onSaveBrief?: (projectId: string, values: {
    clientPriorities?: string | null;
    productsServicesFocus?: string | null;
    targetAudience?: string | null;
    marketsCompetitors?: string | null;
    notes?: string | null;
  }) => Promise<boolean>;
  onFetchContentPlan?: (projectId: string) => Promise<AiDeliveryContentPlanSummary | null>;
  onCreateContentPlan?: (projectId: string) => Promise<AiDeliveryContentPlanSummary | null>;
  onSaveContentPlan?: (projectId: string, values: AiDeliveryContentPlanFormValues) => Promise<AiDeliveryContentPlanSummary | null>;
  onRequestContentPlanReview?: (projectId: string) => Promise<AiDeliveryContentPlanSummary | null>;
  onApproveContentPlan?: (projectId: string) => Promise<AiDeliveryContentPlanSummary | null>;
  onRequestContentPlanChanges?: (projectId: string) => Promise<AiDeliveryContentPlanSummary | null>;
  onFetchContentDrafts?: (projectId: string) => Promise<AiDeliveryContentDraftSummary[]>;
  onSaveContentDraft?: (projectId: string, draftId: string | null, values: AiDeliveryContentDraftFormValues) => Promise<AiDeliveryContentDraftSummary | null>;
  onArchiveContentDraft?: (projectId: string, draftId: string) => Promise<AiDeliveryContentDraftSummary | null>;
  onRequestContentDraftReview?: (projectId: string, draftId: string) => Promise<AiDeliveryContentDraftSummary | null>;
  onReturnContentDraftToDraft?: (projectId: string, draftId: string) => Promise<AiDeliveryContentDraftSummary | null>;
  onFetchArticleImages?: (projectId: string) => Promise<AiDeliveryArticleImageSummary[]>;
  onSaveArticleImage?: (projectId: string, imageId: string | null, values: AiDeliveryArticleImageFormValues) => Promise<AiDeliveryArticleImageSummary | null>;
  onArchiveArticleImage?: (projectId: string, imageId: string) => Promise<AiDeliveryArticleImageSummary | null>;
  onUploadArticleImageFinalAsset?: (projectId: string, imageId: string, values: AiDeliveryPrivateAssetUploadValues) => Promise<AiDeliveryArticleImageSummary | null>;
  onOpenArticleImage?: (projectId: string, imageId: string) => Promise<boolean>;
  onMarkArticleImagePreviewReady?: (projectId: string, imageId: string) => Promise<AiDeliveryArticleImageSummary | null>;
  onRequestArticleImageChanges?: (projectId: string, imageId: string) => Promise<AiDeliveryArticleImageSummary | null>;
  onApproveArticleImage?: (projectId: string, imageId: string) => Promise<AiDeliveryArticleImageSummary | null>;
  onMarkArticleImageFinalReady?: (projectId: string, imageId: string) => Promise<AiDeliveryArticleImageSummary | null>;
  onFetchDeliverables?: (projectId: string) => Promise<AiDeliveryDeliverableSummary[]>;
  onSaveDeliverable?: (projectId: string, deliverableId: string | null, values: AiDeliveryDeliverableFormValues) => Promise<AiDeliveryDeliverableSummary | null>;
  onUploadDeliverableDocument?: (projectId: string, deliverableId: string, values: AiDeliveryPrivateAssetUploadValues) => Promise<AiDeliveryDeliverableSummary | null>;
  onOpenDeliverableDocument?: (projectId: string, deliverableId: string) => Promise<boolean>;
  onArchiveDeliverable?: (projectId: string, deliverableId: string) => Promise<boolean>;
  onRestoreDeliverable?: (projectId: string, deliverableId: string) => Promise<AiDeliveryDeliverableSummary | null>;
  onMarkDeliverableReady?: (projectId: string, deliverableId: string) => Promise<AiDeliveryDeliverableSummary | null>;
  onRequestDeliverableRevision?: (projectId: string, deliverableId: string) => Promise<AiDeliveryDeliverableSummary | null>;
  onAcceptDeliverable?: (projectId: string, deliverableId: string) => Promise<AiDeliveryDeliverableSummary | null>;
  onFetchDeliverableReviews?: (projectId: string, deliverableId: string) => Promise<AiDeliveryDeliverableReviewSummary[]>;
  onSaveDeliverableReview?: (projectId: string, deliverableId: string, reviewId: string | null, values: AiDeliveryDeliverableReviewFormValues) => Promise<AiDeliveryDeliverableReviewSummary | null>;
  onFetchWorkflowRuns?: (projectId: string) => Promise<AiDeliveryWorkflowRunSummary[]>;
  onSaveWorkflowRun?: (projectId: string, workflowRunId: string | null, values: AiDeliveryWorkflowRunFormValues) => Promise<AiDeliveryWorkflowRunSummary | null>;
  onExecuteWorkflowRun?: (projectId: string, workflowRunId: string, input?: { contentPlanItemId?: string | null }) => Promise<AiDeliveryWorkflowRunSummary | null>;
  onFetchResearchRequests?: (projectId: string) => Promise<AiDeliveryResearchRequestSummary[]>;
  onSaveResearchRequest?: (projectId: string, researchRequestId: string | null, values: AiDeliveryResearchRequestFormValues) => Promise<AiDeliveryResearchRequestSummary | null>;
  onFetchResearchSummaries?: (projectId: string) => Promise<AiDeliveryResearchSummarySummary[]>;
  onSaveResearchSummary?: (projectId: string, researchSummaryId: string | null, values: AiDeliveryResearchSummaryFormValues) => Promise<AiDeliveryResearchSummarySummary | null>;
  onApplyResearchSummaryToBrief?: (projectId: string, researchSummaryId: string) => Promise<{ researchSummary: AiDeliveryResearchSummarySummary | null; brief: { id: string; notes: string | null; updatedAt: string } | null } | null>;
  onFetchResearchSources?: (projectId: string, researchRequestId?: string | null) => Promise<AiDeliveryResearchSourceSummary[]>;
  onSaveResearchSource?: (projectId: string, researchSourceId: string | null, values: AiDeliveryResearchSourceFormValues) => Promise<AiDeliveryResearchSourceSummary | null>;
};

const workflowRunStatuses = ["DRAFT", "READY", "IN_PROGRESS", "REVIEW", "COMPLETED", "FAILED", "ARCHIVED"] as const;
const contentPlanItemApprovalStatuses = ["DRAFT", "CLIENT_APPROVED", "CLIENT_CHANGES_REQUESTED"] as const;
const researchRequestStatuses = ["DRAFT", "READY", "IN_REVIEW", "COMPLETED", "ARCHIVED"] as const;
const researchSummaryStatuses = ["DRAFT", "IN_REVIEW", "FINALIZED", "ARCHIVED"] as const;
const researchSourceStatuses = ["PROPOSED", "APPROVED", "REJECTED", "ARCHIVED"] as const;
const researchSourceTypes = ["WEBSITE", "DOCUMENT", "OTHER"] as const;
const workflowRunLifecycleStatuses = ["DRAFT", "READY", "IN_PROGRESS", "REVIEW", "COMPLETED", "ARCHIVED"] as const;
type WorkflowRunStatus = (typeof workflowRunStatuses)[number];
const workflowRunStatusLabels: Record<WorkflowRunStatus, string> = {
  DRAFT: "Draft",
  READY: "Ready",
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  COMPLETED: "Completed",
  FAILED: "Failed",
  ARCHIVED: "Archived"
};

function normalizeWorkflowRunStatus(status: string | null | undefined): WorkflowRunStatus {
  return workflowRunStatuses.includes(status as WorkflowRunStatus) ? (status as WorkflowRunStatus) : "DRAFT";
}

function getWorkflowRunNextStatus(status: string | null | undefined): WorkflowRunStatus | null {
  const currentIndex = workflowRunLifecycleStatuses.indexOf(normalizeWorkflowRunStatus(status) as (typeof workflowRunLifecycleStatuses)[number]);
  return currentIndex >= 0 && currentIndex < workflowRunLifecycleStatuses.length - 1 ? workflowRunLifecycleStatuses[currentIndex + 1] : null;
}

function getWorkflowRunStatusOptions(status: string | null | undefined): WorkflowRunStatus[] {
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

function getWorkflowRunStatusHelper(status: string | null | undefined): string {
  if (!status) return "New workflow runs start in Draft.";
  const currentStatus = normalizeWorkflowRunStatus(status);
  if (currentStatus === "FAILED") return "Failed runs can be archived or rerun through the controlled stub execution action.";
  const nextStatus = getWorkflowRunNextStatus(currentStatus);
  const failedNote = currentStatus === "IN_PROGRESS" || currentStatus === "REVIEW" ? " You can also mark the run as Failed." : "";
  if (!nextStatus) return `No further status transitions are available. Same-status save is allowed for notes/result edits.${failedNote}`;
  return `Allowed next status: ${workflowRunStatusLabels[nextStatus]}. Same-status save is allowed for notes/result edits.${failedNote}`;
}

function canExecuteWorkflowRun(status: string | null | undefined): boolean {
  const currentStatus = normalizeWorkflowRunStatus(status);
  return currentStatus === "DRAFT" || currentStatus === "READY" || currentStatus === "FAILED";
}

const emptyForm = (clientId = ""): AiDeliveryProjectFormValues => ({
  clientId,
  projectId: null,
  name: "",
  targetMonth: "",
  plannedContentScopeNotes: ""
});

const itemDraftFromPlanItem = (item: AiDeliveryContentPlanItemSummary, index: number): ContentPlanItemDraft => ({
  localId: item.id ?? `item-${index}-${Date.now()}`,
  title: item.title,
  targetKeyword: item.targetKeyword ?? "",
  contentType: item.contentType ?? "article",
  notes: item.notes ?? "",
  approvalStatus: item.approvalStatus ?? "DRAFT",
  clientComment: item.clientComment ?? ""
});

const emptyContentPlanItem = (): ContentPlanItemDraft => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  title: "",
  targetKeyword: "",
  contentType: "article",
  notes: "",
  approvalStatus: "DRAFT",
  clientComment: ""
});

const emptyContentDraft = (): AiDeliveryContentDraftFormValues => ({
  contentPlanItemId: null,
  title: "",
  slug: "",
  draftBody: "",
  status: "DRAFT",
  notes: ""
});

const emptyArticleImage = (): AiDeliveryArticleImageFormValues => ({
  contentDraftId: "",
  title: "",
  prompt: "",
  styleNotes: "",
  status: "DRAFT",
  previewImageUrl: "",
  finalImageUrl: "",
  storageKey: "",
  notes: ""
});

const emptyDeliverableReview = (): AiDeliveryDeliverableReviewFormValues => ({
  status: "NOT_STARTED",
  reviewerName: "",
  reviewNotes: ""
});

const emptyWorkflowRun = (): AiDeliveryWorkflowRunFormValues => ({
  status: "DRAFT",
  adminNotes: "",
  resultPlaceholder: ""
});

const emptyResearchRequest = (): AiDeliveryResearchRequestFormValues => ({
  workflowRunId: null,
  title: "",
  description: "",
  requestType: "",
  status: "DRAFT"
});

const emptyResearchSummary = (): AiDeliveryResearchSummaryFormValues => ({
  workflowRunId: null,
  title: "",
  status: "DRAFT",
  summaryText: "",
  keyFindings: "",
  audienceInsights: "",
  competitorInsights: "",
  keywordOpportunities: "",
  contentRecommendations: "",
  briefRevisionNotes: "",
  sourceNotes: ""
});

const emptyResearchSource = (): AiDeliveryResearchSourceFormValues => ({
  researchRequestId: null,
  workflowRunId: null,
  sourceUrl: "",
  sourceTitle: "",
  sourceType: "WEBSITE",
  status: "PROPOSED",
  reviewNotes: ""
});

const researchSourceFormFromSummary = (source: AiDeliveryResearchSourceSummary): AiDeliveryResearchSourceFormValues => ({
  researchRequestId: source.researchRequestId,
  workflowRunId: source.workflowRunId,
  sourceUrl: source.sourceUrl,
  sourceTitle: source.sourceTitle ?? "",
  sourceType: source.sourceType,
  status: source.status,
  reviewNotes: source.reviewNotes ?? ""
});

const researchSummaryFormFromSummary = (summary: AiDeliveryResearchSummarySummary): AiDeliveryResearchSummaryFormValues => ({
  workflowRunId: summary.workflowRunId,
  title: summary.title,
  status: summary.status,
  summaryText: summary.summaryText,
  keyFindings: summary.keyFindings ?? "",
  audienceInsights: summary.audienceInsights ?? "",
  competitorInsights: summary.competitorInsights ?? "",
  keywordOpportunities: summary.keywordOpportunities ?? "",
  contentRecommendations: summary.contentRecommendations ?? "",
  briefRevisionNotes: summary.briefRevisionNotes ?? "",
  sourceNotes: summary.sourceNotes ?? ""
});

function formatOptionalDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString() : "Not set";
}

function formatPreview(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  if (!text) return "Not set";
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

function formatContentPlanReviewStatus(plan: AiDeliveryContentPlanSummary | null): string {
  if (!plan) return "Pending / not requested";
  if (plan.status === "CLIENT_REVIEW_REQUESTED") return "Ready for review";
  if (plan.status === "CLIENT_APPROVED") return "Approved";
  if (plan.status === "CLIENT_CHANGES_REQUESTED") return "Changes requested";
  return "Draft / preparing";
}

function formatContentPlanItemApprovalStatus(value?: string | null): string {
  if (!value || value === "DRAFT") return "Planned";
  if (value === "CLIENT_APPROVED") return "Approved";
  if (value === "CLIENT_CHANGES_REQUESTED") return "Changes requested";
  return formatEnumLabel(value);
}

function formatContentDraftStatus(value?: string | null): string {
  if (!value || value === "DRAFT") return "Draft / preparing";
  if (value === "READY_FOR_REVIEW") return "Ready for review";
  if (value === "APPROVED") return "Approved";
  if (value === "CHANGES_REQUESTED") return "Changes requested";
  if (value === "ARCHIVED") return "Archived";
  return formatEnumLabel(value);
}

function formatArticleImageStatus(value?: string | null): string {
  if (!value || value === "DRAFT") return "Draft / preparing";
  if (value === "READY_FOR_GENERATION") return "Preparing preview";
  if (value === "PREVIEW_READY") return "Preview ready";
  if (value === "CHANGES_REQUESTED") return "Changes requested";
  if (value === "APPROVED") return "Approved";
  if (value === "FINAL_READY") return "Final ready";
  if (value === "ARCHIVED") return "Archived";
  return formatEnumLabel(value);
}

function formatDeliverableStatus(value?: string | null): string {
  if (!value || value === "DRAFT") return "Draft / packaging";
  if (value === "READY") return "Ready for internal handoff";
  if (value === "REVISION_REQUESTED") return "Revision requested";
  if (value === "ACCEPTED") return "Internally accepted";
  if (value === "DELIVERED") return "Delivered record";
  if (value === "ARCHIVED") return "Archived";
  return formatEnumLabel(value);
}

function formatEnumLabel(value?: string | null): string {
  if (!value) return "Not set";
  return String(value).toLowerCase().replace(/_/g, " ").replace(/(^|\s)\S/g, (s) => s.toUpperCase());
}

function getDeliverableExportState(item: AiDeliveryDeliverableSummary): string {
  if ((item.exportUrl ?? "").trim()) return "Export reference recorded for admin use only.";
  if ((item.storageKey ?? "").trim()) return "Storage reference recorded for admin use only.";
  return "No export or storage reference recorded.";
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function canPackageApprovedContentDraft(draft: Pick<AiDeliveryContentDraftSummary, "isArchived" | "status"> | null | undefined) {
  return !!draft && draft.isArchived !== true && draft.status === "APPROVED";
}

function canPackageApprovedArticleImage(image: Pick<AiDeliveryArticleImageSummary, "isArchived" | "status"> | null | undefined) {
  return !!image && image.isArchived !== true && ["APPROVED", "FINAL_READY"].includes(image.status);
}

function deliverableStatusNeedsApprovedLinks(status: string | null | undefined) {
  return ["READY", "DELIVERED", "ACCEPTED"].includes((status ?? "").trim().toUpperCase());
}

function deliverableFormHasReadyLinks(
  form: AiDeliveryDeliverableFormValues,
  drafts: AiDeliveryContentDraftSummary[],
  images: AiDeliveryArticleImageSummary[]
) {
  if (!deliverableStatusNeedsApprovedLinks(form.status)) {
    return true;
  }

  const linkedDraft = drafts.find((draft) => draft.id === form.contentDraftId) ?? null;
  const linkedImage = images.find((image) => image.id === form.articleImageId) ?? null;

  if (!linkedDraft && !linkedImage) {
    return false;
  }

  if (linkedDraft && !canPackageApprovedContentDraft(linkedDraft)) {
    return false;
  }

  if (linkedImage && !canPackageApprovedArticleImage(linkedImage)) {
    return false;
  }

  return true;
}

function getMostRecentReview(reviews: AiDeliveryDeliverableReviewSummary[]): AiDeliveryDeliverableReviewSummary | null {
  return reviews.reduce<AiDeliveryDeliverableReviewSummary | null>((latest, review) => {
    if (!latest) return review;
    const latestTime = new Date(latest.updatedAt || latest.createdAt).getTime();
    const reviewTime = new Date(review.updatedAt || review.createdAt).getTime();
    return reviewTime > latestTime ? review : latest;
  }, null);
}

function formatStatusBreakdown(items: Array<{ status: string }>, fallback = "No records loaded"): string {
  if (items.length === 0) return fallback;
  const counts = items.reduce<Record<string, number>>((summary, item) => {
    summary[item.status] = (summary[item.status] ?? 0) + 1;
    return summary;
  }, {});
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, count]) => `${formatEnumLabel(status)}: ${count}`)
    .join(" - ");
}

export function AiDeliveryPage({
  projects,
  clients,
  projectsList,
  canEdit,
  loading,
  error,
  onArchive,
  onSave,
  onRequestClientInput,
  onRequestClientRevision,
  onApproveFinal,
  onFetchBrief,
  onSaveBrief,
  onFetchContentPlan,
  onCreateContentPlan,
  onSaveContentPlan,
  onRequestContentPlanReview,
  onApproveContentPlan,
  onRequestContentPlanChanges,
  onFetchContentDrafts,
  onSaveContentDraft,
  onArchiveContentDraft,
  onRequestContentDraftReview,
  onReturnContentDraftToDraft,
  onFetchArticleImages,
  onSaveArticleImage,
  onArchiveArticleImage,
  onUploadArticleImageFinalAsset,
  onOpenArticleImage,
  onMarkArticleImagePreviewReady,
  onRequestArticleImageChanges,
  onApproveArticleImage,
  onMarkArticleImageFinalReady,
  onFetchDeliverables,
  onSaveDeliverable,
  onUploadDeliverableDocument,
  onOpenDeliverableDocument,
  onArchiveDeliverable,
  onRestoreDeliverable,
  onMarkDeliverableReady,
  onRequestDeliverableRevision,
  onAcceptDeliverable,
  onFetchDeliverableReviews,
  onSaveDeliverableReview,
  onFetchWorkflowRuns,
  onSaveWorkflowRun,
  onExecuteWorkflowRun,
  onFetchResearchRequests,
  onSaveResearchRequest,
  onFetchResearchSummaries,
  onSaveResearchSummary,
  onApplyResearchSummaryToBrief,
  onFetchResearchSources,
  onSaveResearchSource
}: AiDeliveryProjectsProps) {
  const [filter, setFilter] = useState<"all" | "active" | "archived">("active");
  const [editorProjectId, setEditorProjectId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<AiDeliveryProjectFormValues>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [openBriefId, setOpenBriefId] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefDetail, setBriefDetail] = useState<null | {
    id: string;
    status: string;
    clientPriorities: string | null;
    productsServicesFocus: string | null;
    targetAudience: string | null;
    marketsCompetitors: string | null;
    notes: string | null;
    revisionCount: number;
    submittedAt: string | null;
    revisionRequestedAt: string | null;
    revisedAt: string | null;
    approvedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>(null);
  const [openContentPlanId, setOpenContentPlanId] = useState<string | null>(null);
  const [contentPlanLoading, setContentPlanLoading] = useState(false);
  const [contentPlanSaving, setContentPlanSaving] = useState(false);
  const [contentPlanGeneratingItemId, setContentPlanGeneratingItemId] = useState<string | null>(null);
  const [contentPlanError, setContentPlanError] = useState<string | null>(null);
  const [contentPlanGenerationMessage, setContentPlanGenerationMessage] = useState<string | null>(null);
  const [contentPlanDetail, setContentPlanDetail] = useState<AiDeliveryContentPlanSummary | null>(null);
  const [contentPlanItems, setContentPlanItems] = useState<ContentPlanItemDraft[]>([]);
  const [openContentDraftsId, setOpenContentDraftsId] = useState<string | null>(null);
  const [contentDraftsLoading, setContentDraftsLoading] = useState(false);
  const [contentDraftsSaving, setContentDraftsSaving] = useState(false);
  const [contentDraftsError, setContentDraftsError] = useState<string | null>(null);
  const [contentDraftHandoffMessage, setContentDraftHandoffMessage] = useState<string | null>(null);
  const [contentDrafts, setContentDrafts] = useState<AiDeliveryContentDraftSummary[]>([]);
  const [contentDraftEditorId, setContentDraftEditorId] = useState<string | null>(null);
  const [contentDraftForm, setContentDraftForm] = useState<AiDeliveryContentDraftFormValues>(emptyContentDraft());
  const [contentDraftPlan, setContentDraftPlan] = useState<AiDeliveryContentPlanSummary | null>(null);
  const [openArticleImagesId, setOpenArticleImagesId] = useState<string | null>(null);
  const [articleImagesLoading, setArticleImagesLoading] = useState(false);
  const [articleImagesSaving, setArticleImagesSaving] = useState(false);
  const [articleImagesError, setArticleImagesError] = useState<string | null>(null);
  const [articleImages, setArticleImages] = useState<AiDeliveryArticleImageSummary[]>([]);
  const [articleImageFinalAssetFiles, setArticleImageFinalAssetFiles] = useState<Record<string, File | null>>({});
  const [articleImageUploadTargetId, setArticleImageUploadTargetId] = useState<string | null>(null);
  const [articleImageDownloadTargetId, setArticleImageDownloadTargetId] = useState<string | null>(null);
  const [articleImageEditorId, setArticleImageEditorId] = useState<string | null>(null);
  const [articleImageForm, setArticleImageForm] = useState<AiDeliveryArticleImageFormValues>(emptyArticleImage());
  const [articleImageDrafts, setArticleImageDrafts] = useState<AiDeliveryContentDraftSummary[]>([]);
  const [openDeliverablesId, setOpenDeliverablesId] = useState<string | null>(null);
  const [deliverablesLoading, setDeliverablesLoading] = useState(false);
  const [deliverablesSaving, setDeliverablesSaving] = useState(false);
  const [deliverablesError, setDeliverablesError] = useState<string | null>(null);
  const [deliverables, setDeliverables] = useState<AiDeliveryDeliverableSummary[]>([]);
  const [deliverableDocumentFiles, setDeliverableDocumentFiles] = useState<Record<string, File | null>>({});
  const [deliverableUploadTargetId, setDeliverableUploadTargetId] = useState<string | null>(null);
  const [deliverableDownloadTargetId, setDeliverableDownloadTargetId] = useState<string | null>(null);
  const [deliverableEditorId, setDeliverableEditorId] = useState<string | null>(null);
  const [deliverableForm, setDeliverableForm] = useState<AiDeliveryDeliverableFormValues>({ contentDraftId: null, articleImageId: null, title: "", description: null, deliveryType: "CONTENT_PACKAGE", status: "DRAFT", exportUrl: null, storageKey: null, notes: null, isArchived: false });
  const [selectedReviewDeliverableId, setSelectedReviewDeliverableId] = useState<string | null>(null);
  const [deliverableReviewsLoading, setDeliverableReviewsLoading] = useState(false);
  const [deliverableReviewsSaving, setDeliverableReviewsSaving] = useState(false);
  const [deliverableReviewsError, setDeliverableReviewsError] = useState<string | null>(null);
  const [deliverableReviews, setDeliverableReviews] = useState<AiDeliveryDeliverableReviewSummary[]>([]);
  const [deliverableReviewEditorId, setDeliverableReviewEditorId] = useState<string | null>(null);
  const [deliverableReviewForm, setDeliverableReviewForm] = useState<AiDeliveryDeliverableReviewFormValues>(emptyDeliverableReview());
  const [openWorkflowRunsId, setOpenWorkflowRunsId] = useState<string | null>(null);
  const [workflowRunsLoading, setWorkflowRunsLoading] = useState(false);
  const [workflowRunsSaving, setWorkflowRunsSaving] = useState(false);
  const [workflowRunExecutingId, setWorkflowRunExecutingId] = useState<string | null>(null);
  const [workflowRunsError, setWorkflowRunsError] = useState<string | null>(null);
  const [workflowRuns, setWorkflowRuns] = useState<AiDeliveryWorkflowRunSummary[]>([]);
  const [workflowRunEditorId, setWorkflowRunEditorId] = useState<string | null>(null);
  const [workflowRunForm, setWorkflowRunForm] = useState<AiDeliveryWorkflowRunFormValues>(emptyWorkflowRun());
  const [openResearchSourcesId, setOpenResearchSourcesId] = useState<string | null>(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchSaving, setResearchSaving] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [researchRequests, setResearchRequests] = useState<AiDeliveryResearchRequestSummary[]>([]);
  const [researchSummaries, setResearchSummaries] = useState<AiDeliveryResearchSummarySummary[]>([]);
  const [researchSources, setResearchSources] = useState<AiDeliveryResearchSourceSummary[]>([]);
  const [researchWorkflowRuns, setResearchWorkflowRuns] = useState<AiDeliveryWorkflowRunSummary[]>([]);
  const [researchRequestEditorId, setResearchRequestEditorId] = useState<string | null>(null);
  const [researchRequestForm, setResearchRequestForm] = useState<AiDeliveryResearchRequestFormValues>(emptyResearchRequest());
  const [researchSummaryEditorId, setResearchSummaryEditorId] = useState<string | null>(null);
  const [researchSummaryForm, setResearchSummaryForm] = useState<AiDeliveryResearchSummaryFormValues>(emptyResearchSummary());
  const [researchSourceEditorId, setResearchSourceEditorId] = useState<string | null>(null);
  const [researchSourceForm, setResearchSourceForm] = useState<AiDeliveryResearchSourceFormValues>(emptyResearchSource());

  const selectedProject = useMemo(() => projects.find((p) => p.id === editorProjectId) ?? null, [editorProjectId, projects]);
  const openProject = useMemo(() => projects.find((p) => p.id === openBriefId) ?? null, [openBriefId, projects]);
  const openContentPlanProject = useMemo(() => projects.find((p) => p.id === openContentPlanId) ?? null, [openContentPlanId, projects]);
  const openContentDraftsProject = useMemo(() => projects.find((p) => p.id === openContentDraftsId) ?? null, [openContentDraftsId, projects]);
  const openArticleImagesProject = useMemo(() => projects.find((p) => p.id === openArticleImagesId) ?? null, [openArticleImagesId, projects]);
  const activeContentDraftRecord = useMemo(
    () => contentDrafts.find((item) => item.id === contentDraftEditorId) ?? null,
    [contentDraftEditorId, contentDrafts]
  );
  const selectedContentDraftPlanItem = useMemo(
    () => (contentDraftPlan?.items ?? []).find((item) => item.id === contentDraftForm.contentPlanItemId) ?? null,
    [contentDraftForm.contentPlanItemId, contentDraftPlan]
  );
  const contentDraftHasUnsavedChanges = useMemo(() => {
    if (activeContentDraftRecord) {
      return (
        (activeContentDraftRecord.contentPlanItemId ?? null) !== (contentDraftForm.contentPlanItemId ?? null)
        || activeContentDraftRecord.title !== contentDraftForm.title
        || (activeContentDraftRecord.slug ?? "") !== contentDraftForm.slug
        || activeContentDraftRecord.draftBody !== contentDraftForm.draftBody
        || activeContentDraftRecord.status !== contentDraftForm.status
        || (activeContentDraftRecord.notes ?? "") !== contentDraftForm.notes
      );
    }

    return Boolean(
      contentDraftForm.contentPlanItemId
      || contentDraftForm.title.trim()
      || contentDraftForm.slug.trim()
      || contentDraftForm.draftBody.trim()
      || contentDraftForm.notes.trim()
      || contentDraftForm.status !== "DRAFT"
    );
  }, [activeContentDraftRecord, contentDraftForm]);
  const contentDraftReviewReadiness = useMemo(() => {
    if (!contentDraftForm.title.trim()) {
      return {
        ready: false,
        message: "Add a title before moving this draft through admin review."
      };
    }
    if (!contentDraftForm.draftBody.trim()) {
      return {
        ready: false,
        message: "Add draft body content before marking this draft ready for review."
      };
    }
    if (activeContentDraftRecord?.isArchived) {
      return {
        ready: false,
        message: "Archived drafts stay visible for admin history and cannot move into review."
      };
    }
    if (activeContentDraftRecord?.status === "READY_FOR_REVIEW") {
      return {
        ready: false,
        message: "This draft is already ready for admin review. Return it to Draft before editing again."
      };
    }
    if (contentDraftHasUnsavedChanges) {
      return {
        ready: false,
        message: "Save the current draft edits before using the review transition."
      };
    }

    return {
      ready: true,
      message: "This admin draft is saved and ready to move into internal review when you are satisfied with the copy."
    };
  }, [activeContentDraftRecord, contentDraftForm.draftBody, contentDraftForm.title, contentDraftHasUnsavedChanges]);
  const contentDraftEditorLinkedPlanLabel = useMemo(() => {
    if (activeContentDraftRecord?.contentPlanItem) {
      return `${activeContentDraftRecord.contentPlanItem.sortOrder}. ${activeContentDraftRecord.contentPlanItem.title}`;
    }
    if (selectedContentDraftPlanItem?.id) {
      return `${selectedContentDraftPlanItem.sortOrder}. ${selectedContentDraftPlanItem.title}`;
    }
    return "Manual / unlinked production record";
  }, [activeContentDraftRecord, selectedContentDraftPlanItem]);
  const contentDraftSaveStateLabel = useMemo(() => {
    if (activeContentDraftRecord) {
      return contentDraftHasUnsavedChanges ? "Unsaved edits" : "Saved";
    }
    return contentDraftHasUnsavedChanges ? "New draft with unsaved content" : "New empty draft";
  }, [activeContentDraftRecord, contentDraftHasUnsavedChanges]);
  const canSaveContentDraftForm = Boolean(contentDraftForm.title.trim());
  const canMarkReadyCurrentDraft = Boolean(
    activeContentDraftRecord
    && !activeContentDraftRecord.isArchived
    && contentDraftReviewReadiness.ready
  );
  const canReturnCurrentDraft = Boolean(
    activeContentDraftRecord
    && !activeContentDraftRecord.isArchived
    && activeContentDraftRecord.status !== "DRAFT"
  );
  const contentDraftPrimaryActionLabel = contentDraftEditorId
    ? (contentDraftHasUnsavedChanges ? "Save draft changes" : "Save draft")
    : "Create production record";
  const eligibleContentDraftPlanItems = useMemo(
    () => (contentDraftPlan?.items ?? [])
      .filter((item) => (item.approvalStatus ?? "DRAFT") !== "CLIENT_CHANGES_REQUESTED")
      .sort((left, right) => {
        const leftPriority = left.approvalStatus === "CLIENT_APPROVED" ? 0 : 1;
        const rightPriority = right.approvalStatus === "CLIENT_APPROVED" ? 0 : 1;
        if (leftPriority !== rightPriority) return leftPriority - rightPriority;
        return left.sortOrder - right.sortOrder;
      }),
    [contentDraftPlan]
  );
  const activeArticleImageRecord = useMemo(
    () => articleImages.find((item) => item.id === articleImageEditorId) ?? null,
    [articleImageEditorId, articleImages]
  );
  const activeContentDraftLinkedImages = useMemo(
    () => activeContentDraftRecord ? articleImages.filter((item) => !item.isArchived && item.contentDraftId === activeContentDraftRecord.id) : [],
    [activeContentDraftRecord, articleImages]
  );
  const activeContentDraftLinkedDeliverables = useMemo(
    () => activeContentDraftRecord ? deliverables.filter((item) => !item.isArchived && item.contentDraftId === activeContentDraftRecord.id) : [],
    [activeContentDraftRecord, deliverables]
  );
  const openDeliverablesProject = useMemo(() => projects.find((p) => p.id === openDeliverablesId) ?? null, [openDeliverablesId, projects]);
  const activeDeliverableRecord = useMemo(() => deliverables.find((item) => item.id === deliverableEditorId) ?? null, [deliverableEditorId, deliverables]);
  const selectedReviewDeliverable = useMemo(() => deliverables.find((item) => item.id === selectedReviewDeliverableId) ?? null, [deliverables, selectedReviewDeliverableId]);
  const visibleDeliverables = useMemo(
    () => [...deliverables].sort((a, b) => {
      if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }),
    [deliverables]
  );
  const activeDeliverableCount = useMemo(() => deliverables.filter((item) => !item.isArchived).length, [deliverables]);
  const archivedDeliverableCount = deliverables.length - activeDeliverableCount;
  const latestSelectedReview = useMemo(() => getMostRecentReview(deliverableReviews), [deliverableReviews]);
  const deliverableLinkedDraftRecord = useMemo(() => {
    const linkedDraftId = deliverableForm.contentDraftId ?? activeDeliverableRecord?.contentDraftId ?? null;
    return linkedDraftId ? contentDrafts.find((draft) => draft.id === linkedDraftId) ?? null : null;
  }, [activeDeliverableRecord?.contentDraftId, contentDrafts, deliverableForm.contentDraftId]);
  const deliverableLinkedImageRecord = useMemo(() => {
    const linkedImageId = deliverableForm.articleImageId ?? activeDeliverableRecord?.articleImageId ?? null;
    return linkedImageId ? articleImages.find((image) => image.id === linkedImageId) ?? null : null;
  }, [activeDeliverableRecord?.articleImageId, articleImages, deliverableForm.articleImageId]);
  const deliverableRelatedImages = useMemo(() => {
    const linkedDraftId = deliverableLinkedDraftRecord?.id ?? deliverableForm.contentDraftId ?? activeDeliverableRecord?.contentDraftId ?? null;
    const related = linkedDraftId
      ? articleImages.filter((image) => !image.isArchived && image.contentDraftId === linkedDraftId)
      : [];

    if (deliverableLinkedImageRecord && !related.some((image) => image.id === deliverableLinkedImageRecord.id)) {
      return [deliverableLinkedImageRecord, ...related];
    }

    return related;
  }, [
    activeDeliverableRecord?.contentDraftId,
    articleImages,
    deliverableForm.contentDraftId,
    deliverableLinkedDraftRecord?.id,
    deliverableLinkedImageRecord
  ]);
  const deliverableHasRecordedReference = Boolean(
    (deliverableForm.exportUrl ?? activeDeliverableRecord?.exportUrl ?? "").trim()
    || (deliverableForm.storageKey ?? activeDeliverableRecord?.storageKey ?? "").trim()
  );
  const deliverableReadinessBlockers = useMemo(() => {
    const blockers: string[] = [];

    if (!deliverableLinkedDraftRecord) {
      blockers.push("Link the approved content draft that this admin package is handing off.");
    } else if (!canPackageApprovedContentDraft(deliverableLinkedDraftRecord)) {
      blockers.push(`Linked draft is ${formatContentDraftStatus(deliverableLinkedDraftRecord.status).toLowerCase()}; ready-state packaging expects an approved draft.`);
    }

    if (deliverableRelatedImages.length === 0) {
      blockers.push("No same-project article image planning records are linked to this draft yet.");
    } else if (!deliverableRelatedImages.some((image) => canPackageApprovedArticleImage(image))) {
      blockers.push("Linked image planning exists, but no image is approved or final-ready yet.");
    }

    if (!deliverableHasRecordedReference) {
      blockers.push("No export or private-storage reference is recorded for the final admin handoff yet.");
    }

    if (deliverableStatusNeedsApprovedLinks(deliverableForm.status) && !deliverableFormHasReadyLinks(deliverableForm, contentDrafts, articleImages)) {
      blockers.push("Current ready-state packaging is missing the approved same-project draft or image links required by the guard.");
    }

    return blockers;
  }, [
    articleImages,
    contentDrafts,
    deliverableForm,
    deliverableHasRecordedReference,
    deliverableLinkedDraftRecord,
    deliverableRelatedImages
  ]);
  const deliverableDraftOptions = useMemo(() => {
    const eligible = articleImageDrafts.filter((draft) => draft.status === "APPROVED");
    const selectedDraft = articleImageDrafts.find((draft) => draft.id === deliverableForm.contentDraftId) ?? null;
    return selectedDraft && !eligible.some((draft) => draft.id === selectedDraft.id) ? [selectedDraft, ...eligible] : eligible;
  }, [articleImageDrafts, deliverableForm.contentDraftId]);
  const deliverableArticleImageOptions = useMemo(() => {
    const eligible = articleImages.filter((image) => !image.isArchived && ["APPROVED", "FINAL_READY"].includes(image.status));
    const selectedImage = articleImages.find((image) => image.id === deliverableForm.articleImageId) ?? null;
    return selectedImage && !eligible.some((image) => image.id === selectedImage.id) ? [selectedImage, ...eligible] : eligible;
  }, [articleImages, deliverableForm.articleImageId]);
  const openWorkflowRunsProject = useMemo(() => projects.find((p) => p.id === openWorkflowRunsId) ?? null, [openWorkflowRunsId, projects]);
  const workflowRunBeingEdited = useMemo(() => workflowRuns.find((run) => run.id === workflowRunEditorId) ?? null, [workflowRunEditorId, workflowRuns]);
  const workflowRunStatusOptions = useMemo(() => getWorkflowRunStatusOptions(workflowRunBeingEdited?.status ?? null), [workflowRunBeingEdited?.status]);
  const workflowRunStatusHelper = useMemo(() => getWorkflowRunStatusHelper(workflowRunBeingEdited?.status ?? null), [workflowRunBeingEdited?.status]);
  const isWorkflowRunStatusAllowed = workflowRunStatusOptions.includes(normalizeWorkflowRunStatus(workflowRunForm.status));
  const openResearchSourcesProject = useMemo(() => projects.find((p) => p.id === openResearchSourcesId) ?? null, [openResearchSourcesId, projects]);
  const contentDraftActionGuidance = useMemo(() => {
    if (!activeContentDraftRecord) {
      return "Mark ready for review only after the draft has both a title and body.";
    }
    if (activeContentDraftRecord.isArchived) {
      return "Archived drafts stay visible for admin history and cannot move through review actions.";
    }
    if (!activeContentDraftRecord.title.trim() || !activeContentDraftRecord.draftBody.trim()) {
      return "Mark ready for review requires both a title and draft body.";
    }
    if (activeContentDraftRecord.status === "READY_FOR_REVIEW") {
      return "This draft is already ready for review. Use Return to draft only when the workflow needs to move backward.";
    }
    if (activeContentDraftRecord.status !== "DRAFT") {
      return "Return to draft is available after review or revision states when the workflow needs another editing pass.";
    }
    return "Mark ready for review moves this draft into the admin review queue once title and body are complete.";
  }, [activeContentDraftRecord]);
  const articleImageActionGuidance = useMemo(() => {
    if (!activeArticleImageRecord) {
      return "Preview-ready requires a preview or final reference. Final-ready requires a final URL or storage key.";
    }
    if (activeArticleImageRecord.isArchived) {
      return "Archived image records remain visible for admin history and cannot use active workflow actions.";
    }
    const hasPreviewReference = Boolean((activeArticleImageRecord.previewImageUrl ?? "").trim() || (activeArticleImageRecord.finalImageUrl ?? "").trim());
    const hasFinalReference = Boolean((activeArticleImageRecord.finalImageUrl ?? "").trim() || (activeArticleImageRecord.storageKey ?? "").trim());
    if (!hasPreviewReference) {
      return "Mark preview ready and Request changes require a preview or final reference on the active image record.";
    }
    if (!hasFinalReference) {
      return "Mark final ready requires either a final image URL or storage key on the active image record.";
    }
    return "Use the image action buttons only after the linked draft and the required preview/final references are recorded.";
  }, [activeArticleImageRecord]);
  const deliverableActionGuidance = useMemo(() => {
    if (activeDeliverableRecord?.isArchived) {
      return "Restore applies only to archived deliverables and returns the record to Draft.";
    }
    if (!deliverableFormHasReadyLinks(deliverableForm, articleImageDrafts, articleImages)) {
      return "Ready, Delivered, and Accepted states require an approved same-project draft or approved/final-ready image link.";
    }
    if (deliverableStatusNeedsApprovedLinks(deliverableForm.status)) {
      return "This ready-state package is linked to approved same-project assets and can stay in the guarded packaging workflow.";
    }
    return "Mark ready and Internal accept stay guarded by approved same-project draft or image links.";
  }, [activeDeliverableRecord?.isArchived, articleImageDrafts, articleImages, deliverableForm]);
  const workflowRunActionGuidance = useMemo(() => {
    if (workflowRunExecutingId) {
      return "Execute is locked while the current local stub execution is in progress.";
    }
    if (!workflowRunBeingEdited) {
      return "Only Draft, Ready, or Failed runs can execute through the local stub. Save a run first to use Execute.";
    }
    if (!canExecuteWorkflowRun(workflowRunBeingEdited.status)) {
      return "This workflow run is not in an executable state. Use the allowed next status shown above before retrying.";
    }
    return "Execute uses the local stub only. Use [stub-fail] in admin notes when you need a controlled failure path.";
  }, [workflowRunBeingEdited, workflowRunExecutingId]);
  const isContentPlanBusy = contentPlanSaving || Boolean(contentPlanGeneratingItemId);
  const linkableProjects = useMemo(
    () => projectsList.filter((project) => project.clientId === draft.clientId),
    [draft.clientId, projectsList]
  );

  function openCreateModal() {
    setEditorProjectId(null);
    setDraft(emptyForm(clients[0]?.id ?? ""));
    setIsEditorOpen(true);
  }

  function openEditModal(project: AiDeliveryProjectSummary) {
    setEditorProjectId(project.id);
    setDraft({
      clientId: project.clientId ?? "",
      projectId: project.projectId ?? null,
      name: project.name,
      targetMonth: project.targetMonth ?? "",
      plannedContentScopeNotes: project.plannedContentScopeNotes ?? ""
    });
    setIsEditorOpen(true);
  }

  function closeProjectEditor() {
    setEditorProjectId(null);
    setDraft(emptyForm(clients[0]?.id ?? ""));
    setIsEditorOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const linkedProject = projectsList.find((project) => project.id === draft.projectId) ?? null;
      const ok = await onSave(editorProjectId, {
        ...draft,
        projectId: linkedProject?.clientId === draft.clientId ? draft.projectId : null
      });
      if (ok) {
        setEditorProjectId(null);
        setDraft(emptyForm());
        setIsEditorOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function uploadArticleImageFinalAsset(projectId: string, imageId: string) {
    const file = articleImageFinalAssetFiles[imageId] ?? null;
    if (!file || typeof onUploadArticleImageFinalAsset !== "function" || typeof onFetchArticleImages !== "function") return;
    setArticleImagesSaving(true);
    setArticleImagesError(null);
    setArticleImageUploadTargetId(imageId);
    try {
      await onUploadArticleImageFinalAsset(projectId, imageId, { file });
      const refreshedImages = await onFetchArticleImages(projectId);
      setArticleImages(refreshedImages);
      setArticleImageFinalAssetFiles((current) => ({ ...current, [imageId]: null }));
      const refreshedActiveImage = refreshedImages.find((item) => item.id === imageId) ?? null;
      if (refreshedActiveImage) {
        editArticleImage(refreshedActiveImage);
      }
    } catch (error) {
      setArticleImagesError(getErrorMessage(error, "Unable to upload the private final asset for this article image."));
    } finally {
      setArticleImageUploadTargetId(null);
      setArticleImagesSaving(false);
    }
  }

  async function openArticleImageDownload(projectId: string, imageId: string) {
    if (typeof onOpenArticleImage !== "function") return;
    setArticleImagesError(null);
    setArticleImageDownloadTargetId(imageId);
    try {
      await onOpenArticleImage(projectId, imageId);
    } catch (error) {
      setArticleImagesError(getErrorMessage(error, "Unable to open the private final asset for this article image."));
    } finally {
      setArticleImageDownloadTargetId(null);
    }
  }

  async function openBrief(projectId: string) {
    setOpenBriefId(projectId);
    setBriefLoading(true);
    setBriefError(null);
    setBriefDetail(null);
    try {
      if (typeof onFetchBrief === "function") {
        const b = await onFetchBrief(projectId);
        setBriefDetail(b);
      }
    } catch (error) {
      setBriefError(getErrorMessage(error, "Unable to load the current brief."));
    } finally {
      setBriefLoading(false);
    }
  }

  async function uploadDeliverableDocument(projectId: string, deliverableId: string) {
    const file = deliverableDocumentFiles[deliverableId] ?? null;
    if (!file || typeof onUploadDeliverableDocument !== "function" || typeof onFetchDeliverables !== "function") return;
    setDeliverablesSaving(true);
    setDeliverablesError(null);
    setDeliverableUploadTargetId(deliverableId);
    try {
      await onUploadDeliverableDocument(projectId, deliverableId, { file });
      const refreshedDeliverables = await onFetchDeliverables(projectId);
      setDeliverables(refreshedDeliverables);
      setDeliverableDocumentFiles((current) => ({ ...current, [deliverableId]: null }));
      const refreshedActiveDeliverable = refreshedDeliverables.find((item) => item.id === deliverableId) ?? null;
      if (refreshedActiveDeliverable) {
        editDeliverable(refreshedActiveDeliverable);
      }
      if (selectedReviewDeliverableId === deliverableId && typeof onFetchDeliverableReviews === "function") {
        setDeliverableReviews(await onFetchDeliverableReviews(projectId, deliverableId));
      }
    } catch (error) {
      setDeliverablesError(getErrorMessage(error, "Unable to upload the private document for this deliverable."));
    } finally {
      setDeliverableUploadTargetId(null);
      setDeliverablesSaving(false);
    }
  }

  async function openDeliverableDocument(projectId: string, deliverableId: string) {
    if (typeof onOpenDeliverableDocument !== "function") return;
    setDeliverablesError(null);
    setDeliverableDownloadTargetId(deliverableId);
    try {
      await onOpenDeliverableDocument(projectId, deliverableId);
    } catch (error) {
      setDeliverablesError(getErrorMessage(error, "Unable to open the private document for this deliverable."));
    } finally {
      setDeliverableDownloadTargetId(null);
    }
  }

  async function handleSaveBrief(projectId: string) {
    if (!briefDetail) return;
    if (typeof onSaveBrief !== "function") return;
    setBriefError(null);
    try {
      const ok = await onSaveBrief(projectId, {
        clientPriorities: briefDetail.clientPriorities,
        productsServicesFocus: briefDetail.productsServicesFocus,
        targetAudience: briefDetail.targetAudience,
        marketsCompetitors: briefDetail.marketsCompetitors,
        notes: briefDetail.notes
      });
      if (ok) {
        setOpenBriefId(null);
        setBriefDetail(null);
      }
    } catch (error) {
      setBriefError(getErrorMessage(error, "Unable to save the current brief."));
    }
  }

  async function openContentPlan(projectId: string) {
    setOpenContentPlanId(projectId);
    setContentPlanLoading(true);
    setContentPlanError(null);
    setContentPlanGenerationMessage(null);
    setContentPlanGeneratingItemId(null);
    setContentPlanDetail(null);
    setContentPlanItems([]);
    try {
      const [plan, drafts] = await Promise.all([
        typeof onFetchContentPlan === "function" ? onFetchContentPlan(projectId) : Promise.resolve(null),
        typeof onFetchContentDrafts === "function" ? onFetchContentDrafts(projectId) : Promise.resolve(contentDrafts)
      ]);
      if (typeof onFetchContentPlan === "function") {
        setContentPlanDetail(plan);
        setContentPlanItems(plan?.items.map(itemDraftFromPlanItem) ?? []);
      }
      setContentDrafts(drafts);
    } catch (error) {
      setContentPlanError(getErrorMessage(error, "Unable to load the current content plan."));
    } finally {
      setContentPlanLoading(false);
    }
  }

  async function handleCreateContentPlan(projectId: string) {
    if (typeof onCreateContentPlan !== "function") return;
    setContentPlanSaving(true);
    setContentPlanError(null);
    setContentPlanGenerationMessage(null);
    try {
      const plan = await onCreateContentPlan(projectId);
      if (plan) {
        setContentPlanDetail(plan);
        setContentPlanItems(plan.items.map(itemDraftFromPlanItem));
      }
    } catch (error) {
      setContentPlanError(getErrorMessage(error, "Unable to create a content plan for this project."));
    } finally {
      setContentPlanSaving(false);
    }
  }

  async function handleSaveContentPlan(projectId: string) {
    if (typeof onSaveContentPlan !== "function") return;
    setContentPlanSaving(true);
    setContentPlanError(null);
    setContentPlanGenerationMessage(null);
    try {
      const plan = await onSaveContentPlan(projectId, {
        items: contentPlanItems.map((item, index) => ({
          title: item.title.trim(),
          targetKeyword: item.targetKeyword.trim() || null,
          contentType: item.contentType.trim() || "article",
          notes: item.notes.trim() || null,
          sortOrder: index + 1,
          approvalStatus: item.approvalStatus || "DRAFT",
          clientComment: item.clientComment.trim() || null
        }))
      });
      if (plan) {
        setContentPlanDetail(plan);
        setContentPlanItems(plan.items.map(itemDraftFromPlanItem));
      }
    } catch (error) {
      setContentPlanError(getErrorMessage(error, "Unable to save this content plan."));
    } finally {
      setContentPlanSaving(false);
    }
  }

  async function handleContentPlanAction(
    projectId: string,
    action: ((projectId: string) => Promise<AiDeliveryContentPlanSummary | null>) | undefined
  ) {
    if (typeof action !== "function") return;
    setContentPlanSaving(true);
    setContentPlanError(null);
    setContentPlanGenerationMessage(null);
    try {
      const plan = await action(projectId);
      if (plan) {
        setContentPlanDetail(plan);
        setContentPlanItems(plan.items.map(itemDraftFromPlanItem));
      }
    } catch (error) {
      setContentPlanError(getErrorMessage(error, "Unable to update the current content plan status."));
    } finally {
      setContentPlanSaving(false);
    }
  }

  function closeContentPlan() {
    setOpenContentPlanId(null);
    setContentPlanError(null);
    setContentPlanGenerationMessage(null);
    setContentPlanGeneratingItemId(null);
    setContentPlanDetail(null);
    setContentPlanItems([]);
  }

  async function openContentDrafts(projectId: string) {
    setOpenContentDraftsId(projectId);
    setContentDraftsLoading(true);
    setContentDraftsError(null);
    setContentDraftHandoffMessage(null);
    setContentDrafts([]);
    setContentDraftEditorId(null);
    setContentDraftForm(emptyContentDraft());
    try {
      const [drafts, plan, images, deliverableItems] = await Promise.all([
        typeof onFetchContentDrafts === "function" ? onFetchContentDrafts(projectId) : Promise.resolve([]),
        typeof onFetchContentPlan === "function" ? onFetchContentPlan(projectId) : Promise.resolve(null),
        typeof onFetchArticleImages === "function" ? onFetchArticleImages(projectId) : Promise.resolve([]),
        typeof onFetchDeliverables === "function" ? onFetchDeliverables(projectId) : Promise.resolve([])
      ]);
      setContentDrafts(drafts);
      setContentDraftPlan(plan);
      setArticleImages(images);
      setDeliverables(deliverableItems);
    } catch (error) {
      setContentDraftsError(getErrorMessage(error, "Unable to load content production records for this project."));
    } finally {
      setContentDraftsLoading(false);
    }
  }

  function editContentDraft(draftItem: AiDeliveryContentDraftSummary) {
    setContentDraftHandoffMessage(null);
    setContentDraftEditorId(draftItem.id);
    setContentDraftForm({
      contentPlanItemId: draftItem.contentPlanItemId,
      title: draftItem.title,
      slug: draftItem.slug ?? "",
      draftBody: draftItem.draftBody,
      status: draftItem.status,
      notes: draftItem.notes ?? ""
    });
  }

  function startContentDraftFromPlanItem(item: AiDeliveryContentPlanItemSummary) {
    setContentDraftHandoffMessage(null);
    const linkedDraft = contentDrafts.find((draftItem) => draftItem.contentPlanItemId === item.id && !draftItem.isArchived) ?? null;
    if (linkedDraft) {
      editContentDraft(linkedDraft);
      return;
    }

    setContentDraftEditorId(null);
    setContentDraftForm({
      contentPlanItemId: item.id ?? null,
      title: item.title,
      slug: "",
      draftBody: "",
      status: "DRAFT",
      notes: item.notes ?? ""
    });
  }

  async function saveContentDraft(projectId: string) {
    if (typeof onSaveContentDraft !== "function") return;
    setContentDraftsSaving(true);
    setContentDraftsError(null);
    try {
      const saved = await onSaveContentDraft(projectId, contentDraftEditorId, contentDraftForm);
      if (saved && typeof onFetchContentDrafts === "function") {
        const refreshedDrafts = await onFetchContentDrafts(projectId);
        setContentDrafts(refreshedDrafts);
        const refreshedActiveDraft = refreshedDrafts.find((draftItem) => draftItem.id === saved.id) ?? null;
        if (refreshedActiveDraft) {
          setContentDraftEditorId(refreshedActiveDraft.id);
          setContentDraftForm({
            contentPlanItemId: refreshedActiveDraft.contentPlanItemId,
            title: refreshedActiveDraft.title,
            slug: refreshedActiveDraft.slug ?? "",
            draftBody: refreshedActiveDraft.draftBody,
            status: refreshedActiveDraft.status,
            notes: refreshedActiveDraft.notes ?? ""
          });
        } else {
          setContentDraftEditorId(null);
          setContentDraftForm(emptyContentDraft());
        }
      }
    } catch (error) {
      setContentDraftsError(getErrorMessage(error, "Unable to save this content draft."));
    } finally {
      setContentDraftsSaving(false);
    }
  }

  async function archiveContentDraft(projectId: string, draftId: string) {
    if (typeof onArchiveContentDraft !== "function" || typeof onFetchContentDrafts !== "function") return;
    setContentDraftsSaving(true);
    setContentDraftsError(null);
    try {
      await onArchiveContentDraft(projectId, draftId);
      setContentDrafts(await onFetchContentDrafts(projectId));
    } catch (error) {
      setContentDraftsError(getErrorMessage(error, "Unable to archive this content draft."));
    } finally {
      setContentDraftsSaving(false);
    }
  }

  async function requestContentDraftReview(projectId: string, draftId: string) {
    if (typeof onRequestContentDraftReview !== "function" || typeof onFetchContentDrafts !== "function") return;
    setContentDraftsSaving(true);
    setContentDraftsError(null);
    try {
      await onRequestContentDraftReview(projectId, draftId);
      const refreshedDrafts = await onFetchContentDrafts(projectId);
      setContentDrafts(refreshedDrafts);
      const refreshedActiveDraft = refreshedDrafts.find((item) => item.id === draftId) ?? null;
      if (refreshedActiveDraft) {
        setContentDraftEditorId(refreshedActiveDraft.id);
        setContentDraftForm({
          contentPlanItemId: refreshedActiveDraft.contentPlanItemId,
          title: refreshedActiveDraft.title,
          slug: refreshedActiveDraft.slug ?? "",
          draftBody: refreshedActiveDraft.draftBody,
          status: refreshedActiveDraft.status,
          notes: refreshedActiveDraft.notes ?? ""
        });
      }
    } catch (error) {
      setContentDraftsError(getErrorMessage(error, "Unable to move this draft into review."));
    } finally {
      setContentDraftsSaving(false);
    }
  }

  async function returnContentDraftToDraft(projectId: string, draftId: string) {
    if (typeof onReturnContentDraftToDraft !== "function" || typeof onFetchContentDrafts !== "function") return;
    setContentDraftsSaving(true);
    setContentDraftsError(null);
    try {
      await onReturnContentDraftToDraft(projectId, draftId);
      const refreshedDrafts = await onFetchContentDrafts(projectId);
      setContentDrafts(refreshedDrafts);
      const refreshedActiveDraft = refreshedDrafts.find((item) => item.id === draftId) ?? null;
      if (refreshedActiveDraft) {
        editContentDraft(refreshedActiveDraft);
      }
    } catch (error) {
      setContentDraftsError(getErrorMessage(error, "Unable to return this draft to Draft."));
    } finally {
      setContentDraftsSaving(false);
    }
  }

  function closeContentDrafts() {
    setOpenContentDraftsId(null);
    setContentDraftsError(null);
    setContentDraftHandoffMessage(null);
    setContentDrafts([]);
    setContentDraftEditorId(null);
    setContentDraftForm(emptyContentDraft());
    setContentDraftPlan(null);
  }

  async function openArticleImages(projectId: string, options?: { contentDraftId?: string | null; articleImageId?: string | null }) {
    setOpenArticleImagesId(projectId);
    setArticleImagesLoading(true);
    setArticleImagesError(null);
    setArticleImages([]);
    setArticleImageFinalAssetFiles({});
    setArticleImageUploadTargetId(null);
    setArticleImageDownloadTargetId(null);
    setArticleImageDrafts([]);
    setArticleImageEditorId(null);
    setArticleImageForm(emptyArticleImage());
    try {
      const [images, drafts] = await Promise.all([
        typeof onFetchArticleImages === "function" ? onFetchArticleImages(projectId) : Promise.resolve([]),
        typeof onFetchContentDrafts === "function" ? onFetchContentDrafts(projectId) : Promise.resolve([])
      ]);
      const activeDrafts = drafts.filter((draftItem) => !draftItem.isArchived);
      const preferredDraftId = options?.contentDraftId ?? activeDrafts[0]?.id ?? "";
      const preferredImage = options?.articleImageId
        ? images.find((image) => image.id === options.articleImageId) ?? null
        : images.find((image) => !image.isArchived && image.contentDraftId === preferredDraftId) ?? null;
      setArticleImages(images);
      setArticleImageFinalAssetFiles({});
      setContentDrafts(drafts);
      setArticleImageDrafts(activeDrafts);
      if (preferredImage) {
        editArticleImage(preferredImage);
      } else {
        setArticleImageForm((current) => ({ ...current, contentDraftId: preferredDraftId || current.contentDraftId }));
      }
    } catch (error) {
      setArticleImagesError(getErrorMessage(error, "Unable to load article image records for this project."));
    } finally {
      setArticleImagesLoading(false);
    }
  }

  async function handoffContentDraftToArticleImages(projectId: string, draftId: string) {
    setOpenContentDraftsId(null);
    await openArticleImages(projectId, { contentDraftId: draftId });
  }

  function editArticleImage(image: AiDeliveryArticleImageSummary) {
    setArticleImageEditorId(image.id);
    setArticleImageForm({
      contentDraftId: image.contentDraftId,
      title: image.title,
      prompt: image.prompt,
      styleNotes: image.styleNotes ?? "",
      status: image.status,
      previewImageUrl: image.previewImageUrl ?? "",
      finalImageUrl: image.finalImageUrl ?? "",
      storageKey: image.storageKey ?? "",
      notes: image.notes ?? ""
    });
  }

  async function saveArticleImage(projectId: string) {
    if (typeof onSaveArticleImage !== "function") return;
    setArticleImagesSaving(true);
    setArticleImagesError(null);
    try {
      const saved = await onSaveArticleImage(projectId, articleImageEditorId, articleImageForm);
      if (saved && typeof onFetchArticleImages === "function") {
        setArticleImages(await onFetchArticleImages(projectId));
        setArticleImageEditorId(null);
        setArticleImageForm((current) => ({ ...emptyArticleImage(), contentDraftId: current.contentDraftId }));
      }
    } catch (error) {
      setArticleImagesError(getErrorMessage(error, "Unable to save this article image record."));
    } finally {
      setArticleImagesSaving(false);
    }
  }

  async function archiveArticleImage(projectId: string, imageId: string) {
    if (typeof onArchiveArticleImage !== "function" || typeof onFetchArticleImages !== "function") return;
    setArticleImagesSaving(true);
    setArticleImagesError(null);
    try {
      await onArchiveArticleImage(projectId, imageId);
      setArticleImages(await onFetchArticleImages(projectId));
    } catch (error) {
      setArticleImagesError(getErrorMessage(error, "Unable to archive this article image record."));
    } finally {
      setArticleImagesSaving(false);
    }
  }

  async function runArticleImageAction(
    projectId: string,
    imageId: string,
    action: ((projectId: string, imageId: string) => Promise<AiDeliveryArticleImageSummary | null>) | undefined
  ) {
    if (typeof action !== "function" || typeof onFetchArticleImages !== "function") return;
    setArticleImagesSaving(true);
    setArticleImagesError(null);
    try {
      await action(projectId, imageId);
      const refreshedImages = await onFetchArticleImages(projectId);
      setArticleImages(refreshedImages);
      const refreshedActiveImage = refreshedImages.find((item) => item.id === imageId) ?? null;
      if (refreshedActiveImage) {
        editArticleImage(refreshedActiveImage);
      }
    } catch (error) {
      setArticleImagesError(getErrorMessage(error, "Unable to update this article image status."));
    } finally {
      setArticleImagesSaving(false);
    }
  }

  async function markArticleImagePreviewReady(projectId: string, imageId: string) {
    await runArticleImageAction(projectId, imageId, onMarkArticleImagePreviewReady);
  }

  async function requestArticleImageChanges(projectId: string, imageId: string) {
    await runArticleImageAction(projectId, imageId, onRequestArticleImageChanges);
  }

  async function approveArticleImage(projectId: string, imageId: string) {
    await runArticleImageAction(projectId, imageId, onApproveArticleImage);
  }

  async function markArticleImageFinalReady(projectId: string, imageId: string) {
    await runArticleImageAction(projectId, imageId, onMarkArticleImageFinalReady);
  }

  function closeArticleImages() {
    setOpenArticleImagesId(null);
    setArticleImagesError(null);
    setArticleImages([]);
    setArticleImageDrafts([]);
    setArticleImageEditorId(null);
    setArticleImageForm(emptyArticleImage());
  }

  async function openDeliverables(
    projectId: string,
    options?: { contentDraftId?: string | null; articleImageId?: string | null; deliverableId?: string | null }
  ) {
    setOpenDeliverablesId(projectId);
    setDeliverablesLoading(true);
    setDeliverablesError(null);
    setDeliverableReviewsError(null);
    setDeliverables([]);
    setDeliverableEditorId(null);
    setDeliverableForm({ contentDraftId: null, articleImageId: null, title: "", description: null, deliveryType: "CONTENT_PACKAGE", status: "DRAFT", exportUrl: null, storageKey: null, notes: null, isArchived: false });
    setSelectedReviewDeliverableId(null);
    setDeliverableReviews([]);
    setDeliverableReviewEditorId(null);
    setDeliverableReviewForm(emptyDeliverableReview());
    try {
      const [items, drafts, images] = await Promise.all([
        typeof onFetchDeliverables === "function" ? onFetchDeliverables(projectId) : Promise.resolve([]),
        typeof onFetchContentDrafts === "function" ? onFetchContentDrafts(projectId) : Promise.resolve([]),
        typeof onFetchArticleImages === "function" ? onFetchArticleImages(projectId) : Promise.resolve([])
      ]);
      const activeDrafts = drafts.filter((d) => !d.isArchived);
      const preferredDraftId = options?.contentDraftId ?? activeDrafts[0]?.id ?? null;
      const preferredDeliverable = options?.deliverableId
        ? items.find((item) => item.id === options.deliverableId) ?? null
        : items.find((item) => !item.isArchived && (
          (options?.articleImageId ? item.articleImageId === options.articleImageId : false)
          || (preferredDraftId ? item.contentDraftId === preferredDraftId : false)
        )) ?? null;
      setDeliverables(items);
      setDeliverableDocumentFiles({});
      setContentDrafts(drafts);
      setArticleImageDrafts(activeDrafts);
      setArticleImages(images);
      if (preferredDeliverable) {
        editDeliverable(preferredDeliverable);
      } else {
        setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({
          ...current,
          contentDraftId: preferredDraftId,
          articleImageId: options?.articleImageId ?? null
        }));
      }
    } catch (error) {
      setDeliverablesError(getErrorMessage(error, "Unable to load deliverables for this project."));
    } finally {
      setDeliverablesLoading(false);
    }
  }

  async function handoffContentDraftToDeliverables(projectId: string, draftId: string) {
    setOpenContentDraftsId(null);
    await openDeliverables(projectId, { contentDraftId: draftId });
  }

  async function handoffArticleImageToDeliverables(projectId: string, image: AiDeliveryArticleImageSummary) {
    setOpenArticleImagesId(null);
    await openDeliverables(projectId, { contentDraftId: image.contentDraftId, articleImageId: image.id });
  }

  function editDeliverable(item: AiDeliveryDeliverableSummary) {
    setDeliverableEditorId(item.id);
    setDeliverableForm({
      contentDraftId: item.contentDraftId ?? null,
      articleImageId: item.articleImageId ?? null,
      title: item.title,
      description: item.description ?? null,
      deliveryType: item.deliveryType,
      status: item.status,
      exportUrl: item.exportUrl ?? null,
      storageKey: item.storageKey ?? null,
      notes: item.notes ?? null,
      isArchived: item.isArchived
    });
  }

  async function saveDeliverable(projectId: string) {
    if (typeof onSaveDeliverable !== "function") return;
    setDeliverablesSaving(true);
    setDeliverablesError(null);
    try {
      const saved = await onSaveDeliverable(projectId, deliverableEditorId, deliverableForm);
      if (saved && typeof onFetchDeliverables === "function") {
        setDeliverables(await onFetchDeliverables(projectId));
        setDeliverableEditorId(null);
        setDeliverableForm({ contentDraftId: null, articleImageId: null, title: "", description: null, deliveryType: "CONTENT_PACKAGE", status: "DRAFT", exportUrl: null, storageKey: null, notes: null, isArchived: false });
      }
    } catch (error) {
      setDeliverablesError(getErrorMessage(error, "Unable to save this deliverable."));
    } finally {
      setDeliverablesSaving(false);
    }
  }

  async function runDeliverableAction(
    projectId: string,
    deliverableId: string,
    action: ((projectId: string, deliverableId: string) => Promise<AiDeliveryDeliverableSummary | null>) | undefined
  ) {
    if (typeof action !== "function" || typeof onFetchDeliverables !== "function") return;
    setDeliverablesSaving(true);
    setDeliverablesError(null);
    try {
      await action(projectId, deliverableId);
      const refreshedDeliverables = await onFetchDeliverables(projectId);
      setDeliverables(refreshedDeliverables);
      const refreshedActiveDeliverable = refreshedDeliverables.find((item) => item.id === deliverableId) ?? null;
      if (refreshedActiveDeliverable) {
        editDeliverable(refreshedActiveDeliverable);
      }
      if (selectedReviewDeliverableId === deliverableId && typeof onFetchDeliverableReviews === "function") {
        setDeliverableReviews(await onFetchDeliverableReviews(projectId, deliverableId));
      }
    } catch (error) {
      setDeliverablesError(getErrorMessage(error, "Unable to update this deliverable."));
    } finally {
      setDeliverablesSaving(false);
    }
  }

  async function markDeliverableReady(projectId: string, deliverableId: string) {
    await runDeliverableAction(projectId, deliverableId, onMarkDeliverableReady);
  }

  async function requestDeliverableRevision(projectId: string, deliverableId: string) {
    await runDeliverableAction(projectId, deliverableId, onRequestDeliverableRevision);
  }

  async function acceptDeliverable(projectId: string, deliverableId: string) {
    await runDeliverableAction(projectId, deliverableId, onAcceptDeliverable);
  }

  async function archiveDeliverable(projectId: string, deliverableId: string) {
    if (typeof onArchiveDeliverable !== "function") return;
    await runDeliverableAction(projectId, deliverableId, async (activeProjectId, activeDeliverableId) => {
      const archived = await onArchiveDeliverable(activeProjectId, activeDeliverableId);
      return archived ? ({ id: activeDeliverableId } as AiDeliveryDeliverableSummary) : null;
    });
  }

  async function restoreDeliverable(projectId: string, deliverableId: string) {
    await runDeliverableAction(projectId, deliverableId, onRestoreDeliverable);
  }

  async function openDeliverableReviews(projectId: string, deliverableId: string) {
    setSelectedReviewDeliverableId(deliverableId);
    setDeliverableReviewsLoading(true);
    setDeliverableReviewsError(null);
    setDeliverableReviews([]);
    setDeliverableReviewEditorId(null);
    setDeliverableReviewForm(emptyDeliverableReview());
    try {
      if (typeof onFetchDeliverableReviews === "function") {
        setDeliverableReviews(await onFetchDeliverableReviews(projectId, deliverableId));
      }
    } catch (error) {
      setDeliverableReviewsError(getErrorMessage(error, "Unable to load review placeholders for this deliverable."));
    } finally {
      setDeliverableReviewsLoading(false);
    }
  }

  function editDeliverableReview(review: AiDeliveryDeliverableReviewSummary) {
    setDeliverableReviewEditorId(review.id);
    setDeliverableReviewForm({
      status: review.status,
      reviewerName: review.reviewerName ?? "",
      reviewNotes: review.reviewNotes ?? ""
    });
  }

  async function saveDeliverableReview(projectId: string) {
    if (!selectedReviewDeliverableId || typeof onSaveDeliverableReview !== "function") return;
    setDeliverableReviewsSaving(true);
    setDeliverableReviewsError(null);
    try {
      const saved = await onSaveDeliverableReview(projectId, selectedReviewDeliverableId, deliverableReviewEditorId, deliverableReviewForm);
      if (saved && typeof onFetchDeliverableReviews === "function") {
        setDeliverableReviews(await onFetchDeliverableReviews(projectId, selectedReviewDeliverableId));
        setDeliverableReviewEditorId(null);
        setDeliverableReviewForm(emptyDeliverableReview());
      }
    } catch (error) {
      setDeliverableReviewsError(getErrorMessage(error, "Unable to save this review placeholder."));
    } finally {
      setDeliverableReviewsSaving(false);
    }
  }

  function closeDeliverables() {
    setOpenDeliverablesId(null);
    setDeliverables([]);
    setDeliverablesError(null);
    setDeliverableDocumentFiles({});
    setDeliverableUploadTargetId(null);
    setDeliverableDownloadTargetId(null);
    setDeliverableEditorId(null);
    setDeliverableForm({ contentDraftId: null, articleImageId: null, title: "", description: null, deliveryType: "CONTENT_PACKAGE", status: "DRAFT", exportUrl: null, storageKey: null, notes: null, isArchived: false });
    setSelectedReviewDeliverableId(null);
    setDeliverableReviews([]);
    setDeliverableReviewsError(null);
    setDeliverableReviewEditorId(null);
    setDeliverableReviewForm(emptyDeliverableReview());
  }

  async function openWorkflowRuns(projectId: string) {
    setOpenWorkflowRunsId(projectId);
    setWorkflowRunsLoading(true);
    setWorkflowRunsError(null);
    setWorkflowRuns([]);
    setWorkflowRunEditorId(null);
    setWorkflowRunForm(emptyWorkflowRun());
    try {
      if (typeof onFetchWorkflowRuns === "function") {
        setWorkflowRuns(await onFetchWorkflowRuns(projectId));
      }
    } catch (error) {
      setWorkflowRunsError(getErrorMessage(error, "Unable to load workflow runs for this project."));
    } finally {
      setWorkflowRunsLoading(false);
    }
  }

  function editWorkflowRun(run: AiDeliveryWorkflowRunSummary) {
    setWorkflowRunEditorId(run.id);
    setWorkflowRunForm({
      status: run.status,
      adminNotes: run.adminNotes ?? "",
      resultPlaceholder: run.resultPlaceholder ?? ""
    });
  }

  async function saveWorkflowRun(projectId: string) {
    if (typeof onSaveWorkflowRun !== "function") return;
    if (!isWorkflowRunStatusAllowed) return;
    setWorkflowRunsSaving(true);
    setWorkflowRunsError(null);
    try {
      const saved = await onSaveWorkflowRun(projectId, workflowRunEditorId, workflowRunForm);
      if (saved && typeof onFetchWorkflowRuns === "function") {
        setWorkflowRuns(await onFetchWorkflowRuns(projectId));
        setWorkflowRunEditorId(null);
        setWorkflowRunForm(emptyWorkflowRun());
      }
    } catch (error) {
      setWorkflowRunsError(getErrorMessage(error, "Unable to save this workflow run."));
    } finally {
      setWorkflowRunsSaving(false);
    }
  }

  async function executeWorkflowRun(projectId: string, workflowRunId: string, input?: { contentPlanItemId?: string | null }) {
    if (typeof onExecuteWorkflowRun !== "function") return;
    setWorkflowRunExecutingId(workflowRunId);
    setWorkflowRunsError(null);
    try {
      const executed = await onExecuteWorkflowRun(projectId, workflowRunId, input);
      if (executed && typeof onFetchWorkflowRuns === "function") {
        setWorkflowRuns(await onFetchWorkflowRuns(projectId));
        setWorkflowRunEditorId(null);
        setWorkflowRunForm(emptyWorkflowRun());
      }
    } catch (error) {
      setWorkflowRunsError(getErrorMessage(error, "Unable to execute this workflow run."));
    } finally {
      setWorkflowRunExecutingId(null);
    }
  }

  async function generateContentDraftFromPlanItem(projectId: string, item: AiDeliveryContentPlanItemSummary) {
    if (!item.id || typeof onSaveWorkflowRun !== "function" || typeof onExecuteWorkflowRun !== "function" || typeof onFetchContentDrafts !== "function") {
      return;
    }

    setContentPlanGeneratingItemId(item.id);
    setContentPlanError(null);
    setContentPlanGenerationMessage(null);

    try {
      const createdRun = await onSaveWorkflowRun(projectId, null, {
        status: "DRAFT",
        adminNotes: `Generate admin review content draft from content plan item: ${item.title}`,
        resultPlaceholder: ""
      });

      if (!createdRun?.id) {
        setContentPlanError("Unable to create the workflow run needed for admin draft generation.");
        return;
      }

      const executedRun = await onExecuteWorkflowRun(projectId, createdRun.id, { contentPlanItemId: item.id });
      if (typeof onFetchWorkflowRuns === "function" && openWorkflowRunsId === projectId) {
        setWorkflowRuns(await onFetchWorkflowRuns(projectId));
      }

      if (!executedRun) {
        setContentPlanError("Unable to execute the workflow run for this content plan item.");
        return;
      }

      const [drafts, plan] = await Promise.all([
        onFetchContentDrafts(projectId),
        typeof onFetchContentPlan === "function" ? onFetchContentPlan(projectId) : Promise.resolve(contentPlanDetail)
      ]);
      const linkedDraft = drafts.find((draftItem) => draftItem.contentPlanItemId === item.id && !draftItem.isArchived) ?? null;

      if (!linkedDraft) {
        if (executedRun.status === "FAILED") {
          setContentPlanError(executedRun.executionError ?? "Admin draft generation failed in the current workflow run.");
        } else {
          setContentPlanGenerationMessage("Workflow run completed for admin review, but no linked content draft was persisted. Review the workflow result before retrying.");
        }
        return;
      }

      setContentPlanGenerationMessage(`Admin draft generation completed for "${item.title}". Review the generated draft below before any review handoff.`);
      setContentDraftHandoffMessage(`Generated draft handoff: "${item.title}" is open for admin editing and internal review preparation only. This does not publish, deliver to the client, or send content to WordPress.`);
      setContentDraftsError(null);
      setContentDrafts(drafts);
      setContentDraftPlan(plan);
      setContentDraftEditorId(linkedDraft.id);
      setContentDraftForm({
        contentPlanItemId: linkedDraft.contentPlanItemId,
        title: linkedDraft.title,
        slug: linkedDraft.slug ?? "",
        draftBody: linkedDraft.draftBody,
        status: linkedDraft.status,
        notes: linkedDraft.notes ?? ""
      });
      setOpenContentPlanId(null);
      setOpenContentDraftsId(projectId);
    } catch (error) {
      setContentPlanError(getErrorMessage(error, "Unable to generate an admin content draft from this content plan item."));
    } finally {
      setContentPlanGeneratingItemId(null);
    }
  }

  function closeWorkflowRuns() {
    setOpenWorkflowRunsId(null);
    setWorkflowRunsError(null);
    setWorkflowRuns([]);
    setWorkflowRunEditorId(null);
    setWorkflowRunForm(emptyWorkflowRun());
    setWorkflowRunExecutingId(null);
  }

  async function loadResearchSources(projectId: string) {
    const [requests, summaries, sources, runs] = await Promise.all([
      typeof onFetchResearchRequests === "function" ? onFetchResearchRequests(projectId) : Promise.resolve([]),
      typeof onFetchResearchSummaries === "function" ? onFetchResearchSummaries(projectId) : Promise.resolve([]),
      typeof onFetchResearchSources === "function" ? onFetchResearchSources(projectId) : Promise.resolve([]),
      typeof onFetchWorkflowRuns === "function" ? onFetchWorkflowRuns(projectId) : Promise.resolve([])
    ]);
    setResearchRequests(requests);
    setResearchSummaries(summaries);
    setResearchSources(sources);
    setResearchWorkflowRuns(runs);
  }

  async function openResearchSources(projectId: string) {
    setOpenResearchSourcesId(projectId);
    setResearchLoading(true);
    setResearchError(null);
    setResearchRequests([]);
    setResearchSummaries([]);
    setResearchSources([]);
    setResearchWorkflowRuns([]);
    setResearchRequestEditorId(null);
    setResearchRequestForm(emptyResearchRequest());
    setResearchSummaryEditorId(null);
    setResearchSummaryForm(emptyResearchSummary());
    setResearchSourceEditorId(null);
    setResearchSourceForm(emptyResearchSource());
    try {
      await loadResearchSources(projectId);
    } catch (error) {
      setResearchError(getErrorMessage(error, "Unable to load research records for this project."));
    } finally {
      setResearchLoading(false);
    }
  }

  function editResearchRequest(request: AiDeliveryResearchRequestSummary) {
    setResearchRequestEditorId(request.id);
    setResearchRequestForm({
      workflowRunId: request.workflowRunId,
      title: request.title,
      description: request.description ?? "",
      requestType: request.requestType ?? "",
      status: request.status
    });
  }

  function editResearchSource(source: AiDeliveryResearchSourceSummary) {
    setResearchSourceEditorId(source.id);
    setResearchSourceForm(researchSourceFormFromSummary(source));
  }

  function editResearchSummary(summary: AiDeliveryResearchSummarySummary) {
    setResearchSummaryEditorId(summary.id);
    setResearchSummaryForm(researchSummaryFormFromSummary(summary));
  }

  async function saveResearchRequest(projectId: string) {
    if (typeof onSaveResearchRequest !== "function" || !researchRequestForm.title.trim()) return;
    setResearchSaving(true);
    setResearchError(null);
    try {
      const saved = await onSaveResearchRequest(projectId, researchRequestEditorId, researchRequestForm);
      if (saved) {
        await loadResearchSources(projectId);
        setResearchRequestEditorId(null);
        setResearchRequestForm(emptyResearchRequest());
      }
    } catch (error) {
      setResearchError(getErrorMessage(error, "Unable to save this research request."));
    } finally {
      setResearchSaving(false);
    }
  }

  async function saveResearchSource(projectId: string) {
    if (typeof onSaveResearchSource !== "function" || !researchSourceForm.sourceUrl.trim()) return;
    setResearchSaving(true);
    setResearchError(null);
    try {
      const saved = await onSaveResearchSource(projectId, researchSourceEditorId, researchSourceForm);
      if (saved) {
        await loadResearchSources(projectId);
        setResearchSourceEditorId(null);
        setResearchSourceForm(emptyResearchSource());
      }
    } catch (error) {
      setResearchError(getErrorMessage(error, "Unable to save this research source."));
    } finally {
      setResearchSaving(false);
    }
  }

  async function saveResearchSummary(projectId: string) {
    if (typeof onSaveResearchSummary !== "function" || !researchSummaryForm.title.trim() || !researchSummaryForm.summaryText.trim()) return;
    setResearchSaving(true);
    setResearchError(null);
    try {
      const saved = await onSaveResearchSummary(projectId, researchSummaryEditorId, researchSummaryForm);
      if (saved) {
        await loadResearchSources(projectId);
        setResearchSummaryEditorId(null);
        setResearchSummaryForm(emptyResearchSummary());
      }
    } catch (error) {
      setResearchError(getErrorMessage(error, "Unable to save this research summary."));
    } finally {
      setResearchSaving(false);
    }
  }

  async function setResearchSummaryStatus(projectId: string, summary: AiDeliveryResearchSummarySummary, status: string) {
    if (typeof onSaveResearchSummary !== "function") return;
    setResearchSaving(true);
    setResearchError(null);
    try {
      const saved = await onSaveResearchSummary(projectId, summary.id, { ...researchSummaryFormFromSummary(summary), status });
      if (saved) {
        await loadResearchSources(projectId);
      }
    } catch (error) {
      setResearchError(getErrorMessage(error, "Unable to update this research summary status."));
    } finally {
      setResearchSaving(false);
    }
  }

  async function applyResearchSummaryToBrief(projectId: string, summaryId: string) {
    if (typeof onApplyResearchSummaryToBrief !== "function") return;
    setResearchSaving(true);
    setResearchError(null);
    try {
      const applied = await onApplyResearchSummaryToBrief(projectId, summaryId);
      if (applied?.researchSummary) {
        await loadResearchSources(projectId);
      }
    } catch (error) {
      setResearchError(getErrorMessage(error, "Unable to apply this research summary to brief notes."));
    } finally {
      setResearchSaving(false);
    }
  }

  async function setResearchSourceStatus(projectId: string, source: AiDeliveryResearchSourceSummary, status: string) {
    if (typeof onSaveResearchSource !== "function") return;
    setResearchSaving(true);
    setResearchError(null);
    try {
      const saved = await onSaveResearchSource(projectId, source.id, { ...researchSourceFormFromSummary(source), status });
      if (saved) {
        await loadResearchSources(projectId);
      }
    } catch (error) {
      setResearchError(getErrorMessage(error, "Unable to update this research source status."));
    } finally {
      setResearchSaving(false);
    }
  }

  function closeResearchSources() {
    setOpenResearchSourcesId(null);
    setResearchError(null);
    setResearchRequests([]);
    setResearchSummaries([]);
    setResearchSources([]);
    setResearchWorkflowRuns([]);
    setResearchRequestEditorId(null);
    setResearchRequestForm(emptyResearchRequest());
    setResearchSummaryEditorId(null);
    setResearchSummaryForm(emptyResearchSummary());
    setResearchSourceEditorId(null);
    setResearchSourceForm(emptyResearchSource());
  }

  if (loading) return <LoadingState label="Loading AI delivery projects" />;
  if (error) return <ErrorState title="AI delivery unavailable" message={error} />;

  const filteredProjects = projects.filter((project) => {
    if (filter === "active") return !project.isArchived;
    if (filter === "archived") return project.isArchived;
    return true;
  });
  const activeProjectCount = projects.filter((project) => !project.isArchived).length;
  const archivedProjectCount = projects.length - activeProjectCount;
  const projectBriefCounts = {
    available: projects.filter((project) => project.brief).length,
    pending: projects.filter((project) => !project.brief).length
  };
  const pendingDeliverableReviewCount = deliverableReviews.filter((review) => ["NOT_STARTED", "ADMIN_REVIEW"].includes(review.status)).length;
  const workflowRunsHelper = openWorkflowRunsId
    ? `Current status mix: ${formatStatusBreakdown(workflowRuns, "No workflow runs in focus yet")}`
    : "Open Workflow runs to review current status and next-step context.";
  const researchHelper = openResearchSourcesId
    ? `Requests: ${formatStatusBreakdown(researchRequests, "No requests in focus yet")} - Summaries: ${formatStatusBreakdown(researchSummaries, "No summaries in focus yet")} - Sources: ${formatStatusBreakdown(researchSources, "No sources in focus yet")}`
    : "Open Research / Sources to review manual research status and next steps.";
  const seoTopicsHelper = openContentPlanId
    ? `${contentPlanItems.length} topic record(s) in focus for the current content plan.`
    : "Open AI SEO / Content Plan to review planning status and approval context.";
  const contentProductionHelper = openContentDraftsId || openArticleImagesId
    ? `Drafts in focus: ${openContentDraftsId ? contentDrafts.length : "-"} - Images in focus: ${openArticleImagesId ? articleImages.length : "-"}`
    : "Open Content production or Article images to review current production status.";
  const deliverablesHelper = openDeliverablesId
    ? `Current status mix: ${formatStatusBreakdown(deliverables, "No deliverables in focus yet")} - Active: ${activeDeliverableCount} - Archived: ${archivedDeliverableCount}`
    : "Open Deliverables to review package status and packaging readiness.";
  const reviewsHelper = selectedReviewDeliverableId
    ? `Current review mix: ${formatStatusBreakdown(deliverableReviews, "No review placeholders in focus yet")} - Pending: ${pendingDeliverableReviewCount}`
    : openDeliverablesId
      ? "Select Reviews on a deliverable to review internal QA status."
      : "Open Deliverables, then select Reviews to review internal QA status.";

  return (
    <section className="view-section" aria-labelledby="ai-delivery-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">AI Workflow</p>
          <h1 id="ai-delivery-title">AI Delivery Projects</h1>
        </div>
        <div className="toolbar">
          <div className="filter-bar" role="group" aria-label="AI delivery filter">
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
          {canEdit && projects.length > 0 ? (
            <button className="primary-action" onClick={openCreateModal} type="button">
              Add AI Delivery
            </button>
          ) : null}
        </div>
      </div>

      <SectionPanel
        title="Operator summary"
        description="Read-only operator overview. Project totals are tenant-level; workflow, research, planning, production, deliverable, and review context reflects the project area currently in focus."
      >
        <div className="summary-grid" aria-label="AI Delivery operator summary">
          <MetricCard
            accent="cyan"
            label="AI Delivery projects"
            value={projects.length}
            helper={`Active: ${activeProjectCount} - Archived: ${archivedProjectCount} - Visible: ${filteredProjects.length}`}
          />
          <MetricCard
            accent="violet"
            label="Project briefs"
            value={projectBriefCounts.available}
            helper={`Available: ${projectBriefCounts.available} - Pending/not loaded: ${projectBriefCounts.pending}`}
          />
          <MetricCard
            accent="purple"
            label="Workflow runs in focus"
            value={openWorkflowRunsId ? workflowRuns.length : "-"}
            helper={workflowRunsHelper}
          />
          <MetricCard
            accent="warning"
            label="Research in focus"
            value={openResearchSourcesId ? `${researchRequests.length}/${researchSummaries.length}/${researchSources.length}` : "-"}
            helper={researchHelper}
          />
          <MetricCard
            accent="cyan"
            label="Content plan in focus"
            value={openContentPlanId ? contentPlanItems.length : "-"}
            helper={seoTopicsHelper}
          />
          <MetricCard
            accent="violet"
            label="Production in focus"
            value={openContentDraftsId || openArticleImagesId ? `${openContentDraftsId ? contentDrafts.length : "-"}/${openArticleImagesId ? articleImages.length : "-"}` : "-"}
            helper={contentProductionHelper}
          />
          <MetricCard
            accent="success"
            label="Deliverables in focus"
            value={openDeliverablesId ? deliverables.length : "-"}
            helper={deliverablesHelper}
          />
          <MetricCard
            accent="warning"
            label="Reviews in focus"
            value={selectedReviewDeliverableId ? deliverableReviews.length : "-"}
            helper={reviewsHelper}
          />
        </div>
      </SectionPanel>

      {filteredProjects.length === 0 ? (
        <EmptyState
          action={
            canEdit && projects.length === 0 ? (
              <button className="primary-action" onClick={openCreateModal} type="button">
                Add AI Delivery
              </button>
            ) : null
          }
          message={projects.length === 0 ? "No AI Delivery projects yet. Add one to begin the admin workflow." : "No AI Delivery projects match this filter. Switch filters to continue."}
          title="No AI delivery projects"
        />
      ) : (
        <div className="entity-grid">
          {filteredProjects.map((p) => (
            <article className="entity-card" key={p.id}>
              <div className="entity-card-header">
                <div>
                  <span className={`entity-pill entity-pill-${p.isArchived ? "archived" : "active"}`}>
                    {p.isArchived ? "Archived" : "Active"}
                  </span>
                  <h2>{p.name}</h2>
                </div>
                <div className="card-actions" style={{ alignItems: "flex-end", flexDirection: "column", gap: "0.75rem" }}>
                  {canEdit ? (
                    <>
                      <div>
                        <span className="muted-text">Planning workflow</span>
                        <div className="brief-actions">
                          <button className="secondary-action" onClick={() => void openBrief(p.id)} type="button" disabled={!p.brief}>
                            Brief
                          </button>
                          <button className="secondary-action" onClick={() => void openResearchSources(p.id)} type="button">
                            Research / Sources
                          </button>
                          <button className="secondary-action" onClick={() => void openContentPlan(p.id)} type="button">
                            AI SEO / Content Plan
                          </button>
                          <button className="secondary-action" onClick={() => void openWorkflowRuns(p.id)} type="button">
                            Workflow runs
                          </button>
                          <button className="secondary-action" onClick={() => void openContentDrafts(p.id)} type="button">
                            Content production
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="muted-text">Review / packaging</span>
                        <div className="brief-actions">
                          <button className="secondary-action" onClick={() => void openArticleImages(p.id)} type="button">
                            Article images
                          </button>
                          <button className="secondary-action" onClick={() => void openDeliverables(p.id)} type="button">
                            Deliverables
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="muted-text">Project actions</span>
                        <div className="brief-actions">
                          <button className="secondary-action" onClick={() => openEditModal(p)} type="button">
                            Edit
                          </button>
                          {!p.isArchived ? (
                            <button className="secondary-action" onClick={() => void onArchive(p.id)} type="button">
                              Archive
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="entity-field-grid">
                <div>
                  <span>Client</span>
                  <strong>{p.client?.name ?? "No client"}</strong>
                </div>
                <div>
                  <span>Project</span>
                  <strong>{p.project?.name ?? "(none)"}</strong>
                </div>
                <div>
                  <span>Target month</span>
                  <strong>{p.targetMonth}</strong>
                </div>
                <div>
                  <span>Brief status</span>
                  <strong>{formatEnumLabel(p.brief?.status ?? null)}</strong>
                </div>
                <div className="entity-span-2">
                  <span>Admin workflow order</span>
                  <strong>Brief -&gt; Research -&gt; Content plan -&gt; Workflow runs -&gt; Content production -&gt; Article images -&gt; Deliverables</strong>
                  <span className="muted-text">
                    Current checkpoint: {p.brief ? `Brief ${formatEnumLabel(p.brief.status)}` : "Brief not started yet"}.
                  </span>
                </div>
                <div className="entity-span-2">
                  <span>Notes</span>
                  <strong>{p.plannedContentScopeNotes ?? "Not set"}</strong>
                </div>
                <div className="entity-span-2">
                  {canEdit ? (
                    <div className="brief-actions">
                      <button className="secondary-action" onClick={() => void onRequestClientInput(p.id)} type="button">
                        Request client input
                      </button>
                      <button className="secondary-action" onClick={() => void onRequestClientRevision(p.id)} type="button">
                        Request client revision
                      </button>
                      <button className="primary-action" onClick={() => void onApproveFinal(p.id)} type="button">
                        Approve final
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isEditorOpen ? (
        <Modal
          onClose={closeProjectEditor}
          title={editorProjectId ? "Edit AI Delivery" : "Add AI Delivery"}
        >
          <form className="entity-form" onSubmit={handleSubmit}>
            <div className="modal-footer">
              <button className="secondary-action" disabled={saving} onClick={closeProjectEditor} type="button">
                Cancel
              </button>
              <button className="primary-action" disabled={saving} type="submit">
                {saving ? "Saving" : editorProjectId ? "Update AI Delivery" : "Create AI Delivery"}
              </button>
            </div>
            <div className="field-grid">
              <label>
                Client - Required
                <select
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      clientId: event.target.value,
                      projectId: null
                    }))
                  }
                  required
                  value={draft.clientId}
                >
                  <option value="">No client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                <span className="muted-text">Client this AI Delivery work belongs to.</span>
              </label>

              <label>
                Target month - Required
                <input
                  aria-describedby="ai-delivery-target-month-help"
                  type="month"
                  onChange={(event) => setDraft((current) => ({ ...current, targetMonth: event.target.value }))}
                  required
                  value={draft.targetMonth}
                />
                <span className="muted-text" id="ai-delivery-target-month-help">Month this AI Delivery work is planned for.</span>
              </label>

              <label>
                Project name - Required
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="AI SEO & Content - June 2026"
                  required
                  value={draft.name}
                />
                <span className="muted-text">Used to group monthly AI Delivery work.</span>
              </label>

              <div>
                <span>Project status</span>
                <strong>{selectedProject?.isArchived ? "Archived" : "Active / new"}</strong>
                <span className="muted-text">Current internal status for this AI Delivery project.</span>
              </div>

              <div>
                <span>Brief status</span>
                <strong>{formatEnumLabel(selectedProject?.brief?.status ?? null)}</strong>
                <span className="muted-text">Revision/final approval status for the linked brief.</span>
              </div>

              <label className="field-span-2">
                Scope / summary / notes - Optional
                <textarea
                  maxLength={4000}
                  onChange={(event) => setDraft((current) => ({ ...current, plannedContentScopeNotes: event.target.value }))}
                  placeholder="Notes for admin team only"
                  rows={4}
                  value={draft.plannedContentScopeNotes}
                />
                <span className="muted-text">Visible only to admin team. Use this for scope, summary, or planning notes.</span>
              </label>

              <label>
                Linked internal project - Optional
                <select
                  onChange={(event) => setDraft((current) => ({ ...current, projectId: event.target.value || null }))}
                  value={draft.projectId ?? ""}
                >
                  <option value="">No internal project link</option>
                  {linkableProjects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
                <span className="muted-text">Optional internal reference. Not shown to client.</span>
              </label>
            </div>
            <div className="modal-footer">
              <button
                className="secondary-action"
                disabled={saving}
                onClick={closeProjectEditor}
                type="button"
              >
                Cancel
              </button>
              <button className="primary-action" disabled={saving} type="submit">
                {saving ? "Saving" : editorProjectId ? "Update AI Delivery" : "Create AI Delivery"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
      {openBriefId ? (
        <Modal
          onClose={() => {
            setOpenBriefId(null);
            setBriefError(null);
            setBriefDetail(null);
          }}
          title="AI Delivery Brief"
        >
          {briefLoading ? (
            <LoadingState label="Loading brief" />
          ) : openProject ? (
            briefDetail ? (
              <div>
                {briefError ? <ErrorState title="Brief action blocked" message={briefError} /> : null}
                <dl className="brief-grid">
                  <div>
                    <dt>Client</dt>
                    <dd>{openProject.client?.name ?? "No client"}</dd>
                  </div>
                  <div>
                    <dt>AI Delivery project</dt>
                    <dd>{openProject.name}</dd>
                  </div>
                  <div>
                    <dt>Brief status</dt>
                    <dd>{formatEnumLabel(briefDetail.status)}</dd>
                  </div>
                  <div>
                    <dt>Revisions</dt>
                    <dd>{briefDetail.revisionCount ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{new Date(briefDetail.createdAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{new Date(briefDetail.updatedAt).toLocaleString()}</dd>
                  </div>
                </dl>
                <p className="muted-text">Current status is shown above. Next step: update the brief fields or use the project-card review actions. This screen does not run research, planning, or delivery actions.</p>

                <div className="modal-footer">
                  <button className="secondary-action" onClick={() => { setOpenBriefId(null); setBriefError(null); setBriefDetail(null); }} type="button">Close</button>
                  {canEdit && typeof onSaveBrief === "function" ? (
                    <button className="primary-action" onClick={() => void handleSaveBrief(openProject.id)} type="button">Save brief</button>
                  ) : null}
                </div>

                <section className="field-panel">
                  <h3>Client input / priorities - Optional</h3>
                  {canEdit && typeof onSaveBrief === "function" ? (
                    <>
                      <textarea
                        placeholder="Client priorities, requested topics, or campaign focus"
                        rows={3}
                        value={briefDetail.clientPriorities ?? ""}
                        onChange={(e) => setBriefDetail({ ...briefDetail, clientPriorities: e.target.value })}
                      />
                      <span className="muted-text">Client-provided direction used to guide this monthly AI Delivery work.</span>
                    </>
                  ) : (
                    <pre style={{ whiteSpace: "pre-wrap" }}>{briefDetail.clientPriorities ?? "Not set"}</pre>
                  )}
                </section>

                <section className="field-panel">
                  <h3>Products / services focus - Optional</h3>
                  {canEdit && typeof onSaveBrief === "function" ? (
                    <>
                      <textarea
                        placeholder="Products, services, or offers to emphasize"
                        rows={3}
                        value={briefDetail.productsServicesFocus ?? ""}
                        onChange={(e) => setBriefDetail({ ...briefDetail, productsServicesFocus: e.target.value })}
                      />
                      <span className="muted-text">Helps admins keep content aligned with current client priorities.</span>
                    </>
                  ) : (
                    <pre style={{ whiteSpace: "pre-wrap" }}>{briefDetail.productsServicesFocus ?? "Not set"}</pre>
                  )}
                </section>

                <section className="field-panel">
                  <h3>Target audience - Optional</h3>
                  {canEdit && typeof onSaveBrief === "function" ? (
                    <>
                      <textarea
                        placeholder="Audience segments, buyer roles, or reader context"
                        rows={3}
                        value={briefDetail.targetAudience ?? ""}
                        onChange={(e) => setBriefDetail({ ...briefDetail, targetAudience: e.target.value })}
                      />
                      <span className="muted-text">Used by the admin team when planning briefs, topics, and drafts.</span>
                    </>
                  ) : (
                    <pre style={{ whiteSpace: "pre-wrap" }}>{briefDetail.targetAudience ?? "Not set"}</pre>
                  )}
                </section>

                <section className="field-panel">
                  <h3>Research / admin feedback - Optional</h3>
                  {canEdit && typeof onSaveBrief === "function" ? (
                    <>
                      <textarea
                        placeholder="Markets, competitors, research findings, or admin feedback"
                        rows={3}
                        value={briefDetail.marketsCompetitors ?? ""}
                        onChange={(e) => setBriefDetail({ ...briefDetail, marketsCompetitors: e.target.value })}
                      />
                      <span className="muted-text">Visible only to admin team.</span>
                    </>
                  ) : (
                    <pre style={{ whiteSpace: "pre-wrap" }}>{briefDetail.marketsCompetitors ?? "Not set"}</pre>
                  )}
                </section>

                <section className="field-panel">
                  <h3>Optional internal notes</h3>
                  {canEdit && typeof onSaveBrief === "function" ? (
                    <>
                      <textarea
                        placeholder="Notes for admin team only"
                        rows={6}
                        value={briefDetail.notes ?? ""}
                        onChange={(e) => setBriefDetail({ ...briefDetail, notes: e.target.value })}
                      />
                      <span className="muted-text">Not shown to client.</span>
                    </>
                  ) : (
                    <pre style={{ whiteSpace: "pre-wrap" }}>{briefDetail.notes ?? "Not set"}</pre>
                  )}
                </section>

                <div className="modal-footer">
                  <button className="secondary-action" onClick={() => { setOpenBriefId(null); setBriefError(null); setBriefDetail(null); }} type="button">Close</button>
                  {canEdit && typeof onSaveBrief === "function" ? (
                    <button className="primary-action" onClick={() => void handleSaveBrief(openProject.id)} type="button">Save brief</button>
                  ) : null}
                </div>
              </div>
            ) : openProject.brief ? (
              <div>
                {briefError ? <ErrorState title="Brief action blocked" message={briefError} /> : null}
                <dl className="brief-grid">
                  <div>
                    <dt>Status</dt>
                    <dd>{openProject.brief.status}</dd>
                  </div>
                  <div>
                    <dt>Revisions</dt>
                    <dd>{openProject.brief.revisionCount ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{new Date(openProject.brief.createdAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{new Date(openProject.brief.updatedAt).toLocaleString()}</dd>
                  </div>
                </dl>
                <section className="field-panel">
                  <h3>Planned content scope notes</h3>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{openProject.plannedContentScopeNotes ?? 'Not set'}</pre>
                </section>
                <div className="modal-footer">
                  <button className="secondary-action" onClick={() => { setOpenBriefId(null); setBriefError(null); setBriefDetail(null); }} type="button">Close</button>
                </div>
              </div>
            ) : (
              <div className="state-panel">No brief is available for this project yet. Create or open the project record to continue briefing.</div>
            )
          ) : (
            <div>Project not found.</div>
          )}
        </Modal>
      ) : null}
      {openContentPlanId ? (
        <Modal onClose={closeContentPlan} title="AI SEO / Content Plan">
          {contentPlanLoading ? (
            <LoadingState label="Loading content plan" />
          ) : openContentPlanProject ? (
            contentPlanDetail ? (
              <div>
                {contentPlanError ? <ErrorState title="Content plan action blocked" message={contentPlanError} /> : null}
                <section className="field-panel">
                  <h3>SEO topic/research planning</h3>
                  <p className="muted-text">Current status is shown below. Next step: add or refine topics, save the plan, then move it into review when ready. Saved plan items can run admin-only draft generation; this screen does not publish, deliver to clients, crawl, or run external services directly.</p>
                  <div className="state-panel" role="status">Review actions follow the current content plan state shown below. If a transition is blocked, the reason stays in this modal.</div>
                  {contentPlanGenerationMessage ? <div className="state-panel" role="status">{contentPlanGenerationMessage}</div> : null}
                </section>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={isContentPlanBusy} onClick={closeContentPlan} type="button">Close</button>
                  <button className="secondary-action" disabled={isContentPlanBusy} onClick={() => void handleContentPlanAction(openContentPlanProject.id, onRequestContentPlanReview)} type="button">Mark ready for review</button>
                  <button className="secondary-action" disabled={isContentPlanBusy} onClick={() => void handleContentPlanAction(openContentPlanProject.id, onRequestContentPlanChanges)} type="button">Request changes</button>
                  <button className="secondary-action" disabled={isContentPlanBusy} onClick={() => void handleContentPlanAction(openContentPlanProject.id, onApproveContentPlan)} type="button">Approve plan</button>
                  <button className="primary-action" disabled={isContentPlanBusy || contentPlanItems.some((item) => !item.title.trim())} onClick={() => void handleSaveContentPlan(openContentPlanProject.id)} type="button">
                    {contentPlanSaving ? "Saving" : "Save draft"}
                  </button>
                </div>
                <dl className="brief-grid">
                  <div>
                    <dt>Status</dt>
                    <dd><StatusBadge status={formatContentPlanReviewStatus(contentPlanDetail)} /></dd>
                  </div>
                  <div>
                    <dt>Revisions</dt>
                    <dd>{contentPlanDetail.revisionCount ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Review requested</dt>
                    <dd>{formatOptionalDate(contentPlanDetail.reviewRequestedAt)}</dd>
                  </div>
                  <div>
                    <dt>Approved</dt>
                    <dd>{formatOptionalDate(contentPlanDetail.approvedAt)}</dd>
                  </div>
                </dl>

                <section className="field-panel">
                  <h3>Current content plan status</h3>
                  <p className="muted-text">Review the current approval state here, then use the action buttons for the next admin step. Existing client review routes remain separate and unchanged.</p>
                  <dl className="brief-grid">
                    <div>
                      <dt>Approval state</dt>
                      <dd>{formatContentPlanReviewStatus(contentPlanDetail)}</dd>
                    </div>
                    <div>
                      <dt>Revision count</dt>
                      <dd>{contentPlanDetail.revisionCount ?? 0}</dd>
                    </div>
                    <div>
                      <dt>Review requested</dt>
                      <dd>{formatOptionalDate(contentPlanDetail.reviewRequestedAt)}</dd>
                    </div>
                    <div>
                      <dt>Approved</dt>
                      <dd>{formatOptionalDate(contentPlanDetail.approvedAt)}</dd>
                    </div>
                  </dl>
                </section>

                <section className="field-panel">
                  <h3>SEO topics / research records</h3>
                  {contentPlanItems.length === 0 ? (
                    <div className="state-panel">No SEO topics yet. Add a topic to continue planning.</div>
                  ) : null}
                  {contentPlanItems.map((item, index) => {
                    const persistedItem = contentPlanDetail.items.find((planItem) => planItem.id === item.localId) ?? null;
                    const linkedDraft = persistedItem?.id
                      ? contentDrafts.find((draftItem) => draftItem.contentPlanItemId === persistedItem.id && !draftItem.isArchived) ?? null
                      : null;

                    return (
                    <div className="field-grid" key={item.localId} style={{ marginBottom: "1rem" }}>
                      <label className="field-span-2">
                        Topic / working title - Required
                        <input
                          maxLength={255}
                          placeholder="Main topic, keyword cluster, or service page focus"
                          onChange={(event) => setContentPlanItems((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, title: event.target.value } : draftItem))}
                          required
                          value={item.title}
                        />
                        <span className="muted-text">Used by admin to prepare monthly platform-neutral SEO/content work.</span>
                      </label>
                      <label>
                        Target keyword / theme - Optional
                        <input
                          maxLength={80}
                          placeholder="Primary keyword or search phrase"
                          onChange={(event) => setContentPlanItems((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, targetKeyword: event.target.value } : draftItem))}
                          value={item.targetKeyword}
                        />
                        <span className="muted-text">Visible only to admin team.</span>
                      </label>
                      <label className="field-span-2">
                        Research notes / search intent - Optional
                        <textarea
                          maxLength={4000}
                          placeholder="Informational, commercial, local, or transactional intent"
                          onChange={(event) => setContentPlanItems((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, notes: event.target.value } : draftItem))}
                          rows={3}
                          value={item.notes}
                        />
                        <span className="muted-text">Foundation record only; no AI generation runs here yet.</span>
                      </label>
                      <label>
                        Production type - Optional
                        <input
                          maxLength={80}
                          placeholder="Blog post, service page, landing page, or other"
                          onChange={(event) => setContentPlanItems((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, contentType: event.target.value } : draftItem))}
                          value={item.contentType}
                        />
                        <span className="muted-text">Internal planning label for the monthly content plan.</span>
                      </label>
                      <label>
                        Item approval status - Required
                        <select
                          value={item.approvalStatus}
                          onChange={(event) => setContentPlanItems((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, approvalStatus: event.target.value } : draftItem))}
                        >
                          {contentPlanItemApprovalStatuses.map((status) => (
                            <option key={status} value={status}>{formatContentPlanItemApprovalStatus(status)}</option>
                          ))}
                        </select>
                        <span className="muted-text">Track whether this item is still planned, approved, or sent back for revision.</span>
                      </label>
                      <div>
                        <span>Sort order</span>
                        <strong>{index + 1}</strong>
                        <span className="muted-text">Determined by the list order.</span>
                      </div>
                      <div>
                        <span>Current item status</span>
                        <strong>{formatContentPlanItemApprovalStatus(contentPlanDetail.items[index]?.approvalStatus)}</strong>
                        <span className="muted-text">Latest persisted approval state for this record.</span>
                      </div>
                      <div className="field-span-2">
                        <label>
                          Approval / revision note - Optional
                          <textarea
                            maxLength={4000}
                            placeholder="Why this item is approved, still planned, or needs revision before review"
                            onChange={(event) => setContentPlanItems((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, clientComment: event.target.value } : draftItem))}
                            rows={3}
                            value={item.clientComment}
                          />
                          <span className="muted-text">Use for internal approval context and any revision note that may later support review handling.</span>
                        </label>
                      </div>
                      <div className="field-span-2">
                        <span>Saved approval / revision note</span>
                        <strong>{persistedItem?.clientComment ?? "No approval note yet"}</strong>
                        <span className="muted-text">Latest persisted approval or revision note for this item.</span>
                      </div>
                      <div className="field-span-2">
                        <div className="modal-footer" style={{ justifyContent: "flex-start", padding: 0 }}>
                          <button
                            className="primary-action"
                            disabled={isContentPlanBusy || !persistedItem?.id || persistedItem.approvalStatus === "CLIENT_CHANGES_REQUESTED"}
                            onClick={() => persistedItem ? void generateContentDraftFromPlanItem(openContentPlanProject.id, persistedItem) : undefined}
                            type="button"
                          >
                            {contentPlanGeneratingItemId === persistedItem?.id ? "Generating draft" : linkedDraft ? "Regenerate admin draft" : "Generate admin draft"}
                          </button>
                        </div>
                        <span className="muted-text">Runs admin-only draft generation from this saved content plan item. It does not publish, deliver to client, or open client review.</span>
                      </div>
                      <div className="field-span-2">
                        <button
                          className="secondary-action"
                          disabled={isContentPlanBusy}
                          onClick={() => setContentPlanItems((current) => current.filter((draftItem) => draftItem.localId !== item.localId))}
                          type="button"
                        >
                          Remove topic
                        </button>
                      </div>
                    </div>
                    );
                  })}
                  <button
                    className="secondary-action"
                    disabled={isContentPlanBusy}
                    onClick={() => setContentPlanItems((current) => [...current, emptyContentPlanItem()])}
                    type="button"
                  >
                    Add SEO topic
                  </button>
                </section>

                <div className="modal-footer">
                  <button className="secondary-action" disabled={isContentPlanBusy} onClick={closeContentPlan} type="button">Close</button>
                  <button className="secondary-action" disabled={isContentPlanBusy} onClick={() => void handleContentPlanAction(openContentPlanProject.id, onRequestContentPlanReview)} type="button">Mark ready for review</button>
                  <button className="secondary-action" disabled={isContentPlanBusy} onClick={() => void handleContentPlanAction(openContentPlanProject.id, onRequestContentPlanChanges)} type="button">Request changes</button>
                  <button className="secondary-action" disabled={isContentPlanBusy} onClick={() => void handleContentPlanAction(openContentPlanProject.id, onApproveContentPlan)} type="button">Approve plan</button>
                  <button className="primary-action" disabled={isContentPlanBusy || contentPlanItems.some((item) => !item.title.trim())} onClick={() => void handleSaveContentPlan(openContentPlanProject.id)} type="button">
                    {contentPlanSaving ? "Saving" : "Save draft"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {contentPlanError ? <ErrorState title="Content plan action blocked" message={contentPlanError} /> : null}
                <div className="modal-footer">
                  <button className="secondary-action" disabled={isContentPlanBusy} onClick={closeContentPlan} type="button">Close</button>
                  <button className="primary-action" disabled={isContentPlanBusy} onClick={() => void handleCreateContentPlan(openContentPlanProject.id)} type="button">
                    {contentPlanSaving ? "Creating" : "Create content plan"}
                  </button>
                </div>
                <div className="state-panel">
                  No content plan exists for {openContentPlanProject.name} yet. Create one to continue planning. This screen records admin-side planning only; it does not generate, crawl, publish, or call external services.
                </div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={isContentPlanBusy} onClick={closeContentPlan} type="button">Close</button>
                  <button className="primary-action" disabled={isContentPlanBusy} onClick={() => void handleCreateContentPlan(openContentPlanProject.id)} type="button">
                    {contentPlanSaving ? "Creating" : "Create content plan"}
                  </button>
                </div>
              </div>
            )
          ) : (
            <div>Project not found.</div>
          )}
        </Modal>
      ) : null}
      {openResearchSourcesId ? (
        <Modal onClose={closeResearchSources} title="Research / Sources">
          {researchLoading ? (
            <LoadingState label="Loading research requests and sources" />
          ) : openResearchSourcesProject ? (
            <div>
              {researchError ? <ErrorState title="Research action blocked" message={researchError} /> : null}
              <section className="field-panel">
                <h3>Research request editor</h3>
                <p className="muted-text">Current status is set in the request record. Next step: create a request, then add summaries or sources as the work becomes clearer. This screen does not crawl or fetch external content.</p>
                <div className="state-panel" role="status">Workflow run links must stay inside this same AI Delivery project. Guarded save failures remain visible in this modal.</div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={researchSaving} onClick={closeResearchSources} type="button">Close</button>
                  <button className="secondary-action" disabled={researchSaving} onClick={() => { setResearchRequestEditorId(null); setResearchRequestForm(emptyResearchRequest()); }} type="button">New request</button>
                  <button className="primary-action" disabled={researchSaving || !researchRequestForm.title.trim()} onClick={() => void saveResearchRequest(openResearchSourcesProject.id)} type="button">
                    {researchSaving ? "Saving" : researchRequestEditorId ? "Save request" : "Create request"}
                  </button>
                </div>
                <div className="field-grid">
                  <label>
                    Status - Required
                    <select value={researchRequestForm.status} onChange={(event) => setResearchRequestForm((current) => ({ ...current, status: event.target.value }))}>
                      {researchRequestStatuses.map((status) => <option key={status} value={status}>{formatEnumLabel(status)}</option>)}
                    </select>
                    <span className="muted-text">Admin-only lifecycle state for this manual research request.</span>
                  </label>
                  <label>
                    Linked workflow run - Optional
                    <select value={researchRequestForm.workflowRunId ?? ""} onChange={(event) => setResearchRequestForm((current) => ({ ...current, workflowRunId: event.target.value || null }))}>
                      <option value="">Manual / unlinked request</option>
                      {researchWorkflowRuns.map((run) => <option key={run.id} value={run.id}>Workflow run - {formatEnumLabel(run.status)}</option>)}
                    </select>
                    <span className="muted-text">Only link a request to a workflow run from the same AI Delivery project.</span>
                  </label>
                  <label className="field-span-2">
                    Title - Required
                    <input maxLength={255} placeholder="Competitor review, source gathering, keyword gap, audience research" value={researchRequestForm.title} onChange={(event) => setResearchRequestForm((current) => ({ ...current, title: event.target.value }))} />
                    <span className="muted-text">Working title for the research work the admin team wants to track manually.</span>
                  </label>
                  <label>
                    Request type / topic - Optional
                    <input maxLength={255} placeholder="Competitors, sources, SERP notes, local intent" value={researchRequestForm.requestType} onChange={(event) => setResearchRequestForm((current) => ({ ...current, requestType: event.target.value }))} />
                    <span className="muted-text">Short category used to group similar research work.</span>
                  </label>
                  <label className="field-span-2">
                    Description / notes - Optional
                    <textarea maxLength={4000} placeholder="What should be reviewed, what to collect manually, and what the source list should prove" rows={4} value={researchRequestForm.description} onChange={(event) => setResearchRequestForm((current) => ({ ...current, description: event.target.value }))} />
                    <span className="muted-text">Visible only to admin team. No external fetching is triggered from this screen.</span>
                  </label>
                </div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={researchSaving} onClick={closeResearchSources} type="button">Close</button>
                  <button className="secondary-action" disabled={researchSaving} onClick={() => { setResearchRequestEditorId(null); setResearchRequestForm(emptyResearchRequest()); }} type="button">New request</button>
                  <button className="primary-action" disabled={researchSaving || !researchRequestForm.title.trim()} onClick={() => void saveResearchRequest(openResearchSourcesProject.id)} type="button">
                    {researchSaving ? "Saving" : researchRequestEditorId ? "Save request" : "Create request"}
                  </button>
                </div>
              </section>

              <section className="field-panel">
                <h3>Existing research requests</h3>
                {researchRequests.length === 0 ? <div className="state-panel">No research requests yet. Add a request to continue.</div> : null}
                {researchRequests.map((request) => (
                  <article className="entity-card" key={request.id} style={{ marginBottom: "1rem" }}>
                    <div className="entity-card-header">
                      <div>
                        <StatusBadge status={request.status} />
                        <h3>{request.title}</h3>
                        <p>Updated {formatOptionalDate(request.updatedAt)}</p>
                      </div>
                      <div className="card-actions">
                        <button className="secondary-action" disabled={researchSaving} onClick={() => editResearchRequest(request)} type="button">Edit</button>
                      </div>
                    </div>
                    <dl className="brief-grid">
                      <div>
                        <dt>Status</dt>
                        <dd>{formatEnumLabel(request.status)}</dd>
                      </div>
                      <div>
                        <dt>Linked workflow</dt>
                        <dd>{request.workflowRun ? formatEnumLabel(request.workflowRun.status) : "Manual / none"}</dd>
                      </div>
                      <div>
                        <dt>Type</dt>
                        <dd>{request.requestType ?? "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Created</dt>
                        <dd>{formatOptionalDate(request.createdAt)}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Description</dt>
                        <dd>{formatPreview(request.description)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </section>

              <section className="field-panel">
                <h3>Research summary editor</h3>
                <p className="muted-text">Current status is set in the summary record. Next step: capture findings, then finalize or apply them to brief notes when ready. This screen does not run AI generation, crawling, or external fetching.</p>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={researchSaving} onClick={closeResearchSources} type="button">Close</button>
                  <button className="secondary-action" disabled={researchSaving} onClick={() => { setResearchSummaryEditorId(null); setResearchSummaryForm(emptyResearchSummary()); }} type="button">New summary</button>
                  <button className="primary-action" disabled={researchSaving || !researchSummaryForm.title.trim() || !researchSummaryForm.summaryText.trim()} onClick={() => void saveResearchSummary(openResearchSourcesProject.id)} type="button">
                    {researchSaving ? "Saving" : researchSummaryEditorId ? "Save summary" : "Create summary"}
                  </button>
                </div>
                <div className="field-grid">
                  <label>
                    Status - Required
                    <select value={researchSummaryForm.status} onChange={(event) => setResearchSummaryForm((current) => ({ ...current, status: event.target.value }))}>
                      {researchSummaryStatuses.map((status) => <option key={status} value={status}>{formatEnumLabel(status)}</option>)}
                    </select>
                    <span className="muted-text">Admin-controlled lifecycle for the internal research summary.</span>
                  </label>
                  <label>
                    Linked workflow run - Optional
                    <select value={researchSummaryForm.workflowRunId ?? ""} onChange={(event) => setResearchSummaryForm((current) => ({ ...current, workflowRunId: event.target.value || null }))}>
                      <option value="">Manual / unlinked summary</option>
                      {researchWorkflowRuns.map((run) => <option key={run.id} value={run.id}>Workflow run - {formatEnumLabel(run.status)}</option>)}
                    </select>
                    <span className="muted-text">Use only when the linked workflow run belongs to this same AI Delivery project.</span>
                  </label>
                  <label className="field-span-2">
                    Title - Required
                    <input maxLength={255} placeholder="SEO findings summary for brief revision and content planning" value={researchSummaryForm.title} onChange={(event) => setResearchSummaryForm((current) => ({ ...current, title: event.target.value }))} />
                    <span className="muted-text">Internal title for the admin-authored summary of approved research findings.</span>
                  </label>
                  <label className="field-span-2">
                    Summary - Required
                    <textarea maxLength={4000} placeholder="Summarize the research findings, business context, and what should influence planning next" rows={5} value={researchSummaryForm.summaryText} onChange={(event) => setResearchSummaryForm((current) => ({ ...current, summaryText: event.target.value }))} />
                    <span className="muted-text">Core internal summary for the project team. No AI generation or external fetch runs here.</span>
                  </label>
                  <label className="field-span-2">
                    Key findings - Optional
                    <textarea maxLength={4000} placeholder="Top findings the admin team wants to preserve from the manual research review" rows={3} value={researchSummaryForm.keyFindings} onChange={(event) => setResearchSummaryForm((current) => ({ ...current, keyFindings: event.target.value }))} />
                    <span className="muted-text">Use for the most important takeaways that should guide brief refinement.</span>
                  </label>
                  <label className="field-span-2">
                    Audience insights - Optional
                    <textarea maxLength={4000} placeholder="Audience problems, intent signals, and messaging cues discovered during research" rows={3} value={researchSummaryForm.audienceInsights} onChange={(event) => setResearchSummaryForm((current) => ({ ...current, audienceInsights: event.target.value }))} />
                    <span className="muted-text">Visible only to admin team.</span>
                  </label>
                  <label className="field-span-2">
                    Competitor insights - Optional
                    <textarea maxLength={4000} placeholder="Competitor positioning, gaps, and useful benchmark observations" rows={3} value={researchSummaryForm.competitorInsights} onChange={(event) => setResearchSummaryForm((current) => ({ ...current, competitorInsights: event.target.value }))} />
                    <span className="muted-text">Use for internal competitive context only.</span>
                  </label>
                  <label className="field-span-2">
                    Keyword opportunities - Optional
                    <textarea maxLength={4000} placeholder="Search themes, target keyword opportunities, and promising topic clusters" rows={3} value={researchSummaryForm.keywordOpportunities} onChange={(event) => setResearchSummaryForm((current) => ({ ...current, keywordOpportunities: event.target.value }))} />
                    <span className="muted-text">Supports future platform-neutral planning for content and SEO deliverables.</span>
                  </label>
                  <label className="field-span-2">
                    Content recommendations - Optional
                    <textarea maxLength={4000} placeholder="Recommended content directions, angles, and deliverable ideas for later planning" rows={3} value={researchSummaryForm.contentRecommendations} onChange={(event) => setResearchSummaryForm((current) => ({ ...current, contentRecommendations: event.target.value }))} />
                    <span className="muted-text">Keep recommendations platform-neutral rather than tied to any one publishing connector.</span>
                  </label>
                  <label className="field-span-2">
                    Brief revision notes - Optional
                    <textarea maxLength={4000} placeholder="What should be revised or clarified in the project brief before planning continues" rows={3} value={researchSummaryForm.briefRevisionNotes} onChange={(event) => setResearchSummaryForm((current) => ({ ...current, briefRevisionNotes: event.target.value }))} />
                    <span className="muted-text">Use this to guide safe admin-controlled updates into brief notes.</span>
                  </label>
                  <label className="field-span-2">
                    Source notes - Optional
                    <textarea maxLength={4000} placeholder="Manual notes about approved sources used for this summary and any limitations to keep in mind" rows={3} value={researchSummaryForm.sourceNotes} onChange={(event) => setResearchSummaryForm((current) => ({ ...current, sourceNotes: event.target.value }))} />
                    <span className="muted-text">Use when source linkage stays manual in this foundation.</span>
                  </label>
                </div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={researchSaving} onClick={closeResearchSources} type="button">Close</button>
                  <button className="secondary-action" disabled={researchSaving} onClick={() => { setResearchSummaryEditorId(null); setResearchSummaryForm(emptyResearchSummary()); }} type="button">New summary</button>
                  <button className="primary-action" disabled={researchSaving || !researchSummaryForm.title.trim() || !researchSummaryForm.summaryText.trim()} onClick={() => void saveResearchSummary(openResearchSourcesProject.id)} type="button">
                    {researchSaving ? "Saving" : researchSummaryEditorId ? "Save summary" : "Create summary"}
                  </button>
                </div>
              </section>

              <section className="field-panel">
                <h3>Existing research summaries</h3>
                {researchSummaries.length === 0 ? <div className="state-panel">No research summaries yet. Add a summary after reviewing sources.</div> : null}
                {researchSummaries.map((summary) => (
                  <article className="entity-card" key={summary.id} style={{ marginBottom: "1rem" }}>
                    <div className="entity-card-header">
                      <div>
                        <StatusBadge status={summary.status} />
                        <h3>{summary.title}</h3>
                        <p>Updated {formatOptionalDate(summary.updatedAt)}</p>
                      </div>
                      <div className="card-actions">
                        <button className="secondary-action" disabled={researchSaving} onClick={() => editResearchSummary(summary)} type="button">Edit</button>
                        {summary.status !== "FINALIZED" ? <button className="secondary-action" disabled={researchSaving} onClick={() => void setResearchSummaryStatus(openResearchSourcesProject.id, summary, "FINALIZED")} type="button">Finalize</button> : null}
                        {summary.status !== "ARCHIVED" ? <button className="secondary-action" disabled={researchSaving} onClick={() => void setResearchSummaryStatus(openResearchSourcesProject.id, summary, "ARCHIVED")} type="button">Archive</button> : null}
                        <button className="secondary-action" disabled={researchSaving} onClick={() => void applyResearchSummaryToBrief(openResearchSourcesProject.id, summary.id)} type="button">Apply to brief notes</button>
                      </div>
                    </div>
                    <dl className="brief-grid">
                      <div>
                        <dt>Status</dt>
                        <dd>{formatEnumLabel(summary.status)}</dd>
                      </div>
                      <div>
                        <dt>Workflow run</dt>
                        <dd>{summary.workflowRun ? formatEnumLabel(summary.workflowRun.status) : "Manual / none"}</dd>
                      </div>
                      <div>
                        <dt>Finalized</dt>
                        <dd>{formatOptionalDate(summary.finalizedAt)}</dd>
                      </div>
                      <div>
                        <dt>Created</dt>
                        <dd>{formatOptionalDate(summary.createdAt)}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Summary</dt>
                        <dd>{formatPreview(summary.summaryText)}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Key findings</dt>
                        <dd>{formatPreview(summary.keyFindings)}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Brief revision notes</dt>
                        <dd>{formatPreview(summary.briefRevisionNotes)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </section>

              <section className="field-panel">
                <h3>Research source editor</h3>
                <p className="muted-text">Current status is set in the source record. Next step: add a source, then approve, reject, or archive it. This screen does not crawl or fetch external content.</p>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={researchSaving} onClick={closeResearchSources} type="button">Close</button>
                  <button className="secondary-action" disabled={researchSaving} onClick={() => { setResearchSourceEditorId(null); setResearchSourceForm(emptyResearchSource()); }} type="button">New source</button>
                  <button className="primary-action" disabled={researchSaving || !researchSourceForm.sourceUrl.trim()} onClick={() => void saveResearchSource(openResearchSourcesProject.id)} type="button">
                    {researchSaving ? "Saving" : researchSourceEditorId ? "Save source" : "Create source"}
                  </button>
                </div>
                <div className="field-grid">
                  <label>
                    Status - Required
                    <select value={researchSourceForm.status} onChange={(event) => setResearchSourceForm((current) => ({ ...current, status: event.target.value }))}>
                      {researchSourceStatuses.map((status) => <option key={status} value={status}>{formatEnumLabel(status)}</option>)}
                    </select>
                    <span className="muted-text">Approve, reject, or archive the manual source record here.</span>
                  </label>
                  <label>
                    Source type - Required
                    <select value={researchSourceForm.sourceType} onChange={(event) => setResearchSourceForm((current) => ({ ...current, sourceType: event.target.value }))}>
                      {researchSourceTypes.map((sourceType) => <option key={sourceType} value={sourceType}>{formatEnumLabel(sourceType)}</option>)}
                    </select>
                    <span className="muted-text">Manual classification only. No document parsing or scraping runs here.</span>
                  </label>
                  <label>
                    Linked research request - Optional
                    <select value={researchSourceForm.researchRequestId ?? ""} onChange={(event) => setResearchSourceForm((current) => ({ ...current, researchRequestId: event.target.value || null }))}>
                      <option value="">Manual / unlinked source</option>
                      {researchRequests.map((request) => <option key={request.id} value={request.id}>{request.title}</option>)}
                    </select>
                    <span className="muted-text">Use when the source supports a specific tracked research request.</span>
                  </label>
                  <label>
                    Linked workflow run - Optional
                    <select value={researchSourceForm.workflowRunId ?? ""} onChange={(event) => setResearchSourceForm((current) => ({ ...current, workflowRunId: event.target.value || null }))}>
                      <option value="">Manual / unlinked source</option>
                      {researchWorkflowRuns.map((run) => <option key={run.id} value={run.id}>Workflow run - {formatEnumLabel(run.status)}</option>)}
                    </select>
                    <span className="muted-text">Optional internal link back to a workflow run in the same project.</span>
                  </label>
                  <label className="field-span-2">
                    Source URL - Required
                    <input maxLength={2048} placeholder="https://example.com/source-page" value={researchSourceForm.sourceUrl} onChange={(event) => setResearchSourceForm((current) => ({ ...current, sourceUrl: event.target.value }))} />
                    <span className="muted-text">Manual http/https URL only. The system records the link but does not fetch or crawl it in this foundation.</span>
                  </label>
                  <label className="field-span-2">
                    Source title - Optional
                    <input maxLength={255} placeholder="Human-friendly source label for the admin team" value={researchSourceForm.sourceTitle} onChange={(event) => setResearchSourceForm((current) => ({ ...current, sourceTitle: event.target.value }))} />
                    <span className="muted-text">Useful when the page title is not obvious from the URL alone.</span>
                  </label>
                  <label className="field-span-2">
                    Review notes - Optional
                    <textarea maxLength={4000} placeholder="Why this source was approved, rejected, or archived for manual research use" rows={4} value={researchSourceForm.reviewNotes} onChange={(event) => setResearchSourceForm((current) => ({ ...current, reviewNotes: event.target.value }))} />
                    <span className="muted-text">Visible only to admin team.</span>
                  </label>
                </div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={researchSaving} onClick={closeResearchSources} type="button">Close</button>
                  <button className="secondary-action" disabled={researchSaving} onClick={() => { setResearchSourceEditorId(null); setResearchSourceForm(emptyResearchSource()); }} type="button">New source</button>
                  <button className="primary-action" disabled={researchSaving || !researchSourceForm.sourceUrl.trim()} onClick={() => void saveResearchSource(openResearchSourcesProject.id)} type="button">
                    {researchSaving ? "Saving" : researchSourceEditorId ? "Save source" : "Create source"}
                  </button>
                </div>
              </section>

              <section className="field-panel">
                <h3>Existing research sources</h3>
                {researchSources.length === 0 ? <div className="state-panel">No research sources yet. Add a source to continue.</div> : null}
                {researchSources.map((source) => (
                  <article className="entity-card" key={source.id} style={{ marginBottom: "1rem" }}>
                    <div className="entity-card-header">
                      <div>
                        <StatusBadge status={source.status} />
                        <h3>{source.sourceTitle ?? source.sourceUrl}</h3>
                        <p>Updated {formatOptionalDate(source.updatedAt)}</p>
                      </div>
                      <div className="card-actions">
                        <button className="secondary-action" disabled={researchSaving} onClick={() => editResearchSource(source)} type="button">Edit</button>
                        {source.status !== "APPROVED" ? <button className="secondary-action" disabled={researchSaving} onClick={() => void setResearchSourceStatus(openResearchSourcesProject.id, source, "APPROVED")} type="button">Approve</button> : null}
                        {source.status !== "REJECTED" ? <button className="secondary-action" disabled={researchSaving} onClick={() => void setResearchSourceStatus(openResearchSourcesProject.id, source, "REJECTED")} type="button">Reject</button> : null}
                        {source.status !== "ARCHIVED" ? <button className="secondary-action" disabled={researchSaving} onClick={() => void setResearchSourceStatus(openResearchSourcesProject.id, source, "ARCHIVED")} type="button">Archive</button> : null}
                      </div>
                    </div>
                    <dl className="brief-grid">
                      <div>
                        <dt>Status</dt>
                        <dd>{formatEnumLabel(source.status)}</dd>
                      </div>
                      <div>
                        <dt>Type</dt>
                        <dd>{formatEnumLabel(source.sourceType)}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Source URL</dt>
                        <dd>{source.sourceUrl}</dd>
                      </div>
                      <div>
                        <dt>Request</dt>
                        <dd>{source.researchRequest?.title ?? "Manual / none"}</dd>
                      </div>
                      <div>
                        <dt>Workflow run</dt>
                        <dd>{source.workflowRun ? formatEnumLabel(source.workflowRun.status) : "Manual / none"}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Review notes</dt>
                        <dd>{formatPreview(source.reviewNotes)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </section>
              <div className="modal-footer"><button className="secondary-action" onClick={closeResearchSources} type="button">Close</button></div>
            </div>
          ) : <div>Project not found.</div>}
        </Modal>
      ) : null}
      {openWorkflowRunsId ? (
        <Modal onClose={closeWorkflowRuns} title="Workflow Runs">
          {workflowRunsLoading ? (
            <LoadingState label="Loading workflow runs" />
          ) : openWorkflowRunsProject ? (
            <div>
              {workflowRunsError ? <ErrorState title="Workflow run action blocked" message={workflowRunsError} /> : null}
              <section className="field-panel">
                <h3>Workflow run editor</h3>
                <p className="muted-text">Current status is set in the workflow run record. Next step: save the run, then execute the local stub when ready. This screen does not run AI calls, crawling, publishing, automation, or client delivery.</p>
                <div className="state-panel" role="status">{workflowRunActionGuidance}</div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={workflowRunsSaving || Boolean(workflowRunExecutingId)} onClick={closeWorkflowRuns} type="button">Close</button>
                  <button className="secondary-action" disabled={workflowRunsSaving || Boolean(workflowRunExecutingId)} onClick={() => { setWorkflowRunEditorId(null); setWorkflowRunForm(emptyWorkflowRun()); }} type="button">New workflow run</button>
                  <button className="primary-action" disabled={workflowRunsSaving || Boolean(workflowRunExecutingId) || !isWorkflowRunStatusAllowed} onClick={() => void saveWorkflowRun(openWorkflowRunsProject.id)} type="button">
                    {workflowRunsSaving ? "Saving" : workflowRunEditorId ? "Save workflow run" : "Create workflow run"}
                  </button>
                </div>
                <div className="field-grid">
                  <div>
                    <span>Run type / name</span>
                    <strong>{workflowRunEditorId ? "Existing workflow run" : "New workflow run"}</strong>
                    <span className="muted-text">Admin workflow run record for this AI Delivery project.</span>
                  </div>
                  <label>
                    Status - Required
                    <select value={workflowRunForm.status} onChange={(event) => setWorkflowRunForm((current) => ({ ...current, status: event.target.value }))}>
                      {workflowRunStatusOptions.map((status) => <option key={status} value={status}>{workflowRunStatusLabels[status]}</option>)}
                    </select>
                    <span className="muted-text">Current internal status of this workflow run. {workflowRunStatusHelper}</span>
                  </label>
                  <label className="field-span-2">
                    Input / context and review notes - Optional
                    <textarea
                      maxLength={4000}
                      placeholder="Workflow inputs, admin context, blockers, or review notes"
                      rows={4}
                      value={workflowRunForm.adminNotes}
                      onChange={(event) => setWorkflowRunForm((current) => ({ ...current, adminNotes: event.target.value }))}
                    />
                    <span className="muted-text">Visible only to admin team. Not shown to client. Include [stub-fail] to simulate a controlled local failure.</span>
                  </label>
                  <label className="field-span-2">
                    Output / result summary - Optional
                    <textarea
                      maxLength={4000}
                      placeholder="Summary of output, result, or next handoff step"
                      rows={4}
                      value={workflowRunForm.resultPlaceholder}
                      onChange={(event) => setWorkflowRunForm((current) => ({ ...current, resultPlaceholder: event.target.value }))}
                    />
                    <span className="muted-text">Internal result summary only. Local stub execution can populate this automatically when it is empty.</span>
                  </label>
                </div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={workflowRunsSaving || Boolean(workflowRunExecutingId)} onClick={closeWorkflowRuns} type="button">Close</button>
                  <button className="secondary-action" disabled={workflowRunsSaving || Boolean(workflowRunExecutingId)} onClick={() => { setWorkflowRunEditorId(null); setWorkflowRunForm(emptyWorkflowRun()); }} type="button">New workflow run</button>
                  <button className="primary-action" disabled={workflowRunsSaving || Boolean(workflowRunExecutingId) || !isWorkflowRunStatusAllowed} onClick={() => void saveWorkflowRun(openWorkflowRunsProject.id)} type="button">
                    {workflowRunsSaving ? "Saving" : workflowRunEditorId ? "Save workflow run" : "Create workflow run"}
                  </button>
                </div>
              </section>

              <section className="field-panel">
                <h3>Existing workflow runs</h3>
                {workflowRuns.length === 0 ? <div className="state-panel">No workflow runs yet. Create one to track the next admin step.</div> : null}
                {workflowRuns.map((run) => (
                  <article className="entity-card" key={run.id} style={{ marginBottom: "1rem" }}>
                    <div className="entity-card-header">
                      <div>
                        <StatusBadge status={run.status} />
                        <h3>Workflow run</h3>
                        <p>Created {formatOptionalDate(run.createdAt)}</p>
                      </div>
                      <div className="card-actions">
                        <button className="secondary-action" disabled={workflowRunsSaving || Boolean(workflowRunExecutingId)} onClick={() => editWorkflowRun(run)} type="button">Edit</button>
                        {canExecuteWorkflowRun(run.status) ? (
                          <button
                            className="primary-action"
                            disabled={workflowRunsSaving || Boolean(workflowRunExecutingId)}
                            onClick={() => void executeWorkflowRun(openWorkflowRunsProject.id, run.id)}
                            type="button"
                          >
                            {workflowRunExecutingId === run.id ? "Running" : "Execute"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <dl className="brief-grid">
                      <div>
                        <dt>Status</dt>
                        <dd>{run.status}</dd>
                      </div>
                      <div>
                        <dt>Created</dt>
                        <dd>{formatOptionalDate(run.createdAt)}</dd>
                      </div>
                      <div>
                        <dt>Started</dt>
                        <dd>{formatOptionalDate(run.startedAt)}</dd>
                      </div>
                      <div>
                        <dt>Finished</dt>
                        <dd>{formatOptionalDate(run.finishedAt)}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Admin notes preview</dt>
                        <dd>{formatPreview(run.adminNotes)}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Result placeholder preview</dt>
                        <dd>{formatPreview(run.resultPlaceholder)}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Execution log</dt>
                        <dd>{formatPreview(run.executionLog)}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Execution error</dt>
                        <dd>{formatPreview(run.executionError)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </section>
              <div className="modal-footer"><button className="secondary-action" onClick={closeWorkflowRuns} type="button">Close</button></div>
            </div>
          ) : <div>Project not found.</div>}
        </Modal>
      ) : null}
      {openContentDraftsId ? (
        <Modal onClose={closeContentDrafts} title="AI Content Production Foundation">
          {contentDraftsLoading ? (
            <LoadingState label="Loading content drafts" />
          ) : openContentDraftsProject ? (
            <div>
              {contentDraftsError ? <ErrorState title="Content draft action blocked" message={contentDraftsError} /> : null}
              <section className="field-panel">
                <h3>Article production planning</h3>
                <p className="muted-text">Current status is shown below. Next step: review or edit the admin draft, save your changes, then move it into internal review when ready. This screen does not publish, deliver to the client, open the Client Portal, send content to WordPress, or trigger external services.</p>
                <div className="state-panel" role="status">{contentDraftActionGuidance}</div>
                {contentDraftHandoffMessage ? <div className="state-panel" role="status">{contentDraftHandoffMessage}</div> : null}
                <div className="field-panel" style={{ marginBottom: "1rem" }}>
                  <h4>Current editor state</h4>
                  <dl className="brief-grid">
                    <div>
                      <dt>Editor mode</dt>
                      <dd>{contentDraftEditorId ? "Editing saved draft" : "Preparing new draft"}</dd>
                    </div>
                    <div>
                      <dt>Save state</dt>
                      <dd>{contentDraftSaveStateLabel}</dd>
                    </div>
                    <div>
                      <dt>Linked plan item</dt>
                      <dd>{contentDraftEditorLinkedPlanLabel}</dd>
                    </div>
                    <div>
                      <dt>Review readiness</dt>
                      <dd>{contentDraftReviewReadiness.ready ? "Ready for admin review" : "Needs attention before review"}</dd>
                    </div>
                  </dl>
                  <p className="muted-text">{contentDraftReviewReadiness.message}</p>
                </div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={contentDraftsSaving} onClick={() => { setContentDraftHandoffMessage(null); setContentDraftEditorId(null); setContentDraftForm(emptyContentDraft()); }} type="button">New draft</button>
                  <button className="secondary-action" disabled={contentDraftsSaving} onClick={closeContentDrafts} type="button">Close</button>
                  <button className="primary-action" disabled={contentDraftsSaving || !canSaveContentDraftForm} onClick={() => void saveContentDraft(openContentDraftsProject.id)} type="button">
                    {contentDraftsSaving ? "Saving" : contentDraftPrimaryActionLabel}
                  </button>
                  {activeContentDraftRecord && !activeContentDraftRecord.isArchived ? (
                    <button
                      className="primary-action"
                      disabled={contentDraftsSaving || !canMarkReadyCurrentDraft}
                      onClick={() => void requestContentDraftReview(openContentDraftsProject.id, activeContentDraftRecord.id)}
                      type="button"
                    >
                      Mark ready for review
                    </button>
                  ) : null}
                  {activeContentDraftRecord && !activeContentDraftRecord.isArchived && activeContentDraftRecord.status !== "DRAFT" ? (
                    <button className="secondary-action" disabled={contentDraftsSaving} onClick={() => void returnContentDraftToDraft(openContentDraftsProject.id, activeContentDraftRecord.id)} type="button">
                      Return to draft
                    </button>
                  ) : null}
                </div>
                <div className="field-panel" style={{ marginBottom: "1rem" }}>
                  <h4>Approved / planned content plan items</h4>
                  <p className="muted-text">Use approved or still-planned monthly content plan items to start a linked content draft. Items already marked as changes requested stay out of this picker until the plan is corrected.</p>
                  {eligibleContentDraftPlanItems.length === 0 ? <div className="state-panel">No ready plan items yet. Approve or add content plan items to continue draft production.</div> : null}
                  {eligibleContentDraftPlanItems.map((item) => {
                    const linkedDraft = contentDrafts.find((draftItem) => draftItem.contentPlanItemId === item.id && !draftItem.isArchived) ?? null;
                    return (
                      <article className="entity-card" key={item.id ?? `${item.sortOrder}-${item.title}`} style={{ marginBottom: "1rem" }}>
                        <div className="entity-card-header">
                          <div>
                            <StatusBadge status={formatContentPlanItemApprovalStatus(item.approvalStatus)} />
                            <h4>{item.sortOrder}. {item.title}</h4>
                            <p>{item.targetKeyword ? `Target keyword: ${item.targetKeyword}` : "No target keyword recorded yet."}</p>
                          </div>
                          <div className="card-actions">
                            <button className="secondary-action" disabled={contentDraftsSaving} onClick={() => startContentDraftFromPlanItem(item)} type="button">
                              {linkedDraft ? "Edit linked draft" : "Create linked draft"}
                            </button>
                          </div>
                        </div>
                        <dl className="brief-grid">
                          <div>
                            <dt>Plan approval</dt>
                            <dd>{formatContentPlanItemApprovalStatus(item.approvalStatus)}</dd>
                          </div>
                          <div>
                            <dt>Linked draft</dt>
                            <dd>{linkedDraft ? linkedDraft.title : "No active draft linked yet"}</dd>
                          </div>
                          <div className="field-span-2">
                            <dt>Planning notes</dt>
                            <dd>{item.notes ?? "No plan item notes"}</dd>
                          </div>
                          <div className="field-span-2">
                            <dt>Client note</dt>
                            <dd>{item.clientComment ?? "No client note"}</dd>
                          </div>
                        </dl>
                      </article>
                    );
                  })}
                </div>
                {activeContentDraftRecord ? (
                  <div className="field-panel" style={{ marginBottom: "1rem" }}>
                    <h4>Current draft status</h4>
                    <dl className="brief-grid">
                      <div>
                        <dt>Status</dt>
                        <dd>{formatContentDraftStatus(activeContentDraftRecord.status)}</dd>
                      </div>
                      <div>
                        <dt>Linked plan item</dt>
                        <dd>{contentDraftEditorLinkedPlanLabel}</dd>
                      </div>
                      <div>
                        <dt>Review requested</dt>
                        <dd>{formatOptionalDate(activeContentDraftRecord.reviewRequestedAt)}</dd>
                      </div>
                      <div>
                        <dt>Approved</dt>
                        <dd>{formatOptionalDate(activeContentDraftRecord.approvedAt)}</dd>
                      </div>
                      <div>
                        <dt>Revision count</dt>
                        <dd>{activeContentDraftRecord.revisionCount ?? 0}</dd>
                      </div>
                      <div>
                        <dt>Client comment</dt>
                        <dd>{activeContentDraftRecord.clientComment ?? "No client comment"}</dd>
                      </div>
                    </dl>
                  </div>
                ) : null}
                {activeContentDraftRecord ? (
                  <div className="field-panel" style={{ marginBottom: "1rem" }}>
                    <h4>Operator handoff path</h4>
                    <p className="muted-text">Use existing same-project image planning and deliverable records only. This handoff stays internal to the admin workflow and does not publish, export, or expose client delivery.</p>
                    <dl className="brief-grid">
                      <div>
                        <dt>Linked image records</dt>
                        <dd>{activeContentDraftLinkedImages.length}</dd>
                      </div>
                      <div>
                        <dt>Image status mix</dt>
                        <dd>{formatStatusBreakdown(activeContentDraftLinkedImages, "No linked image records yet")}</dd>
                      </div>
                      <div>
                        <dt>Linked deliverables</dt>
                        <dd>{activeContentDraftLinkedDeliverables.length}</dd>
                      </div>
                      <div>
                        <dt>Deliverable status mix</dt>
                        <dd>{formatStatusBreakdown(activeContentDraftLinkedDeliverables, "No linked deliverables yet")}</dd>
                      </div>
                    </dl>
                    <div className="card-actions" style={{ marginTop: "0.75rem" }}>
                      <button
                        className="secondary-action"
                        disabled={contentDraftsSaving}
                        onClick={() => void handoffContentDraftToArticleImages(openContentDraftsProject.id, activeContentDraftRecord.id)}
                        type="button"
                      >
                        Open image planning
                      </button>
                      <button
                        className="secondary-action"
                        disabled={contentDraftsSaving}
                        onClick={() => void handoffContentDraftToDeliverables(openContentDraftsProject.id, activeContentDraftRecord.id)}
                        type="button"
                      >
                        Open deliverable packaging
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className="field-grid">
                  <label>
                    Status - Required
                    <select value={contentDraftForm.status} onChange={(event) => setContentDraftForm((current) => ({ ...current, status: event.target.value }))}>
                      {(["DRAFT", "READY_FOR_REVIEW", "CHANGES_REQUESTED", "ARCHIVED"] as const).map((status) => <option key={status} value={status}>{formatContentDraftStatus(status)}</option>)}
                    </select>
                    <span className="muted-text">Admin-only production state. Saving here does not publish, deliver to the client, or trigger the Client Portal.</span>
                  </label>
                  <label>
                    Linked SEO topic / monthly content plan item - Optional
                    <select value={contentDraftForm.contentPlanItemId ?? ""} onChange={(event) => setContentDraftForm((current) => ({ ...current, contentPlanItemId: event.target.value || null }))}>
                      <option value="">Manual / unlinked production record</option>
                      {eligibleContentDraftPlanItems.map((item) => (
                        <option key={item.id} value={item.id}>{item.sortOrder}. {item.title} ({formatContentPlanItemApprovalStatus(item.approvalStatus)})</option>
                      ))}
                    </select>
                    <span className="muted-text">Link this draft to the approved or planned monthly content plan item it fulfills.</span>
                  </label>
                  <label className="field-span-2">
                    Title - Required
                    <input maxLength={255} placeholder="Working article title or draft headline" required value={contentDraftForm.title} onChange={(event) => setContentDraftForm((current) => ({ ...current, title: event.target.value }))} />
                    <span className="muted-text">Used by admin to prepare a platform-neutral article or content draft.</span>
                  </label>
                  <label>
                    Slug - Optional
                    <input maxLength={255} placeholder="Optional URL slug or short working slug" value={contentDraftForm.slug} onChange={(event) => setContentDraftForm((current) => ({ ...current, slug: event.target.value }))} />
                    <span className="muted-text">Visible only to admin team.</span>
                  </label>
                  <label className="field-span-2">
                    Draft body - Required before client review
                    <textarea maxLength={4000} placeholder="Manual draft body, article outline, sections, and review-ready copy" rows={10} value={contentDraftForm.draftBody} onChange={(event) => setContentDraftForm((current) => ({ ...current, draftBody: event.target.value }))} />
                    <span className="muted-text">Admin review/editing only. Save changes here before using the ready-for-review action.</span>
                  </label>
                  <label className="field-span-2">
                    Review / admin notes - Optional
                    <textarea maxLength={4000} placeholder="Admin comments, blockers, revision guidance, or handoff notes" rows={3} value={contentDraftForm.notes} onChange={(event) => setContentDraftForm((current) => ({ ...current, notes: event.target.value }))} />
                    <span className="muted-text">Visible only to admin team. Client review comments stay visible in the saved draft status panel.</span>
                  </label>
                </div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={contentDraftsSaving} onClick={() => { setContentDraftHandoffMessage(null); setContentDraftEditorId(null); setContentDraftForm(emptyContentDraft()); }} type="button">New draft</button>
                  <button className="secondary-action" disabled={contentDraftsSaving} onClick={closeContentDrafts} type="button">Close</button>
                  <button className="primary-action" disabled={contentDraftsSaving || !canSaveContentDraftForm} onClick={() => void saveContentDraft(openContentDraftsProject.id)} type="button">
                    {contentDraftsSaving ? "Saving" : contentDraftPrimaryActionLabel}
                  </button>
                  {activeContentDraftRecord && !activeContentDraftRecord.isArchived ? (
                    <button
                      className="primary-action"
                      disabled={contentDraftsSaving || !canMarkReadyCurrentDraft}
                      onClick={() => void requestContentDraftReview(openContentDraftsProject.id, activeContentDraftRecord.id)}
                      type="button"
                    >
                      Mark ready for review
                    </button>
                  ) : null}
                  {activeContentDraftRecord && !activeContentDraftRecord.isArchived && activeContentDraftRecord.status !== "DRAFT" ? (
                    <button className="secondary-action" disabled={contentDraftsSaving || !canReturnCurrentDraft} onClick={() => void returnContentDraftToDraft(openContentDraftsProject.id, activeContentDraftRecord.id)} type="button">
                      Return to draft
                    </button>
                  ) : null}
                </div>
              </section>

              <section className="field-panel">
                <h3>Existing article production records</h3>
                {contentDrafts.length === 0 ? <div className="state-panel">No content drafts yet. Create a draft after the content plan is ready.</div> : null}
                {contentDrafts.map((draftItem) => (
                  <article className="entity-card" key={draftItem.id} style={{ marginBottom: "1rem" }}>
                    <div className="entity-card-header">
                      <div>
                        <StatusBadge status={formatContentDraftStatus(draftItem.isArchived ? "ARCHIVED" : draftItem.status)} />
                        <h3>{draftItem.title}</h3>
                        <p>{draftItem.contentPlanItem ? `Linked to SEO topic: ${draftItem.contentPlanItem.title}` : "Manual / unlinked production record"}</p>
                      </div>
                      <div className="card-actions">
                        <button className="secondary-action" disabled={contentDraftsSaving} onClick={() => editContentDraft(draftItem)} type="button">Edit</button>
                        {!draftItem.isArchived ? <button className="secondary-action" disabled={contentDraftsSaving || !draftItem.draftBody.trim() || draftItem.status === "READY_FOR_REVIEW"} onClick={() => void requestContentDraftReview(openContentDraftsProject.id, draftItem.id)} type="button">Mark ready for review</button> : null}
                        {!draftItem.isArchived && draftItem.status !== "DRAFT" ? <button className="secondary-action" disabled={contentDraftsSaving} onClick={() => void returnContentDraftToDraft(openContentDraftsProject.id, draftItem.id)} type="button">Return to draft</button> : null}
                        {!draftItem.isArchived ? <button className="secondary-action" disabled={contentDraftsSaving} onClick={() => void archiveContentDraft(openContentDraftsProject.id, draftItem.id)} type="button">Archive</button> : null}
                      </div>
                    </div>
                    <dl className="brief-grid">
                      <div>
                        <dt>Status</dt>
                        <dd>{formatContentDraftStatus(draftItem.status)}</dd>
                      </div>
                      <div>
                        <dt>Slug</dt>
                        <dd>{draftItem.slug ?? "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Review requested</dt>
                        <dd>{formatOptionalDate(draftItem.reviewRequestedAt)}</dd>
                      </div>
                      <div>
                        <dt>Approved</dt>
                        <dd>{formatOptionalDate(draftItem.approvedAt)}</dd>
                      </div>
                      <div>
                        <dt>Revisions</dt>
                        <dd>{draftItem.revisionCount ?? 0}</dd>
                      </div>
                      <div>
                        <dt>Client comment</dt>
                        <dd>{draftItem.clientComment ?? "No client comment"}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Draft body preview</dt>
                        <dd>{formatPreview(draftItem.draftBody)}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Admin notes preview</dt>
                        <dd>{formatPreview(draftItem.notes)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </section>
              <div className="modal-footer"><button className="secondary-action" onClick={closeContentDrafts} type="button">Close</button></div>
            </div>
          ) : <div>Project not found.</div>}
        </Modal>
      ) : null}
      {openDeliverablesId ? (
        <Modal onClose={closeDeliverables} title="Deliverables">
          {deliverablesLoading ? (
            <LoadingState label="Loading deliverables" />
          ) : openDeliverablesProject ? (
            <div>
              {deliverablesError ? <ErrorState title="Deliverable action blocked" message={deliverablesError} /> : null}
              <section className="field-panel">
                <h3>Deliverable editor</h3>
                <p className="muted-text">Current status is shown below. Next step: package approved assets, upload a private document when needed, then use review placeholders when internal QA is needed. This screen does not perform client handoff, public links, export generation, publishing, or client self-service download.</p>
                <div className="state-panel" role="status">{deliverableActionGuidance}</div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={deliverablesSaving} onClick={() => { setDeliverableEditorId(null); setDeliverableForm({ contentDraftId: null, articleImageId: null, title: "", description: null, deliveryType: "CONTENT_PACKAGE", status: "DRAFT", exportUrl: null, storageKey: null, notes: null, isArchived: false }); }} type="button">New deliverable</button>
                  <button className="secondary-action" disabled={deliverablesSaving} onClick={closeDeliverables} type="button">Close</button>
                  <button className="primary-action" disabled={deliverablesSaving || !(deliverableForm.title || "").trim()} onClick={() => void saveDeliverable(openDeliverablesProject.id)} type="button">{deliverablesSaving ? "Saving" : deliverableEditorId ? "Save deliverable" : "Create deliverable"}</button>
                  {activeDeliverableRecord && !activeDeliverableRecord.isArchived ? (
                    <button className="primary-action" disabled={deliverablesSaving || activeDeliverableRecord.status === "READY"} onClick={() => void markDeliverableReady(openDeliverablesProject.id, activeDeliverableRecord.id)} type="button">Mark ready</button>
                  ) : null}
                  {activeDeliverableRecord && !activeDeliverableRecord.isArchived ? (
                    <button className="secondary-action" disabled={deliverablesSaving || !["READY", "ACCEPTED", "DELIVERED"].includes(activeDeliverableRecord.status)} onClick={() => void requestDeliverableRevision(openDeliverablesProject.id, activeDeliverableRecord.id)} type="button">Request revision</button>
                  ) : null}
                  {activeDeliverableRecord && !activeDeliverableRecord.isArchived ? (
                    <button className="secondary-action" disabled={deliverablesSaving || !["READY", "DELIVERED"].includes(activeDeliverableRecord.status)} onClick={() => void acceptDeliverable(openDeliverablesProject.id, activeDeliverableRecord.id)} type="button">Internal accept</button>
                  ) : null}
                  {activeDeliverableRecord?.isArchived ? (
                    <button className="secondary-action" disabled={deliverablesSaving} onClick={() => void restoreDeliverable(openDeliverablesProject.id, activeDeliverableRecord.id)} type="button">Restore deliverable</button>
                  ) : null}
                </div>
                {activeDeliverableRecord ? (
                  <div className="field-panel" style={{ marginBottom: "1rem" }}>
                    <h4>Current deliverable status</h4>
                    <dl className="brief-grid">
                      <div>
                        <dt>Status</dt>
                        <dd>{formatDeliverableStatus(activeDeliverableRecord.isArchived ? "ARCHIVED" : activeDeliverableRecord.status)}</dd>
                      </div>
                      <div>
                        <dt>Linked content draft</dt>
                        <dd>{activeDeliverableRecord.contentDraft ? `${activeDeliverableRecord.contentDraft.title} (${formatContentDraftStatus(activeDeliverableRecord.contentDraft.status)})` : "Not linked"}</dd>
                      </div>
                      <div>
                        <dt>Linked article image</dt>
                        <dd>{activeDeliverableRecord.articleImage ? `${activeDeliverableRecord.articleImage.title} (${formatArticleImageStatus(activeDeliverableRecord.articleImage.status)})` : "Not linked"}</dd>
                      </div>
                      <div>
                        <dt>Export reference</dt>
                        <dd>{activeDeliverableRecord.exportUrl || "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Storage reference</dt>
                        <dd>{activeDeliverableRecord.storageKey || "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Archived state</dt>
                        <dd>{activeDeliverableRecord.isArchived ? "Archived" : "Active admin packaging record"}</dd>
                      </div>
                    </dl>
                  </div>
                ) : null}
                <div className="field-panel" style={{ marginBottom: "1rem" }}>
                  <h4>Package completeness summary</h4>
                  <p className="muted-text">This is an internal admin readiness check built only from the linked draft, image, and deliverable data already loaded here. It does not generate exports, publish content, upload assets, or create client delivery access.</p>
                  <dl className="brief-grid">
                    <div>
                      <dt>Linked content draft</dt>
                      <dd>{deliverableLinkedDraftRecord ? `${deliverableLinkedDraftRecord.title} (${formatContentDraftStatus(deliverableLinkedDraftRecord.status)})` : "Missing"}</dd>
                    </div>
                    <div>
                      <dt>Linked image records</dt>
                      <dd>{formatStatusBreakdown(deliverableRelatedImages, "No linked image records yet")}</dd>
                    </div>
                    <div>
                      <dt>Direct package image</dt>
                      <dd>{deliverableLinkedImageRecord ? `${deliverableLinkedImageRecord.title} (${formatArticleImageStatus(deliverableLinkedImageRecord.status)})` : "Not linked"}</dd>
                    </div>
                    <div>
                      <dt>Final reference</dt>
                      <dd>{deliverableHasRecordedReference ? "Recorded" : "Missing"}</dd>
                    </div>
                    <div>
                      <dt>Package status</dt>
                      <dd>{formatDeliverableStatus(deliverableForm.status)}</dd>
                    </div>
                    <div>
                      <dt>Ready-state guard</dt>
                      <dd>{deliverableReadinessBlockers.length === 0 ? "Clear" : "Blocked"}</dd>
                    </div>
                  </dl>
                  <div className="state-panel" role="status">
                    {deliverableReadinessBlockers.length === 0
                      ? "This admin package has the linked draft, image readiness, and final reference details needed for internal handoff tracking."
                      : `Ready-state blockers: ${deliverableReadinessBlockers.join(" ")}`}
                  </div>
                </div>
                <div className="field-panel" style={{ marginBottom: "1rem" }}>
                  <h4>Internal final handoff view</h4>
                  <p className="muted-text">Internal admin handoff only. This view summarizes the article draft, image planning, package record, and internal notes already loaded in this screen. It does not create client delivery, public links, publication, WordPress transfer, or export output.</p>
                  <dl className="brief-grid">
                    <div>
                      <dt>Article / package title</dt>
                      <dd>{deliverableLinkedDraftRecord?.title || activeDeliverableRecord?.title || deliverableForm.title || "Not set"}</dd>
                    </div>
                    <div>
                      <dt>Draft status</dt>
                      <dd>{deliverableLinkedDraftRecord ? formatContentDraftStatus(deliverableLinkedDraftRecord.status) : "No linked draft loaded"}</dd>
                    </div>
                    <div className="field-span-2">
                      <dt>Draft body preview</dt>
                      <dd>{deliverableLinkedDraftRecord ? formatPreview(deliverableLinkedDraftRecord.draftBody) : "No linked draft body available"}</dd>
                    </div>
                    <div>
                      <dt>Image planning records</dt>
                      <dd>{deliverableRelatedImages.length}</dd>
                    </div>
                    <div>
                      <dt>Image readiness mix</dt>
                      <dd>{formatStatusBreakdown(deliverableRelatedImages, "No linked image records yet")}</dd>
                    </div>
                    <div className="field-span-2">
                      <dt>Image references</dt>
                      <dd>
                        {deliverableRelatedImages.length > 0
                          ? deliverableRelatedImages.map((image) => `${image.title}: ${image.finalImageUrl || image.storageKey || image.previewImageUrl || "No reference yet"}`).join(" | ")
                          : "No linked image references yet"}
                      </dd>
                    </div>
                    <div>
                      <dt>Package delivery type</dt>
                      <dd>{formatEnumLabel(deliverableForm.deliveryType)}</dd>
                    </div>
                    <div>
                      <dt>Package status</dt>
                      <dd>{formatDeliverableStatus(activeDeliverableRecord?.isArchived ? "ARCHIVED" : deliverableForm.status)}</dd>
                    </div>
                    <div className="field-span-2">
                      <dt>Package notes</dt>
                      <dd>{formatPreview(deliverableForm.notes ?? activeDeliverableRecord?.notes)}</dd>
                    </div>
                    <div className="field-span-2">
                      <dt>Latest internal review notes</dt>
                      <dd>
                        {selectedReviewDeliverableId === activeDeliverableRecord?.id && latestSelectedReview
                          ? formatPreview(latestSelectedReview.reviewNotes)
                          : "Open Reviews on this deliverable to load internal review placeholder notes."}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="field-grid">
                  <label>
                    Linked content draft - Optional
                    <select value={deliverableForm.contentDraftId || ""} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, contentDraftId: e.target.value || null }))}>
                      <option value="">None</option>
                      {deliverableDraftOptions.map((draftItem) => (
                        <option key={draftItem.id} value={draftItem.id}>{draftItem.title} ({formatContentDraftStatus(draftItem.status)})</option>
                      ))}
                    </select>
                    <span className="muted-text">Approved content draft to package in this admin-only deliverable record.</span>
                  </label>
                  <label>
                    Linked article image - Optional
                    <select value={deliverableForm.articleImageId || ""} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, articleImageId: e.target.value || null }))}>
                      <option value="">None</option>
                      {deliverableArticleImageOptions.map((ai) => (
                        <option key={ai.id} value={ai.id}>{ai.title} ({formatArticleImageStatus(ai.status)})</option>
                      ))}
                    </select>
                    <span className="muted-text">Approved or final-ready article image to include in the package record.</span>
                  </label>
                  <label className="field-span-2">
                    Title - Required
                    <input maxLength={255} placeholder="Internal package name for this content or image handoff record" required value={deliverableForm.title || ""} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, title: e.target.value }))} />
                    <span className="muted-text">Platform-neutral name for the deliverable package record.</span>
                  </label>
                  <label className="field-span-2">
                    Description - Optional
                    <textarea maxLength={4000} placeholder="What this deliverable contains and what stage it is in" rows={3} value={deliverableForm.description || ""} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, description: e.target.value }))} />
                    <span className="muted-text">Internal packaging summary only. Not exposed to clients in this block.</span>
                  </label>
                  <label>
                    Delivery type - Required
                    <select value={deliverableForm.deliveryType || "CONTENT_PACKAGE"} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, deliveryType: e.target.value }))}>
                      {(["CONTENT_PACKAGE","ARTICLE_DRAFT","ARTICLE_IMAGE","CLIENT_HANDOFF","OTHER"] as const).map((dt) => <option key={dt} value={dt}>{dt}</option>)}
                    </select>
                    <span className="muted-text">Package classification only. Keep this platform-neutral rather than connector-specific.</span>
                  </label>
                  <label>
                    Status - Required
                    <select value={deliverableForm.status || "DRAFT"} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, status: e.target.value }))}>
                      {(["DRAFT","READY","DELIVERED","REVISION_REQUESTED","ACCEPTED","ARCHIVED"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span className="muted-text">Use the action buttons for ready, revision, accept, archive, and restore transitions.</span>
                  </label>
                  <label>
                    Export reference - Optional
                    <input maxLength={2048} type="url" placeholder="Existing admin-only export reference, if already created elsewhere" value={deliverableForm.exportUrl || ""} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, exportUrl: e.target.value }))} />
                    <span className="muted-text">Admin reference only. No export generation or client delivery is performed here.</span>
                  </label>
                  <label className="field-span-2">
                    Storage key reference - Optional
                    <input maxLength={1024} placeholder="Internal private-storage reference, if already assigned elsewhere" value={deliverableForm.storageKey || ""} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, storageKey: e.target.value }))} />
                    <span className="muted-text">Internal reference only. Use the per-record private document controls below when you need to upload or open a stored asset.</span>
                  </label>
                  <label className="field-span-2">
                    Packaging notes - Optional
                    <textarea maxLength={4000} placeholder="Internal QA notes, packaging context, or revision details for the admin team" rows={3} value={deliverableForm.notes || ""} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, notes: e.target.value }))} />
                    <span className="muted-text">Visible only to admin team and review placeholders.</span>
                  </label>
                </div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={deliverablesSaving} onClick={() => { setDeliverableEditorId(null); setDeliverableForm({ contentDraftId: null, articleImageId: null, title: "", description: null, deliveryType: "CONTENT_PACKAGE", status: "DRAFT", exportUrl: null, storageKey: null, notes: null, isArchived: false }); }} type="button">New deliverable</button>
                  <button className="secondary-action" disabled={deliverablesSaving} onClick={closeDeliverables} type="button">Close</button>
                  <button className="primary-action" disabled={deliverablesSaving || !(deliverableForm.title || "").trim()} onClick={() => void saveDeliverable(openDeliverablesProject.id)} type="button">{deliverablesSaving ? "Saving" : deliverableEditorId ? "Save deliverable" : "Create deliverable"}</button>
                  {activeDeliverableRecord && !activeDeliverableRecord.isArchived ? (
                    <button className="primary-action" disabled={deliverablesSaving || activeDeliverableRecord.status === "READY"} onClick={() => void markDeliverableReady(openDeliverablesProject.id, activeDeliverableRecord.id)} type="button">Mark ready</button>
                  ) : null}
                  {activeDeliverableRecord && !activeDeliverableRecord.isArchived ? (
                    <button className="secondary-action" disabled={deliverablesSaving || !["READY", "ACCEPTED", "DELIVERED"].includes(activeDeliverableRecord.status)} onClick={() => void requestDeliverableRevision(openDeliverablesProject.id, activeDeliverableRecord.id)} type="button">Request revision</button>
                  ) : null}
                  {activeDeliverableRecord && !activeDeliverableRecord.isArchived ? (
                    <button className="secondary-action" disabled={deliverablesSaving || !["READY", "DELIVERED"].includes(activeDeliverableRecord.status)} onClick={() => void acceptDeliverable(openDeliverablesProject.id, activeDeliverableRecord.id)} type="button">Internal accept</button>
                  ) : null}
                  {activeDeliverableRecord?.isArchived ? (
                    <button className="secondary-action" disabled={deliverablesSaving} onClick={() => void restoreDeliverable(openDeliverablesProject.id, activeDeliverableRecord.id)} type="button">Restore deliverable</button>
                  ) : null}
                </div>
              </section>

              <section className="field-panel">
                <h3>Existing deliverables</h3>
                <p className="muted-text">
                  Showing active deliverables first, then archived records. Active: {activeDeliverableCount}. Archived: {archivedDeliverableCount}.
                </p>
                {!deliverablesError && deliverables.length === 0 ? (
                  <div className="state-panel">No deliverables yet. Package approved assets when ready.</div>
                ) : null}
                {visibleDeliverables.map((d) => (
                  <article className="entity-card" key={d.id} style={{ marginBottom: "1rem" }}>
                    <div className="entity-card-header">
                      <div>
                        <StatusBadge status={formatDeliverableStatus(d.isArchived ? "ARCHIVED" : d.status)} />
                        <h3>{d.title}</h3>
                        <p>{formatEnumLabel(d.deliveryType)} - Updated {formatOptionalDate(d.updatedAt)}</p>
                      </div>
                      <div className="card-actions">
                        <button className="secondary-action" disabled={deliverablesSaving} onClick={() => editDeliverable(d)} type="button">Edit</button>
                        {!d.isArchived ? <button className="secondary-action" disabled={deliverablesSaving || d.status === "READY"} onClick={() => void markDeliverableReady(openDeliverablesProject.id, d.id)} type="button">Mark ready</button> : null}
                        {!d.isArchived ? <button className="secondary-action" disabled={deliverablesSaving || !["READY", "ACCEPTED", "DELIVERED"].includes(d.status)} onClick={() => void requestDeliverableRevision(openDeliverablesProject.id, d.id)} type="button">Request revision</button> : null}
                        {!d.isArchived ? <button className="secondary-action" disabled={deliverablesSaving || !["READY", "DELIVERED"].includes(d.status)} onClick={() => void acceptDeliverable(openDeliverablesProject.id, d.id)} type="button">Internal accept</button> : null}
                        <button className="secondary-action" disabled={deliverablesSaving || deliverableReviewsLoading} onClick={() => void openDeliverableReviews(openDeliverablesProject.id, d.id)} type="button">Reviews</button>
                        {!d.isArchived ? <button className="secondary-action" disabled={deliverablesSaving} onClick={() => void archiveDeliverable(openDeliverablesProject.id, d.id)} type="button">Archive</button> : null}
                        {d.isArchived ? <button className="secondary-action" disabled={deliverablesSaving} onClick={() => void restoreDeliverable(openDeliverablesProject.id, d.id)} type="button">Restore</button> : null}
                      </div>
                    </div>
                    <dl className="brief-grid">
                      <div>
                        <dt>Linked content draft</dt>
                        <dd>{d.contentDraft ? `${d.contentDraft.title} (${formatContentDraftStatus(d.contentDraft.status)})` : "Not linked"}</dd>
                      </div>
                      <div>
                        <dt>Linked article image</dt>
                        <dd>{d.articleImage ? `${d.articleImage.title} (${formatArticleImageStatus(d.articleImage.status)})` : "Not linked"}</dd>
                      </div>
                      <div>
                        <dt>Export reference</dt>
                        <dd>{d.exportUrl || "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Storage key reference</dt>
                        <dd>{d.storageKey || "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Export / storage state</dt>
                        <dd>{getDeliverableExportState(d)}</dd>
                      </div>
                      <div>
                        <dt>Visibility</dt>
                        <dd>{d.isArchived ? "Archived admin packaging record" : "Visible in active admin list only"}</dd>
                      </div>
                      <div>
                        <dt>Private asset</dt>
                        <dd>{d.storageKey ? "Private asset stored" : "Not stored yet"}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd><StatusBadge status={formatDeliverableStatus(d.isArchived ? "ARCHIVED" : d.status)} /></dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Notes</dt>
                        <dd>{d.notes || "No notes"}</dd>
                      </div>
                    </dl>
                    {!d.isArchived ? (
                      <div className="field-grid" style={{ marginTop: "0.75rem" }}>
                        <label className="field-span-2">
                          Private document upload - Optional
                          <input
                            accept=".pdf,image/png,image/jpeg,image/webp"
                            onChange={(event) =>
                              setDeliverableDocumentFiles((current) => ({
                                ...current,
                                [d.id]: event.target.files?.[0] ?? null
                              }))
                            }
                            type="file"
                          />
                          <span className="muted-text">Upload a private deliverable asset for this record. Manual export references remain visible where already recorded.</span>
                        </label>
                      </div>
                    ) : null}
                    <div className="card-actions" style={{ marginTop: "0.75rem" }}>
                      {!d.isArchived ? (
                        <button
                          className="secondary-action"
                          disabled={deliverablesSaving || !deliverableDocumentFiles[d.id]}
                          onClick={() => void uploadDeliverableDocument(openDeliverablesProject.id, d.id)}
                          type="button"
                        >
                          {deliverableUploadTargetId === d.id ? "Uploading" : "Upload private document"}
                        </button>
                      ) : null}
                      {d.storageKey ? (
                        <button
                          className="secondary-action"
                          disabled={deliverableDownloadTargetId === d.id}
                          onClick={() => void openDeliverableDocument(openDeliverablesProject.id, d.id)}
                          type="button"
                        >
                          {deliverableDownloadTargetId === d.id ? "Opening" : "Open private document"}
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </section>
              {!selectedReviewDeliverable && deliverables.length > 0 ? (
                <div className="state-panel">Select Reviews on a deliverable to view or create admin/operator review placeholders.</div>
              ) : null}
              {selectedReviewDeliverable ? (
                <section className="field-panel">
                  <h3>Deliverable reviews: {selectedReviewDeliverable.title}</h3>
                  <p className="muted-text">Current review status is shown below. Next step: add or update an internal review placeholder. This screen does not create client portal, public review, token approval, or email actions.</p>
                  <dl className="brief-grid">
                    <div>
                      <dt>Deliverable status</dt>
                      <dd><StatusBadge status={formatDeliverableStatus(selectedReviewDeliverable.isArchived ? "ARCHIVED" : selectedReviewDeliverable.status)} /></dd>
                    </div>
                    <div>
                      <dt>Latest review status</dt>
                      <dd>{latestSelectedReview ? <StatusBadge status={latestSelectedReview.status} /> : "No review placeholder yet"}</dd>
                    </div>
                    <div>
                      <dt>Review placeholders</dt>
                      <dd>{deliverableReviews.length}</dd>
                    </div>
                    <div>
                      <dt>Last review update</dt>
                      <dd>{latestSelectedReview ? formatOptionalDate(latestSelectedReview.updatedAt) : "Not set"}</dd>
                    </div>
                  </dl>
                  {selectedReviewDeliverable.isArchived ? (
                    <div className="state-panel">This deliverable is archived. Existing review placeholders remain visible for admin history.</div>
                  ) : null}
                  {deliverableReviewsLoading ? (
                    <LoadingState label="Loading deliverable reviews" />
                  ) : (
                    <>
                      {deliverableReviewsError ? <ErrorState title="Deliverable reviews unavailable" message={deliverableReviewsError} /> : null}
                      <div className="state-panel" role="status">Review placeholders stay internal to the admin team. Archived deliverables keep history, but restore applies only to archived records.</div>
                      <div className="modal-footer">
                        <button className="secondary-action" disabled={deliverableReviewsSaving} onClick={closeDeliverables} type="button">Close</button>
                        <button className="secondary-action" disabled={deliverableReviewsSaving} onClick={() => { setDeliverableReviewEditorId(null); setDeliverableReviewForm(emptyDeliverableReview()); }} type="button">New review placeholder</button>
                        <button className="primary-action" disabled={deliverableReviewsSaving} onClick={() => void saveDeliverableReview(openDeliverablesProject.id)} type="button">
                          {deliverableReviewsSaving ? "Saving" : deliverableReviewEditorId ? "Save review" : "Create review placeholder"}
                        </button>
                      </div>
                      <div className="field-grid">
                        <div className="field-span-2">
                          <span>Deliverable context</span>
                          <strong>{selectedReviewDeliverable.title}</strong>
                          <span className="muted-text">Review placeholder for this deliverable only.</span>
                        </div>
                        <label>
                          Review status - Required
                          <select value={deliverableReviewForm.status} onChange={(event) => setDeliverableReviewForm((current) => ({ ...current, status: event.target.value }))}>
                            {(["NOT_STARTED", "ADMIN_REVIEW", "CHANGES_REQUESTED", "APPROVED", "ARCHIVED"] as const).map((status) => <option key={status} value={status}>{formatEnumLabel(status)}</option>)}
                          </select>
                          <span className="muted-text">Current internal review status for this deliverable.</span>
                        </label>
                        <label>
                          Reviewer name - Optional
                          <input
                            maxLength={255}
                            placeholder="Admin reviewer or operator name"
                            value={deliverableReviewForm.reviewerName}
                            onChange={(event) => setDeliverableReviewForm((current) => ({ ...current, reviewerName: event.target.value }))}
                          />
                          <span className="muted-text">Visible only to admin team.</span>
                        </label>
                        <label className="field-span-2">
                          Review notes / change request - Optional
                          <textarea
                            maxLength={4000}
                            placeholder="Change requests, approval notes, or internal review context"
                            rows={3}
                            value={deliverableReviewForm.reviewNotes}
                            onChange={(event) => setDeliverableReviewForm((current) => ({ ...current, reviewNotes: event.target.value }))}
                          />
                          <span className="muted-text">Not shown to client. Use for admin review context or requested fixes.</span>
                        </label>
                      </div>
                      <div className="modal-footer">
                        <button className="secondary-action" disabled={deliverableReviewsSaving} onClick={closeDeliverables} type="button">Close</button>
                        <button className="secondary-action" disabled={deliverableReviewsSaving} onClick={() => { setDeliverableReviewEditorId(null); setDeliverableReviewForm(emptyDeliverableReview()); }} type="button">New review placeholder</button>
                        <button className="primary-action" disabled={deliverableReviewsSaving} onClick={() => void saveDeliverableReview(openDeliverablesProject.id)} type="button">
                          {deliverableReviewsSaving ? "Saving" : deliverableReviewEditorId ? "Save review" : "Create review placeholder"}
                        </button>
                      </div>

                      <h4>Existing review placeholders ({deliverableReviews.length})</h4>
                      {!deliverableReviewsError && deliverableReviews.length === 0 ? (
                        <div className="state-panel">No review placeholders yet. Add one to continue internal QA.</div>
                      ) : null}
                      {[...deliverableReviews].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((review) => (
                        <article className="entity-card" key={review.id} style={{ marginBottom: "1rem" }}>
                          <div className="entity-card-header">
                            <div>
                              <StatusBadge status={review.status} />
                              <h3>{review.reviewerName || "Unnamed reviewer"}</h3>
                              <p>Updated {formatOptionalDate(review.updatedAt)}</p>
                            </div>
                            <div className="card-actions">
                              <button className="secondary-action" disabled={deliverableReviewsSaving} onClick={() => editDeliverableReview(review)} type="button">Edit review</button>
                            </div>
                          </div>
                          <dl className="brief-grid">
                            <div>
                              <dt>Created</dt>
                              <dd>{formatOptionalDate(review.createdAt)}</dd>
                            </div>
                            <div>
                              <dt>Status</dt>
                              <dd><StatusBadge status={review.status} /></dd>
                            </div>
                            <div>
                              <dt>Reviewer</dt>
                              <dd>{review.reviewerName || "Unnamed reviewer"}</dd>
                            </div>
                            <div className="field-span-2">
                              <dt>Review notes</dt>
                              <dd>{review.reviewNotes || "No review notes"}</dd>
                            </div>
                          </dl>
                        </article>
                      ))}
                    </>
                  )}
                </section>
              ) : null}
              <div className="modal-footer"><button className="secondary-action" onClick={closeDeliverables} type="button">Close</button></div>
            </div>
          ) : <div>Project not found.</div>}
        </Modal>
      ) : null}

      {openArticleImagesId ? (
        <Modal onClose={closeArticleImages} title="Image Production Planning">
          {articleImagesLoading ? (
            <LoadingState label="Loading article image requests" />
          ) : openArticleImagesProject ? (
            <div>
              {articleImagesError ? <ErrorState title="Article image action blocked" message={articleImagesError} /> : null}
              <section className="field-panel">
                <h3>Image production planning</h3>
                <p className="muted-text">Current status is shown below. Next step: link a draft, save the request, record preview references manually, upload a private final asset when needed, then move it through preview and final-ready actions. This screen does not run AI image generation, upscaling, public links, publishing, or client image review.</p>
                <div className="state-panel" role="status">{articleImageActionGuidance}</div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={articleImagesSaving} onClick={() => { setArticleImageEditorId(null); setArticleImageForm((current) => ({ ...emptyArticleImage(), contentDraftId: current.contentDraftId })); }} type="button">New image request</button>
                  <button className="secondary-action" disabled={articleImagesSaving} onClick={closeArticleImages} type="button">Close</button>
                  <button className="primary-action" disabled={articleImagesSaving || !articleImageForm.contentDraftId || !articleImageForm.title.trim() || !articleImageForm.prompt.trim()} onClick={() => void saveArticleImage(openArticleImagesProject.id)} type="button">
                    {articleImagesSaving ? "Saving" : articleImageEditorId ? "Save image request" : "Create image request"}
                  </button>
                  {activeArticleImageRecord && !activeArticleImageRecord.isArchived ? (
                    <button
                      className="primary-action"
                      disabled={articleImagesSaving || !(activeArticleImageRecord.previewImageUrl ?? "").trim() || activeArticleImageRecord.status === "PREVIEW_READY"}
                      onClick={() => void markArticleImagePreviewReady(openArticleImagesProject.id, activeArticleImageRecord.id)}
                      type="button"
                    >
                      Mark preview ready
                    </button>
                  ) : null}
                  {activeArticleImageRecord && !activeArticleImageRecord.isArchived ? (
                    <button
                      className="secondary-action"
                      disabled={articleImagesSaving || !((activeArticleImageRecord.previewImageUrl ?? "").trim() || (activeArticleImageRecord.finalImageUrl ?? "").trim())}
                      onClick={() => void requestArticleImageChanges(openArticleImagesProject.id, activeArticleImageRecord.id)}
                      type="button"
                    >
                      Request changes
                    </button>
                  ) : null}
                  {activeArticleImageRecord && !activeArticleImageRecord.isArchived ? (
                    <button
                      className="secondary-action"
                      disabled={articleImagesSaving || !((activeArticleImageRecord.previewImageUrl ?? "").trim() || (activeArticleImageRecord.finalImageUrl ?? "").trim()) || activeArticleImageRecord.status === "APPROVED"}
                      onClick={() => void approveArticleImage(openArticleImagesProject.id, activeArticleImageRecord.id)}
                      type="button"
                    >
                      Approve image
                    </button>
                  ) : null}
                  {activeArticleImageRecord && !activeArticleImageRecord.isArchived ? (
                    <button
                      className="secondary-action"
                      disabled={articleImagesSaving || !((activeArticleImageRecord.finalImageUrl ?? "").trim() || (activeArticleImageRecord.storageKey ?? "").trim()) || activeArticleImageRecord.status === "FINAL_READY"}
                      onClick={() => void markArticleImageFinalReady(openArticleImagesProject.id, activeArticleImageRecord.id)}
                      type="button"
                    >
                      Mark final ready
                    </button>
                  ) : null}
                </div>
                {activeArticleImageRecord ? (
                  <div className="field-panel" style={{ marginBottom: "1rem" }}>
                    <h4>Current image status</h4>
                    <dl className="brief-grid">
                      <div>
                        <dt>Status</dt>
                        <dd>{formatArticleImageStatus(activeArticleImageRecord.status)}</dd>
                      </div>
                      <div>
                        <dt>Linked content draft</dt>
                        <dd>{activeArticleImageRecord.contentDraft?.title ?? "Not linked"}</dd>
                      </div>
                      <div>
                        <dt>Preview image</dt>
                        <dd>{activeArticleImageRecord.previewImageUrl || "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Final image</dt>
                        <dd>{activeArticleImageRecord.finalImageUrl || "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Storage reference</dt>
                        <dd>{activeArticleImageRecord.storageKey || "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Updated</dt>
                        <dd>{formatOptionalDate(activeArticleImageRecord.updatedAt)}</dd>
                      </div>
                    </dl>
                  </div>
                ) : null}
                {activeArticleImageRecord ? (
                  <div className="field-panel" style={{ marginBottom: "1rem" }}>
                    <h4>Packaging handoff</h4>
                    <p className="muted-text">This image record can hand off into the existing admin deliverable workflow when the linked draft and final references are ready. No image generation, export automation, upload automation, or client delivery happens from this section.</p>
                    <dl className="brief-grid">
                      <div>
                        <dt>Linked draft</dt>
                        <dd>{activeArticleImageRecord.contentDraft?.title ?? "Not linked"}</dd>
                      </div>
                      <div>
                        <dt>Image readiness</dt>
                        <dd>{formatArticleImageStatus(activeArticleImageRecord.status)}</dd>
                      </div>
                      <div>
                        <dt>Preview reference</dt>
                        <dd>{activeArticleImageRecord.previewImageUrl || "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Final reference</dt>
                        <dd>{activeArticleImageRecord.finalImageUrl || activeArticleImageRecord.storageKey || "Not set"}</dd>
                      </div>
                    </dl>
                    <div className="card-actions" style={{ marginTop: "0.75rem" }}>
                      <button
                        className="secondary-action"
                        disabled={articleImagesSaving}
                        onClick={() => void handoffArticleImageToDeliverables(openArticleImagesProject.id, activeArticleImageRecord)}
                        type="button"
                      >
                        Open deliverable packaging
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className="field-grid">
                  <label>
                    Linked content draft - Required
                    <select required value={articleImageForm.contentDraftId} onChange={(event) => setArticleImageForm((current) => ({ ...current, contentDraftId: event.target.value }))}>
                      <option value="">Select draft</option>
                      {articleImageDrafts.map((draftItem) => (
                        <option key={draftItem.id} value={draftItem.id}>{draftItem.title} ({formatContentDraftStatus(draftItem.status)})</option>
                      ))}
                    </select>
                    <span className="muted-text">Link this image record to the same-project content draft it supports.</span>
                  </label>
                  <label>
                    Status - Required
                    <select value={articleImageForm.status} onChange={(event) => setArticleImageForm((current) => ({ ...current, status: event.target.value }))}>
                      {(["DRAFT", "READY_FOR_GENERATION", "PREVIEW_READY", "CHANGES_REQUESTED", "APPROVED", "FINAL_READY", "ARCHIVED"] as const).map((status) => <option key={status} value={status}>{formatArticleImageStatus(status)}</option>)}
                    </select>
                    <span className="muted-text">Admin-only status. Use the action buttons for preview, approval, and final-ready transitions.</span>
                  </label>
                  <label className="field-span-2">
                    Title - Required
                    <input maxLength={255} required value={articleImageForm.title} onChange={(event) => setArticleImageForm((current) => ({ ...current, title: event.target.value }))} />
                    <span className="muted-text">Working asset name for the linked article image.</span>
                  </label>
                  <label className="field-span-2">
                    Prompt - Required
                    <textarea maxLength={4000} required rows={5} value={articleImageForm.prompt} onChange={(event) => setArticleImageForm((current) => ({ ...current, prompt: event.target.value }))} />
                    <span className="muted-text">Admin-only prompt placeholder. Never exposed to clients from this block.</span>
                  </label>
                  <label className="field-span-2">
                    Style notes - Optional
                    <textarea maxLength={4000} rows={3} value={articleImageForm.styleNotes} onChange={(event) => setArticleImageForm((current) => ({ ...current, styleNotes: event.target.value }))} />
                    <span className="muted-text">Internal visual direction only.</span>
                  </label>
                  <label>
                    Preview image URL - Optional
                    <input maxLength={2048} type="url" value={articleImageForm.previewImageUrl} onChange={(event) => setArticleImageForm((current) => ({ ...current, previewImageUrl: event.target.value }))} />
                    <span className="muted-text">Manual admin record for a preview asset. No public link behavior is created here.</span>
                  </label>
                  <label>
                    Final image URL - Optional
                    <input maxLength={2048} type="url" value={articleImageForm.finalImageUrl} onChange={(event) => setArticleImageForm((current) => ({ ...current, finalImageUrl: event.target.value }))} />
                    <span className="muted-text">Manual admin record for the final asset reference only.</span>
                  </label>
                  <label className="field-span-2">
                    Storage key reference - Optional
                    <input maxLength={1024} value={articleImageForm.storageKey} onChange={(event) => setArticleImageForm((current) => ({ ...current, storageKey: event.target.value }))} />
                    <span className="muted-text">Internal storage reference only. Use the per-record private final asset controls below when you need to upload or open a stored final image.</span>
                  </label>
                  <label className="field-span-2">
                    Notes - Optional
                    <textarea maxLength={4000} rows={3} value={articleImageForm.notes} onChange={(event) => setArticleImageForm((current) => ({ ...current, notes: event.target.value }))} />
                    <span className="muted-text">Admin-only review context, revision notes, or handoff details.</span>
                  </label>
                </div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={articleImagesSaving} onClick={() => { setArticleImageEditorId(null); setArticleImageForm((current) => ({ ...emptyArticleImage(), contentDraftId: current.contentDraftId })); }} type="button">New image request</button>
                  <button className="secondary-action" disabled={articleImagesSaving} onClick={closeArticleImages} type="button">Close</button>
                  <button className="primary-action" disabled={articleImagesSaving || !articleImageForm.contentDraftId || !articleImageForm.title.trim() || !articleImageForm.prompt.trim()} onClick={() => void saveArticleImage(openArticleImagesProject.id)} type="button">
                    {articleImagesSaving ? "Saving" : articleImageEditorId ? "Save image request" : "Create image request"}
                  </button>
                  {activeArticleImageRecord && !activeArticleImageRecord.isArchived ? (
                    <button
                      className="primary-action"
                      disabled={articleImagesSaving || !(activeArticleImageRecord.previewImageUrl ?? "").trim() || activeArticleImageRecord.status === "PREVIEW_READY"}
                      onClick={() => void markArticleImagePreviewReady(openArticleImagesProject.id, activeArticleImageRecord.id)}
                      type="button"
                    >
                      Mark preview ready
                    </button>
                  ) : null}
                  {activeArticleImageRecord && !activeArticleImageRecord.isArchived ? (
                    <button
                      className="secondary-action"
                      disabled={articleImagesSaving || !((activeArticleImageRecord.previewImageUrl ?? "").trim() || (activeArticleImageRecord.finalImageUrl ?? "").trim())}
                      onClick={() => void requestArticleImageChanges(openArticleImagesProject.id, activeArticleImageRecord.id)}
                      type="button"
                    >
                      Request changes
                    </button>
                  ) : null}
                  {activeArticleImageRecord && !activeArticleImageRecord.isArchived ? (
                    <button
                      className="secondary-action"
                      disabled={articleImagesSaving || !((activeArticleImageRecord.previewImageUrl ?? "").trim() || (activeArticleImageRecord.finalImageUrl ?? "").trim()) || activeArticleImageRecord.status === "APPROVED"}
                      onClick={() => void approveArticleImage(openArticleImagesProject.id, activeArticleImageRecord.id)}
                      type="button"
                    >
                      Approve image
                    </button>
                  ) : null}
                  {activeArticleImageRecord && !activeArticleImageRecord.isArchived ? (
                    <button
                      className="secondary-action"
                      disabled={articleImagesSaving || !((activeArticleImageRecord.finalImageUrl ?? "").trim() || (activeArticleImageRecord.storageKey ?? "").trim()) || activeArticleImageRecord.status === "FINAL_READY"}
                      onClick={() => void markArticleImageFinalReady(openArticleImagesProject.id, activeArticleImageRecord.id)}
                      type="button"
                    >
                      Mark final ready
                    </button>
                  ) : null}
                </div>
              </section>

              <section className="field-panel">
                <h3>Existing image production records</h3>
                {articleImages.length === 0 ? <div className="state-panel">No article image records yet. Add an image request after a content draft is ready.</div> : null}
                {articleImages.map((image) => (
                  <article className="entity-card" key={image.id} style={{ marginBottom: "1rem" }}>
                    <div className="entity-card-header">
                      <div>
                        <StatusBadge status={formatArticleImageStatus(image.isArchived ? "ARCHIVED" : image.status)} />
                        <h3>{image.title}</h3>
                        <p>{image.contentDraft ? `Linked to draft: ${image.contentDraft.title}` : "No linked draft"}</p>
                      </div>
                      <div className="card-actions">
                        <button className="secondary-action" disabled={articleImagesSaving} onClick={() => editArticleImage(image)} type="button">Edit</button>
                        {!image.isArchived ? <button className="secondary-action" disabled={articleImagesSaving || !image.previewImageUrl || image.status === "PREVIEW_READY"} onClick={() => void markArticleImagePreviewReady(openArticleImagesProject.id, image.id)} type="button">Mark preview ready</button> : null}
                        {!image.isArchived ? <button className="secondary-action" disabled={articleImagesSaving || !(image.previewImageUrl || image.finalImageUrl)} onClick={() => void requestArticleImageChanges(openArticleImagesProject.id, image.id)} type="button">Request changes</button> : null}
                        {!image.isArchived ? <button className="secondary-action" disabled={articleImagesSaving || !(image.previewImageUrl || image.finalImageUrl) || image.status === "APPROVED"} onClick={() => void approveArticleImage(openArticleImagesProject.id, image.id)} type="button">Approve image</button> : null}
                        {!image.isArchived ? <button className="secondary-action" disabled={articleImagesSaving || !(image.finalImageUrl || image.storageKey) || image.status === "FINAL_READY"} onClick={() => void markArticleImageFinalReady(openArticleImagesProject.id, image.id)} type="button">Mark final ready</button> : null}
                        {!image.isArchived ? <button className="secondary-action" disabled={articleImagesSaving} onClick={() => void archiveArticleImage(openArticleImagesProject.id, image.id)} type="button">Archive</button> : null}
                      </div>
                    </div>
                    <dl className="brief-grid">
                      <div>
                        <dt>Status</dt>
                        <dd>{formatArticleImageStatus(image.status)}</dd>
                      </div>
                      <div>
                        <dt>Preview URL</dt>
                        <dd>{image.previewImageUrl || "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Final URL</dt>
                        <dd>{image.finalImageUrl || "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Storage key</dt>
                        <dd>{image.storageKey || "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Updated</dt>
                        <dd>{formatOptionalDate(image.updatedAt)}</dd>
                      </div>
                      <div>
                        <dt>Private asset</dt>
                        <dd>{image.storageKey ? "Private final asset stored" : "Not stored yet"}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Style notes</dt>
                        <dd>{image.styleNotes || "No style notes"}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Prompt</dt>
                        <dd>{image.prompt}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Notes</dt>
                        <dd>{image.notes || "No notes"}</dd>
                      </div>
                    </dl>
                    {!image.isArchived ? (
                      <div className="field-grid" style={{ marginTop: "0.75rem" }}>
                        <label className="field-span-2">
                          Private final image upload - Optional
                          <input
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(event) =>
                              setArticleImageFinalAssetFiles((current) => ({
                                ...current,
                                [image.id]: event.target.files?.[0] ?? null
                              }))
                            }
                            type="file"
                          />
                          <span className="muted-text">Upload a private final asset for this image record. Preview URL handling remains manual in this block.</span>
                        </label>
                      </div>
                    ) : null}
                    <div className="card-actions" style={{ marginTop: "0.75rem" }}>
                      {!image.isArchived ? (
                        <button
                          className="secondary-action"
                          disabled={articleImagesSaving || !articleImageFinalAssetFiles[image.id]}
                          onClick={() => void uploadArticleImageFinalAsset(openArticleImagesProject.id, image.id)}
                          type="button"
                        >
                          {articleImageUploadTargetId === image.id ? "Uploading" : "Upload final asset"}
                        </button>
                      ) : null}
                      {image.storageKey ? (
                        <button
                          className="secondary-action"
                          disabled={articleImageDownloadTargetId === image.id}
                          onClick={() => void openArticleImageDownload(openArticleImagesProject.id, image.id)}
                          type="button"
                        >
                          {articleImageDownloadTargetId === image.id ? "Opening" : "Open private final asset"}
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </section>
              <div className="modal-footer"><button className="secondary-action" onClick={closeArticleImages} type="button">Close</button></div>
            </div>
          ) : <div>Project not found.</div>}
        </Modal>
      ) : null}
    </section>
  );
}
