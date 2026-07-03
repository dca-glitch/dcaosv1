import React from "react";
import { SectionPanel, StatusBadge } from "../../components/ui";
import type { AiDeliveryProjectSummary } from "./AiDeliveryPage";

export type AiDeliveryProjectPickerProps = {
  filteredProjects: AiDeliveryProjectSummary[];
  workspaceProjectId: string | null;
  onSelectProject: (projectId: string) => void;
};

export function AiDeliveryProjectPicker({
  filteredProjects,
  workspaceProjectId,
  onSelectProject
}: AiDeliveryProjectPickerProps) {
  return (
    <SectionPanel
      className="ai-delivery-section"
      description="Choose a project to open workflow sections."
      title="Project selection"
      tone="compact"
    >
      <ul className="brief-select-list" aria-label="AI delivery projects">
        {filteredProjects.map((p) => (
          <li key={p.id}>
            <button
              className={`brief-select-item${workspaceProjectId === p.id ? " is-selected" : ""}`}
              onClick={() => onSelectProject(p.id)}
              type="button"
            >
              <div className="brief-select-title">{p.name}</div>
              <div className="brief-select-meta">
                <span className={`entity-pill entity-pill-${p.isArchived ? "archived" : "active"}`}>
                  {p.isArchived ? "Archived" : "Active"}
                </span>
                <StatusBadge status={p.brief?.status ?? "Brief not started"} />
                <span className="muted-text">{p.client?.name ?? "No client"}</span>
                <span className="muted-text">{p.targetMonth}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </SectionPanel>
  );
}
