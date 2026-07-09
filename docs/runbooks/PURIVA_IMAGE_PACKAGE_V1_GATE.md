# Puriva Image Package Foundation v1

**Status:** Deterministic image prompt scaffold production from Puriva content production.

**Scope:** Internal admin image concept scaffolds with compliance gates. No image generation, provider calls, crawling, WordPress, or client portal exposure.

Related:

- [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md) — canonical article/image workflow and launch blockers
- `apps/api/src/core/puriva-image-package.json`
- `apps/api/src/core/puriva-image-package.ts`
- `apps/api/src/core/puriva-content-production.ts`
- `apps/api/src/core/puriva-medical-compliance.ts`
- `scripts/lib/puriva-image-package.mjs`
- `docs/runbooks/PURIVA_CONTENT_PRODUCTION_V1_GATE.md`

---

## Structure

Version: `PURIVA_IMAGE_PACKAGE_V1`

Kind: `puriva_image_package_seed`

Each SEO/content item produces one `imagePackage` with up to 3 `concepts` (by content type):

| Field | Purpose |
|---|---|
| `concepts` | Hero, supporting education, and lifestyle context prompt scaffolds |
| `promptScaffold` | Internal admin prompt labeled `INTERNAL ADMIN IMAGE PROMPT SCAFFOLD — NOT FOR CLIENT OR GENERATION USE` |
| `altTextDraft` | Planning alt text for accessibility review |
| `complianceFlags` | From taxonomy + `assessPurivaMedicalCompliance()` |
| `finalReadyGating` | Always `allowed: false` at scaffold stage |
| `packageMetadata` | Links back to SEO plan item and versions |

Concept counts by content type:

| Content type | Concepts |
|---|---|
| `service_page` | 3 |
| `faq` | 3 |
| `blog_article` | 3 |
| `comparison_education` | 3 |
| `booking_contact_support` | 2 |

---

## Compliance integration

- Taxonomy baseline flags per service category
- `assessPurivaMedicalCompliance()` on prompt + alt text
- High-risk categories require `medicalReviewRequired`
- Wegovy packages must include `prescription_medication_risk`
- Unsafe visual phrase scan on titles and alt text (not negation context in prompts)
- No before/after, transformation promise, or guaranteed-result language in client-facing scaffold fields

---

## Helpers

| Function | Purpose |
|---|---|
| `buildPurivaImagePackageContext(targetMonth)` | Build packages from content production |
| `buildPurivaWorkflowBriefImagePackageInput(targetMonth)` | Taxonomy + MI + SEO + production + image package attachment |
| `validatePurivaImagePackageContext()` | Structural and safety validation |
| `buildAiDeliveryArticleImageRequestsFromImagePackage()` | Map concepts to AI Delivery article-image API shape |
| `ensurePurivaImagePackageApiSeed()` | Idempotent article-image seed (scripts only) |

---

## Operator path

Canonical end-to-end workflow (hero + 2 inline images, admin/client review, regenerate, upscale, social preview, WordPress handoff): [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md) — **Puriva Article + Image Package Workflow v1**.

This gate covers **image prompt scaffold** production only (internal admin scaffolds, not live generation).

---

## Setup / smoke integration

`scripts/lib/puriva-local-setup.mjs`:

1. Validates image package after content production seed
2. POSTs AI Delivery **article images** (`status: DRAFT`) linked to content drafts when absent
3. PATCHes workflow brief `structuredInputJson` with `imagePackage` attachment

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
npm.cmd run -w @dca-os-v1/api test:unit -- --test-name-pattern puriva-image-package
```

---

## Operator notes

- Image prompt scaffolds are **admin/internal only** — never treat as generation-ready or client-facing assets outside the compliance-reviewed asset package.
- No OpenRouter, image provider, live publish, WordPress, or web fetch calls in this block.
- Final-ready gating remains blocked until medical/compliance review and approved generation workflow exists.
