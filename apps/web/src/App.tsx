import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Archive, BarChart2, ClipboardList, Clock } from "lucide-react";
import { AppLayout } from "./components/AppLayout";
import { AdminOperationsPanel } from "./components/admin/AdminOperationsPanel";
import { StatusNotice } from "./components/StatusNotice";
import { MetricCard, PageHeader, SectionPanel, StatusBadge, Button, Table } from "./components/ui";
import {
  BillsPage,
  type BillDocumentUploadValues,
  type BillFormValues,
  type BillSummary,
  type VendorFormValues,
  type VendorSummary
} from "./pages/bills/BillsPage";
import { CompanyProfilePage, type CompanyProfileFormValues, type CompanyProfileSummary } from "./pages/company-profile/CompanyProfilePage";
import { ClientsPage, type ClientAccessUserSummary, type ClientFormValues, type ClientSummary } from "./pages/clients/ClientsPage";
import { ClientHubPage } from "./pages/clients/ClientHubPage";
import { ClientPortalRouter } from "./pages/client-portal/ClientPortalRouter";
import { ArchiveHubPage } from "./pages/ArchiveHubPage";
import { BriefPage } from "./pages/BriefPage";
import { PendingApprovalsPage } from "./pages/client-portal/PendingApprovalsPage";
import MonthlyReportsPage from "./pages/MonthlyReportsPage";
import {
  CLIENT_ALLOWED_ROUTE_VIEWS,
  filterNavigationByRole,
  isClientOnlyRole
} from "./lib/navigation-filter";
import { CreditNotesPage, type CreditNoteFormValues, type CreditNoteSummary } from "./pages/credit-notes/CreditNotesPage";
import {
  InvoicesPage,
  type InvoiceFormValues,
  type InvoicePaymentFormValues,
  type InvoiceSummary,
  type RecurringInvoiceFormValues,
  type RecurringInvoiceSummary
} from "./pages/invoices/InvoicesPage";
import {
  InvoiceItemsPage,
  type InvoiceItemFormValues,
  type InvoiceItemSummary
} from "./pages/invoice-items/InvoiceItemsPage";
import { ProjectsPage, type ProjectFormValues, type ProjectSummary } from "./pages/projects/ProjectsPage";
import {
  AiDeliveryPage,
  type AiDeliveryArticleImageFormValues,
  type AiDeliveryPrivateAssetUploadValues,
  type AiDeliveryArticleImageSummary,
  type AiDeliveryContentDraftFormValues,
  type AiDeliveryContentDraftSummary,
  type AiDeliveryContentPlanFormValues,
  type AiDeliveryContentPlanSummary,
  type AiDeliveryDeliverableReviewFormValues,
  type AiDeliveryDeliverableReviewSummary,
  type AiDeliveryResearchRequestFormValues,
  type AiDeliveryResearchRequestSummary,
  type AiDeliveryResearchSummaryFormValues,
  type AiDeliveryResearchSummarySummary,
  type AiDeliveryResearchSourceFormValues,
  type AiDeliveryResearchSourceSummary,
  type AiDeliveryWorkflowRunFormValues,
  type AiDeliveryWorkflowRunSummary,
  type AiDeliveryProjectSummary,
  type AiDeliveryProjectFormValues
} from "./pages/ai-delivery/AiDeliveryPage";
import { isMissingContentPlanFailure } from "./pages/ai-delivery/ai-delivery-content-plan-load";
import type {
  AiDeliveryMonthlySummaryData,
  AiDeliveryMonthlyReportData,
  AiDeliveryMonthlyReportGeneratePdfSummary,
  AiDeliveryMonthlyReportFormValues,
  AiDeliveryMonthlyMetricsSummary,
  AiDeliveryMonthlyMetricsResponse,
  AiDeliveryMonthlyMetricSnapshotResponse,
  AiDeliveryMonthlyMetricSnapshotSummary,
  MonthlyMetricSnapshotFormValues,
  AiDeliveryMonthlyReportMiContext
} from "./pages/ai-delivery/MonthlyReportPanel";
import { AiMarketIntelligencePage } from "./pages/ai-market-intelligence/AiMarketIntelligencePage";
import { AiOperationsPage } from "./pages/ai-operations/AiOperationsPage";
import { AdminDailyOperationsCockpit } from "./pages/ai-operations/AdminDailyOperationsCockpit";
import { TasksPage, type TaskFormValues, type TaskSummary } from "./pages/tasks/TasksPage";
import { BriefPanelPage } from "./pages/BriefPanelPage";
import { WorkflowBriefsPage } from "./pages/WorkflowBriefsPage";
import { ClientDashboardPage } from "./pages/ClientDashboardPage";
import DesignShowcase from './design-system/showcase/DesignShowcase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";
const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const LOGIN_HASH = "#/login";
const DASHBOARD_HASH = "#/dashboard";

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

type DocumentDownloadResponse = {
  downloadUrl: string;
  expiresSeconds: number;
};

type AiDeliveryMonthlyReportGeneratePdfResponse = {
  report: AiDeliveryMonthlyReportGeneratePdfSummary | null;
};

type UserSummary = {
  id: string;
  email: string;
  name?: string | null;
  status: string;
  forcePasswordChange?: boolean;
  lastLoginAt?: string | null;
};

type MembershipSummary = {
  tenantId: string;
  tenantMembershipId: string;
  roles: string[];
};

type AuthLoginResponse = {
  user: UserSummary;
  session: {
    token: string;
    expiresAt: string;
    ttlMinutes: number;
  };
  tenantContext: {
    activeMembership: MembershipSummary | null;
    memberships: MembershipSummary[];
  };
};

type AuthCurrentUserResponse = {
  user: UserSummary;
  session: {
    createdAt: string;
    expiresAt: string;
    lastSeenAt: string | null;
    revokedAt: string | null;
  };
  tenantContext: {
    activeMembership: MembershipSummary | null;
    memberships: MembershipSummary[];
  };
};

type AuthContextResponse = {
  user: UserSummary;
  tenantContext: {
    activeTenant: {
      tenantId: string;
      tenantMembershipId: string;
    } | null;
    activeMembership: MembershipSummary | null;
    memberships: MembershipSummary[];
    roles: string[];
  };
  effectivePermissions: string[];
};

type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type TenantMembershipCard = {
  tenant: TenantSummary;
  tenantMembershipId: string;
  roles: string[];
};

type TenantListResponse = {
  user: UserSummary;
  currentTenant: TenantMembershipCard | null;
  availableTenants: TenantMembershipCard[];
};

type TenantMemberSummary = {
  tenantMembershipId: string;
  user: UserSummary;
  status: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
};

type TenantMembersResponse = {
  tenant: TenantSummary;
  currentMembership: MembershipSummary;
  members: TenantMemberSummary[];
};

type TenantSettingsResponse = {
  tenant: TenantSummary;
  currentMembership: MembershipSummary;
};

type ModuleListItem = {
  key: string;
  name: string;
  description: string;
  status: string;
  version?: string;
};

type TenantModuleSummary = ModuleListItem & {
  enabled: boolean;
  tenantModuleId?: string;
  tenantModuleStatus?: string;
};

type ModuleRegistryResponse = {
  modules: ModuleListItem[];
};

type TenantModulesResponse = {
  currentMembership: MembershipSummary;
  modules: TenantModuleSummary[];
};

type CompanyProfileResponse = {
  companyProfile: CompanyProfileSummary | null;
};

type ClientsResponse = {
  clients: ClientSummary[];
};

type ClientAccessResponse = {
  users: ClientAccessUserSummary[];
};

type ProjectsResponse = {
  projects: ProjectSummary[];
};

type AiDeliveryProjectsResponse = {
  aiDeliveryProjects: AiDeliveryProjectSummary[];
};

type AiDeliveryResearchRequestsResponse = {
  researchRequests: AiDeliveryResearchRequestSummary[];
};

type AiDeliveryResearchRequestResponse = {
  researchRequest: AiDeliveryResearchRequestSummary | null;
};

type AiDeliveryResearchSourcesResponse = {
  researchSources: AiDeliveryResearchSourceSummary[];
};

type AiDeliveryResearchSourceResponse = {
  researchSource: AiDeliveryResearchSourceSummary | null;
};

type AiDeliveryResearchSummariesResponse = {
  researchSummaries: AiDeliveryResearchSummarySummary[];
};

type AiDeliveryMiHandoffSummary = {
  id: string;
  projectId: string;
  insightId: string;
  title: string;
  marketSummary: string | null;
  competitorSummary: string | null;
  audienceSignals: string[] | null;
  opportunities: string[] | null;
  risks: string[] | null;
  recommendedActions: string[] | null;
  sourceNote: string | null;
  targetClientName: string | null;
  targetMonth: string | null;
  handoffStatus: string;
  isArchived: boolean;
  aiDeliveryProjectId: string | null;
  createdAt: string;
  updatedAt: string;
};

type AiDeliveryMiContextResponse = {
  handoffs: AiDeliveryMiHandoffSummary[];
};

type AiDeliveryResearchSummaryResponse = {
  researchSummary: AiDeliveryResearchSummarySummary | null;
};

type AiDeliveryResearchSummaryApplyResponse = {
  researchSummary: AiDeliveryResearchSummarySummary | null;
  brief: {
    id: string;
    notes: string | null;
    updatedAt: string;
  } | null;
};

type AiDeliveryContentPlanResponse = {
  contentPlan: AiDeliveryContentPlanSummary | null;
};

type AiDeliveryContentPlanGeneratePdfResponse = {
  contentPlanId: string;
  hasDocument: boolean;
  generatedAt: string;
  fileName: string;
};

type AiDeliveryContentPlanDownloadResponse = {
  downloadReference: { downloadUrl: string; expiresSeconds: number } | null;
};

type AiDeliveryContentDraftsResponse = {
  contentDrafts: AiDeliveryContentDraftSummary[];
};

type AiDeliveryContentDraftResponse = {
  contentDraft: AiDeliveryContentDraftSummary | null;
};

type AiDeliveryArticleImagesResponse = {
  articleImages: AiDeliveryArticleImageSummary[];
};

type AiDeliveryArticleImageResponse = {
  articleImage: AiDeliveryArticleImageSummary | null;
};

