# Puriva AI SEO Plan Foundation v1

**Status:** Deterministic local/admin SEO planning scaffold for Puriva (`puriva.id`).

**Scope:** Monthly SEO planning objectives for Bali aesthetic clinic services. No final copy generation, provider calls, crawling, or credential claims.

Related:

- `apps/api/src/core/puriva-seo-plan.json`
- `apps/api/src/core/puriva-seo-plan.ts`
- `apps/api/src/core/puriva-service-taxonomy.json`
- `apps/api/src/core/puriva-market-intelligence.json`
- `apps/api/src/core/puriva-medical-compliance.ts`
- `scripts/lib/puriva-seo-plan.mjs`
- `docs/runbooks/PURIVA_MARKET_INTELLIGENCE_V1_GATE.md`
- `docs/runbooks/PURIVA_MEDICAL_COMPLIANCE_V1_GATE.md`

---

## Structure

Version: `PURIVA_SEO_PLAN_V1`

Kind: `puriva_seo_plan_seed`

Each planning item includes:

| Field | Purpose |
|---|---|
| `title` | Planning objective title (not final copy) |
| `planningObjective` | Operator-reviewed planning note |
| `serviceCategoryId` | Taxonomy category linkage |
| `audienceSegments` | `local_clients` / `international_medical_tourists` |
| `searchIntent` | Mapped search intent group |
| `contentType` | `service_page`, `faq`, `blog_article`, etc. |
| `priority` | `high` / `medium` / `low` |
| `stage` | `foundation` / `expansion` / `support` |
| `complianceFlags` | From taxonomy + compliance assessment |
| `medicalReviewRequired` | Required for high-risk topics |
| `verificationRequired` | Hospital/partner/license topics |

Minimum planning coverage:

1. Wegovy / semaglutide eligibility education
2. Stem cell therapy trust/verification content
3. General aesthetic services overview/FAQ
4. Bali medical tourism journey content
5. Clinic trust/about/license verification support
6. Block 3 planning input for AI SEO / AI Delivery planning

---

## Helpers

| Function | Purpose |
|---|---|
| `buildPurivaSeoPlanContext(targetMonth)` | Build deterministic monthly SEO plan |
| `buildPurivaWorkflowBriefPlanningInput(targetMonth)` | Taxonomy + MI + SEO plan attachment |
| `validatePurivaSeoPlanContext()` | Structural and safety validation |
| `buildAiDeliveryContentPlanItemsFromSeoPlan()` | Map plan items to AI Delivery content plan API shape |
| `ensurePurivaSeoPlanApiSeed()` | Idempotent scope notes + content plan seed (scripts only) |

---

## Operator path

SEO plan objectives -> content draft -> image/asset package -> compliance review checkpoint -> draft-only WordPress handoff -> final archive -> monthly report.

Planning items stay as objectives only until the downstream draft/asset package is assembled and cleared by the compliance checkpoint.

---

## Setup / smoke integration

`scripts/lib/puriva-local-setup.mjs`:

1. Validates SEO plan locally after taxonomy + MI checks
2. Attaches `plannedContentScopeNotes` with `[PURIVA_LOCAL_SETUP] PURIVA_SEO_PLAN_V1` marker
3. Creates AI Delivery content plan items from SEO plan when absent
4. PATCHes workflow brief `structuredInputJson` with taxonomy + MI + `seoPlan`

Run:

```powershell
cd C:\dcaosv1
npm.cmd run setup:puriva:local
npm.cmd run smoke:puriva-client-setup:local
```

---

## Run tests

```powershell
cd C:\dcaosv1
npm.cmd run -w @dca-os-v1/api test:unit -- --test-name-pattern puriva-seo-plan
```

---

## Operator notes

- Planning items are **objectives only** — draft copy and image/asset work require compliance review before anything is marked ready for the draft-only WordPress handoff.
- High-risk categories (Wegovy, stem cell) require medical review before client-facing use.
- Hospital/partner/license statements remain verification-required.
- No OpenRouter, crawl, or live publish calls in this block.
- This is planning-only; live automation stays deferred until a separately approved block.
