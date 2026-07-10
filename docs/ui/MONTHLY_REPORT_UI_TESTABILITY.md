# Monthly Report UI Testability (G666)

**Status:** Docs review refreshed 2026-07-10 (Lane 17). Tiny copy-safety already applied in `MonthlyReportPanel.tsx` (G429).  
**Primary UI:** `apps/web/src/pages/ai-delivery/MonthlyReportPanel.tsx` (~1595 lines)  
**Prior:** [`docs/ux/monthly-report-ui-testability.md`](../ux/monthly-report-ui-testability.md)

## What to prove

| Concern | Expected |
|---------|----------|
| FINAL visibility | Client Portal shows report only when status is FINAL |
| Metrics source | Manual/CSV/snapshot path; live GA/GSC deferred |
| Placeholder honesty | Empty/metrics copy must not imply live sync |
| PDF / document | Local generation/upload paths remain smoke-covered |
| MI context | Admin-only; not client-visible internals |

## Existing automation

| Layer | Command / script | Coverage |
|-------|------------------|----------|
| Metrics smoke | `npm.cmd run smoke:monthly-report:metrics` | Snapshot path |
| Puriva monthly | `npm.cmd run smoke:puriva-monthly-report:local` | Local Puriva path |
| PDF | `npm.cmd run smoke:monthly-report:pdf` | PDF generation |
| Browser import | `npm.cmd run smoke:monthly-metrics-import:browser` | Admin import UX |
| Unit | `proof-state-labels.test.ts` (overclaim helper) | Copy-safety patterns only |

## Manual QA checklist (admin)

1. Open AI Delivery → Monthly Report for a project with no report → create shell CTA works.  
2. DRAFT → Admin Review → Finalize → action hint mentions Client Portal + deferred GA/GSC.  
3. Metrics empty state mentions manual/CSV and deferred live sync.  
4. Summary panel shows GA/GSC and 12-month trends as **Deferred**.  
5. FINAL report: client-visible fields only; internal notes stay admin-only.  
6. Confirm no copy says “live synced”, “live ready”, or “production ready”.

## Gaps (propose only — Lane 17 does not rewrite MonthlyReportPanel)

| ID | Gap | Suggested follow-up |
|----|-----|---------------------|
| MR-T1 | No unit test for `reportShellCopy` / action hints | Extract tiny pure copy helper + vitest (optional future gate) |
| MR-T2 | Browser smoke does not assert FINAL Client Portal string | Lane 9 / smoke owner |
| MR-T3 | Inline loading/error vs shared components | See [`UI_EMPTY_ERROR_STATE_SAFETY.md`](./UI_EMPTY_ERROR_STATE_SAFETY.md) |

## Copy-safety (done G429; reconfirmed G669 scan)

- FINAL `actionHint` includes Client Portal visibility + deferred GA/GSC.  
- Metrics empty / EmptyState mention manual/CSV + deferred live sync.  
- No unqualified “live ready” / “production ready” strings found under `apps/web/src/pages` in G669 scan.
