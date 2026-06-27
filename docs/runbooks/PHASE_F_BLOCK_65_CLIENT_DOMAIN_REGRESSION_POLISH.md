# Phase F Block 65 — Clients / Projects / Tasks Regression Polish

**Scope:** Filter consistency + delivery cross-links. Browser regression smoke.

Related: `apps/web/src/pages/clients/ClientsPage.tsx`, `projects/ProjectsPage.tsx`, `tasks/TasksPage.tsx`

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:client-domain:browser
```

## Pass criteria

- Clients kind/status filter chips work; hub opens with publication target + catalog
- Projects/Tasks show compact delivery cross-link panels
- AI Delivery monthly project link path remains reachable from client-domain smoke
