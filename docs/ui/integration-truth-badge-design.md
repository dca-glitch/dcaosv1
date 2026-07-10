# Integration Truth Badge — UI Design (docs only)

**Status:** Design only (G429–G448).  
**Source of truth for rows:** [`docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md)

## Purpose

A **row-level chip set** that mirrors the truth matrix columns operators care about: Local / Staging / Production — without inventing new proof claims in the UI.

## Chip set per integration

| Chip | Allowed values | Default today (most rows) |
|------|----------------|---------------------------|
| Local | `PASS local`, `PASS disabled-safe`, `N/A`, `Not proven` | As matrix |
| Staging | `Not proven` \| `PASS (recorded)` | **Not proven** |
| Production | `Not proven` \| `PASS (recorded)` | **Not proven** |

Optional fourth chip: **ProofState** from [`admin-proof-state-badge-design.md`](./admin-proof-state-badge-design.md).

## Mapping rules

1. UI must **read** recorded STATUS / matrix language — never upgrade “Not proven” to success because local PASS exists.
2. OpenRouter local controlled live ≠ staging/production proven.
3. Manual monthly metrics PASS ≠ live GA/GSC.
4. WordPress draft-prep PASS ≠ live publish.

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
- “Live synced”
- “Staging proven” unless STATUS/matrix records it

Use `looksLikeLiveOverclaim()` in review/tests when adding copy.

## Non-goals

- No live provider probes from the badge  
- No secrets/env values in tooltips (names only if needed)  
