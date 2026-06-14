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
          <span>OS v1</span>
        </div>
        <nav className="nav-list">
          {navigationItems.map((item) => (
            <a
              aria-current={activeView === item.view ? "page" : undefined}
              data-section={item.section}
              href={`#/${item.view}`}
              key={item.view}
            >
              {item.label}
            </a>
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
          <button className="secondary-action" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      </aside>
      <main className="main-shell">{children}</main>
    </div>
  );
}
