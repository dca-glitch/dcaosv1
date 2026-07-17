const TABLE_DENSITY_KEY = "dca.ui.tableDensity";

export type PersistedTableDensity = "comfortable" | "compact";

export function readTableDensityPreference(): PersistedTableDensity {
  try {
    const value = window.localStorage.getItem(TABLE_DENSITY_KEY);
    if (value === "compact" || value === "comfortable") {
      return value;
    }
  } catch {
    // Preference is best-effort only.
  }
  return "comfortable";
}

export function persistTableDensityPreference(density: PersistedTableDensity): void {
  try {
    window.localStorage.setItem(TABLE_DENSITY_KEY, density);
  } catch {
    // Preference is best-effort only.
  }
}
