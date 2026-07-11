/**
 * Module index display helpers — Phase 12 Secondary Modules.
 * Honest availability only: do not invent Revenue Hub / POD / Prompt library UIs.
 */

export type ModuleSurfaceAvailability = "available" | "paused";

export type ModuleSurfaceItem = {
  key: string;
  label: string;
  availability: ModuleSurfaceAvailability;
  note: string;
  href?: string;
};

/**
 * Phase 12 secondary surfaces catalog.
 * Available items link to existing routes/UI; paused items have no operational console yet.
 */
export const SECONDARY_MODULE_CATALOG: ModuleSurfaceItem[] = [
  {
    key: "market-intelligence",
    label: "Market Intelligence",
    availability: "available",
    note: "Research projects, sources, findings, runs, insights, and handoffs.",
    href: "#/ai-market-intelligence"
  },
  {
    key: "keyword-topic-research",
    label: "Keyword and topic research",
    availability: "available",
    note: "Lives inside Market Intelligence project inputs — not a separate console.",
    href: "#/ai-market-intelligence"
  },
  {
    key: "competitor-tracking",
    label: "Competitor tracking",
    availability: "available",
    note: "Lives inside Market Intelligence project inputs — not a separate console.",
    href: "#/ai-market-intelligence"
  },
  {
    key: "module-index",
    label: "Module index",
    availability: "available",
    note: "Enable/disable registered tenant modules from this page.",
    href: "#/modules"
  },
  {
    key: "revenue-hub",
    label: "Revenue Hub dashboard",
    availability: "paused",
    note: "No Revenue Hub route or operational UI in this MVP."
  },
  {
    key: "revenue-reporting",
    label: "Revenue reporting",
    availability: "paused",
    note: "No revenue reporting console or export UI in this MVP."
  },
  {
    key: "pod-ai-toolkit",
    label: "POD AI Toolkit console",
    availability: "paused",
    note: "No POD toolkit console or run UI in this MVP."
  },
  {
    key: "prompt-library",
    label: "Prompt library",
    availability: "paused",
    note: "No prompt library route or versioning UI in this MVP."
  }
];

export function moduleSurfaceBadgeStatus(availability: ModuleSurfaceAvailability): string {
  return availability === "available" ? "Active" : "Paused";
}

/** Tenant enablement badge for registry cards. */
export function moduleEnablementBadgeStatus(enabled: boolean): string {
  return enabled ? "Enabled" : "Disabled";
}

/** Registry metadata status → StatusBadge-friendly label. */
export function moduleRegistryStatusBadge(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === "active") {
    return "Active";
  }
  if (normalized === "planned") {
    return "Planned";
  }
  if (normalized === "internal") {
    return "Internal";
  }
  return status.trim() || "Unknown";
}

export function countModuleSurfacesByAvailability(
  catalog: ModuleSurfaceItem[] = SECONDARY_MODULE_CATALOG
): { available: number; paused: number } {
  return catalog.reduce(
    (acc, item) => {
      if (item.availability === "available") {
        acc.available += 1;
      } else {
        acc.paused += 1;
      }
      return acc;
    },
    { available: 0, paused: 0 }
  );
}

export function selectedModulePlaceholderCopy(moduleKey: string): {
  title: string;
  body: string;
} {
  const trimmed = moduleKey.trim();
  const paused = SECONDARY_MODULE_CATALOG.find(
    (item) => item.key === trimmed && item.availability === "paused"
  );

  if (paused) {
    return {
      title: paused.label,
      body: paused.note
    };
  }

  return {
    title: trimmed || "Module",
    body: "This module shell is ready for the next backend-backed pass. Finance Lite, billing, and dynamic plugin mounting stay out of scope for this MVP shell."
  };
}
