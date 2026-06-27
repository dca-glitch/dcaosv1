# Post-MVP Block 33 — Settings / Team Shell Browser Gate

**Status:** Local browser gate for read-only Settings and Team shells.

**Scope:** Frontend polish for Settings and Team MVP shells (metric cards, SectionPanel boundaries, EmptyState) plus Playwright proof. No schema, API, auth, or backend changes.

Related:

- `apps/web/src/App.tsx` (`SettingsView`, `TeamView`)
- `scripts/smoke-settings-team-browser-local.mjs`

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:settings-team:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- `#/settings` renders three settings shell metric cards (`settings-profile`, `settings-tenant`, `settings-access`)
- Settings **MVP shell boundary** panel is visible with read-only EmptyState
- Profile metric helper includes seeded admin email
- `#/team` renders team shell metric cards (`team-members`, `team-roles`, `team-access`)
- Team **Member directory** panel is visible
- When members API returns rows, admin email appears in the directory table
