# Puriva MVP Block 17 — Client Hub Catalog Inquiry Browser Gate

**Status:** Local browser gate for operator review of portal-submitted catalog inquiries in Client Hub.

**Scope:** Playwright proof that a portal catalog inquiry appears in Client Hub and can be acknowledged by admin.

Related:

- `scripts/smoke-client-hub-catalog-inquiry-browser-local.mjs`
- `docs/runbooks/PURIVA_MVP_BLOCK_10_CLIENT_PORTAL_CATALOG_INQUIRY_BROWSER_GATE.md`

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:client-hub:catalog-inquiry:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Portal inquiry submission persists to admin catalog inquiries API
- Client Hub opens from Clients list and shows inquiry message + product name
- `Mark acknowledged` updates UI status to `ACKNOWLEDGED`
- Admin API persists acknowledged status
