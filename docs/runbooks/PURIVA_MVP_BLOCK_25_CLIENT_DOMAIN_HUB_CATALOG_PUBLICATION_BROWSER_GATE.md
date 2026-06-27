# Puriva MVP Block 25 — Client Domain Hub Catalog + Publication Browser Gate

**Status:** Local browser gate extension for Client Hub catalog and publication log sections inside the client-domain smoke.

**Scope:** Extends `smoke:client-domain:browser` to prove operator catalog product creation, inquiry/publication empty states, and seeded publication log rendering in Client Hub.

Related:

- `scripts/smoke-client-domain-browser-local.mjs`
- `scripts/lib/puriva-delivery-summary-fixture.mjs`
- `docs/runbooks/PURIVA_MVP_BLOCK_17_CLIENT_HUB_CATALOG_INQUIRY_BROWSER_GATE.md`
- `docs/runbooks/PURIVA_MVP_BLOCK_20_CLIENT_HUB_PUBLICATION_LOG_BROWSER_GATE.md`

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:client-domain:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Client Hub adds a catalog product via UI and renders it under **Product catalog**
- **Product inquiries** shows the empty state before portal submissions
- **Publication log** shows empty state, then a seeded `PUBLISH_WORDPRESS` event after Puriva fixture seed
- Publication log UI omits credential secrets
