# GA/GSC Lane 5 Closeout — G517–G528

> **Superseded (2026-07-13):** Live GA4/GSC scope **WITHDRAWN** — not deferred for automatic resumption.

**Date:** 2026-07-10  
**Base:** `main` @ `66dcb74`  
**Agent:** Lane 5 subagent  
**Commit/push/deploy:** none  
**Live Google:** none  

OAuth design detail: [`GA_GSC_OAUTH_DESIGN_G517_G528.md`](./GA_GSC_OAUTH_DESIGN_G517_G528.md)  
CSV/manual path: [`MONTHLY_REPORT_CSV_IMPORT_PROOF_PLAN.md`](./MONTHLY_REPORT_CSV_IMPORT_PROOF_PLAN.md)  
Live proof ceiling (unchanged): [`MONTHLY_REPORT_LIVE_DATA_PROOF.md`](./MONTHLY_REPORT_LIVE_DATA_PROOF.md) §3.1a  

---

## Per-task status

| Gate | Status | Notes |
|------|--------|-------|
| **G517** | DONE | `buildGaGscConfigRedactionSnapshot` + leak probe; unit coverage in `ga-gsc.config.test.ts` |
| **G518** | DONE | Design-only `ga-gsc-oauth-token-storage.design.ts` — no schema |
| **G519** | DONE | `ga-gsc-property-mapping.ts` — `properties/{digits}` contract |
| **G520** | DONE | `ga-gsc-site-url-mapping.ts` — sc-domain / https prefix + domain match |
| **G521** | DONE | Calendar bounds + 30/31-day edges in `ga-gsc-period-policy.ts` |
| **G522** | DONE | `classifyGaGscPeriodHandling` future/current/partial/closed |
| **G523** | DONE | Label catalog + serializer assertions in `metrics-source-truth.ts` |
| **G524** | DONE | `assessGaGscMetricsUnavailableState` in metrics-source-truth (Lane 6 files untouched) |
| **G525** | DONE | CSV/manual proof plan refreshed for G517–G528 helpers |
| **G526** | DONE | Analytics docs closeout in this file + OAuth design doc (LIVE_DATA_PROOF not edited — conflict avoidance) |
| **G527** | DONE | Deferred register **proposals** below only — `deferred-scope-register.md` not edited |
| **G528** | DONE | Focused `node --import tsx --test` on Lane 5 suites (no full validate) |

---

## Files changed / added

### Owned / extended

- `apps/api/src/config/ga-gsc.config.ts`
- `apps/api/src/config/ga-gsc.config.test.ts`
- `apps/api/src/core/ga-gsc-period-policy.ts`
- `apps/api/src/core/ga-gsc-period-policy.test.ts`
- `apps/api/src/core/metrics-source-truth.ts`
- `apps/api/src/core/metrics-source-truth.test.ts`

### New helpers + tests

- `apps/api/src/core/ga-gsc-oauth-token-storage.design.ts`
- `apps/api/src/core/ga-gsc-oauth-token-storage.design.test.ts`
- `apps/api/src/core/ga-gsc-property-mapping.ts`
- `apps/api/src/core/ga-gsc-property-mapping.test.ts`
- `apps/api/src/core/ga-gsc-site-url-mapping.ts`
- `apps/api/src/core/ga-gsc-site-url-mapping.test.ts`

### Docs

- `docs/runbooks/GA_GSC_OAUTH_DESIGN_G517_G528.md` (new)
- `docs/runbooks/GA_GSC_G517_G528_CLOSEOUT.md` (this file)
- `docs/runbooks/MONTHLY_REPORT_CSV_IMPORT_PROOF_PLAN.md` (G525 refresh)

### Explicitly not touched

- `monthly-report-metrics-*`, `monthly-report-policy*` (Lane 6)
- `docs/operator/deferred-scope-register.md` (proposal only here)
- `.cursor/settings.json`, main-owned STATUS / matrix docs
- Prisma schema / migrations / live OAuth routes

---

## Focused validation (G528)

```powershell
cd C:\dcaosv1\apps\api
node --import tsx --test src/config/ga-gsc.config.test.ts src/core/ga-gsc-period-policy.test.ts src/core/metrics-source-truth.test.ts src/core/ga-gsc-oauth-token-storage.design.test.ts src/core/ga-gsc-property-mapping.test.ts src/core/ga-gsc-site-url-mapping.test.ts
```

Full `npm run validate` **not** run (per lane instructions).

**Result (2026-07-10):** 30/30 pass, 0 fail (6 suites).

---

## G527 — Deferred register proposals (do not apply without owner)

Propose adding / affirming under Puriva Launch blockers / still-deferred (owner edits register):

1. **GA/GSC OAuth consent + callback routes** — not started; blocked until token storage design approved for implementation.
2. **GA/GSC encrypted token Prisma model** — schema/migration requires explicit owner approval; design contract exists (`schemaImplemented: false`).
3. **GA/GSC token refresh / revoke fail-closed** — deferred until model + encryption wired.
4. **Live GA/GSC sync proof on target env** — remains Puriva Launch blocker; local config-shape / mapping / period / source-truth helpers do **not** satisfy it.
5. **Google Cloud OAuth consent screen + GA4/GSC scopes** — out-of-band owner setup; never commit secrets.

Suggested one-line for register (owner paste):

> **G517–G528 (2026-07-10):** Lane 5 closed local config redaction, OAuth **design-only** contracts, GA4/GSC mapping validators, period/source-truth helpers. Live OAuth/token storage/sync remain deferred; no schema.

---

## Truth claims

| Claim | Allowed? |
|-------|----------|
| Config-shape / redaction unit-proven | Yes |
| OAuth token storage designed (no schema) | Yes |
| GA4 / GSC mapping contracts unit-proven | Yes |
| Period future/current/partial policy unit-proven | Yes |
| Metrics source-truth / GA-GSC unavailable helpers unit-proven | Yes |
| Live OAuth / Google API / encrypted token row | **No** |
| Puriva Launch unblocked | **No** |

---

## Mistakes

None recorded during this lane.
