# Image Generation — Product Flow, Gaps, and Proof Plan (Puriva)

**Status:** Spec + proof plan. **No live provider implementation in this block.**

**Related:** [`../architecture/AI_MODEL_POLICY.md`](../architecture/AI_MODEL_POLICY.md) **(image provider/model policy — §2; final provider selection pending owner approval)** · [`PURIVA_LAUNCH_GATE.md`](./PURIVA_LAUNCH_GATE.md) · [`STORAGE_R2_PROOF.md`](./STORAGE_R2_PROOF.md) · [`INTEGRATIONS_TRUTH_MATRIX.md`](./INTEGRATIONS_TRUTH_MATRIX.md) · [`PURIVA_IMAGE_PACKAGE_V1_GATE.md`](./PURIVA_IMAGE_PACKAGE_V1_GATE.md)

---

## 1. Product flow (target state)

### 1.1 Trigger

1. Admin accepts article/content draft (`admin-approve` on content draft).
2. System queues image generation job for that article (3 images: 1 hero + 2 supporting/inline).
3. After final content approval, generate social preview image from hero (or separate social profile).

### 1.2 Generation output

| Slot | Purpose | Aspect ratio (default) |
|------|---------|------------------------|
| Hero | Article header / WordPress featured | 16:9 or client profile |
| Supporting 1 | Inline section A | 4:3 or 1:1 per profile |
| Supporting 2 | Inline section B | 4:3 or 1:1 per profile |
| Social preview | OG/Twitter card | 1.91:1 or 1:1 per profile |

### 1.3 Admin review cycle

1. Admin reviews generated image set in AI Delivery / workflow UI.
2. **Reject** requires reason (stored for learning).
3. System regenerates **replacement set** for rejected slots only.
4. **Approve** advances set to client-review state.

### 1.4 Client approval cycle

1. Client sees preview URLs only (signed, short-lived).
2. Client approves or rejects set; reject requires reason.
3. Admin notified (in-system + email when live).
4. Regeneration uses stored reject reasons + prompt lineage.

### 1.5 WordPress handoff

1. Approved images attach to WordPress **draft** (not publish) — tier 1 local prep only today; live HTTP attach is tier 2 (plan-only).
2. Include alt text, caption/meta, social preview attachment.
3. Provider original URLs never exposed to client if unsafe.

### 1.6 Storage

1. Binary stored privately in R2 (`storageKey` server-side only).
2. Thumbnails/previews generated or provider-resized before storage.
3. Client receives `{ downloadReference: { downloadUrl, expiresSeconds } }` only.

### 1.7 Prompt engineering inputs

- Treatment/topic profile (from client operating pack)
- Brand voice + forbidden elements
- Aspect ratio per slot
- Medical compliance constraints (BPOM, no fake doctors, no misleading before/after)
- No real-person likeness without consent

### 1.8 Compliance guardrails

See [`AI_MODEL_POLICY.md`](../architecture/AI_MODEL_POLICY.md) §2.8 for the canonical, provider-independent statement of these guardrails.

| Rule | Enforcement target |
|------|-------------------|
| BPOM / medical advertising caution | Prompt template + human review gate |
| No fake doctors or patient claims | Prompt negative list + admin reject |
| No real-person likeness without consent | Prompt + manual review |
| No misleading transformation imagery | Reject reason taxonomy + regenerate |

### 1.8.1 Medical-aesthetic image safety policy

For Puriva and similar aesthetic/medical clients, image generation must be treated as regulated-marketing adjacent. The proof path must reject any image concept, prompt, or output that implies clinical proof, treatment outcome, or a real care relationship that has not been documented and approved.

Hard exclusions before any provider proof:

- **No before/after framing** - no split-screen, transformation timeline, "after treatment" visual, measurement comparison, or implied result sequence.
- **No fake doctors, nurses, clinicians, patients, or testimonials** - no fabricated uniforms, badges, clinic authority, quoted patient claim, review-style endorsement, or named medical identity.
- **No treatment-result implication** - no "clearer skin after treatment", body change, guaranteed improvement, pain reduction, recovery claim, weight-loss result, or visible outcome attributed to a service or product.
- **No real-person likeness without documented consent** - no celebrity, public figure, staff member, client, or patient likeness unless consent and usage rights are recorded outside the prompt.
- **No unsafe medical-device or prescription-product staging** - no image should imply unsupervised use, prescription access, injection, dosage, clinical procedure, or device efficacy unless explicitly approved by medical/compliance review.

