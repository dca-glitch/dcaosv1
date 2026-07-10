# G147 — Next 20 Gates Roadmap

Status: Proposed roadmap only. This file does not authorize live integrations, staging mutation, production mutation, commit, push, deploy, or Puriva Launch.

Scope: G89-G108, plus read-only proposal patches for G145-G146 consolidation work.

Source context:

- `docs/STATUS.md`
- `docs/operator/deferred-scope-register.md`
- `docs/runbooks/PURIVA_LAUNCH_GATE.md`

## Guardrails

- Keep all live proofs deferred until a separately approved execution gate.
- Move only truly completed local/admin work out of deferred language.
- Do not promote local-only proof to staging, production, provider-cost, or client-facing readiness.
- Puriva Client-Service Launch remains separate from the DCA OS Production v1 Gate.
- G49/G50 production sequencing remains separate and still owner-gated.

## G145 — Deferred Register Cleanup Proposal

Goal: clarify the deferred register so local-completed work is no longer described as absent, while live/staging/production proof remains blocked.

Recommended changes:

- Mark local/admin-completed foundations as local-safe or local/operator-ready where the existing evidence supports that label.
- Keep R2 real bucket, GA/GSC live sync, live image provider, transactional notification send, staging/production live AI, production deploy, WordPress live draft proof, and provider invoice cost ingestion deferred or blocked.
- Keep WordPress auto-publish, marketing email, SMS/WhatsApp, SaaS expansion, second-client proof, public approval links, and advanced learning dashboard in still-deferred/future scope.
- Do not move G77b/G79 live AI ledger evidence beyond local-only status.

Proposed patch only. Do not apply without main-agent approval.

```diff
diff --git a/docs/operator/deferred-scope-register.md b/docs/operator/deferred-scope-register.md
--- a/docs/operator/deferred-scope-register.md
+++ b/docs/operator/deferred-scope-register.md
@@
-**Puriva Launch status:** **Blocked** until the blockers above are closed with evidence. See [`G53_PRODUCTION_SAFETY_PLAN.md`](../runbooks/G53_PRODUCTION_SAFETY_PLAN.md).
+**Puriva Launch status:** **Blocked** until the blockers above are closed with target-environment evidence. Local/admin-completed foundations may reduce implementation risk, but they do not satisfy launch proof. See [`G53_PRODUCTION_SAFETY_PLAN.md`](../runbooks/G53_PRODUCTION_SAFETY_PLAN.md).
@@
 | **WordPress live draft proof** | Live draft proof session; publish remains frozen | **G86** three-tier plan in [`WORDPRESS_DRAFT_PROOF.md`](../runbooks/WORDPRESS_DRAFT_PROOF.md) | Draft prep local-proven; live proof BLOCKED; publish frozen |
 | **Image generation provider proof** | Provider research, disabled-safe wiring, medical-aesthetic proof checklist, live proof | **G87** planning in [`IMAGE_GENERATION_PROOF.md`](../runbooks/IMAGE_GENERATION_PROOF.md) | BLOCKED |
+| **Local/admin completed foundations** | Client-safe archive, FINAL-only monthly reports, admin cockpit, AI Delivery deterministic chain, WordPress draft-prep handoff, R2-disabled storage safeguards, outbox no-send behavior | Evidence summarized in [`docs/STATUS.md`](../STATUS.md) §§3-5 | COMPLETE locally only; not staging/production/client-launch proof |
@@
 Deferred:
 
 - real provider sending by default;
 - automatic client notifications;
 - **in-system user notification inbox (Client Portal + admin)** — not started; `EmailLog` is outbound attempt log only;
@@
 Current behavior:
 
 - email foundation exists as controlled groundwork;
- sending must be separately approved and tested.
+- no-send/local outbox behavior is smoke-proven as a disabled-safe foundation;
+- sending must be separately approved and tested.
```

## G146 — Puriva Launch Readiness Consolidation Proposal

Goal: keep the launch gate orderable without implying launch readiness.

Recommended changes:

