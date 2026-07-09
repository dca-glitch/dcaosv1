# Monthly Report Live Data Proof

**Status:** Snapshot-first metrics and FINAL-only client visibility proven locally; live GA/GSC OAuth sync remains deferred until this gate passes on target environment.

**Gate:** Puriva Launch blocker — GA/GSC live proof + monthly report FINAL client path (see [`docs/operator/deferred-scope-register.md`](../operator/deferred-scope-register.md) and [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md) — Monthly Report Flow v1).

Related:

- [`PURIVA_MONTHLY_REPORT_V1_GATE.md`](./PURIVA_MONTHLY_REPORT_V1_GATE.md)
- [`PURIVA_MANUAL_METRICS_V1_GATE.md`](./PURIVA_MANUAL_METRICS_V1_GATE.md)
- [`POST_MVP_BLOCK_47_MONTHLY_METRICS_IMPORT_BROWSER_GATE.md`](./POST_MVP_BLOCK_47_MONTHLY_METRICS_IMPORT_BROWSER_GATE.md)
- [`PURIVA_MVP_BLOCK_21_MONTHLY_REPORT_PRE_STAGING_GATE.md`](./PURIVA_MVP_BLOCK_21_MONTHLY_REPORT_PRE_STAGING_GATE.md)
- [`PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md`](./PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md)
- [`EXTERNAL_INTEGRATIONS_READINESS.md`](./EXTERNAL_INTEGRATIONS_READINESS.md)
- `apps/api/src/config/ga-gsc.config.ts`
- `apps/api/src/core/monthly-report-pdf.service.ts`
- `scripts/smoke-monthly-report-metrics-local.mjs`
- `scripts/smoke-monthly-report-pdf-local.mjs`
- `scripts/smoke-client-portal-monthly-report-browser-local.mjs`

---

## 1. Purpose

Prove that DCA OS Lite monthly reports:

1. Import metrics from **GA/GSC or approved admin snapshot** sources — AI cannot invent traffic numbers.
2. Support **per-article (per SEO plan item) metrics** for admin review and PDF composition.
3. Expose reports to clients **only when status is FINAL** — DRAFT/ADMIN_REVIEW hidden.
4. Generate **PDF/export** artifacts for admin and client-safe download references.

Local baseline uses **MANUAL/snapshot** placeholders. Live proof upgrades to real GA/GSC pull on approved target.

---

## 2. Canonical monthly report flow

