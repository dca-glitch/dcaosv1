type AppLayoutNavigationItem = {
  view: string;
  label: string;
  section: string;
};

type AppLayoutTenant = {
  name: string;
  slug: string;
} | null;

type AppLayoutUser = {
  email: string;
  name?: string | null;
};

type AppLayoutProps = {
  activeView: string;
  currentTenant: AppLayoutTenant;
  navigationItems: AppLayoutNavigationItem[];
  onLogout: () => void;
  user: AppLayoutUser;
  children: React.ReactNode;
};

export function AppLayout({
  activeView,
  currentTenant,
  navigationItems,
  onLogout,
  user,
  children
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <span className="brand-mark">DCA</span>
          <span className="brand-copy">
            <strong>DCA OS Lite</strong>
            <small>Operations Command</small>
          </span>
        </div>
        <nav className="nav-list" aria-label="Workspace modules">
          {Array.from(new Set(navigationItems.map((item) => item.section))).map((section) => (
            <div className="nav-section" key={section}>
              <span className="nav-section-label">{section === "protected" ? "Product" : section}</span>
              {navigationItems
                .filter((item) => item.section === section)
                .map((item) => (
                  <a
                    aria-current={activeView === item.view ? "page" : undefined}
                    data-section={item.section}
                    href={`#/${item.view}`}
                    key={item.view}
                  >
                    <span className="nav-dot" aria-hidden="true" />
                    {item.label}
                  </a>
                ))}
            </div>
          ))}
        </nav>
        <div className="tenant-switch-placeholder">
          <span>Current tenant</span>
          <strong>{currentTenant?.name ?? "No tenant selected"}</strong>
          <small>{currentTenant?.slug ?? "missing context"}</small>
        </div>
        <div className="user-panel">
          <span>{user.name || user.email}</span>
          <small>{user.email}</small>
          <button className="ghost-action shell-logout-action" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      </aside>
      <main className="main-shell">{children}</main>
    </div>
  );
}
