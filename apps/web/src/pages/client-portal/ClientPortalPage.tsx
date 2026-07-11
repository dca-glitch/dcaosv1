import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { Button, MetricCard, PageHeader, SectionPanel } from "../../components/ui";
import { Alert, Input, Select, Spinner, Textarea } from "../../design-system";
import { ClientPortalStatusBadge } from "./ClientPortalStatusBadge";
import {
  clientPortalApiRequest,
  navigateToClientPortalHash,
  toClientPortalUiSafeErrorMessage,
  type PendingApprovalsResponse
} from "./client-portal-api";
import "./client-portal.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";
const AMBER_TINT = "#C98A42";
const INDIGO_TINT = "#818CF8";

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
  hasDocument: boolean;
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
  displayTitle: string | null;
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
  placeholderOnly: boolean;
  manualSource: boolean;
  disclaimer: string | null;
  itemCount: number | null;
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

type ClientPortalReleasePackage = {
  briefTitle: string;
  projectName: string;
  finalizedAt: string;
  releaseStatus: string;
  summary: string;
  deliverables: Array<{
    title: string;
    type: string;
    exportUrl: string | null;
    status: string;
  }>;
  images: Array<{
    title: string;
    altText: string | null;
    imageUrl: string | null;
    status: string;
  }>;
  notes: string | null;
};

