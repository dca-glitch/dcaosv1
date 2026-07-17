import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button, EmptyState, Input, Modal, PageHeader, Select } from "../../components/ui";
import type { ClientSummary } from "../clients/ClientsPage";
import type { ProjectSummary as ProjectLinkSummary } from "../projects/ProjectsPage";
import { MonthlyReportPanel } from "./MonthlyReportPanel";
import { AiKnowledgeContextPanel } from "./AiKnowledgeContextPanel";
import { AiDeliveryOperatorSummary } from "./AiDeliveryOperatorSummary";
import { AiDeliveryProjectPicker } from "./AiDeliveryProjectPicker";
import { AiDeliveryProjectWorkspaceSections } from "./AiDeliveryProjectWorkspaceSections";
import { AiDeliveryProjectEditorModal } from "./AiDeliveryProjectEditorModal";
import { AiDeliveryWordPressPublishConfirmModal } from "./AiDeliveryWordPressPublishConfirmModal";
import { AiDeliveryDashboard } from "./AiDeliveryDashboard";
import { AiDeliveryBriefModal, type AiDeliveryBriefDetail } from "./AiDeliveryBriefModal";
import { AiDeliveryContentDraftModal } from "./AiDeliveryContentDraftModal";
import { AiDeliveryContentPlanModal, type AiDeliveryContentPlanItemDraft } from "./AiDeliveryContentPlanModal";
import { AiDeliveryDeliverableModal } from "./AiDeliveryDeliverableModal";
import { AiDeliveryImageApprovalModal } from "./AiDeliveryImageApprovalModal";
import { AiDeliveryResearchModal } from "./AiDeliveryResearchModal";
import { AiRunReviewModal } from "./AiRunReviewModal";
import { isMissingContentPlanFailure } from "./ai-delivery-content-plan-load";
import {
  AiDeliveryInlineAlert,
  AiDeliveryInlineLoading,
} from "./ai-delivery-shared-ui";
import "./ai-delivery-modals.css";
import "./ai-delivery-dashboard.css";
import type {
  AiDeliveryMonthlySummaryData,
  AiDeliveryMonthlyReportData,
  AiDeliveryMonthlyReportGeneratePdfSummary,
  AiDeliveryMonthlyReportFormValues,
  AiDeliveryMonthlyMetricsSummary,
  AiDeliveryMonthlyMetricSnapshotSummary,
  MonthlyMetricSnapshotFormValues,
  AiDeliveryMonthlyReportMiContext
} from "./MonthlyReportPanel";
import type { MarketIntelligenceHandoffSummary, AiDeliveryMiSummaryContextSummary, AiDeliveryRevenueChainReadinessResponse } from "@dca-os-v1/shared";

export type {
  AiDeliveryArticleImageFormValues,
  AiDeliveryArticleImageSummary,
  AiDeliveryBriefSummary,
  AiDeliveryContentDraftFormValues,
  AiDeliveryContentDraftSummary,
  AiDeliveryContentPlanFormValues,
  AiDeliveryContentPlanItemSummary,
  AiDeliveryContentPlanSummary,
  AiDeliveryDeliverableFormValues,
  AiDeliveryDeliverableReviewFormValues,
  AiDeliveryDeliverableReviewSummary,
  AiDeliveryDeliverableSummary,
  AiDeliveryGoogleDocExportResult,
  AiDeliveryPrivateAssetUploadValues,
  AiDeliveryProjectFormValues,
  AiDeliveryProjectSummary,
  AiDeliveryProjectsProps,
  AiDeliveryResearchRequestFormValues,
  AiDeliveryResearchRequestSummary,
  AiDeliveryResearchSourceFormValues,
  AiDeliveryResearchSourceSummary,
  AiDeliveryResearchSummaryFormValues,
  AiDeliveryResearchSummarySummary,
  AiDeliveryWordPressPreparedDraft,
  AiDeliveryWordPressPublishResult,
  AiDeliveryWorkflowRunFormValues,
  AiDeliveryWorkflowRunSummary,
  ContentPlanItemDraft,
  WorkflowRunResultPreview
} from "./ai-delivery-types";

import type {
  AiDeliveryArticleImageFormValues,
  AiDeliveryArticleImageSummary,
  AiDeliveryContentDraftFormValues,
  AiDeliveryContentDraftSummary,
  AiDeliveryContentPlanItemSummary,
  AiDeliveryContentPlanSummary,
  AiDeliveryDeliverableFormValues,
  AiDeliveryDeliverableReviewFormValues,
  AiDeliveryDeliverableReviewSummary,
  AiDeliveryDeliverableSummary,
  AiDeliveryGoogleDocExportResult,
  AiDeliveryProjectFormValues,
  AiDeliveryProjectSummary,
  AiDeliveryProjectsProps,
  AiDeliveryPublicationTargetOption,
  AiDeliveryResearchRequestFormValues,
  AiDeliveryResearchRequestSummary,
  AiDeliveryResearchSourceFormValues,
  AiDeliveryResearchSourceSummary,
  AiDeliveryResearchSummaryFormValues,
  AiDeliveryResearchSummarySummary,
  AiDeliveryWordPressPreparedDraft,
  AiDeliveryWordPressPublishResult,
  AiDeliveryWorkflowRunFormValues,
  AiDeliveryWorkflowRunSummary,
  ClientPublicationLogSummary,
  ContentPlanItemDraft,
  PublicationTargetCredentialStatus,
  WordPressPublishConfirmState
} from "./ai-delivery-types";

import {
  canExecuteWorkflowRun,
  getWorkflowRunNextStatus,
  getWorkflowRunStatusHelper,
  getWorkflowRunStatusOptions,
  normalizeWorkflowRunStatus,
  workflowRunStatusLabels
} from "./ai-delivery-workflow-run-helpers";

import {
  canPackageApprovedArticleImage,
  canPackageApprovedContentDraft,
  deliverableFormHasReadyLinks,
  deliverableStatusNeedsApprovedLinks,
  formatArticleImageStatus,
  formatContentDraftStatus,
  formatContentPlanItemApprovalStatus,
  formatContentPlanReviewStatus,
  formatDeliverableStatus,
  formatEnumLabel,
  formatOptionalDate,
  formatPreview,
  formatStatusBreakdown,
  getDeliverableExportState,
  getErrorMessage,
  getMostRecentReview,
  hasArticleImageFinalReferenceUi,
  hasArticleImagePreviewReferenceUi,
  parseWorkflowRunResultPreview
} from "./ai-delivery-formatters";


const CONTENT_PLAN_SEARCH_INTENT_PREFIX = /^\[search-intent:([a-z_]+)\]\s*(?:\n|$)/i;

function parseSearchIntentFromNotes(notes: string): { searchIntent: string; notesBody: string } {
  const match = notes.match(CONTENT_PLAN_SEARCH_INTENT_PREFIX);
  if (!match?.[1]) {
    return { searchIntent: "", notesBody: notes };
  }

  return {
    searchIntent: match[1].toLowerCase(),
    notesBody: notes.replace(CONTENT_PLAN_SEARCH_INTENT_PREFIX, "").trimStart()
  };
}

function composeNotesWithSearchIntent(searchIntent: string, notesBody: string): string | null {
  const normalizedIntent = searchIntent.trim().toLowerCase();
  const normalizedNotes = notesBody.trim();
  if (!normalizedIntent) {
    return normalizedNotes || null;
  }

  const prefix = `[search-intent:${normalizedIntent}]`;
  return normalizedNotes ? `${prefix}\n${normalizedNotes}` : prefix;
}

const emptyForm = (clientId = ""): AiDeliveryProjectFormValues => ({
  clientId,
  projectId: null,
  name: "",
  targetMonth: "",
  plannedContentScopeNotes: ""
});