- Keep overall verdict BLOCKED.
- Preserve the 15-area split between local/admin usable work and missing live/client-facing proof.
- Add a compact "next proof bundle" section that lines up with the next 20 gates below.
- Keep SEC-B1/SEC-H1 called out as production and launch safety blockers until committed/validated.

Proposed patches only. Do not apply without main-agent approval.

```diff
diff --git a/docs/runbooks/PURIVA_LAUNCH_GATE.md b/docs/runbooks/PURIVA_LAUNCH_GATE.md
--- a/docs/runbooks/PURIVA_LAUNCH_GATE.md
+++ b/docs/runbooks/PURIVA_LAUNCH_GATE.md
@@
 ## 7. Recommended next blocks (ordered by lowest-effort-to-close-first)
 
 1. **G89 recommended: owner-selected launch-blocker execution gate** — recommended first candidate is R2 real-bucket proof because it is low blast radius and unlocks document/image proof paths.
 2. **Notifications MVP block** — create/prove in-system notification model before claiming transactional notification readiness; email live send remains a separate owner-approved proof.
 3. **AI target-environment re-proof** — bounded OpenRouter proof on staging/target environment after owner approval; G79 local aggregation is already done, but target proof remains blocked.
 4. **GA/GSC live proof path** — first solve OAuth token storage/encryption; then run bounded read-only sync.
 5. **WordPress live draft proof** — plan already written (`WORDPRESS_DRAFT_PROOF.md` §6); first close §6.3-§6.5 gap decisions, then run one owner-approved staging-only session.
 6. **Image generation provider proof** — choose provider/caps, wire disabled-safe provider path, then prove staging flow with R2.
+
+## 7b. Consolidated next proof bundle
+
+The next launch-readiness work should proceed one owner-approved gate at a time:
+
+- storage first: R2 real-bucket proof, then document/image handoff proof;
+- notification foundation before any live email claim;
+- target-environment AI re-proof separate from local G77b/G79 evidence;
+- GA/GSC OAuth and token storage before live monthly-report sync;
+- WordPress staging draft proof only after the documented gap decisions are closed;
+- image provider selection and disabled-safe wiring before any image live proof.
+
+This bundle is sequencing guidance only. It does not authorize live calls, staging/prod mutation, or Puriva Launch.
```

```diff
diff --git a/docs/STATUS.md b/docs/STATUS.md
--- a/docs/STATUS.md
+++ b/docs/STATUS.md
@@
-| Next gate | **G89 recommended** — owner-selected launch-blocker execution gate; recommended first target is R2 real-bucket proof or another explicitly approved low-blast-radius live-proof gate. No live proof, staging mutation, production mutation, commit, push, or deploy is authorized by G88. |
+| Next gate | **G89 recommended** — owner-selected launch-blocker execution gate; recommended first target is R2 real-bucket proof or another explicitly approved low-blast-radius live-proof gate. G147 proposes a G89-G108 roadmap only. No live proof, staging mutation, production mutation, commit, push, or deploy is authorized by G88 or G147. |
@@
 **Recommended next gate:** **G89** — owner-selected launch-blocker execution gate, preferably the lowest-blast-radius proof that unlocks downstream work (R2 real-bucket proof is the current recommended first candidate). Any live proof, staging/prod action, commit, push, or deploy still requires explicit owner approval.
+
+Roadmap reference: `docs/operator/G147_NEXT_20_GATES.md` proposes G89-G108 sequencing for owner review. It is planning-only and does not change Puriva Launch or production readiness.
```

## G147 — Next 20 Gates

Roadmap assumptions:

- G89-G108 are proposed sequencing gates after G88.
- "Live?" means whether the gate may involve live external services if separately approved.
- "Owner approval" means explicit approval before the gate starts; commit, push, deploy, production, and VPS actions still need separate approvals where applicable.
- Validation is proposed minimum validation, not proof that has already passed.

