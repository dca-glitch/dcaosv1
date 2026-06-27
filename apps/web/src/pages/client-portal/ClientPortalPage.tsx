import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { MetricCard, PageHeader, SectionPanel, StatusBadge } from "../../components/ui";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";

type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
};

type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type ClientPortalProjectSummary = {
  id: string;
  clientId: string;
  client: { id: string; name: string } | null;
  projectId: string | null;
  project: { id: string; name: string } | null;
  name: string;
  targetMonth: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

type ClientPortalDeliverableSummary = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  deliveryType: string;
  status: string;
  exportUrl: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

type ClientPortalProjectsResponse = {
  aiDeliveryProjects: ClientPortalProjectSummary[];
};

type ClientPortalProjectResponse = {
  aiDeliveryProject: ClientPortalProjectSummary;
};

type ClientPortalDeliverablesResponse = {
  deliverables: ClientPortalDeliverableSummary[];
};

type ClientPortalMonthlyReportSummary = {
  id: string;
  aiDeliveryProjectId: string;
  title: string | null;
  recommendationsText: string | null;
  exportUrl: string | null;
  hasDocument: boolean;
  status: "FINAL";
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ClientPortalMonthlyReportsResponse = {
  monthlyReports: ClientPortalMonthlyReportSummary[];
};

type ClientPortalMonthlyReportWorkSummary = {
  targetMonth: string;
  finalDeliverableCount: number;
  deliveredCount: number;
  acceptedCount: number;
  contentPlanItemCount: number;
  clientApprovedPlanItemCount: number;
  deliverables: Array<{
    id: string;
    title: string;
    deliveryType: string;
    status: string;
    exportUrl: string | null;
  }>;
  contentPlanItems: Array<{
    id: string;
    title: string;
    contentType: string | null;
    targetKeyword: string | null;
    approvalStatus: string | null;
  }>;
};

type ClientPortalMonthlyReportPerformanceSummary = {
  targetMonth: string;
  sourceType: string;
  gscClicks: number | null;
  gscImpressions: number | null;
  gscAverageCtr: number | null;
  gscAveragePosition: number | null;
  ga4Sessions: number | null;
  ga4Users: number | null;
  ga4PageViews: number | null;
};

type ClientPortalMonthlyReportDetailResponse = {
  monthlyReport: ClientPortalMonthlyReportSummary;
  workSummary: ClientPortalMonthlyReportWorkSummary;
  performanceSummary: ClientPortalMonthlyReportPerformanceSummary | null;
};

type ClientPortalDownloadReference = {
  downloadUrl: string;
  expiresSeconds: number;
} | null;

type ClientPortalDownloadResponse = {
  downloadReference: ClientPortalDownloadReference;
};

type ClientPortalDeliverySummary = {
  marketIntelligence: {
    title: string;
    marketSummary: string | null;
    opportunities: string[];
    recommendedActions: string[];
    status: string;
    updatedAt: string;
  } | null;
  aiSeo: {
    contentPlanStatus: string;
    approvedItemCount: number;
    totalItemCount: number;
    approvedAt: string | null;
    updatedAt: string;
    finalDeliverableCount: number;
  } | null;
  websitePublishing: {
    action: string;
    status: string;
    siteUrlHost: string | null;
    updatedAt: string;
  } | null;
  googleDocsExports: Array<{
    id: string;
    title: string;
    exportUrl: string | null;
    deliveryType: string;
    status: string;
    updatedAt: string;
  }>;
};

type ClientPortalDeliverySummaryResponse = {
  deliverySummary: ClientPortalDeliverySummary;
};

type ClientPortalCatalogProduct = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  priceLabel: string | null;
  imageUrl: string | null;
};

type ClientPortalCatalogProductsResponse = {
  catalogProducts: ClientPortalCatalogProduct[];
};

type RequestOptions = {
  method?: string;
  token?: string;
  body?: unknown;
};

function getStoredToken(): string | null {
  try {
    return window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function isApiEnvelope<T>(value: unknown): value is ApiResponse<T> {
  if (typeof value !== "object" || value === null || !("ok" in value)) {
    return false;
  }

  const envelope = value as { ok: unknown };
  return envelope.ok === true || envelope.ok === false;
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
  } catch {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Could not reach the client archive. Check your connection and try again."
      }
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      error: {
        code: "INVALID_RESPONSE",
        message: "The server returned an unreadable response."
      }
    };
  }

  if (!isApiEnvelope<T>(payload)) {
    return {
      ok: false,
      error: {
        code: "INVALID_ENVELOPE",
        message: "The server response was not in the expected format."
      }
    };
  }

  if (!response.ok && payload.ok) {
    return {
      ok: false,
      error: {
        code: "REQUEST_FAILED",
        message: "Request could not be completed."
      }
    };
  }

  return payload;
}

function getErrorMessage(response: ApiFailure): string {
  if (response.error.code === "AUTH_UNAUTHORIZED") {
    return "Please sign in again to view the client archive.";
  }

  if (response.error.code === "AUTH_FORBIDDEN") {
    return "You do not have access to this client archive.";
  }

  if (response.error.code === "CLIENT_PORTAL_PROJECT_NOT_FOUND" || response.error.code === "CLIENT_PORTAL_DELIVERABLE_NOT_FOUND") {
    return "That archive item is not available to this account.";
  }

  if (response.error.code === "CLIENT_PORTAL_MONTHLY_REPORT_NOT_FOUND") {
    return "That monthly report is not available to this account.";
  }

  return response.error.message || "Client archive could not be loaded.";
}