Allowed visual direction should stay educational, neutral, and context-led: clinic environment details without identifiable clinicians/patients, abstract wellness/skin-care concepts, product-neutral lifestyle context, non-diagnostic diagrams, and brand-safe editorial imagery.

### 1.9 Learning layer

Store per generation attempt:

- `prompt`, `provider`, `model`, `approvalStatus`, `rejectReason`, `replacementLineageId`
- Use reject reasons to improve future prompts (operator review first; automated tuning deferred)

### 1.9.1 Prompt, alt, and lineage storage

Minimum storage boundaries for a future persisted generation attempt:

| Field | Storage audience | Client exposure |
|-------|------------------|-----------------|
| Raw prompt | Admin-only lineage/debug store | Never |
| Negative prompt / compliance constraints | Admin-only lineage/debug store | Never |
| Provider/model/attempt metadata | Admin-only observability | Never |
| Generated alt text draft | Admin + client-facing only after review | Yes, after approval |
| Caption/meta draft | Admin + client-facing only after review | Yes, after approval |
| Reject reason | Admin learning loop; client reason only where submitted by client | Not as provider/debug metadata |
| `storageKey` / provider URL | Server-side only | Never |

Alt text is not a prompt dump. It must describe the approved visual asset for accessibility and editorial use, without medical claims, provider names, model names, internal prompt tokens, or unsupported treatment outcomes.

### 1.9.2 Reject-reason learning loop

Reject reasons should become a controlled prompt-improvement signal, not an automatic model-tuning mechanism.

1. Admin or client reject requires a structured reason plus optional free-text note.
2. System stores the reason against the specific slot and `replacementLineageId`.
3. Operator reviews recurring reasons and maps them to a maintained taxonomy such as `medical_claim_risk`, `before_after_risk`, `fake_clinician_risk`, `likeness_consent_risk`, `brand_mismatch`, `low_quality`, `wrong_slot`, or `alt_text_issue`.
4. Future regeneration uses only approved taxonomy guidance and sanitized notes; raw client text is not blindly pasted into prompts.
5. Automated prompt tuning remains deferred until a separate owner-approved block defines controls, test coverage, and rollback.

### 1.10 Provider candidates (no vendor lock-in)

| Provider | Mode | Notes |
|----------|------|-------|
| OpenAI Images | API | Same gateway pattern as text |
| Ideogram | API | Strong typography |
| Adobe Firefly | API | Enterprise/compliance path |
| Midjourney-like | Manual external | Operator upload fallback |
| Local deterministic | Dev/test | Existing pattern for text |

**Decision:** Not made in this block. Requires AI Model Research + AI Model Policy gates first. See [`AI_MODEL_POLICY.md`](../architecture/AI_MODEL_POLICY.md) §2.1 — Adobe Firefly is the approved *direction* for primary provider; exact provider/fallback pair and cost caps (§2.3) remain pending owner approval before any Phase B wiring below.

### 1.11 Provider/no-live preflight

Before any future block can claim image-provider readiness, it should expose a disabled-safe preflight that proves configuration shape without generating an image.

Required preflight behavior:

- Reports `disabled`, `missing_config`, or `configured_shape_ok`; never reports "verified live" without a live proof session.
- Performs no provider SDK call, no HTTP request, no image generation, and no credential validation against a vendor.
- Redacts key material and returns only presence/shape metadata.
- Confirms provider decision status: `pending_owner_approval`, `approved_for_staging_proof`, or `approved_for_environment`.
- Confirms safety policy status: medical-aesthetic policy loaded, required negative prompt constraints present, reject reason taxonomy present, and client-safe response mapper present.
- Confirms cost guardrails are finite and code-enforced before any live call path can be reachable.

This preflight is a readiness gate only. It does not replace the Phase D live proof checklist and must not be used to claim generated image quality, provider availability, or WordPress/R2 roundtrip success.

---

## 2. Current codebase state (2026-07-09)

