# Puriva Monthly Report v1 Gate

**Status:** Local deterministic monthly report scaffolding for Puriva delivery status and compliance-safe recommendations. G85 live GA/GSC path planning, G103-G109 helper guardrails, **G171-G180** closeout, and **G269-G288** analytics hardening (exhaustive config/redaction, period/timezone, source-truth, unavailable-state, export truth labels) are documented here and in related runbooks — they do **not** change this gate into live analytics proof.

Related:

- [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md) — canonical monthly report flow and launch blockers
- `apps/api/src/core/puriva-monthly-report.ts`
- `apps/api/src/core/monthly-report-policy.ts`
- `apps/api/src/config/ga-gsc.config.ts`
- `apps/api/src/core/ga-gsc-period-policy.ts`
- `apps/api/src/core/monthly-report-metrics-validation.ts`
- `apps/api/src/core/monthly-report-metrics-recommendation-policy.ts`
- `apps/api/src/core/monthly-report-metrics-output-guard.ts`
- `apps/api/src/core/monthly-report-metrics-unavailable-state.ts`
- `apps/api/src/core/monthly-report-metrics-export-truth.ts`
- `apps/api/src/core/metrics-source-truth.ts`
- [`MONTHLY_REPORT_CSV_IMPORT_PROOF_PLAN.md`](./MONTHLY_REPORT_CSV_IMPORT_PROOF_PLAN.md) — CSV/manual import proof plan (no live Google)
- [`MONTHLY_REPORT_LIVE_DATA_PROOF.md`](./MONTHLY_REPORT_LIVE_DATA_PROOF.md) — live GA/GSC remains deferred
- `scripts/lib/puriva-monthly-report.mjs`
- `scripts/lib/puriva-local-setup.mjs`
- `docs/runbooks/PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md`

---

## Canonical monthly report flow

**Target product flow** (Puriva Operating Pack — live analytics is a future gate, not current local proof):

Admin date range → GA/GSC pull *(live — deferred)* → report generation → admin review/approval → client notification → Client Portal.

Full steps and rules: [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md) — **Puriva Monthly Report Flow v1**.

**This gate proves local deterministic scaffolding only** — placeholder MANUAL metrics (`placeholderOnly: true`); no live GA/GSC OAuth or sync. See [`MONTHLY_REPORT_LIVE_DATA_PROOF.md`](./MONTHLY_REPORT_LIVE_DATA_PROOF.md) §3.2 vs §3.1 for the upgrade path, §3.1b for G85 live-path planning requirements, and §3.1c for G103-G109 local helper closeout.

## What it proves

1. **Delivery status aggregation** — planned SEO items, draft scaffolds, image scaffolds, compliance blockers, verification blockers, draft-handoff state, final release state
2. **Next-month recommendations** — derived from taxonomy/MI/SEO templates with compliance-safe language
3. **Admin report seed** — DRAFT monthly report with marker in title/admin notes; placeholder manual metrics imported and approved
4. **Client boundary** — client portal lists zero monthly reports while status remains DRAFT (FINAL-only, snapshot-based filter)
5. **No live analytics** — placeholder metrics only; no GA/GSC OAuth
6. **Client-safe archive** — finalized monthly reports are read-only in the portal, close the content/image/handoff loop, and do not expose `storageKey`, provider metadata, or execution logs
7. **No scope creep** — no public links, comments, or request-changes workflow is added by this handoff

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

- Monthly report is a separate `AiDeliveryMonthlyReport` entity — not attached to workflow brief `structuredInputJson`, but it is the downstream archive record that closes the SEO/content/image/draft-handoff loop.
- Setup keeps report in `DRAFT`; promote to `FINAL` only through existing admin status API when ready for client portal visibility.
- MI context attach is admin-only via `/mi-context/apply`.
- Live GA/GSC sync stays deferred unless a separate block proves it.
- Client-facing monthly report wording should stay final-snapshot based unless live sync is separately approved.
- G85 does not authorize OAuth execution, token storage changes, Google API calls, or client-visible "live analytics" labels; it only defines the preconditions and truth-label policy for a future live block.
- G103-G109 helper tests cover config shape, date range policy, property mapping shape, metrics source truth, generation input contract, and FINAL-only client visibility; they do not prove OAuth or live analytics.
- **G171-G180 closeout (2026-07-10):** credential presence hardening (missing client id/secret/refresh/property/GSC site; full shape still live-deferred; secrets not serialized); period policy (month bounds, leap Feb, future month rejected, partial current-month warning); metrics source truth serializer (manual/placeholder/csv/live/unavailable/mixed); metric row validation; recommendation input policy (metrics/manual/AI-draft/placeholder — no live AI); client FINAL-only and admin controlled output guards; CSV/manual import proof plan doc. Focused unit tests only — no live Google, no smoke required for this lane.
- **G269-G288 hardening (2026-07-10):** exhaustive GA/GSC config-shape/redaction/disabled/missing_config/`configured_shape_ok`+live_deferred tests; period/timezone/future-current month policy tests; metrics source truth + mixed-source hardening; expanded metric validation and recommendation policy tests; client/admin output guard expansion; unavailable-state helper; export/download truth labels (`hasDocument` / `exportUrl` / never `storageKey`); CSV proof plan + this gate refresh. Still **no live Google**, no OAuth, no token storage.
