/** Display titles for shell topbar — keyed by existing hash view names. */
const VIEW_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  modules: "Modules",
  tenants: "Tenants",
  "client-portal": "Client Portal",
  briefs: "Briefs",
  "briefs-panel": "Briefs",
  "workflow-briefs": "Workflow Briefs",
  "pending-approvals": "Pending Approvals",
  "monthly-reports": "Monthly Reports",
  archive: "Archive",
  clients: "Clients",
  projects: "Projects",
  "ai-delivery": "AI Delivery",
  "ai-operations": "AI Operations",
  "ai-market-intelligence": "Market Intelligence",
  "content-plan-review": "Content Plan Review",
  "content-draft-review": "Content Draft Review",
  tasks: "Tasks",
  invoices: "Invoices",
  "credit-notes": "Credit Notes",
  "invoice-items": "Services Library",
  bills: "Bills",
  "company-profile": "Company Profile",
  settings: "Settings",
  team: "Team",
  "admin-daily-cockpit": "Daily Cockpit",
  "design-system": "Design System"
};

export function getShellViewTitle(activeView: string, shellVariant: "admin" | "portal"): string {
  if (shellVariant === "portal" && activeView === "client-portal") {
    return "Your archive";
  }

  return VIEW_TITLES[activeView] ?? activeView;
}