| Area | Status |
|------|--------|
| `AiDeliveryArticleImage` model + CRUD | Scaffolded — manual upload / mark-ready paths |
| Workflow-brief image sets | Scaffolded — `prepare-image-sets`, `refresh-image-set` |
| Image generation Phase B disabled-safe foundation | **New** — `image_generation` readiness category (`disabled` / `missing_config` / `configured_shape_ok`), `IMAGE_GENERATION_ENABLED` + provider + API key config shape (`apps/api/src/config/image-generation.config.ts`), hero/supporting_1/supporting_2/social_preview variant request scaffolding, disabled-safe execution (never calls a provider, including when config shape is OK), required-reason reject, and client-safe metadata mapper (`apps/api/src/core/image-generation.execution.ts`). Admin-only read-only `GET /api/v1/image-generation/foundation-config` added for config visibility (no DB read/write). **Local unit + integration tests only** (no live provider call; `configured_shape_ok` ≠ live-proven / not “image ready”); see §7. |
| Live image provider call | **Not implemented** |
| R2 upload for generated bytes | Upload path exists for final assets; no provider→R2 pipeline |
| Client portal image approve/reject | Routes exist on deliverable images |
| WordPress image attach | Draft-prep scaffold; live attach not proven |

---

## 3. Gap analysis

### 3.1 Data models (required)

- `ImageGenerationJob` (or extend `AiDeliveryArticleImage`): `provider`, `model`, `prompt`, `status`, `rejectReason`, `lineageParentId`
- `ImageSet` grouping: hero + supporting + social preview per article
- Prompt profile reference (may remain checklist until structured config)

### 3.2 API endpoints (required)

- `POST .../content-drafts/:id/queue-image-generation`
- `GET .../article-images/:id/generation-status`
- `POST .../article-images/:id/regenerate` (with reason)
- Admin approve/reject set (partially exists)
- Client approve/reject set (portal routes exist)

### 3.3 UI surfaces

- Admin image review panel (partial in workflow-briefs)
- Client portal image approval (partial)
- Reject-reason modal (required)

### 3.4 Notifications

- Admin notified on client reject
- Client notified when set ready for review
- Depends on transactional email live proof

### 3.5 Storage / R2