type ClientPortalReleasePackageResponse = {
  releasePackage: ClientPortalReleasePackage | null;
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

  return toClientPortalUiSafeErrorMessage(
    response.error.message,
    "Client archive could not be loaded."
  );
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

function formatPlaceholderMetricValue(
  value: number | null | undefined,
  placeholderOnly: boolean
): string {
  if (placeholderOnly) {
    return "Not measured";
  }

  return formatMetricValue(value);
}

function toClientPortalMonthlyReportDisplayTitle(
  report: Pick<ClientPortalMonthlyReportSummary, "displayTitle" | "title">,
  fallback: string
): string {
  return report.displayTitle ?? report.title ?? fallback;
}

function getArchiveNextActionLabel(pendingApprovalCount: number, selectedProject: ClientPortalProjectSummary | null): string {
  if (pendingApprovalCount > 0) {
    return `Next action: Review ${pendingApprovalCount} pending item${pendingApprovalCount === 1 ? "" : "s"} in Pending Reviews`;
  }

  if (selectedProject) {
    return "Next action: Review the contents below";
  }

  return "Next action: Select a delivery to view its contents";
}

function PortalInlineLoading({ label }: { label: string }) {
  return (
    <p className="cf-inline-loading" role="status">
      <Spinner size="sm" />
      {label}
    </p>
  );
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
  const [releasePackage, setReleasePackage] = useState<ClientPortalReleasePackage | null>(null);
  const [releasePackageLoading, setReleasePackageLoading] = useState(false);
  const [releasePackageError, setReleasePackageError] = useState<string | null>(null);
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
    setReleasePackageLoading(true);
    setReleasePackageError(null);
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
    setReleasePackage(null);
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
        setReleasePackageLoading(false);
        setCatalogLoading(false);
      }
      return;
    }

    const [projectResponse, deliverablesResponse, monthlyReportsResponse, deliverySummaryResponse, releasePackageResponse, catalogResponse] =
      await Promise.all([
      apiRequest<ClientPortalProjectResponse>(`/client-portal/projects/${projectId}`, { token }),
      apiRequest<ClientPortalDeliverablesResponse>(`/client-portal/projects/${projectId}/deliverables`, { token }),
      apiRequest<ClientPortalMonthlyReportsResponse>(`/client-portal/projects/${projectId}/monthly-reports`, { token }),
      apiRequest<ClientPortalDeliverySummaryResponse>(`/client-portal/projects/${projectId}/delivery-summary`, { token }),
      apiRequest<ClientPortalReleasePackageResponse>(`/client-portal/projects/${projectId}/release-package`, { token }),
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

    if (releasePackageResponse.ok) {
      setReleasePackage(releasePackageResponse.data.releasePackage ?? null);
    } else {
      setReleasePackageError(getErrorMessage(releasePackageResponse));
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
    setReleasePackageLoading(false);
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
      setReleasePackage(null);
      setSelectedProjectError(null);
      setDeliverablesError(null);
      setMonthlyReportsError(null);
      setDeliverySummaryError(null);
      setReleasePackageError(null);
      setSelectedMonthlyReportId(null);
      setSelectedProjectLoading(false);
      setDeliverablesLoading(false);
      setMonthlyReportsLoading(false);
      setDeliverySummaryLoading(false);
      setReleasePackageLoading(false);
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
      setDownloadNotice("Sign in again to download a final file.");
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
      setDownloadNotice("Final file not available yet.");
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
      setDownloadNotice("Sign in again to download a final report.");
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
      setDownloadNotice("Final report file not available.");
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
    setInquiryNotice("Inquiry sent. Your team will follow up with you directly.");
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
  const archiveNextActionLabel = getArchiveNextActionLabel(pendingApprovalCount, selectedProject);

  if (projectsLoading) {
    return (
      <section className="view-section cf-page client-portal-page" aria-labelledby="client-portal-title" data-density="comfortable">
        <PageHeader
          description="Final approved deliverables and read-only monthly reports for your account."
          eyebrow="Client workspace"
          title="Your archive"
          titleId="client-portal-title"
        />
        <PortalInlineLoading label="Loading client archive" />
      </section>
    );
  }

  if (projectsError && projects.length === 0) {
    return (
      <section className="view-section cf-page client-portal-page" aria-labelledby="client-portal-title" data-density="comfortable">
        <PageHeader
          description="Final approved deliverables and read-only monthly reports for your account."
          eyebrow="Client workspace"
          title="Your archive"
          titleId="client-portal-title"
        />
        <Alert message={projectsError} title="Archive unavailable" variant="danger" />
        <div className="portal-action-row">
          <Button variant="secondary" onClick={handleRefresh} type="button">
            Try again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="view-section cf-page client-portal-page" aria-labelledby="client-portal-title" data-density="comfortable">
      <PageHeader
        actions={
          <Button variant="tertiary" disabled={projectsLoading} onClick={handleRefresh} type="button">
            Refresh
          </Button>
        }
        description="Final approved deliverables and read-only monthly reports for your account."
        eyebrow="Client workspace"
        meta={<span className="muted-text">{clientName} · {archiveNextActionLabel}</span>}
        title="Your archive"
        titleId="client-portal-title"
      />

      <nav aria-label="Client portal sections" className="portal-subnav">
        <Button className="portal-subnav-link is-active" type="button" variant="tertiary">
          Archive
        </Button>
        <Button
          className="portal-subnav-link"
          onClick={() => navigateToClientPortalHash("client-portal/pending-approvals")}
          type="button"
          variant="tertiary"
        >
          Pending Reviews
          {pendingApprovalCount > 0 ? <span className="nav-count-badge">{pendingApprovalCount}</span> : null}
        </Button>
        <Button
          className="portal-subnav-link"
          onClick={() => navigateToClientPortalHash("client-portal/briefs")}
          type="button"
          variant="tertiary"
        >
          Briefs
        </Button>
      </nav>

      <div className="summary-grid metric-grid portal-metric-grid cf-metric-strip client-portal-kpi-row">
        <MetricCard helper="Projects shared with your account" label="Projects" value={String(projectCount)} />
        <MetricCard
          helper="Completed items only"
          label="Final assets"
          value={deliverablesLoading ? "…" : String(finalDeliverableCount)}
        />
        <MetricCard
          accent="warning"
          helper="Open Pending Reviews to continue"
          label="Awaiting your approval"
          value={String(pendingApprovalCount)}
        />
        <MetricCard
          helper="Finalized snapshots for your account"
          label="Monthly reports"
          value={monthlyReportsLoading ? "…" : String(monthlyReports.length)}
        />
      </div>

      {pendingApprovalCount > 0 ? (
        <SectionPanel
          description="These items need a decision from you before work can continue."
          tint={AMBER_TINT}
          title="Required attention"
          tone="highlight"
        >
          <div className="client-portal-attention-list">
            <div className="client-portal-attention-row is-urgent">
              <div className="client-portal-attention-copy">
                <strong>
                  {pendingApprovalCount === 1
                    ? "1 article needs your approval"
                    : `${pendingApprovalCount} articles need your approval`}
                </strong>
                <span className="muted-text text-small">
                  Review the draft and approve or request changes.
                </span>
              </div>
              <Button
                onClick={() => navigateToClientPortalHash("client-portal/pending-approvals")}
                size="sm"
                type="button"
              >
                Review &amp; Approve
              </Button>
            </div>
          </div>
        </SectionPanel>
      ) : null}

      {projectsError ? <Alert message={projectsError} variant="danger" /> : null}

      <div className="portal-split-layout">
        <aside className="cf-project-sidebar">
          <div className="cf-project-sidebar-header">
            <p className="eyebrow">Archive</p>
            <h2>Final file links</h2>
          </div>

          <div className="filter-bar" role="group" aria-label="Project filter">
            {(["active", "archived", "all"] as const).map((value) => (
              <Button
                aria-pressed={projectFilter === value}
                className={projectFilter === value ? "filter-chip is-active" : "filter-chip"}
                key={value}
                onClick={() => setProjectFilter(value)}
                type="button"
                variant="secondary"
              >
                {value[0].toUpperCase() + value.slice(1)}
              </Button>
            ))}
          </div>

          {filteredProjects.length === 0 ? (
            <p className="inline-empty muted-text">No projects to display. When your team shares a delivery, it will appear here.</p>
          ) : (
            <div className="cf-project-list">
              {filteredProjects.map((project) => (
                <article
                  aria-current={selectedProjectId === project.id ? "true" : undefined}
                  aria-label={`${project.name}${selectedProjectId === project.id ? ", selected" : ""}`}
                  className={`cf-project-item${selectedProjectId === project.id ? " is-selected" : ""}`}
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
                  <div className="cf-record-kicker">
                    <ClientPortalStatusBadge status={project.isArchived ? "ARCHIVED" : "ACTIVE"} />
                  </div>
                  <h3>{project.name}</h3>
                  <div className="cf-project-item-meta">
                    <span>{project.client?.name ?? clientName}</span>
                    <span>{formatMonthLabel(project.targetMonth)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>

        <div className="portal-detail-column">
          {!selectedProjectId ? (
            <SectionPanel
              description="Choose a delivery on the left to view its contents."
              title="Delivery details"
              tone="compact"
            >
              <EmptyState message="Select a delivery to see its contents." title="No delivery selected" variant="inline" />
            </SectionPanel>
          ) : selectedProjectLoading ? (
            <PortalInlineLoading label="Loading project archive" />
          ) : selectedProjectError ? (
            <Alert message={selectedProjectError} title="Project unavailable" variant="danger" />
          ) : selectedProject ? (
            <>
              <SectionPanel
                description="Details about this delivery."
                title="Delivery summary"
                tone="compact"
              >
                <article className="cf-record">
                  <div className="cf-record-main cf-record-main--stack">
                    <div className="cf-record-title">
                      <div className="cf-record-kicker">
                        <ClientPortalStatusBadge status={selectedProject.isArchived ? "ARCHIVED" : "ACTIVE"} />
                      </div>
                      <h3>{selectedProject.name}</h3>
                      <div className="cf-record-meta">
                        <span>{selectedProject.client?.name ?? "Your account"}</span>
                        <span>{formatMonthLabel(selectedProject.targetMonth)}</span>
                        <span>Updated {formatDateLabel(selectedProject.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="cf-record-note">Final approved work shared with your account.</p>
                </article>
              </SectionPanel>

              <SectionPanel
                description="Completed content, handoff status, and report snapshot."
                title="Work completed"
                tone="compact"
              >
                {deliverySummaryLoading ? (
                  <PortalInlineLoading label="Loading delivery summary" />
                ) : deliverySummaryError ? (
                  <Alert message={deliverySummaryError} title="Delivery summary unavailable" variant="danger" />
                ) : deliverySummary ? (
                  <div className="cf-detail-stack">
                    <article className="cf-record">
                      <div className="cf-record-main cf-record-main--stack">
                        <div className="cf-record-title">
                          <div className="cf-record-kicker">
                            <ClientPortalStatusBadge status={deliverySummary.aiSeo?.contentPlanStatus} />
                          </div>
                          <h3>Content plan</h3>
                          <div className="cf-record-meta">
                            <span>
                              {deliverySummary.aiSeo
                                ? `${deliverySummary.aiSeo.approvedItemCount} of ${deliverySummary.aiSeo.totalItemCount} completed`
                                : "No content plan yet"}
                            </span>
                            <span>
                              {deliverySummary.aiSeo?.finalDeliverableCount ?? 0} final
                              {(deliverySummary.aiSeo?.finalDeliverableCount ?? 0) === 1 ? " item" : " items"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>

                    <article className="cf-record">
                      <div className="cf-record-main cf-record-main--stack">
                        <div className="cf-record-title">
                          <div className="cf-record-kicker">
                            <ClientPortalStatusBadge status={deliverySummary.marketIntelligence?.status} />
                          </div>
                          <h3>Market insights</h3>
                          {deliverySummary.marketIntelligence?.marketSummary ? (
                            <p className="cf-record-note">{deliverySummary.marketIntelligence.marketSummary}</p>
                          ) : (
                            <p className="cf-record-note muted-text">No market insights available yet.</p>
                          )}
                          {deliverySummary.marketIntelligence?.recommendedActions.length ? (
                            <p className="cf-record-note">
                              <strong>Next steps: </strong>
                              {deliverySummary.marketIntelligence.recommendedActions.join(" · ")}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </article>

                    <article className="cf-record">
                      <div className="cf-record-main cf-record-main--stack">
                        <div className="cf-record-title">
                          <div className="cf-record-kicker">
                            <ClientPortalStatusBadge status={deliverySummary.websitePublishing?.status} />
                          </div>
                          <h3>Website handoff</h3>
                          <div className="cf-record-meta">
                            <span>{deliverySummary.websitePublishing?.action ?? "No handoff updates yet"}</span>
                            {deliverySummary.websitePublishing?.siteUrlHost ? (
                              <span>{deliverySummary.websitePublishing.siteUrlHost}</span>
                            ) : null}
                          </div>
                          {!deliverySummary.websitePublishing ? (
                            <p className="cf-record-note muted-text">Website handoff updates will appear here when they're available.</p>
                          ) : null}
                        </div>
                      </div>
                    </article>

                    <article className="cf-record">
                      <div className="cf-record-main cf-record-main--stack">
                        <div className="cf-record-title">
                          <h3>Final file links</h3>
                          {deliverySummary.googleDocsExports.length === 0 ? (
                            <p className="cf-record-note muted-text">No final file links are available yet.</p>
                          ) : (
                            <div className="cf-record-meta">
                              {deliverySummary.googleDocsExports.map((item) => (
                                <span key={item.id}>
                                  {item.title}
                                  {item.exportUrl ? (
                                    <>
                                      {" · "}
                                      <a href={item.exportUrl} rel="noreferrer" target="_blank">
                                        Open final file
                                      </a>
                                    </>
                                  ) : null}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  </div>
                ) : (
                  <EmptyState message="Delivery details will appear here once work is underway." title="Work details coming" variant="inline" />
                )}
              </SectionPanel>

              <SectionPanel
                description="Final approved materials ready for download or open links."
                title="Final assets"
                tone="compact"
              >
                {releasePackageLoading ? (
                  <PortalInlineLoading label="Loading final materials" />
                ) : releasePackageError ? (
                  <Alert message={releasePackageError} title="Final materials unavailable" variant="danger" />
                ) : releasePackage ? (
                  <div className="cf-detail-stack">
                    <article className="cf-record">
                      <div className="cf-record-main cf-record-main--stack">
                        <div className="cf-record-title">
                          <h3>{releasePackage.briefTitle}</h3>
                          <div className="cf-record-meta">
                            <ClientPortalStatusBadge status={releasePackage.releaseStatus} />
                            <span>Finalized {formatDateLabel(releasePackage.finalizedAt)}</span>
                            <span>
                              {releasePackage.deliverables.length} deliverable
                              {releasePackage.deliverables.length === 1 ? "" : "s"}
                            </span>
                          </div>
                          {releasePackage.summary ? (
                            <p className="cf-record-note">{releasePackage.summary}</p>
                          ) : null}
                        </div>
                      </div>
                    </article>
                    <div className="client-portal-assets-grid">
                      <div className="client-portal-asset-card">
                        <h3>Published articles</h3>
                        <p className="muted-text">
                          {releasePackage.deliverables.length} file
                          {releasePackage.deliverables.length === 1 ? "" : "s"}
                        </p>
                        {releasePackage.deliverables.length === 0 ? (
                          <p className="muted-text text-small">No article files in this release yet.</p>
                        ) : (
                          <div className="cf-record-list">
                            {releasePackage.deliverables.map((item) => (
                              <div className="cf-record-meta" key={`${item.title}-${item.type}`}>
                                <strong>{item.title}</strong>
                                <ClientPortalStatusBadge status={item.status} />
                                {item.exportUrl ? (
                                  <a href={item.exportUrl} rel="noreferrer" target="_blank">
                                    Open final file
                                  </a>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="client-portal-asset-card">
                        <h3>Approved images</h3>
                        <p className="muted-text">
                          {releasePackage.images.length} image
                          {releasePackage.images.length === 1 ? "" : "s"}
                        </p>
                        {releasePackage.images.length === 0 ? (
                          <p className="muted-text text-small">No images in this release yet.</p>
                        ) : (
                          <div className="cf-record-list">
                            {releasePackage.images.slice(0, 6).map((image) => (
                              <div className="cf-record-meta" key={`${image.title}-${image.imageUrl ?? "none"}`}>
                                <strong>{image.title}</strong>
                                <ClientPortalStatusBadge status={image.status} />
                                {image.imageUrl ? (
                                  <a href={image.imageUrl} rel="noreferrer" target="_blank">
                                    Open image
                                  </a>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    message="Final assets will appear here after finalization."
                    title="No assets yet"
                    variant="inline"
                  />
                )}
              </SectionPanel>

              <SectionPanel
                description="Send inquiries about products. Your team will follow up directly."
                title="Product inquiries"
                tone="compact"
              >
                {catalogLoading ? (
                  <PortalInlineLoading label="Loading product catalog" />
                ) : catalogError ? (
                  <Alert message={catalogError} title="Product catalog unavailable" variant="danger" />
                ) : catalogProducts.length === 0 ? (
                  <EmptyState
                    message="Products will appear here when they're added to your account."
                    title="No products yet"
                    variant="inline"
                  />
                ) : (
                  <div className="cf-detail-stack">
                    <div className="cf-record-list">
                      {catalogProducts.map((product) => (
                        <article className="cf-record" key={product.id}>
                          <div className="cf-record-title">
                            <h3>{product.name}</h3>
                            <div className="cf-record-meta">
                              {product.priceLabel ? <span>{product.priceLabel}</span> : null}
                              {product.sku ? <span>SKU {product.sku}</span> : null}
                            </div>
                            {product.description ? (
                              <p className="cf-record-note">{product.description}</p>
                            ) : null}
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
                        <Select
                          fullWidth
                          label="Product (optional)"
                          onChange={(event) => setInquiryProductId(event.target.value)}
                          options={[
                            { value: "", label: "General inquiry" },
                            ...catalogProducts.map((product) => ({ value: product.id, label: product.name }))
                          ]}
                          value={inquiryProductId}
                        />
                        <Input
                          fullWidth
                          label="Your name"
                          onChange={(event) => setInquiryContactName(event.target.value)}
                          required
                          value={inquiryContactName}
                        />
                        <Input
                          fullWidth
                          label="Email"
                          onChange={(event) => setInquiryContactEmail(event.target.value)}
                          required
                          type="email"
                          value={inquiryContactEmail}
                        />
                        <Input
                          fullWidth
                          label="Phone (optional)"
                          onChange={(event) => setInquiryContactPhone(event.target.value)}
                          value={inquiryContactPhone}
                        />
                        <Textarea
                          className="field-span-2"
                          fullWidth
                          label="Message"
                          onChange={(event) => setInquiryMessage(event.target.value)}
                          required
                          rows={4}
                          value={inquiryMessage}
                        />
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
                description="Access approved final files and downloads."
                title="Deliverables"
                tone="compact"
              >
                {downloadNotice ? <Alert message={downloadNotice} variant="info" /> : null}

                {deliverablesLoading ? (
                  <PortalInlineLoading label="Loading deliverables" />
                ) : deliverablesError ? (
                  <Alert message={deliverablesError} title="Deliverables unavailable" variant="danger" />
                ) : deliverables.length === 0 ? (
                  <EmptyState
                    message="Final deliverables will appear here once they're ready."
                    title="No deliverables yet"
                    variant="inline"
                  />
                ) : (
                  <div className="client-portal-table-wrap">
                    <div className="cf-record-list">
                      {deliverables.map((deliverable) => (
                        <article className="cf-record" key={deliverable.id}>
                          <div className="cf-record-main">
                            <div className="cf-record-title">
                              <div className="cf-record-kicker">
                                <ClientPortalStatusBadge status={deliverable.status} />
                                <span className="cf-type-pill">{toClientPortalDeliveryTypeLabel(deliverable.deliveryType)}</span>
                              </div>
                              <h3>{deliverable.title}</h3>
                              <div className="cf-record-meta">
                                <span>Updated {formatDateLabel(deliverable.updatedAt)}</span>
                                {deliverable.exportUrl ? (
                                  <span>
                                    <a href={deliverable.exportUrl} rel="noreferrer" target="_blank">
                                      Open final file
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
                                {downloadingDeliverableId === deliverable.id ? "Opening..." : "Download final file"}
                              </Button>
                            </div>
                          </div>
                          {deliverable.description ? (
                            <p className="cf-record-note">{deliverable.description}</p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </SectionPanel>

              <SectionPanel
                description="Final monthly snapshots of completed work and recommendations."
                title="Monthly reports archive"
                tone="compact"
                tint={monthlyReports.length > 0 ? INDIGO_TINT : undefined}
              >
                {monthlyReportsLoading ? (
                  <PortalInlineLoading label="Loading monthly reports" />
                ) : monthlyReportsError ? (
                  <Alert message={monthlyReportsError} title="Monthly reports unavailable" variant="danger" />
                ) : monthlyReports.length === 0 ? (
                  <EmptyState
                    message="Final monthly reports will appear here after they're finalized."
                    title="No reports yet"
                    variant="inline"
                  />
                ) : (
                  <div className="portal-report-split cf-report-split">
                    <div className="cf-report-nav">
                      {monthlyReports.map((report, index) => (
                        <Button
                          className={`cf-report-nav-item${selectedMonthlyReportId === report.id ? " is-active" : ""}`}
                          key={report.id}
                          onClick={() => setSelectedMonthlyReportId(report.id)}
                          type="button"
                          variant="secondary"
                        >
                          <span className="cf-report-nav-item-title">
                            {toClientPortalMonthlyReportDisplayTitle(report, `Report ${index + 1}`)}
                            <span className="muted-text">{formatReportDate(report.finalizedAt)}</span>
                          </span>
                          <ClientPortalStatusBadge status={report.status} />
                        </Button>
                      ))}
                    </div>

                    {selectedMonthlyReport ? (
                      monthlyReportDetailLoading ? (
                        <PortalInlineLoading label="Loading monthly report" />
                      ) : monthlyReportDetailError ? (
                        <Alert message={monthlyReportDetailError} title="Monthly report unavailable" variant="danger" />
                      ) : monthlyReportDetail ? (
                        <div className="stack-gap-sm">
                          <div className="client-portal-report-banner" style={{ background: "rgba(129, 140, 248, 0.08)" }}>
                            <div className="client-portal-report-banner-copy">
                              <div className="cf-record-kicker">
                                <ClientPortalStatusBadge status={monthlyReportDetail.monthlyReport.status} />
                                {selectedMonthlyReportIndex >= 0 ? (
                                  <span className="muted-text">
                                    Report {selectedMonthlyReportIndex + 1} of {monthlyReports.length}
                                  </span>
                                ) : null}
                              </div>
                              <h3>
                                {toClientPortalMonthlyReportDisplayTitle(
                                  monthlyReportDetail.monthlyReport,
                                  "Monthly report"
                                )}
                              </h3>
                              <p className="muted-text text-small">
                                Month {formatMonthLabel(monthlyReportDetail.workSummary.targetMonth)} · Finalized{" "}
                                {formatReportDate(monthlyReportDetail.monthlyReport.finalizedAt)}
                              </p>
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
                                  {downloadingMonthlyReportId === monthlyReportDetail.monthlyReport.id
                                    ? "Opening..."
                                    : "Download PDF"}
                                </Button>
                              ) : null}
                              {monthlyReportDetail.monthlyReport.exportUrl ? (
                                <a
                                  className="cf-text-link"
                                  href={monthlyReportDetail.monthlyReport.exportUrl}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  Preview
                                </a>
                              ) : null}
                            </div>
                          </div>

                          <div className="summary-grid metric-grid portal-metric-grid cf-metric-strip">
                            <MetricCard
                              label="Deliverables"
                              value={String(monthlyReportDetail.workSummary.finalDeliverableCount)}
                              helper={`${monthlyReportDetail.workSummary.acceptedCount} accepted · ${monthlyReportDetail.workSummary.deliveredCount} delivered`}
                            />
                            <MetricCard
                              label="Content plan"
                              value={String(monthlyReportDetail.workSummary.contentPlanItemCount)}
                              helper={`${monthlyReportDetail.workSummary.clientApprovedPlanItemCount} complete`}
                            />
                          </div>

                          {monthlyReportDetail.performanceSummary ? (
                            <SectionPanel
                              description={
                                monthlyReportDetail.performanceSummary.placeholderOnly
                                  ? "This report shows a final snapshot only. Live analytics are not included unless separately approved."
                                  : "Final snapshot metrics for this month."
                              }
                              title="Performance snapshot"
                              tone="compact"
                            >
                              {monthlyReportDetail.performanceSummary.placeholderOnly &&
                              monthlyReportDetail.performanceSummary.disclaimer ? (
                                <Alert
                                  message={monthlyReportDetail.performanceSummary.disclaimer}
                                  title="Not yet available"
                                  variant="info"
                                />
                              ) : null}
                              <div className="metric-grid">
                                <MetricCard
                                  label="Search clicks"
                                  value={formatPlaceholderMetricValue(
                                    monthlyReportDetail.performanceSummary.gscClicks,
                                    monthlyReportDetail.performanceSummary.placeholderOnly
                                  )}
                                  helper={
                                    monthlyReportDetail.performanceSummary.placeholderOnly
                                      ? `Metrics not available yet · Month ${monthlyReportDetail.performanceSummary.targetMonth}`
                                      : `Month ${monthlyReportDetail.performanceSummary.targetMonth}`
                                  }
                                />
                                <MetricCard
                                  label="Search impressions"
                                  value={formatPlaceholderMetricValue(
                                    monthlyReportDetail.performanceSummary.gscImpressions,
                                    monthlyReportDetail.performanceSummary.placeholderOnly
                                  )}
                                  helper={
                                    monthlyReportDetail.performanceSummary.placeholderOnly
                                      ? "Data pending"
                                      : `Month ${monthlyReportDetail.performanceSummary.targetMonth}`
                                  }
                                />
                                <MetricCard
                                  label="Sessions"
                                  value={formatPlaceholderMetricValue(
                                    monthlyReportDetail.performanceSummary.ga4Sessions,
                                    monthlyReportDetail.performanceSummary.placeholderOnly
                                  )}
                                  helper={
                                    monthlyReportDetail.performanceSummary.placeholderOnly
                                      ? "Data pending"
                                      : `Users ${formatMetricValue(monthlyReportDetail.performanceSummary.ga4Users)}`
                                  }
                                />
                                <MetricCard
                                  label="Page views"
                                  value={formatPlaceholderMetricValue(
                                    monthlyReportDetail.performanceSummary.ga4PageViews,
                                    monthlyReportDetail.performanceSummary.placeholderOnly
                                  )}
                                  helper={
                                    monthlyReportDetail.performanceSummary.placeholderOnly
                                      ? "Data pending"
                                      : `CTR ${formatPercentValue(monthlyReportDetail.performanceSummary.gscAverageCtr)}`
                                  }
                                />
                              </div>
                            </SectionPanel>
                          ) : null}

                          {!monthlyReportDetail.performanceSummary ? (
                            <SectionPanel
                              description="Performance metrics appear when your team adds analytics data to this report."
                              title="Performance snapshot"
                              tone="compact"
                            >
                              <EmptyState
                                message="No analytics data is included in this report yet."
                                title="No performance snapshot"
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
                              <div className="cf-record-list">
                                {monthlyReportDetail.workSummary.deliverables.map((deliverable) => (
                                  <article className="cf-record" key={deliverable.id}>
                                    <div className="cf-record-main">
                                      <div className="cf-record-title">
                                        <div className="cf-record-kicker">
                                          <ClientPortalStatusBadge status={deliverable.status} />
                                          <span className="cf-type-pill">{toClientPortalDeliveryTypeLabel(deliverable.deliveryType)}</span>
                                        </div>
                                        <h3>{deliverable.title}</h3>
                                      </div>
                                      {deliverable.exportUrl ? (
                                        <a href={deliverable.exportUrl} rel="noreferrer" target="_blank">
                                          Open final file
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
                              <p className="cf-record-note">{monthlyReportDetail.monthlyReport.recommendationsText}</p>
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
        Final deliverables and monthly reports are read-only client archive items. Use Pending Reviews to approve articles or request changes; monthly reports are final snapshots only.
      </p>
    </section>
  );
}
