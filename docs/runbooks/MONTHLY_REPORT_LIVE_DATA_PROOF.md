# Monthly Report Live Data Proof

**Status:** Snapshot-first metrics and FINAL-only client visibility proven locally; live GA/GSC OAuth sync remains deferred until §3.1a token/OAuth gaps close and this gate passes on target environment. **2026-07-10 G78 audit:** confirmed owned docs distinguish MANUAL/placeholder local baseline vs future live GA/GSC for Puriva launch — no overclaim on OAuth/live sync.

**Gate:** Puriva Launch blocker — GA/GSC live proof + monthly report FINAL client path (see [`docs/operator/deferred-scope-register.md`](../operator/deferred-scope-register.md) and [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md) — Monthly Report Flow v1).

Related:

- [`PURIVA_MONTHLY_REPORT_V1_GATE.md`](./PURIVA_MONTHLY_REPORT_V1_GATE.md)
- [`PURIVA_MANUAL_METRICS_V1_GATE.md`](./PURIVA_MANUAL_METRICS_V1_GATE.md)
- [`POST_MVP_BLOCK_47_MONTHLY_METRICS_IMPORT_BROWSER_GATE.md`](./POST_MVP_BLOCK_47_MONTHLY_METRICS_IMPORT_BROWSER_GATE.md)
- [`PURIVA_MVP_BLOCK_21_MONTHLY_REPORT_PRE_STAGING_GATE.md`](./PURIVA_MVP_BLOCK_21_MONTHLY_REPORT_PRE_STAGING_GATE.md)
- [`PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md`](./PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md)
- [`EXTERNAL_INTEGRATIONS_READINESS.md`](./EXTERNAL_INTEGRATIONS_READINESS.md)
- [`INTEGRATIONS_TRUTH_MATRIX.md`](./INTEGRATIONS_TRUTH_MATRIX.md)
- [`PHASE_F_BLOCK_61_ENCRYPTED_CREDENTIALS_LOCAL_CHECKLIST.md`](./PHASE_F_BLOCK_61_ENCRYPTED_CREDENTIALS_LOCAL_CHECKLIST.md)
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

### 3.1a OAuth / token readiness (current implementation ceiling)

Code-inspection finding (`apps/api/src/config/ga-gsc.config.ts`, `external-integrations-readiness.service.ts`): the GA/GSC readiness layer today checks **env presence only** — `syncEnabled`, `hasOauthClientId`, `hasOauthClientSecret` — and every readiness result carries `liveOAuthDeferred: true` and `liveSyncDeferred: true` at the type level. There is **no OAuth consent/callback route, no token exchange, no refresh-token storage, and no token model in `packages/data`** found in this repo as of this audit.

This means "OAuth readiness" today can only prove **client credential shape**, not a working token. Before any live OAuth consent flow is attempted on a target environment, the following must exist and be reviewed — none of it is in scope for this docs-only subagent:

| Gap | Why it blocks live proof | Owner action required |
|-----|---------------------------|------------------------|
| No OAuth consent/callback endpoint in `apps/api` | Cannot start or complete a real Google consent flow | Implement guarded callback route (separate approved block) |
| No token storage model (access token, refresh token, expiry, scope) in Prisma schema | Nothing to persist after consent even if the flow ran | Schema/migration change — requires explicit owner approval per `AGENTS.md` |
| No token refresh/rotation logic | A short-lived access token would silently expire mid-sync | Implement + unit-test refresh path before first live pull |
| No encryption-at-rest plan for stored refresh token | Refresh tokens are long-lived secrets; storing plaintext is unacceptable | Reuse `credential-encryption.service.ts` pattern (see `PHASE_F_BLOCK_61_ENCRYPTED_CREDENTIALS_LOCAL_CHECKLIST.md`) or define equivalent before storage exists |
| No documented Google Cloud OAuth consent screen / scope list for GA4 + Search Console | Google requires a registered app + scopes before any consent can be granted | Owner completes Google Cloud Console setup out-of-band; record client id presence only, never the secret |

