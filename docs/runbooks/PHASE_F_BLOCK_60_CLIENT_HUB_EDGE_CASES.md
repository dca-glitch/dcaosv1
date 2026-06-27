# Phase F Block 60 — Client Hub + PublicationTarget Edge Cases

**Status:** Edge-case UX for empty targets, archived clients, and legacy WordPress read-only sunset.

**Scope:** Frontend polish + browser smoke. No API contract changes.

Related:

- `apps/web/src/pages/clients/ClientHubPage.tsx`
- `scripts/smoke-client-hub-edge-cases-browser-local.mjs`
- `scripts/smoke-client-domain-browser-local.mjs` (regression baseline)
- [`docs/security/LEGACY_WORDPRESS_CONFIG_SUNSET.md`](../security/LEGACY_WORDPRESS_CONFIG_SUNSET.md)

---

## Run (focused edge-case gate)

Requires local API on **4000** and web on **5173**.

```powershell
cd C:\dcaosv1
npm.cmd run smoke:client-hub:edge-cases:browser
```

---

## Run (regression — full client domain browser)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:client-domain:browser
```

---

## Pass criteria

- Empty hub shows publication target empty state with legacy tenant WP deprecation note
- Credentials panel shows guard copy when no targets exist
- Archived client hub shows read-only banner; add/edit forms hidden
- Legacy `GET /tenant/wordpress-config` remains read-only; `POST` returns 410 `WORDPRESS_CONFIG_DEPRECATED`
- No credential secrets in browser DOM text

---

## Deferred

- Live WordPress publish to Puriva
- Publication target archive UX (API exists; dedicated UI later)
