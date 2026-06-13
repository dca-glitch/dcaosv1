import type { AppModuleContract } from "@dca-os-v1/shared";

type AppLayoutProps = {
  modules: AppModuleContract[];
  children: React.ReactNode;
};

export function AppLayout({ modules, children }: AppLayoutProps) {
  const navigation = modules.flatMap((moduleDefinition) => moduleDefinition.navigation);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <span className="brand-mark">DCA</span>
          <span>OS v1</span>
        </div>
        <nav className="nav-list">
          <a href="#dashboard">Dashboard</a>
          {navigation.map((item) => (
            <a key={item.id} href={`#${item.href.replace("/", "")}`}>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="main-shell">{children}</main>
    </div>
  );
}
