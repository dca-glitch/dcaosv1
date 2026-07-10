# Puriva Monthly Report v1 Gate

**Status:** Local deterministic monthly report scaffolding for Puriva delivery status and compliance-safe recommendations. G85 live GA/GSC path planning is documented separately and does not change this gate into live analytics proof.

Related:

- [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md) — canonical monthly report flow and launch blockers
- `apps/api/src/core/puriva-monthly-report.ts`
- `scripts/lib/puriva-monthly-report.mjs`
- `scripts/lib/puriva-local-setup.mjs`
- `docs/runbooks/PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md`

---

## Canonical monthly report flow

**Target product flow** (Puriva Operating Pack — live analytics is a future gate, not current local proof):

Admin date range → GA/GSC pull *(live — deferred)* → report generation → admin review/approval → client notification → Client Portal.

Full steps and rules: [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md) — **Puriva Monthly Report Flow v1**.

**This gate proves local deterministic scaffolding only** — placeholder MANUAL metrics (`placeholderOnly: true`); no live GA/GSC OAuth or sync. See [`MONTHLY_REPORT_LIVE_DATA_PROOF.md`](./MONTHLY_REPORT_LIVE_DATA_PROOF.md) §3.2 vs §3.1 for the upgrade path and §3.1b for G85 live-path planning requirements.

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
