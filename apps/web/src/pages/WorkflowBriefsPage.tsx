import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { Button, PageHeader, SectionPanel, StatusBadge } from "../components/ui";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error: { code: string; message: string } };
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type WorkflowBriefSummary = {
  id: string;
  clientId: string;
  title: string;
  status: string;
  goal: string | null;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string } | null;
};

type WorkflowBriefDetail = WorkflowBriefSummary & {
  businessContext: string | null;
  targetAudience: string | null;
  offerContext: string | null;
  locationContext: string | null;
  notes: string | null;
  miReports?: Array<{
    id: string;
    status: string;
    summaryText: string | null;
    reportJson: unknown;
  }>;
  seoReports?: Array<{
    id: string;
    status: string;
    summaryText: string | null;
    reportJson: unknown;
  }>;
  productionPlans?: Array<{
    id: string;
    title: string;
    body: string | null;
    status: string;
    planJson?: unknown;
    clientVisibleSnapshotJson?: unknown;
    sentToClientAt?: string | null;
    approvedByClientAt?: string | null;
    aiDeliveryProjectId?: string | null;
    updatedAt?: string;
  }>;
  sourceProjects?: Array<{
    id: string;
    name: string;
    targetMonth: string;
    isArchived: boolean;
  }>;
  aiBriefRuns?: Array<{
    id: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    errorMessage: string | null;
  }>;
};

type ContentProductionSeedStatus = {
  briefId: string;
  hasLinkedProject: boolean;
  project: { id: string; name: string; targetMonth: string } | null;
  hasProductionPlan: boolean;
  productionPlanId: string | null;
  productionPlanStatus: string | null;
  isSeeded: boolean;
  contentPlanId: string | null;
  itemCount: number;
  seededAt: string | null;
  canSeed: boolean;
  blockReason: string | null;
  contentPlan: {
    id: string;
    status: string;
    itemCount: number;
    items: Array<{
      id: string;
      title: string;
      targetKeyword: string | null;
      contentType: string;
      sortOrder: number;
    }>;
  } | null;
};

type ContentDraftStatus = {
  briefId: string;
  isSeeded: boolean;
  seedItemCount: number;
  draftCount: number;
  pendingCount: number;
  generatedCount: number;
  readyForReviewCount: number;
  needsWorkCount: number;
  approvedCount: number;
  packageReadiness: string;
  canGenerateDrafts: boolean;
  blockReason: string | null;
  lastGeneratedAt: string | null;
  lastRegeneratedAt: string | null;
  project: { id: string; name: string; targetMonth: string } | null;
  items: Array<{
    contentPlanItemId: string;
    planItemTitle: string;
    targetKeyword: string | null;
    hasDraft: boolean;
    draftId: string | null;
    draftStatus: string | null;
    readiness: string;
    revisionCount: number;
  }>;
};

type DeliverablePackagingStatus = {
  briefId: string;
  eligibleDraftCount: number;
  packagedCount: number;
  unpackagedCount: number;
  pendingReviewCount: number;
  approvedByClientCount: number;
  rejectedCount: number;
  canPackageAll: boolean;
  canManagePackaging: boolean;
  blockReason: string | null;
  packagingStage: string;
  lastPackagedAt: string | null;
  items: Array<{
    contentPlanItemId: string;
    planItemTitle: string;
    draftId: string | null;
    deliverableId: string | null;
    deliverableStatus: string | null;
    packagingState: string;
    canRepackage: boolean;
    isClientReviewable: boolean;
  }>;
  deliverables: Array<{
    id: string;
    title: string;
    status: string;
    clientRejectionReason: string | null;
  }>;
};

type ImageSetStatus = {
  eligibleCount: number;
  preparedCount: number;
  missingCount: number;
  canPrepareAll: boolean;
  imageSetStage: string;
  lastPreparedAt: string | null;
  items: Array<{
    contentPlanItemId: string;
    planItemTitle: string;
    articleImageId: string | null;
    imageStatus: string | null;
    imageSetState: string;
    canRefresh: boolean;
  }>;
};

type PackageCompletenessStatus = {
  completeItemCount: number;
  eligibleItemCount: number;
  readyForClientReviewCount: number;
  clientReviewInProgressCount: number;
  overallStage: string;
  publicationTargetAvailable: boolean;
  publicationTargetLabel: string | null;
  releasePrepStage: string;
  releasePrepared: boolean;
  lastReleasePreparedAt: string | null;
  releasePackageStage?: string;
  releasePackageFinalized?: boolean;
  lastReleasePackageFinalizedAt?: string | null;
  packageChangedSinceFinalize?: boolean;
  canFinalizeReleasePackage?: boolean;
  releasePackageBlockReason?: string | null;
  missingRequirements: string[];
  items: Array<{
    planItemTitle: string;
    hasTextDeliverable: boolean;
    hasImageCandidate: boolean;
    textClientReviewed: boolean;
    imageClientReviewed: boolean;
    packageComplete: boolean;
    completenessStage: string;
  }>;
};

type ReleasePackageStatus = PackageCompletenessStatus & {
  releasePackage: {
    releasePackageId: string;
    finalizedAt: string;
    releaseStatus: string;
    summary: string;
    deliverableCount: number;
    imageCount: number;
  } | null;
  clientReleasePackage: {
    releasePackageId: string;
    briefTitle: string;
    projectName: string;
    finalizedAt: string;
    releaseStatus: string;
    summary: string;
    deliverables: Array<{ title: string; type: string; exportUrl: string | null; status: string }>;
    images: Array<{ title: string; altText: string | null; imageUrl: string | null; status: string }>;
    notes: string | null;
  } | null;
};

type PublicationHandoffStatus = {
  briefId: string;
  handoffStage: string;
  executionMode: string;
  packageComplete: boolean;
  releasePrepared: boolean;
  publicationTargetAvailable: boolean;
  publicationTargetLabel: string | null;
  releasePackageFinalized: boolean;
  handoffExecuted: boolean;
  lastHandoffExecutedAt: string | null;
  packageChangedSinceHandoff: boolean;
  canExecuteHandoff: boolean;
  handoffBlockReason: string | null;
  mappedItemCount: number;
  publicationHandoff: {
    version: string;
    kind: string;
    executedAt: string;
    publicationTargetLabel: string;
    preparedCount: number;
    reusedCount: number;
    itemCount: number;
    note: string;
  } | null;
};

async function workflowBriefsApiRequest<T>(path: string, options?: { method?: string; body?: unknown }): Promise<ApiResponse<T>> {
  const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
  const response = await fetch(`${API_BASE_URL}/workflow-briefs${path}`, {
    method: options?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  return (await response.json()) as ApiResponse<T>;
}

function BriefField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="brief-field">
      <div className="brief-field-label muted-text">{label}</div>
      <div className="brief-field-value">{value?.trim() ? value : "—"}</div>
    </div>
  );
}

type ReportListSection = {
  label: string;
  items: string[];
};

function readReportStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function buildMiReportSections(reportJson: unknown): ReportListSection[] {
  if (!reportJson || typeof reportJson !== "object" || Array.isArray(reportJson)) {
    return [];
  }
  const record = reportJson as Record<string, unknown>;
  return [
    { label: "Audience insights", items: readReportStringList(record.audienceInsights) },
    { label: "Competitor insights", items: readReportStringList(record.competitorInsights) },
    { label: "Market signals", items: readReportStringList(record.marketSignals) },
    { label: "Opportunities", items: readReportStringList(record.opportunities) },
    { label: "Risks", items: readReportStringList(record.risks) },
    { label: "Recommended actions", items: readReportStringList(record.recommendedActions) }
  ].filter((section) => section.items.length > 0);
}

