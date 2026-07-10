# Puriva Client Portal Boundary Gate

**Status:** Local proof that Puriva client portal exposes only safe read-only delivery surfaces (aligned with G329–G348 serializer/error/FINAL guards).

**Scope:** Smoke and setup helpers only — no publication handoff client UI, no internal scaffold exposure, no credential logging.

Related:

- [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md) — canonical launch blockers; Client Portal approval UX blocker
- `scripts/smoke-puriva-client-portal-boundary-local.mjs`
- `scripts/lib/puriva-client-portal-boundary-helpers.mjs`
- `scripts/lib/puriva-local-setup.mjs`
- `docs/runbooks/PURIVA_FULL_DELIVERY_SMOKE_GATE.md`

---

## What it proves

1. **Portal user ensure** — `puriva@puriva.id` can authenticate using `AUTH_SEED_TEST_PASSWORD` from env (created via admin API when missing; password synced without logging credentials)
2. **Client API boundary** — projects, deliverables, delivery summary, release package, monthly reports (list + FINAL detail + download when document exists), catalog responses omit forbidden internals
3. **Monthly report detail boundary (XXL 4B)** — explicit client `GET .../monthly-reports/:reportId` checks; `performanceSummary.sourceType` / `manualSource` / `disclaimer` allowed as client-safe provenance; raw snapshot/admin fields forbidden
4. **Legacy `/briefs` compatibility scan (XXL 4B)** — light boundary on `GET /briefs?clientId=...` as client; forbids workflow/storage/knowledge internals; does not assert deprecation or removal (`companyId` / `submittedById` remain allowed)
5. **Admin path denial** — client token blocked from workflow brief handoff/release admin endpoints (401/403)
6. **Scaffold isolation** — internal draft/image scaffolds remain admin-only; client deliverables list is final-only or empty
7. **Browser boundary** — client portal UI lacks publication handoff, internal prompts, and live publish wording
8. **Empty states** — release package returns null / “No release package yet” when not finalized

---

## Forbidden client exposure (must not appear)

- `Publication handoff` / `Prepare WordPress drafts`
- `structuredInputJson`, `promptScaffold`, internal scaffold labels
- `storageKey`, `releasePackageId`, `ADMIN_REVIEW`
- `workflowRunId`, `executionLog`, `providerMetadata`
- provider/run metadata
- Admin workflow brief / handoff API paths
- Raw metric snapshot/import/admin internals: snapshot `notes`, `itemMetrics`,
  `placeholderDisclaimer`, `verificationRequiredNotes`, `awaitingAnalyticsNote`,
  `miHandoffId`, `miContextDraft`, `adminSummaryNotes`, import/approve user metadata,
  raw snapshot list objects, and Puriva seed markers in report titles

**Allowed on client monthly report detail (provenance only):** `performanceSummary` may
include client-safe fields such as `sourceType`, `manualSource`, `placeholderOnly`,
`disclaimer`, `itemCount`, and normalized GSC/GA4 totals when sourced from an approved
snapshot. This is intentional metric provenance, not a raw provider payload. See
[`docs/modules/CLIENT_PORTAL_PLAN.md`](../modules/CLIENT_PORTAL_PLAN.md).

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run validate
npm.cmd run smoke:puriva-client-portal-boundary:local
npm.cmd run smoke:puriva-full-delivery:local
npm.cmd run validate
```

Requires `AUTH_SEED_TEST_PASSWORD` (minimum 8 characters). No hardcoded passwords in repo.

---

## Operator notes

- Portal user creation uses existing `/auth/create-user` + `/auth/change-password` admin flow; temporary passwords are never logged.
- Second setup/smoke run should login directly without recreating the user.
- Medical review and client approval gates are not bypassed — client sees empty/final-only states until real final delivery exists.
- Client-only users may access `#/client-portal`, but still must not see internal workflow/provider/storage metadata.
