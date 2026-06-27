# Phase F Block 62 — Settings / Team / Company Profile Polish

**Status:** Dark Nebula compact pass on platform settings shells (92% local scope).

**Scope:** Frontend polish only. No invite, password reset, or settings backend changes.

Related:

- `apps/web/src/App.tsx` — `SettingsView`, `TeamView`
- `apps/web/src/pages/company-profile/CompanyProfilePage.tsx`
- [`POST_MVP_BLOCK_33_SETTINGS_TEAM_SHELL_BROWSER_GATE.md`](./POST_MVP_BLOCK_33_SETTINGS_TEAM_SHELL_BROWSER_GATE.md)
- [`POST_MVP_BLOCK_50_SETTINGS_BACKEND_BROWSER_GATE.md`](./POST_MVP_BLOCK_50_SETTINGS_BACKEND_BROWSER_GATE.md)

---

## Run (focused browser gate)

Requires local API on **4000** and web on **5173**.

```powershell
cd C:\dcaosv1
npm.cmd run smoke:settings-team:browser
```

---

## Pass criteria

- **Settings** (`#/settings`): metric cards `settings-profile`, `settings-tenant`, `settings-access`; MVP shell boundary panel
- **Team** (`#/team`): metric cards `team-members`, `team-roles`, `team-access`; member directory table or empty state
- **Company Profile** (`#/company-profile`): `PageHeader`, metric strip (`company-profile-status`, `company-profile-currency`, `company-profile-finance-docs`), profile details in `SectionPanel`
- No invite or password-reset buttons in Team/Settings shells

---

## Deferred

- User invite flow UI
- Password reset UI
- Writable tenant settings backend block
