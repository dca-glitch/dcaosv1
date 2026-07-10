# Proof-State Badge Labels (G664)

**Status:** Labels + helper contract (Lane 17 / G661–G672). Badge UI remains design-only.  
**Vocabulary:** [`docs/ux/proof-state-vocabulary.md`](../ux/proof-state-vocabulary.md)  
**Prior design:** [`admin-proof-state-badge-design.md`](./admin-proof-state-badge-design.md)  
**Implementation (labels only):** `apps/web/src/lib/proof-state-labels.ts`

## Purpose

Give admins a **compact chip** that answers: “What evidence maturity does this integration or path have?” without implying staging/production readiness.

## States → label → tone

| ProofState | Label | Tone | When to use |
|------------|-------|------|-------------|
| `not_started` | Not started | neutral | No recorded proof |
| `local_only` | Local only | local | Local smoke/unit evidence only |
| `disabled_safe` | Disabled-safe | local | Fail-closed / no live call path proven |
| `config_shape_ok` | Config shape OK | local | Env presence / shape only |
| `owner_gated` | Owner-gated | warning | Next step needs explicit approval |
| `staging_proven` | Staging proven | success | Recorded staging proof exists |
| `production_proven` | Production proven | success | Recorded production proof exists |
| `blocked` | Blocked | danger | Explicit blocker |

## Helper API (stable)

| Function | Role |
|----------|------|
| `formatProofStateLabel(state)` | Human label for chips |
| `proofStateTone(state)` | Visual tone key |
| `safeAdminIntegrationHint(state)` | Muted helper copy |
| `looksLikeLiveOverclaim(copy)` | Copy-safety scan |
| `formatIntegrationTruthChip(key)` | Local/Staging/Production chip labels |
| `isProofState(value)` | Type guard for unknown strings |

## Visual rules (Dark Nebula / data-dense)

- Same size as existing `StatusBadge` / entity pills — not MetricCards.
- No glow, no “connected” green for `local_only` / `config_shape_ok`.
- Tooltip or muted helper must use `safeAdminIntegrationHint(state)`.
- Never show unqualified “Live” or “Live ready” as a proof-state label.

## Placement (future)

| Surface | Placement | Notes |
|---------|-----------|-------|
| `AdminOperationsPanel` | Beside each readiness category | Prefer over free-text “live” |
| AI Operations run detail | Optional secondary chip | Run `liveProviderCalled` stays factual metadata |
| Launch-blocker board | Per blocker row | See [`LAUNCH_BLOCKER_BOARD_DESIGN.md`](./LAUNCH_BLOCKER_BOARD_DESIGN.md) |
| Client Portal | **Never** | Client surfaces must not show proof-state vocabulary |

## Non-goals

- Not a live health ping  
- Not a substitute for [`INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md)  
- Not authorization to run live proofs  

## Implementation sketch (future UX-P13)

```tsx
// Pseudocode only — do not implement unless separately approved
<span>{formatProofStateLabel(state)}</span>
<span className="muted-text">{safeAdminIntegrationHint(state)}</span>
```

Prefer composing existing status pills over a new design-system primitive. Do not edit `apps/web/src/design-system/`.
