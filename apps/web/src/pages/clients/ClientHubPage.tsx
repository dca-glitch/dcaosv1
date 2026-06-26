import { useCallback, useEffect, useState, type FormEvent } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { PageHeader, SectionPanel, StatusBadge } from "../../components/ui";
import type { ClientSummary } from "./ClientsPage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";

type PublicationTarget = {
  id: string;
  clientId: string;
  label: string;
  siteUrl: string;
  siteSlug: string | null;
  wordPressComSite: boolean;
  isDefault: boolean;
};

type AnalyticsProfile = {
  gscSiteUrl: string | null;
  ga4PropertyId: string | null;
  defaultSourceType: string;
  connectionStatus: string;
};

type PublicationLog = {
  id: string;
  action: string;
  status: string;
  siteUrlHost: string | null;
  createdAt: string;
  note: string | null;
};

type ClientHubPageProps = {
  client: ClientSummary;
  canEdit: boolean;
  onBack: () => void;
};

async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const token = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload?.error?.message ?? "Request failed.");
  }
  return payload.data as T;
}

export function ClientHubPage({ client, canEdit, onBack }: ClientHubPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targets, setTargets] = useState<PublicationTarget[]>([]);
  const [logs, setLogs] = useState<PublicationLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsProfile | null>(null);
  const [targetLabel, setTargetLabel] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [credentialTargetId, setCredentialTargetId] = useState("");
  const [applicationPassword, setApplicationPassword] = useState("");
  const [gscSiteUrl, setGscSiteUrl] = useState("");
  const [ga4PropertyId, setGa4PropertyId] = useState("");

  const loadHub = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [targetResponse, logResponse, analyticsResponse] = await Promise.all([
        apiRequest<{ publicationTargets: PublicationTarget[] }>("GET", `/clients/${client.id}/publication-targets`),
        apiRequest<{ publicationLogs: PublicationLog[] }>("GET", `/clients/${client.id}/publication-logs`),
        apiRequest<{ profile: AnalyticsProfile | null }>("GET", `/clients/${client.id}/analytics-profile`)
      ]);
      setTargets(targetResponse.publicationTargets);
      setLogs(logResponse.publicationLogs);
      setAnalytics(analyticsResponse.profile);
      setGscSiteUrl(analyticsResponse.profile?.gscSiteUrl ?? "");
      setGa4PropertyId(analyticsResponse.profile?.ga4PropertyId ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load client hub.");
    } finally {
      setLoading(false);
    }
  }, [client.id]);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  async function handleCreateTarget(event: FormEvent) {
    event.preventDefault();
    if (!canEdit) return;
    await apiRequest("POST", `/clients/${client.id}/publication-targets`, {
      label: targetLabel,
      siteUrl: targetUrl,
      isDefault: targets.length === 0
    });
    setTargetLabel("");
    setTargetUrl("");
    await loadHub();
  }

  async function handleSaveCredentials(event: FormEvent) {
    event.preventDefault();
    if (!canEdit || !credentialTargetId || !applicationPassword) return;
    await apiRequest("POST", `/clients/${client.id}/publication-targets/${credentialTargetId}/credentials`, {
      applicationPassword
    });
    setApplicationPassword("");
    await loadHub();
  }

  async function handleSaveAnalytics(event: FormEvent) {
    event.preventDefault();
    if (!canEdit) return;
    await apiRequest("PUT", `/clients/${client.id}/analytics-profile`, {
      gscSiteUrl,
      ga4PropertyId,
      connectionStatus: "CONFIGURED"
    });
    await loadHub();
  }

  if (loading) {
    return <LoadingState label="Loading client hub" />;
  }

  if (error) {
    return <ErrorState message={error} title="Client hub unavailable" />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Client Operating Hub"
        title={client.name}
        description={client.website ?? "Domain/client operating context"}
        actions={
          <button className="secondary-action" type="button" onClick={onBack}>
            Back to clients
          </button>
        }
      />

      <SectionPanel title="Client profile">
        <div className="metric-grid">
          <div>
            <strong>Kind</strong>
            <div>
              <StatusBadge status={client.clientKind === "OWN_DOMAIN" ? "OWN_DOMAIN" : "AGENCY_CLIENT"} />
            </div>
          </div>
          <div>
            <strong>Website</strong>
            <div>{client.website ?? "—"}</div>
          </div>
          <div>
            <strong>Legal entity</strong>
            <div>{client.legalEntityName ?? "—"}</div>
          </div>
          <div>
            <strong>Migration</strong>
            <div>{client.migrationStatus}</div>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel title="Publication targets" description="WordPress targets per subdomain or site.">
        {targets.length === 0 ? (
          <EmptyState message="Add a WordPress target for this client/domain." title="No publication targets" />
        ) : (
          <ul className="entity-list">
            {targets.map((target) => (
              <li key={target.id}>
                <strong>{target.label}</strong> — {target.siteUrl}
                {target.isDefault ? <StatusBadge status="DEFAULT" /> : null}
              </li>
            ))}
          </ul>
        )}
        {canEdit ? (
          <form className="form-grid" onSubmit={(event) => void handleCreateTarget(event)}>
            <label>
              Label
              <input value={targetLabel} onChange={(event) => setTargetLabel(event.target.value)} required />
            </label>
            <label>
              Site URL
              <input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} required />
            </label>
            <button className="primary-action" type="submit">
              Add publication target
            </button>
          </form>
        ) : null}
      </SectionPanel>

      {canEdit ? (
        <SectionPanel title="WordPress credentials" description="Encrypted per target. Never shown after save.">
          <form className="form-grid" onSubmit={(event) => void handleSaveCredentials(event)}>
            <label>
              Target
              <select value={credentialTargetId} onChange={(event) => setCredentialTargetId(event.target.value)} required>
                <option value="">Select target</option>
                {targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Application password
              <input
                type="password"
                value={applicationPassword}
                onChange={(event) => setApplicationPassword(event.target.value)}
                autoComplete="new-password"
              />
            </label>
            <button className="secondary-action" type="submit">
              Save credentials
            </button>
          </form>
        </SectionPanel>
      ) : null}

      <SectionPanel title="Analytics profile">
        <form className="form-grid" onSubmit={(event) => void handleSaveAnalytics(event)}>
          <label>
            GSC site URL
            <input value={gscSiteUrl} onChange={(event) => setGscSiteUrl(event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            GA4 property ID
            <input value={ga4PropertyId} onChange={(event) => setGa4PropertyId(event.target.value)} disabled={!canEdit} />
          </label>
          {canEdit ? (
            <button className="secondary-action" type="submit">
              Save analytics profile
            </button>
          ) : null}
        </form>
        {analytics ? <p className="muted-copy">Connection status: {analytics.connectionStatus}</p> : null}
      </SectionPanel>

      <SectionPanel title="Publication log" description="Recent prepare/publish actions for this client.">
        {logs.length === 0 ? (
          <EmptyState message="Prepare or publish a deliverable to populate this log." title="No publication events" />
        ) : (
          <ul className="entity-list">
            {logs.map((log) => (
              <li key={log.id}>
                <strong>{log.action}</strong> — {log.status} — {log.siteUrlHost ?? "unknown host"} —{" "}
                {new Date(log.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>
    </div>
  );
}
