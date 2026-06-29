export type NavigationViewKey =
  | "dashboard"
  | "modules"
  | "tenants"
  | "client-portal"
  | "clients"
  | "projects"
  | "ai-delivery"
  | "ai-operations"
  | "ai-market-intelligence"
  | "tasks"
  | "invoices"
  | "credit-notes"
  | "invoice-items"
  | "bills"
  | "company-profile"
  | "settings"
  | "team";

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

const CLIENT_ONLY_NAV_VIEWS = new Set<string>(["dashboard", "client-portal"]);

export function isClientOnlyRole(roles: string[]): boolean {
  return (
    roles.includes("client") &&
    !roles.includes("owner") &&
    !roles.includes("admin")
  );
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
