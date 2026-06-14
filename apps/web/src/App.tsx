import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "./components/AppLayout";
import { CompanyProfilePage, type CompanyProfileFormValues, type CompanyProfileSummary } from "./pages/company-profile/CompanyProfilePage";
import { ClientsPage, type ClientFormValues, type ClientSummary } from "./pages/clients/ClientsPage";
import { ProjectsPage, type ProjectFormValues, type ProjectSummary } from "./pages/projects/ProjectsPage";
import { TasksPage, type TaskFormValues, type TaskSummary } from "./pages/tasks/TasksPage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";
const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const LOGIN_HASH = "#/login";
const DASHBOARD_HASH = "#/dashboard";

type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
};

type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type UserSummary = {
  id: string;
  email: string;
  name?: string | null;
  status: string;
  forcePasswordChange?: boolean;
  lastLoginAt?: string | null;
};

type MembershipSummary = {
  tenantId: string;
  tenantMembershipId: string;
  roles: string[];
};

type AuthLoginResponse = {
  user: UserSummary;
  session: {
    token: string;
    expiresAt: string;
    ttlMinutes: number;
  };
  tenantContext: {
    activeMembership: MembershipSummary | null;
    memberships: MembershipSummary[];
  };
};

type AuthCurrentUserResponse = {
  user: UserSummary;
  session: {
    createdAt: string;
    expiresAt: string;
    lastSeenAt: string | null;
    revokedAt: string | null;
  };
  tenantContext: {
    activeMembership: MembershipSummary | null;
    memberships: MembershipSummary[];
  };
};

type AuthContextResponse = {
  user: UserSummary;
  tenantContext: {
    activeTenant: {
      tenantId: string;
      tenantMembershipId: string;
    } | null;
    activeMembership: MembershipSummary | null;
    memberships: MembershipSummary[];
    roles: string[];
  };
  effectivePermissions: string[];
};

type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type TenantMembershipCard = {
  tenant: TenantSummary;
  tenantMembershipId: string;
  roles: string[];
};

type TenantListResponse = {
  user: UserSummary;
  currentTenant: TenantMembershipCard | null;
  availableTenants: TenantMembershipCard[];
};

type TenantMemberSummary = {
  tenantMembershipId: string;
  user: UserSummary;
  status: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
};

type TenantMembersResponse = {
  tenant: TenantSummary;
  currentMembership: MembershipSummary;
  members: TenantMemberSummary[];
};

type TenantSettingsResponse = {
  tenant: TenantSummary;
  currentMembership: MembershipSummary;
};

type ModuleListItem = {
  key: string;
  name: string;
  description: string;
  status: string;
  version?: string;
};

type TenantModuleSummary = ModuleListItem & {
  enabled: boolean;
  tenantModuleId?: string;
  tenantModuleStatus?: string;
};

type ModuleRegistryResponse = {
  modules: ModuleListItem[];
};

type TenantModulesResponse = {
  currentMembership: MembershipSummary;
  modules: TenantModuleSummary[];
};

type CompanyProfileResponse = {
  companyProfile: CompanyProfileSummary | null;
};

type ClientsResponse = {
  clients: ClientSummary[];
};

type ProjectsResponse = {
  projects: ProjectSummary[];
};

type TasksResponse = {
  tasks: TaskSummary[];
};

type ViewKey =
  | "dashboard"
  | "modules"
  | "tenants"
  | "clients"
  | "projects"
  | "tasks"
  | "company-profile"
  | "settings"
  | "team";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

type AuthLoginRequest = {
  email: string;
  password: string;
  turnstileToken?: string;
};

type TurnstileWidgetHandle = {
  render: (
    container: string | HTMLElement,
    options: {
      sitekey: string;
      callback?: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      "timeout-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
      appearance?: "always" | "execute" | "interaction-only";
    }
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileWidgetHandle;
  }
}

