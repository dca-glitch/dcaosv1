import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { Badge, Button, PageHeader, SectionPanel, StatusBadge } from "../components/ui";
import { Alert } from "../design-system";
import {
  clientPortalApiRequest,
  getClientPortalAuthToken,
  navigateToClientPortalHash,
  type ApiResponse
} from "./client-portal/client-portal-api";
import { toClientBriefStatusLabel, toClientPortalStatusLabel } from "./client-portal/client-portal-status";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;

type BriefStatus = "DRAFT" | "AWAITING_CLIENT" | "SUBMITTED";

type BriefRecord = {
  id: string;
  clientId: string;
  briefNumber: number;
  targetGroup: string | null;
  hubCount: number;
  geoSeoCount: number;
  lifestyleCount: number;
  otherCount: number;
  title: string;
  status: BriefStatus;
  createdAt: string;
};

type ClientPortalProjectSummary = {
  id: string;
  clientId: string;
  client: { id: string; name: string } | null;
  isArchived: boolean;
};

type ClientPortalProjectsResponse = {
  aiDeliveryProjects: ClientPortalProjectSummary[];
};

type ArticleRecord = {
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

type ClientPortalDeliverablesResponse = {
  deliverables: ArticleRecord[];
};

type ArchiveItem =
  | { kind: "brief"; data: BriefRecord; date: Date }
  | { kind: "article"; data: ArticleRecord; date: Date }
  | { kind: "report"; month: number; year: number };

type MonthGroup = {
  key: string;
  month: number;
  year: number;
  label: string;
  items: ArchiveItem[];
};

function isApiEnvelope<T>(value: unknown): value is ApiResponse<T> {
  if (!value || typeof value !== "object" || !("ok" in value)) {
    return false;
  }
  const envelope = value as { ok: unknown };
  return envelope.ok === true || envelope.ok === false;
}

async function briefsApiRequest<T>(path: string): Promise<ApiResponse<T>> {
  const token = getClientPortalAuthToken();
  const headers = new Headers();
  headers.set("Accept", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method: "GET", headers });
  } catch {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Could not reach the server. Check your connection and try again."
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

function clientsFromPortalProjects(projects: ClientPortalProjectSummary[]): Array<{ id: string; name: string }> {
  const byId = new Map<string, { id: string; name: string }>();
  for (const project of projects) {
    if (project.isArchived || !project.clientId) {
      continue;
    }
    const name = project.client?.name?.trim() || "Client";
    byId.set(project.clientId, { id: project.clientId, name });
  }
  return Array.from(byId.values());
}

function formatArchiveDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(parsed.getDate())}.${pad(parsed.getMonth() + 1)}.${parsed.getFullYear()}`;
}

function monthKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: number, year: number): string {
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

function getBriefStatusBadge(
  status: string,
  role: string
): { label: string; color: "amber" | "blue" | "green" } {
  if (role === "client") {
    const client = toClientBriefStatusLabel(status);
    if (client.tone === "success") return { label: client.label, color: "green" };
    if (client.tone === "info") return { label: client.label, color: "blue" };
    return { label: client.label, color: "amber" };
  }
  if (status === "DRAFT") return { label: "Draft", color: "amber" };
  if (status === "SUBMITTED") return { label: "Submitted", color: "green" };
  if (status === "AWAITING_CLIENT") return { label: "Sent to Client", color: "blue" };
  return { label: "In progress", color: "amber" };
}

function briefBadgeVariant(color: "amber" | "blue" | "green"): "success" | "info" | "warning" {
  if (color === "green") return "success";
  if (color === "blue") return "info";
  return "warning";
}

function formatArticleSummary(brief: BriefRecord): string {
  const parts: string[] = [];
  if (brief.hubCount > 0) parts.push(`Hub ×${brief.hubCount}`);
  if (brief.geoSeoCount > 0) parts.push(`Geo SEO ×${brief.geoSeoCount}`);
  if (brief.lifestyleCount > 0) parts.push(`Lifestyle ×${brief.lifestyleCount}`);
  if (brief.otherCount > 0) parts.push(`Other ×${brief.otherCount}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function formatBriefNumber(briefNumber: number): string {
  return String(briefNumber).padStart(3, "0");
}

