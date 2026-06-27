# Post-MVP Block 36 — Finance Admin Browser Sanity Gate

**Status:** Local browser sanity gate for Finance admin shells.

**Scope:** Playwright proof that `#/invoices` and `#/bills` render for an admin session, with matching finance API reachability checks. No schema, API contract, auth, or backend changes.

Related:

- `apps/web/src/pages/invoices/InvoicesPage.tsx`
- `apps/web/src/pages/bills/BillsPage.tsx`
- `scripts/smoke-finance-admin-browser-local.mjs`

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:finance-admin:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Admin login succeeds
- `GET /invoices` and `GET /bills` return success for admin token
- Browser **Invoices** view shows Finance eyebrow and Add Invoice or empty state
- Browser **Bills** view shows Expenses eyebrow and Add Bill/Vendor or empty state

---

## Notes

- Sanity gate only; no Stripe/payment integration coverage (deferred).