function formatMonthLabel(value: string | null | undefined): string {
  return value && value.trim() ? value : "Not set";
}

function formatReportDate(value: string | null | undefined): string {
  if (!value) {
    return "Not set";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

function formatDateLabel(value: string | null | undefined): string {
  if (!value) {
    return "Not set";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value.slice(0, 10) : parsed.toLocaleDateString();
}

function isFinalDeliverable(status: string) {
  return ["DELIVERED", "ACCEPTED"].includes(status);
}

function formatMetricValue(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Not set";
  }

  return value.toLocaleString();
}

function formatPercentValue(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Not set";
  }

  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
}

function projectCardStyle(selected: boolean): CSSProperties | undefined {
  return selected
    ? { borderColor: "rgba(82, 224, 255, 0.32)", background: "rgba(82, 224, 255, 0.06)" }
    : undefined;
}

export function ClientPortalPage() {
  const [projects, setProjects] = useState<ClientPortalProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<"active" | "archived" | "all">("active");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ClientPortalProjectSummary | null>(null);
  const [selectedProjectLoading, setSelectedProjectLoading] = useState(false);
  const [selectedProjectError, setSelectedProjectError] = useState<string | null>(null);
  const [deliverables, setDeliverables] = useState<ClientPortalDeliverableSummary[]>([]);
  const [deliverablesLoading, setDeliverablesLoading] = useState(false);
  const [deliverablesError, setDeliverablesError] = useState<string | null>(null);
  const [monthlyReports, setMonthlyReports] = useState<ClientPortalMonthlyReportSummary[]>([]);
  const [monthlyReportsLoading, setMonthlyReportsLoading] = useState(false);
  const [monthlyReportsError, setMonthlyReportsError] = useState<string | null>(null);
  const [monthlyReportDetail, setMonthlyReportDetail] = useState<ClientPortalMonthlyReportDetailResponse | null>(null);
  const [monthlyReportDetailLoading, setMonthlyReportDetailLoading] = useState(false);
  const [monthlyReportDetailError, setMonthlyReportDetailError] = useState<string | null>(null);
  const [deliverySummary, setDeliverySummary] = useState<ClientPortalDeliverySummary | null>(null);
  const [deliverySummaryLoading, setDeliverySummaryLoading] = useState(false);
  const [deliverySummaryError, setDeliverySummaryError] = useState<string | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<ClientPortalCatalogProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [inquiryProductId, setInquiryProductId] = useState("");
  const [inquiryContactName, setInquiryContactName] = useState("");
  const [inquiryContactEmail, setInquiryContactEmail] = useState("");
  const [inquiryContactPhone, setInquiryContactPhone] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryNotice, setInquiryNotice] = useState<string | null>(null);
  const [selectedMonthlyReportId, setSelectedMonthlyReportId] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [downloadingDeliverableId, setDownloadingDeliverableId] = useState<string | null>(null);
  const [downloadingMonthlyReportId, setDownloadingMonthlyReportId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const projectsRequestSeq = useRef(0);
  const projectRequestSeq = useRef(0);
  const monthlyReportRequestSeq = useRef(0);

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        if (projectFilter === "active") {
          return !project.isArchived;
        }

        if (projectFilter === "archived") {
          return project.isArchived;
        }

        return true;
      }),
    [projectFilter, projects]
  );

  const loadProjects = useCallback(async () => {
    const requestSeq = ++projectsRequestSeq.current;
    const token = getStoredToken();

    setProjectsLoading(true);
    setProjectsError(null);

    if (!token) {
      if (requestSeq === projectsRequestSeq.current) {
        setProjects([]);
        setSelectedProjectId(null);
        setSelectedProject(null);
        setDeliverables([]);
        setProjectsError("Sign in again to view the client archive.");
        setProjectsLoading(false);
      }
      return;
    }

    const response = await apiRequest<ClientPortalProjectsResponse>("/client-portal/projects", { token });

    if (requestSeq !== projectsRequestSeq.current) {
      return;
    }

    if (!response.ok) {
      setProjects([]);
      setSelectedProjectId(null);
      setSelectedProject(null);
      setDeliverables([]);
      setProjectsError(getErrorMessage(response));
      setProjectsLoading(false);
      return;
    }

    const nextProjects = response.data.aiDeliveryProjects ?? [];
    setProjects(nextProjects);
    setProjectsError(null);
    setProjectsLoading(false);

    setSelectedProjectId((current) => {
      if (current && nextProjects.some((project) => project.id === current)) {
        return current;
      }

      return nextProjects[0]?.id ?? null;
    });

    setRefreshTick((value) => value + 1);
  }, []);

  const loadSelectedProject = useCallback(async (projectId: string) => {
    const requestSeq = ++projectRequestSeq.current;
    const token = getStoredToken();

    setSelectedProjectLoading(true);
    setSelectedProjectError(null);
    setDeliverablesLoading(true);
    setDeliverablesError(null);
    setMonthlyReportsLoading(true);
    setMonthlyReportsError(null);
    setDeliverySummaryLoading(true);
    setDeliverySummaryError(null);
    setCatalogLoading(true);
    setCatalogError(null);
    setInquiryNotice(null);
    setDownloadNotice(null);
    setDownloadingDeliverableId(null);
    setSelectedMonthlyReportId(null);
    setSelectedProject(null);
    setDeliverables([]);
    setMonthlyReports([]);
    setDeliverySummary(null);
    setCatalogProducts([]);
    setMonthlyReportDetail(null);
    setMonthlyReportDetailError(null);

    if (!token) {
      if (requestSeq === projectRequestSeq.current) {
        const message = "Sign in again to view the client archive.";
        setSelectedProjectError(message);
        setDeliverablesError(message);
        setMonthlyReportsError(message);
        setDeliverySummaryError(message);
        setCatalogError(message);
        setSelectedProjectLoading(false);
        setDeliverablesLoading(false);
        setMonthlyReportsLoading(false);
        setDeliverySummaryLoading(false);
        setCatalogLoading(false);
      }
      return;
    }

    const [projectResponse, deliverablesResponse, monthlyReportsResponse, deliverySummaryResponse, catalogResponse] =
      await Promise.all([
      apiRequest<ClientPortalProjectResponse>(`/client-portal/projects/${projectId}`, { token }),
      apiRequest<ClientPortalDeliverablesResponse>(`/client-portal/projects/${projectId}/deliverables`, { token }),
      apiRequest<ClientPortalMonthlyReportsResponse>(`/client-portal/projects/${projectId}/monthly-reports`, { token }),
      apiRequest<ClientPortalDeliverySummaryResponse>(`/client-portal/projects/${projectId}/delivery-summary`, { token }),
      apiRequest<ClientPortalCatalogProductsResponse>(`/client-portal/projects/${projectId}/catalog-products`, { token })
    ]);

    if (requestSeq !== projectRequestSeq.current) {
      return;
    }

    if (projectResponse.ok) {
      setSelectedProject(projectResponse.data.aiDeliveryProject);
    } else {
      setSelectedProjectError(getErrorMessage(projectResponse));
    }

    if (deliverablesResponse.ok) {
      setDeliverables(deliverablesResponse.data.deliverables ?? []);
    } else {
      setDeliverablesError(getErrorMessage(deliverablesResponse));
    }

    if (monthlyReportsResponse.ok) {
      const nextMonthlyReports = monthlyReportsResponse.data.monthlyReports ?? [];
      setMonthlyReports(nextMonthlyReports);
      setSelectedMonthlyReportId((current) => {
        if (current && nextMonthlyReports.some((report) => report.id === current)) {
          return current;
        }

        return nextMonthlyReports[0]?.id ?? null;
      });
    } else {
      setMonthlyReportsError(getErrorMessage(monthlyReportsResponse));
    }

    if (deliverySummaryResponse.ok) {
      setDeliverySummary(deliverySummaryResponse.data.deliverySummary ?? null);
    } else {
      setDeliverySummaryError(getErrorMessage(deliverySummaryResponse));
    }

    if (catalogResponse.ok) {
      setCatalogProducts(catalogResponse.data.catalogProducts ?? []);
    } else {
      setCatalogError(getErrorMessage(catalogResponse));
    }

    setSelectedProjectLoading(false);
    setDeliverablesLoading(false);
    setMonthlyReportsLoading(false);
    setDeliverySummaryLoading(false);
    setCatalogLoading(false);
  }, []);

  const loadMonthlyReportDetail = useCallback(async (projectId: string, reportId: string) => {
    const requestSeq = ++monthlyReportRequestSeq.current;
    const token = getStoredToken();

    setMonthlyReportDetailLoading(true);
    setMonthlyReportDetailError(null);
    setMonthlyReportDetail(null);

    if (!token) {
      if (requestSeq === monthlyReportRequestSeq.current) {
        setMonthlyReportDetailError("Sign in again to view the monthly report.");
        setMonthlyReportDetailLoading(false);
      }
      return;
    }

    const response = await apiRequest<ClientPortalMonthlyReportDetailResponse>(
      `/client-portal/projects/${projectId}/monthly-reports/${reportId}`,
      { token }
    );

    if (requestSeq !== monthlyReportRequestSeq.current) {
      return;
    }

    if (response.ok) {
      setMonthlyReportDetail(response.data);
      setMonthlyReportDetailError(null);
    } else {
      setMonthlyReportDetailError(getErrorMessage(response));
    }

    setMonthlyReportDetailLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedProjectId || !selectedMonthlyReportId) {
      setMonthlyReportDetail(null);
      setMonthlyReportDetailError(null);
      return;
    }

    void loadMonthlyReportDetail(selectedProjectId, selectedMonthlyReportId);
  }, [loadMonthlyReportDetail, selectedMonthlyReportId, selectedProjectId]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      return;
    }

    void (async () => {
      const response = await apiRequest<{ user: { email: string; name?: string | null } }>("/auth/me", { token });
      if (!response.ok) {
        return;
      }

      const email = response.data.user.email?.trim() ?? "";
      const name = response.data.user.name?.trim() ?? "";
      if (email) {
        setInquiryContactEmail((current) => current || email);
      }
      if (name) {
        setInquiryContactName((current) => current || name);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }

    const stillVisible = filteredProjects.some((project) => project.id === selectedProjectId);
    if (!stillVisible) {
      setSelectedProjectId(filteredProjects[0]?.id ?? null);
    }
  }, [filteredProjects, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProject(null);
      setDeliverables([]);
      setMonthlyReports([]);
      setDeliverySummary(null);
      setSelectedProjectError(null);
      setDeliverablesError(null);
      setMonthlyReportsError(null);
      setDeliverySummaryError(null);
      setSelectedMonthlyReportId(null);
      setSelectedProjectLoading(false);
      setDeliverablesLoading(false);
      setMonthlyReportsLoading(false);
      setDeliverySummaryLoading(false);
      return;
    }

    void loadSelectedProject(selectedProjectId);
  }, [selectedProjectId, loadSelectedProject, refreshTick]);

  const handleRefresh = useCallback(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleSelectProject = useCallback((projectId: string) => {
    setDownloadNotice(null);
    setDownloadingDeliverableId(null);
    setSelectedProjectError(null);
    setDeliverablesError(null);
    setMonthlyReportsError(null);
    setDeliverySummaryError(null);
    setSelectedProject(null);
    setDeliverables([]);
    setMonthlyReports([]);
    setDeliverySummary(null);
    setSelectedProjectId(projectId);
  }, []);

  const handleDownload = useCallback(async (deliverableId: string) => {
    if (!selectedProjectId || downloadingDeliverableId === deliverableId) {
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setDownloadNotice("Sign in again to download a deliverable.");
      return;
    }

    setDownloadNotice(null);
    setDownloadingDeliverableId(deliverableId);

    const response = await apiRequest<ClientPortalDownloadResponse>(
      `/client-portal/projects/${selectedProjectId}/deliverables/${deliverableId}/download`,
      { token }
    );

    setDownloadingDeliverableId(null);

    if (!response.ok) {
      setDownloadNotice(getErrorMessage(response));
      return;
    }

    const downloadUrl = response.data.downloadReference?.downloadUrl ?? null;
    if (!downloadUrl) {
      setDownloadNotice("Download not available yet.");
      return;
    }

    const opened = window.open(downloadUrl, "_blank", "noopener,noreferrer");
    if (!opened) {
      setDownloadNotice("Your browser blocked the download window. Allow pop-ups and try again.");
    }
  }, [downloadingDeliverableId, selectedProjectId]);

  const handleMonthlyReportDownload = useCallback(async (reportId: string) => {
    if (!selectedProjectId || downloadingMonthlyReportId === reportId) {
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setDownloadNotice("Sign in again to download a report.");
      return;
    }

    setDownloadNotice(null);
    setDownloadingMonthlyReportId(reportId);

    const response = await apiRequest<ClientPortalDownloadResponse>(
      `/client-portal/projects/${selectedProjectId}/monthly-reports/${reportId}/download`,
      { token }
    );

    setDownloadingMonthlyReportId(null);

    if (!response.ok) {
      setDownloadNotice(getErrorMessage(response));
      return;
    }

    const downloadUrl = response.data.downloadReference?.downloadUrl ?? null;
    if (!downloadUrl) {
      setDownloadNotice("Report document not available.");
      return;
    }

    const opened = window.open(downloadUrl, "_blank", "noopener,noreferrer");
    if (!opened) {
      setDownloadNotice("Your browser blocked the download window. Allow pop-ups and try again.");
    }
  }, [downloadingMonthlyReportId, selectedProjectId]);

  const handleSubmitCatalogInquiry = useCallback(async () => {
    if (!selectedProjectId || inquirySubmitting) {
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setInquiryNotice("Sign in again to submit a product inquiry.");
      return;
    }

    const contactName = inquiryContactName.trim();
    const contactEmail = inquiryContactEmail.trim();
    const message = inquiryMessage.trim();
    if (!contactName || !contactEmail || !message) {
      setInquiryNotice("Name, email, and message are required.");
      return;
    }

    setInquirySubmitting(true);
    setInquiryNotice(null);

    const response = await apiRequest<{ catalogInquiry: { id: string } }>(
      `/client-portal/projects/${selectedProjectId}/catalog-inquiries`,
      {
        token,
        method: "POST",
        body: {
          productId: inquiryProductId || null,
          contactName,
          contactEmail,
          contactPhone: inquiryContactPhone.trim() || null,
          message
        }
      }
    );

    setInquirySubmitting(false);

    if (!response.ok) {
      setInquiryNotice(getErrorMessage(response));
      return;
    }

    setInquiryMessage("");
    setInquiryNotice("Inquiry submitted. Your team will follow up directly — no checkout or payment in this portal.");
  }, [
    inquiryContactEmail,
    inquiryContactName,
    inquiryContactPhone,
    inquiryMessage,
    inquiryProductId,
    inquirySubmitting,
    selectedProjectId
  ]);

  const projectCount = projects.length;
  const finalDeliverableCount = deliverables.filter((deliverable) => isFinalDeliverable(deliverable.status)).length;
  const selectedProjectArchiveState = selectedProject ? (selectedProject.isArchived ? "Archived" : "Active") : "None";
  const selectedMonthlyReport = monthlyReports.find((report) => report.id === selectedMonthlyReportId) ?? null;
  const selectedMonthlyReportIndex = selectedMonthlyReport
    ? monthlyReports.findIndex((report) => report.id === selectedMonthlyReport.id)
    : -1;

  const clientName = selectedProject?.client?.name ?? projects[0]?.client?.name ?? "Client archive";

  if (projectsLoading) {
    return <LoadingState label="Loading client archive" />;
  }

  if (projectsError && projects.length === 0) {
    return (
      <section className="view-section" aria-labelledby="client-portal-title">
        <PageHeader
          description="Read-only archive of approved deliverables and finalized monthly reports."
          eyebrow="Client workspace"
          title="Client Portal"
          titleId="client-portal-title"
        />
        <ErrorState message={projectsError} title="Archive unavailable" />
        <div style={{ marginTop: "12px" }}>
          <button className="secondary-action" onClick={handleRefresh} type="button">
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="view-section" aria-labelledby="client-portal-title">
      <PageHeader
        actions={
          <button className="secondary-action" disabled={projectsLoading} onClick={handleRefresh} type="button">
            Refresh
          </button>
        }
        description="Client-safe delivery visibility for Puriva MVP: market summary, SEO status, Google Docs, publishing handoff, deliverables, and monthly reports. Internal AI workflow data stays hidden."
        eyebrow="Client workspace"
        title="Client Portal"
        titleId="client-portal-title"
      />

      <div className="summary-grid metric-grid">
        <MetricCard accent="cyan" helper="Linked delivery projects" label="Projects" value={String(projectCount)} />
        <MetricCard accent="violet" helper="Current selection" label="Selected project" value={selectedProject?.name ?? "None"} />
        <MetricCard accent="purple" helper="DELIVERED / ACCEPTED only" label="Final deliverables" value={deliverablesLoading ? "..." : String(finalDeliverableCount)} />
        <MetricCard accent="warning" helper="Archive state" label="Status" value={selectedProjectArchiveState} />
      </div>

      {projectsError ? (
        <div className="state-panel state-panel-error" role="alert">
          <p>{projectsError}</p>
        </div>
      ) : null}

      <div style={{ alignItems: "start", display: "grid", gap: "14px", gridTemplateColumns: "minmax(240px, 280px) minmax(0, 1fr)" }}>
        <aside className="entity-card">
          <div className="entity-card-header">
            <div>
              <p className="eyebrow">Archive</p>
              <h2>Projects</h2>
            </div>
          </div>

          <div className="filter-bar" role="group" aria-label="Project filter">
            {(["active", "archived", "all"] as const).map((value) => (
              <button
                aria-pressed={projectFilter === value}
                className={projectFilter === value ? "secondary-action filter-chip is-active" : "secondary-action filter-chip"}
                key={value}
                onClick={() => setProjectFilter(value)}
                type="button"
              >
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>

          {filteredProjects.length === 0 ? (
            <EmptyState
              message="No projects match this filter. Sparse archives show metrics with zero deliverables; populated archives list final items when admin shares them."
              title="No projects"
            />
          ) : (
            <div className="dense-list">
              {filteredProjects.map((project) => (
                <article
                  className="entity-card dense-record"
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelectProject(project.id);
                    }
                  }}
                  role="button"
                  style={projectCardStyle(selectedProjectId === project.id)}
                  tabIndex={0}
                >
                  <div className="dense-record-main" style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}>
                    <div className="dense-title">
                      <div className="dense-kicker">
                        <StatusBadge status={project.isArchived ? "ARCHIVED" : "ACTIVE"} />
                      </div>
                      <h3>{project.name}</h3>
                      <div className="dense-meta">
                        <span>{project.client?.name ?? clientName}</span>
                        <span>{formatMonthLabel(project.targetMonth)}</span>
                      </div>
                    </div>
                    <div className="dense-actions">
                      <button
                        className={selectedProjectId === project.id ? "primary-action" : "secondary-action"}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleSelectProject(project.id);
                        }}
                        type="button"
                      >
                        {selectedProjectId === project.id ? "Open" : "View"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>

        <div style={{ display: "grid", gap: "14px" }}>
          {!selectedProjectId ? (
            <SectionPanel
              description="Choose a project from the list to view deliverables and monthly reports."
              title="Project details"
              tone="compact"
            >
              <EmptyState message="Select a project on the left to open its archive." title="No project selected" />
            </SectionPanel>
          ) : selectedProjectLoading ? (
            <LoadingState label="Loading project archive" />
          ) : selectedProjectError ? (
            <ErrorState message={selectedProjectError} title="Project unavailable" />
          ) : selectedProject ? (
            <>
              <SectionPanel
                description="Summary for the selected delivery project."
                title="Project details"
                tone="compact"
              >
                <article className="entity-card dense-record">
                  <div className="dense-record-main">
                    <div className="dense-title">
                      <div className="dense-kicker">
                        <StatusBadge status={selectedProject.isArchived ? "ARCHIVED" : "ACTIVE"} />
                      </div>
                      <h3>{selectedProject.name}</h3>
                      <div className="dense-meta">
                        <span>{selectedProject.client?.name ?? "Not set"}</span>
                        <span>{formatMonthLabel(selectedProject.targetMonth)}</span>
                        <span>{selectedProject.project?.name ?? "No linked project"}</span>
                      </div>
                    </div>
                    <div className="dense-fields">
                      <div className="dense-field">
                        <span>Created</span>
                        <strong>{formatDateLabel(selectedProject.createdAt)}</strong>
                      </div>
                      <div className="dense-field">
                        <span>Updated</span>
                        <strong>{formatDateLabel(selectedProject.updatedAt)}</strong>
                      </div>
                      <div className="dense-field">
                        <span>Archive</span>
                        <strong>{selectedProject.isArchived ? "Archived" : "Active"}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="dense-row-note">
                    Only approved or final archive items are shown here. Internal workflow runs, prompts, and admin notes stay hidden.
                  </div>
                </article>
              </SectionPanel>

              <SectionPanel
                description="Client-safe delivery status for this project month. Raw research, prompts, and admin notes stay hidden."
                title="Delivery overview"
                tone="compact"
              >
                {deliverySummaryLoading ? (
                  <LoadingState label="Loading delivery overview" />
                ) : deliverySummaryError ? (
                  <ErrorState message={deliverySummaryError} title="Delivery overview unavailable" />
                ) : deliverySummary ? (
                  <div style={{ display: "grid", gap: "12px" }}>
                    <article className="entity-card dense-record">
                      <div className="dense-record-main">
                        <div className="dense-title">
                          <div className="dense-kicker">
                            <StatusBadge status={deliverySummary.aiSeo?.contentPlanStatus ?? "DRAFT"} />
                          </div>
                          <h3>AI SEO / content plan</h3>
                          <div className="dense-meta">
                            <span>
                              {deliverySummary.aiSeo
                                ? `${deliverySummary.aiSeo.approvedItemCount} of ${deliverySummary.aiSeo.totalItemCount} plan items approved`
                                : "No content plan yet"}
                            </span>
                            <span>
                              {deliverySummary.aiSeo?.finalDeliverableCount ?? 0} final deliverable
                              {(deliverySummary.aiSeo?.finalDeliverableCount ?? 0) === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>

                    <article className="entity-card dense-record">
                      <div className="dense-record-main">
                        <div className="dense-title">
                          <div className="dense-kicker">
                            <StatusBadge status={deliverySummary.marketIntelligence?.status ?? "NONE"} />
                          </div>
                          <h3>Market Intelligence summary</h3>
                          {deliverySummary.marketIntelligence?.marketSummary ? (
                            <div className="dense-row-note">{deliverySummary.marketIntelligence.marketSummary}</div>
                          ) : (
                            <div className="dense-row-note muted-text">No client-safe market summary is available yet.</div>
                          )}
                          {deliverySummary.marketIntelligence?.recommendedActions.length ? (
                            <div className="dense-row-note">
                              <strong>Recommended actions: </strong>
                              {deliverySummary.marketIntelligence.recommendedActions.join(" · ")}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>

                    <article className="entity-card dense-record">
                      <div className="dense-record-main">
                        <div className="dense-title">
                          <div className="dense-kicker">
                            <StatusBadge status={deliverySummary.websitePublishing?.status ?? "NONE"} />
                          </div>
                          <h3>Website publishing handoff</h3>
                          <div className="dense-meta">
                            <span>{deliverySummary.websitePublishing?.action ?? "No publishing activity yet"}</span>
                            {deliverySummary.websitePublishing?.siteUrlHost ? (
                              <span>{deliverySummary.websitePublishing.siteUrlHost}</span>
                            ) : null}
                          </div>
                          {!deliverySummary.websitePublishing ? (
                            <div className="dense-row-note muted-text">
                              Publishing status appears here after admin prepares or publishes content.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>

                    <article className="entity-card dense-record">
                      <div className="dense-record-main">
                        <div className="dense-title">
                          <h3>Google Docs exports</h3>
                          {deliverySummary.googleDocsExports.length === 0 ? (
                            <div className="dense-row-note muted-text">No client-safe export links are available yet.</div>
                          ) : (
                            <div className="dense-list">
                              {deliverySummary.googleDocsExports.map((item) => (
                                <div className="dense-meta" key={item.id}>
                                  <span>{item.title}</span>
                                  {item.exportUrl ? (
                                    <a href={item.exportUrl} rel="noreferrer" target="_blank">
                                      Open Google Doc
                                    </a>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  </div>
                ) : (
                  <EmptyState message="Delivery overview is not available for this project yet." title="No delivery overview" />
                )}
              </SectionPanel>

              <SectionPanel
                description="Inquiry-only product catalog for this client. No cart, checkout, or payment in the portal."
                title="Product catalog inquiry"
                tone="compact"
              >
                {catalogLoading ? (
                  <LoadingState label="Loading product catalog" />
                ) : catalogError ? (
                  <ErrorState message={catalogError} title="Product catalog unavailable" />
                ) : catalogProducts.length === 0 ? (
                  <EmptyState
                    message="Your team can add skincare or service products in the Client Hub. Visible products appear here for inquiry."
                    title="No catalog products yet"
                  />
                ) : (
                  <div style={{ display: "grid", gap: "12px" }}>
                    <div className="dense-list">
                      {catalogProducts.map((product) => (
                        <article className="entity-card dense-record" key={product.id}>
                          <div className="dense-record-main">
                            <div className="dense-title">
                              <h3>{product.name}</h3>
                              <div className="dense-meta">
                                {product.priceLabel ? <span>{product.priceLabel}</span> : null}
                                {product.sku ? <span>SKU {product.sku}</span> : null}
                              </div>
                              {product.description ? (
                                <div className="dense-row-note">{product.description}</div>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>

                    <form
                      className="entity-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleSubmitCatalogInquiry();
                      }}
                    >
                      <div className="field-grid">
                        <label>
                          Product (optional)
                          <select value={inquiryProductId} onChange={(event) => setInquiryProductId(event.target.value)}>
                            <option value="">General inquiry</option>
                            {catalogProducts.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Your name
                          <input
                            required
                            value={inquiryContactName}
                            onChange={(event) => setInquiryContactName(event.target.value)}
                          />
                        </label>
                        <label>
                          Email
                          <input
                            required
                            type="email"
                            value={inquiryContactEmail}
                            onChange={(event) => setInquiryContactEmail(event.target.value)}
                          />
                        </label>
                        <label>
                          Phone (optional)
                          <input value={inquiryContactPhone} onChange={(event) => setInquiryContactPhone(event.target.value)} />
                        </label>
                        <label className="field-span-2">
                          Message
                          <textarea
                            required
                            rows={4}
                            value={inquiryMessage}
                            onChange={(event) => setInquiryMessage(event.target.value)}
                          />
                        </label>
                      </div>
                      {inquiryNotice ? <p className="muted-text">{inquiryNotice}</p> : null}
                      <div className="modal-footer">
                        <button className="primary-action" disabled={inquirySubmitting} type="submit">
                          {inquirySubmitting ? "Submitting" : "Send product inquiry"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </SectionPanel>

              <SectionPanel
                description="DELIVERED and ACCEPTED deliverables only."
                title="Final deliverables"
                tone="compact"
              >
                {downloadNotice ? (
                  <div className="state-panel" role="status">
                    <p>{downloadNotice}</p>
                  </div>
                ) : null}

                {deliverablesLoading ? (
                  <LoadingState label="Loading deliverables" />
                ) : deliverablesError ? (
                  <ErrorState message={deliverablesError} title="Deliverables unavailable" />
                ) : deliverables.length === 0 ? (
                  <EmptyState
                    message="Final deliverables appear here once they are marked DELIVERED or ACCEPTED."
                    title="No final deliverables yet"
                  />
                ) : (
                  <div className="dense-list">
                    {deliverables.map((deliverable) => (
                      <article className="entity-card dense-record" key={deliverable.id}>
                        <div className="dense-record-main">
                          <div className="dense-title">
                            <div className="dense-kicker">
                              <StatusBadge status={deliverable.status} />
                              <span className="entity-pill">{deliverable.deliveryType}</span>
                            </div>
                            <h3>{deliverable.title}</h3>
                            <div className="dense-meta">
                              <span>Updated {formatDateLabel(deliverable.updatedAt)}</span>
                              {deliverable.exportUrl ? (
                                <span>
                                  <a href={deliverable.exportUrl} rel="noreferrer" target="_blank">
                                    Export link
                                  </a>
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="dense-fields">
                            <div className="dense-field">
                              <span>Type</span>
                              <strong>{deliverable.deliveryType}</strong>
                            </div>
                            <div className="dense-field">
                              <span>Status</span>
                              <strong>{deliverable.status}</strong>
                            </div>
                          </div>
                          <div className="dense-actions">
                            <button
                              className="primary-action"
                              disabled={downloadingDeliverableId === deliverable.id}
                              onClick={() => void handleDownload(deliverable.id)}
                              type="button"
                            >
                              {downloadingDeliverableId === deliverable.id ? "Opening..." : "Download"}
                            </button>
                          </div>
                        </div>
                        {deliverable.description ? (
                          <div className="dense-row-note">{deliverable.description}</div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </SectionPanel>

              <SectionPanel
                description="FINAL monthly reports only. Read-only summary of completed work, approved performance metrics, and next-step recommendations."
                title="Monthly report — final client view"
                tone="compact"
              >
                {monthlyReportsLoading ? (
                  <LoadingState label="Loading monthly reports" />
                ) : monthlyReportsError ? (
                  <ErrorState message={monthlyReportsError} title="Monthly reports unavailable" />
                ) : monthlyReports.length === 0 ? (
                  <EmptyState
                    message="Finalized monthly reports appear here once the admin marks them FINAL."
                    title="No finalized reports yet"
                  />
                ) : (
                  <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "minmax(200px, 240px) minmax(0, 1fr)" }}>
                    <div className="dense-list">
                      {monthlyReports.map((report, index) => (
                        <button
                          className={selectedMonthlyReportId === report.id ? "primary-action" : "secondary-action"}
                          key={report.id}
                          onClick={() => setSelectedMonthlyReportId(report.id)}
                          style={{ justifyContent: "space-between", textAlign: "left", width: "100%" }}
                          type="button"
                        >
                          <span>
                            {report.title ?? `Report ${index + 1}`}
                            <br />
                            <span className="muted-text">{formatReportDate(report.finalizedAt)}</span>
                          </span>
                          <StatusBadge status={report.status} />
                        </button>
                      ))}
                    </div>

                    {selectedMonthlyReport ? (
                      monthlyReportDetailLoading ? (
                        <LoadingState label="Loading final monthly report" />
                      ) : monthlyReportDetailError ? (
                        <ErrorState message={monthlyReportDetailError} title="Monthly report unavailable" />
                      ) : monthlyReportDetail ? (
                        <div style={{ display: "grid", gap: "14px" }}>
                          <article className="entity-card dense-record">
                            <div className="dense-record-main" style={{ alignItems: "start", gridTemplateColumns: "minmax(0, 1fr)" }}>
                              <div className="dense-title">
                                <div className="dense-kicker">
                                  <StatusBadge status={monthlyReportDetail.monthlyReport.status} />
                                  {selectedMonthlyReportIndex >= 0 ? (
                                    <span className="muted-text">
                                      Report {selectedMonthlyReportIndex + 1} of {monthlyReports.length}
                                    </span>
                                  ) : null}
                                </div>
                                <h3>{monthlyReportDetail.monthlyReport.title ?? "Monthly report"}</h3>
                                <div className="dense-meta">
                                  <span>Month {formatMonthLabel(monthlyReportDetail.workSummary.targetMonth)}</span>
                                  <span>Finalized {formatReportDate(monthlyReportDetail.monthlyReport.finalizedAt)}</span>
                                </div>
                              </div>
                              <div className="dense-actions">
                                {monthlyReportDetail.monthlyReport.hasDocument ? (
                                  <button
                                    className="primary-action"
                                    disabled={downloadingMonthlyReportId === monthlyReportDetail.monthlyReport.id}
                                    onClick={() => void handleMonthlyReportDownload(monthlyReportDetail.monthlyReport.id)}
                                    type="button"
                                  >
                                    {downloadingMonthlyReportId === monthlyReportDetail.monthlyReport.id ? "Opening..." : "Download PDF"}
                                  </button>
                                ) : null}
                                {monthlyReportDetail.monthlyReport.exportUrl ? (
                                  <a
                                    className="secondary-action"
                                    href={monthlyReportDetail.monthlyReport.exportUrl}
                                    rel="noreferrer"
                                    target="_blank"
                                  >
                                    Open export
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          </article>

                          <div className="metric-grid">
                            <MetricCard
                              label="Final deliverables"
                              value={String(monthlyReportDetail.workSummary.finalDeliverableCount)}
                              helper={`${monthlyReportDetail.workSummary.acceptedCount} accepted · ${monthlyReportDetail.workSummary.deliveredCount} delivered`}
                            />
                            <MetricCard
                              label="Content plan items"
                              value={String(monthlyReportDetail.workSummary.contentPlanItemCount)}
                              helper={`${monthlyReportDetail.workSummary.clientApprovedPlanItemCount} client-approved`}
                            />
                            <MetricCard
                              label="Report document"
                              value={monthlyReportDetail.monthlyReport.hasDocument ? "PDF ready" : "Not attached"}
                              helper="Download when available"
                            />
                          </div>

                          {monthlyReportDetail.performanceSummary ? (
                            <SectionPanel
                              description="Approved performance snapshot for this report month. Internal admin notes and raw provider data stay hidden."
                              title="Performance summary"
                              tone="compact"
                            >
                              <div className="metric-grid">
                                <MetricCard
                                  label="GSC clicks"
                                  value={formatMetricValue(monthlyReportDetail.performanceSummary.gscClicks)}
                                  helper={`Month ${monthlyReportDetail.performanceSummary.targetMonth}`}
                                />
                                <MetricCard
                                  label="GSC impressions"
                                  value={formatMetricValue(monthlyReportDetail.performanceSummary.gscImpressions)}
                                  helper={monthlyReportDetail.performanceSummary.sourceType}
                                />
                                <MetricCard
                                  label="GA4 sessions"
                                  value={formatMetricValue(monthlyReportDetail.performanceSummary.ga4Sessions)}
                                  helper={`Users ${formatMetricValue(monthlyReportDetail.performanceSummary.ga4Users)}`}
                                />
                                <MetricCard
                                  label="GA4 page views"
                                  value={formatMetricValue(monthlyReportDetail.performanceSummary.ga4PageViews)}
                                  helper={`CTR ${formatPercentValue(monthlyReportDetail.performanceSummary.gscAverageCtr)}`}
                                />
                              </div>
                            </SectionPanel>
                          ) : null}

                          {monthlyReportDetail.workSummary.deliverables.length > 0 ? (
                            <SectionPanel
                              description="Final deliverables included in this month's completed work."
                              title="Completed deliverables"
                              tone="compact"
                            >
                              <div className="dense-list">
                                {monthlyReportDetail.workSummary.deliverables.map((deliverable) => (
                                  <article className="entity-card dense-record" key={deliverable.id}>
                                    <div className="dense-record-main">
                                      <div className="dense-title">
                                        <div className="dense-kicker">
                                          <StatusBadge status={deliverable.status} />
                                          <span className="entity-pill">{deliverable.deliveryType}</span>
                                        </div>
                                        <h3>{deliverable.title}</h3>
                                      </div>
                                      {deliverable.exportUrl ? (
                                        <a href={deliverable.exportUrl} rel="noreferrer" target="_blank">
                                          Open export
                                        </a>
                                      ) : null}
                                    </div>
                                  </article>
                                ))}
                              </div>
                            </SectionPanel>
                          ) : null}

                          <SectionPanel
                            description="Admin-written recommendations for the next month."
                            title="Recommendations for next month"
                            tone="compact"
                          >
                            {monthlyReportDetail.monthlyReport.recommendationsText ? (
                              <div className="dense-row-note">{monthlyReportDetail.monthlyReport.recommendationsText}</div>
                            ) : (
                              <EmptyState message="No recommendations were added to this final report." title="No recommendations yet" />
                            )}
                          </SectionPanel>
                        </div>
                      ) : (
                        <EmptyState message="Select a report from the list to open the final client view." title="No report selected" />
                      )
                    ) : (
                      <EmptyState message="Select a report from the list to view details." title="No report selected" />
                    )}
                  </div>
                )}
              </SectionPanel>
            </>
          ) : null}
        </div>
      </div>

      <SectionPanel
        description="Advanced portal features remain phased after MVP visibility and review scope."
        title="Advanced portal features (phased)"
        tone="compact"
      >
        <ul className="muted-text" style={{ margin: 0, paddingLeft: "1.25rem" }}>
          <li>Public magic links</li>
          <li>Full interactive comment threads</li>
        </ul>
      </SectionPanel>
    </section>
  );
}
