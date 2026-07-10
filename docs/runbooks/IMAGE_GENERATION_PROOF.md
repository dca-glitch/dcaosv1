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

### 1.9 Learning layer

Store per generation attempt:

- `prompt`, `provider`, `model`, `approvalStatus`, `rejectReason`, `replacementLineageId`
- Use reject reasons to improve future prompts (operator review first; automated tuning deferred)

### 1.10 Provider candidates (no vendor lock-in)

| Provider | Mode | Notes |
|----------|------|-------|
| OpenAI Images | API | Same gateway pattern as text |
| Ideogram | API | Strong typography |
| Adobe Firefly | API | Enterprise/compliance path |
| Midjourney-like | Manual external | Operator upload fallback |
| Local deterministic | Dev/test | Existing pattern for text |

**Decision:** Not made in this block. Requires AI Model Research + AI Model Policy gates first. See [`AI_MODEL_POLICY.md`](../architecture/AI_MODEL_POLICY.md) §2.1 — Adobe Firefly is the approved *direction* for primary provider; exact provider/fallback pair and cost caps (§2.3) remain pending owner approval before any Phase B wiring below.

---

## 2. Current codebase state (2026-07-09)

| Area | Status |
|------|--------|
| `AiDeliveryArticleImage` model + CRUD | Scaffolded — manual upload / mark-ready paths |
| Workflow-brief image sets | Scaffolded — `prepare-image-sets`, `refresh-image-set` |
| Image generation Phase B disabled-safe foundation | **New** — `image_generation` readiness category (`disabled` / `missing_config` / `configured_shape_ok`), `IMAGE_GENERATION_ENABLED` + provider + API key config shape (`apps/api/src/config/image-generation.config.ts`), hero/supporting_1/supporting_2/social_preview variant request scaffolding, disabled-safe execution (never calls a provider, including when config shape is OK), required-reason reject, and client-safe metadata mapper (`apps/api/src/core/image-generation.execution.ts`). Admin-only read-only `GET /api/v1/image-generation/foundation-config` added for config visibility (no DB read/write). Unit + integration proven; see §7. |
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
