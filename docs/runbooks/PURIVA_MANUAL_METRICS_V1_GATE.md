# Puriva Manual Metrics v1 Gate

**Status:** Deterministic manual placeholder metrics for Puriva monthly reports without GA/GSC OAuth or live API calls.

Related:

- `apps/api/src/core/puriva-manual-metrics.ts`
- `scripts/lib/puriva-manual-metrics.mjs`
- `scripts/lib/puriva-monthly-report.mjs`
- `docs/runbooks/PURIVA_MONTHLY_REPORT_V1_GATE.md`

---

## What it proves

1. **Per-page placeholders** — one zero-value manual metric row per planned SEO item/page
2. **Aggregate totals** — deterministic zero totals with `placeholderOnly: true`
3. **Source metadata** — `sourceType: MANUAL`, import `IMPORTED`, approve `APPROVED`, notes marked placeholder
4. **Monthly report consumption** — report context embeds manual metrics; only approved MANUAL snapshots parse into client-safe placeholder summary
5. **Client boundary** — DRAFT report remains hidden from client portal until promoted to FINAL; FINAL reports with manual placeholders expose `performanceSummary.placeholderOnly`, `manualSource`, and client-safe `disclaimer` (never raw notes, itemMetrics embed, or internal markers)
6. **Idempotent setup** — second run reuses approved snapshot when manual metrics marker present

---

## Forbidden

- GA/GSC OAuth or Google API calls
- Fake/non-zero traffic values presented as real performance
- Schema/migration changes
- Forced FINAL report promotion

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

- Per-item metrics are stored in snapshot `notes` JSON embed (admin API only); client portal never receives raw notes.
- Upgrading from legacy monthly-report-only marker triggers one-time metrics re-import with manual metrics embed.
- Live analytics remain a separate approved integration path.
