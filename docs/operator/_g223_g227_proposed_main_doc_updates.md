# G223–G227 Proposed Main-Doc Updates

**Status:** PROPOSAL ONLY for the main agent. This file must **not** be treated as applied truth until the main agent integrates into the protected files.

**Protected files — do not edit from this lane (already respected):**

- `docs/STATUS.md`
- `docs/operator/deferred-scope-register.md`
- `docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`
- `docs/runbooks/PURIVA_LAUNCH_GATE.md`

**Lane-owned docs already written/updated (safe to reference):**

- `docs/security/SECURITY_CHECKLIST_G223.md` (G223)
- `docs/operator/TEST_SMOKE_INVENTORY.md` (G224 refresh)
- `docs/operator/VALIDATION_COMMAND_GUARDS.md` (G225 refresh)
- `docs/operator/G227_NEXT_30_GATES.md` (G227)

**Hard truth to preserve on integrate:** Puriva Launch remains **BLOCKED** until real target-environment proofs. Production readiness remains **NO**. No live R2 / email / GA/GSC / WordPress / image / staging-prod proof is claimed by G223–G227.

---

## G226 — Deferred register cleanup proposal

### Intent

Move **only** truly completed **local/no-live** foundations out of "not started" language. Keep all live and target-environment items deferred/blocked.

### Keep deferred / blocked (do not move)

| Item | Why keep deferred |
|------|-------------------|
| Real R2 bucket IO / signed URL against target bucket | Local no-IO / disabled-safe only |
| Live email / Resend send | No-send adapter only |
| Live GA/GSC OAuth + sync | Config helpers only; no token storage/consent |
| Live WordPress draft HTTP | Draft payload + publish-freeze local only |
| Live image provider | Compliance helpers only; no provider selected |
| Staging/production live proofs (AI, R2, GA/GSC, WP, email, portal) | Historical staging PASS ≠ new live integration proof |
| Notification persistence / in-system inbox | Taxonomy/no-send foundation only; inbox still not implemented |
| Trusted `actualCostUsd` ingestion | G80 policy only; `actualCostUsd` remains null without trusted source |
| WordPress auto-publish, marketing email, SMS/WhatsApp, SaaS expansion | Still-deferred product scope |

### Safe to clarify as local-complete (not launch-complete)

| Area | Local-complete language |
|------|-------------------------|
| R2 readiness / proof-stage / storage-key guards | Local foundation complete; live bucket still required |
| Notification taxonomy / mapping / policy / no-send / templates | Local foundation complete; inbox + live email still required |
| GA/GSC config helpers + FINAL/manual metrics | Local foundation complete; OAuth/live sync still required |
| WordPress draft payload / credential-shape / publish-freeze tests | Local foundation complete; live draft still required |
| Image compliance policy helpers | Local foundation complete; provider/live still required |
| Client Portal FINAL / leak hardening | Local foundation complete; staging/prod portal proof still required |
| Operator security checklist / smoke inventory / validation guards / next-30 roadmap | Docs foundations complete; not production audit |

### Proposed patch — `docs/operator/deferred-scope-register.md`

