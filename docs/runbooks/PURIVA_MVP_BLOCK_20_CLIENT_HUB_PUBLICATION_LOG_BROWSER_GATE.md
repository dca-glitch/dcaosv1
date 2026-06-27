# Puriva MVP Block 20 — Client Hub Publication Log Browser Gate

**Status:** Local browser gate for operator-visible WordPress publication log entries in Client Hub.

**Scope:** Playwright proof that a Puriva-path publish attempt writes a PublicationLog entry and Client Hub renders it without credential leakage.

Related:

- `scripts/smoke-client-hub-publication-log-browser-local.mjs`
- `scripts/lib/puriva-delivery-summary-fixture.mjs`
- `docs/runbooks/PURIVA_MVP_BLOCK_5_WORDPRESS_PUBLISH_LOCAL_GATE.md`

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:client-hub:publication-log:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Admin publication logs API includes `PUBLISH_WORDPRESS` entry
- Client Hub publication log section shows action, status, and site host
- Rendered hub text omits credential secret patterns
