# Admin Proof-State Badge — UI Design (docs only)

**Status:** Design only. No badge component implementation required in G429–G448.  
**Vocabulary:** [`docs/ux/proof-state-vocabulary.md`](../ux/proof-state-vocabulary.md)  
**Helper (labels only):** `apps/web/src/lib/proof-state-labels.ts`

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

## Visual rules (Botanical Light / current product density)

- Same size as existing `StatusBadge` / entity pills — not MetricCards.
- No glow, no “connected” green for `local_only` / `config_shape_ok`.
- Tooltip or muted helper must use `safeAdminIntegrationHint(state)`.
- Never show unqualified “Live” as a proof-state label.

## Placement (future)

| Surface | Placement | Notes |
|---------|-----------|-------|
| `AdminOperationsPanel` | Beside each readiness category | Prefer over free-text “live” |
| AI Operations run detail | Optional secondary chip | Run `liveProviderCalled` stays factual metadata, separate from proof-state |
| Launch-blocker board | Per blocker row | See launch-blocker board design |
| Client Portal | **Never** | Client surfaces must not show proof-state vocabulary |

## Non-goals

- Not a live health ping  
- Not a substitute for [`INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md)  
- Not authorization to run live proofs  

## Implementation sketch (future UX-P13)

```tsx
// Pseudocode only — do not implement in this gate unless separately approved
<StatusBadge status={formatProofStateLabel(state)} />
<span className="muted-text">{safeAdminIntegrationHint(state)}</span>
```

Prefer composing existing `StatusBadge` over a new design-system primitive.
