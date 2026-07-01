# Puriva Finance Attribution v1 Gate

**Status:** Deterministic local admin finance/delivery attribution foundation for Puriva monthly service delivery without payment processors, external accounting APIs, or client portal finance exposure.

Related:

- `apps/api/src/core/puriva-finance-attribution.ts`
- `scripts/lib/puriva-finance-attribution.mjs`
- `scripts/lib/puriva-local-setup.mjs`
- `docs/runbooks/PURIVA_MONTHLY_REPORT_V1_GATE.md`

---

## What it proves

1. **Monthly service package** — services library item + recurring invoice package for Puriva monthly SEO & content delivery
2. **Delivery links** — embed links Puriva client, AI delivery project, monthly report, service item, recurring package, and DRAFT invoice placeholder
3. **Admin-only summary** — `buildPurivaFinanceAttributionAdminSummary()` with `localTestOnly`, `noPaymentProcessor`, `financeEventSynced: false` for DRAFT placeholders
4. **Invoice-ready placeholder** — DRAFT invoice per target month (`PURIVA-FA-YYYY-MM`), not issued/sent/paid
5. **Client boundary** — client portal responses omit finance attribution markers, embed kinds, invoice placeholder ids, and admin revenue summary fields
6. **Idempotent setup** — second run reuses service item, recurring package, and invoice placeholder when markers/numbers match

---

## Forbidden

- Schema/migration changes
- Payment processors (Stripe, etc.) or external accounting APIs (QuickBooks, Xero)
- Provider/OpenRouter, WordPress publish, crawl/fetch
- ISSUED/PAID invoice send or real payable invoice
- Client portal finance/internal attribution exposure
- Deploy/staging/prod mutation

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run validate
npm.cmd run -w @dca-os-v1/api test:unit
npm.cmd run smoke:puriva-client-setup:local
npm.cmd run smoke:puriva-full-delivery:local
npm.cmd run smoke:puriva-client-portal-boundary:local
npm.cmd run validate
```

Requires `AUTH_SEED_TEST_PASSWORD` (minimum 8 characters).

---

## Operator notes

- Attribution embed lives in invoice/recurring `notes` (admin API only); client portal has no invoice surface in Puriva MVP.
- DRAFT placeholders do not sync to finance ledger revenue events (`financeEventSynced: false`).
- Live billing remains a separate approved finance workflow path.