- See [`STORAGE_R2_PROOF.md`](./STORAGE_R2_PROOF.md) §8 (image-specific checklist) and §0 (six-area coverage map)
- Generated bytes → R2 private key → signed preview URL
- **Current gap:** no hero/supporting/social variant R2 roundtrip proof exists yet because no provider is wired (§2 below); this is expected to stay blocked until Phase B lands — see `STORAGE_R2_PROOF.md` §9 (#3) for the proposed local deterministic variant smoke

### 3.6 WordPress

- Attach media to draft with alt/caption
- Social preview meta field

### 3.7 Smoke tests (required)

- Disabled-safe: no provider key → queue returns `503` / skipped, no orphan `storageKey`
- Local deterministic: mock provider returns fixed bytes → R2 roundtrip (when R2 configured); proposed as `scripts/smoke-r2-image-variant-roundtrip-local.mjs` — see `STORAGE_R2_PROOF.md` §9 (#3), not yet implemented (blocked on Phase B)
- Boundary: client responses contain no `storageKey`, `prompt`, or provider metadata

---

## 4. Proof plan (bounded, owner-approved)

### Phase A — Policy (no code)

1. Complete AI Model Research gate for image providers.
2. Publish AI Model Policy: allowed providers, cost caps, medical compliance rules — see [`AI_MODEL_POLICY.md`](../architecture/AI_MODEL_POLICY.md) §2 (drafted; provider decision still pending owner approval, so this phase is not yet closed).
3. Owner approves one primary + one fallback provider (record in `AI_MODEL_POLICY.md` §2.1 and §4 when decided).

### Phase B — Disabled-safe wiring

1. Add readiness category `image_generation` to integrations readiness. **Done** (2026-07-09) — `apps/api/src/config/image-generation.config.ts` + `external-integrations-readiness.service.ts`.
2. Wire provider behind `IMAGE_GENERATION_ENABLED` + API key pattern. **Done (shape-only)** — `IMAGE_GENERATION_ENABLED` / `IMAGE_GENERATION_PROVIDER` / `IMAGE_GENERATION_API_KEY`; no live client wired, no live call made at any readiness status (see §7).
3. `npm run validate` + unit tests for disabled/missing_config states. **Done** — unit tests (`image-generation.execution.test.ts`, `external-integrations-readiness.service.test.ts`), the `check:external-integrations-readiness` runner, and a new integration test (`tests/integration/image-generation.integration.test.ts`). `npm run -w @dca-os-v1/api check` and `test:integration` both pass locally.

**Still open from Phase B scope:** no `ImageGenerationJob`/variant-set persistence yet (would require a schema change, out of scope for this block); the foundation module is pure logic + a read-only admin config endpoint, not yet wired into `prepare-image-sets` / `AiDeliveryArticleImage` runtime flows.

### Phase C — Local deterministic proof

1. Mock provider returns PNG bytes.
2. Upload to R2 (or disabled-safe 503).
3. Admin preview + client signed URL smoke.

### Phase D — Staging live proof (separate approval)

1. One bounded generation per slot type on staging bucket.
2. Human compliance review of outputs.
3. Evidence log to `$env:TEMP`.

**This document does not authorize Phase D.**

### Phase D checklist — future live provider proof only

A future owner-approved live provider proof must record all of the following before any "image generation proven" claim:

- Named environment, provider, model, credential source, bucket, and operator approval.
- Confirmation that no production, client-facing, or public WordPress surface is affected.
- Preflight result showing provider/config shape only, with no secret material and no live generation.
- One bounded generation each for hero, supporting, and social-preview slot types, with a finite attempt cap and no automatic retry loop.
- Prompt package evidence: raw prompt retained admin-only, negative/compliance constraints present, no real-person likeness request, and no treatment-result implication.
- Output review evidence: no before/after, no fake doctors/patients, no unsupported medical result, no unsafe prescription/device implication, and alt text reviewed separately.
- Storage evidence: provider bytes stored privately, provider original URL not client-exposed, `storageKey` remains server-side, signed preview expires, and metadata stripping behavior is decided.
- Reject/regenerate evidence: at least one safe rejected-slot-only regeneration using a structured reject reason, with lineage preserved.
- Client-safe API evidence: response omits raw prompt, provider/model metadata, internal reject taxonomy, provider URL, and `storageKey`.
- WordPress handoff evidence, if included in that block: draft-only attachment, reviewed alt/caption, no publish, and no live production site.
- Cost evidence: exact attempt count, provider cost estimate/actual where available, timeout behavior, and proof that caps are not env-widenable.
- Evidence storage: proof notes saved outside git (for example `$env:TEMP`) with no credentials, no raw provider secrets, and no client personal data.

---

## 5. Puriva launch dependency

Image generation is a **hard launch blocker**:

- Rows 4–5 in [`PURIVA_LAUNCH_GATE.md`](./PURIVA_LAUNCH_GATE.md)
- Row "Image generation" in [`INTEGRATIONS_TRUTH_MATRIX.md`](./INTEGRATIONS_TRUTH_MATRIX.md)
- R2 live proof required before client-facing image delivery

---

## 6. STOP criteria

Stop and do not claim image generation ready if:

- Any provider/model is wired or called before the decision in [`AI_MODEL_POLICY.md`](../architecture/AI_MODEL_POLICY.md) §2.1 is recorded as owner-approved (it is currently pending)
- Provider API called without owner-approved live proof block
- Client API returns `storageKey`, raw provider URL, or full prompt
- Generated medical imagery bypasses admin review gate
- R2 disabled but `storageKey` persisted anyway
- Social preview attached to WordPress without alt text

---

## 7. Phase B disabled-safe foundation — proof log (2026-07-09)

**Scope:** Disabled-safe image generation foundation only. No live provider client, no schema change, no wiring into `AiDeliveryArticleImage` / `prepare-image-sets` runtime persistence.

**Files added/changed:**

- `apps/api/src/config/image-generation.config.ts` (new) — `IMAGE_GENERATION_ENABLED` / `IMAGE_GENERATION_PROVIDER` / `IMAGE_GENERATION_API_KEY` env shape; returns `disabled` / `missing_config` / `configured_shape_ok`, never touches the network.
- `apps/api/src/core/external-integrations-readiness.service.ts` — added `image_generation` to `ExternalIntegrationCategoryKey` and the readiness snapshot (5 categories total).
- `apps/api/src/core/external-integrations-readiness.service.test.ts` — added disabled / missing_config / configured_shape_ok coverage for the new category, including a no-secret-leak assertion.
- `apps/api/scripts/check-external-integrations-readiness.runner.ts` — updated the hardcoded category count and added `image_generation` scenarios (still asserts zero live `fetch` calls).
- `apps/api/src/core/image-generation.execution.ts` (new) — pure logic: hero/supporting_1/supporting_2/social_preview variant request builder, disabled-safe execution (skips at every readiness status, including `configured_shape_ok`, since no provider client exists yet), required-reason reject validation + rejection builder, client-safe variant mapper, and a static foundation snapshot builder.
- `apps/api/src/core/image-generation.execution.test.ts` (new) — unit coverage for all of the above, including an explicit "no provider call" assertion at every readiness status.
- `apps/api/src/controllers/coreController.ts` / `apps/api/src/routes/core.ts` — added admin-only, read-only `GET /api/v1/image-generation/foundation-config` (owner/admin role, tenant-scoped auth) returning the static foundation snapshot. No DB read/write.
- `apps/api/tests/integration/image-generation.integration.test.ts` (new) — 401 without auth; authenticated path (skips if `AUTH_SEED_TEST_PASSWORD` unset) asserts `disabledSafe: true`, `liveProviderCallsDeferred: true`, disabled status by default, and no `storageKey`/prompt/providerMetadata leakage.

**Validation run locally:**

- `npm run -w @dca-os-v1/api check` — all sub-checks + `tsc --noEmit` pass, including the updated `check:external-integrations-readiness` runner (30/30 assertions, explicit "no live fetch" guard).
- `npm run -w @dca-os-v1/api test:unit` — 157/157 pass, including new `image-generation.execution` and updated `external-integrations-readiness.service` suites.
- `npm run -w @dca-os-v1/api test:integration` — 45/45 pass, including the new `image-generation.integration.test.ts`.

**What this proves:** the config/readiness/variant/reject/client-safe-metadata shape exists and is exercised by tests, and no code path in this shape makes a network call regardless of `IMAGE_GENERATION_ENABLED` value. **What this does not prove:** live provider execution, R2 byte roundtrip for generated images, or any change to `AiDeliveryArticleImage` persistence — those remain blocked per §3.1/§3.7 until schema approval + Phase C/D.

---

## 8. G115-G119 image compliance policy helpers — proof log (2026-07-10)

**Scope:** Pure image compliance/policy helpers only. No live image generation, no provider SDK/client, no HTTP call, no storage write, no schema change, and no runtime provider wiring.

**Files added/changed:**

- `apps/api/src/core/image-compliance-policy.ts` (new) — provider-independent image compliance policy evaluator; rejects before/after framing, fake doctors/patients/testimonials, procedure/device staging, treatment-result claims, real-person likeness risk, and unsafe prescription/device implications at pre-generation prompt and post-generation output review stages. Also defines prompt profile metadata for hero/supporting/social slots, Puriva aesthetic guidance, forbidden policy codes, alt-text requirements, mandatory structured reject-reason validation, and a pure image approval-loop event map.
- `apps/api/src/core/image-compliance-policy.test.ts` (new) — unit tests for hard rejection categories, neutral wellness allowance, prompt profile shape, mandatory reject reason validation, sanitized reject metadata, and approval-loop event mapping.
- `docs/runbooks/IMAGE_GENERATION_PROOF.md` — this closeout section.

**G115:** Image compliance policy helper added with tests proving rejection before/after generation review for before/after framing, fake doctors/patients, procedure/device staging, and treatment-result language; neutral wellness imagery remains allowed.

**G116:** Prompt profile types added for `hero`, `supporting`, and `social` slot profiles, with Puriva aesthetic direction, forbidden compliance codes, and alt-text requirements that prohibit prompt/provider/model leakage and unsupported claims.

**G117:** Mandatory structured reject-reason validation added. Admin/client rejects require a known reason code; `other` additionally requires a free-text note; notes are trimmed before returning validated metadata.

**G118:** Pure image approval-loop event map added for admin/client approve/reject and replacement lifecycle events. Reject-like actions are marked as requiring a reject reason; the map has no side effects.

**G119:** Runbook closeout recorded here. `npm.cmd run -w @dca-os-v1/api test:unit` passed locally (276/276). `npm.cmd run -w @dca-os-v1/api check` passed all scripted API checks, then stopped at `tsc --noEmit` on unrelated `apps/api/src/core/client-operating-packs.test.ts` type errors outside this block (`TS2367`, `TS2339`). Live provider proof remains explicitly out of scope.

---

## 9. G189–G198 image compliance / approval-loop / proof-plan closeout (2026-07-10)

**Scope:** Pure image policy helpers only. No live image generation, no provider SDK/client, no HTTP call, no storage write, no schema change, no edits to `packages/shared/src/notification-events.ts` or `notifications/notification-events.ts`.

**Files added/changed (image lane exclusive ownership):**

| File | Role |
|------|------|
| `apps/api/src/core/image-compliance-policy.ts` | G189 hardening + G192 reject-reason contexts |
| `apps/api/src/core/image-compliance-policy.test.ts` | Focused G189/G192 tests |
| `apps/api/src/core/image-prompt-profile.ts` | G190 prompt profile validator (new) |
| `apps/api/src/core/image-prompt-profile.test.ts` | G190 tests |
| `apps/api/src/core/image-alt-text-policy.ts` | G191 alt text policy (new) |
| `apps/api/src/core/image-alt-text-policy.test.ts` | G191 tests |
| `apps/api/src/core/image-approval-loop.ts` | G193 approval-loop state machine (new) |
| `apps/api/src/core/image-approval-loop.test.ts` | G193 tests |
| `apps/api/src/core/image-notification-mapping.ts` | G194 state→notification mapping (new) |
| `apps/api/src/core/image-notification-mapping.test.ts` | G194 tests |
| `apps/api/src/core/image-wordpress-inclusion.ts` | G195 WP inclusion readiness (new) |
| `apps/api/src/core/image-wordpress-inclusion.test.ts` | G195 tests |
| `apps/api/src/core/image-provider-proof-plan.ts` | G196 typed no-live proof plan (new) |
| `apps/api/src/core/image-provider-proof-plan.test.ts` | G196 tests |
| `docs/runbooks/IMAGE_GENERATION_PROOF.md` | G197 closeout (this section) |

**Per-gate summary:**

| Gate | Result |
|------|--------|
| **G189** | Compliance helper hardened: rejects before/after, syringes/procedure, fake doctor, fake patient, body transformation, guaranteed results; allows neutral wellness, clinic ambience without procedure, product-neutral lifestyle. Policy version `IMAGE_COMPLIANCE_POLICY_V2`. |
| **G190** | Prompt profile validator for `hero`, `supporting_inline`, `social_preview`, `service_specific` with profile IDs, aspect ratios, forbidden elements, and required alt text. |
| **G191** | Alt text policy: no medical claims, no before/after implication, descriptive neutral, not keyword-stuffed; blocks provider/prompt leaks. |
| **G192** | Reject reason required for `admin_reject`, `client_reject`, and `replacement_generation` contexts; `other` still requires a note. |
| **G193** | Pure approval-loop states: `candidate_generated`, `admin_approved`, `admin_rejected`, `client_approved`, `client_rejected`, `replacement_requested`, `final_accepted`. No DB. |
| **G194** | Maps state changes to notification events using existing taxonomy where present; needed missing names listed below (string literals only — taxonomy file not edited). |
| **G195** | WordPress inclusion readiness: only `final_accepted` + roles `hero` / `supporting` / `social` + alt text (social also needs preview asset). |
| **G196** | Typed provider proof plan: provider selection → no-live preflight → one live generation later (out of scope) → compliance review → reject/cleanup. `liveProviderCallsInThisBlock: false`. |
| **G197** | This runbook closeout. |
| **G198** | Focused unit tests for all new/updated image policy modules (no live provider). |

**G194 — existing notification events used (from `packages/shared/src/notification-events.ts`):**

- `image_set_ready_for_client_review` (admin approve → client review)
- `client_image_approved`
- `client_image_rejected`
- `admin_action_required` (fallback for unmapped admin-action paths)

**G194 — needed notification event names (notifications lane should add; image lane uses matching string literals):**

- `image_candidate_generated`
- `image_admin_rejected`
- `image_replacement_requested`
- `image_final_accepted`

**Proposed main-doc bullets (for main-owned docs — not edited here):**

- Image compliance policy V2 hardens medical-aesthetic exclusions and allowed wellness/lifestyle direction.
- Approval-loop states through `final_accepted` gate WordPress inclusion readiness.
- Notification taxonomy should add the four image lifecycle events listed above.
- Provider proof remains no-live until owner-approved Phase D; Firefly direction unchanged.

**Validation:** focused image unit tests only (see agent return). Live provider proof remains explicitly out of scope.

---

## 10. G309–G328 image compliance / approval / no-live closeout (2026-07-10)

**Scope:** Harden medical/aesthetic image safety helpers and expand focused unit coverage. No live image provider, no image generation, no schema change, no edits to `packages/shared/src/notification-events.ts`, `wordpress-image-inclusion.ts`, or storage serializers.

**Policy / helper updates:**

| Module | Change |
|--------|--------|
| `image-compliance-policy.ts` | Policy version `IMAGE_COMPLIANCE_POLICY_V3`; expanded forbidden phrases (progress photos, sterile field, deepfake, at-home injection kit, etc.); expanded allowed neutral lifestyle examples; `buildImageCompliancePolicySnapshot()` |
| `image-prompt-profile.ts` | Profile version `IMAGE_PROMPT_PROFILE_V2`; `resolveImagePromptProfileKindForSlot()`; hard-block codes shared with compliance policy |
| `image-alt-text-policy.ts` | Policy version `IMAGE_ALT_TEXT_POLICY_V2`; expanded no-claim / no-before-after patterns |
| `image-approval-loop.ts` | `assertImageFinalAcceptedInvariant()` for G321 |
| `image-generation.execution.ts` | `IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED = false`; foundation snapshot exposes `liveProviderCallsAllowed: false` |
| `image-provider-proof-plan.ts` | Unchanged plan shape; tests assert no-live phases |
| `image-notification-mapping.ts` | Unchanged; tests confirm shared taxonomy events (post-G228) |
| `image-wordpress-inclusion.ts` | Unchanged readiness rule; tests tie WP inclusion to `final_accepted` |

**Per-gate summary:**

| Gate | Result |
|------|--------|
| **G309** | Forbidden phrases expanded (progress photos, day-0 comparisons, sterile field, actor-as-doctor, clinically proven result, deepfake, at-home injection kit). |
| **G310** | Allowed neutral lifestyle examples expanded (botanical still life, linen/spa-adjacent, gentle self-care ritual). |
| **G311** | `buildImageCompliancePolicySnapshot()` + tests (`liveProviderCallsAllowed: false`). |
| **G312** | Prompt profile validator hardening (aspect, ID mismatch, slot/kind mismatch, forbidden elements). |
| **G313** | Slot→role mapping via `resolveImagePromptProfileKindForSlot` for all variant slots. |
| **G314** | Alt text policy tests (empty/short/long/stuffed/leak). |
| **G315** | Alt no-claim / no-before-after tests (permanent results, progress photos). |
| **G316** | Reject reason validator covers hard-block codes + admin/client/replacement contexts. |
| **G317** | Approval-loop happy path to `final_accepted`. |
| **G318** | Illegal transitions rejected (terminal + skip-client + early accept). |
| **G319** | Notification mapping tests for existing shared taxonomy events. |
| **G320** | WordPress inclusion only for `final_accepted` hero/supporting/social + alt. |
| **G321** | `assertImageFinalAcceptedInvariant` requires final state + alt (+ optional alt/compliance passes). |
| **G322** | Provider proof plan phases covered; live phase out of scope. |
| **G323** | No-live invariant: `IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED === false`; execution never sets `providerCalled: true`. |
| **G324** | Puriva image/medical compliance runbooks refreshed (this lane). |
| **G325** | This closeout section. |
| **G326** | Focused `image*.test.ts` + Puriva image/medical unit tests. |
| **G327** | Lane report → `$env:TEMP\dca-g309-g328-image-lane-report.log`. |
| **G328** | Remaining blockers listed in lane report (Phase C/D, persistence, owner provider lock). |

### WS4 local mapping truth

- Puriva scaffolds expose **3 concept roles** (`hero_header`, `supporting_education`, `lifestyle_context`).
- Generation request set remains the canonical **4 slots** (`hero`, `supporting_1`, `supporting_2`, `social_preview`) via `PURIVA_IMAGE_ROLE_TO_GENERATION_SLOT` / `buildPurivaImageGenerationSlotSet` in `puriva-image-package.ts`.
- Approval-loop reject/replace transitions always return `providerCalled: false` (no live provider wiring; no `ImageGenerationJob` schema in this block).

**Notification taxonomy note:** G228 integrated `image_candidate_generated`, `image_admin_rejected`, `image_replacement_requested`, and `image_final_accepted` into shared taxonomy. Image lane mapping marks these as `existing`; no further taxonomy edits from this lane.

**Explicit confirmations:** no live image provider · no image generation · no secrets · no schema migrations · no commit/push.
