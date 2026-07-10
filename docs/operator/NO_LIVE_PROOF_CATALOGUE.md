# No-Live Proof Catalogue (G655)

**Status:** Catalogue of proofs that are intentionally **local / disabled-safe / config-shape** and must not be described as staging, production, or Puriva Launch proof. G655 refresh for G469–G708 ultra-block on baseline `66dcb74`. No live execution in this lane.

Related: [`LOCAL_ONLY_PROOF_TAXONOMY.md`](./LOCAL_ONLY_PROOF_TAXONOMY.md), [`ENV_SHAPE_VS_LIVE_PROOF_LABELS.md`](../security/ENV_SHAPE_VS_LIVE_PROOF_LABELS.md), [`TEST_SMOKE_INVENTORY.md`](./TEST_SMOKE_INVENTORY.md).

**Hard truths:** local foundations expanding; live proofs deferred; Puriva Launch **BLOCKED**; production frozen.

---

## 1. Broad local orchestrators (no remote mutation)

| Script | Catalogue label |
|---|---|
| `smoke:staging-readiness:local` | Local Block A — not staging deploy proof |
| `smoke:production-readiness:local` | Local closeout — not production readiness YES |
| `smoke:pre-staging:local` | Full local closeout — not G4 authorization |
| `smoke:puriva-readiness:local` | Puriva local readiness — Launch still BLOCKED |
| `smoke:external-integrations-readiness:local` | Config-shape only |

---

## 2. Disabled-safe / no-IO integration smokes

| Script | Catalogue label |
|---|---|
| `smoke:r2-byte-roundtrip:local` | Disabled-safe / optional configured; not real-bucket launch proof |
| `smoke:r2-storage-boundary:local` | Boundary local |
| `smoke:email-outbox:local` | No-send / outbox |
| `smoke:wordpress-publish:local` | Publish freeze / disabled-safe |
| `smoke:openrouter-guarded:local` | Guarded / deterministic path |
| `smoke:openrouter-api-env-preflight:local` | Env preflight — no live |
| `smoke:ai-provider-config:local` | Config shape |
| `smoke:credential-encryption:local` | Local crypto roundtrip |
| `smoke:credential-master-key-probe:local` | Presence probe — never print key |
| `smoke:legacy-wordpress-sunset:local` | Sunset local |

---

## 3. Client / portal local boundary proofs

| Script | Catalogue label |
|---|---|
| `smoke:client-portal:local` | Local archive API |
| `smoke:puriva-client-portal-boundary:local` | Local Puriva portal boundary |
| `smoke:client-role-api-boundary:local` | Client-role API |
| `smoke:client-safe-ai-visibility:local` | Client-safe AI visibility |
| `smoke:client-portal-monthly-report:browser` | FINAL-only local browser |
| Browser portal suite (`smoke:client-portal*:browser`) | Local UI — not staging portal proof |

---

## 4. Focused unit / integration (examples)

| Surface | Catalogue label |
|---|---|
| `sec-h1-storage-key-leak.integration.test.ts` | Local SEC-H1 regression |
| `storage-key-boundary` / serializer boundary tests | Local no-IO |
| `storage-error-redaction.test.ts` | Local string redaction |
| `r2-no-io-readiness-invariant.ts` / `r2-proof-contracts.ts` / `r2-target-environment-proof-plan.ts` | Local plan/contracts — not bucket proof |
| `private-delivery-download-boundary.ts` / `export-url-storage-key-matrix.ts` | Local boundary helpers |
| `ga-gsc-oauth-token-storage.design.ts` (+ mapping/period helpers) | Design/local mapping — not OAuth/live sync |
| `wordpress-credentials-redaction.test.ts` | Local credential shape |
| `client-portal-error-safety.test.ts` | Local error safety |
| `smoke-staging-security-baseline.guard.test.mjs` | Guard unit — not remote PASS |

---

## 5. Explicitly excluded from this catalogue (live / remote)

These require separate owner approval and are **not** no-live proofs:

- `smoke:mvp:staging`
- `smoke:staging-security-baseline` (when remote target set)
- `smoke:google-drive-export-live:local` when live probe enabled
- Any OpenRouter/R2/email/GA/GSC/WordPress/image live session
- G50 production deploy
- G469+ R2 target-bucket live IO (even if plan helpers exist)

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**
