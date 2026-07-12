import type { ClientSummary } from "../clients/ClientsPage";
import type { ProjectSummary as ProjectLinkSummary } from "../projects/ProjectsPage";
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
import type {
  MarketIntelligenceHandoffSummary,
  AiDeliveryMiSummaryContextSummary,
  AiDeliveryRevenueChainReadinessResponse
} from "@dca-os-v1/shared";
import type { AiDeliveryContentPlanItemDraft } from "./AiDeliveryContentPlanModal";

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
  hasDocument: boolean;
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
  hasDocument: boolean;
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

export type AiDeliveryWordPressPreparedDraft = {
  status: "PREPARED";
  title: string;
  body: string;
  excerpt: string | null;
  sourceType: "DELIVERABLE" | "CONTENT_DRAFT";
  sourceId: string;
  slug?: string | null;
  postStatus?: "draft";
  externalPostId: null;
  externalEditUrl: null;
  publicationTargetId?: string;
  publicationTargetLabel?: string;
  publicationSiteUrl?: string;
  publishGateStatus?: "disabled" | "credentials_missing" | "target_configured";
  credentialConfigured?: boolean;
  note: string;
};

export type AiDeliveryWordPressPublishResult = {
  ok: boolean;
  wordpressPostId: string | null;
  wordpressPostUrl: string | null;
  wordpressEditUrl: string | null;
  status: "published" | "draft_prepared" | "provider_disabled" | "error";
  errorMessage: string | null;
  providerDisabledReason?: string;
};

export type AiDeliveryPublicationTargetOption = {
  id: string;
  label: string;
  siteUrl: string;
  isDefault: boolean;
};

export type ClientPublicationLogSummary = {
  id: string;
  action: string;
  status: string;
  siteUrlHost: string | null;
  aiDeliveryProjectId: string | null;
  deliverableId: string | null;
  createdAt: string;
  note: string | null;
};

export type PublicationTargetCredentialStatus = {
  configured: boolean;
  encryptionAvailable: boolean;
};

export type WordPressPublishConfirmState = {
  projectId: string;
  deliverableId: string;
  deliverableTitle: string;
};

export type AiDeliveryGoogleDocExportResult = {
  deliverableId: string;
  hasGoogleDocExport: boolean;
  exportUrl: string | null;
  docTitle: string | null;
  folderPath: string | null;
  providerStatus: "exported" | "provider_disabled" | "provider_not_configured" | "error";
  providerDisabledReason?: string | null;
  errorMessage: string | null;
  generatedAt: string | null;
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

export type WorkflowRunResultPreview = {
  version: string | null;
  gateway: string | null;
  model: string | null;
  outputType: string | null;
  title: string | null;
  summary: string | null;
  generatedAt: string | null;
  safeError: string | null;
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

export type ContentPlanItemDraft = AiDeliveryContentPlanItemDraft;

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
  onGenerateContentPlanPdf?: (projectId: string) => Promise<{ contentPlanId: string; hasDocument: boolean; generatedAt: string; fileName: string } | null>;
  onDownloadContentPlanDocument?: (projectId: string) => Promise<{ downloadUrl: string } | null>;
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
  onFetchMonthlyComputedSummary?: (projectId: string) => Promise<AiDeliveryMonthlySummaryData | null>;
  onFetchMonthlyReport?: (projectId: string) => Promise<AiDeliveryMonthlyReportData | null>;
  onFetchMonthlyMetrics?: (reportId: string) => Promise<AiDeliveryMonthlyMetricsSummary | null>;
  onCreateMonthlyReport?: (projectId: string) => Promise<AiDeliveryMonthlyReportData | null>;
  onUpdateMonthlyReport?: (reportId: string, values: AiDeliveryMonthlyReportFormValues) => Promise<AiDeliveryMonthlyReportData | null>;
  onSetMonthlyReportStatus?: (reportId: string, status: string) => Promise<AiDeliveryMonthlyReportData | null>;
  onArchiveMonthlyReport?: (reportId: string) => Promise<AiDeliveryMonthlyReportData | null>;
  onRestoreMonthlyReport?: (reportId: string) => Promise<AiDeliveryMonthlyReportData | null>;
  onGenerateMonthlyReportPdf?: (reportId: string) => Promise<AiDeliveryMonthlyReportGeneratePdfSummary | null>;
  onUploadMonthlyReportDocument?: (reportId: string, file: File) => Promise<AiDeliveryMonthlyReportData | null>;
  onDownloadMonthlyReportDocument?: (reportId: string) => Promise<{ downloadUrl: string } | null>;
  onImportMonthlyMetrics?: (reportId: string, values: MonthlyMetricSnapshotFormValues) => Promise<AiDeliveryMonthlyMetricSnapshotSummary | null>;
  onApproveMonthlyMetricSnapshot?: (reportId: string, snapshotId: string) => Promise<AiDeliveryMonthlyMetricSnapshotSummary | null>;
  onArchiveMonthlyMetricSnapshot?: (reportId: string, snapshotId: string) => Promise<AiDeliveryMonthlyMetricSnapshotSummary | null>;
  onFetchMiContext?: (projectId: string) => Promise<MarketIntelligenceHandoffSummary[]>;
  onApplyMiHandoff?: (projectId: string, handoffId: string) => Promise<MarketIntelligenceHandoffSummary[]>;
  onRemoveMiHandoff?: (projectId: string, handoffId: string) => Promise<MarketIntelligenceHandoffSummary[]>;
  onFetchMonthlyReportMiContext?: (reportId: string) => Promise<AiDeliveryMonthlyReportMiContext | null>;
  onApplyMiHandoffToMonthlyReport?: (reportId: string, handoffId: string) => Promise<AiDeliveryMonthlyReportMiContext | null>;
  onUpdateMonthlyReportMiContextDraft?: (reportId: string, draft: string) => Promise<AiDeliveryMonthlyReportMiContext | null>;
  onRemoveMiHandoffFromMonthlyReport?: (reportId: string) => Promise<AiDeliveryMonthlyReportMiContext | null>;
  onFetchKnowledgeItems?: (projectId: string) => Promise<import("@dca-os-v1/shared").AiKnowledgeItemSummary[]>;
  onCreateKnowledgeItem?: (input: import("@dca-os-v1/shared").AiKnowledgeItemInputRequest) => Promise<import("@dca-os-v1/shared").AiKnowledgeItemSummary | null>;
  onUpdateKnowledgeItem?: (id: string, input: import("@dca-os-v1/shared").AiKnowledgeItemInputRequest) => Promise<import("@dca-os-v1/shared").AiKnowledgeItemSummary | null>;
  onPreviewAiContext?: (input: import("@dca-os-v1/shared").AiContextPreviewInputRequest) => Promise<import("@dca-os-v1/shared").AiContextPreviewResponse | null>;
};