From [`PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md):

1. Admin selects date range
2. System pulls GA/GSC data *(live — target of this gate)*
3. System generates report
4. AI may generate narrative/insights *(metrics must come from approved source only)*
5. Admin reviews → may reject/revise narrative with reason
6. Admin approves **FINAL** report
7. Client notification (in-system + email — separate transactional proof gate)
8. **FINAL** report appears in Client Portal

**Client rules:** no draft visibility, no approval/reject/comments/request-changes on the report itself.

---

## 3. Metrics architecture

### 3.1 GA/GSC integration (live — deferred locally)

| Env key | Purpose |
|---------|---------|
| `GA4_GSC_SYNC_ENABLED` | Must be `true` to arm live sync (default off) |
| `GOOGLE_OAUTH_CLIENT_ID` | OAuth client id (presence only in readiness) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth secret (never logged) |

Readiness: `GET /integrations/readiness` → GA/GSC category `disabled` | `missing_config` | `configured_shape_ok`. **Shape ok does not prove live OAuth.**

Live sync implementation remains gated; this runbook defines proof expectations when enabled.

### 3.2 Admin snapshot import (local baseline — proven)

| Item | Detail |
|------|--------|
| Import endpoint | `POST /ai-delivery/reports/monthly/:reportId/metrics/import` |
| Approve | `POST .../metrics/:snapshotId/approve` |
| Fields | `gscClicks`, `gscImpressions`, `gscAverageCtr`, `gscAveragePosition`, `ga4Sessions`, `ga4Users`, `ga4PageViews`, `sourceType`, `targetMonth` |
| UI | AI Delivery → Monthly Report modal → **Snapshot metrics** / **Import snapshot metrics** |

Smoke: `npm run smoke:monthly-report:metrics`, `npm run smoke:monthly-metrics-import:browser`.

### 3.3 Per-article metrics

| Layer | Behavior |
|-------|----------|
| **Admin — Puriva manual metrics** | One placeholder row per planned SEO item (`itemMetrics` in snapshot `notes` JSON embed); validated in `puriva-manual-metrics.ts` |
| **Admin — live GA/GSC (target)** | Per-page/article metrics must map to SEO plan items or deliverable URLs; stored in approved snapshot before client exposure |
| **Client portal** | Receives **aggregated** `performanceSummary` totals + `itemCount` + disclaimer — **never** raw `itemMetrics`, snapshot `notes`, or import metadata |
| **PDF** | Includes aggregate GSC/GA4 totals and final deliverable list; per-article detail stays admin-side unless product gate expands client PDF |

**Rule:** AI narrative must not invent metrics. All numbers trace to imported/approved snapshot or live GA/GSC pull.

---

## 4. FINAL-only client visibility

| Status | Admin | Client Portal |
|--------|-------|---------------|
| `DRAFT` | Full edit/review | **Hidden** |
| `ADMIN_REVIEW` | Full edit/review | **Hidden** |
| `FINAL` | Read-only archive | **Visible** — sanitized title, recommendations, `performanceSummary` |

Proof smokes:

```powershell
cd C:\dcaosv1
npm.cmd run smoke:monthly-report:local
npm.cmd run smoke:client-portal-monthly-report:browser
npm.cmd run smoke:puriva-client-portal-boundary:local
```

Forbidden in client responses: `adminSummaryNotes`, `itemMetrics`, `storageKey`, `workflowRunId`, `executionLog`, raw snapshot objects, seed markers (`PURIVA_*_V1`).

Promote to FINAL only via existing admin status API after metrics approved and narrative reviewed.

---

## 5. PDF / export

| Item | Detail |
|------|--------|
| Generate | `POST /api/v1/ai-delivery/reports/monthly/:reportId/generate-pdf` (admin-only) |
| Smoke | `npm run smoke:monthly-report:pdf` |
| Output | PDF bytes via admin download reference; `hasDocument` true after generation |
| R2 | Without R2 creds smoke accepts `R2_STORAGE_NOT_CONFIGURED` and skips byte roundtrip |
| Client export | Client-safe `exportUrl` on deliverables only — internal `storageKey` never exposed |

PDF includes: report title/period, delivery summary, aggregate metrics (when approved snapshot present), final deliverables list with safe export links.

---

## 6. Proof paths

### 6.1 Local baseline (snapshot-first — required before live)

```powershell
cd C:\dcaosv1
npm.cmd run validate
npm.cmd run smoke:monthly-report:local
npm.cmd run smoke:monthly-report:metrics
npm.cmd run smoke:monthly-report:pdf
npm.cmd run smoke:monthly-metrics-import:browser
npm.cmd run smoke:client-portal-monthly-report:browser
npm.cmd run smoke:puriva-monthly-report:local
```

Requires `AUTH_SEED_TEST_PASSWORD`.

Pass: admin lifecycle, snapshot import/approve, PDF generation, FINAL-only portal filter, forbidden fields absent.

### 6.2 Live GA/GSC proof (owner/manual — target environment)

**Preconditions:**

- Explicit owner approval for GA/GSC on named target (staging or production)
- `GA4_GSC_SYNC_ENABLED=true` + valid OAuth credentials on target only
- Puriva property access granted in Google Analytics 4 and Search Console
- Monthly report shell exists for target project/month

**Steps:**

1. Confirm readiness: `GET /integrations/readiness` → GA/GSC not `disabled`.
2. Complete OAuth consent flow on target (operator browser — no secret logging).
3. Admin selects date range matching Puriva reporting month.
4. Trigger GA/GSC pull (admin action when live sync block is active).
5. Verify snapshot `sourceType` reflects live import (not placeholder-only).
6. Verify per-article metrics align with SEO plan item count.
7. Admin approves snapshot.
8. Generate report narrative; admin review.
9. Promote report to **FINAL**.
10. Confirm client portal shows report with `performanceSummary` — no `placeholderOnly` if live data intended.
11. Generate PDF; verify totals match approved snapshot.
12. Run client portal boundary smoke against target or export API responses for audit.

**Restore:** Set `GA4_GSC_SYNC_ENABLED=false` on target if proof complete and live sync not yet authorized for ongoing ops.

### 6.3 Negative proofs

- DRAFT report absent from client portal API and UI
- Unapproved snapshot not used in client `performanceSummary`
- Placeholder metrics (`placeholderOnly: true`) must show client-safe disclaimer — never presented as live traffic without approval

---

## 7. Pass criteria (live data proof closure)

| # | Criterion |
|---|-----------|
| 1 | All §6.1 baseline smokes PASS |
| 2 | Live GA/GSC pull succeeds on approved target with real Puriva properties |
| 3 | Per-article metrics count matches SEO plan items (or documented exceptions) |
| 4 | Admin approves snapshot before FINAL promotion |
| 5 | Client portal shows report **only** after FINAL |
| 6 | PDF totals match approved snapshot |
| 7 | No forbidden fields in client/API browser proofs |
| 8 | Owner evidence log + approval recorded |

---

## 8. Forbidden

- Presenting placeholder/zero metrics as live performance to clients
- FINAL promotion without approved metrics snapshot
- Exposing `itemMetrics`, raw notes, or OAuth secrets to clients
- Live GA/GSC on production without G9-class environment approval
- AI-generated metrics not sourced from GA/GSC or approved import

---

## 9. Rollback

| Scenario | Action |
|----------|--------|
| Bad snapshot imported | Archive snapshot via admin API; re-import corrected data |
| FINAL sent prematurely | Do not delete client notification history; create corrected FINAL revision per admin workflow; document in decision log |
| Wrong GA/GSC property linked | Disable sync; revoke OAuth token in Google Cloud console; fix property mapping; re-run OAuth on target |
| PDF with wrong numbers | Regenerate PDF after snapshot fix; confirm client download points to updated document |

---

## 10. Evidence template

Save to `$env:TEMP\monthly-report-live-data-proof-<date>.log`:

```
Date:
Target env: local | staging | production
Commit SHA:
Baseline smokes (§6.1): PASS | FAIL
GA/GSC live pull: PASS | FAIL | skipped (local only)
Source type:
Per-article metric count:
SEO plan item count:
FINAL promotion:
Client portal visible after FINAL only: yes | no
PDF generated: yes | no
Placeholder presented as live: no (required)
Forbidden fields in client responses: no (required)
Owner approval reference:
```
