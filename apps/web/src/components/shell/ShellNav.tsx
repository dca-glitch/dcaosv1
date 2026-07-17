import {
  Archive,
  BarChart2,
  Briefcase,
  Building2,
  CircleAlert,
  ClipboardList,
  Clock,
  Cpu,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LayoutGrid,
  Receipt,
  Settings,
  Sparkles,
  Users,
  Wallet
} from "lucide-react";
import type { ReactNode } from "react";
import type { ShellNavigationItem, ShellVariant } from "./types";
import { adminSectionLabel, portalSectionLabel } from "./sectionLabels";

const ADMIN_ICONS: Record<string, ReactNode> = {
  dashboard: <LayoutDashboard size={16} strokeWidth={2} aria-hidden="true" />,
  modules: <LayoutGrid size={16} strokeWidth={2} aria-hidden="true" />,
  tenants: <Building2 size={16} strokeWidth={2} aria-hidden="true" />,
  "client-portal": <Archive size={16} strokeWidth={2} aria-hidden="true" />,
  "briefs-panel": <ClipboardList size={16} strokeWidth={2} aria-hidden="true" />,
  "workflow-briefs": <ClipboardList size={16} strokeWidth={2} aria-hidden="true" />,
  clients: <Users size={16} strokeWidth={2} aria-hidden="true" />,
  projects: <FolderKanban size={16} strokeWidth={2} aria-hidden="true" />,
  "ai-delivery": <Sparkles size={16} strokeWidth={2} aria-hidden="true" />,
  "admin-daily-cockpit": <CircleAlert size={16} strokeWidth={2} aria-hidden="true" />,
  "ai-operations": <Cpu size={16} strokeWidth={2} aria-hidden="true" />,
  "ai-market-intelligence": <BarChart2 size={16} strokeWidth={2} aria-hidden="true" />,
  tasks: <Briefcase size={16} strokeWidth={2} aria-hidden="true" />,
  invoices: <FileText size={16} strokeWidth={2} aria-hidden="true" />,
  "credit-notes": <Receipt size={16} strokeWidth={2} aria-hidden="true" />,
  "invoice-items": <Wallet size={16} strokeWidth={2} aria-hidden="true" />,
  bills: <Receipt size={16} strokeWidth={2} aria-hidden="true" />,
  "company-profile": <Building2 size={16} strokeWidth={2} aria-hidden="true" />,
  settings: <Settings size={16} strokeWidth={2} aria-hidden="true" />,
  team: <Users size={16} strokeWidth={2} aria-hidden="true" />,
  briefs: <ClipboardList size={16} strokeWidth={2} aria-hidden="true" />,
  "pending-approvals": <Clock size={16} strokeWidth={2} aria-hidden="true" />,
  "monthly-reports": <BarChart2 size={16} strokeWidth={2} aria-hidden="true" />,
  archive: <Archive size={16} strokeWidth={2} aria-hidden="true" />
};

type ShellNavProps = {
  activeView: string;
  collapsed?: boolean;
  navigationItems: ShellNavigationItem[];
  shellVariant: ShellVariant;
};

function resolveIcon(item: ShellNavigationItem, isActive: boolean): ReactNode {
  const icon = item.icon ?? ADMIN_ICONS[item.view] ?? (
    <span className="nav-dot" aria-hidden="true" />
  );

  return (
    <span
      className={isActive ? "shell-nav-icon shell-nav-icon--active" : "shell-nav-icon"}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}

export function ShellNav({
  activeView,
  collapsed = false,
  navigationItems,
  shellVariant
}: ShellNavProps) {
  const isPortal = shellVariant === "portal";
  const sectionLabel = isPortal ? portalSectionLabel : adminSectionLabel;
  const sections = Array.from(new Set(navigationItems.map((item) => item.section)));

  return (
    <nav
      className={collapsed ? "sidebar-nav nav-list shell-nav shell-nav--collapsed" : "sidebar-nav nav-list shell-nav"}
      aria-label={isPortal ? "Workspace sections" : "Workspace modules"}
    >
      {sections.map((section) => (
        <div className="nav-section" key={section}>
          {!collapsed ? <span className="nav-section-label">{sectionLabel(section)}</span> : null}
          {navigationItems
            .filter((item) => item.section === section)
            .map((item) => {
              const isActive = activeView === item.view;
              const label =
                isPortal && item.view === "client-portal" ? item.label : item.label;

              return (
                <a
                  aria-current={isActive ? "page" : undefined}
                  aria-label={collapsed ? label : undefined}
                  className={isActive ? "shell-nav-link shell-nav-link--active" : "shell-nav-link"}
                  data-section={item.section}
                  href={`#/${item.view}`}
                  key={item.view}
                  title={label}
                >
                  {resolveIcon(item, isActive)}
                  {!collapsed ? <span className="shell-nav-label">{label}</span> : null}
                  {isActive ? <span className="shell-nav-indicator" aria-hidden="true" /> : null}
                </a>
              );
            })}
        </div>
      ))}
    </nav>
  );
}
