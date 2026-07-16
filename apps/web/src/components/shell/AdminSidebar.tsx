import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ShellBrand } from "./ShellBrand";
import { ShellNav } from "./ShellNav";
import { ShellUserPanel } from "./ShellUserPanel";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import type { ShellNavigationItem, ShellTenant, ShellUser } from "./types";

type AdminSidebarProps = {
  activeView: string;
  collapsed?: boolean;
  currentTenant: ShellTenant;
  environmentMarker?: string | null;
  isClientRole?: boolean;
  navigationItems: ShellNavigationItem[];
  onCollapseToggle?: () => void;
  onLogout: () => void;
  user: ShellUser;
};

export function AdminSidebar({
  activeView,
  collapsed = false,
  currentTenant,
  environmentMarker = null,
  isClientRole = false,
  navigationItems,
  onCollapseToggle,
  onLogout,
  user
}: AdminSidebarProps) {
  return (
    <aside
      className={
        collapsed
          ? "sidebar shell-sidebar shell-sidebar--admin shell-sidebar--collapsed"
          : "sidebar shell-sidebar shell-sidebar--admin"
      }
      aria-label="Primary navigation"
      id="shell-primary-nav"
      data-collapsed={collapsed ? "true" : "false"}
    >
      <ShellBrand isClientRole={isClientRole} shellVariant="admin" />
      <WorkspaceSwitcher currentTenant={currentTenant} collapsed={collapsed} />
      <ShellNav
        activeView={activeView}
        collapsed={collapsed}
        navigationItems={navigationItems}
        shellVariant="admin"
      />
      <div className="shell-sidebar-footer">
        {environmentMarker ? (
          <span className="shell-env-marker" title={`Environment: ${environmentMarker}`}>
            {environmentMarker}
          </span>
        ) : null}
        {onCollapseToggle ? (
          <button
            type="button"
            className="shell-collapse-toggle"
            onClick={onCollapseToggle}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} strokeWidth={2} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={16} strokeWidth={2} aria-hidden="true" />
            )}
            {!collapsed ? <span>Collapse</span> : null}
          </button>
        ) : null}
        <ShellUserPanel user={user} onLogout={onLogout} collapsed={collapsed} />
      </div>
    </aside>
  );
}