const itemDraftFromPlanItem = (item: AiDeliveryContentPlanItemSummary, index: number): ContentPlanItemDraft => {
  const parsedNotes = parseSearchIntentFromNotes(item.notes ?? "");
  return {
    localId: item.id ?? `item-${index}-${Date.now()}`,
    title: item.title,
    targetKeyword: item.targetKeyword ?? "",
    searchIntent: parsedNotes.searchIntent,
    contentType: item.contentType ?? "article",
    notes: parsedNotes.notesBody,
    approvalStatus: item.approvalStatus ?? "DRAFT",
    clientComment: item.clientComment ?? ""
  };
};

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
  onGenerateContentPlanPdf,
  onDownloadContentPlanDocument,
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
  onSaveResearchSource,
  onFetchMonthlyComputedSummary,
  onFetchMonthlyReport,
  onFetchMonthlyMetrics,
  onCreateMonthlyReport,
  onUpdateMonthlyReport,
  onSetMonthlyReportStatus,
  onArchiveMonthlyReport,
  onRestoreMonthlyReport,
  onGenerateMonthlyReportPdf,
  onUploadMonthlyReportDocument,
  onDownloadMonthlyReportDocument,
  onImportMonthlyMetrics,
  onApproveMonthlyMetricSnapshot,
  onArchiveMonthlyMetricSnapshot,
  onFetchMiContext,
  onApplyMiHandoff,
  onRemoveMiHandoff,
  onFetchMonthlyReportMiContext,
  onApplyMiHandoffToMonthlyReport,
  onUpdateMonthlyReportMiContextDraft,
  onRemoveMiHandoffFromMonthlyReport,
  onFetchKnowledgeItems,
  onCreateKnowledgeItem,
  onUpdateKnowledgeItem,
  onPreviewAiContext
}: AiDeliveryProjectsProps) {
  const [filter, setFilter] = useState<"all" | "active" | "archived">("active");
  const [viewMode, setViewMode] = useState<"dashboard" | "workspace">("workspace");
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);
  const [editorProjectId, setEditorProjectId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<AiDeliveryProjectFormValues>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [openMonthlyReportId, setOpenMonthlyReportId] = useState<string | null>(null);
  const [openBriefId, setOpenBriefId] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefDetail, setBriefDetail] = useState<AiDeliveryBriefDetail | null>(null);
  const [openContentPlanId, setOpenContentPlanId] = useState<string | null>(null);
  const [contentPlanLoading, setContentPlanLoading] = useState(false);
  const [contentPlanSaving, setContentPlanSaving] = useState(false);
  const [contentPlanGeneratingItemId, setContentPlanGeneratingItemId] = useState<string | null>(null);
  const [contentPlanError, setContentPlanError] = useState<string | null>(null);
  const [contentPlanGenerationMessage, setContentPlanGenerationMessage] = useState<string | null>(null);
  const [contentPlanDetail, setContentPlanDetail] = useState<AiDeliveryContentPlanSummary | null>(null);
  const [contentPlanItems, setContentPlanItems] = useState<ContentPlanItemDraft[]>([]);
  const [contentPlanMiContextCount, setContentPlanMiContextCount] = useState(0);
  const [contentPlanPdfGenerating, setContentPlanPdfGenerating] = useState(false);
  const [contentPlanPdfMessage, setContentPlanPdfMessage] = useState<string | null>(null);
  const [contentPlanPdfReady, setContentPlanPdfReady] = useState<boolean | null>(null);
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
  const [loadedDeliverableReviews, setLoadedDeliverableReviews] = useState<Record<string, AiDeliveryDeliverableReviewSummary[]>>({});
  const [deliverableReviewEditorId, setDeliverableReviewEditorId] = useState<string | null>(null);
  const [deliverableReviewForm, setDeliverableReviewForm] = useState<AiDeliveryDeliverableReviewFormValues>(emptyDeliverableReview());
  const [openWorkflowRunsId, setOpenWorkflowRunsId] = useState<string | null>(null);
  const [openKnowledgePanelId, setOpenKnowledgePanelId] = useState<string | null>(null);
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
  // Market Intelligence context
  const [openMiContextId, setOpenMiContextId] = useState<string | null>(null);
  const [miContextLoading, setMiContextLoading] = useState(false);
  const [miContextError, setMiContextError] = useState<string | null>(null);
  const [miContextItems, setMiContextItems] = useState<MarketIntelligenceHandoffSummary[]>([]);
  const [miSummaryItems, setMiSummaryItems] = useState<AiDeliveryMiSummaryContextSummary[]>([]);
  const [miApplySummaryId, setMiApplySummaryId] = useState("");
  const [finalizedSummaryOptions, setFinalizedSummaryOptions] = useState<Array<{ id: string; title: string }>>([]);
  const [miApplyHandoffId, setMiApplyHandoffId] = useState<string>("");
  const [revenueChainReadiness, setRevenueChainReadiness] = useState<AiDeliveryRevenueChainReadinessResponse | null>(null);
  const [revenueChainReadinessLoading, setRevenueChainReadinessLoading] = useState(false);
  const [researchWorkflowRuns, setResearchWorkflowRuns] = useState<AiDeliveryWorkflowRunSummary[]>([]);
  const [researchRequestEditorId, setResearchRequestEditorId] = useState<string | null>(null);
  const [researchRequestForm, setResearchRequestForm] = useState<AiDeliveryResearchRequestFormValues>(emptyResearchRequest());
  const [researchSummaryEditorId, setResearchSummaryEditorId] = useState<string | null>(null);
  const [researchSummaryForm, setResearchSummaryForm] = useState<AiDeliveryResearchSummaryFormValues>(emptyResearchSummary());
  const [researchSourceEditorId, setResearchSourceEditorId] = useState<string | null>(null);
  const [researchSourceForm, setResearchSourceForm] = useState<AiDeliveryResearchSourceFormValues>(emptyResearchSource());
  const [deliverableDownloadRefLoading, setDeliverableDownloadRefLoading] = useState(false);
  const [deliverableDownloadRefError, setDeliverableDownloadRefError] = useState<{ recordId: string; message: string } | null>(null);
  const [deliverableDownloadRef, setDeliverableDownloadRef] = useState<{ recordId: string; storageKey: string; downloadUrl: string | null; expiresSeconds: number | null } | null>(null);
  const [deliverableWordPressDraftTargetId, setDeliverableWordPressDraftTargetId] = useState<string | null>(null);
  const [deliverableWordPressDraftError, setDeliverableWordPressDraftError] = useState<{ recordId: string; message: string } | null>(null);
  const [deliverableWordPressDraft, setDeliverableWordPressDraft] = useState<{ recordId: string; wordpressDraft: AiDeliveryWordPressPreparedDraft } | null>(null);
  const [deliverableWordPressPublishTargetId, setDeliverableWordPressPublishTargetId] = useState<string | null>(null);
  const [deliverableWordPressPublishError, setDeliverableWordPressPublishError] = useState<{ recordId: string; message: string } | null>(null);
  const [deliverableWordPressPublishResult, setDeliverableWordPressPublishResult] = useState<{ recordId: string; result: AiDeliveryWordPressPublishResult } | null>(null);
  const [deliverablePublicationTargets, setDeliverablePublicationTargets] = useState<AiDeliveryPublicationTargetOption[]>([]);
  const [deliverablePublicationTargetId, setDeliverablePublicationTargetId] = useState("");
  const [deliverablePublicationCredentialStatus, setDeliverablePublicationCredentialStatus] = useState<PublicationTargetCredentialStatus | null>(null);
  const [deliverablePublicationLogs, setDeliverablePublicationLogs] = useState<ClientPublicationLogSummary[]>([]);
  const [wordpressPublishConfirm, setWordpressPublishConfirm] = useState<WordPressPublishConfirmState | null>(null);
  const [wordpressPublishConfirmAcknowledged, setWordpressPublishConfirmAcknowledged] = useState(false);
  const [deliverableGoogleDocExportTargetId, setDeliverableGoogleDocExportTargetId] = useState<string | null>(null);
  const [deliverableGoogleDocExportError, setDeliverableGoogleDocExportError] = useState<{ recordId: string; message: string } | null>(null);
  const [deliverableGoogleDocExportResult, setDeliverableGoogleDocExportResult] = useState<{ recordId: string; result: AiDeliveryGoogleDocExportResult } | null>(null);
  const [articleImageDownloadRefLoading, setArticleImageDownloadRefLoading] = useState(false);
  const [articleImageDownloadRefError, setArticleImageDownloadRefError] = useState<{ recordId: string; message: string } | null>(null);
  const [articleImageDownloadRef, setArticleImageDownloadRef] = useState<{ recordId: string; storageKey: string; downloadUrl: string | null; expiresSeconds: number | null } | null>(null);

  const selectedProject = useMemo(() => projects.find((p) => p.id === editorProjectId) ?? null, [editorProjectId, projects]);
  const workspaceProjectId = useMemo(
    () =>
      focusedProjectId
      ?? openContentPlanId
      ?? openBriefId
      ?? openContentDraftsId
      ?? openArticleImagesId
      ?? openDeliverablesId
      ?? openKnowledgePanelId
      ?? openMonthlyReportId
      ?? openWorkflowRunsId
      ?? openResearchSourcesId
      ?? openMiContextId
      ?? null,
    [
      focusedProjectId,
      openContentPlanId,
      openBriefId,
      openContentDraftsId,
      openArticleImagesId,
      openDeliverablesId,
      openKnowledgePanelId,
      openMonthlyReportId,
      openWorkflowRunsId,
      openResearchSourcesId,
      openMiContextId
    ]
  );
  const workspaceProject = useMemo(
    () => (workspaceProjectId ? projects.find((p) => p.id === workspaceProjectId) ?? null : null),
    [workspaceProjectId, projects]
  );

  useEffect(() => {
    if (!workspaceProjectId) {
      setRevenueChainReadiness(null);
      return;
    }

    let cancelled = false;
    async function loadRevenueChainReadiness() {
      const token = window.sessionStorage.getItem("dcaosv1.authToken");
      if (!token) {
        if (!cancelled) setRevenueChainReadiness(null);
        return;
      }

      setRevenueChainReadinessLoading(true);
      try {
        const response = await fetch(`/api/v1/ai-delivery/projects/${workspaceProjectId}/revenue-chain-readiness`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          if (!cancelled) setRevenueChainReadiness(null);
          return;
        }
        const data = await response.json();
        if (!cancelled) {
          setRevenueChainReadiness((data?.data ?? null) as AiDeliveryRevenueChainReadinessResponse | null);
        }
      } catch {
        if (!cancelled) setRevenueChainReadiness(null);
      } finally {
        if (!cancelled) setRevenueChainReadinessLoading(false);
      }
    }

    void loadRevenueChainReadiness();
    return () => {
      cancelled = true;
    };
  }, [workspaceProjectId]);
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
    return "Unlinked draft (local-only state)";
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
  const selectedPublicationTarget = useMemo(
    () => deliverablePublicationTargets.find((target) => target.id === deliverablePublicationTargetId) ?? null,
    [deliverablePublicationTargetId, deliverablePublicationTargets]
  );
  const projectPublicationLogs = useMemo(
    () =>
      deliverablePublicationLogs.filter(
        (log) => !openDeliverablesId || log.aiDeliveryProjectId === openDeliverablesId
      ),
    [deliverablePublicationLogs, openDeliverablesId]
  );
  const activeDeliverableRecord = useMemo(() => deliverables.find((item) => item.id === deliverableEditorId) ?? null, [deliverableEditorId, deliverables]);
  useEffect(() => {
    setDeliverableDownloadRefError(null);
    setDeliverableDownloadRef(null);
  }, [activeDeliverableRecord?.id]);
  useEffect(() => {
    setDeliverableWordPressDraftTargetId(null);
    setDeliverableWordPressDraftError(null);
    setDeliverableWordPressDraft(null);
  }, [activeDeliverableRecord?.id]);
  useEffect(() => {
    setArticleImageDownloadRefError(null);
    setArticleImageDownloadRef(null);
  }, [activeArticleImageRecord?.id]);
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
    || (deliverableForm.storageKey ?? "").trim()
    || activeDeliverableRecord?.hasDocument
  );
  const deliverableReadinessBlockers = useMemo(() => {
    const blockers: string[] = [];

    if (!deliverableLinkedDraftRecord) {
      blockers.push("Requires approved content draft link before packaging can move to final handoff status.");
    } else if (!canPackageApprovedContentDraft(deliverableLinkedDraftRecord)) {
      blockers.push(`Linked draft is ${formatContentDraftStatus(deliverableLinkedDraftRecord.status).toLowerCase()}; ready-state packaging expects an approved draft.`);
    }

    if (deliverableRelatedImages.length === 0) {
      blockers.push("No article images linked from this project. Associate an image before packaging for delivery.");
    } else if (!deliverableRelatedImages.some((image) => canPackageApprovedArticleImage(image))) {
      blockers.push("Linked images exist, but none are approved or final-ready for delivery. Approve or finalize one image to proceed.");
    }

    if (!deliverableHasRecordedReference) {
      blockers.push("Requires reference link (export URL or private storage) for delivery. Upload or provide one now.");
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
  const openKnowledgePanelProject = useMemo(() => projects.find((p) => p.id === openKnowledgePanelId) ?? null, [openKnowledgePanelId, projects]);
  const workflowRunBeingEdited = useMemo(() => workflowRuns.find((run) => run.id === workflowRunEditorId) ?? null, [workflowRunEditorId, workflowRuns]);
  const workflowRunStatusOptions = useMemo(() => getWorkflowRunStatusOptions(workflowRunBeingEdited?.status ?? null), [workflowRunBeingEdited?.status]);
  const workflowRunStatusHelper = useMemo(() => getWorkflowRunStatusHelper(workflowRunBeingEdited?.status ?? null), [workflowRunBeingEdited?.status]);
  const isWorkflowRunStatusAllowed = workflowRunStatusOptions.includes(normalizeWorkflowRunStatus(workflowRunForm.status));
  const openResearchSourcesProject = useMemo(() => projects.find((p) => p.id === openResearchSourcesId) ?? null, [openResearchSourcesId, projects]);
  const openMiContextProject = useMemo(() => projects.find((p) => p.id === openMiContextId) ?? null, [openMiContextId, projects]);
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
      return "Preview-ready requires a preview URL, final URL, or private stored asset. Final-ready requires a final URL or private stored asset.";
    }
    if (activeArticleImageRecord.isArchived) {
      return "Archived image records remain visible for admin history and cannot use active workflow actions.";
    }
    const hasPreviewReference = hasArticleImagePreviewReferenceUi(activeArticleImageRecord);
    const hasFinalReference = hasArticleImageFinalReferenceUi(activeArticleImageRecord);
    if (!hasPreviewReference) {
      return "Mark preview ready, Request changes, and Approve require a preview URL, final URL, or private stored asset on the active image record.";
    }
    if (!hasFinalReference) {
      return "Mark final ready requires either a final image URL or private stored asset on the active image record.";
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
      return "This package is final-ready only when approved same-project assets are linked and can stay in the guarded packaging workflow.";
    }
    return "Mark ready and Internal accept stay guarded by approved same-project draft or image links.";
  }, [activeDeliverableRecord?.isArchived, articleImageDrafts, articleImages, deliverableForm]);
  const workflowRunActionGuidance = useMemo(() => {
    if (workflowRunExecutingId) {
      return "A workflow run is in progress. Wait for it to finish before starting another.";
    }
    if (!workflowRunBeingEdited) {
      return "Save a workflow run first. Run workflow is available for Draft, Ready, or Failed runs.";
    }
    if (!canExecuteWorkflowRun(workflowRunBeingEdited.status)) {
      return "This workflow run is not in a runnable state. Use the allowed next status shown above before retrying.";
    }
    return "Use [stub-fail] in admin notes when you need a controlled failure path during testing.";
  }, [workflowRunBeingEdited, workflowRunExecutingId]);
  const aiSeoWorkflowShell = useMemo(() => {
    const hasResearchRequests = researchRequests.length > 0;
    const hasResearchSources = researchSources.length > 0;
    const hasResearchSummaries = researchSummaries.length > 0;
    const hasPlan = Boolean(contentPlanDetail);
    const hasPlanItems = contentPlanItems.length > 0;
    const hasDraftHandOff = contentDrafts.some((draft) => !draft.isArchived && draft.contentPlanItemId);
    const researchStep = hasResearchRequests ? "Research requests in flight" : "Start with manual research requests";
    const sourceStep = hasResearchSources ? "Sources recorded" : "Add sources after review";
    const summaryStep = hasResearchSummaries ? "Summary ready" : "Write an internal research summary";
    const planStep = hasPlan ? (contentPlanDetail?.approvedAt ? "Content plan approved" : "Content plan in review") : "Create the monthly content plan";
    const draftStep = hasDraftHandOff ? "Draft handoff available" : "Generate admin drafts from approved plan items";

    let readiness = "Start with research requests";
    if (!hasResearchRequests) {
      readiness = "Research not started";
    } else if (!hasResearchSources) {
      readiness = "Collect sources next";
    } else if (!hasResearchSummaries) {
      readiness = "Summarize the research";
    } else if (!hasPlan) {
      readiness = "Create the content plan";
    } else if (!hasPlanItems) {
      readiness = "Add SEO topics to the plan";
    } else if (!contentPlanDetail?.approvedAt) {
      readiness = "Move the plan to approval";
    } else if (!hasDraftHandOff) {
      readiness = "Generate draft handoff records";
    } else {
      readiness = "Draft handoff ready";
    }

    const guidance = !hasPlan
      ? "Research, sources, and summaries feed the monthly content plan. Live crawling, live providers, and OAuth sync remain deferred."
      : !hasPlanItems
        ? "Add topics to the saved plan, then save and review the draft before generating content."
        : !contentPlanDetail?.approvedAt
          ? "Review the plan, send it through the admin approval actions, then generate linked drafts from approved items."
          : "Use the approved plan items to generate admin drafts and move the handoff forward. Client metrics exposure remains deferred.";

    return {
      readiness,
      guidance,
      researchStep,
      sourceStep,
      summaryStep,
      planStep,
      draftStep,
      hasResearchRequests,
      hasResearchSources,
      hasResearchSummaries,
      hasPlan,
      hasPlanItems,
      hasDraftHandOff,
      researchCount: researchRequests.length,
      sourceCount: researchSources.length,
      summaryCount: researchSummaries.length,
      planItemCount: contentPlanItems.length,
      draftCount: contentDrafts.filter((draft) => !draft.isArchived).length
    };
  }, [contentDrafts, contentPlanDetail, contentPlanItems.length, researchRequests, researchSources, researchSummaries]);
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

  async function fetchDeliverableDownloadReference(projectId: string, deliverableId: string) {
    if (!openDeliverablesProject || !activeDeliverableRecord?.hasDocument) return;
    const requestedRecordId = deliverableId;
    setDeliverableDownloadRefLoading(true);
    setDeliverableDownloadRefError(null);
    setDeliverableDownloadRef(null);
    try {
      const response = await fetch(`/api/v1/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/download-reference`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      if (data.data?.downloadReference) {
        setDeliverableDownloadRef({
          recordId: requestedRecordId,
          ...data.data.downloadReference
        });
      } else {
        setDeliverableDownloadRef({
          recordId: requestedRecordId,
          storageKey: "",
          downloadUrl: null,
          expiresSeconds: null
        });
      }
    } catch (error) {
      setDeliverableDownloadRefError({
        recordId: requestedRecordId,
        message: getErrorMessage(error, "Unable to fetch the R2 download reference.")
      });
    } finally {
      setDeliverableDownloadRefLoading(false);
    }
  }

  async function fetchArticleImageDownloadReference(projectId: string, imageId: string) {
    if (!openArticleImagesProject || !activeArticleImageRecord?.hasDocument) return;
    const requestedRecordId = imageId;
    setArticleImageDownloadRefLoading(true);
    setArticleImageDownloadRefError(null);
    setArticleImageDownloadRef(null);
    try {
      const response = await fetch(`/api/v1/ai-delivery-projects/${projectId}/article-images/${imageId}/download-reference`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      if (data.data?.downloadReference) {
        setArticleImageDownloadRef({
          recordId: requestedRecordId,
          ...data.data.downloadReference
        });
      } else {
        setArticleImageDownloadRef({
          recordId: requestedRecordId,
          storageKey: "",
          downloadUrl: null,
          expiresSeconds: null
        });
      }
    } catch (error) {
      setArticleImageDownloadRefError({
        recordId: requestedRecordId,
        message: getErrorMessage(error, "Unable to fetch the R2 download reference.")
      });
    } finally {
      setArticleImageDownloadRefLoading(false);
    }
  }

  async function fetchClientPublicationTargets(clientId: string): Promise<AiDeliveryPublicationTargetOption[]> {
    const token = window.sessionStorage.getItem("dcaosv1.authToken");
    if (!token) {
      throw new Error("Missing auth token.");
    }
    const response = await fetch(`/api/v1/clients/${clientId}/publication-targets`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return (data?.data?.publicationTargets ?? []) as AiDeliveryPublicationTargetOption[];
  }

  async function fetchClientPublicationCredentialStatus(
    clientId: string,
    publicationTargetId: string
  ): Promise<PublicationTargetCredentialStatus> {
    const token = window.sessionStorage.getItem("dcaosv1.authToken");
    if (!token) {
      throw new Error("Missing auth token.");
    }
    const response = await fetch(
      `/api/v1/clients/${clientId}/publication-targets/${publicationTargetId}/credentials`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      }
    );
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return {
      configured: Boolean(data?.data?.configured),
      encryptionAvailable: Boolean(data?.data?.encryptionAvailable)
    };
  }

  async function fetchClientPublicationLogs(clientId: string): Promise<ClientPublicationLogSummary[]> {
    const token = window.sessionStorage.getItem("dcaosv1.authToken");
    if (!token) {
      throw new Error("Missing auth token.");
    }
    const response = await fetch(`/api/v1/clients/${clientId}/publication-logs`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return (data?.data?.publicationLogs ?? []) as ClientPublicationLogSummary[];
  }

  async function refreshDeliverablePublicationLogs(clientId: string) {
    try {
      setDeliverablePublicationLogs(await fetchClientPublicationLogs(clientId));
    } catch {
      setDeliverablePublicationLogs([]);
    }
  }

  function requestWordPressPublish(projectId: string, deliverableId: string, deliverableTitle: string) {
    if (deliverablePublicationTargets.length === 0) {
      setDeliverableWordPressPublishError({
        recordId: deliverableId,
        message: "Add a website or channel in Client Hub before publishing."
      });
      return;
    }
    setWordpressPublishConfirmAcknowledged(false);
    setWordpressPublishConfirm({ projectId, deliverableId, deliverableTitle });
  }

  function cancelWordPressPublishConfirm() {
    setWordpressPublishConfirm(null);
    setWordpressPublishConfirmAcknowledged(false);
  }

  async function confirmWordPressPublish() {
    if (!wordpressPublishConfirm || !wordpressPublishConfirmAcknowledged) {
      return;
    }
    const pending = wordpressPublishConfirm;
    cancelWordPressPublishConfirm();
    await publishDeliverableToWordPress(pending.projectId, pending.deliverableId);
    if (openDeliverablesProject?.clientId) {
      await refreshDeliverablePublicationLogs(openDeliverablesProject.clientId);
    }
  }

  useEffect(() => {
    if (!openDeliverablesProject?.clientId || !deliverablePublicationTargetId) {
      setDeliverablePublicationCredentialStatus(null);
      return;
    }

    let cancelled = false;
    void fetchClientPublicationCredentialStatus(openDeliverablesProject.clientId, deliverablePublicationTargetId)
      .then((status) => {
        if (!cancelled) {
          setDeliverablePublicationCredentialStatus(status);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDeliverablePublicationCredentialStatus(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [openDeliverablesProject?.clientId, deliverablePublicationTargetId]);

  async function prepareDeliverableWordPressDraft(projectId: string, deliverableId: string) {
    if (!openDeliverablesProject || !deliverableId) return;
    setDeliverableWordPressDraftTargetId(deliverableId);
    setDeliverableWordPressDraftError(null);
    setDeliverableWordPressDraft(null);
    try {
      const token = window.sessionStorage.getItem("dcaosv1.authToken");
      if (!token) {
        throw new Error("Missing auth token.");
      }
      const requestBody = deliverablePublicationTargetId
        ? JSON.stringify({ publicationTargetId: deliverablePublicationTargetId })
        : undefined;
      const response = await fetch(`/api/v1/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/prepare-wordpress-draft`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          ...(requestBody ? { "Content-Type": "application/json" } : {})
        },
        body: requestBody
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      const preparedDraft = data?.data?.wordpressDraft as AiDeliveryWordPressPreparedDraft | undefined;
      if (
        !preparedDraft
        || preparedDraft.status !== "PREPARED"
        || typeof preparedDraft.title !== "string"
        || typeof preparedDraft.body !== "string"
        || !["DELIVERABLE", "CONTENT_DRAFT"].includes(preparedDraft.sourceType)
      ) {
        throw new Error("Invalid prepared draft response.");
      }
      setDeliverableWordPressDraft({
        recordId: deliverableId,
        wordpressDraft: preparedDraft
      });
      if (openDeliverablesProject?.clientId) {
        await refreshDeliverablePublicationLogs(openDeliverablesProject.clientId);
      }
    } catch (error) {
      setDeliverableWordPressDraftError({
        recordId: deliverableId,
        message: getErrorMessage(error, "Unable to prepare WordPress draft for this deliverable.")
      });
    } finally {
      setDeliverableWordPressDraftTargetId(null);
    }
  }

  async function publishDeliverableToWordPress(projectId: string, deliverableId: string) {
    if (!openDeliverablesProject || !deliverableId) return;
    setDeliverableWordPressPublishTargetId(deliverableId);
    setDeliverableWordPressPublishError(null);
    setDeliverableWordPressPublishResult(null);
    try {
      const token = window.sessionStorage.getItem("dcaosv1.authToken");
      if (!token) {
        throw new Error("Missing auth token.");
      }
      const requestBody = deliverablePublicationTargetId
        ? JSON.stringify({ publicationTargetId: deliverablePublicationTargetId })
        : undefined;
      const response = await fetch(`/api/v1/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/publish-wordpress`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          ...(requestBody ? { "Content-Type": "application/json" } : {})
        },
        body: requestBody
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      const publishResult = data?.data?.publishResult as AiDeliveryWordPressPublishResult | undefined;
      if (
        !publishResult
        || typeof publishResult.ok !== "boolean"
        || !["published", "draft_prepared", "provider_disabled", "error"].includes(publishResult.status)
      ) {
        throw new Error("Invalid publish result response.");
      }
      setDeliverableWordPressPublishResult({
        recordId: deliverableId,
        result: publishResult
      });
    } catch (error) {
      setDeliverableWordPressPublishError({
        recordId: deliverableId,
        message: getErrorMessage(error, "Unable to publish this deliverable to WordPress.")
      });
    } finally {
      setDeliverableWordPressPublishTargetId(null);
    }
  }

  async function exportDeliverableToGoogleDoc(projectId: string, deliverableId: string) {
    if (!projectId || !deliverableId) return;
    setDeliverableGoogleDocExportTargetId(deliverableId);
    setDeliverableGoogleDocExportError(null);
    setDeliverableGoogleDocExportResult(null);
    try {
      const response = await fetch(`/api/v1/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/export-google-doc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json() as { data?: AiDeliveryGoogleDocExportResult; error?: { message?: string } };
      const result = data?.data;
      if (!result || !["exported", "provider_disabled", "provider_not_configured", "error"].includes(result.providerStatus)) {
        throw new Error(data?.error?.message || "Unexpected response from Google Doc export.");
      }
      setDeliverableGoogleDocExportResult({ recordId: deliverableId, result });
    } catch (error) {
      setDeliverableGoogleDocExportError({
        recordId: deliverableId,
        message: getErrorMessage(error, "Unable to export this deliverable to Google Docs.")
      });
    } finally {
      setDeliverableGoogleDocExportTargetId(null);
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
    setContentPlanMiContextCount(0);
    setContentPlanPdfMessage(null);
    setContentPlanPdfReady(null);
    try {
      const [plan, drafts, miContext, miSummaries] = await Promise.all([
        typeof onFetchContentPlan === "function" ? onFetchContentPlan(projectId) : Promise.resolve(null),
        typeof onFetchContentDrafts === "function" ? onFetchContentDrafts(projectId) : Promise.resolve(contentDrafts),
        typeof onFetchMiContext === "function" ? onFetchMiContext(projectId) : Promise.resolve(null),
        fetchMiSummaryContext(projectId)
      ]);
      if (typeof onFetchContentPlan === "function") {
        setContentPlanDetail(plan);
        setContentPlanItems(plan?.items.map(itemDraftFromPlanItem) ?? []);
      }
      setContentPlanMiContextCount((miContext?.length ?? 0) + (miSummaries?.length ?? 0));
      setContentDrafts(drafts);
      // Only probe PDF readiness when a plan already exists — avoids noisy 404 download calls.
      if (plan && typeof onDownloadContentPlanDocument === "function") {
        const pdfReadiness = await onDownloadContentPlanDocument(projectId).catch(() => null);
        setContentPlanPdfReady(Boolean(pdfReadiness?.downloadUrl));
      } else {
        setContentPlanPdfReady(false);
      }
    } catch (error) {
      const message = getErrorMessage(error, "Unable to load the current content plan.");
      // Safety net: if a load adapter still throws the historical missing-plan 404 mapping,
      // keep the modal on the neutral empty state when the project is already known locally.
      if (isMissingContentPlanFailure({ message }) && projects.some((project) => project.id === projectId)) {
        setContentPlanDetail(null);
        setContentPlanItems([]);
        setContentPlanError(null);
        setContentPlanPdfReady(false);
      } else {
        setContentPlanError(message);
      }
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
          notes: composeNotesWithSearchIntent(item.searchIntent, item.notes),
          sortOrder: index + 1,
          approvalStatus: item.approvalStatus || "DRAFT",
          clientComment: item.clientComment.trim() || null
        }))
      });
      if (plan) {
        setContentPlanDetail(plan);
        setContentPlanItems(plan.items.map(itemDraftFromPlanItem));
        setContentPlanPdfReady((previous) => {
          if (previous === true) {
            setContentPlanPdfMessage("Plan changed — the previous PDF is now stale. Generate a new PDF before downloading.");
          }
          return false;
        });
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
        setContentPlanPdfReady((previous) => {
          if (previous === true) {
            setContentPlanPdfMessage("Plan status changed — the previous PDF is now stale. Generate a new PDF before downloading.");
          }
          return false;
        });
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
    setContentPlanPdfMessage(null);
    setContentPlanPdfReady(null);
  }

  async function handleGenerateContentPlanPdf(projectId: string) {
    if (!onGenerateContentPlanPdf) return;
    setContentPlanPdfGenerating(true);
    setContentPlanPdfMessage(null);
    try {
      const result = await onGenerateContentPlanPdf(projectId);
      if (result?.hasDocument) {
        setContentPlanPdfMessage(`PDF generated: ${result.fileName}`);
        setContentPlanPdfReady(true);
      } else {
        setContentPlanPdfMessage("PDF generation failed — no document returned.");
        setContentPlanPdfReady(false);
      }
    } catch (error) {
      const message = getErrorMessage(error, "PDF generation failed.");
      setContentPlanPdfMessage(
        message.includes("503") || message.includes("not configured") || message.includes("unconfigured")
          ? "Private document storage is not configured. Contact your administrator."
          : "PDF generation failed."
      );
    } finally {
      setContentPlanPdfGenerating(false);
    }
  }

  async function handleDownloadContentPlanDocument(projectId: string) {
    if (!onDownloadContentPlanDocument) return;
    setContentPlanPdfMessage(null);
    try {
      const result = await onDownloadContentPlanDocument(projectId);
      if (result?.downloadUrl) {
        setContentPlanPdfReady(true);
        window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
      } else {
        setContentPlanPdfReady(false);
        setContentPlanPdfMessage("No PDF available yet. Generate a PDF first.");
      }
    } catch (error) {
      const message = getErrorMessage(error, "Download reference could not be retrieved.");
      setContentPlanPdfMessage(
        message.includes("503") || message.includes("not configured") || message.includes("unconfigured")
          ? "Private document storage is not configured. Contact your administrator."
          : "Download reference could not be retrieved."
      );
    }
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

  function resetContentDraftEditor() {
    setContentDraftHandoffMessage(null);
    setContentDraftEditorId(null);
    setContentDraftForm(emptyContentDraft());
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
      storageKey: "",
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
    setArticleImageDownloadRefLoading(false);
    setArticleImageDownloadRefError(null);
    setArticleImageDownloadRef(null);
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
    setDeliverablePublicationTargets([]);
    setDeliverablePublicationTargetId("");
    try {
      const deliverablesProject = projects.find((project) => project.id === projectId) ?? null;
      const [items, drafts, images, publicationTargets, publicationLogs] = await Promise.all([
        typeof onFetchDeliverables === "function" ? onFetchDeliverables(projectId) : Promise.resolve([]),
        typeof onFetchContentDrafts === "function" ? onFetchContentDrafts(projectId) : Promise.resolve([]),
        typeof onFetchArticleImages === "function" ? onFetchArticleImages(projectId) : Promise.resolve([]),
        deliverablesProject?.clientId
          ? fetchClientPublicationTargets(deliverablesProject.clientId).catch(() => [] as AiDeliveryPublicationTargetOption[])
          : Promise.resolve([] as AiDeliveryPublicationTargetOption[]),
        deliverablesProject?.clientId
          ? fetchClientPublicationLogs(deliverablesProject.clientId).catch(() => [] as ClientPublicationLogSummary[])
          : Promise.resolve([] as ClientPublicationLogSummary[])
      ]);
      const defaultPublicationTarget =
        publicationTargets.find((target) => target.isDefault) ?? publicationTargets[0] ?? null;
      setDeliverablePublicationTargets(publicationTargets);
      setDeliverablePublicationTargetId(defaultPublicationTarget?.id ?? "");
      setDeliverablePublicationLogs(publicationLogs);
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
      storageKey: null,
      notes: item.notes ?? null,
      isArchived: item.isArchived
    });
  }

  async function saveDeliverable(projectId: string) {
    if (typeof onSaveDeliverable !== "function") return;
    setDeliverablesSaving(true);
    setDeliverablesError(null);
    try {
      const payload = deliverableEditorId
        ? deliverableForm
        : { ...deliverableForm, status: "DRAFT" as const };
      const saved = await onSaveDeliverable(projectId, deliverableEditorId, payload);
      if (saved && typeof onFetchDeliverables === "function") {
        const refreshedDeliverables = await onFetchDeliverables(projectId);
        setDeliverables(refreshedDeliverables);
        // Keep the saved deliverable as the active record so admin can view status/download immediately
        // Use the returned saved deliverable directly (for new deliverables with newly assigned IDs)
        // Fall back to searching by deliverableEditorId (for existing deliverables being updated)
        if (saved.id) {
          editDeliverable(saved);
        } else {
          // fallback to clearing if saved object has no ID
          setDeliverableEditorId(null);
          setDeliverableForm({ contentDraftId: null, articleImageId: null, title: "", description: null, deliveryType: "CONTENT_PACKAGE", status: "DRAFT", exportUrl: null, storageKey: null, notes: null, isArchived: false });
        }
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
        const reviews = await onFetchDeliverableReviews(projectId, deliverableId);
        setDeliverableReviews(reviews);
        setLoadedDeliverableReviews((current) => ({ ...current, [deliverableId]: reviews }));
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
        const reviews = await onFetchDeliverableReviews(projectId, selectedReviewDeliverableId);
        setDeliverableReviews(reviews);
        setLoadedDeliverableReviews((current) => ({ ...current, [selectedReviewDeliverableId]: reviews }));
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
    setDeliverableDownloadRefLoading(false);
    setDeliverableDownloadRefError(null);
    setDeliverableDownloadRef(null);
    setDeliverableWordPressDraftTargetId(null);
    setDeliverableWordPressDraftError(null);
    setDeliverableWordPressDraft(null);
    setDeliverableWordPressPublishTargetId(null);
    setDeliverableWordPressPublishError(null);
    setDeliverableWordPressPublishResult(null);
    setDeliverablePublicationTargets([]);
    setDeliverablePublicationTargetId("");
    setDeliverablePublicationCredentialStatus(null);
    setDeliverablePublicationLogs([]);
    setWordpressPublishConfirm(null);
    setWordpressPublishConfirmAcknowledged(false);
    setDeliverableGoogleDocExportTargetId(null);
    setDeliverableGoogleDocExportError(null);
    setDeliverableGoogleDocExportResult(null);
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
      setContentDraftHandoffMessage(`Generated draft handoff: "${item.title}" is open for admin editing and internal review preparation only. This stays internal and does not publish, deliver to the client, or send content to WordPress.`);
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

  function closeMonthlyReport() {
    setOpenMonthlyReportId(null);
  }

  async function fetchMiSummaryContext(projectId: string): Promise<AiDeliveryMiSummaryContextSummary[]> {
    const token = window.sessionStorage.getItem("dcaosv1.authToken");
    if (!token) return [];
    const response = await fetch(`/api/v1/ai-delivery/projects/${projectId}/mi-summary-context`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data?.data?.summaries ?? []) as AiDeliveryMiSummaryContextSummary[];
  }

  async function fetchFinalizedMiSummaries(clientId: string | null): Promise<Array<{ id: string; title: string }>> {
    const token = window.sessionStorage.getItem("dcaosv1.authToken");
    if (!token) return [];
    const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
    const response = await fetch(`/api/v1/market-intelligence/finalized-summaries${query}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data?.data?.summaries ?? []).map((summary: { id: string; title: string }) => ({
      id: summary.id,
      title: summary.title
    }));
  }

  async function openMiContext(projectId: string) {
    setOpenMiContextId(projectId);
    setMiContextLoading(true);
    setMiContextError(null);
    setMiContextItems([]);
    setMiSummaryItems([]);
    setFinalizedSummaryOptions([]);
    setMiApplyHandoffId("");
    setMiApplySummaryId("");
    const project = projects.find((entry) => entry.id === projectId) ?? null;
    try {
      const [items, summaries, pickerOptions] = await Promise.all([
        typeof onFetchMiContext === "function" ? onFetchMiContext(projectId) : Promise.resolve([]),
        fetchMiSummaryContext(projectId),
        fetchFinalizedMiSummaries(project?.clientId ?? null)
      ]);
      setMiContextItems(items);
      setMiSummaryItems(summaries);
      setFinalizedSummaryOptions(pickerOptions);
    } catch {
      setMiContextError("Could not load Market Intelligence context.");
    } finally {
      setMiContextLoading(false);
    }
  }

  function closeMiContext() {
    setOpenMiContextId(null);
    setMiContextError(null);
    setMiContextItems([]);
    setMiSummaryItems([]);
    setFinalizedSummaryOptions([]);
    setMiApplyHandoffId("");
    setMiApplySummaryId("");
  }

  async function applyMiHandoff(projectId: string) {
    if (!miApplyHandoffId || typeof onApplyMiHandoff !== "function") return;
    setMiContextLoading(true);
    setMiContextError(null);
    try {
      const items = await onApplyMiHandoff(projectId, miApplyHandoffId);
      setMiContextItems(items);
      setMiApplyHandoffId("");
    } catch {
      setMiContextError("Could not apply Market Intelligence handoff.");
    } finally {
      setMiContextLoading(false);
    }
  }

  async function removeMiHandoff(projectId: string, handoffId: string) {
    if (typeof onRemoveMiHandoff !== "function") return;
    setMiContextLoading(true);
    setMiContextError(null);
    try {
      const items = await onRemoveMiHandoff(projectId, handoffId);
      setMiContextItems(items);
    } catch {
      setMiContextError("Could not remove Market Intelligence handoff.");
    } finally {
      setMiContextLoading(false);
    }
  }

  async function applyMiSummary(projectId: string) {
    if (!miApplySummaryId.trim()) return;
    const token = window.sessionStorage.getItem("dcaosv1.authToken");
    if (!token) return;
    setMiContextLoading(true);
    setMiContextError(null);
    try {
      const response = await fetch(`/api/v1/ai-delivery/projects/${projectId}/mi-summary-context/apply`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ summaryId: miApplySummaryId.trim() })
      });
      if (!response.ok) throw new Error("apply failed");
      const data = await response.json();
      setMiSummaryItems((data?.data?.summaries ?? []) as AiDeliveryMiSummaryContextSummary[]);
      setMiApplySummaryId("");
    } catch {
      setMiContextError("Could not apply finalized MI summary.");
    } finally {
      setMiContextLoading(false);
    }
  }

  async function removeMiSummary(projectId: string, summaryId: string) {
    const token = window.sessionStorage.getItem("dcaosv1.authToken");
    if (!token) return;
    setMiContextLoading(true);
    setMiContextError(null);
    try {
      const response = await fetch(`/api/v1/ai-delivery/projects/${projectId}/mi-summary-context/${summaryId}/remove`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("remove failed");
      const data = await response.json();
      setMiSummaryItems((data?.data?.summaries ?? []) as AiDeliveryMiSummaryContextSummary[]);
    } catch {
      setMiContextError("Could not remove MI summary link.");
    } finally {
      setMiContextLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="view-section ai-delivery-page" aria-labelledby="ai-delivery-title">
        <PageHeader
          eyebrow="AI Workflow"
          title="AI Delivery Projects"
          titleId="ai-delivery-title"
          description="Brief through content plan, drafts, deliverables, and monthly report."
        />
        <AiDeliveryInlineLoading label="Loading AI delivery projects" />
      </section>
    );
  }
  if (error) {
    return (
      <section className="view-section ai-delivery-page" aria-labelledby="ai-delivery-title">
        <PageHeader
          eyebrow="AI Workflow"
          title="AI Delivery Projects"
          titleId="ai-delivery-title"
          description="Brief through content plan, drafts, deliverables, and monthly report."
        />
        <AiDeliveryInlineAlert message={error} title="AI delivery unavailable" />
      </section>
    );
  }

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
  const workflowRunsHelper = openWorkflowRunsId
    ? `Current status mix: ${formatStatusBreakdown(workflowRuns, "No workflow runs in focus yet")}`
    : "Open Workflow runs to review current status.";
  const deliverablesHelper = openDeliverablesId
    ? `Current status mix: ${formatStatusBreakdown(deliverables, "No deliverables in focus yet")} - Active: ${activeDeliverableCount} - Archived: ${archivedDeliverableCount}`
    : "Open Deliverables to review package and final readiness.";

  return (
    <section className="view-section ai-delivery-page" aria-labelledby="ai-delivery-title">
      <PageHeader
        eyebrow="AI Workflow"
        title="AI Delivery Projects"
        titleId="ai-delivery-title"
        description="Brief through content plan, drafts, deliverables, and monthly report."
        actions={
          <>
            <div aria-label="AI Delivery view" className="ai-delivery-view-toggle" role="group">
              <button
                aria-pressed={viewMode === "dashboard"}
                onClick={() => setViewMode("dashboard")}
                type="button"
              >
                Dashboard
              </button>
              <button
                aria-pressed={viewMode === "workspace"}
                onClick={() => setViewMode("workspace")}
                type="button"
              >
                Project workspace
              </button>
            </div>
            {viewMode === "workspace" ? (
              <div className="filter-bar" role="group" aria-label="AI delivery filter">
                {(["active", "archived", "all"] as const).map((value) => (
                  <button
                    aria-pressed={filter === value}
                    className={filter === value ? "filter-chip is-active" : "filter-chip"}
                    key={value}
                    onClick={() => setFilter(value)}
                    type="button"
                  >
                    {value[0].toUpperCase() + value.slice(1)}
                  </button>
                ))}
              </div>
            ) : null}
            {canEdit && projects.length > 0 ? (
              <button className="primary-action" onClick={openCreateModal} type="button">
                Create Delivery Project
              </button>
            ) : null}
          </>
        }
      />

      {viewMode === "dashboard" ? (
        <AiDeliveryDashboard
          canEdit={canEdit}
          onCreateProject={canEdit ? openCreateModal : undefined}
          onSelectProject={(projectId) => {
            setFocusedProjectId(projectId);
            setViewMode("workspace");
          }}
          projects={projects}
        />
      ) : null}

      {viewMode === "workspace" ? (
        <>
      <AiDeliveryOperatorSummary
        activeProjectCount={activeProjectCount}
        archivedProjectCount={archivedProjectCount}
        deliverablesHelper={deliverablesHelper}
        deliverablesValue={openDeliverablesId ? deliverables.length : "—"}
        projectBriefCountsAvailable={projectBriefCounts.available}
        projectBriefCountsPending={projectBriefCounts.pending}
        projectsLength={projects.length}
        workflowRunsHelper={workflowRunsHelper}
        workflowRunsValue={openWorkflowRunsId ? workflowRuns.length : "—"}
      />

      {filteredProjects.length === 0 ? (
        <EmptyState
          action={
            canEdit && projects.length === 0 ? (
              <Button onClick={openCreateModal}>Add AI Delivery</Button>
            ) : null
          }
          message={projects.length === 0 ? "Add a project to start the monthly delivery workflow." : "No projects match this filter. Adjust filters to see more results."}
          title="No AI delivery projects"
        />
      ) : (
        <div className="ai-delivery-workspace">
          <AiDeliveryProjectPicker
            filteredProjects={filteredProjects}
            onSelectProject={setFocusedProjectId}
            workspaceProjectId={workspaceProjectId}
          />

          <div className="ai-delivery-workspace-stack">
            <AiDeliveryProjectWorkspaceSections
              briefCheckpointLabel={
                workspaceProject?.brief
                  ? `Brief ${formatEnumLabel(workspaceProject.brief.status)}`
                  : "Brief not started"
              }
              canEdit={canEdit}
              onApproveFinal={() => workspaceProjectId && void onApproveFinal(workspaceProjectId)}
              onArchive={() => workspaceProjectId && void onArchive(workspaceProjectId)}
              onEdit={() => workspaceProject && openEditModal(workspaceProject)}
              onOpenArticleImages={() => workspaceProjectId && void openArticleImages(workspaceProjectId)}
              onOpenBrief={() => workspaceProjectId && void openBrief(workspaceProjectId)}
              onOpenContentDrafts={() => workspaceProjectId && void openContentDrafts(workspaceProjectId)}
              onOpenContentPlan={() => workspaceProjectId && void openContentPlan(workspaceProjectId)}
              onOpenDeliverables={() => workspaceProjectId && void openDeliverables(workspaceProjectId)}
              onOpenKnowledgePanel={() => workspaceProjectId && setOpenKnowledgePanelId(workspaceProjectId)}
              onOpenMiContext={() => workspaceProjectId && void openMiContext(workspaceProjectId)}
              onOpenMonthlyReport={() => workspaceProjectId && setOpenMonthlyReportId(workspaceProjectId)}
              onOpenResearchSources={() => workspaceProjectId && void openResearchSources(workspaceProjectId)}
              onOpenWorkflowRuns={() => workspaceProjectId && void openWorkflowRuns(workspaceProjectId)}
              onRequestClientInput={() => workspaceProjectId && void onRequestClientInput(workspaceProjectId)}
              onRequestClientRevision={() => workspaceProjectId && void onRequestClientRevision(workspaceProjectId)}
              showKnowledgeButton={
                typeof onFetchKnowledgeItems === "function" && typeof onPreviewAiContext === "function"
              }
              showMiContextButton={typeof onFetchMiContext === "function"}
              showMonthlyReportButton={typeof onFetchMonthlyComputedSummary === "function"}
              revenueChainReadiness={revenueChainReadiness}
              revenueChainReadinessLoading={revenueChainReadinessLoading}
              workspaceProject={workspaceProject}
            />
          </div>
        </div>
      )}
        </>
      ) : null}

      <AiDeliveryProjectEditorModal
        clients={clients}
        draft={draft}
        formatEnumLabel={formatEnumLabel}
        isEdit={Boolean(editorProjectId)}
        isOpen={isEditorOpen}
        linkableProjects={linkableProjects}
        onClose={closeProjectEditor}
        onDraftChange={setDraft}
        onSubmit={handleSubmit}
        saving={saving}
        selectedProject={selectedProject}
      />
      {openBriefId ? (
        <AiDeliveryBriefModal
          isOpen={Boolean(openBriefId)}
          onClose={() => {
            setOpenBriefId(null);
            setBriefError(null);
            setBriefDetail(null);
          }}
          project={openProject}
          loading={briefLoading}
          error={briefError}
          brief={briefDetail}
          onBriefChange={(next) => setBriefDetail(next)}
          canEdit={canEdit}
          canSave={typeof onSaveBrief === "function"}
          formatEnumLabel={formatEnumLabel}
          onSave={(projectId) => void handleSaveBrief(projectId)}
        />
      ) : null}

      {openContentPlanId ? (
        <AiDeliveryContentPlanModal
          isOpen={Boolean(openContentPlanId)}
          onClose={closeContentPlan}
          project={openContentPlanProject}
          loading={contentPlanLoading}
          saving={contentPlanSaving}
          busy={isContentPlanBusy}
          error={contentPlanError}
          miContextCount={contentPlanMiContextCount}
          plan={contentPlanDetail}
          items={contentPlanItems}
          onItemsChange={setContentPlanItems}
          contentDrafts={contentDrafts}
          generationMessage={contentPlanGenerationMessage}
          pdfMessage={contentPlanPdfMessage}
          pdfGenerating={contentPlanPdfGenerating}
          pdfReady={contentPlanPdfReady}
          generatingItemId={contentPlanGeneratingItemId}
          workflowShell={aiSeoWorkflowShell}
          formatContentPlanReviewStatus={formatContentPlanReviewStatus}
          formatContentPlanItemApprovalStatus={formatContentPlanItemApprovalStatus}
          formatOptionalDate={formatOptionalDate}
          onCreate={(projectId) => void handleCreateContentPlan(projectId)}
          onSave={(projectId) => void handleSaveContentPlan(projectId)}
          onRequestReview={(projectId) => void handleContentPlanAction(projectId, onRequestContentPlanReview)}
          onRequestChanges={(projectId) => void handleContentPlanAction(projectId, onRequestContentPlanChanges)}
          onApprove={(projectId) => void handleContentPlanAction(projectId, onApproveContentPlan)}
          onExportPdf={(projectId) => void handleGenerateContentPlanPdf(projectId)}
          onDownloadPdf={(projectId) => void handleDownloadContentPlanDocument(projectId)}
          onGenerateDraft={(projectId, item) => void generateContentDraftFromPlanItem(projectId, item)}
        />
      ) : null}

      {openResearchSourcesId ? (
        <AiDeliveryResearchModal
          isOpen={Boolean(openResearchSourcesId)}
          onClose={closeResearchSources}
          project={openResearchSourcesProject}
          loading={researchLoading}
          saving={researchSaving}
          error={researchError}
          researchRequests={researchRequests}
          researchSummaries={researchSummaries}
          researchSources={researchSources}
          researchWorkflowRuns={researchWorkflowRuns}
          requestForm={researchRequestForm}
          onRequestFormChange={setResearchRequestForm}
          requestEditorId={researchRequestEditorId}
          summaryForm={researchSummaryForm}
          onSummaryFormChange={setResearchSummaryForm}
          summaryEditorId={researchSummaryEditorId}
          sourceForm={researchSourceForm}
          onSourceFormChange={setResearchSourceForm}
          sourceEditorId={researchSourceEditorId}
          formatEnumLabel={formatEnumLabel}
          formatOptionalDate={formatOptionalDate}
          formatPreview={formatPreview}
          onNewRequest={() => {
            setResearchRequestEditorId(null);
            setResearchRequestForm(emptyResearchRequest());
          }}
          onSaveRequest={(projectId) => void saveResearchRequest(projectId)}
          onEditRequest={editResearchRequest}
          onNewSummary={() => {
            setResearchSummaryEditorId(null);
            setResearchSummaryForm(emptyResearchSummary());
          }}
          onSaveSummary={(projectId) => void saveResearchSummary(projectId)}
          onEditSummary={editResearchSummary}
          onFinalizeSummary={(projectId, summary) => void setResearchSummaryStatus(projectId, summary, "FINALIZED")}
          onArchiveSummary={(projectId, summary) => void setResearchSummaryStatus(projectId, summary, "ARCHIVED")}
          onApplySummaryToBrief={(projectId, summaryId) => void applyResearchSummaryToBrief(projectId, summaryId)}
          onNewSource={() => {
            setResearchSourceEditorId(null);
            setResearchSourceForm(emptyResearchSource());
          }}
          onSaveSource={(projectId) => void saveResearchSource(projectId)}
          onEditSource={editResearchSource}
          onApproveSource={(projectId, source) => void setResearchSourceStatus(projectId, source, "APPROVED")}
          onRejectSource={(projectId, source) => void setResearchSourceStatus(projectId, source, "REJECTED")}
          onArchiveSource={(projectId, source) => void setResearchSourceStatus(projectId, source, "ARCHIVED")}
        />
      ) : null}
      {openMiContextId ? (
        <Modal isOpen onClose={closeMiContext} title="Market Intelligence Context">
          {miContextLoading ? (
            <AiDeliveryInlineLoading label="Loading Market Intelligence context" />
          ) : openMiContextProject ? (
            <div className="ai-delivery-modal-panel ai-delivery-lane-modal stack gap-md">
              {miContextError ? <AiDeliveryInlineAlert message={miContextError} title="Market Intelligence context blocked" /> : null}
              <section className="field-panel ai-delivery-section-compact">
                <h3>Applied handoffs</h3>
                <p className="muted-text">Internal admin context only. Not visible to clients.</p>
                {miContextItems.length === 0 ? (
                  <EmptyState title="No handoffs applied" message="No Market Intelligence handoffs are applied to this project. Apply one below to get started." />
                ) : miContextItems.map((h) => (
                  <article key={h.id} className="entity-card">
                    <div className="entity-card-header">
                      <div>
                        <span className="entity-pill entity-pill-active">{h.handoffStatus}</span>
                        <h4>{h.title}</h4>
                      </div>
                      <button className="ghost-action" disabled={miContextLoading} onClick={() => void removeMiHandoff(openMiContextId, h.id)} type="button">Remove</button>
                    </div>
                    <dl className="brief-grid">
                      {h.marketSummary ? <div className="field-span-2"><dt>Market summary</dt><dd>{h.marketSummary}</dd></div> : null}
                      {h.competitorSummary ? <div className="field-span-2"><dt>Competitor summary</dt><dd>{h.competitorSummary}</dd></div> : null}
                      {h.audienceSignals?.length ? <div className="field-span-2"><dt>Audience signals</dt><dd>{h.audienceSignals.join(" · ")}</dd></div> : null}
                      {h.opportunities?.length ? <div className="field-span-2"><dt>Opportunities</dt><dd>{h.opportunities.join(" · ")}</dd></div> : null}
                      {h.risks?.length ? <div className="field-span-2"><dt>Risks</dt><dd>{h.risks.join(" · ")}</dd></div> : null}
                      {h.recommendedActions?.length ? <div className="field-span-2"><dt>Recommended actions</dt><dd>{h.recommendedActions.join(" · ")}</dd></div> : null}
                      {h.sourceNote ? <div className="field-span-2"><dt>Source note</dt><dd>{h.sourceNote}</dd></div> : null}
                      {h.targetClientName ? <div><dt>Target client</dt><dd>{h.targetClientName}</dd></div> : null}
                      {h.targetMonth ? <div><dt>Target month</dt><dd>{h.targetMonth}</dd></div> : null}
                    </dl>
                  </article>
                ))}
              </section>
              <section className="field-panel ai-delivery-section-compact">
                <h3>Applied MI summaries</h3>
                <p className="muted-text">Finalized MI_SUMMARY_V1 records linked to this project.</p>
                {miSummaryItems.length === 0 ? (
                  <EmptyState title="No summaries applied" message="No MI summaries are applied yet. Apply a finalized summary below to get started." />
                ) : miSummaryItems.map((summary) => (
                  <article key={summary.id} className="entity-card">
                    <div className="entity-card-header">
                      <div>
                        <span className="entity-pill entity-pill-active">{summary.status}</span>
                        <h4>{summary.title}</h4>
                      </div>
                      <button className="ghost-action" disabled={miContextLoading} onClick={() => void removeMiSummary(openMiContextId, summary.id)} type="button">Remove</button>
                    </div>
                    {summary.sourceNotes ? <p className="muted-text">{summary.sourceNotes}</p> : null}
                    {summary.appliedAt ? (
                      <p className="muted-text">Applied {new Date(summary.appliedAt).toLocaleString()}</p>
                    ) : null}
                  </article>
                ))}
                <Select
                  disabled={miContextLoading}
                  fullWidth
                  id="mi-apply-summary-select"
                  label="Finalized summary"
                  onChange={(e) => setMiApplySummaryId(e.target.value)}
                  options={[
                    { value: "", label: "Select finalized summary" },
                    ...finalizedSummaryOptions.map((summary) => ({
                      value: summary.id,
                      label: summary.title,
                    })),
                  ]}
                  value={miApplySummaryId}
                />
                <Input
                  disabled={miContextLoading}
                  fullWidth
                  id="mi-apply-summary-id"
                  label="Or summary ID (fallback)"
                  onChange={(e) => setMiApplySummaryId(e.target.value)}
                  placeholder="MI summary UUID"
                  type="text"
                  value={miApplySummaryId}
                />
                <Button disabled={miContextLoading || !miApplySummaryId.trim()} onClick={() => openMiContextId && void applyMiSummary(openMiContextId)} type="button" variant="primary">Apply summary</Button>
              </section>
              {typeof onApplyMiHandoff === "function" ? (
                <section className="field-panel ai-delivery-section-compact">
                  <h3>Apply a handoff</h3>
                  <p className="muted-text">Enter the ID of an approved Market Intelligence handoff (READY status).</p>
                  <Input
                    disabled={miContextLoading}
                    fullWidth
                    id="mi-apply-handoff-id"
                    label="Handoff ID"
                    onChange={(e) => setMiApplyHandoffId(e.target.value)}
                    placeholder="Handoff UUID"
                    type="text"
                    value={miApplyHandoffId}
                  />
                  <div className="modal-footer ai-delivery-modal-footer">
                    <Button onClick={closeMiContext} type="button" variant="tertiary">Close</Button>
                    <Button disabled={miContextLoading || !miApplyHandoffId.trim()} onClick={() => void applyMiHandoff(openMiContextId)} type="button" variant="primary">Apply</Button>
                  </div>
                </section>
              ) : (
                <div className="modal-footer ai-delivery-modal-footer"><Button onClick={closeMiContext} type="button" variant="tertiary">Close</Button></div>
              )}
            </div>
          ) : <div>Project not found.</div>}
        </Modal>
      ) : null}
      {openWorkflowRunsId ? (
        <AiRunReviewModal
          actionGuidance={workflowRunActionGuidance}
          canExecuteRun={canExecuteWorkflowRun}
          canSave={isWorkflowRunStatusAllowed}
          error={workflowRunsError}
          executingId={workflowRunExecutingId}
          form={workflowRunForm}
          formatOptionalDate={formatOptionalDate}
          formatPreview={formatPreview}
          formatStatusBreakdown={formatStatusBreakdown}
          isOpen={Boolean(openWorkflowRunsId)}
          loading={workflowRunsLoading}
          normalizeStatus={(status) => normalizeWorkflowRunStatus(status ?? "DRAFT")}
          onClearSelection={() => {
            setWorkflowRunEditorId(null);
            setWorkflowRunForm(emptyWorkflowRun());
          }}
          onClose={closeWorkflowRuns}
          onExecute={(runId) => openWorkflowRunsProject && void executeWorkflowRun(openWorkflowRunsProject.id, runId)}
          onFormChange={setWorkflowRunForm}
          onSave={() => openWorkflowRunsProject && void saveWorkflowRun(openWorkflowRunsProject.id)}
          onSelectRun={editWorkflowRun}
          parseResultPreview={parseWorkflowRunResultPreview}
          project={openWorkflowRunsProject}
          runs={workflowRuns}
          saving={workflowRunsSaving}
          selectedRunId={workflowRunEditorId}
          statusHelper={workflowRunStatusHelper}
          statusLabels={workflowRunStatusLabels}
          statusOptions={workflowRunStatusOptions}
        />
      ) : null}
      {openContentDraftsId ? (
        <AiDeliveryContentDraftModal
          isOpen={Boolean(openContentDraftsId)}
          onClose={closeContentDrafts}
          project={openContentDraftsProject}
          loading={contentDraftsLoading}
          saving={contentDraftsSaving}
          error={contentDraftsError}
          handoffMessage={contentDraftHandoffMessage}
          actionGuidance={contentDraftActionGuidance}
          contentDrafts={contentDrafts}
          eligiblePlanItems={eligibleContentDraftPlanItems}
          form={contentDraftForm}
          onFormChange={setContentDraftForm}
          editorId={contentDraftEditorId}
          activeRecord={activeContentDraftRecord}
          linkedImages={activeContentDraftLinkedImages}
          linkedDeliverables={activeContentDraftLinkedDeliverables}
          activeArticleImageCount={articleImages.filter((image) => !image.isArchived).length}
          activeDeliverableCount={deliverables.filter((deliverable) => !deliverable.isArchived).length}
          editorLinkedPlanLabel={contentDraftEditorLinkedPlanLabel}
          saveStateLabel={contentDraftSaveStateLabel}
          reviewReadiness={contentDraftReviewReadiness}
          canSave={canSaveContentDraftForm}
          canMarkReady={canMarkReadyCurrentDraft}
          canReturn={canReturnCurrentDraft}
          primaryActionLabel={contentDraftPrimaryActionLabel}
          formatContentDraftStatus={formatContentDraftStatus}
          formatContentPlanItemApprovalStatus={formatContentPlanItemApprovalStatus}
          formatOptionalDate={formatOptionalDate}
          formatPreview={formatPreview}
          formatStatusBreakdown={formatStatusBreakdown}
          onNewDraft={resetContentDraftEditor}
          onSave={(projectId) => void saveContentDraft(projectId)}
          onStartFromPlanItem={startContentDraftFromPlanItem}
          onEdit={editContentDraft}
          onArchive={(projectId, draftId) => void archiveContentDraft(projectId, draftId)}
          onRequestReview={(projectId, draftId) => void requestContentDraftReview(projectId, draftId)}
          onReturnToDraft={(projectId, draftId) => void returnContentDraftToDraft(projectId, draftId)}
          onHandoffToImages={(projectId, draftId) => void handoffContentDraftToArticleImages(projectId, draftId)}
          onHandoffToDeliverables={(projectId, draftId) => void handoffContentDraftToDeliverables(projectId, draftId)}
        />
      ) : null}
      {openDeliverablesId ? (
        <AiDeliveryDeliverableModal
          isOpen={Boolean(openDeliverablesId) && !wordpressPublishConfirm}
          onClose={closeDeliverables}
          project={openDeliverablesProject}
          loading={deliverablesLoading}
          saving={deliverablesSaving}
          error={deliverablesError}
          actionGuidance={deliverableActionGuidance}
          deliverables={deliverables}
          visibleDeliverables={visibleDeliverables}
          activeDeliverableCount={activeDeliverableCount}
          archivedDeliverableCount={archivedDeliverableCount}
          activeDeliverableRecord={activeDeliverableRecord}
          deliverableEditorId={deliverableEditorId}
          deliverableForm={deliverableForm}
          onFormChange={setDeliverableForm}
          onEditorIdChange={setDeliverableEditorId}
          deliverableDraftOptions={deliverableDraftOptions}
          deliverableArticleImageOptions={deliverableArticleImageOptions}
          deliverableLinkedDraftRecord={deliverableLinkedDraftRecord}
          deliverableLinkedImageRecord={deliverableLinkedImageRecord}
          deliverableRelatedImages={deliverableRelatedImages}
          deliverableHasRecordedReference={deliverableHasRecordedReference}
          deliverableReadinessBlockers={deliverableReadinessBlockers}
          deliverableDocumentFiles={deliverableDocumentFiles}
          onDocumentFilesChange={setDeliverableDocumentFiles}
          deliverableUploadTargetId={deliverableUploadTargetId}
          deliverableDownloadTargetId={deliverableDownloadTargetId}
          deliverableDownloadRefLoading={deliverableDownloadRefLoading}
          deliverableDownloadRefError={deliverableDownloadRefError}
          deliverableDownloadRef={deliverableDownloadRef}
          deliverableWordPressDraftTargetId={deliverableWordPressDraftTargetId}
          deliverableWordPressDraftError={deliverableWordPressDraftError}
          deliverableWordPressDraft={deliverableWordPressDraft}
          deliverableWordPressPublishTargetId={deliverableWordPressPublishTargetId}
          deliverableWordPressPublishError={deliverableWordPressPublishError}
          deliverableWordPressPublishResult={deliverableWordPressPublishResult}
          deliverablePublicationTargets={deliverablePublicationTargets}
          deliverablePublicationTargetId={deliverablePublicationTargetId}
          onPublicationTargetIdChange={setDeliverablePublicationTargetId}
          selectedPublicationTarget={selectedPublicationTarget}
          deliverablePublicationCredentialStatus={deliverablePublicationCredentialStatus}
          projectPublicationLogs={projectPublicationLogs}
          deliverableGoogleDocExportTargetId={deliverableGoogleDocExportTargetId}
          deliverableGoogleDocExportError={deliverableGoogleDocExportError}
          deliverableGoogleDocExportResult={deliverableGoogleDocExportResult}
          selectedReviewDeliverable={selectedReviewDeliverable}
          selectedReviewDeliverableId={selectedReviewDeliverableId}
          deliverableReviewsLoading={deliverableReviewsLoading}
          deliverableReviewsSaving={deliverableReviewsSaving}
          deliverableReviewsError={deliverableReviewsError}
          deliverableReviews={deliverableReviews}
          deliverableReviewEditorId={deliverableReviewEditorId}
          deliverableReviewForm={deliverableReviewForm}
          onReviewFormChange={setDeliverableReviewForm}
          onReviewEditorIdChange={setDeliverableReviewEditorId}
          latestSelectedReview={latestSelectedReview}
          loadedDeliverableReviews={loadedDeliverableReviews}
          formatDeliverableStatus={formatDeliverableStatus}
          formatContentDraftStatus={formatContentDraftStatus}
          formatArticleImageStatus={formatArticleImageStatus}
          formatEnumLabel={formatEnumLabel}
          formatOptionalDate={formatOptionalDate}
          formatPreview={formatPreview}
          formatStatusBreakdown={formatStatusBreakdown}
          getDeliverableExportState={getDeliverableExportState}
          getMostRecentReview={getMostRecentReview}
          onEditDeliverable={editDeliverable}
          onSaveDeliverable={(projectId) => void saveDeliverable(projectId)}
          onMarkReady={(projectId, deliverableId) => void markDeliverableReady(projectId, deliverableId)}
          onRequestRevision={(projectId, deliverableId) => void requestDeliverableRevision(projectId, deliverableId)}
          onAccept={(projectId, deliverableId) => void acceptDeliverable(projectId, deliverableId)}
          onArchive={(projectId, deliverableId) => void archiveDeliverable(projectId, deliverableId)}
          onRestore={(projectId, deliverableId) => void restoreDeliverable(projectId, deliverableId)}
          onUploadDocument={(projectId, deliverableId) => void uploadDeliverableDocument(projectId, deliverableId)}
          onOpenDocument={(projectId, deliverableId) => void openDeliverableDocument(projectId, deliverableId)}
          onFetchDownloadReference={(projectId, deliverableId) => void fetchDeliverableDownloadReference(projectId, deliverableId)}
          onPrepareWordPressDraft={(projectId, deliverableId) => void prepareDeliverableWordPressDraft(projectId, deliverableId)}
          onRequestWordPressPublish={requestWordPressPublish}
          onExportGoogleDoc={(projectId, deliverableId) => void exportDeliverableToGoogleDoc(projectId, deliverableId)}
          onOpenReviews={(projectId, deliverableId) => void openDeliverableReviews(projectId, deliverableId)}
          onEditReview={editDeliverableReview}
          onSaveReview={(projectId) => void saveDeliverableReview(projectId)}
        />
      ) : null}

      {openArticleImagesId ? (
        <AiDeliveryImageApprovalModal
          isOpen={Boolean(openArticleImagesId)}
          onClose={closeArticleImages}
          project={openArticleImagesProject}
          loading={articleImagesLoading}
          saving={articleImagesSaving}
          error={articleImagesError}
          actionGuidance={articleImageActionGuidance}
          articleImages={articleImages}
          articleImageDrafts={articleImageDrafts}
          form={articleImageForm}
          onFormChange={setArticleImageForm}
          editorId={articleImageEditorId}
          activeRecord={activeArticleImageRecord}
          finalAssetFiles={articleImageFinalAssetFiles}
          onFinalAssetFilesChange={setArticleImageFinalAssetFiles}
          uploadTargetId={articleImageUploadTargetId}
          downloadTargetId={articleImageDownloadTargetId}
          downloadRefLoading={articleImageDownloadRefLoading}
          downloadRefError={articleImageDownloadRefError}
          downloadRef={articleImageDownloadRef}
          formatArticleImageStatus={formatArticleImageStatus}
          formatContentDraftStatus={formatContentDraftStatus}
          formatOptionalDate={formatOptionalDate}
          onNewImageRequest={() => {
            setArticleImageEditorId(null);
            setArticleImageForm((current) => ({ ...emptyArticleImage(), contentDraftId: current.contentDraftId }));
          }}
          onSave={(projectId) => void saveArticleImage(projectId)}
          onEdit={editArticleImage}
          onArchive={(projectId, imageId) => void archiveArticleImage(projectId, imageId)}
          onMarkPreviewReady={(projectId, imageId) => void markArticleImagePreviewReady(projectId, imageId)}
          onRequestChanges={(projectId, imageId) => void requestArticleImageChanges(projectId, imageId)}
          onApprove={(projectId, imageId) => void approveArticleImage(projectId, imageId)}
          onMarkFinalReady={(projectId, imageId) => void markArticleImageFinalReady(projectId, imageId)}
          onUploadFinalAsset={(projectId, imageId) => void uploadArticleImageFinalAsset(projectId, imageId)}
          onOpenPrivateFinalAsset={(projectId, imageId) => void openArticleImageDownload(projectId, imageId)}
          onFetchDownloadReference={(projectId, imageId) => void fetchArticleImageDownloadReference(projectId, imageId)}
          onHandoffToDeliverables={(projectId, image) => void handoffArticleImageToDeliverables(projectId, image)}
        />
      ) : null}
      {openMonthlyReportId ? (() => {
        const monthlyProject = projects.find((p) => p.id === openMonthlyReportId) ?? null;
        return monthlyProject
          && typeof onFetchMonthlyComputedSummary === "function"
          && typeof onFetchMonthlyReport === "function"
          && typeof onCreateMonthlyReport === "function"
          && typeof onUpdateMonthlyReport === "function"
          && typeof onSetMonthlyReportStatus === "function"
          && typeof onArchiveMonthlyReport === "function"
          && typeof onRestoreMonthlyReport === "function"
          ? (
            <MonthlyReportPanel
              key={openMonthlyReportId}
              project={monthlyProject}
              onClose={closeMonthlyReport}
              onFetchComputedSummary={onFetchMonthlyComputedSummary}
              onFetchReport={onFetchMonthlyReport}
              onFetchMetrics={onFetchMonthlyMetrics ?? (async () => null)}
              onCreateReport={onCreateMonthlyReport}
              onUpdateReport={onUpdateMonthlyReport}
              onSetReportStatus={onSetMonthlyReportStatus}
              onArchiveReport={onArchiveMonthlyReport}
              onRestoreReport={onRestoreMonthlyReport}
              onGeneratePdf={onGenerateMonthlyReportPdf}
              onUploadDocument={onUploadMonthlyReportDocument}
              onDownloadDocument={onDownloadMonthlyReportDocument}
              onImportMetrics={onImportMonthlyMetrics ?? (async () => null)}
              onApproveMetricSnapshot={onApproveMonthlyMetricSnapshot ?? (async () => null)}
              onArchiveMetricSnapshot={onArchiveMonthlyMetricSnapshot ?? (async () => null)}
              onFetchMiContext={onFetchMonthlyReportMiContext}
              onApplyMiHandoff={onApplyMiHandoffToMonthlyReport}
              onUpdateMiContextDraft={onUpdateMonthlyReportMiContextDraft}
              onRemoveMiHandoff={onRemoveMiHandoffFromMonthlyReport}
            />
          ) : null;
      })() : null}

      {wordpressPublishConfirm ? (
        <AiDeliveryWordPressPublishConfirmModal
          acknowledged={wordpressPublishConfirmAcknowledged}
          deliverableTitle={wordpressPublishConfirm.deliverableTitle}
          onAcknowledgedChange={setWordpressPublishConfirmAcknowledged}
          onCancel={cancelWordPressPublishConfirm}
          onConfirm={confirmWordPressPublish}
          publicationTargetLabel={selectedPublicationTarget?.label}
          publicationTargetSiteUrl={selectedPublicationTarget?.siteUrl}
          publishInProgress={deliverableWordPressPublishTargetId !== null}
        />
      ) : null}
      {openKnowledgePanelId && openKnowledgePanelProject && typeof onFetchKnowledgeItems === "function" && typeof onCreateKnowledgeItem === "function" && typeof onUpdateKnowledgeItem === "function" && typeof onPreviewAiContext === "function" ? (
        <AiKnowledgeContextPanel
          project={openKnowledgePanelProject}
          onClose={() => setOpenKnowledgePanelId(null)}
          onCreateKnowledgeItem={onCreateKnowledgeItem}
          onFetchKnowledgeItems={onFetchKnowledgeItems}
          onPreviewContext={onPreviewAiContext}
          onUpdateKnowledgeItem={onUpdateKnowledgeItem}
        />
      ) : null}
    </section>
  );
}
