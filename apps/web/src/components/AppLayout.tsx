import { useEffect, useState, type MouseEvent } from "react";
import "./shell/shell.css";
import { AdminSidebar } from "./shell/AdminSidebar";
import { PortalSidebar } from "./shell/PortalSidebar";
import { AppTopbar } from "./shell/AppTopbar";
import { PageContainer } from "./shell/PageContainer";
import { useFocusTrap } from "./shell/useFocusTrap";

const SIDEBAR_COLLAPSED_KEY = "dca.shell.sidebarCollapsed";

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
  token?: string | null;
  navigationItems: AppLayoutNavigationItem[];
  onLogout: () => void;
  shellVariant?: AppLayoutShellVariant;
  user: AppLayoutUser;
  children: React.ReactNode;
};

function readCollapsedPreference(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function persistCollapsedPreference(collapsed: boolean): void {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    // Preference is best-effort only.
  }
}

function resolveEnvironmentMarker(): string | null {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return "LOCAL";
  }
  if (host.includes("staging") || host.includes("stage")) {
    return "STAGING";
  }
  return null;
}

export function AppLayout({
  activeView,
  currentTenant,
  isClientRole = false,
  token = null,
  navigationItems,
  onLogout,
  shellVariant = "admin",
  user,
  children
}: AppLayoutProps) {
  const isPortalShell = shellVariant === "portal";
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readCollapsedPreference());
  const environmentMarker = resolveEnvironmentMarker();
  const drawerTrapRef = useFocusTrap(navOpen);

  useEffect(() => {
    setNavOpen(false);
  }, [activeView]);

  useEffect(() => {
    if (!navOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNavOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  function handleSkipToContent(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const main = document.getElementById("shell-main-content");
    main?.focus({ preventScroll: false });
    if (typeof main?.scrollIntoView === "function") {
      main.scrollIntoView({ block: "start" });
    }
  }

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((current) => {
      const next = !current;
      persistCollapsedPreference(next);
      return next;
    });
  }

  return (
    <div
      className={isPortalShell ? "app-shell portal-shell" : "app-shell"}
      data-nav-open={navOpen ? "true" : "false"}
      data-sidebar-collapsed={sidebarCollapsed ? "true" : "false"}
    >
      <a className="shell-skip-link" href="#shell-main-content" onClick={handleSkipToContent}>
        Skip to content
      </a>
      {navOpen ? (
        <button
          aria-label="Close navigation"
          className="shell-nav-backdrop"
          onClick={() => setNavOpen(false)}
          type="button"
        />
      ) : null}
      <div className="shell-sidebar-slot" ref={drawerTrapRef}>
        {isPortalShell ? (
          <PortalSidebar
            activeView={activeView}
            collapsed={sidebarCollapsed}
            currentTenant={currentTenant}
            environmentMarker={environmentMarker}
            isClientRole={isClientRole}
            navigationItems={navigationItems}
            onCollapseToggle={toggleSidebarCollapsed}
            onLogout={onLogout}
            user={user}
          />
        ) : (
          <AdminSidebar
            activeView={activeView}
            collapsed={sidebarCollapsed}
            currentTenant={currentTenant}
            environmentMarker={environmentMarker}
            isClientRole={isClientRole}
            navigationItems={navigationItems}
            onCollapseToggle={toggleSidebarCollapsed}
            onLogout={onLogout}
            user={user}
          />
        )}
      </div>
      <div className="shell-content-column">
        <AppTopbar
          activeView={activeView}
          isClientRole={isClientRole}
          navOpen={navOpen}
          onNavToggle={() => setNavOpen((open) => !open)}
          shellVariant={shellVariant}
          token={token}
        />
        <main
          id="shell-main-content"
          className={isPortalShell ? "main-shell portal-main-shell shell-main" : "main-shell shell-main"}
          data-density={isPortalShell ? "comfortable" : "comfortable"}
          tabIndex={-1}
        >
          <PageContainer shellVariant={shellVariant}>{children}</PageContainer>
        </main>
      </div>
    </div>
  );
}