function buildMonthGroups(briefs: BriefRecord[], articles: ArticleRecord[]): MonthGroup[] {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const filteredBriefs = briefs.filter((brief) => new Date(brief.createdAt) < ninetyDaysAgo);
  const filteredArticles = articles.filter((article) => new Date(article.createdAt) < ninetyDaysAgo);

  const groupMap = new Map<string, ArchiveItem[]>();

  const addItem = (item: ArchiveItem) => {
    const date =
      item.kind === "report"
        ? new Date(item.year, item.month - 1, 1)
        : item.date;
    const key = monthKeyFromDate(date);
    const existing = groupMap.get(key) ?? [];
    existing.push(item);
    groupMap.set(key, existing);
  };

  for (const brief of filteredBriefs) {
    addItem({ kind: "brief", data: brief, date: new Date(brief.createdAt) });
  }

  for (const article of filteredArticles) {
    addItem({ kind: "article", data: article, date: new Date(article.createdAt) });
  }

  for (const [key, items] of groupMap.entries()) {
    const hasContent = items.some((item) => item.kind === "brief" || item.kind === "article");
    const hasReport = items.some((item) => item.kind === "report");
    if (hasContent && !hasReport) {
      const [yearText, monthText] = key.split("-");
      items.push({
        kind: "report",
        month: Number(monthText),
        year: Number(yearText)
      });
    }

    items.sort((left, right) => {
      if (left.kind === "report") return 1;
      if (right.kind === "report") return -1;
      return right.date.getTime() - left.date.getTime();
    });
  }

  return Array.from(groupMap.entries())
    .map(([key, items]) => {
      const [yearText, monthText] = key.split("-");
      const month = Number(monthText);
      const year = Number(yearText);
      return {
        key,
        month,
        year,
        label: monthLabel(month, year),
        items
      };
    })
    .sort((left, right) => {
      if (left.year !== right.year) {
        return right.year - left.year;
      }
      return right.month - left.month;
    });
}

function toClientArchiveStatusLabel(status: string | null | undefined): string | null {
  const normalized = status?.trim().toUpperCase();
  // Keep incomplete internal review hidden on the archive hub.
  if (normalized === "ADMIN_REVIEW") {
    return null;
  }
  // Archive hub prefers "Published" for completed article outcomes.
  if (normalized === "DELIVERED" || normalized === "ACCEPTED" || normalized === "FINAL") {
    return "Published";
  }
  return toClientPortalStatusLabel(status);
}

function BriefArchiveRow({ brief }: { brief: BriefRecord }) {
  const badge = getBriefStatusBadge(brief.status, "client");

  return (
    <article className="cf-archive-item">
      <span className="cf-archive-item-title">
        Brief #{formatBriefNumber(brief.briefNumber)} — {formatArchiveDate(brief.createdAt)}
      </span>
      <div className="cf-archive-item-meta">
        <Badge variant={briefBadgeVariant(badge.color)}>{badge.label}</Badge>
        <span>{formatArticleSummary(brief)}</span>
      </div>
    </article>
  );
}

function ArticleArchiveRow({ article }: { article: ArticleRecord }) {
  const publishedAt = article.updatedAt || article.createdAt;
  const statusLabel = toClientArchiveStatusLabel(article.status);

  return (
    <article className="cf-archive-item">
      <span className="cf-archive-item-title">{article.title}</span>
      <div className="cf-archive-item-meta">
        <span>Published {formatArchiveDate(publishedAt)}</span>
        {statusLabel ? <StatusBadge status={statusLabel} /> : null}
      </div>
    </article>
  );
}

function ReportPlaceholderRow({ month, year }: { month: number; year: number }) {
  return (
    <article className="cf-archive-item">
      <span className="cf-archive-item-title">Monthly report — {monthLabel(month, year)}</span>
      <p className="cf-record-note">
        Monthly report — available when your team finalizes it.
      </p>
    </article>
  );
}

function MonthArchiveGroup({ group }: { group: MonthGroup }) {
  return (
    <details className="cf-archive-month" open>
      <summary className="cf-archive-month-summary">{group.label}</summary>
      <div className="cf-archive-month-body">
        {group.items.map((item) => {
          if (item.kind === "brief") {
            return <BriefArchiveRow brief={item.data} key={`brief-${item.data.id}`} />;
          }
          if (item.kind === "article") {
            return <ArticleArchiveRow article={item.data} key={`article-${item.data.id}`} />;
          }
          return <ReportPlaceholderRow key={`report-${group.key}`} month={item.month} year={item.year} />;
        })}
      </div>
    </details>
  );
}

