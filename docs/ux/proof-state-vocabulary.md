# Proof-State Vocabulary (G429–G448)

**Status:** Canonical labels for admin UI/docs.  
**Code helper:** `apps/web/src/lib/proof-state-labels.ts`  
**Tests:** `apps/web/src/lib/proof-state-labels.test.ts`

## Rule

Proof-state describes **evidence maturity**, not product health and not authorization to call live providers.

## Vocabulary

| Token | Admin label | Meaning |
|-------|-------------|---------|
| `not_started` | Not started | No proof recorded |
| `local_only` | Local only | Local/admin evidence only |
| `disabled_safe` | Disabled-safe | Fail-closed / no live call path verified |
| `config_shape_ok` | Config shape OK | Env/config shape validated only |
| `owner_gated` | Owner-gated | Explicit owner approval required next |
| `staging_proven` | Staging proven | Staging proof recorded in STATUS/matrix |
| `production_proven` | Production proven | Production proof recorded |
| `blocked` | Blocked | Explicit blocker; do not claim readiness |

## Allowed adjacent phrases

- deferred  
- local/admin practice path  
- no live calls  
- opt-in only  
- not proven  

## Banned unqualified phrases (admin)

- live synced  
- production ready  
- fully connected  
- staging proven (unless recorded)  
- live GA/GSC (unless followed by deferred/not/pending/disabled)

Use `looksLikeLiveOverclaim(copy)` when reviewing new strings.

## Client surfaces

Do **not** expose this vocabulary to clients. Use [`client-wording-guide.md`](../operator/client-wording-guide.md).

## Related designs

- [`admin-proof-state-badge-design.md`](../ui/admin-proof-state-badge-design.md)  
- [`INTEGRATION_TRUTH_BADGE_DESIGN.md`](../ui/INTEGRATION_TRUTH_BADGE_DESIGN.md)
