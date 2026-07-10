# Puriva Market Intelligence Foundation v1

**Status:** Deterministic local/admin MI scaffolding for Puriva (`puriva.id`).

**Scope:** Operator-reviewed placeholder research context for Bali aesthetic clinic SEO planning. No live crawling, provider calls, or factual credential claims.

Related:

- `apps/api/src/core/puriva-market-intelligence.json`
- `apps/api/src/core/puriva-market-intelligence.ts`
- `apps/api/src/core/puriva-service-taxonomy.json`
- `apps/api/src/core/puriva-medical-compliance.ts`
- `scripts/lib/puriva-market-intelligence.mjs`
- `docs/runbooks/PURIVA_LOCAL_CLIENT_SETUP_FOUNDATION_GATE.md`
- `docs/runbooks/PURIVA_MEDICAL_COMPLIANCE_V1_GATE.md`

---

## Structure

| Section | Purpose |
|---|---|
| `competitorPlaceholders` | Bali aesthetic clinic market positioning placeholders (`*.example.com` only) |
| `audienceSegments` | `local_clients` and `international_medical_tourists` from taxonomy |
| `searchIntentMapping` | Per-category search intent groups and content clusters |
| `contentGapCategories` | Four planning gap themes (eligibility, trust/verification, comparison, medical tourism journey) |
| `serviceCategorySummaries` | Operator-reviewed placeholder research per taxonomy category |
| `verificationRequiredNotes` | Hospital/partner/license claims require verification |
| `complianceAnnotations` | Guidance from taxonomy notes + compliance assessments |

Version: `PURIVA_MARKET_INTELLIGENCE_V1`

Kind: `puriva_market_intelligence_seed`

---

## Helpers

| Function | Purpose |
|---|---|
| `buildPurivaMarketIntelligenceContext()` | Build deterministic MI context from taxonomy + seed JSON |
| `buildPurivaWorkflowBriefFoundationInput()` | Merge taxonomy structured input + `marketIntelligence` attachment |
| `validatePurivaMarketIntelligenceContext()` | Structural and safety validation |
| `findUnsafeApprovedPhrasesInMarketIntelligence()` | Block unsafe approved-conclusion phrases |
| `ensurePurivaMarketIntelligenceApiSeed()` | Idempotent MI project → handoff → AI Delivery apply (scripts only) |

---

## Setup / smoke integration

`scripts/lib/puriva-local-setup.mjs`:

1. Validates taxonomy + MI context locally
2. Seeds MI project with placeholder sources via existing Market Intelligence API flow
3. Executes deterministic research run, approves generated insight, prepares READY handoff
4. Applies handoff to the monthly Puriva AI Delivery project
5. PATCHes workflow brief `structuredInputJson` with taxonomy + `marketIntelligence`

Run:

```powershell
cd C:\dcaosv1
npm.cmd run setup:puriva:local
npm.cmd run smoke:puriva-client-setup:local
```

Idempotency: second setup/smoke pass reuses MI project, handoff, and foundation attachment.

---

## Run tests

```powershell
cd C:\dcaosv1
npm.cmd run -w @dca-os-v1/api test:unit -- --test-name-pattern puriva-market-intelligence
```

---

## Operator notes

- All competitor and research content is labeled as **local operator-reviewed placeholder**.
- Do not publish hospital/partner/license statements without compliance verification.
- No medical treatment efficacy claims; educational positioning only.
- MI API execute is deterministic/local — no OpenRouter, crawl, or WordPress calls in this block.

## G217–G218 contract notes (shared + Puriva helpers)

Shared contracts in `packages/shared/src/market-intelligence.ts`:

- `MarketIntelligenceAdminReviewedSourceSummaryV1` — bounded admin source summary; `uncontrolledScrapingAllowed: false`
- `MarketIntelligenceClientSafeSummaryContractV1` — client-safe title/summary/opportunities/actions + source label only
- `sanitizeMarketIntelligenceClientSafePayload` / `findForbiddenClientSafeMiFields` — strip/detect forbidden internals

Puriva helpers in `apps/api/src/core/puriva-market-intelligence.ts`:

- `buildPurivaMiAdminSourceLabels()` — labels competitor placeholders without live-crawl implication
- `buildPurivaMiClientSafeSummary()` — client-safe surface only
- `findForbiddenPurivaMiClientSafeFields()` — detect internal field leaks in candidates

These helpers do **not** claim live Market Intelligence readiness, live crawl, or production client-portal activation beyond existing local client-safe summary paths.