export function ArchiveHubPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState("Client");
  const [briefs, setBriefs] = useState<BriefRecord[]>([]);
  const [articles, setArticles] = useState<ArticleRecord[]>([]);

  const loadArchive = useCallback(async () => {
    setLoading(true);
    setError(null);

    const projectsResponse = await clientPortalApiRequest<ClientPortalProjectsResponse>("/projects");
    if (!projectsResponse.ok) {
      setBriefs([]);
      setArticles([]);
      setError(projectsResponse.error.message);
      setLoading(false);
      return;
    }

    const projects = (projectsResponse.data.aiDeliveryProjects ?? []).filter((project) => !project.isArchived);
    const clients = clientsFromPortalProjects(projects);
    const clientId = clients[0]?.id ?? null;

    if (!clientId) {
      setBriefs([]);
      setArticles([]);
      setClientName("Client");
      setLoading(false);
      return;
    }

    setClientName(clients[0]?.name ?? "Client");

    const clientProjects = projects.filter((project) => project.clientId === clientId);

    const [briefsResponse, ...deliverableResponses] = await Promise.all([
      briefsApiRequest<BriefRecord[]>(`/briefs?clientId=${encodeURIComponent(clientId)}`),
      ...clientProjects.map((project) =>
        clientPortalApiRequest<ClientPortalDeliverablesResponse>(`/projects/${project.id}/deliverables`)
      )
    ]);

    if (!briefsResponse.ok) {
      setBriefs([]);
      setArticles([]);
      setError(briefsResponse.error.message);
      setLoading(false);
      return;
    }

    const deliverableErrors = deliverableResponses.filter((response) => !response.ok);
    if (deliverableErrors.length > 0 && deliverableErrors.length === deliverableResponses.length) {
      setBriefs(briefsResponse.data ?? []);
      setArticles([]);
      setError(deliverableErrors[0]?.ok === false ? deliverableErrors[0].error.message : "Deliverables could not be loaded.");
      setLoading(false);
      return;
    }

    const mergedArticles = deliverableResponses.flatMap((response) =>
      response.ok ? response.data.deliverables ?? [] : []
    );

    setBriefs(briefsResponse.data ?? []);
    setArticles(mergedArticles);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadArchive();
  }, [loadArchive]);

  const monthGroups = useMemo(() => buildMonthGroups(briefs, articles), [articles, briefs]);

  if (loading) {
    return (
      <LoadingState label="Loading archive" />
    );
  }

  if (error && monthGroups.length === 0) {
    return (
      <section className="view-section cf-page" aria-labelledby="archive-hub-title" data-density="comfortable">
        <PageHeader
          description="Briefs, articles, and monthly reports older than 90 days."
          eyebrow="Client workspace"
          title="Archive"
          titleId="archive-hub-title"
        />
        <Alert message={error} title="Archive unavailable" variant="danger" />
        <div className="portal-action-row">
          <Button onClick={() => void loadArchive()} variant="secondary">
            Try again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="view-section cf-page" aria-labelledby="archive-hub-title" data-density="comfortable">
      <PageHeader
        action={
          <Button onClick={() => void loadArchive()} variant="tertiary">
            Refresh
          </Button>
        }
        description={`Briefs, articles, and monthly reports older than 90 days for ${clientName}.`}
        eyebrow="Client workspace"
        title="Archive"
        titleId="archive-hub-title"
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

      {error ? <Alert message={error} variant="danger" /> : null}

      <SectionPanel
        description="Items are grouped by month. Only content older than 90 days is shown."
        title="Archive hub"
        tone="compact"
      >
        {monthGroups.length === 0 ? (
          <EmptyState
            message="Briefs and published articles older than 90 days will appear here, grouped by month."
            title="No archived items yet"
            variant="inline"
          />
        ) : (
          <div className="cf-archive-list">
            {monthGroups.map((group) => (
              <MonthArchiveGroup group={group} key={group.key} />
            ))}
          </div>
        )}
      </SectionPanel>

      <p className="portal-footer-note muted-text">
        Archive items are read-only. Recent work is available in your main archive view.
      </p>
    </section>
  );
}
