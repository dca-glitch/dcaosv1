export type NavigationViewKey =
  | "dashboard"
  | "modules"
  | "tenants"
  | "client-portal"
  | "briefs"
  | "briefs-panel"
  | "workflow-briefs"
  | "pending-approvals"
  | "monthly-reports"
  | "archive"
  | "clients"
  | "projects"
  | "ai-delivery"
  | "ai-operations"
  | "ai-market-intelligence"
  | "admin-daily-cockpit"
  | "content-plan-review"
  | "content-draft-review"
  | "tasks"
  | "invoices"
  | "credit-notes"
  | "invoice-items"
  | "bills"
  | "company-profile"
  | "settings"
  | "team"
  | "design-system"
  | "setup";

export const CLIENT_ONLY_NAV_VIEWS = new Set<string>([
  "dashboard",
  "client-portal",
  "briefs",
  "workflow-briefs",
  "pending-approvals",
  "monthly-reports",
  "archive"
]);

export const CLIENT_ALLOWED_ROUTE_VIEWS = CLIENT_ONLY_NAV_VIEWS;

/** Owner/admin-only sidebar entries — functional screens, not client-facing. */
export const ADMIN_ONLY_NAV_VIEWS = new Set<string>([
  "modules",
  "tenants",
  "ai-operations",
  "admin-daily-cockpit"
]);

export type NavigationItem<T extends string = NavigationViewKey> = {
  view: T;
  label: string;
  section: string;
};

export type NavigationAuthContext = {
  tenantContext: {
    roles: string[];
  };
} | null;

export function isClientOnlyRole(roles: string[]): boolean {
  return (
    roles.includes("client") &&
    !roles.includes("owner") &&
    !roles.includes("admin")
  );
}

export function hasOwnerOrAdminRole(roles: string[]): boolean {
  return roles.includes("owner") || roles.includes("admin");
}

export function filterNavigationByRole<T extends string>(
  items: NavigationItem<T>[],
  authContext: NavigationAuthContext
): NavigationItem<T>[] {
  if (!authContext) {
    return items;
  }

  if (isClientOnlyRole(authContext.tenantContext.roles)) {
    return items.filter((item) => CLIENT_ONLY_NAV_VIEWS.has(item.view));
  }

  return items;
}

export function filterAdminOnlyNavigation<T extends string>(
  items: NavigationItem<T>[],
  authContext: NavigationAuthContext
): NavigationItem<T>[] {
  if (!authContext || hasOwnerOrAdminRole(authContext.tenantContext.roles)) {
    return items;
  }

  return items.filter((item) => !ADMIN_ONLY_NAV_VIEWS.has(item.view));
}

/** Map nested client-portal hashes to top-level shell nav keys for active-state highlighting. */
export function resolveShellActiveView(activeView: string, hash: string): string {
  const value = hash.replace(/^#\/?/, "");
  if (value === "client-portal/pending-approvals" || /^client-portal\/deliverables\/.+\/approve$/.test(value)) {
    return "pending-approvals";
  }
  if (value === "client-portal/briefs") {
    return "briefs";
  }
  return activeView;
}
