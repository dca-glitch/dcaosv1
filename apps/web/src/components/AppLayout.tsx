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

function portalSectionLabel(section: string): string {
  if (section === "client") {
    return "Archive";
  }

  return section === "protected" ? "Product" : section;
}

function adminSectionLabel(section: string): string {
  return section === "protected" ? "Product" : section;
}

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
  const sectionLabel = isPortalShell ? portalSectionLabel : adminSectionLabel;

  return (
    <div className={isPortalShell ? "app-shell portal-shell" : "app-shell"}>
      <aside className="sidebar" aria-label={isPortalShell ? "Client archive navigation" : "Primary navigation"}>
        <div className="brand">
          <span className="brand-mark">DCA</span>
          <span className="brand-copy">
            <strong>{isPortalShell ? "Client Archive" : "DCA OS Lite"}</strong>
            <small>{isPortalShell ? "Read-only deliverables" : "Operations Command"}</small>
          </span>
        </div>
        <nav className="nav-list" aria-label={isPortalShell ? "Archive sections" : "Workspace modules"}>
          {Array.from(new Set(navigationItems.map((item) => item.section))).map((section) => (
            <div className="nav-section" key={section}>
              <span className="nav-section-label">{sectionLabel(section)}</span>
              {navigationItems
                .filter((item) => item.section === section)
                .map((item) => (
                  <a
                    aria-current={activeView === item.view ? "page" : undefined}
                    data-section={item.section}
                    href={`#/${item.view}`}
                    key={item.view}
                  >
                    {item.icon ? <span className="nav-icon">{item.icon}</span> : <span className="nav-dot" aria-hidden="true" />}
                    {isPortalShell && item.view === "client-portal" ? "Your archive" : item.label}
                  </a>
                ))}
            </div>
          ))}
        </nav>
        {!isPortalShell && !isClientRole ? (
          <div className="tenant-switch-placeholder">
            <span>Current tenant</span>
            <strong>{currentTenant?.name ?? "No tenant selected"}</strong>
            <small>{currentTenant?.slug ?? "missing context"}</small>
          </div>
        ) : null}
        <div className="user-panel">
          <span>{user.name || user.email}</span>
          <small>{user.email}</small>
          <button className="ghost-action shell-logout-action" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      </aside>
      <main className={isPortalShell ? "main-shell portal-main-shell" : "main-shell"}>{children}</main>
    </div>
  );
}
