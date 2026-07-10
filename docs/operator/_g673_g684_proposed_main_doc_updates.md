# G673–G684 Proposed Main-Doc Updates

**Status:** PROPOSAL ONLY for the main agent (Lane 18). Do **not** treat as applied truth until main integrates into protected files.

**Lane:** Docs consistency / stale claim sweep (G673–G684)  
**Baseline:** `main` @ `66dcb74`  
**Date:** 2026-07-10  
**Mode:** Docs-only. No commit / push / deploy.

**Protected files — do not edit from this lane (respected):**

- `docs/STATUS.md`
- `docs/operator/deferred-scope-register.md`
- `docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`
- `docs/runbooks/PURIVA_LAUNCH_GATE.md`
- `docs/operator/G708_NEXT_GATES.md` (does not exist yet at sweep time — Lane 20 / main will create)

**Hard truths to preserve on integrate:**

- Production readiness remains **NO**
- Puriva Launch remains **BLOCKED**
- Staging/production columns for R2, email, GA/GSC, WordPress live draft, image provider, target-env AI remain **Not proven**
- Local/no-IO foundations and local controlled OpenRouter (G77b) do **not** close launch
- Do not introduce “production ready”, “launch ready”, “email/Google/WordPress/R2/image/SaaS ready”, or “live integration proven” as affirmative product claims

**Applied by this lane (non-main, low-risk):**

- `docs/operator/README.md` — refreshed Current Operating Position (stale `cc40160` + unqualified “ready” language)
- `docs/ai-delivery/client-onboarding-runbook.md` — local-only + explicit not production / not launch / not live-integration proven

**Conflict-risk files left proposal-only** (other lanes actively writing): STORAGE_R2_PROOF, EMAIL_*, WORDPRESS_*, IMAGE_*, CLIENT_PORTAL_*, security inventories, Lane 16 operator checklists, Lane 17 UI docs.

---

## G673 — “production ready” (main-owned proposals)

### Finding

No affirmative “production ready” / “Production readiness: YES” claim found in main-owned docs. STATUS correctly says **NO**. Forbidden-phrase lists in vocabulary/security docs are intentional (keep).

### Residual risk (clarify, do not flip readiness)

`docs/STATUS.md` historical line uses “Knowledge integration proven” (local smoke only). Soften so it cannot be read as live/production integration proof.

### Proposed patch — `docs/STATUS.md`

```diff
diff --git a/docs/STATUS.md b/docs/STATUS.md
--- a/docs/STATUS.md
+++ b/docs/STATUS.md
@@
-- AI SEO Blocks 3B–3G, 4A–4G, 5A, 6A–6C-v1; Knowledge integration proven via `smoke:ai-knowledge-context`.
+- AI SEO Blocks 3B–3G, 4A–4G, 5A, 6A–6C-v1; Knowledge **local** integration smoke-proven via `smoke:ai-knowledge-context` (not staging/production or live-provider proof).
```

Optional STATUS header note (only if main wants an explicit G673–G684 breadcrumb):

```diff
+**G673–G684 stale-claim sweep (Lane 18):** Docs scan complete; no production-ready / launch-ready / live-integration-proven affirmative claims found in STATUS. Softened historical “Knowledge integration proven” wording above. Puriva Launch remains **BLOCKED**; production readiness remains **NO**.
```

---

## G674 — “launch ready”

### Finding

No affirmative “launch ready” / “Puriva Launch: PASS” in main-owned docs. `PURIVA_LAUNCH_GATE.md` overall verdict **BLOCKED** — keep.

### Proposed patch — `docs/runbooks/PURIVA_LAUNCH_GATE.md`

Clarify SEC-B1 “uncommitted” language so it cannot be read as “fix landed / launch unblocked”. At `66dcb74` baseline, treat as: fix may already be on `main` from prior merges — main must verify before applying.

```diff
diff --git a/docs/runbooks/PURIVA_LAUNCH_GATE.md b/docs/runbooks/PURIVA_LAUNCH_GATE.md
--- a/docs/runbooks/PURIVA_LAUNCH_GATE.md
+++ b/docs/runbooks/PURIVA_LAUNCH_GATE.md
@@
-| SEC-B1 legacy `/api/v1/briefs` cross-tenant IDOR | **FIXED (local, uncommitted)** — `requireTenant` + tenant-scoped client/brief checks |
+| SEC-B1 legacy `/api/v1/briefs` cross-tenant IDOR | **FIXED (local)** — `requireTenant` + tenant-scoped client/brief checks; confirm commit presence on target SHA before G50; does **not** authorize Puriva Launch |
@@
-| Puriva launch impact | SEC-B1 was a **production safety blocker**; fix must be committed and validated before G50 |
+| Puriva launch impact | SEC-B1 was a **production safety blocker**; fix must be present on the deploy SHA and validated before G50. Clearing SEC-B1 does **not** make Puriva Launch ready. |
```

No “launch ready” affirmative language to add anywhere.

---

## G675 — “live integration proven”

### Finding