```diff
diff --git a/docs/operator/deferred-scope-register.md b/docs/operator/deferred-scope-register.md
--- a/docs/operator/deferred-scope-register.md
+++ b/docs/operator/deferred-scope-register.md
@@
-**G148 update:** G89-G147 moved several local foundations out of "not started" status, but did **not** move any live proof out of deferred. R2 readiness/proof stages, notification taxonomy/no-send adapter, GA/GSC helpers, WordPress draft payload/publish-freeze tests, image compliance policy helpers, Client Portal FINAL guards, Client Operating Pack constants, future-module contracts, AI budget reporting contracts, and operator/security inventories are local foundations only.
+**G148 update:** G89-G147 moved several local foundations out of "not started" status, but did **not** move any live proof out of deferred. R2 readiness/proof stages, notification taxonomy/no-send adapter, GA/GSC helpers, WordPress draft payload/publish-freeze tests, image compliance policy helpers, Client Portal FINAL guards, Client Operating Pack constants, future-module contracts, AI budget reporting contracts, and operator/security inventories are local foundations only.
+
+**G226 proposal (G223-G227 lane):** Operator/security docs refreshed (`SECURITY_CHECKLIST_G223.md`, `TEST_SMOKE_INVENTORY.md`, `VALIDATION_COMMAND_GUARDS.md`, `G227_NEXT_30_GATES.md`). Still **do not** move: real R2 IO, live email, live GA/GSC, live WordPress, live image provider, staging/prod live proofs, notification persistence/in-system inbox, or trusted `actualCostUsd` ingestion. Puriva Launch remains blocked.
@@
-**Roadmap reference:** G147 created [`G147_NEXT_20_GATES.md`](./G147_NEXT_20_GATES.md) for the next 20 owner-gated blocks. G148 does not execute those gates.
+**Roadmap reference:** G147 created [`G147_NEXT_20_GATES.md`](./G147_NEXT_20_GATES.md) for G89-G108 planning. G227 proposes [`G227_NEXT_30_GATES.md`](./G227_NEXT_30_GATES.md) for G229+ after G228 closeout. Neither roadmap authorizes live proof or launch.
@@
-| **G149 recommended after G148** | Owner-selected launch-blocker execution gate; recommended first candidate: R2 target-environment real-bucket proof or another explicitly approved low-blast-radius proof |
+| **G149 recommended after G148** | Owner-selected launch-blocker execution gate; recommended first candidate: R2 target-environment real-bucket proof or another explicitly approved low-blast-radius proof |
+| **G223-G227 (docs lane)** | Security checklist alignment, test/smoke inventory refresh, validation guards refresh, deferred-register cleanup proposal, next-30 gates roadmap — docs only |
+| **G228 (main closeout, conceptual)** | Main-agent integration of concurrent lanes; not a live-proof authorization |
+| **G229+** | See [`G227_NEXT_30_GATES.md`](./G227_NEXT_30_GATES.md) |
@@
 ## G89-G148 deferred-scope reconciliation (2026-07-10)
@@
 | Operator/security docs | Checklists, inventories, next-gate roadmap | External audit, production proof, deploy approval |
 
-G148 recommendation: keep local foundations, keep all live-provider/storage/email/Google/WordPress/image and staging/production proofs deferred until a separate owner-approved gate.
+G148 recommendation: keep local foundations, keep all live-provider/storage/email/Google/WordPress/image and staging/production proofs deferred until a separate owner-approved gate.
+
+## G223-G227 deferred-scope reconciliation (2026-07-10)
+
+| Area | Local/docs complete | Still deferred / blocked |
+|------|---------------------|--------------------------|
+| Security checklist | G223 code-to-doc alignment (`SECURITY_CHECKLIST_G223.md`) | External audit; target-env re-proof; centralized log redaction utility still absent |
+| Test/smoke inventory | G224 refresh + focused-test placeholders | Live smokes / target-env proofs |
+| Validation guards | G225 validate-before-smoke / no-live-without-approval / temp logs / untracked `.cursor/settings.json` | N/A (process docs) |
+| Deferred register | This G226 proposal only | Real R2 IO, live email, live GA/GSC, live WordPress, live image, staging/prod proofs, notification persistence, trusted `actualCostUsd` |
+| Next gates | G227 roadmap G229–G258 | Execution still owner-gated |
+
+G226 recommendation: do **not** remove any Puriva Launch blocker row. Only clarify local foundations vs live proof.
```

---

## Proposed patch — `docs/STATUS.md`