function buildSeoReportSections(reportJson: unknown): ReportListSection[] {
  if (!reportJson || typeof reportJson !== "object" || Array.isArray(reportJson)) {
    return [];
  }
  const record = reportJson as Record<string, unknown>;
  return [
    { label: "Keyword clusters", items: readReportStringList(record.keywordClusters) },
    { label: "Topic ideas", items: readReportStringList(record.topicIdeas) },
    { label: "Content angles", items: readReportStringList(record.contentAngles) },
    { label: "Internal link ideas", items: readReportStringList(record.internalLinkIdeas) },
    { label: "SEO notes", items: readReportStringList(record.seoNotes) }
  ].filter((section) => section.items.length > 0);
}

function ReportSectionList({ sections }: { sections: ReportListSection[] }) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem" }}>
      {sections.map((section) => (
        <div key={section.label}>
          <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
            {section.label}
          </div>
          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
            {section.items.map((item) => (
              <li key={`${section.label}-${item}`} style={{ marginBottom: "0.25rem" }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function formatRunTimestamp(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function WorkflowBriefsPage({ canManageAi = false }: { canManageAi?: boolean }) {
  const [briefs, setBriefs] = useState<WorkflowBriefSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<WorkflowBriefDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planEditTitle, setPlanEditTitle] = useState("");
  const [planEditBody, setPlanEditBody] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [showPlanEdit, setShowPlanEdit] = useState(false);
  const [seedStatus, setSeedStatus] = useState<ContentProductionSeedStatus | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [draftStatus, setDraftStatus] = useState<ContentDraftStatus | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [packagingStatus, setPackagingStatus] = useState<DeliverablePackagingStatus | null>(null);
  const [packagingLoading, setPackagingLoading] = useState(false);
  const [imageSetStatus, setImageSetStatus] = useState<ImageSetStatus | null>(null);
  const [imageSetLoading, setImageSetLoading] = useState(false);
  const [completenessStatus, setCompletenessStatus] = useState<PackageCompletenessStatus | null>(null);
  const [completenessLoading, setCompletenessLoading] = useState(false);
  const [releasePackageStatus, setReleasePackageStatus] = useState<ReleasePackageStatus | null>(null);
  const [releasePackageLoading, setReleasePackageLoading] = useState(false);
  const [publicationHandoffStatus, setPublicationHandoffStatus] = useState<PublicationHandoffStatus | null>(null);
  const [publicationHandoffLoading, setPublicationHandoffLoading] = useState(false);
  const [publicationHandoffNotice, setPublicationHandoffNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadBriefs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<WorkflowBriefSummary[]>("/");
    if (!response.ok) {
      setError(response.error.message);
      setBriefs([]);
      setLoading(false);
      return;
    }
    setBriefs(response.data);
    setLoading(false);
  }, []);

  const loadDetail = useCallback(async (briefId: string) => {
    setDetailLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<WorkflowBriefDetail>(`/${briefId}`);
    if (!response.ok) {
      setError(response.error.message);
      setDetail(null);
      setSeedStatus(null);
      setDetailLoading(false);
      return;
    }
    setDetail(response.data);
    setDetailLoading(false);
  }, []);

  const loadSeedStatus = useCallback(async (briefId: string) => {
    setSeedLoading(true);
    const response = await workflowBriefsApiRequest<ContentProductionSeedStatus>(`/${briefId}/content-production-seed`);
    if (response.ok) {
      setSeedStatus(response.data);
    } else {
      setSeedStatus(null);
    }
    setSeedLoading(false);
  }, []);

  const loadDraftStatus = useCallback(async (briefId: string) => {
    setDraftLoading(true);
    const response = await workflowBriefsApiRequest<ContentDraftStatus>(`/${briefId}/content-drafts`);
    if (response.ok) {
      setDraftStatus(response.data);
    } else {
      setDraftStatus(null);
    }
    setDraftLoading(false);
  }, []);

  const loadPackagingStatus = useCallback(async (briefId: string) => {
    setPackagingLoading(true);
    const response = await workflowBriefsApiRequest<DeliverablePackagingStatus>(`/${briefId}/deliverable-packaging`);
    if (response.ok) {
      setPackagingStatus(response.data);
    } else {
      setPackagingStatus(null);
    }
    setPackagingLoading(false);
  }, []);

  const loadImageSetStatus = useCallback(async (briefId: string) => {
    setImageSetLoading(true);
    const response = await workflowBriefsApiRequest<ImageSetStatus>(`/${briefId}/image-sets`);
    if (response.ok) {
      setImageSetStatus(response.data);
    } else {
      setImageSetStatus(null);
    }
    setImageSetLoading(false);
  }, []);

  const loadCompletenessStatus = useCallback(async (briefId: string) => {
    setCompletenessLoading(true);
    const response = await workflowBriefsApiRequest<PackageCompletenessStatus>(`/${briefId}/package-completeness`);
    if (response.ok) {
      setCompletenessStatus(response.data);
    } else {
      setCompletenessStatus(null);
    }
    setCompletenessLoading(false);
  }, []);

  const loadReleasePackageStatus = useCallback(async (briefId: string) => {
    setReleasePackageLoading(true);
    const response = await workflowBriefsApiRequest<ReleasePackageStatus>(`/${briefId}/release-package`);
    if (response.ok) {
      setReleasePackageStatus(response.data);
      setCompletenessStatus(response.data);
    } else {
      setReleasePackageStatus(null);
    }
    setReleasePackageLoading(false);
  }, []);

  const loadPublicationHandoffStatus = useCallback(async (briefId: string) => {
    setPublicationHandoffLoading(true);
    const response = await workflowBriefsApiRequest<PublicationHandoffStatus>(`/${briefId}/publication-handoff`);
    if (response.ok) {
      setPublicationHandoffStatus(response.data);
    } else {
      setPublicationHandoffStatus(null);
    }
    setPublicationHandoffLoading(false);
  }, []);

  const loadPackageExecutionStatus = useCallback(
    async (briefId: string) => {
      await Promise.all([
        loadPackagingStatus(briefId),
        loadImageSetStatus(briefId),
        loadCompletenessStatus(briefId),
        loadReleasePackageStatus(briefId),
        loadPublicationHandoffStatus(briefId)
      ]);
    },
    [
      loadPackagingStatus,
      loadImageSetStatus,
      loadCompletenessStatus,
      loadReleasePackageStatus,
      loadPublicationHandoffStatus
    ]
  );

  useEffect(() => {
    void loadBriefs();
  }, [loadBriefs]);

  useEffect(() => {
    if (selectedId) {
      void loadDetail(selectedId);
      if (canManageAi) {
        void loadSeedStatus(selectedId);
        void loadDraftStatus(selectedId);
      } else {
        setSeedStatus(null);
        setDraftStatus(null);
      }
      void loadPackagingStatus(selectedId);
      void loadImageSetStatus(selectedId);
      void loadCompletenessStatus(selectedId);
      void loadReleasePackageStatus(selectedId);
      if (canManageAi) {
        void loadPublicationHandoffStatus(selectedId);
      } else {
        setPublicationHandoffStatus(null);
      }
      setPublicationHandoffNotice(null);
    } else {
      setDetail(null);
      setSeedStatus(null);
      setDraftStatus(null);
      setPackagingStatus(null);
      setImageSetStatus(null);
      setCompletenessStatus(null);
      setReleasePackageStatus(null);
      setPublicationHandoffStatus(null);
      setPublicationHandoffNotice(null);
    }
  }, [selectedId, loadDetail, loadSeedStatus, loadDraftStatus, loadPackagingStatus, loadImageSetStatus, loadCompletenessStatus, loadReleasePackageStatus, loadPublicationHandoffStatus, canManageAi]);

  useEffect(() => {
    const plan = detail?.productionPlans?.[0];
    if (plan) {
      setPlanEditTitle(plan.title);
      setPlanEditBody(plan.body ?? "");
    } else {
      setPlanEditTitle("");
      setPlanEditBody("");
    }
    setShowPlanEdit(false);
    setRejectComment("");
  }, [detail?.id, detail?.productionPlans?.[0]?.id, detail?.productionPlans?.[0]?.updatedAt]);

  async function runAction(path: string, options?: { method?: string; body?: unknown }) {
    if (!selectedId) return false;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<unknown>(`/${selectedId}${path}`, options);
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return false;
    }
    await loadDetail(selectedId);
    await loadBriefs();
    setActionLoading(false);
    return true;
  }

  async function handleRunAi() {
    await runAction("/run-ai", { method: "POST" });
  }

  async function handleSubmit() {
    await runAction("/submit", { method: "POST" });
  }

  async function handleGeneratePlan() {
    await runAction("/production-plan/generate", { method: "POST" });
  }

  async function handleSendPlan() {
    await runAction("/production-plan/send", { method: "POST" });
  }

  async function handleSavePlanEdit() {
    if (!selectedId || !planEditTitle.trim()) return;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<unknown>(`/${selectedId}/production-plan`, {
      method: "PUT",
      body: { title: planEditTitle.trim(), body: planEditBody.trim() || null }
    });
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return;
    }
    setShowPlanEdit(false);
    await loadDetail(selectedId);
    setActionLoading(false);
  }

  async function handleApprovePlan() {
    await runAction("/production-plan/approve", { method: "POST" });
  }

  async function handleRejectPlan() {
    await runAction("/production-plan/reject", {
      method: "POST",
      body: { comment: rejectComment.trim() || null }
    });
  }

  async function handleCreateProject() {
    const ok = await runAction("/create-project", { method: "POST" });
    if (ok && selectedId) {
      await loadSeedStatus(selectedId);
    }
  }

  async function handleSeedContentProduction() {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<{
      seeded: boolean;
      itemsCreated: number;
      contentPlan: ContentProductionSeedStatus["contentPlan"];
    }>(`/${selectedId}/seed-content-production`, { method: "POST" });
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return;
    }
    await loadDetail(selectedId);
    await loadSeedStatus(selectedId);
    await loadDraftStatus(selectedId);
    setActionLoading(false);
  }

  async function handleGenerateContentDrafts() {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<{
      created: number;
      reused: number;
      status: ContentDraftStatus;
    }>(`/${selectedId}/generate-content-drafts`, { method: "POST" });
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return;
    }
    setDraftStatus(response.data.status);
    await loadDetail(selectedId);
    await loadDraftStatus(selectedId);
    await loadPackagingStatus(selectedId);
    setActionLoading(false);
  }

  async function handleRegenerateContentDraft(contentPlanItemId: string) {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<{ status: ContentDraftStatus }>(
      `/${selectedId}/regenerate-content-draft`,
      { method: "POST", body: { contentPlanItemId } }
    );
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return;
    }
    setDraftStatus(response.data.status);
    await loadDraftStatus(selectedId);
    await loadPackagingStatus(selectedId);
    setActionLoading(false);
  }

  async function handlePackageAllDeliverables() {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<{
      outcomes: { created: number; reused: number; updated: number };
      status: DeliverablePackagingStatus;
    }>(`/${selectedId}/package-deliverables`, { method: "POST" });
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return;
    }
    setPackagingStatus(response.data.status);
    await loadPackageExecutionStatus(selectedId);
    setActionLoading(false);
  }

  async function handleRepackageDeliverable(contentPlanItemId: string, contentDraftId: string | null) {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<{ status: DeliverablePackagingStatus }>(
      `/${selectedId}/repackage-deliverable`,
      {
        method: "POST",
        body: {
          contentPlanItemId,
          ...(contentDraftId ? { contentDraftId } : {})
        }
      }
    );
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return;
    }
    setPackagingStatus(response.data.status);
    await loadPackageExecutionStatus(selectedId);
    setActionLoading(false);
  }

  async function handlePrepareAllImageSets() {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<{
      status: ImageSetStatus;
      completeness: PackageCompletenessStatus;
    }>(`/${selectedId}/prepare-image-sets`, { method: "POST" });
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return;
    }
    setImageSetStatus(response.data.status);
    setCompletenessStatus(response.data.completeness);
    await loadPackageExecutionStatus(selectedId);
    setActionLoading(false);
  }

  async function handleRefreshImageSet(contentPlanItemId: string) {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<{
      status: ImageSetStatus;
      completeness: PackageCompletenessStatus;
    }>(`/${selectedId}/refresh-image-set`, {
      method: "POST",
      body: { contentPlanItemId }
    });
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return;
    }
    setImageSetStatus(response.data.status);
    setCompletenessStatus(response.data.completeness);
    await loadPackageExecutionStatus(selectedId);
    setActionLoading(false);
  }

  async function handlePrepareRelease() {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<{
      completeness: PackageCompletenessStatus;
      publishablePackageSummary: Record<string, unknown>;
    }>(`/${selectedId}/prepare-release`, { method: "POST" });
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return;
    }
    setCompletenessStatus(response.data.completeness);
    await loadCompletenessStatus(selectedId);
    setActionLoading(false);
  }

  async function handleFinalizeReleasePackage() {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<{
      finalized: boolean;
      reused: boolean;
      releasePackageStage: string;
      clientReleasePackage: ReleasePackageStatus["clientReleasePackage"];
      completeness: PackageCompletenessStatus;
    }>(`/${selectedId}/finalize-release-package`, { method: "POST" });
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return;
    }
    setCompletenessStatus(response.data.completeness);
    await loadReleasePackageStatus(selectedId);
    setActionLoading(false);
  }

  async function handleExecutePublicationHandoff() {
    if (!selectedId) return;
    setActionLoading(true);
    setPublicationHandoffNotice(null);
    const response = await workflowBriefsApiRequest<{
      executed: boolean;
      reused: boolean;
      handoffStage: string;
      publicationHandoff: PublicationHandoffStatus["publicationHandoff"];
      status: PublicationHandoffStatus;
    }>(`/${selectedId}/execute-publication-handoff`, { method: "POST" });
    if (!response.ok) {
      setPublicationHandoffNotice({ type: "error", message: response.error.message });
      setActionLoading(false);
      return;
    }
    setPublicationHandoffStatus(response.data.status);
    const preparedCount = response.data.publicationHandoff?.preparedCount ?? 0;
    setPublicationHandoffNotice({
      type: "success",
      message: response.data.reused
        ? "WordPress draft prep reused — package unchanged since last handoff."
        : `WordPress drafts prepared for ${preparedCount} item${preparedCount === 1 ? "" : "s"}.`
    });
    await loadPublicationHandoffStatus(selectedId);
    setActionLoading(false);
  }

  function formatImageSetStage(value: string): string {
    switch (value) {
      case "none":
        return "No image sets";
      case "text_only":
        return "Text only";
      case "partially_prepared":
        return "Partially prepared";
      case "fully_prepared":
        return "Fully prepared";
      case "in_client_review":
        return "In client review";
      case "review_complete":
        return "Review complete";
      default:
        return value.replace(/_/g, " ");
    }
  }

  function formatCompletenessStage(value: string): string {
    switch (value) {
      case "incomplete":
        return "Incomplete";
      case "text_ready":
        return "Text ready";
      case "images_prepared":
        return "Images prepared";
      case "ready_for_client_review":
        return "Ready for client review";
      case "client_review_in_progress":
        return "Client review in progress";
      case "package_complete":
        return "Package complete";
      case "ready_for_release_prep":
        return "Ready for release prep";
      default:
        return value.replace(/_/g, " ");
    }
  }

  function formatReleasePrepStage(value: string): string {
    switch (value) {
      case "not_ready":
        return "Not ready";
      case "ready_for_release":
        return "Ready for release";
      case "release_prepared":
        return "Release prepared";
      case "publication_target_missing":
        return "Publication target missing";
      default:
        return value.replace(/_/g, " ");
    }
  }

  function formatReleasePackageStage(value: string): string {
    switch (value) {
      case "not_ready":
        return "Not ready";
      case "release_prep_missing":
        return "Release prep required";
      case "ready_to_finalize":
        return "Ready to finalize";
      case "finalized":
        return "Finalized";
      case "package_changed_since_finalize":
        return "Package changed since finalize";
      default:
        return value.replace(/_/g, " ");
    }
  }

  function formatHandoffStage(value: string): string {
    switch (value) {
      case "not_ready":
        return "Not ready";
      case "publication_target_missing":
        return "Publication target missing";
      case "release_prep_missing":
        return "Release prep required";
      case "ready_to_execute":
        return "Ready for draft prep";
      case "draft_prepared":
        return "Drafts prepared";
      case "package_changed_since_handoff":
        return "Package changed since handoff";
      default:
        return value.replace(/_/g, " ");
    }
  }

  async function handleSendDeliverableForReview(deliverableId: string) {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<unknown>(
      `/${selectedId}/deliverables/${deliverableId}/send-for-client-review`,
      { method: "POST" }
    );
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return;
    }
    await loadPackagingStatus(selectedId);
    await loadPackageExecutionStatus(selectedId);
    setActionLoading(false);
  }

  function formatPackagingStage(value: string): string {
    switch (value) {
      case "none":
        return "No packaging yet";
      case "drafts_only":
        return "Drafts only";
      case "partially_packaged":
        return "Partially packaged";
      case "fully_packaged":
        return "Fully packaged";
      case "in_client_review":
        return "In client review";
      case "review_complete":
        return "Review complete";
      default:
        return value.replace(/_/g, " ");
    }
  }

  function formatPackagingState(value: string): string {
    switch (value) {
      case "unpackaged":
        return "Not packaged";
      case "packaged":
        return "Packaged";
      case "pending_review":
        return "Pending client review";
      case "approved":
        return "Approved by client";
      case "rejected":
        return "Changes requested";
      case "locked":
        return "Locked";
      case "not_eligible":
        return "Not eligible";
      default:
        return value.replace(/_/g, " ");
    }
  }

  function openClientPortalApprovals() {
    window.history.replaceState(null, "", "/#/client-portal");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  function formatPackageReadiness(value: string): string {
    switch (value) {
      case "none":
        return "No drafts yet";
      case "partial":
        return "Partial drafts";
      case "drafts_generated":
        return "Drafts generated";
      case "ready_for_admin_review":
        return "Ready for admin review";
      case "ready_for_packaging":
        return "Ready for packaging";
      default:
        return value.replace(/_/g, " ");
    }
  }

  function formatDraftReadiness(value: string): string {
    switch (value) {
      case "pending":
        return "No draft";
      case "generated":
        return "Draft generated";
      case "ready_for_review":
        return "Ready for review";
      case "needs_work":
        return "Needs work";
      case "approved":
        return "Approved";
      default:
        return value;
    }
  }

  function openAiDeliveryModule() {
    window.history.replaceState(null, "", "/#/ai-delivery");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  const latestMi = detail?.miReports?.[0];
  const latestSeo = detail?.seoReports?.[0];
  const latestPlan = detail?.productionPlans?.[0];
  const linkedProject = detail?.sourceProjects?.[0];
  const latestRun = detail?.aiBriefRuns?.[0];
  const miSections = latestMi ? buildMiReportSections(latestMi.reportJson) : [];
  const seoSections = latestSeo ? buildSeoReportSections(latestSeo.reportJson) : [];
  const miOpportunities = miSections.find((section) => section.label === "Opportunities")?.items ?? [];
  const miRisks = miSections.find((section) => section.label === "Risks")?.items ?? [];
  const seoKeywords = seoSections.find((section) => section.label === "Keyword clusters")?.items ?? [];
  const seoTopics = seoSections.find((section) => section.label === "Topic ideas")?.items ?? [];
  const canRunAi =
    canManageAi &&
    detail &&
    ["SUBMITTED", "IN_REVIEW", "READY_FOR_AI", "AI_RESULTS_READY"].includes(detail.status);
  const hasReports = Boolean(latestMi && latestSeo);
  const canGeneratePlan = canManageAi && hasReports && detail?.status === "AI_RESULTS_READY";
  const canEditPlan =
    canManageAi && latestPlan && ["DRAFT", "CHANGES_REQUESTED"].includes(latestPlan.status);
  const canSendPlan =
    canManageAi && latestPlan && ["DRAFT", "CHANGES_REQUESTED"].includes(latestPlan.status);
  const canClientReviewPlan = latestPlan?.status === "SENT_TO_CLIENT";
  const canCreateProject = canManageAi && detail && ["AI_RESULTS_READY", "APPROVED_FOR_PRODUCTION"].includes(detail.status);
  const planSnapshot =
    latestPlan?.clientVisibleSnapshotJson && typeof latestPlan.clientVisibleSnapshotJson === "object"
      ? (latestPlan.clientVisibleSnapshotJson as Record<string, unknown>)
      : null;
  const planPriorityTopics = readReportStringList(planSnapshot?.priorityTopics);
  const planClusters = Array.isArray(planSnapshot?.suggestedContentClusters)
    ? (planSnapshot.suggestedContentClusters as Array<{ name?: string; topics?: unknown }>)
    : [];

  return (
    <section className="view-section" data-density="compact">
      <PageHeader
        eyebrow="AI Delivery"
        title="Workflow Briefs"
        titleId="workflow-briefs-title"
        description="Brief-centered workflow foundation: brief input, AI reports, and production plan."
      />

      {error ? <ErrorState title="Workflow brief error" message={error} /> : null}

      <div className="brief-workspace-layout">
        <SectionPanel title="Briefs" tone="compact">
          {loading ? (
            <LoadingState label="Loading briefs…" />
          ) : briefs.length === 0 ? (
            <EmptyState title="No workflow briefs" message="Create a brief via API or seed data to get started." />
          ) : (
            <ul className="brief-select-list">
              {briefs.map((brief) => (
                <li key={brief.id}>
                  <button
                    type="button"
                    className={`brief-select-item${selectedId === brief.id ? " is-selected" : ""}`}
                    onClick={() => setSelectedId(brief.id)}
                  >
                    <div className="brief-select-title">{brief.title}</div>
                    <div className="brief-select-meta">
                      <StatusBadge status={brief.status} />
                      {brief.client?.name ? (
                        <span className="muted-text">{brief.client.name}</span>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionPanel>

        <div className="brief-detail-stack">
          {!selectedId ? (
            <SectionPanel title="Brief detail">
              <EmptyState title="Select a brief" message="Choose a brief from the list to view details and AI outputs." />
            </SectionPanel>
          ) : detailLoading ? (
            <LoadingState label="Loading brief detail…" />
          ) : detail ? (
            <>
              <SectionPanel
                title={detail.title}
                action={
                  <div className="brief-action-row">
                    {detail.status === "DRAFT" ? (
                      <Button variant="secondary" disabled={actionLoading} onClick={() => void handleSubmit()}>
                        Submit
                      </Button>
                    ) : null}
                    {canRunAi ? (
                      <Button variant="primary" disabled={actionLoading} onClick={() => void handleRunAi()}>
                        Run AI
                      </Button>
                    ) : null}
                  </div>
                }
              >
                <div style={{ marginBottom: "0.75rem" }}>
                  <StatusBadge status={detail.status} />
                </div>
                <BriefField label="Goal" value={detail.goal} />
                <BriefField label="Business context" value={detail.businessContext} />
                <BriefField label="Target audience" value={detail.targetAudience} />
                <BriefField label="Offer context" value={detail.offerContext} />
                <BriefField label="Location context" value={detail.locationContext} />
                <BriefField label="Notes" value={detail.notes} />
              </SectionPanel>

              <SectionPanel title="AI Run Status">
                {latestRun ? (
                  <>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
                      <StatusBadge status={latestRun.status} />
                      {latestRun.errorMessage ? (
                        <span className="muted-text" style={{ fontSize: "0.85rem" }}>
                          {latestRun.errorMessage}
                        </span>
                      ) : null}
                    </div>
                    <BriefField label="Started" value={formatRunTimestamp(latestRun.startedAt)} />
                    <BriefField label="Completed" value={formatRunTimestamp(latestRun.completedAt)} />
                  </>
                ) : (
                  <p className="muted-text">No AI runs yet. Run AI from an eligible brief status.</p>
                )}
              </SectionPanel>

              {(miOpportunities.length > 0 || miRisks.length > 0 || seoKeywords.length > 0 || seoTopics.length > 0) ? (
                <SectionPanel title="Key Highlights">
                  {miOpportunities.length > 0 ? (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                        Top opportunities
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                        {miOpportunities.slice(0, 3).map((item) => (
                          <li key={`opp-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {miRisks.length > 0 ? (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                        Key risks
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                        {miRisks.slice(0, 3).map((item) => (
                          <li key={`risk-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {seoKeywords.length > 0 ? (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                        Keyword clusters
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                        {seoKeywords.slice(0, 5).map((item) => (
                          <li key={`kw-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {seoTopics.length > 0 ? (
                    <div>
                      <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                        Topic ideas
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                        {seoTopics.slice(0, 4).map((item) => (
                          <li key={`topic-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </SectionPanel>
              ) : null}

              <SectionPanel title="MI Report">
                {latestMi ? (
                  <>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <StatusBadge status={latestMi.status} />
                    </div>
                    <p style={{ marginTop: 0 }}>{latestMi.summaryText ?? "No summary available."}</p>
                    <ReportSectionList sections={miSections} />
                  </>
                ) : (
                  <p className="muted-text">No MI report yet. Run AI from an eligible brief status.</p>
                )}
              </SectionPanel>

              <SectionPanel title="SEO Report">
                {latestSeo ? (
                  <>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <StatusBadge status={latestSeo.status} />
                    </div>
                    <p style={{ marginTop: 0 }}>{latestSeo.summaryText ?? "No summary available."}</p>
                    <ReportSectionList sections={seoSections} />
                  </>
                ) : (
                  <p className="muted-text">No SEO report yet. Run AI from an eligible brief status.</p>
                )}
              </SectionPanel>

              <SectionPanel title="Production Plan">
                {latestPlan ? (
                  <>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                      <StatusBadge status={latestPlan.status} />
                      {latestPlan.sentToClientAt ? (
                        <span className="muted-text" style={{ fontSize: "0.8rem" }}>
                          Sent {formatRunTimestamp(latestPlan.sentToClientAt)}
                        </span>
                      ) : null}
                      {latestPlan.approvedByClientAt ? (
                        <span className="muted-text" style={{ fontSize: "0.8rem" }}>
                          Approved {formatRunTimestamp(latestPlan.approvedByClientAt)}
                        </span>
                      ) : null}
                    </div>

                    {canManageAi ? (
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                        {canGeneratePlan ? (
                          <Button variant="secondary" disabled={actionLoading} onClick={() => void handleGeneratePlan()}>
                            {latestPlan ? "Refresh plan" : "Generate plan"}
                          </Button>
                        ) : null}
                        {canEditPlan ? (
                          <Button variant="secondary" disabled={actionLoading} onClick={() => setShowPlanEdit((value) => !value)}>
                            {showPlanEdit ? "Cancel edit" : "Edit plan"}
                          </Button>
                        ) : null}
                        {canSendPlan ? (
                          <Button variant="primary" disabled={actionLoading} onClick={() => void handleSendPlan()}>
                            Send to client
                          </Button>
                        ) : null}
                      </div>
                    ) : null}

                    {showPlanEdit && canEditPlan ? (
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label className="muted-text" style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>
                          Title
                        </label>
                        <input
                          className="form-input"
                          value={planEditTitle}
                          onChange={(event) => setPlanEditTitle(event.target.value)}
                          style={{ width: "100%", marginBottom: "0.5rem" }}
                        />
                        <label className="muted-text" style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>
                          Body
                        </label>
                        <textarea
                          className="form-input"
                          value={planEditBody}
                          onChange={(event) => setPlanEditBody(event.target.value)}
                          rows={8}
                          style={{ width: "100%", marginBottom: "0.5rem" }}
                        />
                        <Button variant="primary" disabled={actionLoading} onClick={() => void handleSavePlanEdit()}>
                          Save plan
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h4 style={{ margin: "0 0 0.5rem" }}>{latestPlan.title}</h4>
                        <p style={{ whiteSpace: "pre-wrap" }}>{latestPlan.body ?? "No plan body yet."}</p>
                      </>
                    )}

                    {planPriorityTopics.length > 0 ? (
                      <div style={{ marginTop: "0.75rem" }}>
                        <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                          Priority topics
                        </div>
                        <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                          {planPriorityTopics.slice(0, 6).map((item) => (
                            <li key={`plan-topic-${item}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {planClusters.length > 0 ? (
                      <div style={{ marginTop: "0.75rem" }}>
                        <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                          Content clusters
                        </div>
                        {planClusters.slice(0, 3).map((cluster) => (
                          <div key={cluster.name ?? "cluster"} style={{ marginBottom: "0.5rem" }}>
                            <div style={{ fontWeight: 600 }}>{cluster.name ?? "Cluster"}</div>
                            <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.1rem" }}>
                              {readReportStringList(cluster.topics)
                                .slice(0, 4)
                                .map((topic) => (
                                  <li key={`${cluster.name}-${topic}`}>{topic}</li>
                                ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {canClientReviewPlan ? (
                      <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle, #333)" }}>
                        <div className="muted-text" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                          Review this production plan
                        </div>
                        <textarea
                          className="form-input"
                          value={rejectComment}
                          onChange={(event) => setRejectComment(event.target.value)}
                          placeholder="Optional comment if requesting changes"
                          rows={2}
                          style={{ width: "100%", marginBottom: "0.5rem" }}
                        />
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          <Button variant="primary" disabled={actionLoading} onClick={() => void handleApprovePlan()}>
                            Approve plan
                          </Button>
                          <Button variant="secondary" disabled={actionLoading} onClick={() => void handleRejectPlan()}>
                            Request changes
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="muted-text">No production plan yet.</p>
                    {canGeneratePlan ? (
                      <Button variant="primary" disabled={actionLoading} onClick={() => void handleGeneratePlan()} style={{ marginTop: "0.5rem" }}>
                        Generate plan
                      </Button>
                    ) : (
                      <p className="muted-text" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                        Run AI first to generate MI and SEO reports, then generate a production plan.
                      </p>
                    )}
                  </>
                )}
              </SectionPanel>

              {canManageAi ? (
                <SectionPanel title="Content Production">
                  {linkedProject || seedStatus?.project ? (
                    <>
                      <BriefField
                        label="Linked project"
                        value={linkedProject?.name ?? seedStatus?.project?.name ?? null}
                      />
                      <BriefField
                        label="Target month"
                        value={
                          linkedProject?.targetMonth?.slice(0, 7) ??
                          seedStatus?.project?.targetMonth?.slice(0, 7) ??
                          null
                        }
                      />
                    </>
                  ) : (
                    <>
                      <p className="muted-text">No linked AI Delivery project yet.</p>
                      {canCreateProject ? (
                        <Button variant="secondary" disabled={actionLoading} onClick={() => void handleCreateProject()} style={{ marginTop: "0.5rem" }}>
                          Create / link project
                        </Button>
                      ) : null}
                    </>
                  )}

                  {seedLoading ? <LoadingState label="Loading seed status…" /> : null}

                  {!seedLoading && seedStatus ? (
                    <div style={{ marginTop: "0.75rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                        <StatusBadge status={seedStatus.isSeeded ? "APPROVED" : "DRAFT"} />
                        <span className="muted-text" style={{ fontSize: "0.85rem" }}>
                          {seedStatus.isSeeded
                            ? `Seeded (${seedStatus.itemCount} items)`
                            : seedStatus.canSeed
                              ? "Ready to seed"
                              : "Not seeded"}
                        </span>
                      </div>

                      {seedStatus.seededAt ? (
                        <BriefField label="Seeded at" value={formatRunTimestamp(seedStatus.seededAt)} />
                      ) : null}

                      {seedStatus.blockReason && !seedStatus.isSeeded ? (
                        <p className="muted-text" style={{ fontSize: "0.85rem" }}>{seedStatus.blockReason}</p>
                      ) : null}

                      {seedStatus.canSeed ? (
                        <Button variant="primary" disabled={actionLoading} onClick={() => void handleSeedContentProduction()} style={{ marginTop: "0.5rem" }}>
                          Seed content production
                        </Button>
                      ) : null}

                      {seedStatus.contentPlan && seedStatus.contentPlan.items.length > 0 ? (
                        <div style={{ marginTop: "0.75rem" }}>
                          <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                            Seeded content plan items
                          </div>
                          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                            {seedStatus.contentPlan.items.slice(0, 8).map((item) => (
                              <li key={item.id} style={{ marginBottom: "0.35rem" }}>
                                <span style={{ fontWeight: 600 }}>{item.title}</span>
                                {item.targetKeyword ? (
                                  <span className="muted-text" style={{ fontSize: "0.8rem" }}>
                                    {" "}
                                    — {item.targetKeyword}
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </SectionPanel>
              ) : null}

              {canManageAi && seedStatus?.isSeeded ? (
                <SectionPanel title="Content Drafts">
                  {draftLoading ? <LoadingState label="Loading draft status…" /> : null}

                  {!draftLoading && draftStatus ? (
                    <div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                        <StatusBadge status={draftStatus.draftCount > 0 ? "READY_FOR_REVIEW" : "DRAFT"} />
                        <span className="muted-text" style={{ fontSize: "0.85rem" }}>
                          {draftStatus.draftCount}/{draftStatus.seedItemCount} drafts · {formatPackageReadiness(draftStatus.packageReadiness)}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <div>
                          <div className="muted-text" style={{ fontSize: "0.75rem" }}>Pending</div>
                          <div style={{ fontWeight: 600 }}>{draftStatus.pendingCount}</div>
                        </div>
                        <div>
                          <div className="muted-text" style={{ fontSize: "0.75rem" }}>Generated</div>
                          <div style={{ fontWeight: 600 }}>{draftStatus.generatedCount}</div>
                        </div>
                        <div>
                          <div className="muted-text" style={{ fontSize: "0.75rem" }}>Ready for review</div>
                          <div style={{ fontWeight: 600 }}>{draftStatus.readyForReviewCount}</div>
                        </div>
                        <div>
                          <div className="muted-text" style={{ fontSize: "0.75rem" }}>Needs work</div>
                          <div style={{ fontWeight: 600 }}>{draftStatus.needsWorkCount}</div>
                        </div>
                      </div>

                      {draftStatus.lastGeneratedAt ? (
                        <BriefField label="Last generated" value={formatRunTimestamp(draftStatus.lastGeneratedAt)} />
                      ) : null}

                      {draftStatus.blockReason && draftStatus.pendingCount > 0 ? (
                        <p className="muted-text" style={{ fontSize: "0.85rem" }}>{draftStatus.blockReason}</p>
                      ) : null}

                      {draftStatus.canGenerateDrafts || draftStatus.pendingCount > 0 ? (
                        <Button
                          variant="primary"
                          disabled={actionLoading || !draftStatus.canGenerateDrafts}
                          onClick={() => void handleGenerateContentDrafts()}
                          style={{ marginTop: "0.5rem", marginRight: "0.5rem" }}
                        >
                          Generate all drafts
                        </Button>
                      ) : null}

                      {(linkedProject || draftStatus.project) ? (
                        <Button variant="secondary" disabled={actionLoading} onClick={openAiDeliveryModule} style={{ marginTop: "0.5rem" }}>
                          Open AI Delivery module
                        </Button>
                      ) : null}

                      {draftStatus.items.length > 0 ? (
                        <div style={{ marginTop: "0.75rem" }}>
                          <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                            Draft readiness by item
                          </div>
                          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                            {draftStatus.items.slice(0, 10).map((item) => (
                              <li
                                key={item.contentPlanItemId}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  marginBottom: "0.5rem",
                                  flexWrap: "wrap"
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 600 }}>{item.planItemTitle}</div>
                                  <div className="muted-text" style={{ fontSize: "0.8rem" }}>
                                    {formatDraftReadiness(item.readiness)}
                                    {item.revisionCount > 0 ? ` · rev ${item.revisionCount}` : ""}
                                  </div>
                                </div>
                                {item.hasDraft ? (
                                  <Button
                                    variant="secondary"
                                    disabled={actionLoading}
                                    onClick={() => void handleRegenerateContentDraft(item.contentPlanItemId)}
                                  >
                                    Regenerate
                                  </Button>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="muted-text">Seed content production first to generate working drafts.</p>
                  )}
                </SectionPanel>
              ) : null}

              {canManageAi && !seedStatus?.isSeeded ? (
                <SectionPanel title="Content Drafts">
                  <p className="muted-text">Content drafts become available after seeding the content plan.</p>
                </SectionPanel>
              ) : null}

              {(canManageAi || (packagingStatus?.deliverables.length ?? 0) > 0) &&
              (draftStatus?.draftCount ?? packagingStatus?.eligibleDraftCount ?? 0) > 0 ? (
                <SectionPanel title="Deliverable Packaging">
                  {packagingLoading ? <LoadingState label="Loading packaging status…" /> : null}

                  {!packagingLoading && packagingStatus ? (
                    <div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                        <StatusBadge
                          status={
                            packagingStatus.packagingStage === "in_client_review"
                              ? "READY_FOR_REVIEW"
                              : packagingStatus.packagingStage === "review_complete"
                                ? "APPROVED"
                                : packagingStatus.packagedCount > 0
                                  ? "READY"
                                  : "DRAFT"
                          }
                        />
                        <span className="muted-text" style={{ fontSize: "0.85rem" }}>
                          {packagingStatus.packagedCount}/{packagingStatus.eligibleDraftCount} packaged ·{" "}
                          {formatPackagingStage(packagingStatus.packagingStage)}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <div>
                          <div className="muted-text" style={{ fontSize: "0.75rem" }}>Unpackaged</div>
                          <div style={{ fontWeight: 600 }}>{packagingStatus.unpackagedCount}</div>
                        </div>
                        <div>
                          <div className="muted-text" style={{ fontSize: "0.75rem" }}>Pending review</div>
                          <div style={{ fontWeight: 600 }}>{packagingStatus.pendingReviewCount}</div>
                        </div>
                        <div>
                          <div className="muted-text" style={{ fontSize: "0.75rem" }}>Approved</div>
                          <div style={{ fontWeight: 600 }}>{packagingStatus.approvedByClientCount}</div>
                        </div>
                        <div>
                          <div className="muted-text" style={{ fontSize: "0.75rem" }}>Rejected</div>
                          <div style={{ fontWeight: 600 }}>{packagingStatus.rejectedCount}</div>
                        </div>
                      </div>

                      {packagingStatus.lastPackagedAt ? (
                        <BriefField label="Last packaged" value={formatRunTimestamp(packagingStatus.lastPackagedAt)} />
                      ) : null}

                      {canManageAi && packagingStatus.canPackageAll ? (
                        <Button
                          variant="primary"
                          disabled={actionLoading}
                          onClick={() => void handlePackageAllDeliverables()}
                          style={{ marginTop: "0.5rem", marginRight: "0.5rem" }}
                        >
                          Package all eligible drafts
                        </Button>
                      ) : null}

                      {!canManageAi && packagingStatus.pendingReviewCount > 0 ? (
                        <Button variant="primary" disabled={actionLoading} onClick={openClientPortalApprovals} style={{ marginTop: "0.5rem" }}>
                          Review in client portal
                        </Button>
                      ) : null}

                      {packagingStatus.items.length > 0 ? (
                        <div style={{ marginTop: "0.75rem" }}>
                          <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                            Packaging by item
                          </div>
                          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                            {packagingStatus.items.slice(0, 10).map((item) => (
                              <li
                                key={item.contentPlanItemId}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  marginBottom: "0.5rem",
                                  flexWrap: "wrap"
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 600 }}>{item.planItemTitle}</div>
                                  <div className="muted-text" style={{ fontSize: "0.8rem" }}>
                                    {formatPackagingState(item.packagingState)}
                                    {item.deliverableStatus ? ` · ${item.deliverableStatus}` : ""}
                                  </div>
                                </div>
                                {canManageAi && item.canRepackage ? (
                                  <Button
                                    variant="secondary"
                                    disabled={actionLoading}
                                    onClick={() => void handleRepackageDeliverable(item.contentPlanItemId, item.draftId)}
                                  >
                                    Repackage
                                  </Button>
                                ) : null}
                                {canManageAi && item.deliverableId && item.deliverableStatus === "DRAFT" ? (
                                  <Button
                                    variant="secondary"
                                    disabled={actionLoading}
                                    onClick={() => void handleSendDeliverableForReview(item.deliverableId!)}
                                  >
                                    Send for review
                                  </Button>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {packagingStatus.deliverables.length > 0 ? (
                        <div style={{ marginTop: "0.75rem" }}>
                          <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                            Packaged deliverables
                          </div>
                          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                            {packagingStatus.deliverables.slice(0, 8).map((deliverable) => (
                              <li key={deliverable.id} style={{ marginBottom: "0.35rem" }}>
                                <span style={{ fontWeight: 600 }}>{deliverable.title}</span>
                                <span className="muted-text" style={{ fontSize: "0.8rem" }}>
                                  {" "}
                                  — {deliverable.status}
                                  {deliverable.clientRejectionReason ? " (changes requested)" : ""}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {packagingStatus.blockReason && canManageAi && packagingStatus.eligibleDraftCount === 0 ? (
                        <p className="muted-text" style={{ fontSize: "0.85rem" }}>{packagingStatus.blockReason}</p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="muted-text">Generate content drafts to begin deliverable packaging.</p>
                  )}
                </SectionPanel>
              ) : null}

              {(canManageAi || (completenessStatus?.items.length ?? 0) > 0) &&
              (packagingStatus?.packagedCount ?? 0) > 0 ? (
                <SectionPanel title="Image Sets & Package Completeness">
                  {imageSetLoading || completenessLoading ? (
                    <LoadingState label="Loading package execution status…" />
                  ) : null}

                  {!imageSetLoading && !completenessLoading && (imageSetStatus || completenessStatus) ? (
                    <div>
                      {imageSetStatus ? (
                        <div style={{ marginBottom: "1rem" }}>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                            <StatusBadge status={imageSetStatus.preparedCount > 0 ? "READY" : "DRAFT"} />
                            <span className="muted-text" style={{ fontSize: "0.85rem" }}>
                              {imageSetStatus.preparedCount}/{imageSetStatus.eligibleCount} image sets ·{" "}
                              {formatImageSetStage(imageSetStatus.imageSetStage)}
                            </span>
                          </div>

                          {canManageAi && imageSetStatus.canPrepareAll ? (
                            <Button
                              variant="primary"
                              disabled={actionLoading}
                              onClick={() => void handlePrepareAllImageSets()}
                              style={{ marginTop: "0.5rem", marginRight: "0.5rem" }}
                            >
                              Prepare all image sets
                            </Button>
                          ) : null}

                          {imageSetStatus.items.length > 0 ? (
                            <ul style={{ listStyle: "none", margin: "0.75rem 0 0", padding: 0 }}>
                              {imageSetStatus.items.slice(0, 8).map((item) => (
                                <li
                                  key={item.contentPlanItemId}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: "0.5rem",
                                    marginBottom: "0.5rem",
                                    flexWrap: "wrap"
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 600 }}>{item.planItemTitle}</div>
                                    <div className="muted-text" style={{ fontSize: "0.8rem" }}>
                                      {item.imageSetState.replace(/_/g, " ")}
                                      {item.imageStatus ? ` · ${item.imageStatus}` : ""}
                                    </div>
                                  </div>
                                  {canManageAi && item.canRefresh ? (
                                    <Button
                                      variant="secondary"
                                      disabled={actionLoading}
                                      onClick={() => void handleRefreshImageSet(item.contentPlanItemId)}
                                    >
                                      Refresh image set
                                    </Button>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ) : null}

                      {completenessStatus ? (
                        <div>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                            <StatusBadge
                              status={
                                completenessStatus.overallStage === "package_complete" ||
                                completenessStatus.overallStage === "ready_for_release_prep"
                                  ? "APPROVED"
                                  : completenessStatus.overallStage === "client_review_in_progress"
                                    ? "READY_FOR_REVIEW"
                                    : "DRAFT"
                              }
                            />
                            <span className="muted-text" style={{ fontSize: "0.85rem" }}>
                              {completenessStatus.completeItemCount}/{completenessStatus.eligibleItemCount} complete ·{" "}
                              {formatCompletenessStage(completenessStatus.overallStage)}
                            </span>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.5rem", marginBottom: "0.75rem" }}>
                            <div>
                              <div className="muted-text" style={{ fontSize: "0.75rem" }}>Ready for review</div>
                              <div style={{ fontWeight: 600 }}>{completenessStatus.readyForClientReviewCount}</div>
                            </div>
                            <div>
                              <div className="muted-text" style={{ fontSize: "0.75rem" }}>In client review</div>
                              <div style={{ fontWeight: 600 }}>{completenessStatus.clientReviewInProgressCount}</div>
                            </div>
                            <div>
                              <div className="muted-text" style={{ fontSize: "0.75rem" }}>Release prep</div>
                              <div style={{ fontWeight: 600 }}>{formatReleasePrepStage(completenessStatus.releasePrepStage)}</div>
                            </div>
                            <div>
                              <div className="muted-text" style={{ fontSize: "0.75rem" }}>Publication target</div>
                              <div style={{ fontWeight: 600 }}>
                                {completenessStatus.publicationTargetAvailable
                                  ? completenessStatus.publicationTargetLabel ?? "Available"
                                  : "Missing"}
                              </div>
                            </div>
                            <div>
                              <div className="muted-text" style={{ fontSize: "0.75rem" }}>Release package</div>
                              <div style={{ fontWeight: 600 }}>
                                {formatReleasePackageStage(completenessStatus.releasePackageStage ?? "not_ready")}
                              </div>
                            </div>
                            {canManageAi ? (
                              <div>
                                <div className="muted-text" style={{ fontSize: "0.75rem" }}>Publication handoff</div>
                                <div style={{ fontWeight: 600 }}>
                                  {publicationHandoffLoading
                                    ? "Loading…"
                                    : formatHandoffStage(publicationHandoffStatus?.handoffStage ?? "not_ready")}
                                </div>
                              </div>
                            ) : null}
                          </div>

                          {canManageAi &&
                          completenessStatus.releasePrepStage === "ready_for_release" &&
                          !completenessStatus.releasePrepared ? (
                            <Button
                              variant="primary"
                              disabled={actionLoading}
                              onClick={() => void handlePrepareRelease()}
                              style={{ marginTop: "0.5rem", marginRight: "0.5rem" }}
                            >
                              Prepare for release
                            </Button>
                          ) : null}

                          {canManageAi &&
                          completenessStatus.releasePrepared &&
                          !completenessStatus.releasePackageFinalized &&
                          completenessStatus.canFinalizeReleasePackage ? (
                            <Button
                              variant="primary"
                              disabled={actionLoading}
                              onClick={() => void handleFinalizeReleasePackage()}
                              style={{ marginTop: "0.5rem", marginRight: "0.5rem" }}
                            >
                              Finalize release package
                            </Button>
                          ) : null}

                          {releasePackageLoading ? (
                            <p className="muted-text" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                              Loading release package status…
                            </p>
                          ) : null}

                          {releasePackageStatus?.releasePackageFinalized &&
                          releasePackageStatus.clientReleasePackage ? (
                            <div style={{ marginTop: "0.75rem" }}>
                              <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                                Final release package
                              </div>
                              <div style={{ fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                                Finalized {formatRunTimestamp(releasePackageStatus.clientReleasePackage.finalizedAt)} ·{" "}
                                {releasePackageStatus.clientReleasePackage.deliverables.length} deliverable
                                {releasePackageStatus.clientReleasePackage.deliverables.length === 1 ? "" : "s"}
                              </div>
                              {releasePackageStatus.clientReleasePackage.summary ? (
                                <p className="muted-text" style={{ fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                                  {releasePackageStatus.clientReleasePackage.summary}
                                </p>
                              ) : null}
                              {releasePackageStatus.clientReleasePackage.deliverables.length > 0 ? (
                                <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.85rem" }}>
                                  {releasePackageStatus.clientReleasePackage.deliverables.map((item) => (
                                    <li key={`${item.title}-${item.type}`} style={{ marginBottom: "0.25rem" }}>
                                      {item.title} ({item.status})
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          ) : null}

                          {canManageAi && completenessStatus.releasePackageBlockReason &&
                          !completenessStatus.releasePackageFinalized ? (
                            <p className="muted-text" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                              {completenessStatus.releasePackageBlockReason}
                            </p>
                          ) : null}

                          {canManageAi && publicationHandoffStatus ? (
                            <div
                              style={{
                                marginTop: "0.75rem",
                                paddingTop: "0.75rem",
                                borderTop: "1px solid rgba(255,255,255,0.08)"
                              }}
                            >
                              <div
                                className="muted-text"
                                style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}
                              >
                                Publication handoff
                              </div>
                              <p className="muted-text" style={{ fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                                Draft prep only — no live publish
                              </p>
                              <div style={{ fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                                {publicationHandoffStatus.mappedItemCount} mapped item
                                {publicationHandoffStatus.mappedItemCount === 1 ? "" : "s"}
                                {publicationHandoffStatus.publicationTargetLabel
                                  ? ` · ${publicationHandoffStatus.publicationTargetLabel}`
                                  : ""}
                                {publicationHandoffStatus.handoffExecuted &&
                                publicationHandoffStatus.lastHandoffExecutedAt
                                  ? ` · Last handoff ${formatRunTimestamp(publicationHandoffStatus.lastHandoffExecutedAt)}`
                                  : ""}
                              </div>
                              {publicationHandoffStatus.publicationHandoff ? (
                                <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem" }}>
                                  {publicationHandoffStatus.publicationHandoff.preparedCount} prepared
                                  {publicationHandoffStatus.publicationHandoff.reusedCount > 0
                                    ? ` · ${publicationHandoffStatus.publicationHandoff.reusedCount} reused`
                                    : ""}
                                  {` · ${publicationHandoffStatus.publicationHandoff.itemCount} item${
                                    publicationHandoffStatus.publicationHandoff.itemCount === 1 ? "" : "s"
                                  }`}
                                </div>
                              ) : null}
                              <Button
                                variant="secondary"
                                disabled={actionLoading || !publicationHandoffStatus.canExecuteHandoff}
                                onClick={() => void handleExecutePublicationHandoff()}
                                style={{ marginTop: "0.35rem", marginRight: "0.5rem" }}
                              >
                                {publicationHandoffStatus.packageChangedSinceHandoff
                                  ? "Re-prepare WordPress drafts"
                                  : "Prepare WordPress drafts"}
                              </Button>
                              {publicationHandoffNotice ? (
                                <p
                                  className="muted-text"
                                  style={{
                                    marginTop: "0.5rem",
                                    fontSize: "0.85rem",
                                    color:
                                      publicationHandoffNotice.type === "error"
                                        ? "var(--color-danger, #f87171)"
                                        : undefined
                                  }}
                                >
                                  {publicationHandoffNotice.message}
                                </p>
                              ) : null}
                              {publicationHandoffStatus.handoffBlockReason &&
                              !publicationHandoffStatus.canExecuteHandoff ? (
                                <p className="muted-text" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                                  {publicationHandoffStatus.handoffBlockReason}
                                </p>
                              ) : null}
                            </div>
                          ) : null}

                          {!canManageAi && completenessStatus.clientReviewInProgressCount > 0 ? (
                            <Button variant="primary" disabled={actionLoading} onClick={openClientPortalApprovals} style={{ marginTop: "0.5rem" }}>
                              Review package in client portal
                            </Button>
                          ) : null}

                          {completenessStatus.missingRequirements.length > 0 ? (
                            <div style={{ marginTop: "0.75rem" }}>
                              <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                                Missing requirements
                              </div>
                              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                                {completenessStatus.missingRequirements.slice(0, 5).map((item) => (
                                  <li key={item} style={{ marginBottom: "0.25rem" }}>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="muted-text">Package text deliverables first to prepare image sets and completeness tracking.</p>
                  )}
                </SectionPanel>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