type AiDeliveryDeliverableSummary = {
  id: string;
  tenantId: string;
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

type AiDeliveryDeliverablesResponse = {
  deliverables: AiDeliveryDeliverableSummary[];
};

type AiDeliveryDeliverableResponse = {
  deliverable: AiDeliveryDeliverableSummary | null;
};

type AiDeliveryDeliverableReviewsResponse = {
  deliverableReviews: AiDeliveryDeliverableReviewSummary[];
};

type AiDeliveryDeliverableReviewResponse = {
  deliverableReview: AiDeliveryDeliverableReviewSummary | null;
};

type AiDeliveryWorkflowRunsResponse = {
  workflowRuns: AiDeliveryWorkflowRunSummary[];
};

type AiDeliveryWorkflowRunResponse = {
  workflowRun: AiDeliveryWorkflowRunSummary | null;
};

type AiDeliveryMonthlySummaryResponse = {
  summary: {
    project: AiDeliveryMonthlySummaryData["project"];
    deliverables: AiDeliveryMonthlySummaryData["deliverables"];
    totals: AiDeliveryMonthlySummaryData["totals"];
    contentPlanItems?: AiDeliveryMonthlySummaryData["contentPlanItems"];
    deferred: {
      gaGscMetricsStatus: string;
      trendMonthsStatus: string;
      recommendationsStatus: string;
    };
  };
};

type AiDeliveryMonthlyReportResponse = {
  report: AiDeliveryMonthlyReportData | null;
};

type TasksResponse = {
  tasks: TaskSummary[];
};

type InvoicesResponse = {
  invoices: InvoiceSummary[];
};

type RecurringInvoicesResponse = {
  recurringInvoices: RecurringInvoiceSummary[];
};

type InvoiceItemsResponse = {
  invoiceItems: InvoiceItemSummary[];
};

type VendorsResponse = {
  vendors: VendorSummary[];
};

type BillsResponse = {
  bills: BillSummary[];
};

type ActivityAuditMetadataSummaryValue = string | number | boolean | null;

type ActivityAuditLogItem = {
  id: string;
  tenantId: string;
  actorType: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  metadataSummary: Record<string, ActivityAuditMetadataSummaryValue> | null;
};

type ActivityAuditLogsResponse = {
  auditLogs: ActivityAuditLogItem[];
};

type ViewKey =
  | "dashboard"
  | "modules"
  | "tenants"
  | "client-portal"
  | "briefs"
  | "briefs-panel"
  | "workflow-briefs"
  | "pending-approvals"
  | "monthly-reports"
  | "archive"
  | "clients"
  | "projects"
  | "ai-delivery"
  | "ai-operations"
  | "ai-market-intelligence"
  | "content-plan-review"
  | "content-draft-review"
  | "tasks"
  | "invoices"
  | "credit-notes"
  | "invoice-items"
  | "bills"
  | "company-profile"
  | "settings"
  | "team"
  | "admin-daily-cockpit"
  | "design-system";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

type AuthLoginRequest = {
  email: string;
  password: string;
  turnstileToken?: string;
};

type TurnstileWidgetHandle = {
  render: (
    container: string | HTMLElement,
    options: {
      sitekey: string;
      callback?: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      "timeout-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
      appearance?: "always" | "execute" | "interaction-only";
    }
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileWidgetHandle;
  }
}

const navigationItems: Array<{ view: ViewKey; label: string; section: string }> = [
  { view: "dashboard", label: "Dashboard", section: "protected" },
  { view: "modules", label: "Modules", section: "protected" },
  { view: "tenants", label: "Tenants", section: "protected" },
  { view: "client-portal", label: "Client Portal", section: "client" },
  { view: "briefs-panel", label: "Briefs", section: "client" },
  { view: "workflow-briefs", label: "Workflow Briefs", section: "core" },
  { view: "clients", label: "Clients", section: "core" },
  { view: "projects", label: "Projects", section: "core" },
  { view: "ai-delivery", label: "AI Delivery", section: "core" },
  { view: "admin-daily-cockpit", label: "Daily Cockpit", section: "core" },
  { view: "ai-operations", label: "AI Operations", section: "core" },
  { view: "ai-market-intelligence", label: "Market Intelligence", section: "core" },
  { view: "tasks", label: "Tasks", section: "core" },
  { view: "invoices", label: "Invoices", section: "core" },
  { view: "credit-notes", label: "Credit Notes", section: "core" },
  { view: "invoice-items", label: "Services Library", section: "core" },
  { view: "bills", label: "Bills", section: "core" },
  { view: "company-profile", label: "Company Profile", section: "settings" },
  { view: "settings", label: "Settings", section: "settings" },
  { view: "team", label: "Team", section: "settings" }
];

type AppNavigationItem = {
  view: ViewKey;
  label: string;
  section: string;
  icon?: ReactNode;
};

const clientNavigationItems: AppNavigationItem[] = [
  { view: "dashboard", label: "Dashboard", section: "protected" },
  {
    view: "client-portal",
    label: "Your archive",
    section: "client",
    icon: <Archive size={16} strokeWidth={2} />
  },
  { view: "briefs", label: "Briefs", section: "client", icon: <ClipboardList size={16} strokeWidth={2} /> },
  { view: "workflow-briefs", label: "Production Plan Review", section: "client", icon: <ClipboardList size={16} strokeWidth={2} /> },
  {
    view: "pending-approvals",
    label: "Pending Approvals",
    section: "client",
    icon: <Clock size={16} strokeWidth={2} />
  },
  {
    view: "monthly-reports",
    label: "Monthly Reports",
    section: "client",
    icon: <BarChart2 size={16} strokeWidth={2} />
  },
  { view: "archive", label: "Archive", section: "client", icon: <Archive size={16} strokeWidth={2} /> }
];

const CLIENT_PORTAL_SHELL_VIEWS = new Set<ViewKey>([
  "client-portal",
  "briefs",
  "workflow-briefs",
  "pending-approvals",
  "monthly-reports",
  "archive"
]);

function getInitialToken(): string | null {
  try {
    return window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string | null): void {
  try {
    if (token) {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, token);
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // In-memory state still handles the current tab when sessionStorage is unavailable.
  }
}

function replaceHash(hash: string): void {
  window.history.replaceState(null, "", `/${hash}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

const deferredClientReviewViews = new Set<ViewKey>(["content-plan-review", "content-draft-review"]);

function normalizeHash(hash: string): ViewKey {
  const value = hash.replace(/^#\/?/, "");
  if (value === "client-portal" || value.startsWith("client-portal/")) {
    return "client-portal";
  }
  if (value === "admin/design-system") {
    return "design-system";
  }
  if (deferredClientReviewViews.has(value as ViewKey)) {
    return value as ViewKey;
  }
  const knownViews = new Set<ViewKey>([
    ...navigationItems.map((item) => item.view),
    ...clientNavigationItems.map((item) => item.view)
  ]);
  return knownViews.has(value as ViewKey) ? (value as ViewKey) : "dashboard";
}

function maskError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Request could not be completed.";
}

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }

  return btoa(binary);
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const payload = (await response.json()) as ApiResponse<T>;
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
  if (response.error.code === "AUTH_LOGIN_FAILED") {
    return "Invalid email or password.";
  }

  if (response.error.code === "AUTH_UNAUTHORIZED") {
    return "Please sign in again.";
  }

  if (response.error.code === "AUTH_FORBIDDEN") {
    return "You do not have access to that action.";
  }

  if (response.error.code === "PROJECT_ARCHIVE_BLOCKED") {
    return "Project cannot be archived while it has active tasks.";
  }

  if (response.error.code === "TASK_ARCHIVE_BLOCKED") {
    return "Only done tasks can be archived.";
  }

  return response.error.message || "Request could not be completed.";
}

function isUnauthorized(response: ApiResponse<unknown>): response is ApiFailure {
  return !response.ok && response.error.code === "AUTH_UNAUTHORIZED";
}

function hasModuleAdminAccess(context: AuthContextResponse | null): boolean {
  return hasPermission(context, "modules:manage") || hasActiveRole(context, ["owner", "admin"]);
}

function hasPermission(context: AuthContextResponse | null, permission: string): boolean {
  return Boolean(context?.effectivePermissions.includes(permission));
}

function hasActiveRole(context: AuthContextResponse | null, roles: string[]): boolean {
  return Boolean(
    context?.tenantContext.roles.some((role) => roles.includes(role))
  );
}

function formatAuditActionLabel(action: string): string {
  return action
    .replace(/[.:]/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^|\s)\S/g, (segment) => segment.toUpperCase());
}

function formatAuditActorLabel(activity: ActivityAuditLogItem): string {
  if (activity.actorType === "USER" && activity.actorUserId) {
    return "User action";
  }

  if (activity.actorType === "USER") {
    return "User context";
  }

  return "System action";
}

function formatAuditActorBadgeStatus(activity: ActivityAuditLogItem): string {
  return activity.actorType === "USER" ? "User" : "System";
}

function formatAuditTimestamp(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function formatAuditMetadataSummary(
  metadataSummary: Record<string, ActivityAuditMetadataSummaryValue> | null
): string | null {
  if (!metadataSummary) {
    return null;
  }

  const summary = Object.entries(metadataSummary)
    .map(([key, value]) => `${key}: ${value ?? "none"}`)
    .join(" • ");

  return summary.length > 0 ? summary : null;
}

function TurnstileWidget({
  siteKey,
  resetSignal,
  onTokenChange
}: {
  siteKey: string;
  resetSignal: number;
  onTokenChange: (token: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return;
    }

    let cancelled = false;
    let script = document.querySelector<HTMLScriptElement>("script[data-turnstile-script='true']");

    const removeWidget = () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile) {
        return;
      }

      removeWidget();

      containerRef.current.innerHTML = "";
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "auto",
        appearance: "always",
        callback: (token: string) => onTokenChange(token),
        "error-callback": () => onTokenChange(null),
        "expired-callback": () => onTokenChange(null),
        "timeout-callback": () => onTokenChange(null)
      });
    };

    const handleScriptLoad = () => {
      if (script) {
        script.dataset.turnstileLoaded = "true";
      }
      renderWidget();
    };

    const handleScriptError = () => {
      if (!cancelled) {
        onTokenChange(null);
      }
    };

    const ensureScript = () => {
      if (!script) {
        script = document.createElement("script");
        script.async = false;
        script.defer = false;
        script.src = TURNSTILE_SCRIPT_URL;
        script.dataset.turnstileScript = "true";
        document.head.appendChild(script);
      } else {
        script.async = false;
        script.defer = false;
        script.removeAttribute("async");
        script.removeAttribute("defer");
      }

      if (window.turnstile) {
        renderWidget();
        return;
      }

      if (script.dataset.turnstileLoaded === "true") {
        renderWidget();
        return;
      }

      script.addEventListener("load", handleScriptLoad);
      script.addEventListener("error", handleScriptError);
    };

    ensureScript();

    return () => {
      cancelled = true;
      script?.removeEventListener("load", handleScriptLoad);
      script?.removeEventListener("error", handleScriptError);
      removeWidget();
    };
  }, [onTokenChange, resetSignal, siteKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className="turnstile-panel">
      <div className="turnstile-slot" ref={containerRef} />
    </div>
  );
}

function LoginScreen({
  onLogin,
  loading,
  error
}: {
  onLogin: (email: string, password: string, turnstileToken?: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);

  useEffect(() => {
    if (error) {
      setTurnstileToken(null);
      setTurnstileResetSignal((value) => value + 1);
    }
  }, [error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      return;
    }

    await onLogin(email, password, turnstileToken ?? undefined);
  }

  return (
    <main className="login-page">
      <div className="login-hero" aria-hidden="true">
        <span className="brand-mark login-brand-mark">DCA</span>
        <p className="eyebrow">DCA OS v1 / Lite</p>
        <h2>Run your operations from DCA OS command center.</h2>
        <p>Clients, billing, modules, and future labels stay visible in one workspace.</p>
      </div>
      <section className="login-panel" aria-labelledby="login-title">
        <div>
          <p className="eyebrow">DCA OS v1 / Lite</p>
          <h1 id="login-title">Sign In</h1>
          <p className="login-helper">Access the secure operations workspace.</p>
        </div>
        {error ? <StatusNotice tone="error" message={error} /> : null}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          {TURNSTILE_SITE_KEY ? (
            <div className="turnstile-block">
              <TurnstileWidget
                onTokenChange={setTurnstileToken}
                resetSignal={turnstileResetSignal}
                siteKey={TURNSTILE_SITE_KEY}
              />
              <small className="turnstile-help">
                Complete the verification challenge before signing in.
              </small>
            </div>
          ) : null}
          <button className="primary-action" disabled={loading || (Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)} type="submit">
            {loading ? "Signing in" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

type AdminUserResult = {
  userId: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
  clientId?: string;
};

function ForcePasswordChangeModal({
  onSubmit,
  loading,
  error
}: {
  onSubmit: (newPassword: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    if (newPassword.length < 8) {
      setLocalError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    await onSubmit(newPassword);
  }

  const displayError = localError ?? error;

  return (
    <main className="login-page">
      <div className="login-hero" aria-hidden="true">
        <span className="brand-mark login-brand-mark">DCA</span>
        <p className="eyebrow">DCA OS v1 / Lite</p>
        <h2>Security update required.</h2>
        <p>Your account requires a new password before you can continue.</p>
      </div>
      <section className="login-panel" aria-labelledby="change-password-title">
        <div>
          <p className="eyebrow">DCA OS v1 / Lite</p>
          <h1 id="change-password-title">Set New Password</h1>
          <p className="login-helper">Your temporary password must be changed before accessing the workspace.</p>
        </div>
        {displayError ? <StatusNotice tone="error" message={displayError} /> : null}
        <form className="auth-form" onSubmit={(e) => void handleSubmit(e)}>
          <label>
            New Password
            <input
              autoComplete="new-password"
              minLength={8}
              name="newPassword"
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              value={newPassword}
            />
          </label>
          <label>
            Confirm New Password
            <input
              autoComplete="new-password"
              name="confirmPassword"
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              value={confirmPassword}
            />
          </label>
          <button className="primary-action" disabled={loading} type="submit">
            {loading ? "Updating password" : "Set new password"}
          </button>
        </form>
      </section>
    </main>
  );
}

function DashboardView({
  user,
  context,
  tenants,
  activityAuditLogs,
  activityAuditLogsError,
  activityAuditLogsLoading
}: {
  user: UserSummary;
  context: AuthContextResponse | null;
  tenants: TenantListResponse | null;
  activityAuditLogs: ActivityAuditLogsResponse | null;
  activityAuditLogsError: string | null;
  activityAuditLogsLoading: boolean;
}) {
  const roles = context?.tenantContext.roles ?? [];
  if (isClientOnlyRole(roles)) {
    return <ClientDashboardPage user={user} />;
  }

  const activeTenant = tenants?.currentTenant?.tenant;
  const permissionCount = context?.effectivePermissions.length ?? 0;
  const auditLogs = activityAuditLogs?.auditLogs ?? [];
  const [auditTypeFilter, setAuditTypeFilter] = useState<"all" | "auth" | "module" | "tenant" | "delivery">("all");
  const filteredAuditLogs = useMemo(() => {
    if (auditTypeFilter === "all") {
      return auditLogs;
    }

    return auditLogs.filter((activity) => {
      const action = activity.action.toLowerCase();
      const entity = (activity.entityType ?? "").toLowerCase();
      if (auditTypeFilter === "auth") {
        return action.includes("auth") || action.includes("login") || action.includes("session");
      }
      if (auditTypeFilter === "module") {
        return action.includes("module") || entity.includes("module");
      }
      if (auditTypeFilter === "tenant") {
        return action.includes("tenant") || entity.includes("tenant");
      }
      if (auditTypeFilter === "delivery") {
        return (
          action.includes("wordpress") ||
          action.includes("publication") ||
          action.includes("workflow") ||
          action.includes("market_intelligence")
        );
      }
      return true;
    });
  }, [auditLogs, auditTypeFilter]);

  return (
    <section className="view-section" aria-labelledby="dashboard-title">
      <PageHeader
        eyebrow="Operations"
        title="Dashboard"
        titleId="dashboard-title"
        description="Command view for the active workspace — recent audit activity and quick links to core modules."
        meta={
          <>
            <StatusBadge status={user.status || "Active"} />
            <span className="muted-text">{user.name || user.email}</span>
            {roles.length ? <span className="muted-text">{roles.join(", ")}</span> : null}
          </>
        }
      />
      <div className="summary-grid metric-grid dashboard-command-metrics dashboard-command-metrics--compact" aria-label="Dashboard command metrics">
        <MetricCard
          accent="violet"
          helper={activeTenant?.slug ?? "not selected"}
          label="Active tenant"
          metricKey="active-tenant"
          value={activeTenant?.name ?? "No tenant"}
        />
        <MetricCard
          accent={activeTenant ? "success" : "warning"}
          helper={`${permissionCount} permissions`}
          label="Workspace"
          metricKey="workspace-state"
          value={activeTenant ? "Ready" : "Limited"}
        />
      </div>
      <AdminOperationsPanel />
      <div className="dashboard-grid">
        <SectionPanel
          tone="compact"
          title="Recent Activity"
          description="Tenant audit feed — last events from the active workspace."
          action={
            <div className="filter-bar" role="group" aria-label="Audit activity type filter">
              {(["all", "auth", "module", "tenant", "delivery"] as const).map((value) => (
                <Button
                  aria-pressed={auditTypeFilter === value}
                  key={value}
                  onClick={() => setAuditTypeFilter(value)}
                  size="sm"
                  variant={auditTypeFilter === value ? "primary" : "secondary"}
                >
                  {value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)}
                </Button>
              ))}
            </div>
          }
        >
          {activityAuditLogsLoading ? (
            <p className="muted-text">Loading recent activity…</p>
          ) : activityAuditLogsError ? (
            <p className="muted-text" role="alert">{activityAuditLogsError}</p>
          ) : auditLogs.length === 0 ? (
            <p className="inline-empty muted-text">Audit events appear here after module changes, tenant updates, or auth events.</p>
          ) : filteredAuditLogs.length === 0 ? (
            <p className="inline-empty muted-text">No events match this filter. Try All or perform a new admin action.</p>
          ) : (
            <div className="audit-feed timeline-list" role="list" aria-label="Recent audit activity">
              {filteredAuditLogs.map((activity) => {
                const metadataSummary = formatAuditMetadataSummary(activity.metadataSummary);
                return (
                  <article className="audit-feed-item timeline-item" key={activity.id} role="listitem">
                    <span aria-hidden="true" />
                    <div className="audit-feed-body">
                      <div className="audit-feed-header">
                        <strong>{formatAuditActionLabel(activity.action)}</strong>
                        <StatusBadge status={formatAuditActorBadgeStatus(activity)} />
                      </div>
                      <div className="audit-feed-meta muted-text">
                        {formatAuditActorLabel(activity)} · {formatAuditTimestamp(activity.createdAt)}
                      </div>
                      <div className="audit-feed-entity muted-text">
                        {activity.entityType}
                        {activity.entityId ? ` · ${activity.entityId}` : ""}
                      </div>
                      {metadataSummary ? <div className="audit-feed-summary muted-text">{metadataSummary}</div> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </SectionPanel>
        <SectionPanel tone="compact" title="Upcoming Tasks" description="Live task details and due dates.">
          <div className="quick-link-list">
            <a className="subtle-action" href="#/tasks">Review active tasks</a>
            <a className="subtle-action" href="#/projects">Check project delivery</a>
          </div>
        </SectionPanel>
        <SectionPanel tone="compact" title="Finance" description="Invoices and Bills at a glance.">
          <div className="quick-link-list">
            <a className="subtle-action" href="#/invoices">Open invoices</a>
            <a className="subtle-action" href="#/bills">Open bills</a>
          </div>
        </SectionPanel>
        <SectionPanel tone="compact" title="Quick links" description="Core workspaces and preview labels only.">
          <div className="quick-action-grid">
            <a className="secondary-action" href="#/clients">Clients</a>
            <a className="secondary-action" href="#/projects">Projects</a>
            <a className="secondary-action" href="#/tasks">Tasks</a>
            <a className="secondary-action" href="#/invoices">Invoices</a>
            <a className="secondary-action" href="#/bills">Bills</a>
            <a className="secondary-action" href="#/modules">Modules</a>
            <span className="module-preview-pill module-preview-pill--muted">Revenue Hub</span>
            <span className="module-preview-pill module-preview-pill--muted">SEO Hub</span>
            <span className="module-preview-pill module-preview-pill--muted">AI Workflow</span>
          </div>
        </SectionPanel>
      </div>
    </section>
  );
}

function TenantView({
  tenants,
  onSwitchTenant,
  switchingTenantMembershipId
}: {
  tenants: TenantListResponse | null;
  onSwitchTenant: (tenantMembershipId: string) => Promise<void>;
  switchingTenantMembershipId: string | null;
}) {
  const availableTenants = tenants?.availableTenants ?? [];
  const currentMembershipId = tenants?.currentTenant?.tenantMembershipId ?? null;

  return (
    <section className="view-section" aria-labelledby="tenant-title">
      <PageHeader
        eyebrow="Tenant Context"
        title="Tenants"
        titleId="tenant-title"
        description="Switch the active workspace tenant for this session."
      />
      {availableTenants.length === 0 ? (
        <p className="inline-empty muted-text">No active tenant memberships were found.</p>
      ) : (
        <div className="tenant-list">
          {availableTenants.map((membership) => {
            const isCurrent = membership.tenantMembershipId === currentMembershipId;
            return (
              <article className="tenant-row" key={membership.tenantMembershipId}>
                <div>
                  <strong>{membership.tenant.name}</strong>
                  <span>{membership.tenant.slug}</span>
                </div>
                <div className="tenant-row-actions">
                  <span>{membership.roles.join(", ") || "no roles"}</span>
                  <button
                    className="secondary-action"
                    disabled={isCurrent || switchingTenantMembershipId === membership.tenantMembershipId}
                    onClick={() => void onSwitchTenant(membership.tenantMembershipId)}
                    type="button"
                  >
                    {isCurrent ? "Current" : "Switch"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ModuleRegistryView({
  availableModules,
  tenantModules,
  canManageModules,
  moduleActionKey,
  selectedModuleKey,
  onSetModuleEnabled
}: {
  availableModules: ModuleListItem[];
  tenantModules: TenantModuleSummary[];
  canManageModules: boolean;
  moduleActionKey: string | null;
  selectedModuleKey: string | null;
  onSetModuleEnabled: (moduleKey: string, enabled: boolean) => Promise<void>;
}) {
  const tenantModuleByKey = useMemo(
    () => new Map(tenantModules.map((moduleItem) => [moduleItem.key, moduleItem])),
    [tenantModules]
  );

  return (
    <section className="view-section" aria-labelledby="modules-title">
      <PageHeader eyebrow="Module Registry" title="Modules" titleId="modules-title" description="Manage core workspaces and preview future Revenue Hub, SEO Hub, and AI Workflow labels only." />
      <div className="module-grid">
        {availableModules.map((moduleItem) => {
          const tenantModule = tenantModuleByKey.get(moduleItem.key);
          const enabled = tenantModule?.enabled ?? false;
          const busy = moduleActionKey === moduleItem.key;

          return (
            <article className="module-card" key={moduleItem.key}>
              <div>
                <StatusBadge status={enabled ? "Enabled" : "Disabled"} className="module-status" />
                <h2>{moduleItem.name}</h2>
                <p>{moduleItem.description}</p>
              </div>
              <dl>
                <div>
                  <dt>Key</dt>
                  <dd>{moduleItem.key}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{moduleItem.status}</dd>
                </div>
              </dl>
              <button
                className={enabled ? "secondary-action" : "primary-action"}
                disabled={!canManageModules || busy}
                onClick={() => void onSetModuleEnabled(moduleItem.key, !enabled)}
                type="button"
              >
                {enabled ? "Disable" : "Enable"}
              </button>
              <a className="module-link" href={`#/modules/${moduleItem.key}`}>
                Open module
              </a>
            </article>
          );
        })}
      </div>
      {selectedModuleKey ? (
        <div className="module-placeholder-panel" aria-live="polite">
          <p className="eyebrow">Module Registry</p>
          <h2>{selectedModuleKey}</h2>
          <p>
            This module shell is ready for the next backend-backed pass. Finance Lite, billing, and dynamic
            plugin mounting stay out of scope for this MVP shell.
          </p>
        </div>
      ) : null}
      {!canManageModules ? (
        <StatusNotice tone="info" message="Read-only access. Module actions require an owner or admin tenant role." />
      ) : null}
    </section>
  );
}

