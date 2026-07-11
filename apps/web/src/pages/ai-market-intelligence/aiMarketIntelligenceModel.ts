/**
 * Market Intelligence display helpers — Phase 12.
 * Presentational only: date labels, keyword/competitor lists, last-updated.
 * Does not invent timestamps or change research/handoff behavior.
 */

export type MiProjectFilter = "active" | "archived" | "all";

export type MiTimestamped = {
  updatedAt?: string | null;
  createdAt?: string | null;
  executedAt?: string | null;
  appliedAt?: string | null;
  finalizedAt?: string | null;
};

export const MI_PROJECT_FILTER_OPTIONS: Array<{ value: MiProjectFilter; label: string }> = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" }
];

/** Locale date label from an existing ISO/date string — never invents a value. */
export function formatMiDateLabel(value: string | null | undefined): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

/** Split comma/newline keyword or competitor fields into trimmed chips. */
export function parseMiListField(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function collectValidTimestamps(records: MiTimestamped[]): number[] {
  const times: number[] = [];
  for (const record of records) {
    for (const candidate of [
      record.updatedAt,
      record.executedAt,
      record.appliedAt,
      record.finalizedAt,
      record.createdAt
    ]) {
      if (!candidate) {
        continue;
      }
      const time = new Date(candidate).getTime();
      if (!Number.isNaN(time)) {
        times.push(time);
      }
    }
  }
  return times;
}

/**
 * Latest timestamp among provided records that already carry date fields.
 * Returns null when nothing valid exists — callers must not invent a fallback clock.
 */
export function resolveMiLastUpdated(records: MiTimestamped[]): string | null {
  const times = collectValidTimestamps(records);
  if (times.length === 0) {
    return null;
  }
  return new Date(Math.max(...times)).toISOString();
}

export function formatMiLastUpdatedLabel(records: MiTimestamped[]): string | null {
  const latest = resolveMiLastUpdated(records);
  return latest ? formatMiDateLabel(latest) : null;
}

export function formatMiResultFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

export function filterMiProjects<T extends { isArchived: boolean }>(
  projects: T[],
  filter: MiProjectFilter
): T[] {
  return projects.filter((project) => {
    if (filter === "active") {
      return !project.isArchived;
    }
    if (filter === "archived") {
      return project.isArchived;
    }
    return true;
  });
}
