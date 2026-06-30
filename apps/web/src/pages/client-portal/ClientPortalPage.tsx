import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Button, MetricCard, PageHeader, SectionPanel, StatusBadge } from "../../components/ui";
import { clientPortalApiRequest, navigateToClientPortalHash, type PendingApprovalsResponse } from "./client-portal-api";

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

function toClientPortalStatusLabel(status: string | null | undefined): string | null {
  if (!status || !status.trim()) {
    return null;
  }

  const normalized = status.trim().toUpperCase();
  if (["DRAFT", "NONE", "PENDING", "NOT_STARTED", "IN_PROGRESS"].includes(normalized)) {
    return null;
  }

  if (normalized === "ADMIN_REVIEW") {
    return "Under review";
  }

  if (normalized === "FINAL") {
    return "Complete";
  }

  if (normalized === "DELIVERED") {
    return "Delivered";
  }

  if (normalized === "ACCEPTED") {
    return "Accepted";
  }

  if (normalized === "ACTIVE") {
    return "Active";
  }

  if (normalized === "ARCHIVED") {
    return "Archived";
  }

  if (normalized === "APPROVED") {
    return "Approved";
  }

  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/(^|\s)\S/g, (segment) => segment.toUpperCase());
}

function toClientPortalDeliveryTypeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/(^|\s)\S/g, (segment) => segment.toUpperCase());
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

