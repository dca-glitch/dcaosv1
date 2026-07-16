import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppLayout } from "../AppLayout";
import { AccessDeniedState } from "./AccessDeniedState";
import { NotFoundState } from "./NotFoundState";
import { getShellViewTitle } from "./viewTitles";
import { adminSectionLabel, portalSectionLabel } from "./sectionLabels";

afterEach(() => {
  cleanup();
});

const adminNav = [
  { view: "dashboard", label: "Dashboard", section: "protected" },
  { view: "ai-delivery", label: "AI Delivery", section: "core" },
  { view: "settings", label: "Settings", section: "settings" }
];

const portalNav = [
  { view: "dashboard", label: "Dashboard", section: "protected" },
  { view: "client-portal", label: "Your archive", section: "client" },
  { view: "archive", label: "Archive", section: "client" }
];

describe("AppLayout public contract", () => {
  it("renders admin shell with preserved brand, nav order, logout, and active aria-current", () => {
    const onLogout = vi.fn();
    render(
      <AppLayout
        activeView="ai-delivery"
        currentTenant={{ name: "Acme Agency", slug: "acme" }}
        navigationItems={adminNav}
        onLogout={onLogout}
        shellVariant="admin"
        user={{ email: "admin@dca.local", name: "Admin" }}
      >
        <div>Admin content</div>
      </AppLayout>
    );

    expect(screen.getByText("DCA OS Lite")).toBeTruthy();
    expect(screen.getByText("Agency workspace")).toBeTruthy();
    expect(screen.getByLabelText("Primary navigation")).toBeTruthy();
    expect(screen.getByRole("link", { name: /AI Delivery/i }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: /Dashboard/i }).getAttribute("aria-current")).toBeNull();
    expect(screen.getByRole("link", { name: /AI Delivery/i }).getAttribute("href")).toBe("#/ai-delivery");
    expect(screen.getByText("Acme Agency")).toBeTruthy();
    expect(screen.getByText("acme")).toBeTruthy();
    expect(document.querySelector(".shell-topbar__title")?.textContent).toBe("AI Delivery");
    expect(screen.queryByRole("heading", { level: 1, name: "AI Delivery" })).toBeNull();
    expect(screen.getByText("Admin content")).toBeTruthy();
    expect(screen.getByText("LOCAL")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("renders portal shell with client-safe branding and comfortable density", () => {
    render(
      <AppLayout
        activeView="client-portal"
        currentTenant={{ name: "Puriva Health", slug: "puriva" }}
        isClientRole
        navigationItems={portalNav}
        onLogout={() => undefined}
        shellVariant="portal"
        user={{ email: "client@example.com" }}
      >
        <div>Portal content</div>
      </AppLayout>
    );

    expect(screen.getByText("DCA OS Lite")).toBeTruthy();
    expect(screen.getByText("Client workspace")).toBeTruthy();
    expect(screen.getByLabelText("Workspace navigation")).toBeTruthy();
    expect(document.querySelector(".nav-section-label")?.textContent).toBeTruthy();
    expect(screen.getByRole("link", { name: "Archive" }).getAttribute("href")).toBe("#/archive");
    expect(screen.getByRole("link", { name: "Your archive" }).getAttribute("aria-current")).toBe("page");
    expect(document.querySelector(".main-shell")?.getAttribute("data-density")).toBe("comfortable");
    expect(document.querySelector(".shell-page-container--portal")).toBeTruthy();
  });

  it("skip-to-content focuses main without changing the hash route", () => {
    window.location.hash = "#/ai-delivery";
    render(
      <AppLayout
        activeView="ai-delivery"
        currentTenant={null}
        navigationItems={adminNav}
        onLogout={() => undefined}
        user={{ email: "admin@dca.local" }}
      >
        <div>Admin content</div>
      </AppLayout>
    );

    const skip = screen.getByRole("link", { name: "Skip to content" });
    fireEvent.click(skip);
    expect(window.location.hash).toBe("#/ai-delivery");
    expect(document.activeElement?.id).toBe("shell-main-content");
  });

  it("exposes a navigation menu control that toggles shell nav-open state", () => {
    render(
      <AppLayout
        activeView="dashboard"
        currentTenant={null}
        navigationItems={adminNav}
        onLogout={() => undefined}
        user={{ email: "admin@dca.local" }}
      >
        <div>Content</div>
      </AppLayout>
    );

    const shell = document.querySelector(".app-shell");
    expect(shell?.getAttribute("data-nav-open")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(shell?.getAttribute("data-nav-open")).toBe("true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(shell?.getAttribute("data-nav-open")).toBe("false");
  });

  it("opens notification panel as empty UI-only surface and closes on Escape", () => {
    render(
      <AppLayout
        activeView="dashboard"
        currentTenant={null}
        navigationItems={adminNav}
        onLogout={() => undefined}
        user={{ email: "admin@dca.local" }}
      >
        <div>Content</div>
      </AppLayout>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open notifications" }));
    const panel = screen.getByRole("dialog", { name: "Notifications" });
    expect(within(panel).getByText("No notifications yet.")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Notifications" })).toBeNull();
  });

  it("opens search overlay as UI-only with no fake results", () => {
    render(
      <AppLayout
        activeView="dashboard"
        currentTenant={null}
        navigationItems={adminNav}
        onLogout={() => undefined}
        user={{ email: "admin@dca.local" }}
      >
        <div>Content</div>
      </AppLayout>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open search" }));
    const dialog = screen.getByRole("dialog", { name: "Search" });
    expect(within(dialog).getByText(/Results will appear here when search is connected/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search query"), { target: { value: "acme" } });
    expect(within(dialog).getByText(/Search is UI-only/i)).toBeTruthy();
    expect(within(dialog).queryByText(/fake/i)).toBeNull();
  });

  it("locks scroll while overlays are open and restores on close", () => {
    render(
      <AppLayout
        activeView="dashboard"
        currentTenant={null}
        navigationItems={adminNav}
        onLogout={() => undefined}
        user={{ email: "admin@dca.local" }}
      >
        <div>Content</div>
      </AppLayout>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open search" }));
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.getElementById("shell-main-content")?.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Search" })).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(document.getElementById("shell-main-content")?.style.overflow).toBe("");
  });

  it("shows workspace switcher as static when no switch handler exists", () => {
    render(
      <AppLayout
        activeView="dashboard"
        currentTenant={{ name: "Static Co", slug: "static" }}
        navigationItems={adminNav}
        onLogout={() => undefined}
        user={{ email: "admin@dca.local" }}
      >
        <div>Content</div>
      </AppLayout>
    );

    expect(screen.getByLabelText("Current workspace: Static Co")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Switch workspace/i })).toBeNull();
  });
});

describe("shell section labels", () => {
  it("maps admin and portal section labels without renaming view keys", () => {
    expect(adminSectionLabel("protected")).toBe("Dashboard");
    expect(adminSectionLabel("core")).toBe("Delivery");
    expect(adminSectionLabel("mywork")).toBe("My work");
    expect(portalSectionLabel("client")).toBe("Your workspace");
    expect(portalSectionLabel("protected")).toBe("Overview");
    expect(portalSectionLabel("work")).toBe("Your work");
  });
});

describe("shell route title matrix", () => {
  const matrix: Array<{ view: string; admin: string; portal?: string }> = [
    { view: "dashboard", admin: "Dashboard", portal: "Overview" },
    { view: "modules", admin: "Modules" },
    { view: "tenants", admin: "Tenants" },
    { view: "client-portal", admin: "Client archive", portal: "Content" },
    { view: "briefs", admin: "Tasks", portal: "Tasks" },
    { view: "briefs-panel", admin: "Briefs" },
    { view: "workflow-briefs", admin: "Content plans" },
    { view: "pending-approvals", admin: "Approvals" },
    { view: "monthly-reports", admin: "Reports" },
    { view: "archive", admin: "Assets", portal: "Assets" },
    { view: "clients", admin: "Workspaces" },
    { view: "projects", admin: "Projects" },
    { view: "ai-delivery", admin: "AI Delivery" },
    { view: "ai-operations", admin: "AI operations" },
    { view: "ai-market-intelligence", admin: "Analytics" },
    { view: "tasks", admin: "Tasks" },
    { view: "invoices", admin: "Invoices" },
    { view: "credit-notes", admin: "Credit notes" },
    { view: "invoice-items", admin: "Services library" },
    { view: "bills", admin: "Bills" },
    { view: "company-profile", admin: "Company profile" },
    { view: "settings", admin: "Settings" },
    { view: "team", admin: "Users and roles" },
    { view: "admin-daily-cockpit", admin: "Attention required" },
    { view: "design-system", admin: "Design system" }
  ];

  it("maps every known view key to a stable topbar title", () => {
    for (const row of matrix) {
      expect(getShellViewTitle(row.view, "admin")).toBe(row.admin);
      if (row.portal) {
        expect(getShellViewTitle(row.view, "portal")).toBe(row.portal);
      }
    }
  });

  it("preserves hash hrefs for every admin nav item", () => {
    render(
      <AppLayout
        activeView="dashboard"
        currentTenant={null}
        navigationItems={matrix.map((row) => ({
          view: row.view,
          label: `${row.admin} (${row.view})`,
          section: "protected"
        }))}
        onLogout={() => undefined}
        user={{ email: "admin@dca.local" }}
      >
        <div>Content</div>
      </AppLayout>
    );

    for (const row of matrix) {
      const link = document.querySelector(`a[href="#/${row.view}"]`);
      expect(link).toBeTruthy();
      expect(link?.getAttribute("href")).toBe(`#/${row.view}`);
    }
  });
});

describe("presentational shell states", () => {
  it("renders NotFoundState and AccessDeniedState without inventing permission logic", () => {
    const { rerender } = render(<NotFoundState />);
    expect(screen.getByText("Page not found")).toBeTruthy();

    rerender(<AccessDeniedState />);
    expect(screen.getByText("Access denied")).toBeTruthy();
    expect(screen.getByText(/do not have permission/i)).toBeTruthy();
  });
});
