/** Display titles for shell topbar — keyed by existing hash view names. */
const VIEW_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  modules: "Modules",
  tenants: "Tenants",
  "client-portal": "Client archive",
  briefs: "Tasks",
  "briefs-panel": "Briefs",
  "workflow-briefs": "Content plans",
  "pending-approvals": "Approvals",
  "monthly-reports": "Reports",
  archive: "Assets",
  clients: "Workspaces",
  projects: "Projects",
  "ai-delivery": "AI Delivery",
  "ai-operations": "AI operations",
  "ai-market-intelligence": "Analytics",
  "content-plan-review": "Content plan review",
  "content-draft-review": "Content draft review",
  tasks: "Tasks",
  invoices: "Invoices",
  "credit-notes": "Credit notes",
  "invoice-items": "Services library",
  bills: "Bills",
  "company-profile": "Company profile",
  settings: "Settings",
  team: "Users and roles",
  "admin-daily-cockpit": "Attention required",
  "design-system": "Design system"
};

export function getShellViewTitle(activeView: string, shellVariant: "admin" | "portal"): string {
  if (shellVariant === "portal") {
    if (activeView === "client-portal") {
      return "Content";
    }
    if (activeView === "dashboard") {
      return "Overview";
    }
    if (activeView === "briefs") {
      return "Tasks";
    }
    if (activeView === "archive") {
      return "Assets";
    }
  }

  return VIEW_TITLES[activeView] ?? activeView;
}
