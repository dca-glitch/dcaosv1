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

export type AiDeliveryDeliverableSummary = {
  id: string;
  aiDeliveryProjectId: string;
  contentDraftId?: string | null;
  articleImageId?: string | null;
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
  brief: AiDeliveryBriefSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type AiDeliveryWorkflowRunFormValues = {
  status: string;
  adminNotes: string;
  resultPlaceholder: string;
};

type ContentPlanItemDraft = {
  localId: string;
  title: string;
  targetKeyword: string;
  contentType: string;
  notes: string;
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
  onFetchContentDrafts?: (projectId: string) => Promise<AiDeliveryContentDraftSummary[]>;
  onSaveContentDraft?: (projectId: string, draftId: string | null, values: AiDeliveryContentDraftFormValues) => Promise<AiDeliveryContentDraftSummary | null>;
  onArchiveContentDraft?: (projectId: string, draftId: string) => Promise<AiDeliveryContentDraftSummary | null>;
  onRequestContentDraftReview?: (projectId: string, draftId: string) => Promise<AiDeliveryContentDraftSummary | null>;
  onFetchArticleImages?: (projectId: string) => Promise<AiDeliveryArticleImageSummary[]>;
  onSaveArticleImage?: (projectId: string, imageId: string | null, values: AiDeliveryArticleImageFormValues) => Promise<AiDeliveryArticleImageSummary | null>;
  onArchiveArticleImage?: (projectId: string, imageId: string) => Promise<AiDeliveryArticleImageSummary | null>;
  onFetchDeliverables?: (projectId: string) => Promise<AiDeliveryDeliverableSummary[]>;
  onSaveDeliverable?: (projectId: string, deliverableId: string | null, values: AiDeliveryDeliverableFormValues) => Promise<AiDeliveryDeliverableSummary | null>;
  onArchiveDeliverable?: (projectId: string, deliverableId: string) => Promise<boolean>;
  onFetchDeliverableReviews?: (projectId: string, deliverableId: string) => Promise<AiDeliveryDeliverableReviewSummary[]>;
  onSaveDeliverableReview?: (projectId: string, deliverableId: string, reviewId: string | null, values: AiDeliveryDeliverableReviewFormValues) => Promise<AiDeliveryDeliverableReviewSummary | null>;
  onFetchWorkflowRuns?: (projectId: string) => Promise<AiDeliveryWorkflowRunSummary[]>;
  onSaveWorkflowRun?: (projectId: string, workflowRunId: string | null, values: AiDeliveryWorkflowRunFormValues) => Promise<AiDeliveryWorkflowRunSummary | null>;
};

const workflowRunStatuses = ["DRAFT", "READY", "IN_PROGRESS", "REVIEW", "COMPLETED", "ARCHIVED"] as const;
type WorkflowRunStatus = (typeof workflowRunStatuses)[number];
const workflowRunStatusLabels: Record<WorkflowRunStatus, string> = {
  DRAFT: "Draft",
  READY: "Ready",
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  COMPLETED: "Completed",
  ARCHIVED: "Archived"
};

function normalizeWorkflowRunStatus(status: string | null | undefined): WorkflowRunStatus {
  return workflowRunStatuses.includes(status as WorkflowRunStatus) ? (status as WorkflowRunStatus) : "DRAFT";
}

function getWorkflowRunNextStatus(status: string | null | undefined): WorkflowRunStatus | null {
  const currentIndex = workflowRunStatuses.indexOf(normalizeWorkflowRunStatus(status));
  return currentIndex >= 0 && currentIndex < workflowRunStatuses.length - 1 ? workflowRunStatuses[currentIndex + 1] : null;
}

function getWorkflowRunStatusOptions(status: string | null | undefined): WorkflowRunStatus[] {
  if (!status) return ["DRAFT"];
  const currentStatus = normalizeWorkflowRunStatus(status);
  const nextStatus = getWorkflowRunNextStatus(currentStatus);
  return nextStatus ? [currentStatus, nextStatus] : [currentStatus];
}

function getWorkflowRunStatusHelper(status: string | null | undefined): string {
  if (!status) return "New workflow runs start in Draft.";
  const currentStatus = normalizeWorkflowRunStatus(status);
  const nextStatus = getWorkflowRunNextStatus(currentStatus);
  if (!nextStatus) return "No further status transitions are available. Same-status save is allowed for notes/result edits.";
  return `Allowed next status: ${workflowRunStatusLabels[nextStatus]}. Same-status save is allowed for notes/result edits.`;
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
  notes: item.notes ?? ""
});

const emptyContentPlanItem = (): ContentPlanItemDraft => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  title: "",
  targetKeyword: "",
  contentType: "article",
  notes: ""
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
  if (plan.status === "CLIENT_REVIEW_REQUESTED") return "Client review requested";
  if (plan.status === "CLIENT_APPROVED") return "Client approved";
  if (plan.status === "CLIENT_CHANGES_REQUESTED") return "Client changes requested";
  if (!plan.reviewRequestedAt) return "Pending / not requested";
  return plan.status;
}

function formatEnumLabel(value?: string | null): string {
  if (!value) return "Not set";
  return String(value).toLowerCase().replace(/_/g, " ").replace(/(^|\s)\S/g, (s) => s.toUpperCase());
}

function getSafeDeliverableExportUrl(value?: string | null): string | null {
  const exportUrl = (value ?? "").trim();
  if (!exportUrl) return null;
  if (exportUrl.startsWith("/") && !exportUrl.startsWith("//")) return exportUrl;
  try {
    const parsedUrl = new URL(exportUrl);
    return ["http:", "https:"].includes(parsedUrl.protocol) ? exportUrl : null;
  } catch {
    return null;
  }
}

