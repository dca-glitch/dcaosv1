import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button, EmptyState, ErrorState, LoadingState, PageHeader, SectionPanel, StatusBadge, WorkflowBriefKnowledgeUsageSummary, readContentDraftsKnowledgeContext, readPlanJsonKnowledgeContext, parseWorkflowBriefKnowledgeContextMeta } from "../components/ui";

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
    knowledgeContext?: unknown;
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

function BriefDetailSection({
  title,
  children,
  className
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={["brief-detail-section", className].filter(Boolean).join(" ")}>
      <div className="brief-section-kicker muted-text">{title}</div>
      {children}
    </div>
  );
}

function BriefBulletList({
  items,
  flat = false
}: {
  items: string[];
  flat?: boolean;
}) {
  return (
    <ul className={flat ? "brief-bullet-list brief-bullet-list--flat" : "brief-bullet-list"}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function BriefStatGrid({
  children,
  wide = false,
  metrics = false
}: {
  children: ReactNode;
  wide?: boolean;
  metrics?: boolean;
}) {
  const classes = [
    "brief-stat-grid",
    wide ? "brief-stat-grid--wide" : null,
    metrics ? "brief-stat-grid--metrics" : null
  ].filter(Boolean).join(" ");
  return <div className={classes}>{children}</div>;
}

function BriefStatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="brief-stat-card">
      <div className="brief-stat-label muted-text">{label}</div>
      <strong>{value}</strong>
    </div>
  );
}

function BriefItemRow({
  title,
  meta,
  action
}: {
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <li className="brief-item-row">
      <div className="brief-item-row-main">
        <div className="brief-item-title">{title}</div>
        {meta ? <div className="brief-item-meta muted-text">{meta}</div> : null}
      </div>
      {action ? <div className="brief-item-row-action">{action}</div> : null}
    </li>
  );
}

type IntakeValidation = {
  isComplete: boolean;
  missingFields: string[];
};

function checkIntakeCompleteness(brief: WorkflowBriefDetail | null): IntakeValidation {
  if (!brief) {
    return { isComplete: false, missingFields: [] };
  }
  const missing: string[] = [];
  if (!brief.goal?.trim()) missing.push("Goal");
  if (!brief.businessContext?.trim()) missing.push("Business context");
  if (!brief.targetAudience?.trim()) missing.push("Target audience");
  if (!brief.offerContext?.trim()) missing.push("Offer context");
  return {
    isComplete: missing.length === 0,
    missingFields: missing
  };
}

type ReadinessItem = {
  id: string;
  label: string;
  state: "ready" | "pending" | "blocked";
  note?: string;
};

function buildReadinessState(
  brief: WorkflowBriefDetail | null,
  isAdmin: boolean,
  runKnowledgeContext: ReturnType<typeof parseWorkflowBriefKnowledgeContextMeta>,
  planKnowledgeContext: ReturnType<typeof readPlanJsonKnowledgeContext>,
  draftKnowledgeContext: ReturnType<typeof readContentDraftsKnowledgeContext>
): ReadinessItem[] {
  if (!brief) return [];

  const intake = checkIntakeCompleteness(brief);
  const items: ReadinessItem[] = [
    {
      id: "intake",
      label: "Verified intake facts",
      state: intake.isComplete ? "ready" : "blocked",
      note: intake.isComplete
        ? "Goal, business context, audience, and offer are set."
        : `Missing: ${intake.missingFields.join(", ")}`
    },
    {
      id: "brief",
      label: "Brief submitted",
      state: brief.status === "DRAFT" ? "pending" : "ready",
      note: brief.status === "DRAFT" ? "Submit the brief to unlock AI reports." : `Status: ${brief.status}`
    },
    {
      id: "reports",
      label: "MI + SEO reports",
      state: brief.miReports?.[0] && brief.seoReports?.[0] ? "ready" : "pending",
      note:
        brief.miReports?.[0] && brief.seoReports?.[0]
          ? "Reports generated."
          : "Run AI to generate reports."
    },
    {
      id: "plan",
      label: "SEO/content plan",
      state: brief.productionPlans?.[0] ? "ready" : "pending",
      note: brief.productionPlans?.[0]
        ? `Plan status: ${brief.productionPlans[0].status}`
        : "Generate a production plan from reports."
    }
  ];

  if (isAdmin) {
    const anyContextUsed =
      runKnowledgeContext?.used || planKnowledgeContext?.used || draftKnowledgeContext?.used;
    items.splice(1, 0, {
      id: "knowledge",
      label: "Approved KB/context",
      state: anyContextUsed ? "ready" : "pending",
      note: anyContextUsed
        ? "Approved knowledge context is attached."
        : "No approved knowledge context used yet."
    });
  }

  return items;
}

