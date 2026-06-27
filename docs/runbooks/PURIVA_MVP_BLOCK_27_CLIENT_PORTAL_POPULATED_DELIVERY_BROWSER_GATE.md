# Puriva MVP Block 27 — Client Portal Populated Delivery Overview Browser Gate

**Status:** Local browser gate for populated Puriva delivery overview in Client Portal UI.

**Scope:** Dedicated Playwright proof that the Puriva handoff fixture renders MI summary, Google Docs export link, and website publishing handoff. Complements Block 13 sparse placeholders and Block 7 API gate.

Related:

- `scripts/smoke-client-portal-populated-delivery-browser-local.mjs`
- `docs/runbooks/PURIVA_MVP_BLOCK_13_CLIENT_PORTAL_SPARSE_DELIVERY_BROWSER_GATE.md`
- `docs/runbooks/PURIVA_MVP_BLOCK_7_DELIVERY_SUMMARY_LOCAL_GATE.md`

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:client-portal:populated-delivery:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Puriva fixture seeds populated delivery summary API response
- Delivery overview shows MI summary snippet, recommended actions, Open Google Doc link, publishing handoff
- Forbidden internal fields absent from rendered overview HTML
