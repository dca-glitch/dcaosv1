import type { AiDeliveryProjectSummary } from "./AiDeliveryPage";

/** Initial visible rows before Show more. */
export const AI_DELIVERY_PROJECT_PICKER_PAGE_SIZE = 25;

export function normalizeProjectPickerQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function projectMatchesPickerQuery(
  project: AiDeliveryProjectSummary,
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) return true;
  const haystack = [
    project.name,
    project.client?.name ?? "",
    project.targetMonth,
    project.brief?.status ?? "",
    project.isArchived ? "archived" : "active",
    project.id,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalizedQuery);
}

export function filterProjectsForPicker(
  projects: AiDeliveryProjectSummary[],
  query: string,
): AiDeliveryProjectSummary[] {
  const normalized = normalizeProjectPickerQuery(query);
  const matched = !normalized
    ? [...projects]
    : projects.filter((project) => projectMatchesPickerQuery(project, normalized));

  // Newest first so freshly created smoke/runtime projects remain in the initial window.
  return matched.sort((a, b) => {
    const aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
    const bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
    return bTime - aTime;
  });
}

export type ProjectPickerVisibleSlice = {
  visibleProjects: AiDeliveryProjectSummary[];
  matchCount: number;
  remainingCount: number;
  selectedPinned: boolean;
};

/**
 * Bounds the rendered list. Keeps the selected project visible when it matches
 * the current filter but would otherwise fall outside the visible window.
 */
export function sliceProjectsForPicker(
  matchedProjects: AiDeliveryProjectSummary[],
  visibleLimit: number,
  selectedProjectId: string | null,
): ProjectPickerVisibleSlice {
  const limit = Math.max(0, visibleLimit);
  const selected = selectedProjectId
    ? matchedProjects.find((project) => project.id === selectedProjectId) ?? null
    : null;

  let window = matchedProjects.slice(0, limit);
  let selectedPinned = false;

  if (selected && !window.some((project) => project.id === selected.id)) {
    window = [selected, ...window.filter((project) => project.id !== selected.id)].slice(0, Math.max(limit, 1));
    selectedPinned = true;
  }

  return {
    visibleProjects: window,
    matchCount: matchedProjects.length,
    remainingCount: Math.max(0, matchedProjects.length - window.length),
    selectedPinned,
  };
}
