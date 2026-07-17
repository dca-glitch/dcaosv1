import React, { useEffect, useMemo, useState } from "react";
import { EmptyState, Input, SectionPanel, StatusBadge } from "../../components/ui";
import type { AiDeliveryProjectSummary } from "./AiDeliveryPage";
import {
  AI_DELIVERY_PROJECT_PICKER_PAGE_SIZE,
  filterProjectsForPicker,
  sliceProjectsForPicker,
} from "./ai-delivery-project-picker-model";

export type AiDeliveryProjectPickerProps = {
  filteredProjects: AiDeliveryProjectSummary[];
  workspaceProjectId: string | null;
  onSelectProject: (projectId: string) => void;
};

export function AiDeliveryProjectPicker({
  filteredProjects,
  workspaceProjectId,
  onSelectProject,
}: AiDeliveryProjectPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(AI_DELIVERY_PROJECT_PICKER_PAGE_SIZE);

  useEffect(() => {
    setVisibleLimit(AI_DELIVERY_PROJECT_PICKER_PAGE_SIZE);
  }, [searchQuery, filteredProjects]);

  const matchedProjects = useMemo(
    () => filterProjectsForPicker(filteredProjects, searchQuery),
    [filteredProjects, searchQuery],
  );

  const slice = useMemo(
    () => sliceProjectsForPicker(matchedProjects, visibleLimit, workspaceProjectId),
    [matchedProjects, visibleLimit, workspaceProjectId],
  );

  const selectedOutsideSearch =
    Boolean(workspaceProjectId) &&
    !matchedProjects.some((project) => project.id === workspaceProjectId);

  return (
    <SectionPanel
      className="ai-delivery-section"
      description="Select a project."
      title="Project selection"
      tone="compact"
    >
      <div className="stack gap-sm" style={{ marginBottom: "0.75rem" }}>
        <Input
          autoComplete="off"
          className="field-span-2"
          fullWidth
          id="ai-delivery-project-search"
          label="Search projects"
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Name, client, month, status…"
          type="search"
          value={searchQuery}
        />
        <p className="muted-text" role="status">
          Showing {slice.visibleProjects.length} of {slice.matchCount} matching project
          {slice.matchCount === 1 ? "" : "s"}
          {filteredProjects.length !== slice.matchCount
            ? ` (${filteredProjects.length} in current filter)`
            : ""}
          .
        </p>
        {selectedOutsideSearch ? (
          <p className="muted-text" role="status">
            Current selection is hidden by search. Clear search to locate it in the list — selection is unchanged.
          </p>
        ) : null}
        {slice.selectedPinned ? (
          <p className="muted-text" role="status">
            Current selection is pinned above the bounded list.
          </p>
        ) : null}
      </div>

      {slice.visibleProjects.length === 0 ? (
        <EmptyState
          message={
            searchQuery.trim()
              ? "No projects match this search. Try another name, client, or month."
              : "No projects are available in the current filter."
          }
          title={searchQuery.trim() ? "No matching projects" : "No projects"}
        />
      ) : (
        <>
          <ul aria-label="AI delivery projects" className="brief-select-list">
            {slice.visibleProjects.map((p) => (
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
          {slice.remainingCount > 0 ? (
            <div style={{ marginTop: "0.75rem" }}>
              <button
                className="ghost-action"
                onClick={() =>
                  setVisibleLimit((current) => current + AI_DELIVERY_PROJECT_PICKER_PAGE_SIZE)
                }
                type="button"
              >
                Show more ({slice.remainingCount} remaining)
              </button>
            </div>
          ) : null}
        </>
      )}
    </SectionPanel>
  );
}
