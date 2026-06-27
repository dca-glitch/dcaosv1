# Post-MVP Block 50 — Settings Backend Browser Gate

**Status:** Local browser gate for Settings shell backed by tenant settings API data.

**Scope:** API proof via `GET /tenants/current/settings` plus Playwright proof that `#/settings` tenant metric card reflects API tenant name. No password reset, OAuth, billing, or invite behavior changes.

Related:

- `apps/web/src/App.tsx` (`SettingsView`)
- `apps/api/src/routes/tenants.ts`
- `scripts/smoke-settings-backend-browser-local.mjs`
- `docs/runbooks/POST_MVP_BLOCK_33_SETTINGS_TEAM_SHELL_BROWSER_GATE.md`

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:settings-backend:browser
```

Requires local web on port **5173** and API on port **4000**.

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Admin login succeeds
- `GET /tenants/current/settings` returns tenant name and slug for active workspace
- `#/settings` renders three settings shell metric cards (`settings-profile`, `settings-tenant`, `settings-access`)
- **Tenant** metric card value matches API tenant name
- Profile metric helper includes seeded admin email
- **MVP shell boundary** panel shows read-only EmptyState (invite/password reset deferred)

---

## Notes

- Settings remain read-only shell; destructive tenant changes stay out of scope.
- Complements Block 33 with backend-backed tenant name proof.
- Full Settings MVP backend block remains a separate approval gate.
