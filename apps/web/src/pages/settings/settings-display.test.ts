import { describe, expect, it } from "vitest";
import {
  SETTINGS_AREA_CATALOG,
  SETTINGS_SUB_NAV,
  countSettingsAreasByAvailability,
  formatSettingsRoleLabel,
  formatSettingsRoleList,
  settingsAccessModeLabel,
  settingsAreaBadgeStatus
} from "./settings-display";

describe("SETTINGS_SUB_NAV", () => {
  it("links only to existing settings shell routes", () => {
    expect(SETTINGS_SUB_NAV.map((item) => item.href)).toEqual([
      "#/settings",
      "#/team",
      "#/company-profile"
    ]);
  });
});

describe("SETTINGS_AREA_CATALOG", () => {
  it("marks backend-dependent screens as deferred without inventing controls", () => {
    const deferredKeys = SETTINGS_AREA_CATALOG.filter((item) => item.availability === "deferred").map(
      (item) => item.key
    );
    expect(deferredKeys).toEqual([
      "permissions-matrix",
      "integrations",
      "notification-preferences",
      "ai-policies",
      "storage-settings",
      "audit-log"
    ]);
  });

  it("keeps available surfaces limited to existing UI", () => {
    const availableKeys = SETTINGS_AREA_CATALOG.filter((item) => item.availability === "available").map(
      (item) => item.key
    );
    expect(availableKeys).toEqual(["settings-shell", "users-roles", "company-profile"]);
  });
});

describe("formatSettingsRoleLabel", () => {
  it("title-cases role keys", () => {
    expect(formatSettingsRoleLabel("owner")).toBe("Owner");
    expect(formatSettingsRoleLabel("content_editor")).toBe("Content Editor");
    expect(formatSettingsRoleLabel("")).toBe("None");
  });
});

describe("formatSettingsRoleList", () => {
  it("joins roles or returns None", () => {
    expect(formatSettingsRoleList([])).toBe("None");
    expect(formatSettingsRoleList(["owner", "admin"])).toBe("Owner, Admin");
  });
});

describe("settingsAccessModeLabel", () => {
  it("distinguishes editable vs read-only", () => {
    expect(settingsAccessModeLabel(true)).toBe("Editable");
    expect(settingsAccessModeLabel(false)).toBe("Read-only");
  });
});

describe("settingsAreaBadgeStatus", () => {
  it("maps availability to StatusBadge-friendly labels", () => {
    expect(settingsAreaBadgeStatus("available")).toBe("Active");
    expect(settingsAreaBadgeStatus("deferred")).toBe("Deferred");
  });
});

describe("countSettingsAreasByAvailability", () => {
  it("counts catalog availability without inventing areas", () => {
    expect(countSettingsAreasByAvailability()).toEqual({ available: 3, deferred: 6 });
  });
});