const navigationItems: Array<{ view: ViewKey; label: string; section: string }> = [
  { view: "dashboard", label: "Dashboard", section: "protected" },
  { view: "modules", label: "Modules", section: "protected" },
  { view: "tenants", label: "Tenants", section: "protected" },
  { view: "clients", label: "Clients", section: "core" },
  { view: "projects", label: "Projects", section: "core" },
  { view: "tasks", label: "Tasks", section: "core" },
  { view: "company-profile", label: "Company Profile", section: "settings" },
  { view: "settings", label: "Settings", section: "settings" },
  { view: "team", label: "Team", section: "settings" }
];

function getInitialToken(): string | null {
  try {
    return window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string | null): void {
  try {
    if (token) {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, token);
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // In-memory state still handles the current tab when sessionStorage is unavailable.
  }
}

function replaceHash(hash: string): void {
  const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
  window.history.replaceState(null, "", nextUrl);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

function normalizeHash(hash: string): ViewKey {
  const value = hash.replace(/^#\/?/, "");
  return navigationItems.some((item) => item.view === value) ? (value as ViewKey) : "dashboard";
}

function maskError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Request could not be completed.";
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok && payload.ok) {
    return {
      ok: false,
      error: {
        code: "REQUEST_FAILED",
        message: "Request could not be completed."
      }
    };
  }

  return payload;
}

function getErrorMessage(response: ApiFailure): string {
  if (response.error.code === "AUTH_LOGIN_FAILED") {
    return "Invalid email or password.";
  }

  if (response.error.code === "AUTH_UNAUTHORIZED") {
    return "Please sign in again.";
  }

  if (response.error.code === "AUTH_FORBIDDEN") {
    return "You do not have access to that action.";
  }

  return response.error.message || "Request could not be completed.";
}

function isUnauthorized(response: ApiResponse<unknown>): response is ApiFailure {
  return !response.ok && response.error.code === "AUTH_UNAUTHORIZED";
}

function hasModuleAdminAccess(context: AuthContextResponse | null): boolean {
  return hasPermission(context, "modules:manage") || hasActiveRole(context, ["owner", "admin"]);
}

function hasPermission(context: AuthContextResponse | null, permission: string): boolean {
  return Boolean(context?.effectivePermissions.includes(permission));
}

function hasActiveRole(context: AuthContextResponse | null, roles: string[]): boolean {
  return Boolean(
    context?.tenantContext.roles.some((role) => roles.includes(role))
  );
}

function StatusNotice({ tone, message }: { tone: "info" | "error" | "success"; message: string }) {
  return (
    <div className={`status-notice status-${tone}`} role={tone === "error" ? "alert" : "status"}>
      {message}
    </div>
  );
}

function TurnstileWidget({
  siteKey,
  resetSignal,
  onTokenChange
}: {
  siteKey: string;
  resetSignal: number;
  onTokenChange: (token: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return;
    }

    let cancelled = false;
    let script = document.querySelector<HTMLScriptElement>("script[data-turnstile-script='true']");

    const removeWidget = () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile) {
        return;
      }

      removeWidget();

      containerRef.current.innerHTML = "";
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "auto",
        appearance: "always",
        callback: (token: string) => onTokenChange(token),
        "error-callback": () => onTokenChange(null),
        "expired-callback": () => onTokenChange(null),
        "timeout-callback": () => onTokenChange(null)
      });
    };

    const handleScriptLoad = () => {
      if (script) {
        script.dataset.turnstileLoaded = "true";
      }
      renderWidget();
    };

    const handleScriptError = () => {
      if (!cancelled) {
        onTokenChange(null);
      }
    };

    const ensureScript = () => {
      if (!script) {
        script = document.createElement("script");
        script.async = false;
        script.defer = false;
        script.src = TURNSTILE_SCRIPT_URL;
        script.dataset.turnstileScript = "true";
        document.head.appendChild(script);
      } else {
        script.async = false;
        script.defer = false;
        script.removeAttribute("async");
        script.removeAttribute("defer");
      }

      if (window.turnstile) {
        renderWidget();
        return;
      }

      if (script.dataset.turnstileLoaded === "true") {
        renderWidget();
        return;
      }

      script.addEventListener("load", handleScriptLoad);
      script.addEventListener("error", handleScriptError);
    };

    ensureScript();

    return () => {
      cancelled = true;
      script?.removeEventListener("load", handleScriptLoad);
      script?.removeEventListener("error", handleScriptError);
      removeWidget();
    };
  }, [onTokenChange, resetSignal, siteKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className="turnstile-panel">
      <div className="turnstile-slot" ref={containerRef} />
    </div>
  );
}

