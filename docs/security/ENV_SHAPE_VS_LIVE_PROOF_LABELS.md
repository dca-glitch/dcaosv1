# Env-Shape vs Live Proof Labels (G415)

**Status:** Labeling standard for G409–G428. Prevents overclaiming config readiness as live proof.

---

## 1. Label definitions

| Label | Meaning | May claim |
|---|---|---|
| **Env-shape / config-shape** | Required env **names** present or validated; no external call | Readiness helper PASS |
| **Disabled-safe** | Integration coded but default-off; smoke proves refuse/no-send/no-IO | Local safety PASS |
| **Local unit / integration** | Focused tests against helpers or local DB | Local foundation |
| **Local smoke** | Root `smoke:*:local` / browser against local API/web | Local operator proof |
| **Local controlled live** | Owner-approved bounded live call from local (e.g. G77b OpenRouter) | Local live only — not staging/prod |
| **Staging proof** | Evidence against staging host/artifact | Only with recorded evidence + approval |
| **Production proof** | Evidence against production | Only with recorded evidence + approval |
| **Puriva Launch** | All launch blockers closed | Separate gate; currently **BLOCKED** |

---

## 2. Integration examples (do not rewrite)

| Integration | Honest local label | Staging/prod |
|---|---|---|
| OpenRouter | Local controlled live (G77b) + deterministic default | Not proven |
| R2 | Disabled-safe / no-IO readiness | Not proven |
| Email / Resend | No-send / outbox foundation | Not proven |
| GA/GSC | Config-shape helpers only (no OAuth token store) | Not proven |
| WordPress draft | Local draft-prep; live draft plan-only | Not proven |
| WordPress publish | Disabled-safe freeze | Not proven |
| Image provider | Compliance / disabled-safe scaffolding | Not proven |

Source of truth for columns: [`INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md) (main-owned; propose patches only).

---

## 3. Forbidden promotions

| Do not say | When |
|---|---|
| "Staging proven" | Only local smoke passed |
| "Production ready" | Production readiness remains **NO** |
| "Launch ready" | Puriva Launch remains **BLOCKED** |
| "Live GA/GSC working" | Only env presence / config-shape |
| "R2 proven" | Only disabled-safe or unit tests |

---

## 4. Operator checklist before writing status

1. Which label applies? (section 1)
2. Was a live network call made? If no → cannot use staging/prod/live labels.
3. Was owner approval recorded before the session? If no → live proof invalid.
4. Are secrets scrubbed from evidence? If no → do not share.

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**
