import { ShellBrand } from "./ShellBrand";
import { ShellNav } from "./ShellNav";
import { ShellUserPanel } from "./ShellUserPanel";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import type { ShellNavigationItem, ShellTenant, ShellUser } from "./types";

type PortalSidebarProps = {
  activeView: string;
  currentTenant: ShellTenant;
  navigationItems: ShellNavigationItem[];
  onLogout: () => void;
  user: ShellUser;
};

export function PortalSidebar({
  activeView,
  currentTenant,
  navigationItems,
  onLogout,
  user
}: PortalSidebarProps) {
  return (
    <aside
      className="sidebar shell-sidebar shell-sidebar--portal"
      aria-label="Client archive navigation"
      id="shell-primary-nav"
    >
      <ShellBrand shellVariant="portal" />
      <WorkspaceSwitcher currentTenant={currentTenant} />
      <ShellNav activeView={activeView} navigationItems={navigationItems} shellVariant="portal" />
      <ShellUserPanel user={user} onLogout={onLogout} />
    </aside>
  );
}