function PlaceholderView({ title, eyebrow }: { title: string; eyebrow: string }) {
  const titleId = `${title.toLowerCase().replace(/\s+/g, "-")}-title`;

  return (
    <section className="view-section" aria-labelledby={titleId}>
      <PageHeader eyebrow={eyebrow} title={title} titleId={titleId} description="Reserved shell — backend-backed features arrive in a later block." />
      <SectionPanel tone="compact" title="Not available yet" description="This route stays intentionally paused until its backend block is approved.">
        <p className="inline-empty muted-text">This area is reserved for the next backend-backed pass.</p>
      </SectionPanel>
    </section>
  );
}

function DeferredClientPortalView({
  title,
  titleId
}: {
  title: string;
  titleId: string;
}) {
  return (
    <section className="view-section" aria-labelledby={titleId}>
      <PageHeader
        eyebrow="Client review"
        title={title}
        titleId={titleId}
        description="Client review access is deferred until the Client Portal foundation is enabled."
      />
      <SectionPanel tone="compact" title="Not available" description="This route is intentionally paused in the current branch.">
        <p className="inline-empty muted-text">
          Client review loading is disabled for now. The admin workflow stays intact, but client-facing review pages remain deferred until the Client Portal block is approved.
        </p>
      </SectionPanel>
    </section>
  );
}

