import {
  Archive,
  BarChart2,
  Briefcase,
  Building2,
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
  dashboard: <LayoutDashboard size={13} strokeWidth={2} aria-hidden="true" />,
  modules: <LayoutGrid size={13} strokeWidth={2} aria-hidden="true" />,
  tenants: <Building2 size={13} strokeWidth={2} aria-hidden="true" />,
  "client-portal": <Archive size={13} strokeWidth={2} aria-hidden="true" />,
  "briefs-panel": <ClipboardList size={13} strokeWidth={2} aria-hidden="true" />,
  "workflow-briefs": <ClipboardList size={13} strokeWidth={2} aria-hidden="true" />,
  clients: <Users size={13} strokeWidth={2} aria-hidden="true" />,
  projects: <FolderKanban size={13} strokeWidth={2} aria-hidden="true" />,
  "ai-delivery": <Sparkles size={13} strokeWidth={2} aria-hidden="true" />,
  "admin-daily-cockpit": <LayoutDashboard size={13} strokeWidth={2} aria-hidden="true" />,
  "ai-operations": <Cpu size={13} strokeWidth={2} aria-hidden="true" />,
  "ai-market-intelligence": <BarChart2 size={13} strokeWidth={2} aria-hidden="true" />,
  tasks: <Briefcase size={13} strokeWidth={2} aria-hidden="true" />,
  invoices: <FileText size={13} strokeWidth={2} aria-hidden="true" />,
  "credit-notes": <Receipt size={13} strokeWidth={2} aria-hidden="true" />,
  "invoice-items": <Wallet size={13} strokeWidth={2} aria-hidden="true" />,
  bills: <Receipt size={13} strokeWidth={2} aria-hidden="true" />,
  "company-profile": <Building2 size={13} strokeWidth={2} aria-hidden="true" />,
  settings: <Settings size={13} strokeWidth={2} aria-hidden="true" />,
  team: <Users size={13} strokeWidth={2} aria-hidden="true" />,
  briefs: <ClipboardList size={13} strokeWidth={2} aria-hidden="true" />,
  "pending-approvals": <Clock size={13} strokeWidth={2} aria-hidden="true" />,
  "monthly-reports": <BarChart2 size={13} strokeWidth={2} aria-hidden="true" />,
  archive: <Archive size={13} strokeWidth={2} aria-hidden="true" />
};

type ShellNavProps = {
  activeView: string;
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

export function ShellNav({ activeView, navigationItems, shellVariant }: ShellNavProps) {
  const isPortal = shellVariant === "portal";
  const sectionLabel = isPortal ? portalSectionLabel : adminSectionLabel;
  const sections = Array.from(new Set(navigationItems.map((item) => item.section)));

  return (
    <nav
      className="sidebar-nav nav-list shell-nav"
      aria-label={isPortal ? "Archive sections" : "Workspace modules"}
    >
      {sections.map((section) => (
        <div className="nav-section" key={section}>
          <span className="nav-section-label">{sectionLabel(section)}</span>
          {navigationItems
            .filter((item) => item.section === section)
            .map((item) => {
              const isActive = activeView === item.view;
              const label =
                isPortal && item.view === "client-portal" ? "Your archive" : item.label;

              return (
                <a
                  aria-current={isActive ? "page" : undefined}
                  className={isActive ? "shell-nav-link shell-nav-link--active" : "shell-nav-link"}
                  data-section={item.section}
                  href={`#/${item.view}`}
                  key={item.view}
                >
                  {resolveIcon(item, isActive)}
                  <span className="shell-nav-label">{label}</span>
                </a>
              );
            })}
        </div>
      ))}
    </nav>
  );
}
