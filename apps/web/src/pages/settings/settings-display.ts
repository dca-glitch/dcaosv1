/**
 * Admin & Settings display helpers — Phase 11.
 * Presentational only: sub-nav, deferred catalog, role/member labels.
 * Does not invent operational controls or render secrets.
 */

export type SettingsShellView = "settings" | "team" | "company-profile";

export type SettingsSubNavItem = {
  view: SettingsShellView;
  label: string;
  href: string;
};

export type SettingsAreaAvailability = "available" | "deferred";

export type SettingsAreaItem = {
  key: string;
  label: string;
  availability: SettingsAreaAvailability;
  note: string;
  href?: string;
};

/** In-shell links between existing settings routes (hash routing unchanged). */
export const SETTINGS_SUB_NAV: SettingsSubNavItem[] = [
  { view: "settings", label: "Settings", href: "#/settings" },
  { view: "team", label: "Team", href: "#/team" },
  { view: "company-profile", label: "Company Profile", href: "#/company-profile" }
];

/**
 * Honest catalog of Phase 11 settings surfaces.
 * Deferred items have no dedicated UI/API in this MVP — do not invent controls.
 */
export const SETTINGS_AREA_CATALOG: SettingsAreaItem[] = [
  {
    key: "settings-shell",
    label: "Settings shell",
    availability: "available",
    note: "Read-only tenant and profile context.",
    href: "#/settings"
  },
  {
    key: "users-roles",
    label: "Users and roles",
    availability: "available",
    note: "Member directory, create user, and password reset for admins.",
    href: "#/team"
  },
  {
    key: "company-profile",
    label: "Company profile",
    availability: "available",
    note: "Issuer details for finance documents.",
    href: "#/company-profile"
  },
  {
    key: "permissions-matrix",
    label: "Permissions matrix",
    availability: "deferred",
    note: "No permissions matrix UI or save API in this MVP."
  },
  {
    key: "integrations",
    label: "Integrations",
    availability: "deferred",
    note: "No settings integrations console. Readiness signals live on the dashboard operations panel only."
  },
  {
    key: "notification-preferences",
    label: "Notification preferences",
    availability: "deferred",
    note: "No notification preference UI or API in this MVP."
  },
  {
    key: "ai-policies",
    label: "AI policies",
    availability: "deferred",
    note: "No tenant AI policy editor. Provider keys stay server-side only."
  },
  {
    key: "storage-settings",
    label: "Storage settings",
    availability: "deferred",
    note: "No storage configuration UI in this MVP."
  },
  {
    key: "audit-log",
    label: "Audit log",
    availability: "deferred",
    note: "Full audit console is not available. A recent-activity snippet is on the dashboard.",
    href: "#/dashboard"
  }
];

export function formatSettingsRoleLabel(role: string): string {
  const trimmed = role.trim();
  if (!trimmed) {
    return "None";
  }
  return trimmed
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/(^|\s)\S/g, (segment) => segment.toUpperCase());
}

export function formatSettingsRoleList(roles: string[]): string {
  if (!roles.length) {
    return "None";
  }
  return roles.map(formatSettingsRoleLabel).join(", ");
}

export function settingsAccessModeLabel(canManage: boolean): string {
  return canManage ? "Editable" : "Read-only";
}

export function settingsAreaBadgeStatus(availability: SettingsAreaAvailability): string {
  return availability === "available" ? "Active" : "Deferred";
}

export function countSettingsAreasByAvailability(
  catalog: SettingsAreaItem[] = SETTINGS_AREA_CATALOG
): { available: number; deferred: number } {
  return catalog.reduce(
    (acc, item) => {
      if (item.availability === "available") {
        acc.available += 1;
      } else {
        acc.deferred += 1;
      }
      return acc;
    },
    { available: 0, deferred: 0 }
  );
}