function LoginScreen({
  onLogin,
  loading,
  error
}: {
  onLogin: (email: string, password: string, turnstileToken?: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);

  useEffect(() => {
    if (error) {
      setTurnstileToken(null);
      setTurnstileResetSignal((value) => value + 1);
    }
  }, [error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      return;
    }

    await onLogin(email, password, turnstileToken ?? undefined);
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div>
          <p className="eyebrow">DCA OS v1</p>
          <h1 id="login-title">Sign In</h1>
        </div>
        {error ? <StatusNotice tone="error" message={error} /> : null}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          {TURNSTILE_SITE_KEY ? (
            <div className="turnstile-block">
              <TurnstileWidget
                onTokenChange={setTurnstileToken}
                resetSignal={turnstileResetSignal}
                siteKey={TURNSTILE_SITE_KEY}
              />
              <small className="turnstile-help">
                Complete the verification challenge before signing in.
              </small>
            </div>
          ) : null}
          <button className="primary-action" disabled={loading || (Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)} type="submit">
            {loading ? "Signing in" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

function DashboardView({
  user,
  context,
  tenants
}: {
  user: UserSummary;
  context: AuthContextResponse | null;
  tenants: TenantListResponse | null;
}) {
  const activeTenant = tenants?.currentTenant?.tenant;
  const roles = context?.tenantContext.roles ?? [];

  return (
    <section className="view-section" aria-labelledby="dashboard-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 id="dashboard-title">Dashboard</h1>
        </div>
      </div>
      <div className="summary-grid">
        <article className="summary-panel">
          <span>User</span>
          <strong>{user.name || user.email}</strong>
          <small>{user.status}</small>
        </article>
        <article className="summary-panel">
          <span>Tenant</span>
          <strong>{activeTenant?.name ?? "No active tenant"}</strong>
          <small>{activeTenant?.slug ?? "not selected"}</small>
        </article>
        <article className="summary-panel">
          <span>Roles</span>
          <strong>{roles.length ? roles.join(", ") : "None"}</strong>
          <small>{context?.effectivePermissions.length ?? 0} permissions</small>
        </article>
      </div>
    </section>
  );
}

function TenantView({
  tenants,
  onSwitchTenant,
  switchingTenantMembershipId
}: {
  tenants: TenantListResponse | null;
  onSwitchTenant: (tenantMembershipId: string) => Promise<void>;
  switchingTenantMembershipId: string | null;
}) {
  const availableTenants = tenants?.availableTenants ?? [];
  const currentMembershipId = tenants?.currentTenant?.tenantMembershipId ?? null;

  return (
    <section className="view-section" aria-labelledby="tenant-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">Tenant Context</p>
          <h1 id="tenant-title">Tenants</h1>
        </div>
      </div>
      {availableTenants.length === 0 ? (
        <div className="state-panel">No active tenant memberships were found.</div>
      ) : (
        <div className="tenant-list">
          {availableTenants.map((membership) => {
            const isCurrent = membership.tenantMembershipId === currentMembershipId;
            return (
              <article className="tenant-row" key={membership.tenantMembershipId}>
                <div>
                  <strong>{membership.tenant.name}</strong>
                  <span>{membership.tenant.slug}</span>
                </div>
                <div className="tenant-row-actions">
                  <span>{membership.roles.join(", ") || "no roles"}</span>
                  <button
                    className="secondary-action"
                    disabled={isCurrent || switchingTenantMembershipId === membership.tenantMembershipId}
                    onClick={() => void onSwitchTenant(membership.tenantMembershipId)}
                    type="button"
                  >
                    {isCurrent ? "Current" : "Switch"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ModuleRegistryView({
  availableModules,
  tenantModules,
  canManageModules,
  moduleActionKey,
  selectedModuleKey,
  onSetModuleEnabled
}: {
  availableModules: ModuleListItem[];
  tenantModules: TenantModuleSummary[];
  canManageModules: boolean;
  moduleActionKey: string | null;
  selectedModuleKey: string | null;
  onSetModuleEnabled: (moduleKey: string, enabled: boolean) => Promise<void>;
}) {
  const tenantModuleByKey = useMemo(
    () => new Map(tenantModules.map((moduleItem) => [moduleItem.key, moduleItem])),
    [tenantModules]
  );

  return (
    <section className="view-section" aria-labelledby="modules-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">Module Registry</p>
          <h1 id="modules-title">Modules</h1>
        </div>
      </div>
      <div className="module-grid">
        {availableModules.map((moduleItem) => {
          const tenantModule = tenantModuleByKey.get(moduleItem.key);
          const enabled = tenantModule?.enabled ?? false;
          const busy = moduleActionKey === moduleItem.key;

          return (
            <article className="module-card" key={moduleItem.key}>
              <div>
                <span className={`module-status module-status-${enabled ? "enabled" : "idle"}`}>
                  {enabled ? "Enabled" : "Disabled"}
                </span>
                <h2>{moduleItem.name}</h2>
                <p>{moduleItem.description}</p>
              </div>
              <dl>
                <div>
                  <dt>Key</dt>
                  <dd>{moduleItem.key}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{moduleItem.status}</dd>
                </div>
              </dl>
              <button
                className={enabled ? "secondary-action" : "primary-action"}
                disabled={!canManageModules || busy}
                onClick={() => void onSetModuleEnabled(moduleItem.key, !enabled)}
                type="button"
              >
                {enabled ? "Disable" : "Enable"}
              </button>
              <a className="module-link" href={`#/modules/${moduleItem.key}`}>
                Open placeholder
              </a>
            </article>
          );
        })}
      </div>
      {selectedModuleKey ? (
        <div className="module-placeholder-panel" aria-live="polite">
          <p className="eyebrow">Module Placeholder</p>
          <h2>{selectedModuleKey}</h2>
          <p>
            This module has a reserved route placeholder only. Finance Lite, marketplace loading, billing,
            and dynamic plugin mounting are intentionally out of scope for this MVP shell.
          </p>
        </div>
      ) : null}
      {!canManageModules ? (
        <StatusNotice tone="info" message="Read-only access. Module actions require an owner or admin tenant role." />
      ) : null}
    </section>
  );
}

function PlaceholderView({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <section className="view-section" aria-labelledby={`${title.toLowerCase()}-title`}>
      <div className="section-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 id={`${title.toLowerCase()}-title`}>{title}</h1>
        </div>
      </div>
      <div className="state-panel">This area is reserved for the next backend-backed pass.</div>
    </section>
  );
}

function TeamView({
  authContext,
  teamMembers
}: {
  authContext: AuthContextResponse | null;
  teamMembers: TenantMembersResponse | null;
}) {
  const canReadUsers = hasPermission(authContext, "users:read") || hasActiveRole(authContext, ["owner", "admin"]);
  const members = teamMembers?.members ?? [];

  return (
    <section className="view-section" aria-labelledby="team-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">Team</p>
          <h1 id="team-title">Members</h1>
        </div>
      </div>
      {!canReadUsers ? (
        <StatusNotice tone="info" message="Member visibility requires tenant user read access." />
      ) : null}
      {canReadUsers && members.length === 0 ? (
        <div className="state-panel">No active members were found for this tenant.</div>
      ) : null}
      {canReadUsers && members.length > 0 ? (
        <div className="table-wrap" aria-label="Tenant members">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.tenantMembershipId}>
                  <td>{member.user.name || "Unassigned"}</td>
                  <td>{member.user.email}</td>
                  <td>{member.roles.join(", ") || "None"}</td>
                  <td>{member.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function SettingsView({
  authContext,
  currentUser,
  tenantSettings
}: {
  authContext: AuthContextResponse | null;
  currentUser: UserSummary;
  tenantSettings: TenantSettingsResponse | null;
}) {
  const canReadSettings =
    hasPermission(authContext, "settings:read") || hasActiveRole(authContext, ["owner", "admin"]);

  return (
    <section className="view-section" aria-labelledby="settings-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1 id="settings-title">Settings</h1>
        </div>
      </div>
      <div className="summary-grid">
        <article className="summary-panel">
          <span>Profile</span>
          <strong>{currentUser.name || currentUser.email}</strong>
          <small>{currentUser.email}</small>
        </article>
        <article className="summary-panel">
          <span>Tenant</span>
          <strong>{tenantSettings?.tenant.name ?? "Unavailable"}</strong>
          <small>{tenantSettings?.tenant.slug ?? "read-only context"}</small>
        </article>
        <article className="summary-panel">
          <span>Access</span>
          <strong>{canReadSettings ? "Readable" : "Limited"}</strong>
          <small>{authContext?.effectivePermissions.length ?? 0} effective permissions</small>
        </article>
      </div>
      {!canReadSettings ? (
        <StatusNotice tone="info" message="Tenant settings visibility requires settings read access." />
      ) : null}
      <div className="state-panel">
        Settings are read-only in this MVP shell. Password reset, OAuth, billing, invite flow, and destructive
        tenant changes remain out of scope.
      </div>
    </section>
  );
}

export function App() {
  const [activeView, setActiveView] = useState<ViewKey>(() => normalizeHash(window.location.hash));
  const [selectedModuleKey, setSelectedModuleKey] = useState<string | null>(() =>
    window.location.hash.startsWith("#/modules/") ? window.location.hash.replace("#/modules/", "") : null
  );
  const [token, setToken] = useState<string | null>(() => getInitialToken());
  const [currentUser, setCurrentUser] = useState<AuthCurrentUserResponse | null>(null);
  const [authContext, setAuthContext] = useState<AuthContextResponse | null>(null);
  const [tenantContext, setTenantContext] = useState<TenantListResponse | null>(null);
  const [teamMembers, setTeamMembers] = useState<TenantMembersResponse | null>(null);
  const [tenantSettings, setTenantSettings] = useState<TenantSettingsResponse | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileResponse | null>(null);
  const [clients, setClients] = useState<ClientsResponse | null>(null);
  const [projects, setProjects] = useState<ProjectsResponse | null>(null);
  const [tasks, setTasks] = useState<TasksResponse | null>(null);
  const [availableModules, setAvailableModules] = useState<ModuleListItem[]>([]);
  const [tenantModules, setTenantModules] = useState<TenantModuleSummary[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [appMessage, setAppMessage] = useState<{ tone: "info" | "error" | "success"; text: string } | null>(
    null
  );
  const [moduleActionKey, setModuleActionKey] = useState<string | null>(null);
  const [switchingTenantMembershipId, setSwitchingTenantMembershipId] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(token);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    function handleHashChange() {
      setActiveView(normalizeHash(window.location.hash));
      setSelectedModuleKey(
        window.location.hash.startsWith("#/modules/") ? window.location.hash.replace("#/modules/", "") : null
      );
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const redirectToLogin = useCallback(() => {
    setSelectedModuleKey(null);
    replaceHash(LOGIN_HASH);
  }, []);

  const clearSession = useCallback(() => {
    tokenRef.current = null;
    setToken(null);
    storeToken(null);
    setCurrentUser(null);
    setAuthContext(null);
    setTenantContext(null);
    setTeamMembers(null);
    setTenantSettings(null);
    setCompanyProfile(null);
    setClients(null);
    setProjects(null);
    setTasks(null);
    setTenantModules([]);
    setAvailableModules([]);
    setAppMessage(null);
    setLoginError(null);
    setModuleActionKey(null);
    setSwitchingTenantMembershipId(null);
    setLoading(false);
  }, []);

  const loadProtectedState = useCallback(
    async (nextToken = token) => {
      if (!nextToken) {
        clearSession();
        redirectToLogin();
        return;
      }

      setLoading(true);
      setAppMessage(null);

      try {
        const [
          meResponse,
          contextResponse,
          tenantsResponse,
          companyProfileResponse,
          clientsResponse,
          projectsResponse,
          tasksResponse,
          modulesResponse,
          tenantModulesResponse,
          teamMembersResponse,
          tenantSettingsResponse
        ] =
          await Promise.all([
            apiRequest<AuthCurrentUserResponse>("/auth/me", { token: nextToken }),
            apiRequest<AuthContextResponse>("/auth/context", { token: nextToken }),
            apiRequest<TenantListResponse>("/tenants", { token: nextToken }),
            apiRequest<CompanyProfileResponse>("/company-profile", { token: nextToken }),
            apiRequest<ClientsResponse>("/clients", { token: nextToken }),
            apiRequest<ProjectsResponse>("/projects", { token: nextToken }),
            apiRequest<TasksResponse>("/tasks", { token: nextToken }),
            apiRequest<ModuleRegistryResponse>("/modules"),
            apiRequest<TenantModulesResponse>("/modules/current", { token: nextToken }),
            apiRequest<TenantMembersResponse>("/tenants/current/members", { token: nextToken }),
            apiRequest<TenantSettingsResponse>("/tenants/current/settings", { token: nextToken })
          ]);

        if (!meResponse.ok) {
          clearSession();
          redirectToLogin();
          setLoginError(getErrorMessage(meResponse));
          return;
        }

        if (
          isUnauthorized(contextResponse) ||
          isUnauthorized(tenantsResponse) ||
          isUnauthorized(companyProfileResponse) ||
          isUnauthorized(clientsResponse) ||
          isUnauthorized(projectsResponse) ||
          isUnauthorized(tasksResponse) ||
          isUnauthorized(tenantModulesResponse)
        ) {
          clearSession();
          redirectToLogin();
          setLoginError("Your session expired. Please sign in again.");
          return;
        }

        if (tokenRef.current !== nextToken) {
          return;
        }

        setCurrentUser(meResponse.data);
        setAuthContext(contextResponse.ok ? contextResponse.data : null);
        setTenantContext(tenantsResponse.ok ? tenantsResponse.data : null);
        setCompanyProfile(companyProfileResponse.ok ? companyProfileResponse.data : null);
        setClients(clientsResponse.ok ? clientsResponse.data : null);
        setProjects(projectsResponse.ok ? projectsResponse.data : null);
        setTasks(tasksResponse.ok ? tasksResponse.data : null);
        setAvailableModules(modulesResponse.ok ? modulesResponse.data.modules : []);
        setTenantModules(tenantModulesResponse.ok ? tenantModulesResponse.data.modules : []);
        setTeamMembers(teamMembersResponse.ok ? teamMembersResponse.data : null);
        setTenantSettings(tenantSettingsResponse.ok ? tenantSettingsResponse.data : null);

        if (
          !contextResponse.ok ||
          !tenantsResponse.ok ||
          !companyProfileResponse.ok ||
          !clientsResponse.ok ||
          !projectsResponse.ok ||
          !tasksResponse.ok ||
          !tenantModulesResponse.ok
        ) {
          setAppMessage({
            tone: "error",
            text: "Some protected context could not be loaded."
          });
        }
      } catch (error) {
        setAppMessage({ tone: "error", text: maskError(error) });
      } finally {
        setLoading(false);
      }
    },
    [clearSession, redirectToLogin, token]
  );

  useEffect(() => {
    void loadProtectedState(token);
  }, [loadProtectedState, token]);

  async function handleLogin(email: string, password: string, turnstileToken?: string) {
    setLoginLoading(true);
    setLoginError(null);

    try {
      const response = await apiRequest<AuthLoginResponse>("/auth/login", {
        method: "POST",
        body: { email, password, turnstileToken }
      });

      if (!response.ok) {
        setLoginError(getErrorMessage(response));
        return;
      }

      const nextToken = response.data.session.token;
      tokenRef.current = nextToken;
      setToken(nextToken);
      storeToken(nextToken);
      setCurrentUser({
        user: response.data.user,
        session: {
          createdAt: new Date().toISOString(),
          expiresAt: response.data.session.expiresAt,
          lastSeenAt: null,
          revokedAt: null
        },
        tenantContext: response.data.tenantContext
      });
      replaceHash(DASHBOARD_HASH);
      await loadProtectedState(nextToken);
    } catch (error) {
      setLoginError(maskError(error));
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    if (!token) {
      clearSession();
      redirectToLogin();
      return;
    }

    try {
      await apiRequest("/auth/logout", { method: "POST", token });
    } finally {
      clearSession();
      redirectToLogin();
    }
  }

  async function runAuthenticatedRequest<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T> | null> {
    const activeToken = tokenRef.current;
    if (!activeToken) {
      return null;
    }

    const response = await apiRequest<T>(path, {
      ...options,
      token: activeToken
    });

    if (!response.ok && response.error.code === "AUTH_UNAUTHORIZED") {
      clearSession();
      redirectToLogin();
      setLoginError("Your session expired. Please sign in again.");
      return null;
    }

    return response;
  }

  async function handleSwitchTenant(tenantMembershipId: string) {
    if (!token) {
      return;
    }

    setSwitchingTenantMembershipId(tenantMembershipId);
    setAppMessage(null);
    try {
      const response = await apiRequest<TenantListResponse>("/tenants/current/switch", {
        method: "POST",
        body: { tenantMembershipId },
        token
      });

      if (!response.ok) {
        if (response.error.code === "AUTH_UNAUTHORIZED") {
          clearSession();
          redirectToLogin();
          setLoginError("Your session expired. Please sign in again.");
          return;
        }

        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return;
      }

      await loadProtectedState(token);
      setAppMessage({ tone: "success", text: "Tenant context updated." });
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
    } finally {
      setSwitchingTenantMembershipId(null);
    }
  }

  async function handleSetModuleEnabled(moduleKey: string, enabled: boolean) {
    setModuleActionKey(moduleKey);
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest(`/modules/current/${moduleKey}/${enabled ? "enable" : "disable"}`, {
        method: "POST",
      });

      if (!response) {
        return;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: `${moduleKey} ${enabled ? "enabled" : "disabled"}.` });
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
    } finally {
      setModuleActionKey(null);
    }
  }

  async function handleSaveCompanyProfile(values: CompanyProfileFormValues): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<CompanyProfileResponse>("/company-profile", {
        method: "PUT",
        body: values
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Company profile saved." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleSaveClient(clientId: string | null, values: ClientFormValues): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ client: ClientSummary | null }>(
        clientId ? `/clients/${clientId}` : "/clients",
        {
          method: clientId ? "PUT" : "POST",
          body: values
        }
      );

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: clientId ? "Client updated." : "Client created." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleArchiveClient(clientId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ client: ClientSummary | null }>(`/clients/${clientId}/archive`, {
        method: "POST"
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Client archived." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleSaveProject(projectId: string | null, values: ProjectFormValues): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ project: ProjectSummary | null }>(
        projectId ? `/projects/${projectId}` : "/projects",
        {
          method: projectId ? "PUT" : "POST",
          body: values
        }
      );

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: projectId ? "Project updated." : "Project created." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleArchiveProject(projectId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ project: ProjectSummary | null }>(
        `/projects/${projectId}/archive`,
        {
          method: "POST"
        }
      );

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Project archived." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleSaveTask(taskId: string | null, values: TaskFormValues): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ task: TaskSummary | null }>(
        taskId ? `/tasks/${taskId}` : "/tasks",
        {
          method: taskId ? "PUT" : "POST",
          body: values
        }
      );

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: taskId ? "Task updated." : "Task created." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  async function handleArchiveTask(taskId: string): Promise<boolean> {
    setAppMessage(null);
    try {
      const response = await runAuthenticatedRequest<{ task: TaskSummary | null }>(`/tasks/${taskId}/archive`, {
        method: "POST"
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        setAppMessage({ tone: "error", text: getErrorMessage(response) });
        return false;
      }

      await loadProtectedState(tokenRef.current);
      setAppMessage({ tone: "success", text: "Task archived." });
      return true;
    } catch (error) {
      setAppMessage({ tone: "error", text: maskError(error) });
      return false;
    }
  }

  const canManageModules = hasModuleAdminAccess(authContext);
  const canManageCore = hasActiveRole(authContext, ["owner", "admin"]);
  const currentTenant = tenantContext?.currentTenant?.tenant ?? null;

  if (!token || !currentUser) {
    return <LoginScreen error={loginError} loading={loginLoading || loading} onLogin={handleLogin} />;
  }

  return (
    <AppLayout
      activeView={activeView}
      currentTenant={currentTenant}
      navigationItems={navigationItems}
      onLogout={() => void handleLogout()}
      user={currentUser.user}
    >
      {appMessage ? <StatusNotice message={appMessage.text} tone={appMessage.tone} /> : null}
      {loading ? <div className="state-panel">Loading</div> : null}
      {!loading && activeView === "dashboard" ? (
        <DashboardView context={authContext} tenants={tenantContext} user={currentUser.user} />
      ) : null}
      {!loading && activeView === "tenants" ? (
        <TenantView
          onSwitchTenant={handleSwitchTenant}
          switchingTenantMembershipId={switchingTenantMembershipId}
          tenants={tenantContext}
        />
      ) : null}
      {!loading && activeView === "modules" ? (
        <ModuleRegistryView
          availableModules={availableModules}
          canManageModules={canManageModules}
          moduleActionKey={moduleActionKey}
          onSetModuleEnabled={handleSetModuleEnabled}
          selectedModuleKey={selectedModuleKey}
          tenantModules={tenantModules}
        />
      ) : null}
      {!loading && activeView === "company-profile" ? (
        <CompanyProfilePage
          canEdit={canManageCore}
          companyProfile={companyProfile?.companyProfile ?? null}
          error={null}
          loading={false}
          onSave={handleSaveCompanyProfile}
        />
      ) : null}
      {!loading && activeView === "clients" ? (
        <ClientsPage
          canEdit={canManageCore}
          clients={clients?.clients ?? []}
          error={null}
          loading={false}
          onArchive={handleArchiveClient}
          onSave={handleSaveClient}
        />
      ) : null}
      {!loading && activeView === "projects" ? (
        <ProjectsPage
          canEdit={canManageCore}
          clients={clients?.clients ?? []}
          error={null}
          loading={false}
          onArchive={handleArchiveProject}
          onSave={handleSaveProject}
          projects={projects?.projects ?? []}
        />
      ) : null}
      {!loading && activeView === "tasks" ? (
        <TasksPage
          canEdit={canManageCore}
          error={null}
          loading={false}
          onArchive={handleArchiveTask}
          onSave={handleSaveTask}
          projects={projects?.projects ?? []}
          tasks={tasks?.tasks ?? []}
        />
      ) : null}
      {!loading && activeView === "settings" ? (
        <SettingsView
          authContext={authContext}
          currentUser={currentUser.user}
          tenantSettings={tenantSettings}
        />
      ) : null}
      {!loading && activeView === "team" ? (
        <TeamView authContext={authContext} teamMembers={teamMembers} />
      ) : null}
    </AppLayout>
  );
}
