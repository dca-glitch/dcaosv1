import { describe, expect, it } from "vitest";
import type { NavigationItem } from "./navigation-filter";
import {
  CLIENT_ALLOWED_ROUTE_VIEWS,
  filterAdminOnlyNavigation,
  filterNavigationByRole,
  isClientOnlyRole,
  resolveShellActiveView
} from "./navigation-filter";

const sampleItems: NavigationItem[] = [
  { view: "dashboard", label: "Dashboard", section: "protected" },
  { view: "client-portal", label: "Your archive", section: "client" },
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

describe("CLIENT_ALLOWED_ROUTE_VIEWS", () => {
  it("allows client-portal for client-only route guard", () => {
    expect(CLIENT_ALLOWED_ROUTE_VIEWS.has("client-portal")).toBe(true);
  });

  it("blocks admin-only routes for client-only users", () => {
    expect(CLIENT_ALLOWED_ROUTE_VIEWS.has("clients")).toBe(false);
    expect(CLIENT_ALLOWED_ROUTE_VIEWS.has("team")).toBe(false);
    expect(CLIENT_ALLOWED_ROUTE_VIEWS.has("ai-delivery")).toBe(false);
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
      "client-portal",
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

describe("filterAdminOnlyNavigation", () => {
  it("hides owner/admin-only nav entries for staff without owner/admin role", () => {
    const items: NavigationItem[] = [
      { view: "dashboard", label: "Dashboard", section: "dashboard" },
      { view: "modules", label: "Modules", section: "administration" },
      { view: "tenants", label: "Tenants", section: "administration" },
      { view: "tasks", label: "Tasks", section: "mywork" }
    ];

    expect(
      filterAdminOnlyNavigation(items, {
        tenantContext: { roles: ["member"] }
      }).map((item) => item.view)
    ).toEqual(["dashboard", "tasks"]);
  });

  it("keeps admin-only nav for owner", () => {
    const items: NavigationItem[] = [
      { view: "modules", label: "Modules", section: "administration" }
    ];

    expect(
      filterAdminOnlyNavigation(items, {
        tenantContext: { roles: ["owner"] }
      })
    ).toEqual(items);
  });
});

describe("resolveShellActiveView", () => {
  it("maps nested client-portal pending approvals to top-level nav key", () => {
    expect(resolveShellActiveView("client-portal", "#/client-portal/pending-approvals")).toBe(
      "pending-approvals"
    );
  });

  it("maps nested client-portal briefs to top-level nav key", () => {
    expect(resolveShellActiveView("client-portal", "#/client-portal/briefs")).toBe("briefs");
  });

  it("maps deliverable approval editor to pending approvals nav key", () => {
    expect(
      resolveShellActiveView("client-portal", "#/client-portal/deliverables/abc123/approve")
    ).toBe("pending-approvals");
  });

  it("returns active view for canonical top-level hashes", () => {
    expect(resolveShellActiveView("pending-approvals", "#/pending-approvals")).toBe(
      "pending-approvals"
    );
  });
});