```diff
diff --git a/docs/STATUS.md b/docs/STATUS.md
--- a/docs/STATUS.md
+++ b/docs/STATUS.md
@@
-**Last updated:** 2026-07-10 (G148 — G89-G147 final integration closeout)
+**Last updated:** 2026-07-10 (G223-G227 operator/security docs lane — proposal integrated by main agent when accepted)
@@
-| Next gate | **G149 recommended** — owner-selected launch-blocker execution gate; recommended first target is R2 target-environment real-bucket proof or another explicitly approved low-blast-radius live-proof gate. No live proof, staging mutation, production mutation, commit, push, or deploy is authorized by G148. |
+| Next gate | **G149 / post-G228 owner-selected launch-blocker execution** — recommended first target remains R2 target-environment real-bucket proof. G227 proposes G229+ roadmap in `docs/operator/G227_NEXT_30_GATES.md`. No live proof, staging mutation, production mutation, commit, push, or deploy is authorized by G148 or G223-G227. |
@@
-| Puriva Launch | **Blocked** — live proof gates and product workflow gates required; G89-G147 add local foundations and docs only; no live provider/storage/email/Google/WordPress/image proof, staging/prod proof, or production deploy is claimed |
+| Puriva Launch | **Blocked** — live proof gates and product workflow gates required; G89-G147 and G223-G227 add local foundations and operator docs only; no live provider/storage/email/Google/WordPress/image proof, staging/prod proof, or production deploy is claimed |
@@
 | **G148** | **KEEP pending validation** | Main-agent integration/reconciliation, validation, and final report gate |
 
-**Recommended next gate:** **G149** — owner-selected launch-blocker execution gate, with R2 target-environment real-bucket proof still the recommended first low-blast-radius candidate. See [`docs/operator/G147_NEXT_20_GATES.md`](./operator/G147_NEXT_20_GATES.md).
+| **G223** | **READY (docs)** | Security checklist code-to-doc alignment — `docs/security/SECURITY_CHECKLIST_G223.md` |
+| **G224** | **READY (docs)** | Test/smoke inventory refresh — `docs/operator/TEST_SMOKE_INVENTORY.md` §5 focused-test placeholders |
+| **G225** | **READY (docs)** | Validation command guards refresh — `docs/operator/VALIDATION_COMMAND_GUARDS.md` |
+| **G226** | **PARTIAL (proposal)** | Deferred register cleanup proposal only — see `docs/operator/_g223_g227_proposed_main_doc_updates.md` |
+| **G227** | **READY (docs)** | Next 30 gates roadmap — `docs/operator/G227_NEXT_30_GATES.md` (G229+) |
+
+**Recommended next gate:** Owner-selected launch-blocker execution (historically G149; after G228 closeout see G229+ in [`G227_NEXT_30_GATES.md`](./operator/G227_NEXT_30_GATES.md)). R2 target-environment real-bucket proof remains the recommended first low-blast-radius candidate. Puriva Launch remains **BLOCKED**.
```

Optional STATUS note (short paragraph for executive snapshot or closeout section):

> G223–G227 (operator/security/docs lane): refreshed security checklist alignment, test/smoke inventory, validation guards, deferred-register cleanup **proposal**, and next-30 gates roadmap. No live calls, no staging/prod mutation, no commit/push/deploy. Puriva Launch remains BLOCKED.

---

## Proposed patch — `docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`

```diff
diff --git a/docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md b/docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md
--- a/docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md
+++ b/docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md
@@
-**G148 integration (2026-07-10):** Labels updated for G89-G147 lane outcomes: R2 no-IO readiness/proof stages/storage-key guards, notifications taxonomy/no-send foundation, GA/GSC helper/config foundation, WordPress draft payload + publish-freeze-before-fetch tests, image compliance policy helpers, Client Portal FINAL guards, pack/future-module contracts, AI budget reporting contract, and operator/security docs. Staging and production proof columns remain **Not proven** unless a prior recorded proof explicitly says otherwise.
+**G148 integration (2026-07-10):** Labels updated for G89-G147 lane outcomes: R2 no-IO readiness/proof stages/storage-key guards, notifications taxonomy/no-send foundation, GA/GSC helper/config foundation, WordPress draft payload + publish-freeze-before-fetch tests, image compliance policy helpers, Client Portal FINAL guards, pack/future-module contracts, AI budget reporting contract, and operator/security docs. Staging and production proof columns remain **Not proven** unless a prior recorded proof explicitly says otherwise.
+
+**G223-G227 docs lane (2026-07-10):** Operator security checklist, test/smoke inventory, and validation guards refreshed. **No integration row should change** staging or production proof from **Not proven**. No live provider call, R2 IO, OAuth/sync, WordPress HTTP, email send, image-provider call, staging/prod probe, commit, push, or deploy was performed by this lane.
@@
-- **G148 consolidation (2026-07-10):** G89-G147 local foundations are integrated, but do not change any staging/production proof column. R2, notifications/email, GA/GSC, WordPress, image generation, Client Portal staging QA, and production launch proofs remain owner-gated.
+- **G148 consolidation (2026-07-10):** G89-G147 local foundations are integrated, but do not change any staging/production proof column. R2, notifications/email, GA/GSC, WordPress, image generation, Client Portal staging QA, and production launch proofs remain owner-gated.
+- **G223-G227 confirmation:** Security/inventory/guard docs do not constitute integration proof. Keep all staging/production columns **Not proven** for R2, email, GA/GSC, WordPress live draft, image generation, and target-env AI re-proof.
```

