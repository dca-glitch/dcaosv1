export function portalSectionLabel(section: string): string {
  const labels: Record<string, string> = {
    client: "Archive",
    protected: "Overview",
    settings: "Settings"
  };

  return labels[section] ?? section;
}

export function adminSectionLabel(section: string): string {
  const labels: Record<string, string> = {
    protected: "Product",
    core: "Core workflows",
    client: "Client delivery",
    settings: "Settings",
    finance: "Finance"
  };

  return labels[section] ?? section;
}
