import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
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

type ClientPortalDownloadReference = {
  downloadUrl: string;
  expiresSeconds: number;
} | null;

type ClientPortalDownloadResponse = {
  downloadReference: ClientPortalDownloadReference;
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
  if (response.error.code === "AUTH_UNAUTHORIZED") {
    return "Please sign in again to view the client archive.";
  }

  if (response.error.code === "AUTH_FORBIDDEN") {
    return "You do not have access to this client archive.";
  }

  if (response.error.code === "CLIENT_PORTAL_PROJECT_NOT_FOUND" || response.error.code === "CLIENT_PORTAL_DELIVERABLE_NOT_FOUND") {
    return "That archive item is not available to this account.";
  }

  return response.error.message || "Client archive could not be loaded.";
}

function formatMonthLabel(value: string | null | undefined): string {
  return value && value.trim() ? value : "Not set";
}

function isFinalDeliverable(status: string) {
  return ["DELIVERED", "ACCEPTED"].includes(status);
}

export function ClientPortalPage() {
  const [projects, setProjects] = useState<ClientPortalProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ClientPortalProjectSummary | null>(null);
  const [selectedProjectLoading, setSelectedProjectLoading] = useState(false);
  const [selectedProjectError, setSelectedProjectError] = useState<string | null>(null);
  const [deliverables, setDeliverables] = useState<ClientPortalDeliverableSummary[]>([]);
  const [deliverablesLoading, setDeliverablesLoading] = useState(false);
  const [deliverablesError, setDeliverablesError] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [downloadingDeliverableId, setDownloadingDeliverableId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const projectsRequestSeq = useRef(0);
  const projectRequestSeq = useRef(0);

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
    setDownloadNotice(null);
    setDownloadingDeliverableId(null);
    setSelectedProject(null);
    setDeliverables([]);

    if (!token) {
      if (requestSeq === projectRequestSeq.current) {
        const message = "Sign in again to view the client archive.";
        setSelectedProjectError(message);
        setDeliverablesError(message);
        setSelectedProjectLoading(false);
        setDeliverablesLoading(false);
      }
      return;
    }

    const [projectResponse, deliverablesResponse] = await Promise.all([
      apiRequest<ClientPortalProjectResponse>(`/client-portal/projects/${projectId}`, { token }),
      apiRequest<ClientPortalDeliverablesResponse>(`/client-portal/projects/${projectId}/deliverables`, { token })
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

    setSelectedProjectLoading(false);
    setDeliverablesLoading(false);
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProject(null);
      setDeliverables([]);
      setSelectedProjectError(null);
      setDeliverablesError(null);
      setSelectedProjectLoading(false);
      setDeliverablesLoading(false);
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
    setSelectedProject(null);
    setDeliverables([]);
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
      setDownloadNotice("Download opened URL could not be launched by the browser.");
    }
  }, [downloadingDeliverableId, selectedProjectId]);

  const projectCount = projects.length;
  const finalDeliverableCount = deliverables.filter((deliverable) => isFinalDeliverable(deliverable.status)).length;
  const selectedProjectArchiveState = selectedProject ? (selectedProject.isArchived ? "Archived" : "Active") : "No project selected";

  const clientName = selectedProject?.client?.name ?? projects[0]?.client?.name ?? "Client archive";

  return (
    <section className="view-section" aria-labelledby="client-portal-title">
      <PageHeader
        eyebrow="Client workspace"
        title="Client Portal"
        titleId="client-portal-title"
        description="Clients only see approved or final archive items linked to their account. Internal workflow runs, prompts, and notes stay hidden."
        actions={
          <button className="secondary-action" onClick={handleRefresh} type="button" disabled={projectsLoading}>
            Refresh archive
          </button>
        }
      />

      <div className="summary-grid metric-grid">
        <MetricCard accent="cyan" helper="Client-safe project archive" label="Projects" value={projectsLoading ? "Loading" : String(projectCount)} />
        <MetricCard accent="violet" helper="Current selection" label="Selected project" value={selectedProject?.name ?? "None"} />
        <MetricCard accent="purple" helper="DELIVERED / ACCEPTED only" label="Final deliverables" value={deliverablesLoading ? "Loading" : String(finalDeliverableCount)} />
        <MetricCard accent="warning" helper="Archive-safe project state" label="Archive status" value={selectedProjectArchiveState} />
      </div>

      <SectionPanel
        title="Projects"
        description="Only archive-safe client projects linked through ClientUserAccess are shown here."
        action={
          <button className="secondary-action" onClick={handleRefresh} type="button" disabled={projectsLoading}>
            Refresh
          </button>
        }
      >
        {projectsLoading ? (
          <div className="state-panel">Loading client archive...</div>
        ) : projectsError ? (
          <EmptyState
            title="Archive unavailable"
            message={projectsError}
            action={(
              <button className="primary-action" onClick={handleRefresh} type="button">
                Try again
              </button>
            )}
          />
        ) : projects.length === 0 ? (
          <EmptyState
            title="No client archive yet"
            message="This account is not linked to any AI Delivery project archive."
            action={(
              <button className="secondary-action" onClick={handleRefresh} type="button">
                Reload
              </button>
            )}
          />
        ) : (
          <div className="entity-grid">
            {projects.map((project) => (
              <article className="entity-card" key={project.id}>
                <div className="entity-card-header">
                  <div>
                    <StatusBadge status={project.isArchived ? "Archived" : "Active"} />
                    <h2>{project.name}</h2>
                  </div>
                  <div className="card-actions">
                    <button className="secondary-action" onClick={() => handleSelectProject(project.id)} type="button">
                      {selectedProjectId === project.id ? "Selected" : "Open project"}
                    </button>
                  </div>
                </div>
                <div className="entity-field-grid">
                  <div>
                    <span>Client</span>
                    <strong>{project.client?.name ?? clientName}</strong>
                  </div>
                  <div>
                    <span>Target month</span>
                    <strong>{formatMonthLabel(project.targetMonth)}</strong>
                  </div>
                  <div>
                    <span>Project</span>
                    <strong>{project.project?.name ?? "Not linked"}</strong>
                  </div>
                  <div>
                    <span>Archive state</span>
                    <strong>{project.isArchived ? "Archived" : "Active"}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionPanel>

      <SectionPanel
        title="Project archive"
        description="Selected project details plus final deliverables only. Internal workflow data stays hidden."
      >
        {selectedProjectLoading ? (
          <div className="state-panel">Loading project archive...</div>
        ) : selectedProjectError ? (
          <EmptyState
            title="Project unavailable"
            message={selectedProjectError}
            action={(
              <button className="secondary-action" onClick={handleRefresh} type="button">
                Reload project
              </button>
            )}
          />
        ) : selectedProject ? (
          <div className="entity-grid">
            <article className="entity-card">
              <div className="entity-card-header">
                <div>
                  <StatusBadge status={selectedProject.isArchived ? "Archived" : "Active"} />
                  <h2>{selectedProject.name}</h2>
                </div>
              </div>
              <div className="entity-field-grid">
                <div>
                  <span>Client</span>
                  <strong>{selectedProject.client?.name ?? "Not set"}</strong>
                </div>
                <div>
                  <span>Target month</span>
                  <strong>{formatMonthLabel(selectedProject.targetMonth)}</strong>
                </div>
                <div>
                  <span>Project record</span>
                  <strong>{selectedProject.project?.name ?? "Not linked"}</strong>
                </div>
                <div>
                  <span>Created</span>
                  <strong>{selectedProject.createdAt.slice(0, 10)}</strong>
                </div>
                <div>
                  <span>Updated</span>
                  <strong>{selectedProject.updatedAt.slice(0, 10)}</strong>
                </div>
                <div className="entity-span-2">
                  <span>Archive safety</span>
                  <strong>Only approved/final archive items are exposed to client users.</strong>
                </div>
              </div>
            </article>

            <article className="entity-card">
              <div className="entity-card-header">
                <div>
                  <StatusBadge status={deliverables.length ? "Active" : "Draft"} />
                  <h2>Final deliverables</h2>
                </div>
              </div>

              {downloadNotice ? <div className="state-panel">{downloadNotice}</div> : null}

              {deliverablesLoading ? (
                <div className="state-panel">Loading deliverables...</div>
              ) : deliverablesError ? (
                <EmptyState
                  title="Deliverables unavailable"
                  message={deliverablesError}
                  action={(
                    <button className="secondary-action" onClick={handleRefresh} type="button">
                      Reload deliverables
                    </button>
                  )}
                />
              ) : deliverables.length === 0 ? (
                <EmptyState
                  title="No final deliverables yet"
                  message="Only DELIVERED and ACCEPTED deliverables appear in the client archive."
                />
              ) : (
                <div className="entity-grid">
                  {deliverables.map((deliverable) => (
                    <article className="entity-card" key={deliverable.id}>
                      <div className="entity-card-header">
                        <div>
                          <StatusBadge status={deliverable.status} />
                          <h3>{deliverable.title}</h3>
                        </div>
                        <div className="card-actions">
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
                      <div className="entity-field-grid">
                        <div>
                          <span>Type</span>
                          <strong>{deliverable.deliveryType}</strong>
                        </div>
                        <div>
                          <span>Status</span>
                          <strong>{deliverable.status}</strong>
                        </div>
                        <div>
                          <span>Export URL</span>
                          <strong>
                            {deliverable.exportUrl ? (
                              <a href={deliverable.exportUrl} rel="noreferrer" target="_blank">
                                Open export
                              </a>
                            ) : (
                              "Not provided"
                            )}
                          </strong>
                        </div>
                        <div>
                          <span>Updated</span>
                          <strong>{deliverable.updatedAt.slice(0, 10)}</strong>
                        </div>
                        <div className="entity-span-2">
                          <span>Description</span>
                          <strong>{deliverable.description ?? "Not provided"}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </div>
        ) : (
          <div className="state-panel">Choose a project above to open its archive.</div>
        )}
      </SectionPanel>

      <SectionPanel
        title="Content Plan Reviews"
        description="Deferred until the client review workflow is approved."
      >
        <p className="muted-text">
          Client-facing monthly plan review is not active yet. The internal admin workflow stays separate and this route remains deferred.
        </p>
      </SectionPanel>

      <SectionPanel
        title="Content Draft Reviews"
        description="Deferred until the client review workflow is approved."
      >
        <p className="muted-text">
          Client-facing draft review is not active yet. No portal approval, revision, or messaging workflow is exposed from this shell.
        </p>
      </SectionPanel>

      <div className="entity-grid">
        <SectionPanel
          title="Client comments"
          description="Deferred."
        >
          <div className="state-panel">
            Client comments and revision messaging remain deferred for a later block.
          </div>
        </SectionPanel>

        <SectionPanel
          title="Client actions"
          description="Deferred."
        >
          <div className="state-panel">
            Client actions remain deferred and are not available in this archive-only view.
          </div>
        </SectionPanel>

        <SectionPanel
          title="Approvals"
          description="Deferred."
        >
          <div className="state-panel">
            Approval history and client-side accept/reject actions remain deferred.
          </div>
        </SectionPanel>
      </div>
    </section>
  );
}
