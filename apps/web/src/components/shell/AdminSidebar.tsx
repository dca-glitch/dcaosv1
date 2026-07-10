import { ShellBrand } from "./ShellBrand";
import { ShellNav } from "./ShellNav";
import { ShellUserPanel } from "./ShellUserPanel";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import type { ShellNavigationItem, ShellTenant, ShellUser } from "./types";

type AdminSidebarProps = {
  activeView: string;
  currentTenant: ShellTenant;
  navigationItems: ShellNavigationItem[];
  onLogout: () => void;
  user: ShellUser;
};

export function AdminSidebar({
  activeView,
  currentTenant,
  navigationItems,
  onLogout,
  user
}: AdminSidebarProps) {
  return (
    <aside className="sidebar shell-sidebar shell-sidebar--admin" aria-label="Primary navigation">
      <ShellBrand shellVariant="admin" />
      <WorkspaceSwitcher currentTenant={currentTenant} />
      <ShellNav activeView={activeView} navigationItems={navigationItems} shellVariant="admin" />
      <ShellUserPanel user={user} onLogout={onLogout} />
    </aside>
  );
}