function BriefReadinessChecklist({
  items,
  isAdmin
}: {
  items: ReadinessItem[];
  isAdmin: boolean;
}) {
  if (items.length === 0) return null;

  const blockedCount = items.filter((item) => item.state === "blocked").length;

  return (
    <div className="brief-readiness-checklist">
      <div className="brief-section-kicker muted-text">Intake-to-plan path</div>
      <ol className="brief-readiness-steps">
        {items.map((item) => (
          <li
            key={item.id}
            className={`brief-readiness-step brief-readiness-step--${item.state}`}
          >
            <span className="brief-readiness-step-marker" aria-hidden="true" />
            <span className="brief-readiness-step-body">
              <span className="brief-readiness-step-label">{item.label}</span>
              {item.note ? (
                <span className="brief-readiness-step-note muted-text">{item.note}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
      {blockedCount > 0 ? (
        <p className="brief-readiness-footnote muted-text">
          Complete blocked items before generating reports or plans.
        </p>
      ) : null}
      {isAdmin && blockedCount === 0 ? (
        <p className="brief-readiness-footnote muted-text">
          Puriva readiness: verify medical, legal, and partner claims in Notes before running AI.
        </p>
      ) : null}
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
    <div className="brief-report-sections">
      {sections.map((section) => (
        <BriefDetailSection key={section.label} title={section.label}>
          <BriefBulletList items={section.items} />
        </BriefDetailSection>
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
  const runKnowledgeContext =
    canManageAi && latestRun ? parseWorkflowBriefKnowledgeContextMeta(latestRun.knowledgeContext) : null;
  const planKnowledgeContext =
    canManageAi && latestPlan?.planJson ? readPlanJsonKnowledgeContext(latestPlan.planJson) : null;
  const draftKnowledgeContext =
    canManageAi && latestPlan?.planJson ? readContentDraftsKnowledgeContext(latestPlan.planJson) : null;
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
        title={canManageAi ? "Workflow Briefs" : "Production Plan Review"}
        titleId="workflow-briefs-title"
        description={
          canManageAi
            ? "Intake → verified facts → approved KB/context → brief → SEO/content plan."
            : "Review the production plan prepared for your project and approve or request changes before production begins."
        }
      />

      {error ? <ErrorState title="Workflow brief error" message={error} /> : null}

      <div className="brief-workspace-layout">
        <SectionPanel title="Briefs" tone="compact">
          {loading ? (
            <LoadingState label="Loading briefs…" />
          ) : briefs.length === 0 ? (
            <EmptyState
              title={canManageAi ? "No workflow briefs" : "No production plans yet"}
              message={
                canManageAi
                  ? "Create a brief via API or seed data to get started."
                  : "When your team shares a production plan, it will appear here for review."
              }
            />
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

        <div className="brief-detail-shell brief-detail-stack">
          {!selectedId ? (
            <SectionPanel title="Brief detail">
              <EmptyState
                title={canManageAi ? "Select a brief" : "Select a plan"}
                message={
                  canManageAi
                    ? "Choose a brief from the list to view details and AI outputs."
                    : "Choose a plan from the list to review details and approve or request changes."
                }
              />
            </SectionPanel>
          ) : detailLoading ? (
            <LoadingState label="Loading brief detail…" />
          ) : detail ? (
            <>
              {(() => {
                const intake = checkIntakeCompleteness(detail);
                return intake.missingFields.length > 0 ? (
                  <div className="status-notice-compact status-warning brief-intake-warning">
                    <span className="status-notice-text">
                      <strong>Incomplete intake:</strong> Complete the following fields before generating reports:{" "}
                      {intake.missingFields.join(", ")}
                    </span>
                  </div>
                ) : null;
              })()}
              <BriefReadinessChecklist
                items={buildReadinessState(
                  detail,
                  canManageAi,
                  runKnowledgeContext,
                  planKnowledgeContext,
                  draftKnowledgeContext
                )}
                isAdmin={canManageAi}
              />
              <SectionPanel
                className="brief-detail-section"
                title={detail.title}
                tone="highlight"
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
                <div className="brief-detail-header">
                  <StatusBadge status={detail.status} />
                </div>
                <BriefField label="Goal" value={detail.goal} />
                <BriefField label="Business context" value={detail.businessContext} />
                <BriefField label="Target audience" value={detail.targetAudience} />
                <BriefField label="Offer context" value={detail.offerContext} />
                <BriefField label="Location context" value={detail.locationContext} />
                <BriefField label="Notes" value={detail.notes} />
              </SectionPanel>

              {canManageAi ? (
                <SectionPanel className="brief-detail-section" title="AI Run Status">
                  {latestRun ? (
                    <>
                      <div className="brief-detail-meta">
                        <StatusBadge status={latestRun.status} />
                        {latestRun.errorMessage ? (
                          <span className="brief-detail-caption muted-text">{latestRun.errorMessage}</span>
                        ) : null}
                      </div>
                      <BriefField label="Started" value={formatRunTimestamp(latestRun.startedAt)} />
                      <BriefField label="Completed" value={formatRunTimestamp(latestRun.completedAt)} />
                      {runKnowledgeContext ? (
                        <WorkflowBriefKnowledgeUsageSummary
                          className="brief-detail-section--spaced"
                          metadata={runKnowledgeContext}
                          workflowType="summary (MI/SEO run)"
                        />
                      ) : null}
                    </>
                  ) : (
                    <p className="muted-text">No AI runs yet. Finish verified intake and approved KB/context first.</p>
                  )}
                </SectionPanel>
              ) : null}

              {(miOpportunities.length > 0 || miRisks.length > 0 || seoKeywords.length > 0 || seoTopics.length > 0) ? (
                <SectionPanel className="brief-detail-section" title="Key Highlights">
                  {miOpportunities.length > 0 ? (
                    <BriefDetailSection title="Top opportunities">
                      <BriefBulletList items={miOpportunities.slice(0, 3)} />
                    </BriefDetailSection>
                  ) : null}
                  {miRisks.length > 0 ? (
                    <BriefDetailSection title="Key risks">
                      <BriefBulletList items={miRisks.slice(0, 3)} />
                    </BriefDetailSection>
                  ) : null}
                  {seoKeywords.length > 0 ? (
                    <BriefDetailSection title="Keyword clusters">
                      <BriefBulletList items={seoKeywords.slice(0, 5)} />
                    </BriefDetailSection>
                  ) : null}
                  {seoTopics.length > 0 ? (
                    <BriefDetailSection title="Topic ideas">
                      <BriefBulletList items={seoTopics.slice(0, 4)} />
                    </BriefDetailSection>
                  ) : null}
                </SectionPanel>
              ) : null}

              <SectionPanel className="brief-detail-section" title="MI Report">
                {latestMi ? (
                  <>
                    <div className="brief-detail-meta">
                      <StatusBadge status={latestMi.status} />
                    </div>
                    <p className="brief-report-summary">{latestMi.summaryText ?? "No summary available."}</p>
                    <ReportSectionList sections={miSections} />
                  </>
                ) : (
                  <p className="muted-text">No MI report yet. Run AI from an eligible brief status.</p>
                )}
              </SectionPanel>

              <SectionPanel className="brief-detail-section" title="SEO Report">
                {latestSeo ? (
                  <>
                    <div className="brief-detail-meta">
                      <StatusBadge status={latestSeo.status} />
                    </div>
                    <p className="brief-report-summary">{latestSeo.summaryText ?? "No summary available."}</p>
                    <ReportSectionList sections={seoSections} />
                  </>
                ) : (
                  <p className="muted-text">No SEO report yet. Run AI from an eligible brief status.</p>
                )}
              </SectionPanel>

              <SectionPanel className="brief-detail-section" title="Production Plan">
                {latestPlan ? (
                  <>
                    <div className="brief-detail-meta">
                      <StatusBadge status={latestPlan.status} />
                      {latestPlan.sentToClientAt ? (
                        <span className="brief-detail-caption muted-text">
                          Sent {formatRunTimestamp(latestPlan.sentToClientAt)}
                        </span>
                      ) : null}
                      {latestPlan.approvedByClientAt ? (
                        <span className="brief-detail-caption muted-text">
                          Approved {formatRunTimestamp(latestPlan.approvedByClientAt)}
                        </span>
                      ) : null}
                    </div>

                    {canManageAi ? (
                      <div className="brief-action-row brief-action-row--start">
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
                      <div className="brief-form-block">
                        <label className="brief-form-field muted-text">
                          <span>Title</span>
                          <input
                            className="form-input brief-form-input-full"
                            value={planEditTitle}
                            onChange={(event) => setPlanEditTitle(event.target.value)}
                          />
                        </label>
                        <label className="brief-form-field muted-text">
                          <span>Body</span>
                          <textarea
                            className="form-input brief-form-input-full"
                            value={planEditBody}
                            onChange={(event) => setPlanEditBody(event.target.value)}
                            rows={8}
                          />
                        </label>
                        <Button variant="primary" disabled={actionLoading} onClick={() => void handleSavePlanEdit()}>
                          Save plan
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h4 className="brief-plan-title">{latestPlan.title}</h4>
                        <p className="brief-plan-body">{latestPlan.body ?? "No plan body yet."}</p>
                      </>
                    )}

                    {canManageAi && !showPlanEdit ? (
                      <div className="brief-detail-section--spaced" style={{ padding: "12px 16px", backgroundColor: "#f0f9ff", borderLeft: "4px solid #0284c7", borderRadius: "4px", marginTop: "16px" }}>
                        <div className="muted-text" style={{ fontSize: "0.9em" }}>
                          <strong>ℹ Compliance review checkpoint:</strong> Before seeding content production, verify all claims in this plan against the Puriva operational intake and compliance guide. Check medical language, contact facts, partner claims, and service descriptions. Document your findings in the brief Notes field.
                        </div>
                      </div>
                    ) : null}

                    {planPriorityTopics.length > 0 ? (
                      <BriefDetailSection className="brief-detail-section--spaced" title="Priority topics">
                        <BriefBulletList items={planPriorityTopics.slice(0, 6)} />
                      </BriefDetailSection>
                    ) : null}

                    {planClusters.length > 0 ? (
                      <BriefDetailSection className="brief-detail-section--spaced" title="Content clusters">
                        {planClusters.slice(0, 3).map((cluster) => (
                          <div className="brief-cluster-block" key={cluster.name ?? "cluster"}>
                            <div className="brief-item-title">{cluster.name ?? "Cluster"}</div>
                            <BriefBulletList
                              items={readReportStringList(cluster.topics).slice(0, 4)}
                            />
                          </div>
                        ))}
                      </BriefDetailSection>
                    ) : null}

                    {canManageAi && planKnowledgeContext ? (
                      <WorkflowBriefKnowledgeUsageSummary
                        className="brief-detail-section--spaced"
                        metadata={planKnowledgeContext}
                        workflowType="content_plan_draft"
                      />
                    ) : null}

                    {canClientReviewPlan ? (
                      <div className="brief-detail-divider">
                        <div className="brief-muted-note muted-text">Review this production plan</div>
                        <textarea
                          className="form-input brief-form-input-full"
                          value={rejectComment}
                          onChange={(event) => setRejectComment(event.target.value)}
                          placeholder="Optional comment if requesting changes"
                          rows={2}
                        />
                        <div className="brief-action-row brief-action-row--start">
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
                      <div className="brief-action-row brief-action-row--start brief-action-row--spaced">
                        <Button variant="primary" disabled={actionLoading} onClick={() => void handleGeneratePlan()}>
                          Generate plan
                        </Button>
                      </div>
                    ) : (
                    <div>
                      <p className="brief-muted-note muted-text">
                        1. Complete the intake fields above (Goal, Business context, Target audience, Offer context)
                      </p>
                      <p className="brief-muted-note muted-text">
                        2. Run AI to generate MI and SEO reports
                      </p>
                      <p className="brief-muted-note muted-text">
                        3. Generate a production plan from the reports
                      </p>
                      <p className="brief-muted-note muted-text">
                        4. Review for Puriva compliance before seeding content production
                      </p>
                    </div>
                  )}
                </>
                )}
              </SectionPanel>

              {canManageAi ? (
                <SectionPanel className="brief-detail-section" title="Content Production">
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
                        <div className="brief-action-row brief-action-row--start brief-action-row--spaced">
                          <Button variant="secondary" disabled={actionLoading} onClick={() => void handleCreateProject()}>
                            Create / link project
                          </Button>
                        </div>
                      ) : null}
                    </>
                  )}

                  {seedLoading ? <LoadingState label="Loading seed status…" /> : null}

                  {!seedLoading && seedStatus ? (
                    <div className="brief-detail-section--spaced">
                      <div className="brief-detail-meta">
                        <StatusBadge status={seedStatus.isSeeded ? "APPROVED" : "DRAFT"} />
                        <span className="brief-detail-caption muted-text">
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
                        <p className="brief-muted-note muted-text">{seedStatus.blockReason}</p>
                      ) : null}

                      {seedStatus.canSeed && canManageAi ? (
                        <div className="brief-detail-section--spaced" style={{ padding: "12px 16px", backgroundColor: "#fef3c7", borderLeft: "4px solid #f59e0b", borderRadius: "4px", marginBottom: "16px" }}>
                          <div className="muted-text" style={{ fontSize: "0.9em" }}>
                            <strong>→ Before seeding:</strong> Verify all production plan claims against the Puriva compliance guide. Document findings in the brief Notes field, then proceed.
                          </div>
                        </div>
                      ) : null}

                      {seedStatus.canSeed ? (
                        <div className="brief-action-row brief-action-row--start brief-action-row--spaced">
                          <Button variant="primary" disabled={actionLoading} onClick={() => void handleSeedContentProduction()}>
                            Seed content production
                          </Button>
                        </div>
                      ) : null}

                      {seedStatus.contentPlan && seedStatus.contentPlan.items.length > 0 ? (
                        <BriefDetailSection className="brief-detail-section--spaced" title="Seeded content plan items">
                          <ul className="brief-bullet-list">
                            {seedStatus.contentPlan.items.slice(0, 8).map((item) => (
                              <li className="brief-bullet-list-item" key={item.id}>
                                <span className="brief-item-title">{item.title}</span>
                                {item.targetKeyword ? (
                                  <span className="brief-item-meta muted-text"> — {item.targetKeyword}</span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </BriefDetailSection>
                      ) : null}
                    </div>
                  ) : null}
                </SectionPanel>
              ) : null}

              {canManageAi && seedStatus?.isSeeded ? (
                <SectionPanel className="brief-detail-section" title="Content Drafts">
                  {draftLoading ? <LoadingState label="Loading draft status…" /> : null}

                  {!draftLoading && draftStatus ? (
                    <div>
                      <div className="brief-detail-meta">
                        <StatusBadge status={draftStatus.draftCount > 0 ? "READY_FOR_REVIEW" : "DRAFT"} />
                        <span className="brief-detail-caption muted-text">
                          {draftStatus.draftCount}/{draftStatus.seedItemCount} drafts · {formatPackageReadiness(draftStatus.packageReadiness)}
                        </span>
                      </div>

                      <BriefStatGrid wide>
                        <BriefStatCard label="Pending" value={draftStatus.pendingCount} />
                        <BriefStatCard label="Generated" value={draftStatus.generatedCount} />
                        <BriefStatCard label="Ready for review" value={draftStatus.readyForReviewCount} />
                        <BriefStatCard label="Needs work" value={draftStatus.needsWorkCount} />
                      </BriefStatGrid>

                      {draftStatus.lastGeneratedAt ? (
                        <BriefField label="Last generated" value={formatRunTimestamp(draftStatus.lastGeneratedAt)} />
                      ) : null}

                      {draftKnowledgeContext ? (
                        <WorkflowBriefKnowledgeUsageSummary
                          className="brief-detail-section--spaced"
                          metadata={draftKnowledgeContext}
                          workflowType="article_draft"
                        />
                      ) : null}

                      {draftStatus.blockReason && draftStatus.pendingCount > 0 ? (
                        <p className="brief-muted-note muted-text">{draftStatus.blockReason}</p>
                      ) : null}

                      <div className="brief-action-row brief-action-row--start brief-action-row--spaced">
                        {draftStatus.canGenerateDrafts || draftStatus.pendingCount > 0 ? (
                          <Button
                            variant="primary"
                            disabled={actionLoading || !draftStatus.canGenerateDrafts}
                            onClick={() => void handleGenerateContentDrafts()}
                          >
                            Generate all drafts
                          </Button>
                        ) : null}

                        {(linkedProject || draftStatus.project) ? (
                          <Button variant="secondary" disabled={actionLoading} onClick={openAiDeliveryModule}>
                            Open AI Delivery module
                          </Button>
                        ) : null}
                      </div>

                      {draftStatus.canGenerateDrafts && canManageAi ? (
                        <div className="brief-detail-section--spaced" style={{ padding: "12px 16px", backgroundColor: "#dbeafe", borderLeft: "4px solid #0284c7", borderRadius: "4px", marginTop: "16px" }}>
                          <div className="muted-text" style={{ fontSize: "0.9em" }}>
                            <strong>ℹ Puriva note:</strong> Ensure compliance review is documented in brief Notes before generating drafts. Drafts should not reach client review until compliance is verified.
                          </div>
                        </div>
                      ) : null}

                      {draftStatus.items.length > 0 ? (
                        <BriefDetailSection className="brief-detail-section--spaced" title="Draft readiness by item">
                          <ul className="brief-bullet-list brief-bullet-list--flat">
                            {draftStatus.items.slice(0, 10).map((item) => (
                              <BriefItemRow
                                key={item.contentPlanItemId}
                                title={item.planItemTitle}
                                meta={
                                  <>
                                    {formatDraftReadiness(item.readiness)}
                                    {item.revisionCount > 0 ? ` · rev ${item.revisionCount}` : ""}
                                  </>
                                }
                                action={
                                  item.hasDraft ? (
                                    <Button
                                      variant="secondary"
                                      disabled={actionLoading}
                                      onClick={() => void handleRegenerateContentDraft(item.contentPlanItemId)}
                                    >
                                      Regenerate
                                    </Button>
                                  ) : null
                                }
                              />
                            ))}
                          </ul>
                        </BriefDetailSection>
                      ) : null}
                    </div>
                  ) : (
                    <div>
                      <p className="muted-text">Seed content production first to generate working drafts.</p>
                      <p className="brief-muted-note muted-text">Complete seeding in the Content Production section above.</p>
                    </div>
                  )}
                </SectionPanel>
              ) : null}

              {canManageAi && !seedStatus?.isSeeded ? (
                <SectionPanel className="brief-detail-section" title="Content Drafts">
                  <p className="muted-text">Content drafts become available after seeding the content plan.</p>
                  <p className="brief-muted-note muted-text">After compliance review is complete, seed content production in the Content Production section above.</p>
                </SectionPanel>
              ) : null}

              {(canManageAi || (packagingStatus?.deliverables.length ?? 0) > 0) &&
              (draftStatus?.draftCount ?? packagingStatus?.eligibleDraftCount ?? 0) > 0 ? (
                <SectionPanel className="brief-detail-section" title="Deliverable Packaging">
                  {packagingLoading ? <LoadingState label="Loading packaging status…" /> : null}

                  {!packagingLoading && packagingStatus ? (
                    <div>
                      <div className="brief-detail-meta">
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
                        <span className="brief-detail-caption muted-text">
                          {packagingStatus.packagedCount}/{packagingStatus.eligibleDraftCount} packaged ·{" "}
                          {formatPackagingStage(packagingStatus.packagingStage)}
                        </span>
                      </div>

                      <BriefStatGrid wide>
                        <BriefStatCard label="Unpackaged" value={packagingStatus.unpackagedCount} />
                        <BriefStatCard label="Pending review" value={packagingStatus.pendingReviewCount} />
                        <BriefStatCard label="Approved" value={packagingStatus.approvedByClientCount} />
                        <BriefStatCard label="Rejected" value={packagingStatus.rejectedCount} />
                      </BriefStatGrid>

                      {packagingStatus.lastPackagedAt ? (
                        <BriefField label="Last packaged" value={formatRunTimestamp(packagingStatus.lastPackagedAt)} />
                      ) : null}

                      <div className="brief-action-row brief-action-row--start brief-action-row--spaced">
                        {canManageAi && packagingStatus.canPackageAll ? (
                          <Button
                            variant="primary"
                            disabled={actionLoading}
                            onClick={() => void handlePackageAllDeliverables()}
                          >
                            Package all eligible drafts
                          </Button>
                        ) : null}

                        {!canManageAi && packagingStatus.pendingReviewCount > 0 ? (
                          <Button variant="primary" disabled={actionLoading} onClick={openClientPortalApprovals}>
                            Review in client portal
                          </Button>
                        ) : null}
                      </div>

                      {packagingStatus.items.length > 0 ? (
                        <BriefDetailSection className="brief-detail-section--spaced" title="Packaging by item">
                          <ul className="brief-bullet-list brief-bullet-list--flat">
                            {packagingStatus.items.slice(0, 10).map((item) => (
                              <BriefItemRow
                                key={item.contentPlanItemId}
                                title={item.planItemTitle}
                                meta={
                                  <>
                                    {formatPackagingState(item.packagingState)}
                                    {item.deliverableStatus ? ` · ${item.deliverableStatus}` : ""}
                                  </>
                                }
                                action={
                                  <>
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
                                  </>
                                }
                              />
                            ))}
                          </ul>
                        </BriefDetailSection>
                      ) : null}

                      {packagingStatus.deliverables.length > 0 ? (
                        <BriefDetailSection className="brief-detail-section--spaced" title="Packaged deliverables">
                          <ul className="brief-bullet-list">
                            {packagingStatus.deliverables.slice(0, 8).map((deliverable) => (
                              <li className="brief-bullet-list-item" key={deliverable.id}>
                                <span className="brief-item-title">{deliverable.title}</span>
                                <span className="brief-item-meta muted-text">
                                  {" "}
                                  — {deliverable.status}
                                  {deliverable.clientRejectionReason ? " (changes requested)" : ""}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </BriefDetailSection>
                      ) : null}

                      {packagingStatus.blockReason && canManageAi && packagingStatus.eligibleDraftCount === 0 ? (
                        <p className="brief-muted-note muted-text">{packagingStatus.blockReason}</p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="muted-text">Generate content drafts to begin deliverable packaging.</p>
                  )}
                </SectionPanel>
              ) : null}

              {(canManageAi || (completenessStatus?.items.length ?? 0) > 0) &&
              (packagingStatus?.packagedCount ?? 0) > 0 ? (
                <SectionPanel className="brief-detail-section" title="Image Sets & Package Completeness">
                  {imageSetLoading || completenessLoading ? (
                    <LoadingState label="Loading package execution status…" />
                  ) : null}

                  {!imageSetLoading && !completenessLoading && (imageSetStatus || completenessStatus) ? (
                    <div>
                      {imageSetStatus ? (
                        <div className="brief-detail-section">
                          <div className="brief-detail-meta">
                            <StatusBadge status={imageSetStatus.preparedCount > 0 ? "READY" : "DRAFT"} />
                            <span className="brief-detail-caption muted-text">
                              {imageSetStatus.preparedCount}/{imageSetStatus.eligibleCount} image sets ·{" "}
                              {formatImageSetStage(imageSetStatus.imageSetStage)}
                            </span>
                          </div>

                          {canManageAi && imageSetStatus.canPrepareAll ? (
                            <div className="brief-action-row brief-action-row--start brief-action-row--spaced">
                              <Button
                                variant="primary"
                                disabled={actionLoading}
                                onClick={() => void handlePrepareAllImageSets()}
                              >
                                Prepare all image sets
                              </Button>
                            </div>
                          ) : null}

                          {imageSetStatus.items.length > 0 ? (
                            <ul className="brief-bullet-list brief-bullet-list--flat brief-detail-section--spaced">
                              {imageSetStatus.items.slice(0, 8).map((item) => (
                                <BriefItemRow
                                  key={item.contentPlanItemId}
                                  title={item.planItemTitle}
                                  meta={
                                    <>
                                      {item.imageSetState.replace(/_/g, " ")}
                                      {item.imageStatus ? ` · ${item.imageStatus}` : ""}
                                    </>
                                  }
                                  action={
                                    canManageAi && item.canRefresh ? (
                                      <Button
                                        variant="secondary"
                                        disabled={actionLoading}
                                        onClick={() => void handleRefreshImageSet(item.contentPlanItemId)}
                                      >
                                        Refresh image set
                                      </Button>
                                    ) : null
                                  }
                                />
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ) : null}

                      {completenessStatus ? (
                        <div>
                          <div className="brief-detail-meta">
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
                            <span className="brief-detail-caption muted-text">
                              {completenessStatus.completeItemCount}/{completenessStatus.eligibleItemCount} complete ·{" "}
                              {formatCompletenessStage(completenessStatus.overallStage)}
                            </span>
                          </div>

                          <BriefStatGrid metrics>
                            <BriefStatCard label="Ready for review" value={completenessStatus.readyForClientReviewCount} />
                            <BriefStatCard label="In client review" value={completenessStatus.clientReviewInProgressCount} />
                            <BriefStatCard label="Release prep" value={formatReleasePrepStage(completenessStatus.releasePrepStage)} />
                            <BriefStatCard
                              label="Publication target"
                              value={
                                completenessStatus.publicationTargetAvailable
                                  ? completenessStatus.publicationTargetLabel ?? "Available"
                                  : "Missing"
                              }
                            />
                            <BriefStatCard
                              label="Release package"
                              value={formatReleasePackageStage(completenessStatus.releasePackageStage ?? "not_ready")}
                            />
                            {canManageAi ? (
                              <BriefStatCard
                                label="Publication handoff"
                                value={
                                  publicationHandoffLoading
                                    ? "Loading…"
                                    : formatHandoffStage(publicationHandoffStatus?.handoffStage ?? "not_ready")
                                }
                              />
                            ) : null}
                          </BriefStatGrid>

                          <div className="brief-action-row brief-action-row--start brief-action-row--spaced">
                            {canManageAi &&
                            completenessStatus.releasePrepStage === "ready_for_release" &&
                            !completenessStatus.releasePrepared ? (
                              <Button
                                variant="primary"
                                disabled={actionLoading}
                                onClick={() => void handlePrepareRelease()}
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
                              >
                                Finalize release package
                              </Button>
                            ) : null}

                            {!canManageAi && completenessStatus.clientReviewInProgressCount > 0 ? (
                              <Button variant="primary" disabled={actionLoading} onClick={openClientPortalApprovals}>
                                Review package in client portal
                              </Button>
                            ) : null}
                          </div>

                          {releasePackageLoading ? (
                            <p className="brief-muted-note muted-text">Loading release package status…</p>
                          ) : null}

                          {releasePackageStatus?.releasePackageFinalized &&
                          releasePackageStatus.clientReleasePackage ? (
                            <BriefDetailSection className="brief-detail-section--spaced" title="Final release package">
                              <div className="brief-muted-note">
                                Finalized {formatRunTimestamp(releasePackageStatus.clientReleasePackage.finalizedAt)} ·{" "}
                                {releasePackageStatus.clientReleasePackage.deliverables.length} deliverable
                                {releasePackageStatus.clientReleasePackage.deliverables.length === 1 ? "" : "s"}
                              </div>
                              {releasePackageStatus.clientReleasePackage.summary ? (
                                <p className="brief-muted-note muted-text">
                                  {releasePackageStatus.clientReleasePackage.summary}
                                </p>
                              ) : null}
                              {releasePackageStatus.clientReleasePackage.deliverables.length > 0 ? (
                                <ul className="brief-bullet-list">
                                  {releasePackageStatus.clientReleasePackage.deliverables.map((item) => (
                                    <li key={`${item.title}-${item.type}`}>
                                      {item.title} ({item.status})
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </BriefDetailSection>
                          ) : null}

                          {canManageAi && completenessStatus.releasePackageBlockReason &&
                          !completenessStatus.releasePackageFinalized ? (
                            <p className="brief-muted-note muted-text">{completenessStatus.releasePackageBlockReason}</p>
                          ) : null}

                          {canManageAi && publicationHandoffStatus ? (
                            <div className="brief-detail-divider">
                              <BriefDetailSection title="Publication handoff">
                                <p className="brief-stat-label muted-text">Draft prep only — no live publish</p>
                                <div className="brief-muted-note">
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
                                  <div className="brief-item-meta muted-text">
                                    {publicationHandoffStatus.publicationHandoff.preparedCount} prepared
                                    {publicationHandoffStatus.publicationHandoff.reusedCount > 0
                                      ? ` · ${publicationHandoffStatus.publicationHandoff.reusedCount} reused`
                                      : ""}
                                    {` · ${publicationHandoffStatus.publicationHandoff.itemCount} item${
                                      publicationHandoffStatus.publicationHandoff.itemCount === 1 ? "" : "s"
                                    }`}
                                  </div>
                                ) : null}
                                <div className="brief-action-row brief-action-row--start brief-action-row--spaced">
                                  <Button
                                    variant="secondary"
                                    disabled={actionLoading || !publicationHandoffStatus.canExecuteHandoff}
                                    onClick={() => void handleExecutePublicationHandoff()}
                                  >
                                    {publicationHandoffStatus.packageChangedSinceHandoff
                                      ? "Re-prepare WordPress drafts"
                                      : "Prepare WordPress drafts"}
                                  </Button>
                                </div>
                                {publicationHandoffNotice ? (
                                  <p
                                    className={`brief-muted-note muted-text${
                                      publicationHandoffNotice.type === "error" ? " brief-notice--error" : ""
                                    }`}
                                  >
                                    {publicationHandoffNotice.message}
                                  </p>
                                ) : null}
                                {publicationHandoffStatus.handoffBlockReason &&
                                !publicationHandoffStatus.canExecuteHandoff ? (
                                  <p className="brief-muted-note muted-text">{publicationHandoffStatus.handoffBlockReason}</p>
                                ) : null}
                              </BriefDetailSection>
                            </div>
                          ) : null}

                          {completenessStatus.missingRequirements.length > 0 ? (
                            <BriefDetailSection className="brief-detail-section--spaced" title="Missing requirements">
                              <BriefBulletList items={completenessStatus.missingRequirements.slice(0, 5)} />
                            </BriefDetailSection>
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
