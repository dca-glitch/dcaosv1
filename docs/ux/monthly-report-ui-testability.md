# Monthly Report UI Testability (G429–G448)

**Status:** Docs review. Tiny copy-safety already applied in `MonthlyReportPanel.tsx`.  
**Primary UI:** `apps/web/src/pages/ai-delivery/MonthlyReportPanel.tsx`

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
| Unit | None dedicated to panel copy | Gap — optional helper tests |

## Manual QA checklist (admin)

1. Open AI Delivery → Monthly Report for a project with no report → create shell CTA works.  
2. DRAFT → Admin Review → Finalize → action hint mentions Client Portal + deferred GA/GSC.  
3. Metrics empty state mentions manual/CSV and deferred live sync.  
4. Summary panel shows GA/GSC and 12-month trends as **Deferred**.  
5. FINAL report: client-visible fields only; internal notes stay admin-only.  
6. Confirm no copy says “live synced” or “production ready”.

## Gaps

| ID | Gap | Suggested follow-up |
|----|-----|---------------------|
| MR-T1 | No unit test for `reportShellCopy` / action hints | Extract tiny pure copy helper + vitest (optional) |
| MR-T2 | Browser smoke does not assert FINAL Client Portal string | Lane 6 / smoke owner |
| MR-T3 | Inline loading/error vs shared components | UX-P15 |

## Copy-safety (done G429)

- FINAL `actionHint` includes Client Portal visibility + deferred GA/GSC.  
- Metrics empty / EmptyState mention manual/CSV + deferred live sync.
