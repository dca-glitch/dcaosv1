# Puriva Content Production Foundation v1

**Status:** Deterministic draft scaffold production from Puriva SEO plan.

**Scope:** Internal outline/brief scaffolds with compliance gates. No final client copy, provider calls, crawling, live publish, WordPress, or client portal exposure.
Draft scaffolds must preserve the same safety limits as the SEO plan: educational only, review-only, and non-promissory until verified and approved.

Related:

- `apps/api/src/core/puriva-content-production.json`
- `apps/api/src/core/puriva-content-production.ts`
- `apps/api/src/core/puriva-seo-plan.ts`
- `apps/api/src/core/puriva-medical-compliance.ts`
- `scripts/lib/puriva-content-production.mjs`
- `docs/runbooks/PURIVA_SEO_PLAN_V1_GATE.md`

---

## Structure

Version: `PURIVA_CONTENT_PRODUCTION_V1`

Kind: `puriva_content_production_seed`

Each SEO plan item produces one `draftScaffold` with:

| Field | Purpose |
|---|---|
| `outlineSections` | Per content-type section headings and purposes |
| `draftBrief` | Internal outline text labeled `INTERNAL DRAFT SCAFFOLD — NOT APPROVED CLIENT COPY` |
| `complianceAssessment` | From `assessPurivaMedicalCompliance()` |
| `medicalReviewRequired` | Gate for Wegovy / stem cell topics |
| `verificationRequired` | Hospital/partner/license planning topics |
| `productionMetadata` | Links back to SEO plan item and versions |

Supported content types: `service_page`, `faq`, `blog_article`, `comparison_education`, `booking_contact_support`.

Content production must not introduce:

- before/after proof language
- outcome guarantees or expected-result language
- partner, hospital, or license assertions without evidence
- BPOM or local medical-advertising claims without current verification
- contraindication-free or universal-suitability wording

---

## Helpers

| Function | Purpose |
|---|---|
| `buildPurivaContentProductionContext(targetMonth)` | Build scaffolds from SEO plan |
| `buildPurivaWorkflowBriefProductionInput(targetMonth)` | Taxonomy + MI + SEO + content production attachment |
| `validatePurivaContentProductionContext()` | Structural and safety validation |
| `buildAiDeliveryContentDraftRequestsFromProduction()` | Map scaffolds to AI Delivery draft API shape |
| `ensurePurivaContentProductionApiSeed()` | Idempotent content draft seed (scripts only) |

---

## Operator path

Verified Puriva intake + approved KB/context -> SEO plan -> content draft scaffolds -> image/asset package -> compliance review checkpoint -> admin review -> draft-only WordPress prepared draft handoff -> final archive.

- **Context ready / missing:** Content draft scaffolds must be grounded in verified intake (brief) and approved knowledge/context. If context is missing, drafts are unapproved scaffolds and must not be treated as final client copy.
- **No draft is final before compliance review:** Draft scaffolds, image packages, and prepared WordPress payloads are internal objectives until the compliance checkpoint and admin review pass.
- **WordPress is draft-only:** The WordPress handoff prepares a local draft payload only. Live publish remains deferred and disabled. It does not mutate production WordPress or handle credentials.
- **Client sees final/review-safe outputs only:** Client Portal and monthly reports expose only FINAL or approved deliverables. Internal drafts, review notes, workflow metadata, provider/job/run details, and storage references stay admin-only.
- **Sensitive topics stay cautious:** Wegovy/semaglutide education, stem cell therapy, Bali medical-tourism wording, aesthetic procedure descriptions, and any compliance-sensitive claim must remain educational until medical/compliance review clears the wording.

This stage turns approved SEO objectives into internal draft scaffolds; the compliance checkpoint and admin review must pass before anything is handed off downstream.

---

## Setup / smoke integration

`scripts/lib/puriva-local-setup.mjs`:

1. Validates content production after SEO plan seed
2. POSTs AI Delivery **content drafts** (`status: DRAFT`) linked to content plan items when absent
3. PATCHes workflow brief `structuredInputJson` with `contentProduction` attachment

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
npm.cmd run -w @dca-os-v1/api test:unit -- --test-name-pattern puriva-content-production
```

---

## Operator notes

- **Context ready / missing:** Content production depends on verified Puriva intake and approved knowledge/context. Draft scaffolds created without approved context are not grounded and should not drive final client copy.
- Draft scaffolds are **admin/internal only** — never treat as approved client copy or draft-ready handoff without the compliance review checkpoint and admin review.
- **No draft is final before compliance review:** Generated drafts, image packages, and prepared WordPress payloads remain internal scaffolds until the compliance checkpoint and admin review pass.
- **WordPress is draft-only:** The handoff prepares a local draft payload only. Live publish remains deferred and disabled.
- **Client sees final/review-safe outputs only:** Client Portal and monthly reports expose only FINAL or approved deliverables. Internal drafts, review notes, and workflow metadata stay admin-only.
- High-risk topics require medical review before expansion.
- Credential/partner/license references remain verification-required and must not be inferred from travel or service descriptions.
- Do not convert outline sections into final claims about weight loss, suitability, outcomes, or local compliance.
- No OpenRouter, crawl, live publish, or client portal review requests in this block.
