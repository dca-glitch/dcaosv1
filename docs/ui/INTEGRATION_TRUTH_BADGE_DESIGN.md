# Integration Truth Badge — UI Design (G663)

**Status:** Design only (Lane 17 / G661–G672). No badge component implementation required.  
**Source of truth for rows:** [`docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md)  
**Prior kebab design:** historical kebab-case duplicate removed during documentation refresh
**Label helper:** `apps/web/src/lib/proof-state-labels.ts` → `formatIntegrationTruthChip`

## Purpose

A **row-level chip set** that mirrors the truth matrix columns operators care about: Local / Staging / Production — without inventing new proof claims in the UI.

## Chip set per integration

| Chip | Allowed values | Default today (most rows) |
|------|----------------|---------------------------|
| Local | `PASS local`, `PASS disabled-safe`, `N/A`, `Not proven` | As matrix |
| Staging | `Not proven` \| `PASS (recorded)` | **Not proven** |
| Production | `Not proven` \| `PASS (recorded)` | **Not proven** |

Optional fourth chip: **ProofState** from [`PROOF_STATE_BADGE_LABELS.md`](./PROOF_STATE_BADGE_LABELS.md).

## Typed chip keys (helper)

| Key | Label |
|-----|-------|
| `not_proven` | Not proven |
| `pass_local` | PASS local |
| `pass_disabled_safe` | PASS disabled-safe |
| `pass_recorded` | PASS (recorded) |
| `na` | N/A |

## Mapping rules

1. UI must **read** recorded STATUS / matrix language — never upgrade “Not proven” to success because local PASS exists.
2. OpenRouter local controlled live ≠ staging/production proven.
3. Manual monthly metrics PASS ≠ live GA/GSC.
4. WordPress draft-prep PASS ≠ live publish.
5. Local foundations from G89–G468 / G469–G708 no-live work do **not** flip Staging/Production chips.

## Visual rules

- Three compact chips in one dense meta row.
- Staging/Production “Not proven” uses **neutral/warning**, never success green.
- Local PASS uses **local** tone (cyan/muted), not production success.
- Link “Open matrix” → docs path for operators (hash or external docs link as product allows).

## Placement (future)

| Surface | Role |
|---------|------|
| AdminOperationsPanel | Compact readiness summary |
| Future Integrations admin page | Full matrix table (out of scope) |
| Launch-blocker board | Show which proof column is missing |

## Copy ban list

Do not render:

- “Fully connected”
- “Production ready”
- “Live ready”
- “Live synced”
- “Staging proven” unless STATUS/matrix records it

Use `looksLikeLiveOverclaim()` in review/tests when adding copy.

## Non-goals

- No live provider probes from the badge  
- No secrets/env values in tooltips (names only if needed)  
- No App.tsx route for a new Integrations page in this lane  