function getDeliverableExportState(item: AiDeliveryDeliverableSummary): string {
  if (getSafeDeliverableExportUrl(item.exportUrl)) return "Export URL available";
  if ((item.exportUrl ?? "").trim()) return "Export URL is not a safe HTTP(S) or app-relative link.";
  if ((item.storageKey ?? "").trim()) return "Storage key recorded; direct download unavailable until a safe admin download URL is provided.";
  return "No export/download target available.";
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
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
  onFetchContentDrafts,
  onSaveContentDraft,
  onArchiveContentDraft,
  onRequestContentDraftReview,
  onFetchArticleImages,
  onSaveArticleImage,
  onArchiveArticleImage,
  onFetchDeliverables,
  onSaveDeliverable,
  onArchiveDeliverable,
  onFetchDeliverableReviews,
  onSaveDeliverableReview,
  onFetchWorkflowRuns,
  onSaveWorkflowRun
}: AiDeliveryProjectsProps) {
  const [filter, setFilter] = useState<"all" | "active" | "archived">("active");
  const [editorProjectId, setEditorProjectId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<AiDeliveryProjectFormValues>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [openBriefId, setOpenBriefId] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
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
  const [contentPlanDetail, setContentPlanDetail] = useState<AiDeliveryContentPlanSummary | null>(null);
  const [contentPlanItems, setContentPlanItems] = useState<ContentPlanItemDraft[]>([]);
  const [openContentDraftsId, setOpenContentDraftsId] = useState<string | null>(null);
  const [contentDraftsLoading, setContentDraftsLoading] = useState(false);
  const [contentDraftsSaving, setContentDraftsSaving] = useState(false);
  const [contentDrafts, setContentDrafts] = useState<AiDeliveryContentDraftSummary[]>([]);
  const [contentDraftEditorId, setContentDraftEditorId] = useState<string | null>(null);
  const [contentDraftForm, setContentDraftForm] = useState<AiDeliveryContentDraftFormValues>(emptyContentDraft());
  const [contentDraftPlan, setContentDraftPlan] = useState<AiDeliveryContentPlanSummary | null>(null);
  const [openArticleImagesId, setOpenArticleImagesId] = useState<string | null>(null);
  const [articleImagesLoading, setArticleImagesLoading] = useState(false);
  const [articleImagesSaving, setArticleImagesSaving] = useState(false);
  const [articleImages, setArticleImages] = useState<AiDeliveryArticleImageSummary[]>([]);
  const [articleImageEditorId, setArticleImageEditorId] = useState<string | null>(null);
  const [articleImageForm, setArticleImageForm] = useState<AiDeliveryArticleImageFormValues>(emptyArticleImage());
  const [articleImageDrafts, setArticleImageDrafts] = useState<AiDeliveryContentDraftSummary[]>([]);
  const [openDeliverablesId, setOpenDeliverablesId] = useState<string | null>(null);
  const [deliverablesLoading, setDeliverablesLoading] = useState(false);
  const [deliverablesSaving, setDeliverablesSaving] = useState(false);
  const [deliverablesError, setDeliverablesError] = useState<string | null>(null);
  const [deliverables, setDeliverables] = useState<AiDeliveryDeliverableSummary[]>([]);
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
  const [workflowRuns, setWorkflowRuns] = useState<AiDeliveryWorkflowRunSummary[]>([]);
  const [workflowRunEditorId, setWorkflowRunEditorId] = useState<string | null>(null);
  const [workflowRunForm, setWorkflowRunForm] = useState<AiDeliveryWorkflowRunFormValues>(emptyWorkflowRun());

  const selectedProject = useMemo(() => projects.find((p) => p.id === editorProjectId) ?? null, [editorProjectId, projects]);
  const openProject = useMemo(() => projects.find((p) => p.id === openBriefId) ?? null, [openBriefId, projects]);
  const openContentPlanProject = useMemo(() => projects.find((p) => p.id === openContentPlanId) ?? null, [openContentPlanId, projects]);
  const openContentDraftsProject = useMemo(() => projects.find((p) => p.id === openContentDraftsId) ?? null, [openContentDraftsId, projects]);
  const openArticleImagesProject = useMemo(() => projects.find((p) => p.id === openArticleImagesId) ?? null, [openArticleImagesId, projects]);
  const openDeliverablesProject = useMemo(() => projects.find((p) => p.id === openDeliverablesId) ?? null, [openDeliverablesId, projects]);
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
  const openWorkflowRunsProject = useMemo(() => projects.find((p) => p.id === openWorkflowRunsId) ?? null, [openWorkflowRunsId, projects]);
  const workflowRunBeingEdited = useMemo(() => workflowRuns.find((run) => run.id === workflowRunEditorId) ?? null, [workflowRunEditorId, workflowRuns]);
  const workflowRunStatusOptions = useMemo(() => getWorkflowRunStatusOptions(workflowRunBeingEdited?.status ?? null), [workflowRunBeingEdited?.status]);
  const workflowRunStatusHelper = useMemo(() => getWorkflowRunStatusHelper(workflowRunBeingEdited?.status ?? null), [workflowRunBeingEdited?.status]);
  const isWorkflowRunStatusAllowed = workflowRunStatusOptions.includes(normalizeWorkflowRunStatus(workflowRunForm.status));
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

  async function openBrief(projectId: string) {
    setOpenBriefId(projectId);
    setBriefLoading(true);
    setBriefDetail(null);
    try {
      if (typeof onFetchBrief === "function") {
        const b = await onFetchBrief(projectId);
        setBriefDetail(b);
      }
    } finally {
      setBriefLoading(false);
    }
  }

  async function handleSaveBrief(projectId: string) {
    if (!briefDetail) return;
    if (typeof onSaveBrief !== "function") return;
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
  }

  async function openContentPlan(projectId: string) {
    setOpenContentPlanId(projectId);
    setContentPlanLoading(true);
    setContentPlanDetail(null);
    setContentPlanItems([]);
    try {
      if (typeof onFetchContentPlan === "function") {
        const plan = await onFetchContentPlan(projectId);
        setContentPlanDetail(plan);
        setContentPlanItems(plan?.items.map(itemDraftFromPlanItem) ?? []);
      }
    } finally {
      setContentPlanLoading(false);
    }
  }

  async function handleCreateContentPlan(projectId: string) {
    if (typeof onCreateContentPlan !== "function") return;
    setContentPlanSaving(true);
    try {
      const plan = await onCreateContentPlan(projectId);
      if (plan) {
        setContentPlanDetail(plan);
        setContentPlanItems(plan.items.map(itemDraftFromPlanItem));
      }
    } finally {
      setContentPlanSaving(false);
    }
  }

  async function handleSaveContentPlan(projectId: string) {
    if (typeof onSaveContentPlan !== "function") return;
    setContentPlanSaving(true);
    try {
      const plan = await onSaveContentPlan(projectId, {
        items: contentPlanItems.map((item, index) => ({
          title: item.title.trim(),
          targetKeyword: item.targetKeyword.trim() || null,
          contentType: item.contentType.trim() || "article",
          notes: item.notes.trim() || null,
          sortOrder: index + 1
        }))
      });
      if (plan) {
        setContentPlanDetail(plan);
        setContentPlanItems(plan.items.map(itemDraftFromPlanItem));
      }
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
    try {
      const plan = await action(projectId);
      if (plan) {
        setContentPlanDetail(plan);
        setContentPlanItems(plan.items.map(itemDraftFromPlanItem));
      }
    } finally {
      setContentPlanSaving(false);
    }
  }

  function closeContentPlan() {
    setOpenContentPlanId(null);
    setContentPlanDetail(null);
    setContentPlanItems([]);
  }

  async function openContentDrafts(projectId: string) {
    setOpenContentDraftsId(projectId);
    setContentDraftsLoading(true);
    setContentDrafts([]);
    setContentDraftEditorId(null);
    setContentDraftForm(emptyContentDraft());
    try {
      const [drafts, plan] = await Promise.all([
        typeof onFetchContentDrafts === "function" ? onFetchContentDrafts(projectId) : Promise.resolve([]),
        typeof onFetchContentPlan === "function" ? onFetchContentPlan(projectId) : Promise.resolve(null)
      ]);
      setContentDrafts(drafts);
      setContentDraftPlan(plan);
    } finally {
      setContentDraftsLoading(false);
    }
  }

  function editContentDraft(draftItem: AiDeliveryContentDraftSummary) {
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

  async function saveContentDraft(projectId: string) {
    if (typeof onSaveContentDraft !== "function") return;
    setContentDraftsSaving(true);
    try {
      const saved = await onSaveContentDraft(projectId, contentDraftEditorId, contentDraftForm);
      if (saved && typeof onFetchContentDrafts === "function") {
        setContentDrafts(await onFetchContentDrafts(projectId));
        setContentDraftEditorId(null);
        setContentDraftForm(emptyContentDraft());
      }
    } finally {
      setContentDraftsSaving(false);
    }
  }

  async function archiveContentDraft(projectId: string, draftId: string) {
    if (typeof onArchiveContentDraft !== "function" || typeof onFetchContentDrafts !== "function") return;
    setContentDraftsSaving(true);
    try {
      await onArchiveContentDraft(projectId, draftId);
      setContentDrafts(await onFetchContentDrafts(projectId));
    } finally {
      setContentDraftsSaving(false);
    }
  }

  async function requestContentDraftReview(projectId: string, draftId: string) {
    if (typeof onRequestContentDraftReview !== "function" || typeof onFetchContentDrafts !== "function") return;
    setContentDraftsSaving(true);
    try {
      await onRequestContentDraftReview(projectId, draftId);
      setContentDrafts(await onFetchContentDrafts(projectId));
    } finally {
      setContentDraftsSaving(false);
    }
  }

  function closeContentDrafts() {
    setOpenContentDraftsId(null);
    setContentDrafts([]);
    setContentDraftEditorId(null);
    setContentDraftForm(emptyContentDraft());
    setContentDraftPlan(null);
  }

  async function openArticleImages(projectId: string) {
    setOpenArticleImagesId(projectId);
    setArticleImagesLoading(true);
    setArticleImages([]);
    setArticleImageDrafts([]);
    setArticleImageEditorId(null);
    setArticleImageForm(emptyArticleImage());
    try {
      const [images, drafts] = await Promise.all([
        typeof onFetchArticleImages === "function" ? onFetchArticleImages(projectId) : Promise.resolve([]),
        typeof onFetchContentDrafts === "function" ? onFetchContentDrafts(projectId) : Promise.resolve([])
      ]);
      const activeDrafts = drafts.filter((draftItem) => !draftItem.isArchived);
      setArticleImages(images);
      setArticleImageDrafts(activeDrafts);
      setArticleImageForm((current) => ({ ...current, contentDraftId: activeDrafts[0]?.id ?? current.contentDraftId }));
    } finally {
      setArticleImagesLoading(false);
    }
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
    try {
      const saved = await onSaveArticleImage(projectId, articleImageEditorId, articleImageForm);
      if (saved && typeof onFetchArticleImages === "function") {
        setArticleImages(await onFetchArticleImages(projectId));
        setArticleImageEditorId(null);
        setArticleImageForm((current) => ({ ...emptyArticleImage(), contentDraftId: current.contentDraftId }));
      }
    } finally {
      setArticleImagesSaving(false);
    }
  }

  async function archiveArticleImage(projectId: string, imageId: string) {
    if (typeof onArchiveArticleImage !== "function" || typeof onFetchArticleImages !== "function") return;
    setArticleImagesSaving(true);
    try {
      await onArchiveArticleImage(projectId, imageId);
      setArticleImages(await onFetchArticleImages(projectId));
    } finally {
      setArticleImagesSaving(false);
    }
  }

  function closeArticleImages() {
    setOpenArticleImagesId(null);
    setArticleImages([]);
    setArticleImageDrafts([]);
    setArticleImageEditorId(null);
    setArticleImageForm(emptyArticleImage());
  }

  async function openDeliverables(projectId: string) {
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
      setDeliverables(items);
      setArticleImageDrafts(activeDrafts);
      setArticleImages(images);
      setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, contentDraftId: activeDrafts[0]?.id ?? null }));
    } catch (error) {
      setDeliverablesError(getErrorMessage(error, "Unable to load deliverables for this project."));
    } finally {
      setDeliverablesLoading(false);
    }
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

  async function archiveDeliverable(projectId: string, deliverableId: string) {
    if (typeof onArchiveDeliverable !== "function" || typeof onFetchDeliverables !== "function") return;
    setDeliverablesSaving(true);
    setDeliverablesError(null);
    try {
      await onArchiveDeliverable(projectId, deliverableId);
      setDeliverables(await onFetchDeliverables(projectId));
      if (selectedReviewDeliverableId === deliverableId) {
        setSelectedReviewDeliverableId(null);
        setDeliverableReviews([]);
        setDeliverableReviewEditorId(null);
        setDeliverableReviewForm(emptyDeliverableReview());
      }
    } catch (error) {
      setDeliverablesError(getErrorMessage(error, "Unable to archive this deliverable."));
    } finally {
      setDeliverablesSaving(false);
    }
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
    setWorkflowRuns([]);
    setWorkflowRunEditorId(null);
    setWorkflowRunForm(emptyWorkflowRun());
    try {
      if (typeof onFetchWorkflowRuns === "function") {
        setWorkflowRuns(await onFetchWorkflowRuns(projectId));
      }
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
    try {
      const saved = await onSaveWorkflowRun(projectId, workflowRunEditorId, workflowRunForm);
      if (saved && typeof onFetchWorkflowRuns === "function") {
        setWorkflowRuns(await onFetchWorkflowRuns(projectId));
        setWorkflowRunEditorId(null);
        setWorkflowRunForm(emptyWorkflowRun());
      }
    } finally {
      setWorkflowRunsSaving(false);
    }
  }

  function closeWorkflowRuns() {
    setOpenWorkflowRunsId(null);
    setWorkflowRuns([]);
    setWorkflowRunEditorId(null);
    setWorkflowRunForm(emptyWorkflowRun());
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
    ? formatStatusBreakdown(workflowRuns, "No workflow runs loaded for the open project")
    : "Open a project's Workflow runs to load per-project counts.";
  const seoTopicsHelper = openContentPlanId
    ? `${contentPlanItems.length} topic/research planning record(s) loaded for the open project.`
    : "Open a project's SEO research to load topic/research planning records.";
  const contentProductionHelper = openContentDraftsId || openArticleImagesId
    ? `Draft planning records loaded: ${openContentDraftsId ? contentDrafts.length : "-"} - Image planning records loaded: ${openArticleImagesId ? articleImages.length : "-"}`
    : "Open Content production or Article images to load article/image planning records.";
  const deliverablesHelper = openDeliverablesId
    ? `${formatStatusBreakdown(deliverables, "No deliverables loaded for the open project")} - Active: ${activeDeliverableCount} - Archived: ${archivedDeliverableCount}`
    : "Open a project's Deliverables to load per-project counts.";
  const reviewsHelper = selectedReviewDeliverableId
    ? `${formatStatusBreakdown(deliverableReviews, "No review placeholders loaded for the selected deliverable")} - Pending placeholders: ${pendingDeliverableReviewCount}`
    : openDeliverablesId
      ? "Select Reviews on a deliverable to load review placeholder counts."
      : "Open Deliverables, then select Reviews to load review placeholder counts.";

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
        description="Read-only AI Delivery overview using already loaded admin data. Project totals are tenant-level; SEO, production, workflow, deliverable, and review counts reflect the currently opened project/detail panels only."
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
            label="Workflow runs loaded"
            value={openWorkflowRunsId ? workflowRuns.length : "-"}
            helper={workflowRunsHelper}
          />
          <MetricCard
            accent="cyan"
            label="SEO topics loaded"
            value={openContentPlanId ? contentPlanItems.length : "-"}
            helper={seoTopicsHelper}
          />
          <MetricCard
            accent="violet"
            label="Production planning loaded"
            value={openContentDraftsId || openArticleImagesId ? `${openContentDraftsId ? contentDrafts.length : "-"}/${openArticleImagesId ? articleImages.length : "-"}` : "-"}
            helper={contentProductionHelper}
          />
          <MetricCard
            accent="success"
            label="Deliverables loaded"
            value={openDeliverablesId ? deliverables.length : "-"}
            helper={deliverablesHelper}
          />
          <MetricCard
            accent="warning"
            label="Review placeholders loaded"
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
          message={projects.length === 0 ? "No AI delivery projects found for this tenant." : "No AI delivery projects match the current filter."}
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
                <div className="card-actions">
                  {canEdit ? (
                    <>
                      {/* Workflow actions - ordered for admin flow */}
                      <button className="secondary-action" onClick={() => void openBrief(p.id)} type="button" disabled={!p.brief}>
                        Brief
                      </button>
                      <button className="secondary-action" onClick={() => void openContentPlan(p.id)} type="button">
                        SEO research
                      </button>
                      <button className="secondary-action" onClick={() => void openWorkflowRuns(p.id)} type="button">
                        Workflow runs
                      </button>
                      <button className="secondary-action" onClick={() => void openContentDrafts(p.id)} type="button">
                        Content production
                      </button>
                      <button className="secondary-action" onClick={() => void openArticleImages(p.id)} type="button">
                        Article images
                      </button>
                      <button className="secondary-action" onClick={() => void openDeliverables(p.id)} type="button">
                        Deliverables
                      </button>
                      {/* Secondary actions */}
                      <button className="secondary-action" onClick={() => openEditModal(p)} type="button">
                        Edit
                      </button>
                      {!p.isArchived ? (
                        <button className="secondary-action" onClick={() => void onArchive(p.id)} type="button">
                          Archive
                        </button>
                      ) : null}
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
                <div>
                  <span>Workflow</span>
                  <strong>
                    Brief: {p.brief ? formatEnumLabel(p.brief.status) : "No"} - SEO topics: open to load - Production: open to load - Deliverables: open to load
                  </strong>
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
            setBriefDetail(null);
          }}
          title="AI Delivery Brief"
        >
          {briefLoading ? (
            <LoadingState label="Loading brief" />
          ) : openProject ? (
            briefDetail ? (
              <div>
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

                <div className="modal-footer">
                  <button className="secondary-action" onClick={() => { setOpenBriefId(null); setBriefDetail(null); }} type="button">Close</button>
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
                  <button className="secondary-action" onClick={() => { setOpenBriefId(null); setBriefDetail(null); }} type="button">Close</button>
                  {canEdit && typeof onSaveBrief === "function" ? (
                    <button className="primary-action" onClick={() => void handleSaveBrief(openProject.id)} type="button">Save brief</button>
                  ) : null}
                </div>
              </div>
            ) : openProject.brief ? (
              <div>
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
                  <button className="secondary-action" onClick={() => { setOpenBriefId(null); setBriefDetail(null); }} type="button">Close</button>
                </div>
              </div>
            ) : (
              <div>No brief available for this project.</div>
            )
          ) : (
            <div>Project not found.</div>
          )}
        </Modal>
      ) : null}
      {openContentPlanId ? (
        <Modal onClose={closeContentPlan} title="AI SEO Foundation">
          {contentPlanLoading ? (
            <LoadingState label="Loading content plan" />
          ) : openContentPlanProject ? (
            contentPlanDetail ? (
              <div>
                <section className="field-panel">
                  <h3>SEO topic/research planning</h3>
                  <p className="muted-text">Admin/operator-side foundation only. Use these monthly content plan items to capture target topics, keywords, research notes, and content type intent. No AI generation, crawling, scraping, GA/GSC integration, publishing, or external service calls run from this screen.</p>
                </section>
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
                  <h3>Client review visibility</h3>
                  <dl className="brief-grid">
                    <div>
                      <dt>Review state</dt>
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
                    <div className="state-panel">No SEO topic or research planning records have been added yet.</div>
                  ) : null}
                  {contentPlanItems.map((item, index) => (
                    <div className="field-grid" key={item.localId} style={{ marginBottom: "1rem" }}>
                      <label>
                        Topic / working title
                        <input
                          maxLength={255}
                          onChange={(event) => setContentPlanItems((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, title: event.target.value } : draftItem))}
                          required
                          value={item.title}
                        />
                      </label>
                      <label>
                        Production type
                        <input
                          maxLength={80}
                          onChange={(event) => setContentPlanItems((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, contentType: event.target.value } : draftItem))}
                          value={item.contentType}
                        />
                      </label>
                      <label>
                        Target keyword / theme
                        <input
                          maxLength={255}
                          onChange={(event) => setContentPlanItems((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, targetKeyword: event.target.value } : draftItem))}
                          value={item.targetKeyword}
                        />
                      </label>
                      <div>
                        <span>Sort order</span>
                        <strong>{index + 1}</strong>
                      </div>
                      <div>
                        <span>Client item status</span>
                        <strong>{contentPlanDetail.items[index]?.approvalStatus ?? "No client status"}</strong>
                      </div>
                      <label className="field-span-2">
                        Research notes / search intent
                        <textarea
                          maxLength={4000}
                          onChange={(event) => setContentPlanItems((current) => current.map((draftItem) => draftItem.localId === item.localId ? { ...draftItem, notes: event.target.value } : draftItem))}
                          rows={3}
                          value={item.notes}
                        />
                      </label>
                      <div className="field-span-2">
                        <span>Client comment</span>
                        <strong>{contentPlanDetail.items[index]?.clientComment ?? "No client comment"}</strong>
                      </div>
                      <div className="field-span-2">
                        <button
                          className="secondary-action"
                          disabled={contentPlanSaving}
                          onClick={() => setContentPlanItems((current) => current.filter((draftItem) => draftItem.localId !== item.localId))}
                          type="button"
                        >
                          Remove topic
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    className="secondary-action"
                    disabled={contentPlanSaving}
                    onClick={() => setContentPlanItems((current) => [...current, emptyContentPlanItem()])}
                    type="button"
                  >
                    Add SEO topic
                  </button>
                </section>

                <div className="modal-footer">
                  <button className="secondary-action" disabled={contentPlanSaving} onClick={closeContentPlan} type="button">Close</button>
                  <button className="secondary-action" disabled={contentPlanSaving} onClick={() => void handleContentPlanAction(openContentPlanProject.id, onRequestContentPlanReview)} type="button">Request client review</button>
                  <button className="secondary-action" disabled={contentPlanSaving} onClick={() => void handleContentPlanAction(openContentPlanProject.id, onApproveContentPlan)} type="button">Approve plan</button>
                  <button className="primary-action" disabled={contentPlanSaving || contentPlanItems.some((item) => !item.title.trim())} onClick={() => void handleSaveContentPlan(openContentPlanProject.id)} type="button">
                    {contentPlanSaving ? "Saving" : "Save SEO plan"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="state-panel">
                  No monthly content plan exists for {openContentPlanProject.name}. Create one to start adding SEO topic/research planning records. This creates admin-side planning placeholders only; it does not generate, crawl, publish, or call external services.
                </div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={contentPlanSaving} onClick={closeContentPlan} type="button">Close</button>
                  <button className="primary-action" disabled={contentPlanSaving} onClick={() => void handleCreateContentPlan(openContentPlanProject.id)} type="button">
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
      {openWorkflowRunsId ? (
        <Modal onClose={closeWorkflowRuns} title="Workflow Runs">
          {workflowRunsLoading ? (
            <LoadingState label="Loading workflow runs" />
          ) : openWorkflowRunsProject ? (
            <div>
              <section className="field-panel">
                <h3>Workflow run editor</h3>
                <p className="muted-text">Admin-operated workflow run records only. No AI calls, crawling, publishing, automation, or deliverable generation runs from this screen.</p>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={workflowRunsSaving} onClick={closeWorkflowRuns} type="button">Close</button>
                  <button className="secondary-action" disabled={workflowRunsSaving} onClick={() => { setWorkflowRunEditorId(null); setWorkflowRunForm(emptyWorkflowRun()); }} type="button">New workflow run</button>
                  <button className="primary-action" disabled={workflowRunsSaving || !isWorkflowRunStatusAllowed} onClick={() => void saveWorkflowRun(openWorkflowRunsProject.id)} type="button">
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
                    <span className="muted-text">Visible only to admin team. Not shown to client.</span>
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
                    <span className="muted-text">Internal result summary only. No AI generation runs from this form.</span>
                  </label>
                </div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={workflowRunsSaving} onClick={closeWorkflowRuns} type="button">Close</button>
                  <button className="secondary-action" disabled={workflowRunsSaving} onClick={() => { setWorkflowRunEditorId(null); setWorkflowRunForm(emptyWorkflowRun()); }} type="button">New workflow run</button>
                  <button className="primary-action" disabled={workflowRunsSaving || !isWorkflowRunStatusAllowed} onClick={() => void saveWorkflowRun(openWorkflowRunsProject.id)} type="button">
                    {workflowRunsSaving ? "Saving" : workflowRunEditorId ? "Save workflow run" : "Create workflow run"}
                  </button>
                </div>
              </section>

              <section className="field-panel">
                <h3>Existing workflow runs</h3>
                {workflowRuns.length === 0 ? <div className="state-panel">No workflow runs have been created yet.</div> : null}
                {workflowRuns.map((run) => (
                  <article className="entity-card" key={run.id} style={{ marginBottom: "1rem" }}>
                    <div className="entity-card-header">
                      <div>
                        <StatusBadge status={run.status} />
                        <h3>Workflow run</h3>
                        <p>Created {formatOptionalDate(run.createdAt)}</p>
                      </div>
                      <div className="card-actions">
                        <button className="secondary-action" disabled={workflowRunsSaving} onClick={() => editWorkflowRun(run)} type="button">Edit</button>
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
                      <div className="field-span-2">
                        <dt>Admin notes preview</dt>
                        <dd>{formatPreview(run.adminNotes)}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Result placeholder preview</dt>
                        <dd>{formatPreview(run.resultPlaceholder)}</dd>
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
              <section className="field-panel">
                <h3>Article production planning</h3>
                <p className="muted-text">Admin/operator-side foundation only. Capture planned article records, draft placeholders, slugs, status, and notes. No AI writing, generation, publishing, WordPress integration, or external service calls run from this screen.</p>
                <div className="field-grid">
                  <label>
                    Linked SEO topic / monthly content plan item
                    <select value={contentDraftForm.contentPlanItemId ?? ""} onChange={(event) => setContentDraftForm((current) => ({ ...current, contentPlanItemId: event.target.value || null }))}>
                      <option value="">Manual / unlinked production record</option>
                      {(contentDraftPlan?.items ?? []).map((item) => (
                        <option key={item.id} value={item.id}>{item.sortOrder}. {item.title}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Status
                    <select value={contentDraftForm.status} onChange={(event) => setContentDraftForm((current) => ({ ...current, status: event.target.value }))}>
                      {(["DRAFT", "READY_FOR_REVIEW", "APPROVED", "CHANGES_REQUESTED", "ARCHIVED"] as const).map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                  <label>
                    Title
                    <input maxLength={255} required value={contentDraftForm.title} onChange={(event) => setContentDraftForm((current) => ({ ...current, title: event.target.value }))} />
                  </label>
                  <label>
                    Slug
                    <input maxLength={255} value={contentDraftForm.slug} onChange={(event) => setContentDraftForm((current) => ({ ...current, slug: event.target.value }))} />
                  </label>
                  <label className="field-span-2">
                    Article outline / draft placeholder
                    <textarea rows={10} value={contentDraftForm.draftBody} onChange={(event) => setContentDraftForm((current) => ({ ...current, draftBody: event.target.value }))} />
                  </label>
                  <label className="field-span-2">
                    Admin notes
                    <textarea maxLength={4000} rows={3} value={contentDraftForm.notes} onChange={(event) => setContentDraftForm((current) => ({ ...current, notes: event.target.value }))} />
                  </label>
                </div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={contentDraftsSaving} onClick={() => { setContentDraftEditorId(null); setContentDraftForm(emptyContentDraft()); }} type="button">New draft</button>
                  <button className="primary-action" disabled={contentDraftsSaving || !contentDraftForm.title.trim()} onClick={() => void saveContentDraft(openContentDraftsProject.id)} type="button">
                    {contentDraftsSaving ? "Saving" : contentDraftEditorId ? "Save production record" : "Create production record"}
                  </button>
                </div>
              </section>

              <section className="field-panel">
                <h3>Existing article production records</h3>
                {contentDrafts.length === 0 ? <div className="state-panel">No article production planning records have been created yet.</div> : null}
                {contentDrafts.map((draftItem) => (
                  <article className="entity-card" key={draftItem.id} style={{ marginBottom: "1rem" }}>
                    <div className="entity-card-header">
                      <div>
                        <StatusBadge status={draftItem.isArchived ? "Archived" : draftItem.status} />
                        <h3>{draftItem.title}</h3>
                        <p>{draftItem.contentPlanItem ? `Linked to SEO topic: ${draftItem.contentPlanItem.title}` : "Manual / unlinked production record"}</p>
                      </div>
                      <div className="card-actions">
                        <button className="secondary-action" disabled={contentDraftsSaving} onClick={() => editContentDraft(draftItem)} type="button">Edit</button>
                        {!draftItem.isArchived ? <button className="secondary-action" disabled={contentDraftsSaving} onClick={() => void requestContentDraftReview(openContentDraftsProject.id, draftItem.id)} type="button">Request client review</button> : null}
                        {!draftItem.isArchived ? <button className="secondary-action" disabled={contentDraftsSaving} onClick={() => void archiveContentDraft(openContentDraftsProject.id, draftItem.id)} type="button">Archive</button> : null}
                      </div>
                    </div>
                    <dl className="brief-grid">
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
              <section className="field-panel">
                <h3>Deliverable editor</h3>
                <p className="muted-text">Admin-operated deliverable records only. No export generation, upload, R2 write, WordPress, or client portal in this block.</p>
                <div className="field-grid">
                  <label>
                    Linked content draft
                    <select value={deliverableForm.contentDraftId || ""} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, contentDraftId: e.target.value || null }))}>
                      <option value="">None</option>
                      {articleImageDrafts.map((draftItem) => (
                        <option key={draftItem.id} value={draftItem.id}>{draftItem.title}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Linked article image
                    <select value={deliverableForm.articleImageId || ""} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, articleImageId: e.target.value || null }))}>
                      <option value="">None</option>
                      {articleImages.map((ai) => (
                        <option key={ai.id} value={ai.id}>{ai.title}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field-span-2">
                    Title
                    <input maxLength={255} required value={deliverableForm.title || ""} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, title: e.target.value }))} />
                  </label>
                  <label className="field-span-2">
                    Description
                    <textarea maxLength={4000} rows={3} value={deliverableForm.description || ""} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, description: e.target.value }))} />
                  </label>
                  <label>
                    Delivery type
                    <select value={deliverableForm.deliveryType || "CONTENT_PACKAGE"} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, deliveryType: e.target.value }))}>
                      {(["CONTENT_PACKAGE","ARTICLE_DRAFT","ARTICLE_IMAGE","CLIENT_HANDOFF","OTHER"] as const).map((dt) => <option key={dt} value={dt}>{dt}</option>)}
                    </select>
                  </label>
                  <label>
                    Status
                    <select value={deliverableForm.status || "DRAFT"} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, status: e.target.value }))}>
                      {(["DRAFT","READY","DELIVERED","REVISION_REQUESTED","ACCEPTED","ARCHIVED"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label>
                    Export URL
                    <input maxLength={2048} type="url" value={deliverableForm.exportUrl || ""} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, exportUrl: e.target.value }))} />
                  </label>
                  <label className="field-span-2">
                    Storage key
                    <input maxLength={1024} value={deliverableForm.storageKey || ""} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, storageKey: e.target.value }))} />
                  </label>
                  <label className="field-span-2">
                    Notes
                    <textarea maxLength={4000} rows={3} value={deliverableForm.notes || ""} onChange={(e) => setDeliverableForm((current: AiDeliveryDeliverableFormValues) => ({ ...current, notes: e.target.value }))} />
                  </label>
                </div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={deliverablesSaving} onClick={() => { setDeliverableEditorId(null); setDeliverableForm({ contentDraftId: null, articleImageId: null, title: "", description: null, deliveryType: "CONTENT_PACKAGE", status: "DRAFT", exportUrl: null, storageKey: null, notes: null, isArchived: false }); }} type="button">New deliverable</button>
                  <button className="primary-action" disabled={deliverablesSaving || !(deliverableForm.title || "").trim()} onClick={() => void saveDeliverable(openDeliverablesProject.id)} type="button">{deliverablesSaving ? "Saving" : deliverableEditorId ? "Save deliverable" : "Create deliverable"}</button>
                </div>
              </section>

              <section className="field-panel">
                <h3>Existing deliverables</h3>
                <p className="muted-text">
                  Showing active deliverables first, then archived records. Active: {activeDeliverableCount}. Archived: {archivedDeliverableCount}.
                </p>
                {deliverablesError ? <ErrorState title="Deliverables unavailable" message={deliverablesError} /> : null}
                {!deliverablesError && deliverables.length === 0 ? (
                  <div className="state-panel">No deliverables have been created yet. Create a deliverable above before opening review placeholders.</div>
                ) : null}
                {visibleDeliverables.map((d) => (
                  <article className="entity-card" key={d.id} style={{ marginBottom: "1rem" }}>
                    <div className="entity-card-header">
                      <div>
                        <StatusBadge status={d.isArchived ? "Archived" : d.status} />
                        <h3>{d.title}</h3>
                        <p>{formatEnumLabel(d.deliveryType)} - Updated {formatOptionalDate(d.updatedAt)}</p>
                      </div>
                      <div className="card-actions">
                        {getSafeDeliverableExportUrl(d.exportUrl) ? (
                          <>
                            <a className="secondary-action" href={getSafeDeliverableExportUrl(d.exportUrl) ?? undefined} rel="noreferrer" target="_blank">Open export</a>
                            <a className="secondary-action" download href={getSafeDeliverableExportUrl(d.exportUrl) ?? undefined}>Download</a>
                          </>
                        ) : null}
                        <button className="secondary-action" disabled={deliverablesSaving} onClick={() => editDeliverable(d)} type="button">Edit</button>
                        <button className="secondary-action" disabled={deliverablesSaving || deliverableReviewsLoading} onClick={() => void openDeliverableReviews(openDeliverablesProject.id, d.id)} type="button">Reviews</button>
                        {!d.isArchived ? <button className="secondary-action" disabled={deliverablesSaving} onClick={() => void archiveDeliverable(openDeliverablesProject.id, d.id)} type="button">Archive</button> : null}
                      </div>
                    </div>
                    <dl className="brief-grid">
                      <div>
                        <dt>Export URL</dt>
                        <dd>{getSafeDeliverableExportUrl(d.exportUrl) ? <a href={getSafeDeliverableExportUrl(d.exportUrl) ?? undefined} rel="noreferrer" target="_blank">{d.exportUrl}</a> : d.exportUrl || "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Storage key</dt>
                        <dd>{d.storageKey ? "Recorded for admin reference" : "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Export/download</dt>
                        <dd>{getDeliverableExportState(d)}</dd>
                      </div>
                      <div>
                        <dt>Visibility</dt>
                        <dd>{d.isArchived ? "Archived deliverable" : "Visible in active admin list"}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd><StatusBadge status={d.isArchived ? "Archived" : d.status} /></dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Notes</dt>
                        <dd>{d.notes || "No notes"}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </section>
              {!selectedReviewDeliverable && deliverables.length > 0 ? (
                <div className="state-panel">Select Reviews on a deliverable to view or create admin/operator review placeholders.</div>
              ) : null}
              {selectedReviewDeliverable ? (
                <section className="field-panel">
                  <h3>Deliverable reviews: {selectedReviewDeliverable.title}</h3>
                  <p className="muted-text">Admin/operator placeholders only. No client portal, public review links, token approvals, or email actions are created from this screen.</p>
                  <dl className="brief-grid">
                    <div>
                      <dt>Deliverable status</dt>
                      <dd><StatusBadge status={selectedReviewDeliverable.isArchived ? "Archived" : selectedReviewDeliverable.status} /></dd>
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
                        <div className="state-panel">No review placeholders have been created for this deliverable. Use the form above to add the first admin/operator review record.</div>
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
              <section className="field-panel">
                <h3>Image production planning</h3>
                <p className="muted-text">Admin/operator-side image planning only. Capture image intent, prompt placeholder, style notes, and status. No AI generation, upload, R2 write, client review, WordPress, or publishing action is available in this block.</p>
                <div className="field-grid">
                  <label>
                    Linked content draft
                    <select required value={articleImageForm.contentDraftId} onChange={(event) => setArticleImageForm((current) => ({ ...current, contentDraftId: event.target.value }))}>
                      <option value="">Select draft</option>
                      {articleImageDrafts.map((draftItem) => (
                        <option key={draftItem.id} value={draftItem.id}>{draftItem.title}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Status
                    <select value={articleImageForm.status} onChange={(event) => setArticleImageForm((current) => ({ ...current, status: event.target.value }))}>
                      {(["DRAFT", "READY_FOR_GENERATION", "PREVIEW_READY", "APPROVED", "FINAL_READY", "CHANGES_REQUESTED", "ARCHIVED"] as const).map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                  <label className="field-span-2">
                    Title
                    <input maxLength={255} required value={articleImageForm.title} onChange={(event) => setArticleImageForm((current) => ({ ...current, title: event.target.value }))} />
                  </label>
                  <label className="field-span-2">
                    Prompt
                    <textarea maxLength={4000} required rows={5} value={articleImageForm.prompt} onChange={(event) => setArticleImageForm((current) => ({ ...current, prompt: event.target.value }))} />
                  </label>
                  <label className="field-span-2">
                    Style notes
                    <textarea maxLength={4000} rows={3} value={articleImageForm.styleNotes} onChange={(event) => setArticleImageForm((current) => ({ ...current, styleNotes: event.target.value }))} />
                  </label>
                  <label>
                    Preview URL
                    <input maxLength={2048} type="url" value={articleImageForm.previewImageUrl} onChange={(event) => setArticleImageForm((current) => ({ ...current, previewImageUrl: event.target.value }))} />
                  </label>
                  <label>
                    Final URL
                    <input maxLength={2048} type="url" value={articleImageForm.finalImageUrl} onChange={(event) => setArticleImageForm((current) => ({ ...current, finalImageUrl: event.target.value }))} />
                  </label>
                  <label className="field-span-2">
                    Storage key
                    <input maxLength={1024} value={articleImageForm.storageKey} onChange={(event) => setArticleImageForm((current) => ({ ...current, storageKey: event.target.value }))} />
                  </label>
                  <label className="field-span-2">
                    Notes
                    <textarea maxLength={4000} rows={3} value={articleImageForm.notes} onChange={(event) => setArticleImageForm((current) => ({ ...current, notes: event.target.value }))} />
                  </label>
                </div>
                <div className="modal-footer">
                  <button className="secondary-action" disabled={articleImagesSaving} onClick={() => { setArticleImageEditorId(null); setArticleImageForm((current) => ({ ...emptyArticleImage(), contentDraftId: current.contentDraftId })); }} type="button">New image request</button>
                  <button className="primary-action" disabled={articleImagesSaving || !articleImageForm.contentDraftId || !articleImageForm.title.trim() || !articleImageForm.prompt.trim()} onClick={() => void saveArticleImage(openArticleImagesProject.id)} type="button">
                    {articleImagesSaving ? "Saving" : articleImageEditorId ? "Save image request" : "Create image request"}
                  </button>
                </div>
              </section>

              <section className="field-panel">
                <h3>Existing image production records</h3>
                {articleImages.length === 0 ? <div className="state-panel">No image production planning records have been created yet.</div> : null}
                {articleImages.map((image) => (
                  <article className="entity-card" key={image.id} style={{ marginBottom: "1rem" }}>
                    <div className="entity-card-header">
                      <div>
                        <StatusBadge status={image.isArchived ? "Archived" : image.status} />
                        <h3>{image.title}</h3>
                        <p>{image.contentDraft ? `Linked to draft: ${image.contentDraft.title}` : "No linked draft"}</p>
                      </div>
                      <div className="card-actions">
                        <button className="secondary-action" disabled={articleImagesSaving} onClick={() => editArticleImage(image)} type="button">Edit</button>
                        {!image.isArchived ? <button className="secondary-action" disabled={articleImagesSaving} onClick={() => void archiveArticleImage(openArticleImagesProject.id, image.id)} type="button">Archive</button> : null}
                      </div>
                    </div>
                    <dl className="brief-grid">
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
                      <div className="field-span-2">
                        <dt>Prompt</dt>
                        <dd>{image.prompt}</dd>
                      </div>
                      <div className="field-span-2">
                        <dt>Notes</dt>
                        <dd>{image.notes || "No notes"}</dd>
                      </div>
                    </dl>
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
