# G217–G222 Future Module Contracts Closeout

**Status:** Shared contracts + docs only  
**Date:** 2026-07-10  
**Scope:** Market Intelligence, Revenue Hub, and POD Toolkit typed contracts  
**Runtime impact:** None (no live scrape/CRM/marketplace; no schema/API activation)

**Related:**

- [`G128_G133_MI_RH_POD_CLOSEOUT.md`](./G128_G133_MI_RH_POD_CLOSEOUT.md)
- [`REVENUE_HUB_AI_RH0_OPERATING_MODEL.md`](./REVENUE_HUB_AI_RH0_OPERATING_MODEL.md)
- [`../runbooks/PURIVA_MARKET_INTELLIGENCE_V1_GATE.md`](../runbooks/PURIVA_MARKET_INTELLIGENCE_V1_GATE.md)
- [`../ai-market-intelligence/admin-foundation.md`](../ai-market-intelligence/admin-foundation.md)

---

## G217 — Market Intelligence contract

Bounded sources only (`operator_note`, `uploaded_document`, `approved_url_reference`,
`existing_internal_record`).

- Admin-reviewed source summary: `MarketIntelligenceAdminReviewedSourceSummaryV1`
- Uncontrolled scraping / live crawling: disabled
- Client exposure: `MarketIntelligenceClientSafeSummaryContractV1` only (after admin review)

## G218 — MI sanitization / source labels

- Forbidden client-safe fields listed in `MARKET_INTELLIGENCE_CLIENT_SAFE_FORBIDDEN_FIELDS`
- Helpers: `sanitizeMarketIntelligenceClientSafePayload`, `findForbiddenClientSafeMiFields`,
  `buildMarketIntelligenceSourceLabel`
- Puriva helpers: `buildPurivaMiAdminSourceLabels`, `buildPurivaMiClientSafeSummary`,
  `findForbiddenPurivaMiClientSafeFields`
- Source labels never imply live crawl or marketplace lookup

## G219 — Revenue Hub contract

`RevenueHubOperatingContractV1` covers:

- Lead
- Opportunity (`financialGuarantee: false`)
- Attribution (`crmLiveSynced: false`)
- Advisory recommendation (existing guard)
- No CRM live sync, no financial guarantee, no payment/billing write

Does not activate Revenue Hub module, connectors, or CRM.

## G220 — POD Toolkit contract

`PodToolkitDraftBundleContractV1` covers:

- Idea
- Prompt / image requirement (`liveImageGenerationAllowed: false`)
- Listing copy draft
- Compliance / IP caution (`legalAdviceClaimed: false`)
- `marketplaceSyncAllowed: false`

Does not activate marketplace sync, live publish, or supplier credentials.

## G221 — Export / index stability

Proof file: `packages/shared/src/future-module-contracts.proof.ts`

- Imports concrete modules directly (not via `index.ts`) so compile proofs stay stable
- Runtime asserts for policy flags and sanitization

### Proposed `packages/shared/src/index.ts` export additions (for main)

Already exported via existing barrels (no new file required):

- `./market-intelligence` (already in index) — new symbols ride the existing `export *`
- `./ai-delivery-revenue-chain` (already in index) — new RH operating symbols ride `export *`
- `./pod-toolkit` (already in index) — new draft-bundle symbols ride `export *`

Optional explicit re-export of proof (not required for consumers):

```ts
// optional — only if main wants proof importable from package root
export { futureModuleContractProofs, assertFutureModuleContractProofs } from "./future-module-contracts.proof";
```

**Subagent did not edit `index.ts`.** Existing `export *` lines already surface new public types.

## G222 — Docs closeout

This document plus careful updates to:

- Revenue Hub RH0 operating model (G219 section)
- Puriva MI v1 gate runbook (G217–G218 notes)
- MI admin foundation (contract alignment)

No live readiness claim. No VPS/deploy/production claim.

---

## G369–G388 hardening (contracts only)

| Gate | Outcome |
|------|---------|
| G369–G372 MI | Default no-live source policy + `uncontrolledScrapingAllowed: false`; builders + policy violation helpers; client-safe summary still admin-reviewed |
| G373–G376 Revenue Hub | Default recommendation guard + no-live CRM policy; `financialGuarantee: false` on recommendations; CRM live sync forbidden |
| G377–G380 POD | Draft-bundle / prompt-image builders; IP caution + marketplace policy violation helpers; live image gen + marketplace sync forbidden |
| G381–G382 Export / proof | Proof fixture refreshed; imports concrete modules (not `index.ts`); version-stable asserts |
| G383–G388 Docs / validation | This closeout + RH0 / POD0 / Puriva MI runbook notes; shared check + focused tests; lane report |

Helpers added (shared):

- `MARKET_INTELLIGENCE_DEFAULT_NO_LIVE_SOURCE_POLICY`, `findMarketIntelligenceSourcePolicyViolations`, `buildMarketIntelligenceLocalResult`, `buildMarketIntelligenceAdminReviewedSourceSummary`
- `REVENUE_HUB_DEFAULT_RECOMMENDATION_GUARD`, `REVENUE_HUB_DEFAULT_NO_LIVE_CRM_POLICY`, `buildRevenueHubAiRecommendation`, `findRevenueHubRecommendationGuardViolations`
- `buildPodToolkitDraftBundle`, `buildPodToolkitPromptImageRequirement`, `findPodToolkitMarketplacePolicyViolations`, `findPodToolkitComplianceIpCautionViolations`

No live IO. No schema/API activation.

---

## Confirmations

- No commit / push / deploy
- No live scraping / CRM / marketplace
- No secrets touched
- `.cursor/settings.json` untouched
- `packages/shared/src/index.ts` not edited
- Forbidden paths (storage, notifications, ga-gsc, monthly-report*, wordpress*, image*, client-portal*, client-operating-packs*) not edited