**Token readiness proof (future live block) must show, at minimum:**

1. Consent flow completes on target environment without secrets appearing in logs, error messages, or version control.
2. Access token + refresh token persist encrypted at rest, scoped to `tenantId`/project, never returned by any API response.
3. Token refresh succeeds automatically before expiry in at least one observed cycle (or documented manual re-consent procedure if refresh is not yet implemented).
4. Revoking access in Google Cloud Console causes the next sync attempt to fail closed (no stale-token silent success) and readiness reflects `missing_config` or an equivalent failed state — not `configured_shape_ok`.
5. No token value (access or refresh) is ever written to `docs/`, logs, `$env:TEMP` evidence files, or committed anywhere in the repo.

Until items in the gap table above are implemented and separately approved, GA/GSC remains at **config-shape readiness only** — this is the accurate ceiling for local/docs work and must not be represented as further along.

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

### 3.4 Totals reconciliation

Report-level totals (`performanceSummary` shown to admin and, post-FINAL, to the client) must reconcile against their inputs at every stage:

| Check | Expectation |
|-------|-------------|
| Per-article/per-page metrics → report totals | Sum of `itemMetrics` rows (or live per-page GA/GSC pull rows) equals the aggregate `gscClicks`, `gscImpressions`, `ga4Sessions`, `ga4Users`, `ga4PageViews` on the approved snapshot, within any documented rounding tolerance |
| Approved snapshot → PDF totals | PDF-rendered totals equal the approved snapshot values at generation time — no independent recomputation path |
| PDF totals → client `performanceSummary` | Client-visible aggregate equals PDF totals for the same FINAL report (no drift between export and portal view) |
| Snapshot revision → totals | If a snapshot is archived and re-imported (§9 rollback), totals must reflect only the latest **approved** snapshot, never a blended or stale sum |
| Placeholder totals | When `placeholderOnly: true`, totals must still sum internally consistently even though they are not live traffic — consistency is checked the same way, just labeled as placeholder |

Any mismatch found in local or live proof is a proof failure, not a cosmetic issue — it means either the aggregation logic or the snapshot approval boundary is broken.

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

- §3.1a OAuth/token readiness gaps closed and separately approved (consent route, token storage, encryption, refresh) — **not yet implemented as of this audit**
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

## 8a. STOP criteria

Stop immediately and do **not** claim GA/GSC live proof progress, do **not** attempt an OAuth consent flow, and escalate to the owner if any of the following are true:

- No OAuth consent/callback route, token storage model, or token encryption plan exists yet (see §3.1a) — this must close as its own approved block before any live consent attempt
- `GA4_GSC_SYNC_ENABLED=true` is set on any environment without explicit named-owner approval for that specific environment
- A Google OAuth client id/secret pair is present in an environment that was not explicitly approved for GA/GSC live testing
- Any script, log, evidence file, or doc change would cause an OAuth client secret, access token, or refresh token value to be printed, logged, or written to disk outside a secret manager
- A live GA/GSC API call is about to be made against a real Puriva (or any client) property before written owner approval for that named property exists
- Per-article metric totals do not reconcile against report-level totals per §3.4 — do not promote the report to FINAL
- A report is about to be promoted to **FINAL** without an **approved** metrics snapshot backing its `performanceSummary`
- A DRAFT or ADMIN_REVIEW report is visible (API or UI) to any client-role session
- A client-role response contains any forbidden field listed in §4 or §6.3
- PDF generation is about to run against unapproved or archived snapshot data
- This subagent is asked to run a live GA/GSC call, touch `.env`/credential files, or edit anything outside the three files this block is scoped to — refuse and report instead

When a STOP condition is hit: halt the current step, do not attempt a workaround, and report the exact condition, the file/command involved, and the recommended owner action.

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
