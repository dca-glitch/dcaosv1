# Puriva Content Production Foundation v1

**Status:** Deterministic draft scaffold production from Puriva SEO plan.

**Scope:** Internal outline/brief scaffolds with compliance gates. No final client copy, provider calls, crawling, WordPress, or client portal exposure.

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

SEO plan -> content draft scaffolds -> image/asset package -> compliance review checkpoint -> draft-only WordPress handoff -> final archive.

This stage turns approved SEO objectives into internal draft scaffolds; the compliance checkpoint must pass before anything is handed off downstream.

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

- Draft scaffolds are **admin/internal only** — never treat as approved client copy or draft-ready handoff without the compliance review checkpoint.
- High-risk topics require medical review before expansion.
- Credential/partner/license references remain verification-required.
- No OpenRouter, crawl, live publish, or client portal review requests in this block.
