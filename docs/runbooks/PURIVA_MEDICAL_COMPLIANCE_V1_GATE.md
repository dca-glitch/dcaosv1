# Puriva Medical Compliance Guardrails v1

**Status:** Deterministic compliance scanning for Puriva medical/aesthetic content.

**Scope:** Flag risky claims before client delivery. No content generation, provider calls, crawling, or live medical advice.

Related:

- `apps/api/src/core/puriva-medical-compliance.json`
- `apps/api/src/core/puriva-medical-compliance.ts`
- `apps/api/src/core/puriva-service-taxonomy.json`
- `docs/runbooks/PURIVA_LOCAL_CLIENT_SETUP_FOUNDATION_GATE.md`

---

## Helpers

| Function | Purpose |
|---|---|
| `scanPurivaMedicalClaims({ text, categoryId? })` | Pattern scan → rule matches |
| `assessPurivaMedicalCompliance({ text, categoryId?, taxonomy? })` | Full assessment with taxonomy baseline flags |
| `buildPurivaComplianceGuidance(flags)` | Safe reviewer guidance snippets |
| `summarizePurivaComplianceAssessment(assessment)` | Compact operator summary |

---

## Flags

- `medical_claim_risk`
- `prescription_medication_risk`
- `before_after_result_claim_risk`
- `licensed_provider_required`
- `guaranteed_outcome_claim`
- `cure_claim`
- `universal_suitability_claim`
- `permanent_result_claim`
- `unsafe_weight_loss_claim`
- `hospital_partner_claim_requires_verification`
- `medical_review_required`

Severity: `low` · `medium` · `high` · `critical`

Action: `allow` · `revise` · `require_medical_review` · `block`

---

## Run tests

```powershell
cd C:\dcaosv1
npm.cmd run -w @dca-os-v1/api test:unit -- --test-name-pattern puriva-medical-compliance
```

---

## Operator notes

- Hospital/partner/license claims are flagged for **verification**, not automatically blocked.
- Compliance notes in taxonomy may reference forbidden phrases as prohibitions; the scanner targets promotional content only.
- Future MI/SEO/content/image/report blocks should call `assessPurivaMedicalCompliance` before any draft-ready handoff or client-visible output.

---

## G324 — Image-lane medical/aesthetic alignment (2026-07-10)

Text claim scanning (`assessPurivaMedicalCompliance`) and image visual-concept screening (`evaluateImageCompliancePolicy`) are complementary:

| Layer | Module | Blocks |
|-------|--------|--------|
| Copy / claims | `puriva-medical-compliance.ts` | Cure, guaranteed outcome, before/after transformation claims, Wegovy suitability, etc. |
| Image concepts / prompts / alt | `image-compliance-policy.ts`, `image-alt-text-policy.ts` | Before/after visuals, fake clinician/patient, procedure staging, treatment-result imagery, likeness, unsafe device/prescription staging |

Both layers remain **no-live**: no provider calls, no generation, no medical advice. Image WordPress inclusion still requires `final_accepted` plus reviewed alt text (see [`IMAGE_GENERATION_PROOF.md`](./IMAGE_GENERATION_PROOF.md) §10).
