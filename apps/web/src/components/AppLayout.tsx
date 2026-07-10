import "./shell/shell.css";
import { AdminSidebar } from "./shell/AdminSidebar";
import { PortalSidebar } from "./shell/PortalSidebar";
import { AppTopbar } from "./shell/AppTopbar";
import { PageContainer } from "./shell/PageContainer";

type AppLayoutNavigationItem = {
  view: string;
  label: string;
  section: string;
  icon?: React.ReactNode;
};

type AppLayoutTenant = {
  name: string;
  slug: string;
} | null;

type AppLayoutUser = {
  email: string;
  name?: string | null;
};

type AppLayoutShellVariant = "admin" | "portal";

type AppLayoutProps = {
  activeView: string;
  currentTenant: AppLayoutTenant;
  isClientRole?: boolean;
  navigationItems: AppLayoutNavigationItem[];
  onLogout: () => void;
  shellVariant?: AppLayoutShellVariant;
  user: AppLayoutUser;
  children: React.ReactNode;
};

export function AppLayout({
  activeView,
  currentTenant,
  isClientRole = false,
  navigationItems,
  onLogout,
  shellVariant = "admin",
  user,
  children
}: AppLayoutProps) {
  const isPortalShell = shellVariant === "portal";
  void isClientRole;

  return (
    <div className={isPortalShell ? "app-shell portal-shell" : "app-shell"}>
      <a className="shell-skip-link" href="#shell-main-content">
        Skip to content
      </a>
      {isPortalShell ? (
        <PortalSidebar
          activeView={activeView}
          currentTenant={currentTenant}
          navigationItems={navigationItems}
          onLogout={onLogout}
          user={user}
        />
      ) : (
        <AdminSidebar
          activeView={activeView}
          currentTenant={currentTenant}
          navigationItems={navigationItems}
          onLogout={onLogout}
          user={user}
        />
      )}
      <div className="shell-content-column">
        <AppTopbar activeView={activeView} shellVariant={shellVariant} />
        <main
          id="shell-main-content"
          className={isPortalShell ? "main-shell portal-main-shell shell-main" : "main-shell shell-main"}
          data-density={isPortalShell ? "comfortable" : "compact"}
          tabIndex={-1}
        >
          <PageContainer shellVariant={shellVariant}>{children}</PageContainer>
        </main>
      </div>
    </div>
  );
}
