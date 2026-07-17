import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, EmptyState, ErrorState, LoadingState, PageHeader, SectionPanel, StatusBadge, Table } from "../components/ui";
import { toBriefStatusPresentation } from "./client-portal/client-portal-status";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";

type BriefType = "MONTHLY" | "ADDITIONAL";
type BriefStatus = "DRAFT" | "AWAITING_CLIENT" | "SUBMITTED";

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type AdminBriefRecord = {
  id: string;
  companyId: string;
  clientId: string;
  clientName: string;
  briefNumber: number;
  targetGroup: string | null;
  hubCount: number;
  geoSeoCount: number;
  lifestyleCount: number;
  otherCount: number;
  type: BriefType;
  month: number | null;
  year: number | null;
  title: string;
  content: string;
  status: BriefStatus;
  submittedById: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ClientSummary = {
  id: string;
  name: string;
  isArchived: boolean;
};

type ClientsListResponse = {
  clients: ClientSummary[];
};

const TARGET_GROUP_OPTIONS = [
  { value: "", label: "— Select target group —" },
  { value: "WOMEN", label: "Women" },
  { value: "MEN", label: "Men" },
  { value: "MIXED", label: "All genders" },
  { value: "LOCAL", label: "Local residents" },
  { value: "EXPAT", label: "Expatriates" },
  { value: "TOURIST", label: "Tourists / visitors" }
] as const;

const MONTHLY_READONLY_CONTENT_FIELDS = [
  { key: "productsToPromote", label: "Products & Services to Promote" },
  { key: "additionalNotes", label: "Notes" }
] as const;

function BriefSectionHeading({ children }: { children: string }) {
  return (
    <h3
      className="brief-section-heading"
      style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 0.75rem" }}
    >
      {children}
    </h3>
  );
}

function BriefAiResearchPlaceholder() {
  return (
    <div className="brief-section brief-section--ai-research" style={{ marginTop: "1.5rem" }}>
      <BriefSectionHeading>AI Research & Market Intelligence</BriefSectionHeading>
      <div
        className="brief-ai-research-placeholder"
        style={{
          border: "1px dashed rgba(148, 163, 184, 0.35)",
          borderRadius: "8px",
          background: "rgba(148, 163, 184, 0.06)",
          padding: "1rem 1.25rem"
        }}
      >
        <p className="muted-text" style={{ margin: 0 }}>
          AI research will appear here after your brief is processed by the DCA team.
        </p>
      </div>
    </div>
  );
}

function getAuthToken(): string | null {
  try {
    return window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function isApiEnvelope<T>(value: unknown): value is ApiResponse<T> {
  if (!value || typeof value !== "object" || !("ok" in value)) {
    return false;
  }
  const envelope = value as { ok: unknown };
  return envelope.ok === true || envelope.ok === false;
}

async function apiRequest<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
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

function formatBriefDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(parsed.getDate())}.${pad(parsed.getMonth() + 1)}.${parsed.getFullYear()}`;
}

function targetGroupLabel(value: string | null | undefined): string {
  if (!value?.trim()) {
    return "—";
  }
  return TARGET_GROUP_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function urgencyLabel(value: string): string {
  if (!value.trim()) {
    return "—";
  }
  const labels: Record<string, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" };
  return labels[value] ?? value;
}

function formatArticleSummary(brief: AdminBriefRecord): string {
  const parts: string[] = [];
  if (brief.hubCount > 0) parts.push(`Hub ×${brief.hubCount}`);
  if (brief.geoSeoCount > 0) parts.push(`Geo SEO ×${brief.geoSeoCount}`);
  if (brief.lifestyleCount > 0) parts.push(`Lifestyle ×${brief.lifestyleCount}`);
  if (brief.otherCount > 0) parts.push(`Other ×${brief.otherCount}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function parseMonthlyContent(content: string): { productsToPromote: string; additionalNotes: string } {
  try {
    const parsed = JSON.parse(content) as Record<string, string | undefined>;
    if (parsed && typeof parsed === "object") {
      return {
        productsToPromote: parsed.productsToPromote ?? "",
        additionalNotes: parsed.additionalNotes ?? ""
      };
    }
  } catch {
    return { productsToPromote: content, additionalNotes: "" };
  }
  return { productsToPromote: "", additionalNotes: "" };
}

function parseAdditionalContent(content: string): Record<string, string> {
  try {
    const parsed = JSON.parse(content) as Record<string, string | undefined> & { body?: string; title?: string };
    if (parsed && typeof parsed === "object") {
      return {
        topic: parsed.topic ?? parsed.title ?? "",
        urgency: parsed.urgency ?? "",
        description: parsed.description ?? parsed.body ?? "",
        notes: parsed.notes ?? ""
      };
    }
  } catch {
    return { description: content };
  }
  return {};
}

function BriefStatusBadge({ status }: { status: string }) {
  const badge = toBriefStatusPresentation(status, "admin");
  return <StatusBadge displayLabel={badge.label} status={status} />;
}

type BriefDetailPanelProps = {
  brief: AdminBriefRecord;
  submitting: boolean;
  onClose: () => void;
  onSendToClient: () => void;
};

function BriefDetailPanel({ brief, submitting, onClose, onSendToClient }: BriefDetailPanelProps) {
  const totalArticles = brief.hubCount + brief.geoSeoCount + brief.lifestyleCount + brief.otherCount;
  const monthlyContent = brief.type === "MONTHLY" ? parseMonthlyContent(brief.content) : null;
  const additionalContent = brief.type === "ADDITIONAL" ? parseAdditionalContent(brief.content) : null;

  return (
    <SectionPanel
      action={
        <Button onClick={onClose} size="sm" variant="tertiary">
          Close
        </Button>
      }
      description="Read-only brief detail"
      title="Brief detail"
    >
      <div style={{ marginBottom: "1rem" }}>
        <h2 className="text-heading" style={{ margin: "0 0 0.5rem" }}>
          {brief.title}
        </h2>
        <p className="muted-text" style={{ margin: 0 }}>
          {brief.clientName}
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <BriefStatusBadge status={brief.status} />
      </div>

      {monthlyContent ? (
        <>
          <div className="brief-section brief-section--initial" style={{ marginBottom: "0.5rem" }}>
            <BriefSectionHeading>Initial Brief</BriefSectionHeading>
            <dl className="field-grid">
              <div>
                <dt>Target Group</dt>
                <dd>{targetGroupLabel(brief.targetGroup)}</dd>
              </div>
              <div>
                <dt>{MONTHLY_READONLY_CONTENT_FIELDS[0].label}</dt>
                <dd className="pre-wrap-block">
                  {monthlyContent.productsToPromote?.trim() ? monthlyContent.productsToPromote : "—"}
                </dd>
              </div>
              <div>
                <dt>Article types</dt>
                <dd>
                  Hub {brief.hubCount} · Geo SEO {brief.geoSeoCount} · Lifestyle {brief.lifestyleCount} · Other{" "}
                  {brief.otherCount}
                  {totalArticles > 0 ? ` (${totalArticles} total)` : ""}
                </dd>
              </div>
              <div>
                <dt>{MONTHLY_READONLY_CONTENT_FIELDS[1].label}</dt>
                <dd className="pre-wrap-block">
                  {monthlyContent.additionalNotes?.trim() ? monthlyContent.additionalNotes : "—"}
                </dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatBriefDate(brief.createdAt)}</dd>
              </div>
            </dl>
          </div>
          <BriefAiResearchPlaceholder />
        </>
      ) : null}

      {additionalContent ? (
        <>
          <dl className="field-grid" style={{ marginBottom: "1.25rem" }}>
            <div>
              <dt>Target Group</dt>
              <dd>{targetGroupLabel(brief.targetGroup)}</dd>
            </div>
            <div>
              <dt>Article types</dt>
              <dd>
                Hub {brief.hubCount} · Geo SEO {brief.geoSeoCount} · Lifestyle {brief.lifestyleCount} · Other{" "}
                {brief.otherCount}
                {totalArticles > 0 ? ` (${totalArticles} total)` : ""}
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatBriefDate(brief.createdAt)}</dd>
            </div>
          </dl>
          <dl className="field-grid">
          <div>
            <dt>Topic</dt>
            <dd className="pre-wrap-block">{additionalContent.topic?.trim() ? additionalContent.topic : "—"}</dd>
          </div>
          <div>
            <dt>Urgency</dt>
            <dd>{urgencyLabel(additionalContent.urgency ?? "")}</dd>
          </div>
          <div>
            <dt>Description / Guidelines</dt>
            <dd className="pre-wrap-block">
              {additionalContent.description?.trim() ? additionalContent.description : "—"}
            </dd>
          </div>
          <div>
            <dt>Notes</dt>
            <dd className="pre-wrap-block">{additionalContent.notes?.trim() ? additionalContent.notes : "—"}</dd>
          </div>
        </dl>
        </>
      ) : null}

      {brief.status === "SUBMITTED" && brief.submittedAt ? (
        <dl className="field-grid" style={{ marginTop: "1.25rem" }}>
          <div>
            <dt>Submitted at</dt>
            <dd>{formatBriefDate(brief.submittedAt)}</dd>
          </div>
          {brief.submittedById ? (
            <div>
              <dt>Submitted by</dt>
              <dd className="text-mono">{brief.submittedById}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {brief.status === "DRAFT" ? (
        <div className="form-actions" style={{ marginTop: "1.5rem" }}>
          <Button disabled={submitting} onClick={onSendToClient}>
            {submitting ? "Sending…" : "Send to Client"}
          </Button>
        </div>
      ) : null}
    </SectionPanel>
  );
}

export function BriefPanelPage() {
  const [briefs, setBriefs] = useState<AdminBriefRecord[]>([]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterClientId, setFilterClientId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionError(null);

    const [briefsResponse, clientsResponse] = await Promise.all([
      apiRequest<AdminBriefRecord[]>("/briefs/admin"),
      apiRequest<ClientsListResponse>("/clients")
    ]);

    if (!briefsResponse.ok) {
      setBriefs([]);
      setClients([]);
      setError(briefsResponse.error.message);
      setLoading(false);
      return;
    }

    if (!clientsResponse.ok) {
      setBriefs(briefsResponse.data ?? []);
      setClients([]);
      setError(clientsResponse.error.message);
      setLoading(false);
      return;
    }

    setBriefs(briefsResponse.data ?? []);
    setClients((clientsResponse.data.clients ?? []).filter((client) => !client.isArchived));
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredBriefs = useMemo(() => {
    return briefs
      .filter((brief) => {
        if (filterClientId && brief.clientId !== filterClientId) {
          return false;
        }
        if (filterStatus && brief.status !== filterStatus) {
          return false;
        }
        return true;
      })
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [briefs, filterClientId, filterStatus]);

  const selectedBrief = useMemo(
    () => briefs.find((brief) => brief.id === selectedBriefId) ?? null,
    [briefs, selectedBriefId]
  );

  const tableRows = useMemo(
    () =>
      filteredBriefs.map((brief) => ({
        key: brief.id,
        cells: [
          <div key={`${brief.id}-title`}>
            <strong>{brief.title}</strong>
            <div className="muted-text text-small" style={{ marginTop: 4 }}>
              {brief.clientName}
            </div>
          </div>,
          <div key={`${brief.id}-badges`} style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            <BriefStatusBadge status={brief.status} />
          </div>,
          <span className="muted-text text-small" key={`${brief.id}-articles`}>
            {formatArticleSummary(brief)}
          </span>,
          <span className="muted-text" key={`${brief.id}-target`}>
            {targetGroupLabel(brief.targetGroup)}
          </span>,
          <span className="muted-text" key={`${brief.id}-date`}>
            {formatBriefDate(brief.createdAt)}
          </span>,
          <Button key={`${brief.id}-view`} onClick={() => setSelectedBriefId(brief.id)} size="sm" variant="secondary">
            View
          </Button>
        ]
      })),
    [filteredBriefs]
  );

  const handleSendToClient = useCallback(async () => {
    if (!selectedBrief || selectedBrief.status !== "DRAFT") {
      return;
    }

    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    const response = await apiRequest<AdminBriefRecord>(`/briefs/${selectedBrief.id}/submit`, {
      method: "POST"
    });

    setSubmitting(false);

    if (!response.ok) {
      setActionError(response.error.message);
      return;
    }

    setActionSuccess("Brief sent to client.");
    setSelectedBriefId(null);
    await loadData();
  }, [loadData, selectedBrief]);

  if (loading) {
    return <LoadingState label="Loading briefs" />;
  }

  if (error && briefs.length === 0) {
    return (
      <section className="view-section" aria-labelledby="briefs-panel-title">
        <PageHeader
          description="All client briefs across your workspace."
          eyebrow="Client workspace"
          title="Briefs"
          titleId="briefs-panel-title"
        />
        <ErrorState message={error} title="Briefs unavailable" />
        <div className="portal-action-row">
          <Button onClick={() => void loadData()} variant="secondary">
            Try again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="view-section" aria-labelledby="briefs-panel-title">
      <PageHeader
        action={
          <Button disabled={loading} onClick={() => void loadData()} variant="tertiary">
            Refresh
          </Button>
        }
        description="All client briefs across your workspace."
        eyebrow="Client workspace"
        title="Briefs"
        titleId="briefs-panel-title"
      />

      {error ? (
        <div className="portal-inline-notice portal-inline-notice-error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {actionError ? (
        <div className="portal-inline-notice portal-inline-notice-error" role="alert">
          <p>{actionError}</p>
        </div>
      ) : null}

      {actionSuccess ? (
        <div className="portal-inline-notice" role="status">
          <p>{actionSuccess}</p>
        </div>
      ) : null}

      <SectionPanel description="Filter briefs by client or status." title="All briefs">
        <div className="filter-bar" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
          <label className="field-label" htmlFor="brief-filter-client" style={{ minWidth: "180px" }}>
            Client
            <select
              className="entity-form"
              id="brief-filter-client"
              onChange={(event) => setFilterClientId(event.target.value)}
              value={filterClientId}
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label" htmlFor="brief-filter-status" style={{ minWidth: "160px" }}>
            Status
            <select
              className="entity-form"
              id="brief-filter-status"
              onChange={(event) => setFilterStatus(event.target.value)}
              value={filterStatus}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="AWAITING_CLIENT">Sent to client</option>
              <option value="SUBMITTED">Submitted</option>
            </select>
          </label>
        </div>

        {filteredBriefs.length === 0 ? (
          <EmptyState message="Try adjusting the filters or create briefs from the client portal." title="No briefs found." variant="inline" />
        ) : (
          <div className="table-wrap">
            <Table
              headers={[
                { label: "Brief", align: "left" },
                { label: "Status", align: "left" },
                { label: "Articles", align: "left" },
                { label: "Target group", align: "left" },
                { label: "Date", align: "left" },
                { label: "Action", align: "right" }
              ]}
              rows={tableRows}
            />
          </div>
        )}
      </SectionPanel>

      {selectedBrief ? (
        <div style={{ marginTop: "1.5rem" }}>
          <BriefDetailPanel
            brief={selectedBrief}
            onClose={() => setSelectedBriefId(null)}
            onSendToClient={() => void handleSendToClient()}
            submitting={submitting}
          />
        </div>
      ) : null}
    </section>
  );
}
