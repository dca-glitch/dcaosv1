type AppLayoutProps = {
  navigationItems: Array<{
    href: string;
    label: string;
    section: string;
  }>;
  children: React.ReactNode;
};

export function AppLayout({ navigationItems, children }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <span className="brand-mark">DCA</span>
          <span>OS v1</span>
        </div>
        <nav className="nav-list">
          {navigationItems.map((item) => (
            <a key={item.href} href={item.href} data-section={item.section}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="tenant-switch-placeholder">
          <span>Current tenant</span>
          <strong>Selection placeholder</strong>
        </div>
      </aside>
      <main className="main-shell">{children}</main>
    </div>
  );
}
