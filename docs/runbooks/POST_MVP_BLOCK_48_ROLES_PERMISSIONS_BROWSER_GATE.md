# Post-MVP Block 48 — Roles Permissions Browser Gate

**Status:** Local browser gate for tenant authorization summary and Team shell role coverage.

**Scope:** API proof via `GET /tenants/current/authorization-summary` plus Playwright proof on `#/team` for role coverage metrics and deferred invite messaging. No schema, auth, or invite-flow changes.

Related:

- `apps/api/src/services/tenant-authorization-summary.service.ts`
- `apps/api/src/routes/tenants.ts`
- `apps/web/src/App.tsx` (`TeamView`)
- `scripts/smoke-roles-permissions-browser-local.mjs`
- `docs/runbooks/POST_MVP_BLOCK_33_SETTINGS_TEAM_SHELL_BROWSER_GATE.md`

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:roles-permissions:browser
```

Requires local web on port **5173** and API on port **4000**.

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Admin login succeeds
- `GET /tenants/current/authorization-summary` returns roles, effective permissions, and catalog without secrets
- Summary reports `inviteFlowEnabled=false` and `passwordResetFlowEnabled=false`
- `#/team` renders team shell metric cards (`team-members`, `team-roles`, `team-access`)
- **Role coverage** metric reflects seeded admin roles
- **Member directory** panel shows deferred invite / password reset messaging
- When members API returns rows, seeded admin email appears in directory table

---

## Notes

- Read-only Team shell; role editing and invite flows remain deferred.
- Complements Block 33 Settings/Team shell gate with backend authorization summary wiring.
- Production RBAC changes require separate approval.