function TeamView({
  authContext,
  teamMembers,
  clients,
  onCreateUser,
  onResetPassword
}: {
  authContext: AuthContextResponse | null;
  teamMembers: TenantMembersResponse | null;
  clients: ClientSummary[];
  onCreateUser: (email: string, name: string, roleKey: string, clientId?: string) => Promise<AdminUserResult | null>;
  onResetPassword: (userId: string) => Promise<AdminUserResult | null>;
}) {
  const canReadUsers = hasPermission(authContext, "users:read") || hasActiveRole(authContext, ["owner", "admin"]);
  const canManageUsers = hasActiveRole(authContext, ["owner", "admin"]);
  const members = teamMembers?.members ?? [];
  const activeMembers = members.filter((member) => member.status.toLowerCase() === "active");
  const roleLabels = [...new Set(members.flatMap((member) => member.roles))];

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createRoleKey, setCreateRoleKey] = useState("client");
  const [createClientId, setCreateClientId] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createResult, setCreateResult] = useState<AdminUserResult | null>(null);
  const [resetResults, setResetResults] = useState<Record<string, AdminUserResult>>({});
  const [resetLoadingId, setResetLoadingId] = useState<string | null>(null);

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateLoading(true);
    setCreateResult(null);
    try {
      const result = await onCreateUser(
        createEmail,
        createName,
        createRoleKey,
        createClientId.trim() || undefined
      );
      if (result) {
        setCreateResult(result);
        setCreateEmail("");
        setCreateName("");
        setCreateRoleKey("client");
        setCreateClientId("");
        setShowCreateForm(false);
      }
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleResetPassword(userId: string) {
    setResetLoadingId(userId);
    try {
      const result = await onResetPassword(userId);
      if (result) {
        setResetResults((prev) => ({ ...prev, [userId]: result }));
      }
    } finally {
      setResetLoadingId(null);
    }
  }

  return (
    <section className="view-section" aria-labelledby="team-title">
      <PageHeader
        eyebrow="Team"
        title="Members"
        titleId="team-title"
        description="Tenant member directory. Admins can create users and reset passwords."
      />
      <div className="summary-grid metric-grid team-shell-metrics" aria-label="Team shell metrics">
        <MetricCard
          accent="cyan"
          helper={`${activeMembers.length} active of ${members.length} listed`}
          label="Members"
          metricKey="team-members"
          value={String(members.length)}
        />
        <MetricCard
          accent="purple"
          helper={roleLabels.length ? roleLabels.join(", ") : "No roles assigned"}
          label="Role coverage"
          metricKey="team-roles"
          value={roleLabels.length ? String(roleLabels.length) : "None"}
        />
      </div>
      {!canReadUsers ? (
        <StatusNotice tone="info" message="Member visibility requires tenant user read access." />
      ) : null}
      {canManageUsers ? (
        <SectionPanel
          tone="compact"
          title="Create user"
          description="Add a new user to this tenant. A temporary password will be generated."
          action={
            !showCreateForm ? (
              <Button onClick={() => setShowCreateForm(true)}>Create user</Button>
            ) : null
          }
        >
          {createResult ? (
            <div className="status-notice status-notice--success">
              <p>User created. Share these credentials securely.</p>
              <dl>
                <div><dt>Email</dt><dd>{createResult.email}</dd></div>
                <div><dt>Temp password</dt><dd><code>{createResult.tempPassword}</code></dd></div>
                <div><dt>Login URL</dt><dd><code>{createResult.loginUrl}</code></dd></div>
                {createResult.clientId ? (
                  <div>
                    <dt>Client access</dt>
                    <dd>
                      {clients.find((client) => client.id === createResult.clientId)?.name ?? createResult.clientId}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <button className="secondary-action" onClick={() => setCreateResult(null)} type="button">Dismiss</button>
            </div>
          ) : null}
          {showCreateForm ? (
            <form className="inline-form" onSubmit={(e) => void handleCreateSubmit(e)}>
              <label>
                Email
                <input
                  name="email"
                  onChange={(e) => setCreateEmail(e.target.value)}
                  required
                  type="email"
                  value={createEmail}
                />
              </label>
              <label>
                Name (optional)
                <input
                  name="name"
                  onChange={(e) => setCreateName(e.target.value)}
                  type="text"
                  value={createName}
                />
              </label>
              <label>
                Role key
                <input
                  name="roleKey"
                  onChange={(e) => setCreateRoleKey(e.target.value)}
                  placeholder="client"
                  type="text"
                  value={createRoleKey}
                />
              </label>
              {createRoleKey !== "owner" ? (
                <label>
                  Client (portal access, optional)
                  <select
                    name="clientId"
                    onChange={(e) => setCreateClientId(e.target.value)}
                    value={createClientId}
                  >
                    <option value="">no client assigned</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <div className="form-actions">
                <Button disabled={createLoading} type="submit">
                  {createLoading ? "Creating" : "Create user"}
                </Button>
                <Button disabled={createLoading} onClick={() => setShowCreateForm(false)} variant="secondary">
                  Cancel
                </Button>
              </div>
            </form>
          ) : !createResult ? (
            <p className="inline-empty muted-text">Use the button above to add a new team member.</p>
          ) : null}
        </SectionPanel>
      ) : null}
      {canReadUsers ? (
        <SectionPanel
          tone="compact"
          title="Member directory"
          description={canManageUsers ? "Admin actions: reset password per member." : "Read-only view."}
        >
          {members.length === 0 ? (
            <p className="inline-empty muted-text">Active tenant members appear here once membership records exist.</p>
          ) : (
            <div className="table-wrap" aria-label="Tenant members">
              <Table
                headers={[
                  { label: "User name", align: "left" },
                  { label: "User email", align: "left" },
                  { label: "Role / access level", align: "left" },
                  { label: "Status", align: "left" },
                  ...(canManageUsers ? [{ label: "Actions", align: "right" as const }] : [])
                ]}
                rows={members.map((member) => {
                  const resetResult = resetResults[member.user.id];
                  return {
                    key: member.tenantMembershipId,
                    cells: [
                      member.user.name || "Unassigned",
                      member.user.email,
                      member.roles.join(", ") || "None",
                      <StatusBadge key={`${member.tenantMembershipId}-status`} status={member.status} />,
                      ...(canManageUsers
                        ? [
                            resetResult ? (
                              <span className="muted-text" key={`${member.tenantMembershipId}-reset`}>
                                Temp: <code>{resetResult.tempPassword}</code>
                                <Button
                                  onClick={() =>
                                    setResetResults((prev) => {
                                      const next = { ...prev };
                                      delete next[member.user.id];
                                      return next;
                                    })
                                  }
                                  size="sm"
                                  variant="tertiary"
                                >
                                  Clear
                                </Button>
                              </span>
                            ) : (
                              <Button
                                disabled={resetLoadingId === member.user.id}
                                key={`${member.tenantMembershipId}-action`}
                                onClick={() => void handleResetPassword(member.user.id)}
                                size="sm"
                                variant="secondary"
                              >
                                {resetLoadingId === member.user.id ? "Resetting" : "Reset password"}
                              </Button>
                            )
                          ]
                        : [])
                    ]
                  };
                })}
              />
            </div>
          )}
        </SectionPanel>
      ) : null}
    </section>
  );
}

function SettingsView({
  authContext,
  currentUser,
  tenantSettings
}: {
  authContext: AuthContextResponse | null;
  currentUser: UserSummary;
  tenantSettings: TenantSettingsResponse | null;
}) {
  const canReadSettings =
    hasPermission(authContext, "settings:read") || hasActiveRole(authContext, ["owner", "admin"]);

  return (
    <section className="view-section" aria-labelledby="settings-title">
      <PageHeader
        eyebrow="Settings"
        title="Settings"
        titleId="settings-title"
        description="Read-only tenant and profile context for this MVP shell."
      />
      <div className="summary-grid metric-grid settings-shell-metrics" aria-label="Settings shell metrics">
        <MetricCard
          accent="cyan"
          helper={currentUser.email}
          label="Profile"
          metricKey="settings-profile"
          value={currentUser.name || currentUser.email}
        />
        <MetricCard
          accent="violet"
          helper={tenantSettings?.tenant.slug ?? "read-only context"}
          label="Tenant"
          metricKey="settings-tenant"
          value={tenantSettings?.tenant.name ?? "Unavailable"}
        />
      </div>
      {!canReadSettings ? (
        <StatusNotice tone="info" message="Tenant settings visibility requires settings read access." />
      ) : null}
      <SectionPanel
        tone="compact"
        title="MVP shell boundary"
        description="Settings remain read-only until the Settings MVP backend block is approved."
      >
        <p className="inline-empty muted-text">
          Password reset, OAuth, billing, invite flow, and destructive tenant changes remain out of scope for this shell.
        </p>
      </SectionPanel>
    </section>
  );
}

function ClientReviewDeferredView({
  title,
  titleId,
  description
}: {
  title: string;
  titleId: string;
  description: string;
}) {
  return (
    <section className="view-section" aria-labelledby={titleId}>
      <PageHeader eyebrow="Client review" title={title} titleId={titleId} description={description} />
      <SectionPanel
        tone="compact"
        title="Deferred for MVP"
        description="Client review actions are not active in this MVP. Admin remains responsible for review and publishing."
      >
        <StatusNotice
          tone="info"
          message="Client approval, request-changes actions, and internal draft review are deferred. Use Client Portal for final client-safe deliverables and monthly reports. Active modules: AI Delivery (operator path), Client Portal (visibility)."
        />
        <p className="inline-empty muted-text">
          Open Client Portal from the sidebar to view final deliverables and approved monthly reports shared with your account.
        </p>
      </SectionPanel>
    </section>
  );
}

function ClientContentPlanReviewView() {
  return (
    <ClientReviewDeferredView
      title="Monthly Content Plan Review"
      titleId="content-plan-review-title"
      description="This client review route is deferred for the current MVP."
    />
  );
}

function ClientContentDraftReviewView() {
  return (
    <ClientReviewDeferredView
      title="Content Draft Review"
      titleId="content-draft-review-title"
      description="Internal draft review is deferred for the current MVP."
    />
  );
}

export function App() {
  const [activeView, setActiveView] = useState<ViewKey>(() => normalizeHash(window.location.hash));
  const [selectedModuleKey, setSelectedModuleKey] = useState<string | null>(() =>
    window.location.hash.startsWith("#/modules/") ? window.location.hash.replace("#/modules/", "") : null
  );
  const [token, setToken] = useState<string | null>(() => getInitialToken());
  const [currentUser, setCurrentUser] = useState<AuthCurrentUserResponse | null>(null);
  const [authContext, setAuthContext] = useState<AuthContextResponse | null>(null);
  const [tenantContext, setTenantContext] = useState<TenantListResponse | null>(null);
  const [teamMembers, setTeamMembers] = useState<TenantMembersResponse | null>(null);
  const [tenantSettings, setTenantSettings] = useState<TenantSettingsResponse | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileResponse | null>(null);
  const [clients, setClients] = useState<ClientsResponse | null>(null);
  const [selectedClientHubId, setSelectedClientHubId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectsResponse | null>(null);
  const [aiDeliveryProjects, setAiDeliveryProjects] = useState<AiDeliveryProjectsResponse | null>(null);
  const [tasks, setTasks] = useState<TasksResponse | null>(null);
  const [invoices, setInvoices] = useState<InvoicesResponse | null>(null);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoicesResponse | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemsResponse | null>(null);
  const [archivedInvoiceItems, setArchivedInvoiceItems] = useState<InvoiceItemsResponse | null>(null);
  const [vendors, setVendors] = useState<VendorsResponse | null>(null);
  const [bills, setBills] = useState<BillsResponse | null>(null);
  const [availableModules, setAvailableModules] = useState<ModuleListItem[]>([]);
  const [tenantModules, setTenantModules] = useState<TenantModuleSummary[]>([]);
  const [activityAuditLogs, setActivityAuditLogs] = useState<ActivityAuditLogsResponse | null>(null);
  const [activityAuditLogsError, setActivityAuditLogsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [appMessage, setAppMessage] = useState<{ tone: "info" | "error" | "success"; text: string } | null>(
    null
  );
  const [moduleActionKey, setModuleActionKey] = useState<string | null>(null);
  const [switchingTenantMembershipId, setSwitchingTenantMembershipId] = useState<string | null>(null);
  const [forcePasswordChangeContext, setForcePasswordChangeContext] = useState<{
    token: string;
    originalPassword: string;
  } | null>(null);
  const [forcePasswordChangeError, setForcePasswordChangeError] = useState<string | null>(null);
  const [forcePasswordChangeLoading, setForcePasswordChangeLoading] = useState(false);
  const tokenRef = useRef<string | null>(token);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    function handleHashChange() {
      setActiveView(normalizeHash(window.location.hash));
      setSelectedModuleKey(
        window.location.hash.startsWith("#/modules/") ? window.location.hash.replace("#/modules/", "") : null
      );
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (!authContext) return;

    const isClientOnly = isClientOnlyRole(authContext.tenantContext.roles);

    if (isClientOnly && !CLIENT_ALLOWED_ROUTE_VIEWS.has(activeView)) {
      replaceHash(DASHBOARD_HASH);
    }
  }, [authContext, activeView]);

  const redirectToLogin = useCallback(() => {
    setSelectedModuleKey(null);
    replaceHash(LOGIN_HASH);
  }, []);

  const clearSession = useCallback(() => {
    tokenRef.current = null;
    setToken(null);
    storeToken(null);
    setCurrentUser(null);
    setAuthContext(null);
    setTenantContext(null);
    setTeamMembers(null);
    setTenantSettings(null);
    setCompanyProfile(null);
    setClients(null);
    setProjects(null);
    setAiDeliveryProjects(null);
    setTasks(null);
    setInvoices(null);
    setRecurringInvoices(null);
    setInvoiceItems(null);
    setArchivedInvoiceItems(null);
    setVendors(null);
    setBills(null);
    setTenantModules([]);
    setAvailableModules([]);
    setActivityAuditLogs(null);
    setActivityAuditLogsError(null);
    setAppMessage(null);
    setLoginError(null);
    setModuleActionKey(null);
    setSwitchingTenantMembershipId(null);
    setLoading(false);
  }, []);

  const loadProtectedState = useCallback(
    async (nextToken = token) => {
      if (!nextToken) {
        clearSession();
        redirectToLogin();
        return;
      }

      setLoading(true);
      setAppMessage(null);

      try {
        const [
          meResponse,
          contextResponse,
          tenantsResponse,
          companyProfileResponse,
          clientsResponse,
          projectsResponse,
          aiDeliveryResponse,
          tasksResponse,
          invoicesResponse,
          recurringInvoicesResponse,
          invoiceItemsResponse,
          archivedInvoiceItemsResponse,
          vendorsResponse,
          billsResponse,
          modulesResponse,
          activityAuditLogsResponse,
          tenantModulesResponse,
          teamMembersResponse,
          tenantSettingsResponse
        ] =
          await Promise.all([
            apiRequest<AuthCurrentUserResponse>("/auth/me", { token: nextToken }),
            apiRequest<AuthContextResponse>("/auth/context", { token: nextToken }),
            apiRequest<TenantListResponse>("/tenants", { token: nextToken }),
            apiRequest<CompanyProfileResponse>("/company-profile", { token: nextToken }),
            apiRequest<ClientsResponse>("/clients", { token: nextToken }),
            apiRequest<ProjectsResponse>("/projects", { token: nextToken }),
            apiRequest<AiDeliveryProjectsResponse>("/ai-delivery-projects", { token: nextToken }),
            apiRequest<TasksResponse>("/tasks", { token: nextToken }),
            apiRequest<InvoicesResponse>("/invoices", { token: nextToken }),
            apiRequest<RecurringInvoicesResponse>("/recurring-invoices", { token: nextToken }),
            apiRequest<InvoiceItemsResponse>("/invoice-items", { token: nextToken }),
            apiRequest<InvoiceItemsResponse>("/invoice-items?archived=true", { token: nextToken }),
            apiRequest<VendorsResponse>("/vendors", { token: nextToken }),
            apiRequest<BillsResponse>("/bills", { token: nextToken }),
            apiRequest<ModuleRegistryResponse>("/modules"),
            apiRequest<ActivityAuditLogsResponse>("/activity/audit-logs?limit=5", { token: nextToken }),
            apiRequest<TenantModulesResponse>("/modules/current", { token: nextToken }),
            apiRequest<TenantMembersResponse>("/tenants/current/members", { token: nextToken }),
            apiRequest<TenantSettingsResponse>("/tenants/current/settings", { token: nextToken })
          ]);

        if (!meResponse.ok) {
          clearSession();
          redirectToLogin();
          setLoginError(getErrorMessage(meResponse));
          return;
        }

        if (
          isUnauthorized(contextResponse) ||
          isUnauthorized(tenantsResponse) ||
          isUnauthorized(companyProfileResponse) ||
          isUnauthorized(clientsResponse) ||
          isUnauthorized(projectsResponse) ||
          isUnauthorized(aiDeliveryResponse) ||
          isUnauthorized(tasksResponse) ||
          isUnauthorized(invoicesResponse) ||
          isUnauthorized(recurringInvoicesResponse) ||
          isUnauthorized(invoiceItemsResponse) ||
          isUnauthorized(archivedInvoiceItemsResponse) ||
          isUnauthorized(vendorsResponse) ||
          isUnauthorized(billsResponse) ||
          isUnauthorized(activityAuditLogsResponse) ||
          isUnauthorized(tenantModulesResponse)
        ) {
          clearSession();
          redirectToLogin();
          setLoginError("Your session expired. Please sign in again.");
          return;
        }

        if (tokenRef.current !== nextToken) {
          return;
        }

        setCurrentUser(meResponse.data);
        setAuthContext(contextResponse.ok ? contextResponse.data : null);
        setTenantContext(tenantsResponse.ok ? tenantsResponse.data : null);
        setCompanyProfile(companyProfileResponse.ok ? companyProfileResponse.data : null);
        setClients(clientsResponse.ok ? clientsResponse.data : null);
        setProjects(projectsResponse.ok ? projectsResponse.data : null);
        setAiDeliveryProjects(aiDeliveryResponse.ok ? aiDeliveryResponse.data : null);
        setTasks(tasksResponse.ok ? tasksResponse.data : null);
        setInvoices(invoicesResponse.ok ? invoicesResponse.data : null);
        setRecurringInvoices(recurringInvoicesResponse.ok ? recurringInvoicesResponse.data : null);
        setInvoiceItems(invoiceItemsResponse.ok ? invoiceItemsResponse.data : null);
        setArchivedInvoiceItems(archivedInvoiceItemsResponse.ok ? archivedInvoiceItemsResponse.data : null);
        setVendors(vendorsResponse.ok ? vendorsResponse.data : null);
        setBills(billsResponse.ok ? billsResponse.data : null);
        setAvailableModules(modulesResponse.ok ? modulesResponse.data.modules : []);
        setActivityAuditLogs(activityAuditLogsResponse.ok ? activityAuditLogsResponse.data : null);
        setActivityAuditLogsError(
          activityAuditLogsResponse.ok ? null : getErrorMessage(activityAuditLogsResponse)
        );
        setTenantModules(tenantModulesResponse.ok ? tenantModulesResponse.data.modules : []);
        setTeamMembers(teamMembersResponse.ok ? teamMembersResponse.data : null);
        setTenantSettings(tenantSettingsResponse.ok ? tenantSettingsResponse.data : null);

        if (
          !contextResponse.ok ||
          !tenantsResponse.ok ||
          !companyProfileResponse.ok ||
          !clientsResponse.ok ||
          !projectsResponse.ok ||
          !aiDeliveryResponse.ok ||
          !tasksResponse.ok ||
          !invoicesResponse.ok ||
          !recurringInvoicesResponse.ok ||
          !invoiceItemsResponse.ok ||
          !archivedInvoiceItemsResponse.ok ||
          !vendorsResponse.ok ||
          !billsResponse.ok ||
          !tenantModulesResponse.ok
        ) {
          setAppMessage({
            tone: "error",
            text: "Some protected context could not be loaded."
          });
        }
      } catch (error) {
        setAppMessage({ tone: "error", text: maskError(error) });
      } finally {
        setLoading(false);
      }
    },
    [clearSession, redirectToLogin, token]
  );

  useEffect(() => {
    if (forcePasswordChangeContext) {
      return;
    }
    void loadProtectedState(token);
  }, [forcePasswordChangeContext, loadProtectedState, token]);

  async function handleLogin(email: string, password: string, turnstileToken?: string) {
    setLoginLoading(true);
    setLoginError(null);

    try {
      const response = await apiRequest<AuthLoginResponse>("/auth/login", {
        method: "POST",
        body: { email, password, turnstileToken }
      });

      if (!response.ok) {
        setLoginError(getErrorMessage(response));
        return;
      }

      const nextToken = response.data.session.token;
      tokenRef.current = nextToken;

      if (response.data.user.forcePasswordChange) {
        setForcePasswordChangeContext({ token: nextToken, originalPassword: password });
        setForcePasswordChangeError(null);
        setToken(nextToken);
        storeToken(nextToken);
        return;
      }

      setToken(nextToken);
      storeToken(nextToken);
      setCurrentUser({
        user: response.data.user,
        session: {
          createdAt: new Date().toISOString(),
          expiresAt: response.data.session.expiresAt,
          lastSeenAt: null,
          revokedAt: null
        },
        tenantContext: response.data.tenantContext
      });
      replaceHash(DASHBOARD_HASH);
      await loadProtectedState(nextToken);
    } catch (error) {
      setLoginError(maskError(error));
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleForcePasswordChange(newPassword: string) {
    if (!forcePasswordChangeContext) {
      return;
    }

    setForcePasswordChangeLoading(true);
    setForcePasswordChangeError(null);

    try {
      const response = await apiRequest<{ ok: boolean; message: string }>("/auth/change-password", {
        method: "POST",
        token: forcePasswordChangeContext.token,
        body: {
          oldPassword: forcePasswordChangeContext.originalPassword,
          newPassword
        }
      });

      if (!response.ok) {
        setForcePasswordChangeError(getErrorMessage(response));
        return;
      }

      setForcePasswordChangeContext(null);
      await loadProtectedState(forcePasswordChangeContext.token);
      replaceHash(DASHBOARD_HASH);
    } catch (error) {
      setForcePasswordChangeError(maskError(error));
    } finally {
      setForcePasswordChangeLoading(false);
    }
  }

  async function handleLogout() {
    if (!token) {
      clearSession();
      redirectToLogin();
      return;
    }

    try {
      await apiRequest("/auth/logout", { method: "POST", token });
    } finally {
      clearSession();
      redirectToLogin();
    }
  }

  async function runAuthenticatedRequest<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T> | null> {
    const activeToken = tokenRef.current;
    if (!activeToken) {
      return null;
    }

    const response = await apiRequest<T>(path, {
      ...options,
      token: activeToken
    });

    if (!response.ok && response.error.code === "AUTH_UNAUTHORIZED") {
      clearSession();
      redirectToLogin();
      setLoginError("Your session expired. Please sign in again.");
      return null;
    }

    return response;
  }

  async function handleSwitchTenant(tenantMembershipId: string) {
    if (!token) {
      return;
    }

    setSwitchingTenantMembershipId(tenantMembershipId);
    setAppMessage(null);
    try {
      const response = await apiRequest<TenantListResponse>("/tenants/current/switch", {
        method: "POST",
        body: { tenantMembershipId },
        token
      });

      if (!response.ok) {
        if (response.error.code === "AUTH_UNAUTHORIZED") {
          clearSession();
          redirectToLogin();
          setLoginError("Your session expired. Please sign in again.");
          return;
        }

        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return;
      }

      await loadProtectedState(token);
      setAppMessage({ tone: "success", text: "Tenant context updated." });
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
    } finally {
      setSwitchingTenantMembershipId(null);
    }
  }

  async function handleSetModuleEnabled(moduleKey: string, enabled: boolean) {
    setModuleActionKey(moduleKey);
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest(`/modules/current/${moduleKey}/${enabled ? "enable" : "disable"}`, {
        method: "POST",
      });

      if (!response) {
        return;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: `${moduleKey} ${enabled ? "enabled" : "disabled"}.` });
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
    } finally {
      setModuleActionKey(null);
    }
  }

  async function handleSaveCompanyProfile(values: CompanyProfileFormValues): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<CompanyProfileResponse>("/company-profile", {
        method: "PUT",
        body: values
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Company profile saved." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleSaveClient(clientId: string | null, values: ClientFormValues): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ client: ClientSummary | null }>(
        clientId ? `/clients/${clientId}` : "/clients",
        {
          method: clientId ? "PUT" : "POST",
          body: values
        }
      );

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: clientId ? "Client updated." : "Client created." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleArchiveClient(clientId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ client: ClientSummary | null }>(`/clients/${clientId}/archive`, {
        method: "POST"
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Client archived." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleRestoreClient(clientId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ client: ClientSummary | null }>(`/clients/${clientId}/restore`, {
        method: "POST"
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Client restored." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleLoadClientUserAccess(
    clientId: string,
    options?: { includeArchived?: boolean }
  ): Promise<ClientAccessUserSummary[]> {
    try {
      const query = options?.includeArchived ? "?includeArchived=true" : "";
      const response = await runAuthenticatedRequest<ClientAccessResponse>(`/clients/${clientId}/users${query}`);
      if (!response) return [];
      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return [];
      }
      return response.data.users;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return [];
    }
  }

  async function handleLinkClientUserAccess(clientId: string, userId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest(`/clients/${clientId}/users`, {
        method: "POST",
        body: { userId }
      });
      if (!response) return false;
      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }
      setAppMessage({ tone: "success", text: "Portal access granted." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleArchiveClientUserAccess(clientId: string, userId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest(`/clients/${clientId}/users/${userId}/archive`, {
        method: "POST"
      });
      if (!response) return false;
      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }
      setAppMessage({ tone: "success", text: "Portal access archived." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleSaveProject(projectId: string | null, values: ProjectFormValues): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ project: ProjectSummary | null }>(
        projectId ? `/projects/${projectId}` : "/projects",
        {
          method: projectId ? "PUT" : "POST",
          body: values
        }
      );

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: projectId ? "Project updated." : "Project created." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleArchiveProject(projectId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ project: ProjectSummary | null }>(
        `/projects/${projectId}/archive`,
        {
          method: "POST"
        }
      );

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Project archived." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleArchiveAiDeliveryProject(projectId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ project: AiDeliveryProjectSummary | null }>(
        `/ai-delivery-projects/${projectId}/archive`,
        {
          method: "POST"
        }
      );

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "AI Delivery project archived." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleSaveAiDeliveryProject(projectId: string | null, values: AiDeliveryProjectFormValues): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ aiDeliveryProject: AiDeliveryProjectSummary | null }>(
        projectId ? `/ai-delivery-projects/${projectId}` : "/ai-delivery-projects",
        {
          method: projectId ? "PUT" : "POST",
          body: values
        }
      );

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: projectId ? "AI Delivery project updated." : "AI Delivery project created." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleRequestBriefClientInput(projectId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest(`/ai-delivery-projects/${projectId}/brief/request-client-input`, { method: "POST" });
      if (!response) return false;
      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }
      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Requested client input for brief." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleRequestBriefClientRevision(projectId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest(`/ai-delivery-projects/${projectId}/brief/request-client-revision`, { method: "POST" });
      if (!response) return false;
      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }
      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Requested client revision for brief." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleApproveFinalBrief(projectId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest(`/ai-delivery-projects/${projectId}/brief/approve-final`, { method: "POST" });
      if (!response) return false;
      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }
      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Brief approved final." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  function throwAiDeliveryUiError(message: string): never {
    setAppMessage({ tone: "error", text: message });
    throw new Error(message);
  }

  function throwAiDeliveryResponseError(response: ApiFailure): never {
    throwAiDeliveryUiError(getErrorMessage(response));
  }

  function rethrowAiDeliveryRuntimeError(error: unknown): never {
    if (error instanceof Error) {
      setAppMessage({ tone: "error", text: error.message });
      throw error;
    }

    const message = maskError(error);
    setAppMessage({ tone: "error", text: message });
    throw new Error(message);
  }

  async function handleFetchAiDeliveryBrief(projectId: string): Promise<null | {
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
  }> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ brief: any }>(`/ai-delivery-projects/${projectId}/brief`, { method: "GET" });
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data.brief ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleSaveAiDeliveryBrief(projectId: string, values: {
    clientPriorities?: string | null;
    productsServicesFocus?: string | null;
    targetAudience?: string | null;
    marketsCompetitors?: string | null;
    notes?: string | null;
  }): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ brief: any }>(`/ai-delivery-projects/${projectId}/brief`, { method: "PUT", body: values });
      if (!response) return false;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Brief saved." });
      return true;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleFetchAiDeliveryContentPlan(projectId: string): Promise<AiDeliveryContentPlanSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryContentPlanResponse>(
        `/ai-delivery-projects/${projectId}/content-plan`,
        { method: "GET" }
      );
      if (!response) return null;
      if (!response.ok) {
        // Backend historically returns AI_DELIVERY_PROJECT_NOT_FOUND when the plan row is absent.
        // Treat that GET miss as an empty plan so the UI can show a neutral create state.
        if (isMissingContentPlanFailure(response.error)) {
          return null;
        }
        throwAiDeliveryResponseError(response);
      }
      return response.data.contentPlan ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleCreateAiDeliveryContentPlan(projectId: string): Promise<AiDeliveryContentPlanSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryContentPlanResponse>(
        `/ai-delivery-projects/${projectId}/content-plan`,
        { method: "POST", body: { items: [] } }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: "Monthly content plan created." });
      return response.data.contentPlan ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleSaveAiDeliveryContentPlan(
    projectId: string,
    values: AiDeliveryContentPlanFormValues
  ): Promise<AiDeliveryContentPlanSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryContentPlanResponse>(
        `/ai-delivery-projects/${projectId}/content-plan`,
        { method: "PUT", body: values }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: "Monthly content plan saved." });
      return response.data.contentPlan ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleRequestAiDeliveryContentPlanReview(projectId: string): Promise<AiDeliveryContentPlanSummary | null> {
    return runAiDeliveryContentPlanAction(
      `/ai-delivery-projects/${projectId}/content-plan/request-client-review`,
      "Monthly content plan marked ready for review."
    );
  }

  async function handleApproveAiDeliveryContentPlan(projectId: string): Promise<AiDeliveryContentPlanSummary | null> {
    return runAiDeliveryContentPlanAction(
      `/ai-delivery-projects/${projectId}/content-plan/approve`,
      "Monthly content plan approved."
    );
  }

  async function handleRequestAiDeliveryContentPlanChanges(projectId: string): Promise<AiDeliveryContentPlanSummary | null> {
    return runAiDeliveryContentPlanAction(
      `/ai-delivery-projects/${projectId}/content-plan/request-changes`,
      "Monthly content plan moved back to changes requested."
    );
  }

  async function handleGenerateAiDeliveryContentPlanPdf(projectId: string): Promise<AiDeliveryContentPlanGeneratePdfResponse | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryContentPlanGeneratePdfResponse>(
        `/ai-delivery-projects/${projectId}/content-plan/generate-pdf`,
        { method: "POST" }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: "Content plan PDF generated." });
      return response.data ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleGetAiDeliveryContentPlanDownloadReference(projectId: string): Promise<{ downloadUrl: string } | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryContentPlanDownloadResponse>(
        `/ai-delivery-projects/${projectId}/content-plan/download`
      );
      if (!response) return null;
      if (!response.ok) {
        if (isMissingContentPlanFailure(response.error)) {
          return null;
        }
        throwAiDeliveryResponseError(response);
      }
      return response.data.downloadReference ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function runAiDeliveryContentPlanAction(
    path: string,
    successMessage: string
  ): Promise<AiDeliveryContentPlanSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryContentPlanResponse>(path, { method: "POST" });
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: successMessage });
      return response.data.contentPlan ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleFetchAiDeliveryContentDrafts(projectId: string): Promise<AiDeliveryContentDraftSummary[]> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryContentDraftsResponse>(`/ai-delivery-projects/${projectId}/content-drafts`);
      if (!response) return [];
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data.contentDrafts;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleSaveAiDeliveryContentDraft(
    projectId: string,
    draftId: string | null,
    values: AiDeliveryContentDraftFormValues
  ): Promise<AiDeliveryContentDraftSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryContentDraftResponse>(
        draftId ? `/ai-delivery-projects/${projectId}/content-drafts/${draftId}` : `/ai-delivery-projects/${projectId}/content-drafts`,
        { method: draftId ? "PUT" : "POST", body: values }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: draftId ? "Content draft saved." : "Content draft created." });
      return response.data.contentDraft ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleArchiveAiDeliveryContentDraft(projectId: string, draftId: string): Promise<AiDeliveryContentDraftSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryContentDraftResponse>(`/ai-delivery-projects/${projectId}/content-drafts/${draftId}/archive`, { method: "POST" });
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: "Content draft archived." });
      return response.data.contentDraft ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleRequestAiDeliveryContentDraftReview(projectId: string, draftId: string): Promise<AiDeliveryContentDraftSummary | null> {
    return runContentDraftAction(
      `/ai-delivery-projects/${projectId}/content-drafts/${draftId}/request-client-review`,
      "Content draft client review requested."
    );
  }

  async function handleReturnAiDeliveryContentDraftToDraft(projectId: string, draftId: string): Promise<AiDeliveryContentDraftSummary | null> {
    return runContentDraftAction(
      `/ai-delivery-projects/${projectId}/content-drafts/${draftId}/return-to-draft`,
      "Content draft moved back to draft."
    );
  }

  async function handleFetchAiDeliveryArticleImages(projectId: string): Promise<AiDeliveryArticleImageSummary[]> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryArticleImagesResponse>(`/ai-delivery-projects/${projectId}/article-images`);
      if (!response) return [];
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data.articleImages;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleFetchAiDeliveryDeliverables(projectId: string): Promise<AiDeliveryDeliverableSummary[]> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryDeliverablesResponse>(`/ai-delivery-projects/${projectId}/deliverables`);
      if (!response) return [];
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data.deliverables;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleSaveAiDeliveryDeliverable(
    projectId: string,
    deliverableId: string | null,
    values: Partial<AiDeliveryDeliverableSummary>
  ): Promise<AiDeliveryDeliverableSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryDeliverableResponse>(
        deliverableId ? `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}` : `/ai-delivery-projects/${projectId}/deliverables`,
        { method: deliverableId ? "PUT" : "POST", body: values }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data.deliverable;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleUploadAiDeliveryDeliverableDocument(
    projectId: string,
    deliverableId: string,
    values: AiDeliveryPrivateAssetUploadValues
  ): Promise<AiDeliveryDeliverableSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryDeliverableResponse>(
        `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/document`,
        {
          method: "POST",
          body: {
            contentBase64: await fileToBase64(values.file),
            fileName: values.file.name,
            mimeType: values.file.type
          }
        }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: "Deliverable private document uploaded." });
      return response.data.deliverable;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleOpenAiDeliveryDeliverableDocument(projectId: string, deliverableId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<DocumentDownloadResponse>(
        `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/download`
      );
      if (!response) return false;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      const downloadUrl = response.data.downloadUrl;
      const opened = window.open(downloadUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        window.location.assign(downloadUrl);
      }
      setAppMessage({ tone: "success", text: "Deliverable private document opened." });
      return true;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleFetchAiDeliveryDeliverableReviews(
    projectId: string,
    deliverableId: string
  ): Promise<AiDeliveryDeliverableReviewSummary[]> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryDeliverableReviewsResponse>(
        `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/reviews`
      );
      if (!response) return [];
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data.deliverableReviews;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleSaveAiDeliveryDeliverableReview(
    projectId: string,
    deliverableId: string,
    reviewId: string | null,
    values: AiDeliveryDeliverableReviewFormValues
  ): Promise<AiDeliveryDeliverableReviewSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryDeliverableReviewResponse>(
        reviewId
          ? `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/reviews/${reviewId}`
          : `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/reviews`,
        { method: reviewId ? "PUT" : "POST", body: values }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: reviewId ? "Deliverable review saved." : "Deliverable review placeholder created." });
      return response.data.deliverableReview;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleFetchAiDeliveryWorkflowRuns(projectId: string): Promise<AiDeliveryWorkflowRunSummary[]> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryWorkflowRunsResponse>(`/ai-delivery/projects/${projectId}/workflow-runs`);
      if (!response) return [];
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data.workflowRuns;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleSaveAiDeliveryWorkflowRun(
    projectId: string,
    workflowRunId: string | null,
    values: AiDeliveryWorkflowRunFormValues
  ): Promise<AiDeliveryWorkflowRunSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryWorkflowRunResponse>(
        workflowRunId ? `/ai-delivery/projects/${projectId}/workflow-runs/${workflowRunId}` : `/ai-delivery/projects/${projectId}/workflow-runs`,
        { method: workflowRunId ? "PUT" : "POST", body: values }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: workflowRunId ? "Workflow run saved." : "Workflow run created." });
      return response.data.workflowRun;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleExecuteAiDeliveryWorkflowRun(
    projectId: string,
    workflowRunId: string,
    input?: { contentPlanItemId?: string | null }
  ): Promise<AiDeliveryWorkflowRunSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryWorkflowRunResponse>(
        `/ai-delivery/projects/${projectId}/workflow-runs/${workflowRunId}/execute`,
        { method: "POST", body: input }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      const executedRun = response.data.workflowRun;
      setAppMessage({
        tone: executedRun?.status === "FAILED" ? "error" : "success",
        text: executedRun?.status === "FAILED"
          ? "Workflow run failed in controlled stub mode."
          : input?.contentPlanItemId
            ? "Admin content draft generation completed in controlled mode."
            : "Workflow run executed in controlled stub mode."
      });
      return executedRun;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleFetchAiKnowledgeItems(projectId: string) {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ knowledgeItems: import("@dca-os-v1/shared").AiKnowledgeItemSummary[] }>(
        `/ai-operating-layer/knowledge-items?aiDeliveryProjectId=${encodeURIComponent(projectId)}`
      );
      if (!response) return [];
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data.knowledgeItems;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleCreateAiKnowledgeItem(input: import("@dca-os-v1/shared").AiKnowledgeItemInputRequest) {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ knowledgeItem: import("@dca-os-v1/shared").AiKnowledgeItemSummary }>(
        "/ai-operating-layer/knowledge-items",
        { method: "POST", body: input }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: "Knowledge item created." });
      return response.data.knowledgeItem;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleUpdateAiKnowledgeItem(id: string, input: import("@dca-os-v1/shared").AiKnowledgeItemInputRequest) {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ knowledgeItem: import("@dca-os-v1/shared").AiKnowledgeItemSummary }>(
        `/ai-operating-layer/knowledge-items/${id}`,
        { method: "PUT", body: input }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: "Knowledge item updated." });
      return response.data.knowledgeItem;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handlePreviewAiContext(input: import("@dca-os-v1/shared").AiContextPreviewInputRequest) {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<import("@dca-os-v1/shared").AiContextPreviewResponse>(
        "/ai-operating-layer/context-preview",
        { method: "POST", body: input }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleFetchAiDeliveryResearchRequests(projectId: string): Promise<AiDeliveryResearchRequestSummary[]> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryResearchRequestsResponse>(`/ai-delivery/projects/${projectId}/research-requests`);
      if (!response) return [];
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data.researchRequests;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleSaveAiDeliveryResearchRequest(
    projectId: string,
    researchRequestId: string | null,
    values: AiDeliveryResearchRequestFormValues
  ): Promise<AiDeliveryResearchRequestSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryResearchRequestResponse>(
        researchRequestId
          ? `/ai-delivery/projects/${projectId}/research-requests/${researchRequestId}`
          : `/ai-delivery/projects/${projectId}/research-requests`,
        { method: researchRequestId ? "PUT" : "POST", body: values }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: researchRequestId ? "Research request saved." : "Research request created." });
      return response.data.researchRequest;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleFetchAiDeliveryResearchSources(
    projectId: string,
    researchRequestId?: string | null
  ): Promise<AiDeliveryResearchSourceSummary[]> {
    setAppMessage(null);
    try {
      const params = new URLSearchParams();
      if (researchRequestId) {
        params.set("researchRequestId", researchRequestId);
      }
      const suffix = params.size > 0 ? `?${params.toString()}` : "";
      const response = await runAuthenticatedRequest<AiDeliveryResearchSourcesResponse>(
        `/ai-delivery/projects/${projectId}/research-sources${suffix}`
      );
      if (!response) return [];
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data.researchSources;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleSaveAiDeliveryResearchSource(
    projectId: string,
    researchSourceId: string | null,
    values: AiDeliveryResearchSourceFormValues
  ): Promise<AiDeliveryResearchSourceSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryResearchSourceResponse>(
        researchSourceId
          ? `/ai-delivery/projects/${projectId}/research-sources/${researchSourceId}`
          : `/ai-delivery/projects/${projectId}/research-sources`,
        { method: researchSourceId ? "PUT" : "POST", body: values }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: researchSourceId ? "Research source saved." : "Research source created." });
      return response.data.researchSource;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleFetchAiDeliveryResearchSummaries(projectId: string): Promise<AiDeliveryResearchSummarySummary[]> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryResearchSummariesResponse>(`/ai-delivery/projects/${projectId}/research-summaries`);
      if (!response) return [];
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data.researchSummaries;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleSaveAiDeliveryResearchSummary(
    projectId: string,
    researchSummaryId: string | null,
    values: AiDeliveryResearchSummaryFormValues
  ): Promise<AiDeliveryResearchSummarySummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryResearchSummaryResponse>(
        researchSummaryId
          ? `/ai-delivery/projects/${projectId}/research-summaries/${researchSummaryId}`
          : `/ai-delivery/projects/${projectId}/research-summaries`,
        { method: researchSummaryId ? "PUT" : "POST", body: values }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: researchSummaryId ? "Research summary saved." : "Research summary created." });
      return response.data.researchSummary;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleApplyAiDeliveryResearchSummaryToBrief(
    projectId: string,
    researchSummaryId: string
  ): Promise<AiDeliveryResearchSummaryApplyResponse | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryResearchSummaryApplyResponse>(
        `/ai-delivery/projects/${projectId}/research-summaries/${researchSummaryId}/apply-to-brief`,
        { method: "POST" }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: "Research summary copied into brief notes." });
      return response.data;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleFetchAiDeliveryMiContext(projectId: string): Promise<AiDeliveryMiHandoffSummary[]> {
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMiContextResponse>(`/ai-delivery/projects/${projectId}/market-intelligence-context`);
      if (!response) return [];
      if (!response.ok) throwAiDeliveryResponseError(response);
      return response.data.handoffs;
    } catch {
      return [];
    }
  }

  async function handleApplyAiDeliveryMiHandoff(projectId: string, handoffId: string): Promise<AiDeliveryMiHandoffSummary[]> {
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMiContextResponse>(
        `/ai-delivery/projects/${projectId}/market-intelligence-context/apply`,
        { method: "POST", body: { handoffId } }
      );
      if (!response) return [];
      if (!response.ok) throwAiDeliveryResponseError(response);
      setAppMessage({ tone: "success", text: "Market Intelligence handoff applied." });
      return response.data.handoffs;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleRemoveAiDeliveryMiHandoff(projectId: string, handoffId: string): Promise<AiDeliveryMiHandoffSummary[]> {
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMiContextResponse>(
        `/ai-delivery/projects/${projectId}/market-intelligence-context/${handoffId}/remove`,
        { method: "POST" }
      );
      if (!response) return [];
      if (!response.ok) throwAiDeliveryResponseError(response);
      setAppMessage({ tone: "success", text: "Market Intelligence handoff removed." });
      return response.data.handoffs;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleArchiveAiDeliveryDeliverable(projectId: string, deliverableId: string): Promise<boolean> {
    const deliverable = await runDeliverableAction(
      `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/archive`,
      "Deliverable archived."
    );
    return !!deliverable;
  }

  async function handleRestoreAiDeliveryDeliverable(projectId: string, deliverableId: string): Promise<AiDeliveryDeliverableSummary | null> {
    return runDeliverableAction(
      `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/restore`,
      "Deliverable restored to draft."
    );
  }

  async function handleMarkAiDeliveryDeliverableReady(projectId: string, deliverableId: string): Promise<AiDeliveryDeliverableSummary | null> {
    return runDeliverableAction(
      `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/mark-ready`,
      "Deliverable marked ready."
    );
  }

  async function handleRequestAiDeliveryDeliverableRevision(projectId: string, deliverableId: string): Promise<AiDeliveryDeliverableSummary | null> {
    return runDeliverableAction(
      `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/request-revision`,
      "Deliverable moved to revision requested."
    );
  }

  async function handleAcceptAiDeliveryDeliverable(projectId: string, deliverableId: string): Promise<AiDeliveryDeliverableSummary | null> {
    return runDeliverableAction(
      `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/accept`,
      "Deliverable accepted for internal packaging."
    );
  }

  async function runDeliverableAction(path: string, successMessage: string): Promise<AiDeliveryDeliverableSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryDeliverableResponse>(path, { method: "POST" });
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: successMessage });
      return response.data.deliverable;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleSaveAiDeliveryArticleImage(
    projectId: string,
    imageId: string | null,
    values: AiDeliveryArticleImageFormValues
  ): Promise<AiDeliveryArticleImageSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryArticleImageResponse>(
        imageId ? `/ai-delivery-projects/${projectId}/article-images/${imageId}` : `/ai-delivery-projects/${projectId}/article-images`,
        { method: imageId ? "PUT" : "POST", body: values }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: imageId ? "Article image request saved." : "Article image request created." });
      return response.data.articleImage ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleArchiveAiDeliveryArticleImage(projectId: string, imageId: string): Promise<AiDeliveryArticleImageSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryArticleImageResponse>(`/ai-delivery-projects/${projectId}/article-images/${imageId}/archive`, { method: "POST" });
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: "Article image request archived." });
      return response.data.articleImage ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleMarkAiDeliveryArticleImagePreviewReady(projectId: string, imageId: string): Promise<AiDeliveryArticleImageSummary | null> {
    return runArticleImageAction(
      `/ai-delivery-projects/${projectId}/article-images/${imageId}/mark-preview-ready`,
      "Article image marked preview ready."
    );
  }

  async function handleRequestAiDeliveryArticleImageChanges(projectId: string, imageId: string): Promise<AiDeliveryArticleImageSummary | null> {
    return runArticleImageAction(
      `/ai-delivery-projects/${projectId}/article-images/${imageId}/request-changes`,
      "Article image moved to changes requested."
    );
  }

  async function handleApproveAiDeliveryArticleImage(projectId: string, imageId: string): Promise<AiDeliveryArticleImageSummary | null> {
    return runArticleImageAction(
      `/ai-delivery-projects/${projectId}/article-images/${imageId}/approve`,
      "Article image approved."
    );
  }

  async function handleMarkAiDeliveryArticleImageFinalReady(projectId: string, imageId: string): Promise<AiDeliveryArticleImageSummary | null> {
    return runArticleImageAction(
      `/ai-delivery-projects/${projectId}/article-images/${imageId}/mark-final-ready`,
      "Article image marked final ready."
    );
  }

  async function handleUploadAiDeliveryArticleImageFinalAsset(
    projectId: string,
    imageId: string,
    values: AiDeliveryPrivateAssetUploadValues
  ): Promise<AiDeliveryArticleImageSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryArticleImageResponse>(
        `/ai-delivery-projects/${projectId}/article-images/${imageId}/final-image`,
        {
          method: "POST",
          body: {
            contentBase64: await fileToBase64(values.file),
            fileName: values.file.name,
            mimeType: values.file.type
          }
        }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: "Article image private final asset uploaded." });
      return response.data.articleImage ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleOpenAiDeliveryArticleImage(projectId: string, imageId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<DocumentDownloadResponse>(
        `/ai-delivery-projects/${projectId}/article-images/${imageId}/download`
      );
      if (!response) return false;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      const downloadUrl = response.data.downloadUrl;
      const opened = window.open(downloadUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        window.location.assign(downloadUrl);
      }
      setAppMessage({ tone: "success", text: "Article image private final asset opened." });
      return true;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function runArticleImageAction(path: string, successMessage: string): Promise<AiDeliveryArticleImageSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryArticleImageResponse>(path, { method: "POST" });
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: successMessage });
      return response.data.articleImage ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleFetchAiDeliveryMonthlyComputedSummary(projectId: string): Promise<AiDeliveryMonthlySummaryData | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMonthlySummaryResponse>(
        `/ai-delivery/reports/monthly-summary?projectId=${encodeURIComponent(projectId)}`
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      const s = response.data.summary;
      return {
        project: s.project,
        deliverables: s.deliverables,
        totals: s.totals,
        contentPlanItems: s.contentPlanItems,
        gaGscMetricsStatus: s.deferred.gaGscMetricsStatus,
        trendMonthsStatus: s.deferred.trendMonthsStatus,
        recommendationsStatus: s.deferred.recommendationsStatus
      };
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleFetchAiDeliveryMonthlyReport(projectId: string): Promise<AiDeliveryMonthlyReportData | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMonthlyReportResponse>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(projectId)}`
      );
      if (!response) return null;
      if (!response.ok) {
        const code = response.error.code;
        if (code === "AI_DELIVERY_MONTHLY_REPORT_NOT_FOUND" || code === "AI_DELIVERY_PROJECT_NOT_FOUND") {
          return null;
        }
        throwAiDeliveryResponseError(response);
      }
      return response.data.report ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleCreateAiDeliveryMonthlyReport(projectId: string): Promise<AiDeliveryMonthlyReportData | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMonthlyReportResponse>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(projectId)}`,
        { method: "POST" }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: "Monthly report created." });
      return response.data.report ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleUpdateAiDeliveryMonthlyReport(reportId: string, values: AiDeliveryMonthlyReportFormValues): Promise<AiDeliveryMonthlyReportData | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMonthlyReportResponse>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(reportId)}/update`,
        { method: "PUT", body: values }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: "Monthly report saved." });
      return response.data.report ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleSetAiDeliveryMonthlyReportStatus(reportId: string, status: string): Promise<AiDeliveryMonthlyReportData | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMonthlyReportResponse>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(reportId)}/status`,
        { method: "POST", body: { status } }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data.report ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleArchiveAiDeliveryMonthlyReport(reportId: string): Promise<AiDeliveryMonthlyReportData | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMonthlyReportResponse>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(reportId)}/archive`,
        { method: "POST" }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: "Monthly report archived." });
      return response.data.report ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleRestoreAiDeliveryMonthlyReport(reportId: string): Promise<AiDeliveryMonthlyReportData | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMonthlyReportResponse>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(reportId)}/restore`,
        { method: "POST" }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: "Monthly report restored." });
      return response.data.report ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleGenerateAiDeliveryMonthlyReportPdf(reportId: string): Promise<AiDeliveryMonthlyReportGeneratePdfSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMonthlyReportGeneratePdfResponse>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(reportId)}/generate-pdf`,
        { method: "POST" }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: "Monthly report PDF generated." });
      return response.data.report ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleUploadAiDeliveryMonthlyReportDocument(reportId: string, file: File): Promise<AiDeliveryMonthlyReportData | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMonthlyReportResponse>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(reportId)}/document`,
        {
          method: "POST",
          body: {
            contentBase64: await fileToBase64(file),
            fileName: file.name,
            mimeType: file.type
          }
        }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: "Report document uploaded." });
      return response.data.report ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleGetAiDeliveryMonthlyReportDownloadReference(reportId: string): Promise<{ downloadUrl: string } | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ downloadReference: { downloadUrl: string; expiresSeconds: number } | null }>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(reportId)}/download`
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data.downloadReference ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleFetchAiDeliveryMonthlyMetrics(reportId: string): Promise<AiDeliveryMonthlyMetricsSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMonthlyMetricsResponse>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(reportId)}/metrics`
      );
      if (!response) return null;
      if (!response.ok) {
        if (response.error.code === "AI_DELIVERY_MONTHLY_REPORT_NOT_FOUND") {
          return null;
        }
        throwAiDeliveryResponseError(response);
      }
      return response.data.metrics ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleImportAiDeliveryMonthlyMetrics(
    reportId: string,
    values: MonthlyMetricSnapshotFormValues
  ): Promise<AiDeliveryMonthlyMetricSnapshotSummary | null> {
    setAppMessage(null);
    try {
      const trimmedTargetMonth = values.targetMonth.trim();
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(trimmedTargetMonth)) {
        throw new Error("Target month must use YYYY-MM format.");
      }

      const response = await runAuthenticatedRequest<AiDeliveryMonthlyMetricSnapshotResponse>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(reportId)}/metrics/import`,
        {
          method: "POST",
          body: {
            targetMonth: trimmedTargetMonth,
            sourceType: values.sourceType,
            status: values.status,
            gscClicks: parseOptionalNumber(values.gscClicks),
            gscImpressions: parseOptionalNumber(values.gscImpressions),
            gscAverageCtr: parseOptionalNumber(values.gscAverageCtr),
            gscAveragePosition: parseOptionalNumber(values.gscAveragePosition),
            ga4Sessions: parseOptionalNumber(values.ga4Sessions),
            ga4Users: parseOptionalNumber(values.ga4Users),
            ga4PageViews: parseOptionalNumber(values.ga4PageViews),
            notes: values.notes.trim() || undefined
          }
        }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data.snapshot ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleApproveAiDeliveryMonthlyMetrics(
    reportId: string,
    snapshotId: string
  ): Promise<AiDeliveryMonthlyMetricSnapshotSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMonthlyMetricSnapshotResponse>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(reportId)}/metrics/${encodeURIComponent(snapshotId)}/approve`,
        { method: "POST" }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data.snapshot ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleArchiveAiDeliveryMonthlyMetrics(
    reportId: string,
    snapshotId: string
  ): Promise<AiDeliveryMonthlyMetricSnapshotSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMonthlyMetricSnapshotResponse>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(reportId)}/metrics/${encodeURIComponent(snapshotId)}/archive`,
        { method: "POST" }
      );
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      return response.data.snapshot ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleFetchAiDeliveryMonthlyReportMiContext(reportId: string): Promise<AiDeliveryMonthlyReportMiContext | null> {
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMonthlyReportMiContext>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(reportId)}/mi-context`
      );
      if (!response) return null;
      if (!response.ok) return null;
      return response.data;
    } catch {
      return null;
    }
  }

  async function handleApplyMiHandoffToMonthlyReport(reportId: string, handoffId: string): Promise<AiDeliveryMonthlyReportMiContext | null> {
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMonthlyReportMiContext>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(reportId)}/mi-context/apply`,
        { method: "POST", body: { handoffId } }
      );
      if (!response) return null;
      if (!response.ok) throw new Error("Unable to apply MI handoff.");
      return response.data;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleUpdateAiDeliveryMonthlyReportMiContextDraft(reportId: string, miContextDraft: string): Promise<AiDeliveryMonthlyReportMiContext | null> {
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMonthlyReportMiContext>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(reportId)}/mi-context/draft`,
        { method: "POST", body: { miContextDraft } }
      );
      if (!response) return null;
      if (!response.ok) throw new Error("Unable to update MI context draft.");
      return response.data;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleRemoveMiHandoffFromMonthlyReport(reportId: string): Promise<AiDeliveryMonthlyReportMiContext | null> {
    try {
      const response = await runAuthenticatedRequest<AiDeliveryMonthlyReportMiContext>(
        `/ai-delivery/reports/monthly/${encodeURIComponent(reportId)}/mi-context/remove`,
        { method: "POST" }
      );
      if (!response) return null;
      if (!response.ok) return null;
      return response.data;
    } catch {
      return null;
    }
  }

  async function runContentDraftAction(path: string, successMessage: string, body?: unknown): Promise<AiDeliveryContentDraftSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AiDeliveryContentDraftResponse>(path, { method: "POST", body });
      if (!response) return null;
      if (!response.ok) {
        throwAiDeliveryResponseError(response);
      }
      setAppMessage({ tone: "success", text: successMessage });
      return response.data.contentDraft ?? null;
    } catch (error) {
      return rethrowAiDeliveryRuntimeError(error);
    }
  }

  async function handleRestoreProject(projectId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ project: ProjectSummary | null }>(`/projects/${projectId}/restore`, {
        method: "POST"
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Project restored." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleSaveTask(taskId: string | null, values: TaskFormValues): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ task: TaskSummary | null }>(
        taskId ? `/tasks/${taskId}` : "/tasks",
        {
          method: taskId ? "PUT" : "POST",
          body: values
        }
      );

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: taskId ? "Task updated." : "Task created." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleArchiveTask(taskId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ task: TaskSummary | null }>(`/tasks/${taskId}/archive`, {
        method: "POST"
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Task archived." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleRestoreTask(taskId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ task: TaskSummary | null }>(`/tasks/${taskId}/restore`, {
        method: "POST"
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Task restored." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleSaveInvoice(invoiceId: string | null, values: InvoiceFormValues): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ invoice: InvoiceSummary | null }>(
        invoiceId ? `/invoices/${invoiceId}` : "/invoices",
        {
          method: invoiceId ? "PUT" : "POST",
          body: values
        }
      );

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: invoiceId ? "Invoice updated." : "Invoice created." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleArchiveInvoice(invoiceId: string): Promise<boolean> {
    return runInvoiceAction(`/invoices/${invoiceId}/archive`, "Invoice archived.");
  }

  async function handleMarkInvoiceSent(invoiceId: string): Promise<boolean> {
    return runInvoiceAction(`/invoices/${invoiceId}/mark-sent`, "Invoice marked sent.");
  }

  async function handleCancelInvoice(invoiceId: string): Promise<boolean> {
    return runInvoiceAction(`/invoices/${invoiceId}/cancel`, "Invoice cancelled.");
  }

  async function handleMarkInvoiceUncollectible(invoiceId: string): Promise<boolean> {
    return runInvoiceAction(`/invoices/${invoiceId}/mark-uncollectible`, "Invoice marked uncollectible.");
  }

  async function handleRegisterInvoicePayment(
    invoiceId: string,
    values: InvoicePaymentFormValues
  ): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ invoice: InvoiceSummary | null }>(`/invoices/${invoiceId}/payment`, {
        method: "POST",
        body: values
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Payment registered." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function runInvoiceAction(path: string, successMessage: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ invoice: InvoiceSummary | null }>(path, {
        method: "POST"
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: successMessage });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleSaveCreditNote(
    invoiceId: string,
    creditNoteId: string | null,
    values: CreditNoteFormValues
  ): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ creditNote: CreditNoteSummary | null }>(
        creditNoteId ? `/credit-notes/${creditNoteId}` : `/invoices/${invoiceId}/credit-notes`,
        {
          method: creditNoteId ? "PUT" : "POST",
          body: values
        }
      );

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: creditNoteId ? "Credit note updated." : "Credit note created." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleIssueCreditNote(creditNoteId: string): Promise<boolean> {
    return runCreditNoteAction(`/credit-notes/${creditNoteId}/issue`, "Credit note issued.");
  }

  async function handleVoidCreditNote(creditNoteId: string): Promise<boolean> {
    return runCreditNoteAction(`/credit-notes/${creditNoteId}/void`, "Credit note voided.");
  }

  async function runCreditNoteAction(path: string, successMessage: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ creditNote: CreditNoteSummary | null }>(path, {
        method: "POST"
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: successMessage });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleSaveInvoiceItem(
    invoiceItemId: string | null,
    values: InvoiceItemFormValues
  ): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ invoiceItem: InvoiceItemSummary | null }>(
        invoiceItemId ? `/invoice-items/${invoiceItemId}` : "/invoice-items",
        {
          method: invoiceItemId ? "PUT" : "POST",
          body: values
        }
      );

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: invoiceItemId ? "Service updated." : "Service created." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleArchiveInvoiceItem(invoiceItemId: string): Promise<boolean> {
    return runInvoiceItemAction(`/invoice-items/${invoiceItemId}/archive`, "Service archived.");
  }

  async function handleRestoreInvoiceItem(invoiceItemId: string): Promise<boolean> {
    return runInvoiceItemAction(`/invoice-items/${invoiceItemId}/restore`, "Service restored.");
  }

  async function runInvoiceItemAction(path: string, successMessage: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ invoiceItem: InvoiceItemSummary | null }>(path, {
        method: "POST"
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: successMessage });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleSaveRecurringInvoice(
    recurringInvoiceId: string | null,
    values: RecurringInvoiceFormValues
  ): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ recurringInvoice: RecurringInvoiceSummary | null }>(
        recurringInvoiceId ? `/recurring-invoices/${recurringInvoiceId}` : "/recurring-invoices",
        {
          method: recurringInvoiceId ? "PUT" : "POST",
          body: values
        }
      );

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({
        tone: "success",
        text: recurringInvoiceId ? "Recurring invoice updated." : "Recurring invoice created."
      });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleArchiveRecurringInvoice(recurringInvoiceId: string): Promise<boolean> {
    return runRecurringInvoiceAction(`/recurring-invoices/${recurringInvoiceId}/archive`, "Recurring invoice archived.");
  }

  async function handleGenerateDueRecurringInvoice(recurringInvoiceId: string, targetDate: string): Promise<boolean> {
    return runRecurringInvoiceAction(
      `/recurring-invoices/${recurringInvoiceId}/generate-due`,
      "Due recurring invoice generated.",
      { targetDate }
    );
  }

  async function runRecurringInvoiceAction(
    path: string,
    successMessage: string,
    body?: { targetDate: string }
  ): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ recurringInvoice: RecurringInvoiceSummary | null }>(path, {
        method: "POST",
        body
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: successMessage });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleCreateVendor(values: VendorFormValues): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ vendor: VendorSummary | null }>("/vendors", {
        method: "POST",
        body: values
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Vendor created." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleSaveVendor(vendorId: string | null, values: VendorFormValues): Promise<boolean> {
    if (!vendorId) {
      return handleCreateVendor(values);
    }

    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ vendor: VendorSummary | null }>(`/vendors/${vendorId}`, {
        method: "PUT",
        body: values
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Vendor updated." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleArchiveVendor(vendorId: string): Promise<boolean> {
    return runVendorAction(`/vendors/${vendorId}/archive`, "Vendor archived.");
  }

  async function handleRestoreVendor(vendorId: string): Promise<boolean> {
    return runVendorAction(`/vendors/${vendorId}/restore`, "Vendor restored.");
  }

  async function handleSaveBill(billId: string | null, values: BillFormValues): Promise<BillSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ bill: BillSummary | null }>(
        billId ? `/bills/${billId}` : "/bills",
        {
          method: billId ? "PUT" : "POST",
          body: values
        }
      );

      if (!response) {
        return null;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return null;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: billId ? "Bill updated." : "Bill created." });
      return response.data.bill;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return null;
    }
  }

  async function handleUploadBillDocument(
    billId: string,
    values: BillDocumentUploadValues
  ): Promise<BillSummary | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ bill: BillSummary | null }>(`/bills/${billId}/document`, {
        method: "POST",
        body: {
          contentBase64: await fileToBase64(values.file),
          fileName: values.file.name,
          mimeType: values.file.type
        }
      });

      if (!response) {
        return null;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return null;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Bill document uploaded." });
      return response.data.bill;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return null;
    }
  }

  async function handleArchiveBill(billId: string): Promise<boolean> {
    return runBillAction(`/bills/${billId}/archive`, "Bill archived.");
  }

  async function handleRestoreBill(billId: string): Promise<boolean> {
    return runBillAction(`/bills/${billId}/restore`, "Bill restored.");
  }

  async function runBillAction(path: string, successMessage: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ bill: BillSummary | null }>(path, {
        method: "POST"
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: successMessage });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function runVendorAction(path: string, successMessage: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ vendor: VendorSummary | null }>(path, {
        method: "POST"
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: successMessage });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleCreateAdminUser(
    email: string,
    name: string,
    roleKey: string,
    clientId?: string
  ): Promise<AdminUserResult | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AdminUserResult>("/auth/create-user", {
        method: "POST",
        body: {
          email,
          name: name || undefined,
          roleKey,
          ...(clientId ? { clientId } : {})
        }
      });

      if (!response) {
        return null;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return null;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "User created successfully." });
      return response.data;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return null;
    }
  }

  async function handleResetUserPassword(userId: string): Promise<AdminUserResult | null> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<AdminUserResult>(`/auth/reset-password/${userId}`, {
        method: "POST"
      });

      if (!response) {
        return null;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return null;
      }

      setAppMessage({ tone: "success", text: "Password reset. Share the temporary password securely." });
      return response.data;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return null;
    }
  }

  const canManageModules = hasModuleAdminAccess(authContext);
  const canManageCore = hasActiveRole(authContext, ["owner", "admin"]);
  const currentTenant = tenantContext?.currentTenant?.tenant ?? null;
  const isClientOnlyViewer = isClientOnlyRole(authContext?.tenantContext.roles ?? []);
  const layoutNavigationItems = isClientOnlyViewer
    ? clientNavigationItems
    : filterNavigationByRole(navigationItems, authContext);
  const isClientPortalView =
    activeView === "client-portal" || (isClientOnlyViewer && CLIENT_PORTAL_SHELL_VIEWS.has(activeView));

  if (!token || !currentUser) {
    if (token && forcePasswordChangeContext) {
      return (
        <ForcePasswordChangeModal
          error={forcePasswordChangeError}
          loading={forcePasswordChangeLoading}
          onSubmit={handleForcePasswordChange}
        />
      );
    }
    return <LoginScreen error={loginError} loading={loginLoading || loading} onLogin={handleLogin} />;
  }

  return (
    <AppLayout
      activeView={activeView}
      currentTenant={currentTenant}
      isClientRole={isClientOnlyViewer}
      navigationItems={layoutNavigationItems}
      onLogout={() => void handleLogout()}
      shellVariant={isClientPortalView ? "portal" : "admin"}
      user={currentUser.user}
    >
      {appMessage ? (
        <StatusNotice
          message={appMessage.text}
          tone={appMessage.tone}
          onDismiss={appMessage.tone !== "error" ? () => setAppMessage(null) : undefined}
        />
      ) : null}
      {loading ? <div className="state-panel">Loading</div> : null}
      {!loading && activeView === "dashboard" ? (
        <DashboardView
          activityAuditLogs={activityAuditLogs}
          activityAuditLogsError={activityAuditLogsError}
          activityAuditLogsLoading={loading}
          context={authContext}
          tenants={tenantContext}
          user={currentUser.user}
        />
      ) : null}
      {!loading && activeView === "tenants" ? (
        <TenantView
          onSwitchTenant={handleSwitchTenant}
          switchingTenantMembershipId={switchingTenantMembershipId}
          tenants={tenantContext}
        />
      ) : null}
      {!loading && activeView === "modules" ? (
        <ModuleRegistryView
          availableModules={availableModules}
          canManageModules={canManageModules}
          moduleActionKey={moduleActionKey}
          onSetModuleEnabled={handleSetModuleEnabled}
          selectedModuleKey={selectedModuleKey}
          tenantModules={tenantModules}
        />
      ) : null}
      {!loading && activeView === "company-profile" ? (
        <CompanyProfilePage
          canEdit={canManageCore}
          companyProfile={companyProfile?.companyProfile ?? null}
          error={null}
          loading={false}
          onSave={handleSaveCompanyProfile}
        />
      ) : null}
      {!loading && activeView === "client-portal" ? (
        <ClientPortalRouter />
      ) : null}
      {!loading && activeView === "briefs" ? <BriefPage /> : null}
      {!loading && activeView === "pending-approvals" ? <PendingApprovalsPage /> : null}
      {!loading && activeView === "monthly-reports" ? <MonthlyReportsPage /> : null}
      {!loading && activeView === "archive" ? <ArchiveHubPage /> : null}
      {!loading && activeView === "briefs-panel" ? <BriefPanelPage /> : null}
      {!loading && activeView === "workflow-briefs" ? <WorkflowBriefsPage canManageAi={canManageCore} /> : null}
      {!loading && activeView === "clients" ? (
        selectedClientHubId ? (
          <ClientHubPage
            canEdit={canManageCore}
            client={
              clients?.clients.find((client) => client.id === selectedClientHubId) ?? {
                id: selectedClientHubId,
                name: "Client",
                email: null,
                website: null,
                contactPerson: null,
                billingAddress: null,
                taxId: null,
                country: null,
                clientKind: "AGENCY_CLIENT",
                legalEntityName: null,
                accountGroupName: null,
                migrationStatus: "ACTIVE",
                isArchived: false,
                projectCount: 0,
                createdAt: "",
                updatedAt: ""
              }
            }
            onArchiveUserAccess={handleArchiveClientUserAccess}
            onBack={() => setSelectedClientHubId(null)}
            onLinkUserAccess={handleLinkClientUserAccess}
            onLoadUserAccess={handleLoadClientUserAccess}
            tenantUsers={(teamMembers?.members ?? []).map((member) => member.user)}
          />
        ) : (
          <ClientsPage
            canEdit={canManageCore}
            clients={clients?.clients ?? []}
            error={null}
            loading={false}
            onArchive={handleArchiveClient}
            onArchiveUserAccess={handleArchiveClientUserAccess}
            onLoadUserAccess={handleLoadClientUserAccess}
            onLinkUserAccess={handleLinkClientUserAccess}
            onOpenHub={(client) => setSelectedClientHubId(client.id)}
            onRestore={handleRestoreClient}
            onSave={handleSaveClient}
            projects={projects?.projects ?? []}
            tenantUsers={(teamMembers?.members ?? []).map((member) => member.user)}
          />
        )
      ) : null}
      {!loading && activeView === "projects" ? (
        <ProjectsPage
          canEdit={canManageCore}
          clients={clients?.clients ?? []}
          error={null}
          loading={false}
          onArchive={handleArchiveProject}
          onRestore={handleRestoreProject}
          onSave={handleSaveProject}
          projects={projects?.projects ?? []}
          tasks={tasks?.tasks ?? []}
        />
      ) : null}
      {!loading && activeView === "ai-delivery" ? (
        <AiDeliveryPage
          canEdit={canManageCore}
          projects={aiDeliveryProjects?.aiDeliveryProjects ?? []}
          clients={clients?.clients ?? []}
          projectsList={projects?.projects ?? []}
          error={null}
          loading={false}
          onArchive={handleArchiveAiDeliveryProject}
          onSave={handleSaveAiDeliveryProject}
          onRequestClientInput={handleRequestBriefClientInput}
          onRequestClientRevision={handleRequestBriefClientRevision}
          onApproveFinal={handleApproveFinalBrief}
          onFetchBrief={handleFetchAiDeliveryBrief}
          onSaveBrief={handleSaveAiDeliveryBrief}
          onFetchContentPlan={handleFetchAiDeliveryContentPlan}
          onCreateContentPlan={handleCreateAiDeliveryContentPlan}
          onSaveContentPlan={handleSaveAiDeliveryContentPlan}
          onRequestContentPlanReview={handleRequestAiDeliveryContentPlanReview}
          onApproveContentPlan={handleApproveAiDeliveryContentPlan}
          onRequestContentPlanChanges={handleRequestAiDeliveryContentPlanChanges}
          onGenerateContentPlanPdf={handleGenerateAiDeliveryContentPlanPdf}
          onDownloadContentPlanDocument={handleGetAiDeliveryContentPlanDownloadReference}
          onFetchContentDrafts={handleFetchAiDeliveryContentDrafts}
          onSaveContentDraft={handleSaveAiDeliveryContentDraft}
          onArchiveContentDraft={handleArchiveAiDeliveryContentDraft}
          onRequestContentDraftReview={handleRequestAiDeliveryContentDraftReview}
          onReturnContentDraftToDraft={handleReturnAiDeliveryContentDraftToDraft}
          onFetchArticleImages={handleFetchAiDeliveryArticleImages}
          onSaveArticleImage={handleSaveAiDeliveryArticleImage}
          onArchiveArticleImage={handleArchiveAiDeliveryArticleImage}
          onUploadArticleImageFinalAsset={handleUploadAiDeliveryArticleImageFinalAsset}
          onOpenArticleImage={handleOpenAiDeliveryArticleImage}
          onMarkArticleImagePreviewReady={handleMarkAiDeliveryArticleImagePreviewReady}
          onRequestArticleImageChanges={handleRequestAiDeliveryArticleImageChanges}
          onApproveArticleImage={handleApproveAiDeliveryArticleImage}
          onMarkArticleImageFinalReady={handleMarkAiDeliveryArticleImageFinalReady}
          onFetchDeliverables={handleFetchAiDeliveryDeliverables}
          onSaveDeliverable={handleSaveAiDeliveryDeliverable}
          onUploadDeliverableDocument={handleUploadAiDeliveryDeliverableDocument}
          onOpenDeliverableDocument={handleOpenAiDeliveryDeliverableDocument}
          onArchiveDeliverable={handleArchiveAiDeliveryDeliverable}
          onRestoreDeliverable={handleRestoreAiDeliveryDeliverable}
          onMarkDeliverableReady={handleMarkAiDeliveryDeliverableReady}
          onRequestDeliverableRevision={handleRequestAiDeliveryDeliverableRevision}
          onAcceptDeliverable={handleAcceptAiDeliveryDeliverable}
          onFetchDeliverableReviews={handleFetchAiDeliveryDeliverableReviews}
          onSaveDeliverableReview={handleSaveAiDeliveryDeliverableReview}
          onFetchWorkflowRuns={handleFetchAiDeliveryWorkflowRuns}
          onSaveWorkflowRun={handleSaveAiDeliveryWorkflowRun}
          onExecuteWorkflowRun={handleExecuteAiDeliveryWorkflowRun}
          onFetchResearchRequests={handleFetchAiDeliveryResearchRequests}
          onSaveResearchRequest={handleSaveAiDeliveryResearchRequest}
          onFetchResearchSummaries={handleFetchAiDeliveryResearchSummaries}
          onSaveResearchSummary={handleSaveAiDeliveryResearchSummary}
          onApplyResearchSummaryToBrief={handleApplyAiDeliveryResearchSummaryToBrief}
          onFetchResearchSources={handleFetchAiDeliveryResearchSources}
          onSaveResearchSource={handleSaveAiDeliveryResearchSource}
          onFetchMonthlyComputedSummary={handleFetchAiDeliveryMonthlyComputedSummary}
          onFetchMonthlyReport={handleFetchAiDeliveryMonthlyReport}
          onFetchMonthlyMetrics={handleFetchAiDeliveryMonthlyMetrics}
          onCreateMonthlyReport={handleCreateAiDeliveryMonthlyReport}
          onUpdateMonthlyReport={handleUpdateAiDeliveryMonthlyReport}
          onSetMonthlyReportStatus={handleSetAiDeliveryMonthlyReportStatus}
          onArchiveMonthlyReport={handleArchiveAiDeliveryMonthlyReport}
          onRestoreMonthlyReport={handleRestoreAiDeliveryMonthlyReport}
          onGenerateMonthlyReportPdf={handleGenerateAiDeliveryMonthlyReportPdf}
          onUploadMonthlyReportDocument={handleUploadAiDeliveryMonthlyReportDocument}
          onDownloadMonthlyReportDocument={handleGetAiDeliveryMonthlyReportDownloadReference}
          onImportMonthlyMetrics={handleImportAiDeliveryMonthlyMetrics}
          onApproveMonthlyMetricSnapshot={handleApproveAiDeliveryMonthlyMetrics}
          onArchiveMonthlyMetricSnapshot={handleArchiveAiDeliveryMonthlyMetrics}
          onFetchMiContext={handleFetchAiDeliveryMiContext}
          onApplyMiHandoff={handleApplyAiDeliveryMiHandoff}
          onRemoveMiHandoff={handleRemoveAiDeliveryMiHandoff}
          onFetchMonthlyReportMiContext={handleFetchAiDeliveryMonthlyReportMiContext}
          onApplyMiHandoffToMonthlyReport={handleApplyMiHandoffToMonthlyReport}
          onUpdateMonthlyReportMiContextDraft={handleUpdateAiDeliveryMonthlyReportMiContextDraft}
          onRemoveMiHandoffFromMonthlyReport={handleRemoveMiHandoffFromMonthlyReport}
          onFetchKnowledgeItems={handleFetchAiKnowledgeItems}
          onCreateKnowledgeItem={handleCreateAiKnowledgeItem}
          onUpdateKnowledgeItem={handleUpdateAiKnowledgeItem}
          onPreviewAiContext={handlePreviewAiContext}
        />
      ) : null}
      {!loading && activeView === "ai-market-intelligence" ? (
        <AiMarketIntelligencePage clients={clients?.clients ?? []} />
      ) : null}
      {!loading && activeView === "admin-daily-cockpit" ? (
        <AdminDailyOperationsCockpit />
      ) : null}
      {!loading && activeView === "ai-operations" ? (
        <AiOperationsPage />
      ) : null}
      {!loading && activeView === "content-plan-review" ? <ClientContentPlanReviewView /> : null}
      {!loading && activeView === "content-draft-review" ? <ClientContentDraftReviewView /> : null}
      {!loading && activeView === "tasks" ? (
        <TasksPage
          canEdit={canManageCore}
          error={null}
          loading={false}
          onArchive={handleArchiveTask}
          onRestore={handleRestoreTask}
          onSave={handleSaveTask}
          projects={projects?.projects ?? []}
          tasks={tasks?.tasks ?? []}
        />
      ) : null}
      {!loading && activeView === "invoices" ? (
        <InvoicesPage
          canEdit={canManageCore}
          clients={clients?.clients ?? []}
          errorMessage={null}
          invoiceItems={invoiceItems?.invoiceItems ?? []}
          invoices={invoices?.invoices ?? []}
          isLoading={false}
          onArchiveInvoice={handleArchiveInvoice}
          onArchiveRecurringInvoice={handleArchiveRecurringInvoice}
          onCancelInvoice={handleCancelInvoice}
          onMarkInvoiceUncollectible={handleMarkInvoiceUncollectible}
          onGenerateDueRecurringInvoice={handleGenerateDueRecurringInvoice}
          onMarkInvoiceSent={handleMarkInvoiceSent}
          onRegisterInvoicePayment={handleRegisterInvoicePayment}
          onSaveInvoice={handleSaveInvoice}
          onSaveRecurringInvoice={handleSaveRecurringInvoice}
          projects={projects?.projects ?? []}
          recurringInvoices={recurringInvoices?.recurringInvoices ?? []}
        />
      ) : null}
      {!loading && activeView === "credit-notes" ? (
        <CreditNotesPage
          canEdit={canManageCore}
          errorMessage={null}
          invoiceItems={invoiceItems?.invoiceItems ?? []}
          invoices={invoices?.invoices ?? []}
          isLoading={false}
          onIssueCreditNote={handleIssueCreditNote}
          onSaveCreditNote={handleSaveCreditNote}
          onVoidCreditNote={handleVoidCreditNote}
        />
      ) : null}
      {!loading && activeView === "invoice-items" ? (
        <InvoiceItemsPage
          activeItems={invoiceItems?.invoiceItems ?? []}
          archivedItems={archivedInvoiceItems?.invoiceItems ?? []}
          canEdit={canManageCore}
          errorMessage={null}
          isLoading={false}
          onArchiveInvoiceItem={handleArchiveInvoiceItem}
          onRestoreInvoiceItem={handleRestoreInvoiceItem}
          onSaveInvoiceItem={handleSaveInvoiceItem}
        />
      ) : null}
      {!loading && activeView === "bills" ? (
        <BillsPage
          bills={bills?.bills ?? []}
          canEdit={canManageCore}
          errorMessage={null}
          isLoading={false}
          onArchiveBill={handleArchiveBill}
          onArchiveVendor={handleArchiveVendor}
          onCreateVendor={handleCreateVendor}
          onRestoreVendor={handleRestoreVendor}
          onRestoreBill={handleRestoreBill}
          onSaveBill={handleSaveBill}
          onSaveVendor={handleSaveVendor}
          onUploadBillDocument={handleUploadBillDocument}
          vendors={vendors?.vendors ?? []}
        />
      ) : null}
      {!loading && activeView === "settings" ? (
        <SettingsView
          authContext={authContext}
          currentUser={currentUser.user}
          tenantSettings={tenantSettings}
        />
      ) : null}
      {!loading && activeView === "team" ? (
        <TeamView
          authContext={authContext}
          clients={clients?.clients ?? []}
          onCreateUser={handleCreateAdminUser}
          onResetPassword={handleResetUserPassword}
          teamMembers={teamMembers}
        />
      ) : null}
      {!loading && activeView === "design-system" ? <DesignShowcase /> : null}
    </AppLayout>
  );
}
