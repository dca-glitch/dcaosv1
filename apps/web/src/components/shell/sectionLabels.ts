export function portalSectionLabel(section: string): string {
  const labels: Record<string, string> = {
    overview: "Overview",
    work: "Your work",
    library: "Library",
    account: "Account",
    client: "Your workspace",
    protected: "Overview",
    settings: "Account"
  };

  return labels[section] ?? section;
}

export function adminSectionLabel(section: string): string {
  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    mywork: "My work",
    clients: "Clients",
    delivery: "Delivery",
    results: "Results",
    library: "Library",
    finance: "Finance",
    administration: "Administration",
    // Legacy keys kept for any residual consumers
    protected: "Dashboard",
    core: "Delivery",
    client: "Clients",
    settings: "Administration"
  };

  return labels[section] ?? section;
}
