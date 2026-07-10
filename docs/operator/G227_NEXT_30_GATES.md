# G227 — Next 30 Gates Roadmap (G229+)

**Status:** Proposed roadmap only. This file does not authorize live integrations, staging mutation, production mutation, commit, push, deploy, or Puriva Launch.

**Scope:** Conceptual gates **after G228**. G228 is reserved for the main-agent integration/closeout of the G149–G227 multitask block (or equivalent owner-assigned closeout). This roadmap therefore starts at **G229**.

**Context sources (read-only for this lane):**

- `docs/STATUS.md`
- `docs/operator/deferred-scope-register.md`
- `docs/runbooks/PURIVA_LAUNCH_GATE.md`
- `docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`
- `docs/operator/G147_NEXT_20_GATES.md` (historical G89–G108 planning)
- `docs/security/SECURITY_CHECKLIST_G223.md`

## Guardrails

- Keep all live proofs deferred until a separately approved execution gate.
- Local/no-IO foundations from G89–G227 do **not** satisfy Puriva Launch.
- Do not promote local-only proof to staging, production, provider-cost, or client-facing readiness.
- Puriva Client-Service Launch remains separate from the DCA OS Production v1 Gate (G49/G50).
- "Live?" means whether the gate **may** involve live external services **if** separately approved.
- "Owner approval" means explicit approval before the gate starts; commit, push, deploy, production, and VPS actions still need separate approvals where applicable.
- Validation is proposed minimum validation, not proof that has already passed.

## Sequencing intent (lowest blast radius first)

1. Storage real-bucket proof unlocks document/image byte paths.
2. Notification persistence before any live email claim.
3. Target-environment AI re-proof separate from local G77b/G79 evidence.
4. GA/GSC OAuth/token storage before live sync.
5. WordPress staging draft proof only after documented gap decisions.
6. Image provider selection/disabled-safe wiring before live image proof.
7. Production G49/G50 remains a separate track and stays frozen until owner sentences.

## Next 30 gates (G229–G258)

