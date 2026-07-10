# Local-Only Proof Taxonomy (G654)

**Status:** Taxonomy for classifying local proofs. G654 refresh for G469–G708 ultra-block; PRE-STAGING Lanes 14–15 reaffirm (2026-07-10). Complements [`NO_LIVE_PROOF_CATALOGUE.md`](./NO_LIVE_PROOF_CATALOGUE.md) and [`ENV_SHAPE_VS_LIVE_PROOF_LABELS.md`](../security/ENV_SHAPE_VS_LIVE_PROOF_LABELS.md).

**Hard truths:** local foundations expanding; live proofs deferred; Puriva Launch **BLOCKED** (L8 unreachable); production readiness **NO**; staging/prod live proofs **NOT proven** from L0–L5 alone. `configured_shape_ok` is L1/L3 evidence at most — never L6–L8.

---

## 1. Taxonomy levels (lowest → highest blast radius)

| Level | Name | Examples | Authorizes |
|---|---|---|---|
| L0 | Docs / inventory | Security checklists, this taxonomy, operator closeouts | Nothing runtime |
| L1 | Pure unit (no DB/network) | Redaction helpers, policy constants, R2 no-IO invariants, GA/GSC mapping helpers | Local helper correctness |
| L2 | Unit/integration with local DB | API integration tests, SEC-H1 optional admin path | Local API contracts |
| L3 | Local smoke (disabled-safe) | R2/email/WP disabled-safe smokes | Local safety defaults |
| L4 | Local smoke (operator workflow) | AI Delivery reviews, portal browser | Local operator readiness |
| L5 | Local controlled live | G77b OpenRouter bounded call | Local live only |
| L6 | Staging proof | Remote staging smokes / live on staging | Staging evidence only |
| L7 | Production proof | Production probes / deploy | Production evidence only |
| L8 | Puriva Launch | All launch blockers closed | Client-service launch |

**Rule:** A lower level never upgrades a higher level without new evidence and owner approval.

**G469+ note:** R2 proof-plan / contracts / no-IO invariants, GA/GSC OAuth **design** helpers, and similar WIP are **L0–L1** at most. They do not authorize L5–L8.

---

## 2. Mapping common commands

| Command family | Typical level |
|---|---|
| `git diff --check` | L0 |
| Focused `*.test.ts` redaction/boundary | L1 |
| `npm.cmd run test:unit` / integration | L1–L2 |
| `npm.cmd run validate` | Build/type — not a smoke level |
| `smoke:*:local` disabled-safe | L3 |
| `smoke:*:browser` local | L4 |
| Owner-approved local OpenRouter | L5 |
| `smoke:mvp:staging` / remote baseline | L6 |
| G49/G50 production path | L7 |
| Puriva Launch Gate PASS | L8 (currently unreachable — BLOCKED) |

---

## 3. Reporting language

| If level is… | Say… |
|---|---|
| L0–L4 | "Local foundation / local proof" |
| L5 | "Local controlled live proof" |
| L6 | "Staging proof (recorded)" |
| L7 | "Production proof (recorded)" — still may leave readiness NO |
| L8 | Only when launch gate says PASS |

Never say "production ready" from L0–L6 alone. Production readiness remains **NO** until a production gate says otherwise. Never say "Puriva Launch ready" from L0–L7 alone.

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**