**Row-level instruction for main agent:** Do **not** flip any staging/production cell. Optional local-proof wording tweaks only if other lanes already landed code; this lane provides no new live evidence.

---

## Proposed patch — `docs/runbooks/PURIVA_LAUNCH_GATE.md`

```diff
diff --git a/docs/runbooks/PURIVA_LAUNCH_GATE.md b/docs/runbooks/PURIVA_LAUNCH_GATE.md
--- a/docs/runbooks/PURIVA_LAUNCH_GATE.md
+++ b/docs/runbooks/PURIVA_LAUNCH_GATE.md
@@
-**Status:** Docs-only evaluation. Overall verdict: **BLOCKED**. G148 integration recorded the G89-G147 lane outcomes as local/no-IO foundations only: R2 readiness/proof stages, notification taxonomy/no-send adapter, GA/GSC helpers, WordPress draft payload/publish-freeze checks, image compliance policy helpers, Client Portal FINAL guards, Puriva packs, future-module contracts, AI budget reporting contract, and operator/security docs. This document does not authorize Puriva Launch, live integrations, or production client-facing use.
+**Status:** Docs-only evaluation. Overall verdict: **BLOCKED**. G148 recorded G89-G147 local/no-IO foundations. G223-G227 refreshed operator security checklist, test/smoke inventory, validation guards, and a G229+ roadmap — still docs/local only. This document does not authorize Puriva Launch, live integrations, or production client-facing use.
@@
-**BLOCKED.** G89-G147 add useful local/admin foundations across storage, notifications, analytics helpers, WordPress draft preparation, image compliance, Client Portal visibility, operating packs, future-module contracts, AI budget reporting, and operator/security inventories. None closes Puriva Launch. No staging/prod live proof, live AI call, email send, Google OAuth/sync, WordPress HTTP call, image-provider call, R2 IO, commit, push, or deploy is claimed here.
+**BLOCKED.** G89-G147 and G223-G227 add useful local/admin foundations and operator docs. None closes Puriva Launch. No staging/prod live proof, live AI call, email send, Google OAuth/sync, WordPress HTTP call, image-provider call, R2 IO, commit, push, or deploy is claimed here.
@@
 1. **G149 recommended: owner-selected launch-blocker execution gate** — recommended first candidate is R2 target-environment real-bucket proof because it is low blast radius and unlocks document/image proof paths.
@@
-- G148 integration does not authorize G149 or any execution gate.
+- G148 integration does not authorize G149 or any execution gate.
+- G223-G227 docs lane does not authorize G149/G229+ execution, live proof, or Puriva Launch. See `docs/operator/G227_NEXT_30_GATES.md` for proposed G229–G258 sequencing only.
```

Optional addition under recommended next blocks:

```markdown
## 7c. Post-G228 proof sequencing (from G227 roadmap)

Planning-only pointer to `docs/operator/G227_NEXT_30_GATES.md`:

- G229–G233 storage / SEC-H1 target proof cluster
- G234–G238 notifications persistence then bounded live email
- G239–G243 target AI re-proof and optional trusted cost ingestion
- G244–G246 GA/GSC token design then bounded sync
- G247–G251 WordPress draft + image provider path
- G252–G255 portal/target evidence + launch re-score (expect still blocked until all blockers close)
- G256–G258 production safety sentence / G50 prep-only / deferred cleanup

This section does not authorize any live call or launch.
```

---

## Main-agent integration checklist

1. Apply only the diffs above (or equivalent wording) to the four protected files.
2. Do not claim Puriva Launch movement.
3. Do not change any integrations matrix staging/production cell away from **Not proven** based on this lane.
4. Link new docs:
   - `docs/security/SECURITY_CHECKLIST_G223.md`
   - `docs/operator/G227_NEXT_30_GATES.md`
5. Exclude from commit: `.cursor/settings.json`, this proposal file if treated as scratch (or commit it intentionally as operator proposal — owner choice), and `_status_report.md` if present.
6. Validate/docs-only: `git diff --check` is sufficient for this lane; no smoke required.

---

## Lane confirmations

| Confirmation | Value |
|---|---|
| Protected main docs edited by this subagent | **No** |
| Live calls / staging / prod / VPS / deploy | **No** |
| Commit / push | **No** |
| `.cursor/settings.json` touched | **No** |
| Puriva Launch | Remains **BLOCKED** |