| Gate | Goal | Type | Risk | Live? | Validation | Owner approval required |
|------|------|------|------|-------|------------|-------------------------|
| G229 | Owner selects first post-G228 launch-blocker execution candidate (default recommendation: R2 target-bucket proof) | docs / planning | Low | no | Review STATUS + deferred register + truth matrix; no remote calls | Yes — before any execution gate starts |
| G230 | R2 target-environment real-bucket proof plan freeze (bucket name env names only, cleanup, restore) | docs / planning | Medium | no | Checklist against `STORAGE_R2_PROOF.md`; local `smoke:r2-*:local` baseline recorded as disabled-safe only | Yes — before live bucket IO |
| G231 | R2 staging/target byte roundtrip (upload/read/delete or equivalent cleanup) | proof | Medium | **yes** | Proof log in `$env:TEMP`; verify no raw `storageKey` client exposure; restore disabled-safe | Yes — immediately before live IO |
| G232 | Storage-backed deliverable / document handoff proof on target env | proof | Medium | **yes** (if target bucket) | Admin upload + download-reference path; client-safe FINAL visibility check | Yes |
| G233 | SEC-H1 / storage-key non-exposure re-verification on target responses | validation / security | High | no (unless paired with G231) | Focused API checks + `sec-h1-storage-key-leak` pattern; scrub logs | Yes before any response capture share |
| G234 | In-system notification persistence / inbox MVP design gate | docs / planning | Medium | no | Schema/API/UI proposal reviewed; no live send | Yes before implementation |
| G235 | In-system notification MVP local implementation | implementation | Medium | no | Unit/integration tests for tenant-scoped admin/client inbox | Yes before edits; commit separate |
| G236 | Notification no-send workflow proof (event → outbox/log, no provider delivery) | proof / validation | Medium | no | `smoke:email-outbox:local` + focused notification tests | Yes before proof session |
| G237 | Transactional email live-send proof plan (Resend/provider, recipient controls, restore) | docs / planning | High | no (plan only) | Plan in `EMAIL_NOTIFICATIONS_PROOF.md`; recipient allowlist | Yes before any live email |
| G238 | Bounded transactional email live-send proof (one owner-controlled recipient) | proof | High | **yes** | One send, event log, provider result, disabled-safe restore | Yes — immediately before send |
| G239 | Target-environment AI live proof plan (cost cap, model policy, restore) | docs / planning | High | no (plan only) | Preflight env **names only**; `AI_PROVIDER_LIVE_PROOF.md` staging section | Yes before staging/target AI call |
| G240 | Target-environment AI text proof (bounded OpenRouter) | proof | High | **yes** | Baseline no-live smoke → one bounded call → ledger verifier → restore | Yes — immediately before live call |
| G241 | AI ledger target-env COMPLETED attribution re-check | validation | High | **yes** (if reusing G240 evidence) | Confirm COMPLETED row + `actualCostUsd` still null unless trusted ingestion exists | Yes |
| G242 | Trusted `actualCostUsd` ingestion research (provider invoice/exact cost availability) | docs / research | Medium | no | Document whether exact cost is trustworthy; no policy claim without evidence | Yes before policy change |
| G243 | Trusted `actualCostUsd` ingestion implementation (only if G242 supports it) | implementation | High | possibly for final proof | Unit tests for fallback + trusted path; no invoice claim without provider evidence | Yes before edits and any live validation |
| G244 | GA/GSC OAuth token storage/encryption design | docs / planning | High | no | Security review of token storage, encryption, tenant isolation; no consent yet | Yes before implementation |
| G245 | GA/GSC OAuth consent + token persistence local/staging wiring (disabled-safe default) | implementation | High | no by default | Unit/integration for encrypted token store; no live sync yet | Yes before edits |
| G246 | GA/GSC bounded read-only live sync proof | proof | High | **yes** | One bounded sync; monthly report source labels remain accurate (no placeholder promotion) | Yes before OAuth/live sync |
| G247 | WordPress draft proof gap decisions (alt/caption/social/idempotency/approved-image filter) | docs / planning | Medium | no | Decide schema vs manual-check-only per `WORDPRESS_DRAFT_PROOF.md` §6.3–§6.5 | Yes before implementation/proof |
| G248 | WordPress staging live draft proof (publish remains frozen) | proof | High | **yes** | One staging-only draft, parity checks, cleanup marker, disabled-safe restore | Yes before live WordPress HTTP |
| G249 | Image provider selection + medical-aesthetic / cost-cap policy | docs / research | High | no | Provider comparison; no live call | Yes before provider wiring |
| G250 | Image generation disabled-safe provider wiring | implementation | High | no by default | Unit/integration for disabled-safe behavior; no provider call unless enabled | Yes before edits; live proof deferred |
| G251 | Image generation staging live proof (depends on R2 + G250) | proof | High | **yes** | Bounded generate → store bytes → approval metadata → restore | Yes immediately before live image call |
| G252 | Client Portal staging browser proof (FINAL-only, approval UX, no storageKey leak) | proof / validation | High | no live provider required; staging app yes | Focused portal browser smokes against staging after owner approval | Yes before staging browser session |
| G253 | Puriva transactional notification end-to-end proof (in-system + email) on target env | proof | High | **yes** (email portion) | Event → inbox → optional email; no marketing send | Yes |
| G254 | Integrations truth matrix target-env evidence refresh (only rows with new recorded proof) | docs / validation | Medium | no | Update only rows with evidence; keep others Not proven | Yes before editing protected truth matrix |
| G255 | Puriva Launch Gate re-score after closed proofs (expect still partial until all blockers close) | docs | Medium | no | Re-evaluate 15 areas; overall verdict stays honest | Yes before claiming any launch movement |
| G256 | G49 formal owner-approval sentence / dry-run closure (production safety track) | docs / proof | High | no mutation | Owner sentence recorded; public probes already historical PASS | Yes — owner sentence itself |
| G257 | G50 production deploy gate prep only (rollback, env separation, freeze checklist) — **no deploy** | docs / planning | High | no | `G53` / production safety checklist complete; deploy still frozen | Yes; does **not** authorize deploy |
| G258 | Post-proof deferred-register cleanup + next roadmap handoff | docs | Low | no | Move only truly completed target-env items; keep remaining live blockers | Yes before editing deferred register |

## Explicitly not claimed by this roadmap

- Puriva Launch PASS
- Production readiness YES
- G50 deploy execution
- WordPress auto-publish
- Marketing email / SMS / WhatsApp
- SaaS second-client / marketplace expansion
- Finance Lite invoice mutation via AI budget reporting
- Any live proof without a separate owner-approved execution session

## Relationship to G147 / G149

- `G147_NEXT_20_GATES.md` covered G89–G108 planning.
- STATUS after G148 recommended **G149** as the owner-selected launch-blocker execution gate.
- This G227 roadmap assumes G149–G228 absorb foundation + integration closeout work, then **G229+** continue owner-gated proofs without overclaiming.

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**

Backend/API/auth/schema/VPS/deploy touched: **no**.
