import React from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";

export type AiDeliveryBriefSummary = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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

export type AiDeliveryProjectsProps = {
  projects: AiDeliveryProjectSummary[];
  canEdit: boolean;
  loading: boolean;
  error: string | null;
  onArchive: (projectId: string) => Promise<boolean>;
};

export function AiDeliveryPage({ projects, canEdit, loading, error, onArchive }: AiDeliveryProjectsProps) {
  if (loading) return <LoadingState label="Loading AI delivery projects" />;
  if (error) return <ErrorState title="AI delivery unavailable" message={error} />;

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
          {canEdit ? (
            <div />
          ) : null}
        </div>
      </div>

      <div className="entity-grid">
        {projects.map((p) => (
          <article className="entity-card" key={p.id}>
            <div className="entity-card-header">
              <div>
                <span className={`entity-pill entity-pill-${p.isArchived ? "archived" : "active"}`}>
                  {p.isArchived ? "Archived" : "Active"}
                </span>
                <h2>{p.name}</h2>
              </div>
              <div className="card-actions">
                {canEdit && !p.isArchived ? (
                  <button className="secondary-action" onClick={() => void onArchive(p.id)} type="button">
                    Archive
                  </button>
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
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
