# Launch Blocker Board — UI Design (G665)

**Status:** Design only (Lane 17 / G661–G672). No board implementation in this lane.  
**Canonical blockers:** [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md) · [`docs/runbooks/PURIVA_LAUNCH_GATE.md`](../runbooks/PURIVA_LAUNCH_GATE.md) · [`INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md)  
**Prior kebab design:** [`launch-blocker-board-ui-design.md`](./launch-blocker-board-ui-design.md)  
**Post-G468 roadmap:** [`docs/operator/G468_NEXT_50_GATES.md`](../operator/G468_NEXT_50_GATES.md) (G469+; main owns G708 roadmap)

## Purpose

Give owners/admins a **single dense board** of Puriva / production launch blockers with proof-state and next gate — without implying any blocker is cleared by local-only work.

## Layout (data-dense)

1. `PageHeader` — title “Launch blockers”, description: local foundations do not clear launch.  
2. Filter chips: `All` / `Storage` / `AI` / `Notifications` / `Analytics` / `WordPress` / `Security`.  
3. Dense table or record list (not hero cards):

| Column | Content |
|--------|---------|
| Blocker | Short name |
| Domain | R2, OpenRouter, Email, GA/GSC, WP, Image, Security, … |
| Proof state | Proof-state badge |
| Local | Truth chip |
| Staging | Truth chip |
| Production | Truth chip |
| Next gate | From owner-selected roadmap (e.g. G469+ shortlist) |
| Owner | Required yes/no |
| Open | Ghost link to runbook |

4. Footer muted copy: “This board does not authorize live proof, commit, push, or deploy.”

## Seed rows (illustrative — keep aligned with matrix)

| Blocker | Suggested ProofState | Next gate theme |
|---------|----------------------|-----------------|
| R2 real-bucket proof | `owner_gated` / `disabled_safe` | Default G469 candidate |
| Notification persistence + email | `local_only` / `owner_gated` | Inbox MVP then live-send |
| Target-env AI re-proof | `local_only` | Bounded staging AI |
| GA/GSC OAuth + live sync | `config_shape_ok` | Token storage then live |
| WordPress live draft | `local_only` (draft-prep) | Gap decisions then staging |
| Image generation provider | `not_started` / scaffold | Policy + wiring |
| Production G49/G50 | `blocked` until owner | Separate track |

## Interaction rules

- **Open** navigates to existing runbook/doc or admin surface — no live call.  
- No “Mark proven” button without an owner-approved evidence workflow (out of scope).  
- Client Portal must never embed this board.

## Implementation constraints (when approved)

- Frontend-only first version may hard-code rows from docs (read-only).  
- Do not invent API/schema for blockers in the first UI block.  
- Prefer `#/admin-daily-cockpit` adjacent panel or a future `#/launch-blockers` only if App.tsx routing change is **explicitly** approved (this lane must not change App.tsx).

## Related designs

- [`PROOF_STATE_BADGE_LABELS.md`](./PROOF_STATE_BADGE_LABELS.md)  
- [`INTEGRATION_TRUTH_BADGE_DESIGN.md`](./INTEGRATION_TRUTH_BADGE_DESIGN.md)  
