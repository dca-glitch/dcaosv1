# Puriva MVP Block 19 — Client Portal Project Filter Browser Gate

**Status:** Local browser gate for Active / All / Archived project filters in Client Portal UI.

**Scope:** Playwright proof that filter chips behave safely for a linked project and that admin-archived projects disappear from all portal filters after refresh.

Related:

- `scripts/smoke-client-portal-project-filter-browser-local.mjs`
- `docs/runbooks/PURIVA_MVP_BLOCK_12_CLIENT_PORTAL_EDGE_CASES_BROWSER_GATE.md`

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:client-portal:project-filter:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Active and All filters show the linked fixture project
- Archived filter hides active-only projects
- After admin archive + refresh, project absent from Active and All filters
