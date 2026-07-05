# Puriva AI SEO Plan Foundation v1

**Status:** Deterministic local/admin SEO planning gate for Puriva (`puriva.id`).

**Scope:** Monthly SEO planning objectives for Bali aesthetic clinic services. This is an operator workflow gate, not a final copy or publishing module. No provider calls, crawling, live publish, or credential claims.
Planning objectives are review-only and must stay educational until verified facts, medical review, and compliance review are complete.

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

Planning coverage must avoid:

- before/after-as-proof framing
- guaranteed or expected outcome language
- medical certainty language
- partner, hospital, or license assertions without evidence
- BPOM or local-advertising compliance claims without current verification

## Operator workflow

This gate turns verified intake into monthly SEO objectives, then passes those objectives into AI Delivery work.

### Required inputs

- verified Puriva brief / intake
- approved KB/context
- current taxonomy + market intelligence
- compliance review status
- target month and priority focus

### Progression

verified intake -> SEO plan objectives -> content objectives -> draft/asset work -> compliance review -> admin review -> draft-only WordPress handoff -> final archive/report

### What blocks progress

- missing verified facts
- pending medical review
- pending verification for hospital / partner / license claims
- unsupported contact, claim, or service facts
- unclear target month or content priority

### What becomes AI Delivery work

- content objectives
- draft briefs
- asset package notes
- review comments and handoff notes

### What gets archived or reported later

- approved deliverables
- monthly report
- client-safe archive items
- summary notes for the operator record

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

Verified Puriva intake + approved KB/context -> SEO plan objectives -> content draft -> image/asset package -> compliance review checkpoint -> admin review -> draft-only WordPress prepared draft handoff -> final archive -> monthly report.

- **Context ready / missing:** The SEO plan must be grounded in verified intake (brief) and approved knowledge/context. If the brief is missing or knowledge items are unapproved, the plan is a speculative scaffold and should not drive final client copy.
- **No draft is final before compliance review:** Planning items, generated draft scaffolds, and prepared WordPress payloads are internal objectives until the compliance checkpoint and admin review pass.
- **WordPress is draft-only:** The WordPress handoff prepares a local draft payload only. Live publish remains deferred and disabled in the current block.
- **Client sees final/review-safe outputs only:** Client Portal and monthly reports expose only FINAL or approved deliverables. Internal drafts, review notes, and workflow metadata stay admin-only.
- **Sensitive topics stay in review mode:** Wegovy/semaglutide, stem cell, hospital/partner/license, Bali medical-tourism, before/after, and BPOM-sensitive topics require cautious educational wording and human review before any client-facing use.

Planning items stay as objectives only until the downstream draft/asset package is assembled and cleared by the compliance checkpoint and admin review.

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

- **Context ready / missing:** The SEO plan depends on verified Puriva intake and approved knowledge/context. Do not treat the plan as grounded if the brief is missing or knowledge items are unapproved.
- Planning items are **objectives only** — draft copy and image/asset work require compliance review and admin review before anything is marked ready for the draft-only WordPress handoff.
- **No draft is final before compliance review:** Generated drafts, image packages, and prepared WordPress payloads remain internal scaffolds until the compliance checkpoint and admin review pass.
- **WordPress is draft-only:** The handoff prepares a local draft payload only. Live publish remains deferred and disabled.
- **Client sees final/review-safe outputs only:** Client Portal and monthly reports expose only FINAL or approved deliverables. Internal drafts, review notes, and workflow metadata stay admin-only.
- High-risk categories (Wegovy, semaglutide, stem cell) require medical review before client-facing use.
- Hospital/partner/license statements remain verification-required and should not be implied by travel, referral, or familiarity language.
- Bali medical-tourism pages should stay descriptive and logistical, not promising access, outcomes, or special treatment.
- Before/after or outcome claims should be treated as prohibited unless separately approved and documented.
- BPOM/local medical-advertising claims remain verification-required.
- No OpenRouter, crawl, or live publish calls in this block; draft-only WordPress handoff stays downstream.
- This is planning-only; live automation stays deferred until a separately approved block.
