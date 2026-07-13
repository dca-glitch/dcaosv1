# Monthly Report CSV / Manual Import Proof Plan

> **LIVE GA4/GSC WITHDRAWN (2026-07-13):** Live GA4/GSC is withdrawn. This plan remains relevant only for existing MANUAL/snapshot paths. **Manual CSV import is not authorized for new implementation** unless the owner explicitly reopens that scope. Commands below that referenced deleted `ga-gsc.*` helpers are obsolete.

**Status:** Typed proof plan only — no live Google, no OAuth, no GA/GSC API calls. Live GA4/GSC scope **WITHDRAWN**.
**Lane:** G178 + **G282** refresh (GA/GSC / monthly reports G269–G288) + **G525** refresh (Lane 5 G517–G528).
**Related:** [`PURIVA_MONTHLY_REPORT_V1_GATE.md`](./PURIVA_MONTHLY_REPORT_V1_GATE.md), [`MONTHLY_REPORT_LIVE_DATA_PROOF.md`](./MONTHLY_REPORT_LIVE_DATA_PROOF.md), [`GA_GSC_OAUTH_DESIGN_G517_G528.md`](./GA_GSC_OAUTH_DESIGN_G517_G528.md), [`GA_GSC_G517_G528_CLOSEOUT.md`](./GA_GSC_G517_G528_CLOSEOUT.md), [`POST_MVP_BLOCK_47_MONTHLY_METRICS_IMPORT_BROWSER_GATE.md`](./POST_MVP_BLOCK_47_MONTHLY_METRICS_IMPORT_BROWSER_GATE.md).

---

## 1. Purpose

Define how DCA OS Lite proves **CSV import** and **manual snapshot** metrics for monthly reports without claiming live GA/GSC.

This plan historically bridged toward a live GA/GSC block; that live path is **WITHDRAWN**. Existing MANUAL/snapshot proofs remain valid; do not implement a new CSV importer from this document without a new owner gate.

---

## 2. Source truth labels (must not overclaim)

| Import path | `sourceType` | Metrics truth | Client language allowed |
|-------------|--------------|---------------|-------------------------|
| Manual placeholder fixture | `MANUAL` + `placeholderOnly` | `placeholder` | Placeholder / awaiting analytics only |
| Manual approved numbers | `MANUAL` (not placeholder) | `manual` | Approved manual snapshot |
| CSV file import | `CSV_IMPORT` | `csv` | Approved imported snapshot |
| Live GA/GSC | `GA4` / `GSC` / `HYBRID` | `live` only after readiness + live proof + approved snapshot | Connected analytics — **deferred** |
| Missing / unproven | any incomplete | `unavailable` | Metrics unavailable |

Helpers: `apps/api/src/core/monthly-report-policy.ts`, `apps/api/src/core/metrics-source-truth.ts` (incl. G523 label catalog + G524 `assessGaGscMetricsUnavailableState`), `apps/api/src/core/monthly-report-metrics-unavailable-state.ts` (Lane 6), `apps/api/src/core/monthly-report-metrics-export-truth.ts`. Mapping contracts (no live pull): `ga-gsc-property-mapping.ts`, `ga-gsc-site-url-mapping.ts`.

**G282 / G525 note:** CSV/manual import remains the approved local/staging path. Live GA/GSC is still deferred until OAuth/token gaps in [`MONTHLY_REPORT_LIVE_DATA_PROOF.md`](./MONTHLY_REPORT_LIVE_DATA_PROOF.md) §3.1a and the design in [`GA_GSC_OAUTH_DESIGN_G517_G528.md`](./GA_GSC_OAUTH_DESIGN_G517_G528.md) close under a separate owner-approved block (schema + consent — not this lane). Unavailable metrics must use unavailable-state / GA-GSC unavailable helper labels; export/download must use export-truth labels (`hasDocument` / optional client `exportUrl`) and must never expose `storageKey`.

---

## 3. CSV import proof steps (no live Google)

1. **Prepare fixture CSV** (operator-owned, non-secret) with columns compatible with snapshot import:
   - `targetMonth` (YYYY-MM)
   - `clicks`, `impressions` (non-negative)
   - optional `ctr` (0–1), `position` (1–100)
   - optional `articleUrl` (sanitized; no `javascript:` / `data:`)
   - `source` = `CSV_IMPORT`
2. **Validate rows** with `validateMonthlyReportMetricRow` (unit-tested; G174).
3. **Import via existing admin snapshot API / UI** (`POST` metrics snapshot with `sourceType=CSV_IMPORT`, status `IMPORTED` → admin `APPROVED`).
4. **Attach approved snapshot** to monthly report generation input (`approvedSnapshotId` required before client exposure).
5. **Serialize source truth** — admin label `CSV imported snapshot`; client label must not say “live”.
6. **Promote report to FINAL** only after admin review; client portal lists FINAL-only.
7. **Evidence** — unit test pass + (optional separate smoke) browser import gate; never log OAuth secrets or `storageKey`.

---

## 4. Manual import proof steps

1. Use Puriva manual metrics fixture (`buildPurivaManualMetricsImportRequest`) or admin-entered zeros/real manual numbers.
2. Confirm `placeholderOnly: true` for local scaffold; do not label as live.
3. Approve snapshot → consume via `consumePurivaApprovedManualMetricsSnapshot`.
4. Client-safe disclaimer from `buildPurivaClientSafeManualMetricsDisclaimer`.

---

## 5. Pass / fail criteria

**Pass**

- Metric validation rejects negative clicks/impressions, CTR outside 0–1, position outside 1–100, missing source.
- Source truth serializer distinguishes manual / placeholder / csv / live / unavailable / mixed.
- Client output guard: FINAL only; no `adminSummaryNotes`, `storageKey`, internal source ids, job/run status.
- Admin output may include notes and internal ids; still no raw `storageKey` or OAuth secrets.
- No Google API / OAuth consent executed.

**Fail**

- Client copy claims live GA/GSC without `live` truth + approved snapshot.
- Secrets or `storageKey` appear in serialized client/admin guard payloads.
- Future or blocked current month used without policy compliance.

---

## 6. Out of scope (explicit)

- Live OAuth consent, token storage, Google API pulls
- Schema/migration changes
- Provider / OpenRouter narrative generation as live AI
- Editing `packages/shared` or main-owned status docs from this lane

---

## 7. Focused unit commands

Deleted `ga-gsc.*` helpers are gone. Remaining monthly-report / MANUAL path tests:

```powershell
cd C:\dcaosv1\apps\api
node --import tsx --test src/core/metrics-source-truth.test.ts src/core/monthly-report-policy.test.ts src/core/monthly-report-metrics-validation.test.ts src/core/monthly-report-metrics-recommendation-policy.test.ts src/core/monthly-report-metrics-output-guard.test.ts src/core/monthly-report-metrics-unavailable-state.test.ts src/core/monthly-report-metrics-export-truth.test.ts src/core/puriva-monthly-report.test.ts src/core/puriva-manual-metrics.test.ts
```

No smoke required for G178/G282/G525 proof-plan refresh; G287 / G528 run focused tests only — no full validate in Lane 5.
