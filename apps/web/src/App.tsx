import { AppLayout } from "./components/AppLayout";

const shellRoutes = [
  { href: "#/login", label: "Login", section: "public" },
  { href: "#/dashboard", label: "Dashboard", section: "protected" },
  { href: "#/tenant", label: "Tenant", section: "protected" },
  { href: "#/members", label: "Members", section: "settings" },
  { href: "#/settings", label: "Settings", section: "settings" }
];

export function App() {
  return (
    <AppLayout navigationItems={shellRoutes}>
      <section className="hero-shell" aria-labelledby="app-shell-title">
        <div>
          <p className="eyebrow">Frontend app shell</p>
          <h1 id="app-shell-title">DCA OS v1</h1>
          <p>
            Minimal static shell for the auth, tenant, dashboard, members, and settings areas.
            Backend auth integration and tenant switching UI logic are intentionally deferred.
          </p>
        </div>
        <div className="api-config-card" aria-label="API configuration placeholder">
          <span>API base placeholder</span>
          <strong>/api/v1</strong>
        </div>
      </section>

      <section className="shell-grid" aria-label="Application shell placeholders">
        <article className="shell-card public-card" id="login">
          <p className="eyebrow">Unauthenticated</p>
          <h2>Login</h2>
          <p>Placeholder for the future login screen. No credential form or token storage is implemented.</p>
        </article>

        <article className="shell-card protected-card" id="dashboard">
          <p className="eyebrow">Protected layout</p>
          <h2>Dashboard</h2>
          <p>Authenticated dashboard placeholder for post-login landing content.</p>
        </article>

        <article className="shell-card protected-card" id="tenant">
          <p className="eyebrow">Tenant context</p>
          <h2>Tenant</h2>
          <p>Tenant switch placeholder area. No switch request or session lifecycle logic is wired yet.</p>
        </article>

        <article className="shell-card settings-card" id="members">
          <p className="eyebrow">Settings nav</p>
          <h2>Members</h2>
          <p>Member navigation placeholder only. No invite, editing, or full user management UI.</p>
        </article>

        <article className="shell-card settings-card" id="settings">
          <p className="eyebrow">Settings nav</p>
          <h2>Settings</h2>
          <p>Tenant settings placeholder for future safe profile fields.</p>
        </article>
      </section>
    </AppLayout>
  );
}