No exact phrase “live integration proven”. Closest risky phrasing is STATUS “Knowledge integration proven” (G673 patch). Matrix correctly keeps staging/production **Not proven**.

### Proposed patch — `docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`

Add a G673–G684 affirmation under summary rules (no column flips):

```diff
diff --git a/docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md b/docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md
--- a/docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md
+++ b/docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md
@@
-**G468 consolidation (2026-07-10):** G229-G467 local foundations are integrated (storage no-IO hardening, notification taxonomy/correlation design, GA/GSC/monthly guards, WordPress draft helpers, image compliance V3, Client Portal boundary tests, Puriva pack catalog, future-module contracts, AI budget/routing truth labels, security inventories, UI testability). Staging/production columns remain **Not proven** for R2, email, GA/GSC, WordPress live draft, image generation, and target-env AI re-proof. Next owner-gated sequence: [`G468_NEXT_50_GATES.md`](../operator/G468_NEXT_50_GATES.md).
+**G468 consolidation (2026-07-10):** G229-G467 local foundations are integrated (storage no-IO hardening, notification taxonomy/correlation design, GA/GSC/monthly guards, WordPress draft helpers, image compliance V3, Client Portal boundary tests, Puriva pack catalog, future-module contracts, AI budget/routing truth labels, security inventories, UI testability). Staging/production columns remain **Not proven** for R2, email, GA/GSC, WordPress live draft, image generation, and target-env AI re-proof. Next owner-gated sequence: [`G468_NEXT_50_GATES.md`](../operator/G468_NEXT_50_GATES.md).
+
+**G673–G684 stale-claim sweep (2026-07-10):** Docs-wide scan found no affirmative “live integration proven” / “email|Google|WordPress|R2|image|SaaS ready” product claims in this matrix. Do **not** promote local PASS / disabled-safe / config-shape rows to staging or production proof. OpenRouter remains **local controlled live only** (G77b); all other live integrations remain **Not proven** on staging/production.
```

---

## G676 — “email ready”

### Finding

No “email ready” affirmative claim in main-owned docs. Email row correctly: no-send / no live send / inbox missing.

### Proposed patch — `docs/operator/deferred-scope-register.md`

```diff
diff --git a/docs/operator/deferred-scope-register.md b/docs/operator/deferred-scope-register.md
--- a/docs/operator/deferred-scope-register.md
+++ b/docs/operator/deferred-scope-register.md
@@
-**Email clarification:** transactional workflow notifications (approval, handoff, delivery status) are in scope for proof; marketing email campaigns remain still-deferred.
+**Email clarification:** transactional workflow notifications (approval, handoff, delivery status) are in scope for proof; marketing email campaigns remain still-deferred. Do **not** label email “ready” — no-send/outbox foundation and local `SKIPPED` behavior are not live Resend proof; in-system inbox remains deferred.
```

---

## G677 — “Google ready”

### Finding

No “Google ready” affirmative claim. GA/GSC correctly config-shape / no OAuth token store.

### Proposed patch — `docs/operator/deferred-scope-register.md`

```diff
@@
-| GA/GSC live sync proof | Live integration | Snapshot-first locally; live OAuth/sync proof required — runbook: [`docs/runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md`](../runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md) |
+| GA/GSC live sync proof | Live integration | Snapshot-first locally; live OAuth/sync proof required — runbook: [`docs/runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md`](../runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md). Config-shape / env presence is **not** “Google ready”. |
```

---

## G678 — “WordPress ready”

### Finding

Main docs correctly split draft-prep local PASS vs live draft not executed vs publish frozen. Ambiguous operator phrasing exists outside main-owned files (proposal-only below).

### Proposed patch — `docs/runbooks/PURIVA_LAUNCH_GATE.md` (area 7 label hygiene)

```diff
-| 7 | WordPress draft/handoff readiness | **PASS (local/operator-ready)** / **PLANNED, NOT EXECUTED (live draft proof)** | ...
+| 7 | WordPress draft/handoff readiness | **PASS (local draft-prep only)** / **PLANNED, NOT EXECUTED (live draft proof)** — not “WordPress ready” for live HTTP or publish | ...
```

(Keep existing evidence text; only tighten the Verdict cell.)

---

## G679 — “R2 ready”

### Finding

No “R2 ready” affirmative claim in main-owned docs. R2 rows correctly disabled-safe / no real bucket IO.

### Proposed patch — `docs/operator/deferred-scope-register.md`

```diff
-| R2 real-bucket proof | Live integration | G89-G93 local no-IO readiness/proof-stage/storage-key guard foundation complete; real bucket IO proof still required |
+| R2 real-bucket proof | Live integration | G89-G93 local no-IO readiness/proof-stage/storage-key guard foundation complete; real bucket IO proof still required. Local disabled-safe PASS is **not** “R2 ready” / live storage proven. |
```

---

## G680 — “image provider ready”

### Finding

No affirmative “image provider ready”. IMAGE_GENERATION_PROOF (Lane 8 exclusive — proposal-only, not applied) has “Unit + integration proven” for Phase B foundation — clarify as local tests only if main/Lane 8 integrates.

