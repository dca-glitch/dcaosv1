import React, { FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import type { ClientSummary } from "../clients/ClientsPage";
import type { ProjectSummary as ProjectLinkSummary } from "../projects/ProjectsPage";

export type AiDeliveryBriefSummary = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  revisionCount?: number;
};

export type AiDeliveryProjectSummary = {
  id: string;
  clientId: string;
  client: { id: string; name: string } | null;
  projectId: string | null;
  project: { id: string; name: string } | null;
  name: string;
  targetMonth: string;
  plannedContentScopeNotes: string | null;
  isArchived: boolean;
  brief: AiDeliveryBriefSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type AiDeliveryProjectFormValues = {
  clientId: string;
  projectId: string | null;
  name: string;
  targetMonth: string;
  plannedContentScopeNotes: string;
};

export type AiDeliveryProjectsProps = {
  projects: AiDeliveryProjectSummary[];
  clients: ClientSummary[];
  projectsList: ProjectLinkSummary[];
  canEdit: boolean;
  loading: boolean;
  error: string | null;
  onArchive: (projectId: string) => Promise<boolean>;
  onSave: (projectId: string | null, values: AiDeliveryProjectFormValues) => Promise<boolean>;
  onRequestClientInput: (projectId: string) => Promise<boolean>;
  onRequestClientRevision: (projectId: string) => Promise<boolean>;
  onApproveFinal: (projectId: string) => Promise<boolean>;
  onFetchBrief?: (projectId: string) => Promise<null | {
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
  }>;
  onSaveBrief?: (projectId: string, values: {
    clientPriorities?: string | null;
    productsServicesFocus?: string | null;
    targetAudience?: string | null;
    marketsCompetitors?: string | null;
    notes?: string | null;
  }) => Promise<boolean>;
};

const emptyForm = (clientId = ""): AiDeliveryProjectFormValues => ({
  clientId,
  projectId: null,
  name: "",
  targetMonth: "",
  plannedContentScopeNotes: ""
});

export function AiDeliveryPage({
  projects,
  clients,
  projectsList,
  canEdit,
  loading,
  error,
  onArchive,
  onSave,
  onRequestClientInput,
  onRequestClientRevision,
  onApproveFinal,
  onFetchBrief,
  onSaveBrief
}: AiDeliveryProjectsProps) {
  const [filter, setFilter] = useState<"all" | "active" | "archived">("active");
  const [editorProjectId, setEditorProjectId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<AiDeliveryProjectFormValues>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [openBriefId, setOpenBriefId] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefDetail, setBriefDetail] = useState<null | {
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
  }>(null);

  const selectedProject = useMemo(() => projects.find((p) => p.id === editorProjectId) ?? null, [editorProjectId, projects]);
  const openProject = useMemo(() => projects.find((p) => p.id === openBriefId) ?? null, [openBriefId, projects]);

  function openCreateModal() {
    setEditorProjectId(null);
    setDraft(emptyForm(clients[0]?.id ?? ""));
    setIsEditorOpen(true);
  }

  function openEditModal(project: AiDeliveryProjectSummary) {
    setEditorProjectId(project.id);
    setDraft({
      clientId: project.clientId ?? "",
      projectId: project.projectId ?? null,
      name: project.name,
      targetMonth: project.targetMonth ?? "",
      plannedContentScopeNotes: project.plannedContentScopeNotes ?? ""
    });
    setIsEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const ok = await onSave(editorProjectId, draft);
      if (ok) {
        setEditorProjectId(null);
        setDraft(emptyForm());
        setIsEditorOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function openBrief(projectId: string) {
    setOpenBriefId(projectId);
    setBriefLoading(true);
    setBriefDetail(null);
    try {
      if (typeof onFetchBrief === "function") {
        const b = await onFetchBrief(projectId);
        setBriefDetail(b);
      }
    } finally {
      setBriefLoading(false);
    }
  }

  async function handleSaveBrief(projectId: string) {
    if (!briefDetail) return;
    if (typeof onSaveBrief !== "function") return;
    const ok = await onSaveBrief(projectId, {
      clientPriorities: briefDetail.clientPriorities,
      productsServicesFocus: briefDetail.productsServicesFocus,
      targetAudience: briefDetail.targetAudience,
      marketsCompetitors: briefDetail.marketsCompetitors,
      notes: briefDetail.notes
    });
    if (ok) {
      setOpenBriefId(null);
      setBriefDetail(null);
    }
  }

  if (loading) return <LoadingState label="Loading AI delivery projects" />;
  if (error) return <ErrorState title="AI delivery unavailable" message={error} />;

  const filteredProjects = projects.filter((project) => {
    if (filter === "active") return !project.isArchived;
    if (filter === "archived") return project.isArchived;
    return true;
  });

  if (!projects || projects.length === 0) {
    return <EmptyState title="No AI delivery projects" message="No AI delivery projects found for this tenant." />;
  }

  return (
    <section className="view-section" aria-labelledby="ai-delivery-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">AI Workflow</p>
          <h1 id="ai-delivery-title">AI Delivery Projects</h1>
        </div>
        <div className="toolbar">
          <div className="filter-bar" role="group" aria-label="AI delivery filter">
            {(["active", "archived", "all"] as const).map((value) => (
              <button
                aria-pressed={filter === value}
                className={filter === value ? "secondary-action filter-chip is-active" : "secondary-action filter-chip"}
                key={value}
                onClick={() => setFilter(value)}
                type="button"
              >
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
          {canEdit ? (
            <button className="primary-action" onClick={openCreateModal} type="button">
              Add AI Delivery
            </button>
          ) : null}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <EmptyState message="No AI delivery projects match the current filter." title="No AI delivery projects" />
      ) : (
        <div className="entity-grid">
          {filteredProjects.map((p) => (
            <article className="entity-card" key={p.id}>
              <div className="entity-card-header">
                <div>
                  <span className={`entity-pill entity-pill-${p.isArchived ? "archived" : "active"}`}>
                    {p.isArchived ? "Archived" : "Active"}
                  </span>
                  <h2>{p.name}</h2>
                </div>
                <div className="card-actions">
                  {canEdit ? (
                    <>
                      <button className="secondary-action" onClick={() => openEditModal(p)} type="button">
                        Edit
                      </button>
                      <button className="secondary-action" onClick={() => void openBrief(p.id)} type="button" disabled={!p.brief}>
                        Open brief
                      </button>
                      {!p.isArchived ? (
                        <button className="secondary-action" onClick={() => void onArchive(p.id)} type="button">
                          Archive
                        </button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
              <div className="entity-field-grid">
                <div>
                  <span>Client</span>
                  <strong>{p.client?.name ?? "No client"}</strong>
                </div>
                <div>
                  <span>Project</span>
                  <strong>{p.project?.name ?? "(none)"}</strong>
                </div>
                <div>
                  <span>Target month</span>
                  <strong>{p.targetMonth}</strong>
                </div>
                <div>
                  <span>Brief status</span>
                  <strong>{p.brief?.status ?? "No brief"}</strong>
                </div>
                <div className="entity-span-2">
                  <span>Notes</span>
                  <strong>{p.plannedContentScopeNotes ?? "Not set"}</strong>
                </div>
                <div className="entity-span-2">
                  {canEdit ? (
                    <div className="brief-actions">
                      <button className="secondary-action" onClick={() => void onRequestClientInput(p.id)} type="button">
                        Request client input
                      </button>
                      <button className="secondary-action" onClick={() => void onRequestClientRevision(p.id)} type="button">
                        Request client revision
                      </button>
                      <button className="primary-action" onClick={() => void onApproveFinal(p.id)} type="button">
                        Approve final
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isEditorOpen ? (
        <Modal
          onClose={() => {
            setEditorProjectId(null);
            setDraft(emptyForm(clients[0]?.id ?? ""));
            setIsEditorOpen(false);
          }}
          title={editorProjectId ? "Edit AI Delivery" : "Add AI Delivery"}
        >
          <form className="entity-form" onSubmit={handleSubmit}>
            <div className="field-grid">
              <label>
                Client
                <select
                  onChange={(event) => setDraft((current) => ({ ...current, clientId: event.target.value }))}
                  value={draft.clientId}
                >
                  <option value="">No client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Project (link)
                <select
                  onChange={(event) => setDraft((current) => ({ ...current, projectId: event.target.value || null }))}
                  value={draft.projectId ?? ""}
                >
                  <option value="">(none)</option>
                  {projectsList.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Name
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  required
                  value={draft.name}
                />
              </label>

              <label>
                Target month
                <input
                  type="month"
                  onChange={(event) => setDraft((current) => ({ ...current, targetMonth: event.target.value }))}
                  value={draft.targetMonth}
                />
              </label>

              <label className="field-span-2">
                Notes
                <textarea
                  maxLength={4000}
                  onChange={(event) => setDraft((current) => ({ ...current, plannedContentScopeNotes: event.target.value }))}
                  rows={4}
                  value={draft.plannedContentScopeNotes}
                />
              </label>
            </div>
            <div className="modal-footer">
              <button
                className="secondary-action"
                disabled={saving}
                onClick={() => {
                  setEditorProjectId(null);
                  setDraft(emptyForm());
                  setIsEditorOpen(false);
                }}
                type="button"
              >
                Cancel
              </button>
              <button className="primary-action" disabled={saving} type="submit">
                {saving ? "Saving" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
      {openBriefId ? (
        <Modal
          onClose={() => {
            setOpenBriefId(null);
            setBriefDetail(null);
          }}
          title="AI Delivery Brief"
        >
          {briefLoading ? (
            <LoadingState label="Loading brief" />
          ) : openProject ? (
            briefDetail ? (
              <div>
                <dl className="brief-grid">
                  <div>
                    <dt>Status</dt>
                    <dd>{briefDetail.status}</dd>
                  </div>
                  <div>
                    <dt>Revisions</dt>
                    <dd>{briefDetail.revisionCount ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{new Date(briefDetail.createdAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{new Date(briefDetail.updatedAt).toLocaleString()}</dd>
                  </div>
                </dl>

                <section className="field-panel">
                  <h3>Client priorities</h3>
                  {canEdit && typeof onSaveBrief === "function" ? (
                    <textarea
                      rows={3}
                      value={briefDetail.clientPriorities ?? ""}
                      onChange={(e) => setBriefDetail({ ...briefDetail, clientPriorities: e.target.value })}
                    />
                  ) : (
                    <pre style={{ whiteSpace: "pre-wrap" }}>{briefDetail.clientPriorities ?? "Not set"}</pre>
                  )}
                </section>

                <section className="field-panel">
                  <h3>Products / services focus</h3>
                  {canEdit && typeof onSaveBrief === "function" ? (
                    <textarea
                      rows={3}
                      value={briefDetail.productsServicesFocus ?? ""}
                      onChange={(e) => setBriefDetail({ ...briefDetail, productsServicesFocus: e.target.value })}
                    />
                  ) : (
                    <pre style={{ whiteSpace: "pre-wrap" }}>{briefDetail.productsServicesFocus ?? "Not set"}</pre>
                  )}
                </section>

                <section className="field-panel">
                  <h3>Target audience</h3>
                  {canEdit && typeof onSaveBrief === "function" ? (
                    <textarea
                      rows={3}
                      value={briefDetail.targetAudience ?? ""}
                      onChange={(e) => setBriefDetail({ ...briefDetail, targetAudience: e.target.value })}
                    />
                  ) : (
                    <pre style={{ whiteSpace: "pre-wrap" }}>{briefDetail.targetAudience ?? "Not set"}</pre>
                  )}
                </section>

                <section className="field-panel">
                  <h3>Markets / competitors</h3>
                  {canEdit && typeof onSaveBrief === "function" ? (
                    <textarea
                      rows={3}
                      value={briefDetail.marketsCompetitors ?? ""}
                      onChange={(e) => setBriefDetail({ ...briefDetail, marketsCompetitors: e.target.value })}
                    />
                  ) : (
                    <pre style={{ whiteSpace: "pre-wrap" }}>{briefDetail.marketsCompetitors ?? "Not set"}</pre>
                  )}
                </section>

                <section className="field-panel">
                  <h3>Research summary / notes</h3>
                  {canEdit && typeof onSaveBrief === "function" ? (
                    <textarea
                      rows={6}
                      value={briefDetail.notes ?? ""}
                      onChange={(e) => setBriefDetail({ ...briefDetail, notes: e.target.value })}
                    />
                  ) : (
                    <pre style={{ whiteSpace: "pre-wrap" }}>{briefDetail.notes ?? "Not set"}</pre>
                  )}
                </section>

                <div className="modal-footer">
                  <button className="secondary-action" onClick={() => { setOpenBriefId(null); setBriefDetail(null); }} type="button">Close</button>
                  {canEdit && typeof onSaveBrief === "function" ? (
                    <button className="primary-action" onClick={() => void handleSaveBrief(openProject.id)} type="button">Save</button>
                  ) : null}
                </div>
              </div>
            ) : openProject.brief ? (
              <div>
                <dl className="brief-grid">
                  <div>
                    <dt>Status</dt>
                    <dd>{openProject.brief.status}</dd>
                  </div>
                  <div>
                    <dt>Revisions</dt>
                    <dd>{openProject.brief.revisionCount ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{new Date(openProject.brief.createdAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{new Date(openProject.brief.updatedAt).toLocaleString()}</dd>
                  </div>
                </dl>
                <section className="field-panel">
                  <h3>Planned content scope notes</h3>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{openProject.plannedContentScopeNotes ?? 'Not set'}</pre>
                </section>
                <div className="modal-footer">
                  <button className="secondary-action" onClick={() => { setOpenBriefId(null); setBriefDetail(null); }} type="button">Close</button>
                </div>
              </div>
            ) : (
              <div>No brief available for this project.</div>
            )
          ) : (
            <div>Project not found.</div>
          )}
        </Modal>
      ) : null}
    </section>
  );
}
