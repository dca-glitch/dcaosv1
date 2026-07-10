# Safe Copy Sweep — Live Overclaim (G669)

**Status:** Scan complete 2026-07-10 (Lane 17). Owned-file fixes only; other files → patch proposals below.  
**Helper:** `apps/web/src/lib/proof-state-labels.ts` → `looksLikeLiveOverclaim`

## Scan method

Searched `apps/web/src` (tsx/ts) for:

- `production ready`
- `fully connected`
- `live synced`
- `live ready`
- `launch ready`
- `OpenRouter connected`
- `GA synced`
- `live integration`

Also checked admin/portal page trees for unqualified readiness claims.

## Findings in Lane 17–owned / helper code

| Location | Result |
|----------|--------|
| `proof-state-labels.ts` | Patterns intentionally detect overclaims; labels themselves are safe |
| `proof-state-labels.test.ts` | Uses overclaim strings as **negative fixtures** only |
| `apps/web/src/pages/**` | **No matches** for the ban-list phrases above |

## Owned-file actions this lane

- Expanded overclaim patterns to include `live ready` / `launch ready` (helper + tests).
- No page copy edits required under Lane 17 ownership (no clear overclaims found in owned helpers).

## Deferred patch proposals (other owners — do not apply in Lane 17)

| ID | File / area | Proposal | Owner |
|----|-------------|----------|-------|
| COPY-1 | `AdminOperationsPanel.tsx` | When adding readiness chips, use `formatProofStateLabel` / truth chips; never “live ready” | Future admin polish |
| COPY-2 | `AiOrchestratorLitePanel.tsx` | Keep “pre-live / dry-run” wording; reject any “connected” CTA | Future admin polish |
| COPY-3 | `AiDeliveryPage.tsx` | On Phase C modal extracts, re-scan modal copy with `looksLikeLiveOverclaim` | Hotspot Phase C owner |
| COPY-4 | Client portal pages | Keep client wording; never import proof-state chips | Portal / Lane 9 |
| COPY-5 | Main-owned docs (`STATUS`, truth matrix, Puriva launch) | Stale-claim sweep is Lane 18 / main | Lane 18 / main |

## Explicit non-claims

This sweep does **not** prove staging/production readiness. It only confirms no ban-list phrases in the scanned web source paths at scan time.
