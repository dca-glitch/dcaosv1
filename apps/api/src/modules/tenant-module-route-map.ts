/**
 * Maps API route prefixes to tenant module keys for optional entitlement enforcement.
 * Enforcement mode is controlled by TENANT_MODULE_ENFORCEMENT env (off | dry_run | enforce).
 */
export const TENANT_MODULE_ROUTE_MAP: Array<{ prefix: string; moduleKey: string }> = [
  { prefix: "/company-profile", moduleKey: "core" },
  { prefix: "/activity", moduleKey: "core" },
  { prefix: "/clients", moduleKey: "core" },
  { prefix: "/projects", moduleKey: "core" },
  { prefix: "/tenant/wordpress-config", moduleKey: "ai-delivery" },
  { prefix: "/ai-delivery", moduleKey: "ai-delivery" },
  { prefix: "/ai-delivery-projects", moduleKey: "ai-delivery" },
  { prefix: "/market-intelligence-projects", moduleKey: "market-intelligence" },
  { prefix: "/market-intelligence", moduleKey: "market-intelligence" },
  { prefix: "/invoices", moduleKey: "finance-lite" },
  { prefix: "/bills", moduleKey: "finance-lite" },
  { prefix: "/vendors", moduleKey: "finance-lite" },
  { prefix: "/credit-notes", moduleKey: "finance-lite" },
  { prefix: "/invoice-items", moduleKey: "finance-lite" },
  { prefix: "/recurring-invoices", moduleKey: "finance-lite" }
];

export function resolveModuleKeyForPath(path: string): string | null {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const match = TENANT_MODULE_ROUTE_MAP.find((entry) => normalized === entry.prefix || normalized.startsWith(`${entry.prefix}/`));
  return match?.moduleKey ?? null;
}

export type TenantModuleEnforcementMode = "off" | "dry_run" | "enforce";

export function getTenantModuleEnforcementMode(): TenantModuleEnforcementMode {
  const raw = (process.env.TENANT_MODULE_ENFORCEMENT ?? "off").trim().toLowerCase();
  if (raw === "dry_run" || raw === "enforce") {
    return raw;
  }
  return "off";
}
