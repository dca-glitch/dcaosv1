# Phase F Block 68 — Client Portal MVP Polish

**Scope:** Shell review + empty/sparse edge-case copy. No advanced portal actions.

Related: `apps/web/src/pages/client-portal/ClientPortalPage.tsx`

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:client-portal:edge-cases:browser
```

## Pass criteria

- Portal metrics, project filter, empty/sparse/populated paths pass edge-case browser smoke
- No internal workflow fields in client-visible DOM
