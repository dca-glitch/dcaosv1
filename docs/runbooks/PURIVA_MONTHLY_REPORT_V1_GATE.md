# Puriva Monthly Report v1 Gate

**Status:** Local deterministic monthly report scaffolding for Puriva delivery status and compliance-safe recommendations.

Related:

- `apps/api/src/core/puriva-monthly-report.ts`
- `scripts/lib/puriva-monthly-report.mjs`
- `scripts/lib/puriva-local-setup.mjs`
- `docs/runbooks/PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md`

---

## What it proves

1. **Delivery status aggregation** — planned SEO items, draft scaffolds, image scaffolds, medical review blockers, verification blockers, final release state
2. **Next-month recommendations** — derived from taxonomy/MI/SEO templates with compliance-safe language
3. **Admin report seed** — DRAFT monthly report with marker in title/admin notes; placeholder manual metrics imported and approved
4. **Client boundary** — client portal lists zero monthly reports while status remains DRAFT (FINAL-only filter)
5. **No live analytics** — placeholder metrics only; no GA/GSC OAuth
6. **Client-safe archive** — finalized monthly reports are read-only in the portal and do not expose `storageKey`, provider metadata, or execution logs

---

## Forbidden

- Live GA/GSC OAuth or crawl/fetch
- Provider/OpenRouter calls
- Schema/migration changes
- Client exposure of `adminSummaryNotes`, internal scaffold labels, `structuredInputJson`, `storageKey`, `releasePackageId`, `workflowRunId`, `executionLog`
- Forced FINAL approval bypass in setup
- Unsafe medical claims (guarantees, cures, permanent results)

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run validate
npm.cmd run -w @dca-os-v1/api test:unit
npm.cmd run smoke:puriva-client-setup:local
npm.cmd run smoke:puriva-client-portal-boundary:local
npm.cmd run smoke:puriva-full-delivery:local
npm.cmd run validate
```

Requires `AUTH_SEED_TEST_PASSWORD` (minimum 8 characters).

---

## Operator notes

- Monthly report is a separate `AiDeliveryMonthlyReport` entity — not attached to workflow brief `structuredInputJson`.
- Setup keeps report in `DRAFT`; promote to `FINAL` only through existing admin status API when ready for client portal visibility.
- MI context attach is admin-only via `/mi-context/apply`.
- Live GA/GSC sync stays deferred unless a separate block proves it.