function ClientPortalStatusBadge({ status }: { status: string | null | undefined }) {
  const label = toClientPortalStatusLabel(status);
  if (!label) {
    return null;
  }

  return <StatusBadge status={label} />;
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
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
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

  const loadPendingApprovalCount = useCallback(async () => {
    const response = await clientPortalApiRequest<PendingApprovalsResponse>("/pending-approvals");
    if (response.ok) {
      setPendingApprovalCount(response.data.count);
    }
  }, []);

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
    void loadPendingApprovalCount();
  }, [loadPendingApprovalCount]);

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
    void loadPendingApprovalCount();
  }, [loadProjects, loadPendingApprovalCount]);

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
          description="Final deliverables and monthly reports shared with your account."
          eyebrow="Client workspace"
          title="Your archive"
          titleId="client-portal-title"
        />
        <ErrorState message={projectsError} title="Archive unavailable" />
        <div className="portal-action-row">
          <Button variant="secondary" onClick={handleRefresh} type="button">
            Try again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="view-section" aria-labelledby="client-portal-title">
      <PageHeader
        actions={
          <Button variant="tertiary" disabled={projectsLoading} onClick={handleRefresh} type="button">
            Refresh
          </Button>
        }
        description="Final deliverables and monthly reports shared with your account."
        eyebrow="Client workspace"
        title="Your archive"
        titleId="client-portal-title"
      />

      <nav aria-label="Client portal sections" className="portal-subnav">
        <button className="portal-subnav-link is-active" type="button">
          Archive
        </button>
        <button
          className="portal-subnav-link"
          onClick={() => navigateToClientPortalHash("client-portal/pending-approvals")}
          type="button"
        >
          Pending Approvals
          {pendingApprovalCount > 0 ? <span className="nav-count-badge">{pendingApprovalCount}</span> : null}
        </button>
        <button
          className="portal-subnav-link"
          onClick={() => navigateToClientPortalHash("client-portal/briefs")}
          type="button"
        >
          Briefs
        </button>
      </nav>

      <div className="summary-grid metric-grid portal-metric-grid">
        <MetricCard helper="Active delivery projects" label="Projects" value={String(projectCount)} />
        <MetricCard
          helper="Completed items only"
          label="Deliverables"
          value={deliverablesLoading ? "…" : String(finalDeliverableCount)}
        />
      </div>

      {projectsError ? (
        <div className="portal-inline-notice portal-inline-notice-error" role="alert">
          <p>{projectsError}</p>
        </div>
      ) : null}

      <div className="portal-split-layout">
        <aside className="entity-card portal-project-sidebar">
          <div className="entity-card-header">
            <div>
              <p className="eyebrow">Archive</p>
              <h2>Shared documents</h2>
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
            <p className="inline-empty muted-text">No projects match this filter. When your team shares material, it will appear here.</p>
          ) : (
            <div className="dense-list portal-project-list">
              {filteredProjects.map((project) => (
                <article
                  className={`entity-card dense-record portal-record${selectedProjectId === project.id ? " portal-record-selected" : ""}`}
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelectProject(project.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="dense-record-main portal-record-main">
                    <div className="dense-title">
                      <div className="dense-kicker">
                        <ClientPortalStatusBadge status={project.isArchived ? "ARCHIVED" : "ACTIVE"} />
                      </div>
                      <h3>{project.name}</h3>
                      <div className="dense-meta">
                        <span>{project.client?.name ?? clientName}</span>
                        <span>{formatMonthLabel(project.targetMonth)}</span>
                      </div>
                    </div>
                    <div className="dense-actions">
                      <button
                        className={`secondary-action${selectedProjectId === project.id ? " filter-chip is-active" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleSelectProject(project.id);
                        }}
                        type="button"
                      >
                        {selectedProjectId === project.id ? "Selected" : "View"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>

        <div className="portal-detail-column">
          {!selectedProjectId ? (
            <SectionPanel
              description="Choose a project to view deliverables and monthly reports."
              title="Project overview"
              tone="compact"
            >
              <EmptyState message="Select a project on the left to open its archive." title="No project selected" variant="inline" />
            </SectionPanel>
          ) : selectedProjectLoading ? (
            <LoadingState label="Loading project archive" />
          ) : selectedProjectError ? (
            <ErrorState message={selectedProjectError} title="Project unavailable" />
          ) : selectedProject ? (
            <>
              <SectionPanel
                description="Overview for the selected project."
                title="Project overview"
                tone="compact"
              >
                <article className="entity-card dense-record">
                  <div className="dense-record-main">
                    <div className="dense-title">
                      <div className="dense-kicker">
                        <ClientPortalStatusBadge status={selectedProject.isArchived ? "ARCHIVED" : "ACTIVE"} />
                      </div>
                      <h3>{selectedProject.name}</h3>
                      <div className="dense-meta">
                        <span>{selectedProject.client?.name ?? "Your account"}</span>
                        <span>{formatMonthLabel(selectedProject.targetMonth)}</span>
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
                    Only finalized items shared with your account appear here.
                  </div>
                </article>
              </SectionPanel>

              <SectionPanel
                description="Summary of completed work for this project."
                title="Delivery summary"
                tone="compact"
              >
                {deliverySummaryLoading ? (
                  <LoadingState label="Loading delivery summary" />
                ) : deliverySummaryError ? (
                  <ErrorState message={deliverySummaryError} title="Delivery summary unavailable" />
                ) : deliverySummary ? (
                  <div className="portal-detail-stack">
                    <article className="entity-card dense-record">
                      <div className="dense-record-main">
                        <div className="dense-title">
                          <div className="dense-kicker">
                            <ClientPortalStatusBadge status={deliverySummary.aiSeo?.contentPlanStatus} />
                          </div>
                          <h3>Planned content</h3>
                          <div className="dense-meta">
                            <span>
                              {deliverySummary.aiSeo
                                ? `${deliverySummary.aiSeo.approvedItemCount} of ${deliverySummary.aiSeo.totalItemCount} items complete`
                                : "No planned content yet"}
                            </span>
                            <span>
                              {deliverySummary.aiSeo?.finalDeliverableCount ?? 0} deliverable
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
                            <ClientPortalStatusBadge status={deliverySummary.marketIntelligence?.status} />
                          </div>
                          <h3>Market summary</h3>
                          {deliverySummary.marketIntelligence?.marketSummary ? (
                            <div className="dense-row-note">{deliverySummary.marketIntelligence.marketSummary}</div>
                          ) : (
                            <div className="dense-row-note muted-text">No market summary is available yet.</div>
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
                            <ClientPortalStatusBadge status={deliverySummary.websitePublishing?.status} />
                          </div>
                          <h3>Website updates</h3>
                          <div className="dense-meta">
                            <span>{deliverySummary.websitePublishing?.action ?? "No publishing activity yet"}</span>
                            {deliverySummary.websitePublishing?.siteUrlHost ? (
                              <span>{deliverySummary.websitePublishing.siteUrlHost}</span>
                            ) : null}
                          </div>
                          {!deliverySummary.websitePublishing ? (
                            <div className="dense-row-note muted-text">
                              Website status appears here when your team shares an update.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>

                    <article className="entity-card dense-record">
                      <div className="dense-record-main">
                        <div className="dense-title">
                          <h3>Shared documents</h3>
                          {deliverySummary.googleDocsExports.length === 0 ? (
                            <div className="dense-row-note muted-text">No shared document links are available yet.</div>
                          ) : (
                            <div className="dense-list">
                              {deliverySummary.googleDocsExports.map((item) => (
                                <div className="dense-meta" key={item.id}>
                                  <span>{item.title}</span>
                                  {item.exportUrl ? (
                                    <a href={item.exportUrl} rel="noreferrer" target="_blank">
                                      Open document
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
                  <EmptyState message="Delivery summary is not available for this project yet." title="No delivery summary" variant="inline" />
                )}
              </SectionPanel>

              <SectionPanel
                description="Browse products and send an inquiry. No checkout or payment in this workspace."
                title="Product inquiries"
                tone="compact"
              >
                {catalogLoading ? (
                  <LoadingState label="Loading product catalog" />
                ) : catalogError ? (
                  <ErrorState message={catalogError} title="Product catalog unavailable" />
                ) : catalogProducts.length === 0 ? (
                  <EmptyState
                    message="When products are added to your account, they will appear here for inquiry."
                    title="No products yet"
                    variant="inline"
                  />
                ) : (
                  <div className="portal-detail-stack">
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
                      {inquiryNotice ? <p className="portal-inline-notice-text muted-text">{inquiryNotice}</p> : null}
                      <div className="modal-footer">
                        <Button variant="primary" disabled={inquirySubmitting} type="submit">
                          {inquirySubmitting ? "Submitting" : "Send inquiry"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </SectionPanel>

              <SectionPanel
                description="Completed items only. Download when a link is available."
                title="Deliverables"
                tone="compact"
              >
                {downloadNotice ? (
                  <div className="portal-inline-notice" role="status">
                    <p>{downloadNotice}</p>
                  </div>
                ) : null}

                {deliverablesLoading ? (
                  <LoadingState label="Loading deliverables" />
                ) : deliverablesError ? (
                  <ErrorState message={deliverablesError} title="Deliverables unavailable" />
                ) : deliverables.length === 0 ? (
                  <EmptyState
                    message="Completed deliverables appear here once your team shares them to this archive."
                    title="No deliverables yet"
                    variant="inline"
                  />
                ) : (
                  <div className="dense-list">
                    {deliverables.map((deliverable) => (
                      <article className="entity-card dense-record" key={deliverable.id}>
                        <div className="dense-record-main">
                          <div className="dense-title">
                            <div className="dense-kicker">
                              <ClientPortalStatusBadge status={deliverable.status} />
                              <span className="entity-pill">{toClientPortalDeliveryTypeLabel(deliverable.deliveryType)}</span>
                            </div>
                            <h3>{deliverable.title}</h3>
                            <div className="dense-meta">
                              <span>Updated {formatDateLabel(deliverable.updatedAt)}</span>
                              {deliverable.exportUrl ? (
                                <span>
                                  <a href={deliverable.exportUrl} rel="noreferrer" target="_blank">
                                    Open export
                                  </a>
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="dense-actions">
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={downloadingDeliverableId === deliverable.id}
                              onClick={() => void handleDownload(deliverable.id)}
                              type="button"
                            >
                              {downloadingDeliverableId === deliverable.id ? "Opening..." : "Download"}
                            </Button>
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
                description="Monthly reports with completed work and performance snapshots."
                title="Monthly reports"
                tone="compact"
              >
                {monthlyReportsLoading ? (
                  <LoadingState label="Loading monthly reports" />
                ) : monthlyReportsError ? (
                  <ErrorState message={monthlyReportsError} title="Monthly reports unavailable" />
                ) : monthlyReports.length === 0 ? (
                  <EmptyState
                    message="Monthly reports appear here after your team finalizes and shares them."
                    title="No reports yet"
                    variant="inline"
                  />
                ) : (
                  <div className="portal-report-split">
                    <div className="dense-list">
                      {monthlyReports.map((report, index) => (
                        <button
                          className={`secondary-action portal-report-select${selectedMonthlyReportId === report.id ? " filter-chip is-active" : ""}`}
                          key={report.id}
                          onClick={() => setSelectedMonthlyReportId(report.id)}
                          type="button"
                        >
                          <span>
                            {report.title ?? `Report ${index + 1}`}
                            <br />
                            <span className="muted-text">{formatReportDate(report.finalizedAt)}</span>
                          </span>
                          <ClientPortalStatusBadge status={report.status} />
                        </button>
                      ))}
                    </div>

                    {selectedMonthlyReport ? (
                      monthlyReportDetailLoading ? (
                        <LoadingState label="Loading final monthly report" />
                      ) : monthlyReportDetailError ? (
                        <ErrorState message={monthlyReportDetailError} title="Monthly report unavailable" />
                      ) : monthlyReportDetail ? (
                        <div className="stack-gap-sm">
                          <article className="entity-card dense-record">
                            <div className="dense-record-main dense-record-main--stack">
                              <div className="dense-title">
                                <div className="dense-kicker">
                                  <ClientPortalStatusBadge status={monthlyReportDetail.monthlyReport.status} />
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
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={downloadingMonthlyReportId === monthlyReportDetail.monthlyReport.id}
                                    onClick={() => void handleMonthlyReportDownload(monthlyReportDetail.monthlyReport.id)}
                                    type="button"
                                  >
                                    {downloadingMonthlyReportId === monthlyReportDetail.monthlyReport.id ? "Opening..." : "Download PDF"}
                                  </Button>
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

                          <div className="summary-grid metric-grid portal-metric-grid">
                            <MetricCard
                              label="Deliverables"
                              value={String(monthlyReportDetail.workSummary.finalDeliverableCount)}
                              helper={`${monthlyReportDetail.workSummary.acceptedCount} accepted · ${monthlyReportDetail.workSummary.deliveredCount} delivered`}
                            />
                            <MetricCard
                              label="Planned content"
                              value={String(monthlyReportDetail.workSummary.contentPlanItemCount)}
                              helper={`${monthlyReportDetail.workSummary.clientApprovedPlanItemCount} complete`}
                            />
                          </div>

                          {monthlyReportDetail.performanceSummary ? (
                            <SectionPanel
                              description="Performance snapshot for this report month."
                              title="Performance"
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

                          {!monthlyReportDetail.performanceSummary ? (
                            <SectionPanel
                              description="Performance metrics appear when your team attaches a snapshot to this report."
                              title="Performance"
                              tone="compact"
                            >
                              <EmptyState
                                message="No performance snapshot is attached to this report yet."
                                title="No performance data"
                                variant="inline"
                              />
                            </SectionPanel>
                          ) : null}

                          {monthlyReportDetail.workSummary.deliverables.length > 0 ? (
                            <SectionPanel
                              description="Deliverables included in this month's completed work."
                              title="Completed work"
                              tone="compact"
                            >
                              <div className="dense-list">
                                {monthlyReportDetail.workSummary.deliverables.map((deliverable) => (
                                  <article className="entity-card dense-record" key={deliverable.id}>
                                    <div className="dense-record-main">
                                      <div className="dense-title">
                                        <div className="dense-kicker">
                                          <ClientPortalStatusBadge status={deliverable.status} />
                                          <span className="entity-pill">{toClientPortalDeliveryTypeLabel(deliverable.deliveryType)}</span>
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
                            description="Written by your team for the next reporting period."
                            title="Recommendations"
                            tone="compact"
                          >
                            {monthlyReportDetail.monthlyReport.recommendationsText ? (
                              <div className="dense-row-note">{monthlyReportDetail.monthlyReport.recommendationsText}</div>
                            ) : (
                              <EmptyState message="Your team has not added recommendations to this report yet." title="No recommendations yet" variant="inline" />
                            )}
                          </SectionPanel>
                        </div>
                      ) : (
                        <EmptyState message="Select a report from the list to open the final client view." title="No report selected" variant="inline" />
                      )
                    ) : (
                      <EmptyState message="Select a report from the list to view details." title="No report selected" variant="inline" />
                    )}
                  </div>
                )}
              </SectionPanel>
            </>
          ) : null}
        </div>
      </div>

      <p className="portal-footer-note muted-text">
        Final deliverables and monthly reports are read-only. Use Pending Approvals to review articles before publication.
      </p>
    </section>
  );
}