| Gate | Goal | Type | Risk | Live? | Validation | Owner approval |
|------|------|------|------|-------|------------|----------------|
| G89 | R2 real-bucket proof candidate selection and bounded proof plan | Live integration proof | Medium | Yes, only if selected | `smoke:r2-byte-roundtrip:local` first; then one target-bucket roundtrip proof log | Required before any live bucket IO |
| G90 | R2 staging/target bucket document byte roundtrip | Live integration proof | Medium | Yes | Upload/read/delete or equivalent cleanup proof; verify no raw `storageKey` client exposure | Required before target-bucket IO |
| G91 | Storage-backed deliverable handoff proof | Product/integration proof | Medium | Yes, if using target bucket | Admin upload/download-reference path plus client-safe FINAL visibility check | Required before live storage handoff proof |
| G92 | SEC-B1 closeout commit readiness | Security/product safety | High | No | `npm run validate`; targeted tenant-boundary integration test | Required before commit; no push without separate approval |
| G93 | SEC-H1 storage key exposure remediation | Security/product safety | High | No | Focused API/UI checks that admin/client responses do not leak raw storage keys unexpectedly | Required before code edits |
| G94 | In-system notification MVP design gate | Product foundation | Medium | No | Schema/API/UI proposal reviewed; no live send | Required before notification implementation |
| G95 | In-system notification MVP local implementation | Product foundation | Medium | No | Focused unit/integration smoke for tenant-scoped admin/client inbox behavior | Required before edits; commit approval separate |
| G96 | Email no-send workflow proof | Disabled-safe integration proof | Medium | No | No-send smoke showing event intent, outbox/log state, and no provider delivery | Required before proof session |
| G97 | Transactional email live-send proof plan | Live integration planning | High | Planned only | Resend/provider checklist, recipient controls, rollback/disable plan | Required before any live email send |
| G98 | Bounded transactional email live-send proof | Live integration proof | High | Yes | One owner-approved recipient proof, event log, provider result, disabled-safe restore | Required immediately before live send |
| G99 | Target-environment AI live proof plan | Live integration planning | High | Planned only | Preflight env names only, cost cap, model policy, restore checklist | Required before staging/target AI call |
| G100 | Target-environment AI text proof | Live integration proof | High | Yes | Baseline no-live smoke, one bounded OpenRouter call, ledger verifier, restore smoke | Required immediately before live call |
| G101 | AI provider cost ingestion research | Policy/research | Medium | No | Provider cost source assessment; document whether exact cost is available/trustworthy | Required before policy change |
| G102 | `actualCostUsd` trusted ingestion implementation, if supported | Backend/accounting implementation | High | Possibly, for final proof | Unit tests for fallback and trusted exact-cost path; no invoice claim without provider evidence | Required before edits and any live validation |
| G103 | GA/GSC OAuth/token storage design | Live integration planning | High | No | Security review of token storage/encryption/tenant isolation; no OAuth consent yet | Required before implementation |
| G104 | GA/GSC read-only live sync proof | Live integration proof | High | Yes | One bounded read-only sync; monthly report source labels remain accurate | Required before OAuth/live sync |
| G105 | WordPress draft proof gap decisions | Product/integration planning | Medium | No | Decide schema change vs manual-check-only for alt/caption/social preview/idempotency/filter gaps | Required before implementation/proof |
| G106 | WordPress staging draft proof | Live integration proof | High | Yes | One staging-only draft, parity checks, cleanup marker, disabled-safe restore | Required before live WordPress call |
| G107 | Image provider selection and cap policy | Policy/research | High | No | Provider comparison, medical-aesthetic constraints, cost/cap policy, no live call | Required before provider wiring |
| G108 | Image generation disabled-safe provider wiring | Integration implementation | High | No by default | Unit/integration tests for disabled-safe behavior, approval metadata, no provider call unless enabled | Required before edits; live proof deferred |

## Not Yet Scheduled In This 20-Gate Window

These remain important but should not be pulled into G89-G108 unless the owner explicitly changes priority:

- image generation live staging proof after G108;
- full feedback-learning persistence layer;
- public/share approval links;
- WordPress auto-publish;
- marketing email campaigns;
- SMS/WhatsApp;
- SaaS onboarding and second-client proof;
- production deploy G50, which remains governed by G49/G50 and separate approval.

## GATE

GATE: KEEP | agent: yes | budget: low | mistakes: 0

Backend/API/auth/schema/VPS/deploy touched: no.
