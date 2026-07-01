import { describe, expect, it } from "vitest";
import type { NavigationItem } from "./navigation-filter";
import { filterNavigationByRole, isClientOnlyRole } from "./navigation-filter";

const sampleItems: NavigationItem[] = [
  { view: "dashboard", label: "Dashboard", section: "protected" },
  { view: "briefs", label: "Briefs", section: "client" },
  { view: "pending-approvals", label: "Pending Approvals", section: "client" },
  { view: "clients", label: "Clients", section: "core" },
  { view: "team", label: "Team", section: "settings" }
];

describe("isClientOnlyRole", () => {
  it("returns true for client without owner/admin", () => {
    expect(isClientOnlyRole(["client"])).toBe(true);
  });

  it("returns false when owner is present", () => {
    expect(isClientOnlyRole(["client", "owner"])).toBe(false);
  });

  it("returns false when admin is present", () => {
    expect(isClientOnlyRole(["client", "admin"])).toBe(false);
  });

  it("returns false for staff roles", () => {
    expect(isClientOnlyRole(["owner"])).toBe(false);
    expect(isClientOnlyRole(["admin"])).toBe(false);
  });
});

describe("filterNavigationByRole", () => {
  it("returns all items when auth context is null", () => {
    expect(filterNavigationByRole(sampleItems, null)).toEqual(sampleItems);
  });

  it("restricts client-only users to client workspace views", () => {
    const filtered = filterNavigationByRole(sampleItems, {
      tenantContext: { roles: ["client"] }
    });

    expect(filtered.map((item) => item.view)).toEqual([
      "dashboard",
      "briefs",
      "pending-approvals"
    ]);
  });

  it("keeps full navigation for owner", () => {
    expect(
      filterNavigationByRole(sampleItems, {
        tenantContext: { roles: ["owner"] }
      })
    ).toEqual(sampleItems);
  });

  it("keeps full navigation for client+admin hybrid", () => {
    expect(
      filterNavigationByRole(sampleItems, {
        tenantContext: { roles: ["client", "admin"] }
      })
    ).toEqual(sampleItems);
  });
});
