# Image compliance G553–G564 closeout

**Status:** Local/no-IO helpers + focused unit tests only (2026-07-10)  
**Lane:** 8 — Image compliance / approval / provider-proof prep  
**Baseline:** `main` @ `66dcb74` (working tree changes; no commit)

## Scope

Harden medical/aesthetic image safety helpers and expand focused unit coverage for approval-loop, notification mapping, WordPress inclusion readiness, Puriva scaffold alignment, and no-live provider-proof prep.

**Explicitly out of scope:** live image provider, image generation, schema/migrations, WordPress HTTP, Lane 7 `wordpress-image-inclusion*`, `image-generation.execution*`, storage serializers, commit/push/deploy, medical overclaim.

## Per-gate results

| Gate | Result |
|------|--------|
| **G553** | Compliance policy → `IMAGE_COMPLIANCE_POLICY_V4`; concept bundle helper `evaluateImageConceptComplianceBundle`; expanded filler/Botox/clinical-staging blocks |
| **G554** | Allowed neutral lifestyle examples expanded (ceramic vessels, waiting-lounge architecture) |
| **G555** | Alt policy → `IMAGE_ALT_TEXT_POLICY_V3`; expanded no-claim / no-before-after; `evaluateImageAltTextReviewGate` |
| **G556** | Prompt profile → `IMAGE_PROMPT_PROFILE_V3`; `listImagePromptProfileCatalog()` |
| **G557** | `requireImageRejectReasonForApprovalAction` ties reject-like loop actions to mandatory structured reasons |
| **G558** | Approval loop → `IMAGE_APPROVAL_LOOP_V2`; happy-path helpers to `final_accepted` |
| **G559** | Notification mapping → `IMAGE_NOTIFICATION_MAPPING_V2`; coverage snapshot (needed events = 0) |
| **G560** | WP inclusion → `IMAGE_WORDPRESS_INCLUSION_V2`; bundle gate with optional alt/compliance |
| **G561** | Provider proof plan → `IMAGE_PROVIDER_PROOF_PLAN_V2`; `buildImageProviderProofNoLiveGuard` |
| **G562** | Config no-live snapshot `buildImageGenerationNoLiveConfigSnapshot` (`liveProviderCallsAllowed: false`) |
| **G563** | Puriva alignment `assessPurivaImagePackageComplianceAlignment` + gate doc cross-link |
| **G564** | This closeout |

## Files touched (Lane 8 exclusive)

| File | Role |
|------|------|
| `apps/api/src/core/image-compliance-policy.ts` (+ test) | G553/G554/G557 |
| `apps/api/src/core/image-alt-text-policy.ts` (+ test) | G555 |
| `apps/api/src/core/image-prompt-profile.ts` (+ test) | G556 |
| `apps/api/src/core/image-approval-loop.ts` (+ test) | G558 |
| `apps/api/src/core/image-notification-mapping.ts` (+ test) | G559 |
| `apps/api/src/core/image-wordpress-inclusion.ts` (+ test) | G560 |
| `apps/api/src/core/image-provider-proof-plan.ts` (+ test) | G561 |
| `apps/api/src/config/image-generation.config.ts` (+ test) | G562 |
| `apps/api/src/core/puriva-image-package.ts` (+ test) | G563 |
| `docs/runbooks/PURIVA_IMAGE_PACKAGE_V1_GATE.md` | G563 cross-link |
| `docs/runbooks/IMAGE_COMPLIANCE_G553_G564_CLOSEOUT.md` | G564 |

## Validation

Focused unit tests only (no full `validate`). PowerShell: pass file paths to `node --test` (pipe characters in `--test-name-pattern` break `cmd.exe` via npm):

```powershell
cd C:\dcaosv1\apps\api
node --import tsx --test src/core/image-compliance-policy.test.ts src/core/image-alt-text-policy.test.ts src/core/image-prompt-profile.test.ts src/core/image-approval-loop.test.ts src/core/image-notification-mapping.test.ts src/core/image-wordpress-inclusion.test.ts src/core/image-provider-proof-plan.test.ts src/config/image-generation.config.test.ts src/core/puriva-image-package.test.ts
```

**Result:** 64/64 pass (2026-07-10).

## Deferred proposals (for main-owned docs / later lanes)

1. Owner lock of primary/fallback image provider pair in `AI_MODEL_POLICY.md` (still pending).
2. Phase D live generation remains blocked until R2 target-bucket proof + separate owner approval.
3. Persist approval-loop state on `AiDeliveryArticleImage` (schema) — not in this lane.
4. Wire notification mapper to real outbox/inbox persistence (notifications lane).
5. Lane 7 WordPress draft attach should consume `evaluateImageWordpressInclusionBundle` after schema/gap decisions (`WORDPRESS_DRAFT_PROOF.md` §6.3–§6.5).
6. Consider negation-aware compliance scanning for admin prompt scaffolds (today Puriva alignment screens client-facing title/alt only).

## Confirmations

- No live image provider call
- No image generation
- No secrets printed
- No schema / migration / auth / VPS / deploy
- No commit / push
- No medical overclaim

**GATE: KEEP | agent: yes | budget: medium | mistakes: 0**
