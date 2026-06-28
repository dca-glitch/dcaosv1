import { useCallback, useEffect, useState, type FormEvent } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { PageHeader, SectionPanel, StatusBadge } from "../../components/ui";
import { StatusNotice } from "../../components/StatusNotice";
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

type CatalogProduct = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  priceLabel: string | null;
  isVisibleInPortal: boolean;
};

type CatalogInquiry = {
  id: string;
  productName: string | null;
  contactName: string;
  contactEmail: string;
  message: string;
  status: string;
  createdAt: string;
};

type TargetCredentialStatus = {
  configured: boolean;
  encryptionAvailable: boolean;
  updatedAt: string | null;
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
  const hubCanEdit = canEdit && !client.isArchived;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targets, setTargets] = useState<PublicationTarget[]>([]);
  const [logs, setLogs] = useState<PublicationLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsProfile | null>(null);
  const [targetLabel, setTargetLabel] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [credentialTargetId, setCredentialTargetId] = useState("");
  const [applicationPassword, setApplicationPassword] = useState("");
  const [credentialMessage, setCredentialMessage] = useState<string | null>(null);
  const [credentialStatusByTargetId, setCredentialStatusByTargetId] = useState<Record<string, TargetCredentialStatus>>({});
  const [encryptionAvailable, setEncryptionAvailable] = useState<boolean | null>(null);
  const [gscSiteUrl, setGscSiteUrl] = useState("");
  const [ga4PropertyId, setGa4PropertyId] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [catalogInquiries, setCatalogInquiries] = useState<CatalogInquiry[]>([]);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPriceLabel, setProductPriceLabel] = useState("");
  const [productSku, setProductSku] = useState("");

  const loadHub = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [targetResponse, logResponse, analyticsResponse, catalogResponse, inquiryResponse] = await Promise.all([
        apiRequest<{ publicationTargets: PublicationTarget[] }>("GET", `/clients/${client.id}/publication-targets`),
        apiRequest<{ publicationLogs: PublicationLog[] }>("GET", `/clients/${client.id}/publication-logs`),
        apiRequest<{ profile: AnalyticsProfile | null }>("GET", `/clients/${client.id}/analytics-profile`),
        apiRequest<{ catalogProducts: CatalogProduct[] }>("GET", `/clients/${client.id}/catalog-products`),
        apiRequest<{ catalogInquiries: CatalogInquiry[] }>("GET", `/clients/${client.id}/catalog-inquiries`)
      ]);
      setTargets(targetResponse.publicationTargets);
      setLogs(logResponse.publicationLogs);
      setAnalytics(analyticsResponse.profile);
      setCatalogProducts(catalogResponse.catalogProducts);
      setCatalogInquiries(inquiryResponse.catalogInquiries);
      setGscSiteUrl(analyticsResponse.profile?.gscSiteUrl ?? "");
      setGa4PropertyId(analyticsResponse.profile?.ga4PropertyId ?? "");

      const credentialStatuses = await Promise.all(
        targetResponse.publicationTargets.map(async (target) => {
          try {
            const status = await apiRequest<TargetCredentialStatus>(
              "GET",
              `/clients/${client.id}/publication-targets/${target.id}/credentials`
            );
            return { targetId: target.id, status };
          } catch {
            return { targetId: target.id, status: null };
          }
        })
      );
      const nextStatusMap: Record<string, TargetCredentialStatus> = {};
      for (const entry of credentialStatuses) {
        if (entry.status) {
          nextStatusMap[entry.targetId] = entry.status;
        }
      }
      setCredentialStatusByTargetId(nextStatusMap);
      const firstStatus = credentialStatuses.find((entry) => entry.status)?.status ?? null;
      setEncryptionAvailable(firstStatus?.encryptionAvailable ?? false);
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
    if (!hubCanEdit) return;
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
    if (!hubCanEdit || !credentialTargetId || !applicationPassword) return;
    if (encryptionAvailable === false) {
      setCredentialMessage(
        "Credential encryption is not configured on the server. Set CREDENTIAL_ENCRYPTION_MASTER_KEY and restart the API."
      );
      return;
    }
    setCredentialMessage(null);
    try {
      await apiRequest("POST", `/clients/${client.id}/publication-targets/${credentialTargetId}/credentials`, {
        applicationPassword
      });
      setApplicationPassword("");
      setCredentialMessage("Credentials saved (encrypted). They cannot be read back from the API.");
      await loadHub();
    } catch (saveError) {
      setCredentialMessage(saveError instanceof Error ? saveError.message : "Credentials could not be saved.");
    }
  }

  async function handleDeleteCredentials() {
    if (!hubCanEdit || !credentialTargetId) return;
    setCredentialMessage(null);
    try {
      await apiRequest("DELETE", `/clients/${client.id}/publication-targets/${credentialTargetId}/credentials`);
      setApplicationPassword("");
      setCredentialMessage("Stored credentials removed for this target.");
      await loadHub();
    } catch (deleteError) {
      setCredentialMessage(deleteError instanceof Error ? deleteError.message : "Credentials could not be removed.");
    }
  }

  async function handleSaveAnalytics(event: FormEvent) {
    event.preventDefault();
    if (!hubCanEdit) return;
    await apiRequest("PUT", `/clients/${client.id}/analytics-profile`, {
      gscSiteUrl,
      ga4PropertyId,
      connectionStatus: "CONFIGURED"
    });
    await loadHub();
  }

  async function handleCreateCatalogProduct(event: FormEvent) {
    event.preventDefault();
    if (!hubCanEdit || !productName.trim()) return;
    await apiRequest("POST", `/clients/${client.id}/catalog-products`, {
      name: productName,
      description: productDescription || null,
      priceLabel: productPriceLabel || null,
      sku: productSku || null,
      isVisibleInPortal: true
    });
    setProductName("");
    setProductDescription("");
    setProductPriceLabel("");
    setProductSku("");
    await loadHub();
  }

  async function handleAcknowledgeInquiry(inquiryId: string) {
    if (!hubCanEdit) return;
    await apiRequest("POST", `/clients/${client.id}/catalog-inquiries/${inquiryId}/status`, {
      status: "ACKNOWLEDGED"
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

      {client.isArchived ? (
        <StatusNotice
          tone="info"
          message="This client is archived. Publication targets, credentials, and catalog edits are read-only. Restore the client from the Clients list to make changes."
        />
      ) : null}

      <SectionPanel tone="compact" title="Client profile">
        <div className="hub-profile-grid">
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

      <SectionPanel tone="compact" title="Publication targets" description="WordPress targets per subdomain or site. Tenant-level WordPress config is deprecated — manage targets here only.">
        {targets.length === 0 ? (
          <EmptyState
            message="Add a WordPress target for this client/domain. Legacy tenant-level WordPress config (Company Profile) is read-only and cannot be used for publish."
            title="No publication targets"
          />
        ) : (
          <ul className="entity-list">
            {targets.map((target) => (
              <li key={target.id}>
                <strong>{target.label}</strong> — {target.siteUrl}
                {target.isDefault ? <StatusBadge status="DEFAULT" /> : null}{" "}
                {credentialStatusByTargetId[target.id]?.configured ? (
                  <StatusBadge status="CONFIGURED" />
                ) : (
                  <StatusBadge status="NOT_CONFIGURED" />
                )}
              </li>
            ))}
          </ul>
        )}
        {hubCanEdit ? (
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
        <SectionPanel tone="compact" title="WordPress credentials" description="Encrypted per target. Never shown after save. Live publish requires WORDPRESS_PUBLISH_ENABLED and saved credentials.">
          {client.isArchived ? (
            <p className="muted-text">Archived client — credential status is read-only. Restore the client to update credentials.</p>
          ) : targets.length === 0 ? (
            <p className="muted-text">Add a publication target before saving WordPress credentials.</p>
          ) : null}
          {encryptionAvailable === false ? (
            <div className="state-panel" role="status">
              Credential encryption is not ready on this server. Set{" "}
              <code>CREDENTIAL_ENCRYPTION_MASTER_KEY</code> in the API environment and restart the API. See{" "}
              <code>docs/security/CREDENTIAL_ENCRYPTION_FOUNDATION.md</code>.
            </div>
          ) : null}
          {hubCanEdit ? (
          <>
          <form className="form-grid" onSubmit={(event) => void handleSaveCredentials(event)}>
            <label>
              Target
              <select value={credentialTargetId} onChange={(event) => setCredentialTargetId(event.target.value)} required>
                <option value="">Select target</option>
                {targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.label}
                    {credentialStatusByTargetId[target.id]?.configured ? " — credentials saved" : ""}
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
                disabled={encryptionAvailable === false}
              />
            </label>
            <div className="modal-footer" style={{ gridColumn: "1 / -1", paddingLeft: 0, paddingRight: 0 }}>
              <button
                className="secondary-action"
                disabled={encryptionAvailable === false || !credentialTargetId || !applicationPassword.trim()}
                type="submit"
              >
                Save credentials
              </button>
              <button
                className="secondary-action"
                disabled={!credentialTargetId || !credentialStatusByTargetId[credentialTargetId]?.configured}
                onClick={() => void handleDeleteCredentials()}
                type="button"
              >
                Remove credentials
              </button>
            </div>
          </form>
          {credentialTargetId && credentialStatusByTargetId[credentialTargetId]?.updatedAt ? (
            <p className="muted-text">
              Last updated {new Date(credentialStatusByTargetId[credentialTargetId].updatedAt ?? "").toLocaleString()}
            </p>
          ) : null}
          {credentialMessage ? <p className="muted-text">{credentialMessage}</p> : null}
          </>
          ) : null}
        </SectionPanel>
      ) : null}

      <SectionPanel tone="compact" title="Analytics profile">
        <form className="form-grid" onSubmit={(event) => void handleSaveAnalytics(event)}>
          <label>
            GSC site URL
            <input value={gscSiteUrl} onChange={(event) => setGscSiteUrl(event.target.value)} disabled={!hubCanEdit} />
          </label>
          <label>
            GA4 property ID
            <input value={ga4PropertyId} onChange={(event) => setGa4PropertyId(event.target.value)} disabled={!hubCanEdit} />
          </label>
          {hubCanEdit ? (
            <button className="secondary-action" type="submit">
              Save analytics profile
            </button>
          ) : null}
        </form>
        {analytics ? <p className="muted-copy">Connection status: {analytics.connectionStatus}</p> : null}
      </SectionPanel>

      <SectionPanel tone="compact" title="Product catalog" description="Inquiry-only catalog for Client Portal (Puriva skincare/products). No cart or checkout.">
        {catalogProducts.length === 0 ? (
          <EmptyState message="Add products that clients can inquire about from the Client Portal." title="No catalog products" />
        ) : (
          <ul className="entity-list">
            {catalogProducts.map((product) => (
              <li key={product.id}>
                <strong>{product.name}</strong>
                {product.priceLabel ? ` — ${product.priceLabel}` : ""}
                {product.isVisibleInPortal ? <StatusBadge status="VISIBLE" /> : <StatusBadge status="HIDDEN" />}
                {product.description ? <div className="muted-text">{product.description}</div> : null}
              </li>
            ))}
          </ul>
        )}
        {hubCanEdit ? (
          <form className="form-grid" onSubmit={(event) => void handleCreateCatalogProduct(event)}>
            <label>
              Product name
              <input value={productName} onChange={(event) => setProductName(event.target.value)} required />
            </label>
            <label>
              Price label
              <input value={productPriceLabel} onChange={(event) => setProductPriceLabel(event.target.value)} placeholder="e.g. From Rp 150.000" />
            </label>
            <label>
              SKU (optional)
              <input value={productSku} onChange={(event) => setProductSku(event.target.value)} />
            </label>
            <label className="field-span-2">
              Description
              <textarea rows={3} value={productDescription} onChange={(event) => setProductDescription(event.target.value)} />
            </label>
            <button className="primary-action" type="submit">
              Add catalog product
            </button>
          </form>
        ) : null}
      </SectionPanel>

      <SectionPanel tone="compact" title="Product inquiries" description="Client-submitted catalog inquiries from the portal.">
        {catalogInquiries.length === 0 ? (
          <EmptyState message="Inquiries appear when clients submit the catalog form in Client Portal." title="No inquiries yet" />
        ) : (
          <ul className="entity-list">
            {catalogInquiries.map((inquiry) => (
              <li key={inquiry.id}>
                <strong>{inquiry.contactName}</strong> ({inquiry.contactEmail}) — {inquiry.status}
                {inquiry.productName ? ` — ${inquiry.productName}` : ""}
                <div className="muted-text">{inquiry.message}</div>
                <div className="muted-text">{new Date(inquiry.createdAt).toLocaleString()}</div>
                {hubCanEdit && inquiry.status === "NEW" ? (
                  <button className="secondary-action" onClick={() => void handleAcknowledgeInquiry(inquiry.id)} type="button">
                    Mark acknowledged
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>

      <SectionPanel tone="compact" title="Publication log" description="Recent prepare/publish actions for this client.">
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