### Proposed patch — `docs/runbooks/PURIVA_LAUNCH_GATE.md` (areas 4–5)

No verdict change. Optional one-line under §4 blockers:

```diff
+- No claim of “image provider ready” — provider not selected; Phase B disabled-safe foundation ≠ live provider proof
```

### Proposed patch — `docs/runbooks/IMAGE_GENERATION_PROOF.md` (Lane 8 conflict — main may forward)

```diff
-| Image generation Phase B disabled-safe foundation | **New** — ... Unit + integration proven; see §7. |
+| Image generation Phase B disabled-safe foundation | **New** — ... Unit + integration tests proven **locally** (no live provider call); see §7. Not “image provider ready”. |
```

---

## G681 — “SaaS ready”

### Finding

Only appears as **forbidden** / `saas_later` / `multiTenantSaasReady: false`. No affirmative SaaS-ready claim. No main-doc patch required beyond preserving existing language.

### Optional affirmation — `docs/operator/deferred-scope-register.md`

```diff
+| **SaaS conversion / multi-tenant productization** | Second-client modularity, onboarding, pack registry DB | G52-B productization track | Deferred — never label “SaaS ready”; packs remain `saas_later` |
```

(Only if the existing Deferred row lacks the never-label clause; otherwise leave as-is.)

---

## G682 — Exact patch proposals (this file)

This document is the G682 deliverable for main-owned files.

---

## G683 — Non-shared safe patches applied by Lane 18

| File | Change | Why safe |
|------|--------|----------|
| `docs/operator/README.md` | Replaced stale `cc40160` “ready for controlled…” with current baseline + explicit NO/BLOCKED/not-proven labels | Not main-owned; not Lane 1–17 exclusive closeout; low conflict |
| `docs/ai-delivery/client-onboarding-runbook.md` | Local-only wording + explicit not production / not launch / not live-integration proven | Not main-owned; not Lane 1–17 exclusive closeout |

### Proposal-only (not applied — conflict or ownership)

| File | Issue | Suggested fix |
|------|-------|---------------|
| `docs/ai-delivery/WORDPRESS_PREPARED_DRAFT_FOUNDATION.md` | “ready for operator testing” | Keep local scope; add “not WordPress live/publish ready” (Lane 7 owns) |
| `docs/operator/first-client-dry-run-checklist.md` | “what is ready for WordPress” | Prefer “ready for **local WordPress draft-prep handoff**” (Lane 16 risk) |
| `docs/operator/module-completion-matrix.md` | “Local/admin private upload/download proof exists” for R2 | Add “disabled-safe / not live R2 proven” (Lane 16 risk) |
| `docs/runbooks/IMAGE_GENERATION_PROOF.md` | “Unit + integration proven” | See G680 (Lane 8) |

---

## G684 — Lane validation notes for main

1. Do not flip any Puriva Launch area to PASS from this sweep.
2. Do not change INTEGRATIONS_TRUTH_MATRIX staging/production columns from **Not proven**.
3. Do not move live proof items out of deferred-scope-register.
4. `docs/operator/G708_NEXT_GATES.md` did not exist at sweep time — when Lane 20 creates it, include: “G673–G684 stale-claim sweep closed; no production/launch/live-integration ready claims authorized.”
5. Re-scan after other lanes land exclusive docs; Lane 20 G704 is the final stale-claim pass.

---

## Highest-risk stale / ambiguous claims found (priority for main)

1. **`docs/STATUS.md`:** “Knowledge integration proven” — can be misread as live/production integration proof → G673 patch.
2. **`docs/operator/README.md`:** Stale SHA + unqualified “ready” (patched by Lane 18).
3. **`docs/runbooks/PURIVA_LAUNCH_GATE.md`:** SEC-B1 “FIXED (local, uncommitted)” may be stale relative to `66dcb74` and can confuse launch readiness → G674 patch.
4. **`docs/ai-delivery/client-onboarding-runbook.md`:** “ready for controlled DCA-operated client work” without launch/production negation (proposal-only).
5. **`docs/runbooks/IMAGE_GENERATION_PROOF.md`:** “Unit + integration proven” without “local / no live provider” adjacent (Lane 8).
6. **`docs/ai-delivery/WORDPRESS_PREPARED_DRAFT_FOUNDATION.md`:** “ready for operator testing” without explicit not-live/not-publish (Lane 7).

---

## Explicit non-findings (good)

| Phrase | Affirmative product claim found? |
|--------|----------------------------------|
| production ready | No (only forbidden lists / “Not production-ready” / Production readiness **NO**) |
| launch ready | No |
| live integration proven | No exact phrase |
| email ready | No |
| Google ready | No |
| WordPress ready | No exact phrase (ambiguous “ready for WordPress” / “operator-ready” only) |
| R2 ready | No |
| image provider ready | No (stop-conditions forbid the claim) |
| SaaS ready | No (only forbidden / `saas_later`) |
