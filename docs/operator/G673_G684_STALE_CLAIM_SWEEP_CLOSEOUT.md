# G673–G684 Stale Claim Sweep Closeout (Lane 18)

**Status:** COMPLETE (docs scan + proposals + limited safe patches)  
**Agent:** Lane 18 subagent  
**Baseline:** `main` @ `66dcb74`  
**Date:** 2026-07-10  
**Commit/push/deploy:** none  

**Main proposal file:** [`_g673_g684_proposed_main_doc_updates.md`](./_g673_g684_proposed_main_doc_updates.md)

---

## Per-task status

| Gate | Task | Status | Notes |
|------|------|--------|-------|
| G673 | Search stale "production ready" | **DONE** | No affirmative product claim. Forbidden-list / Production readiness **NO** only. Soften STATUS “Knowledge integration proven” via main proposal. |
| G674 | Search stale "launch ready" | **DONE** | No affirmative claim. Puriva Launch **BLOCKED**. SEC-B1 “uncommitted” wording proposed for main refresh. |
| G675 | Search stale "live integration proven" | **DONE** | Exact phrase absent. Closest: STATUS “Knowledge integration proven” (local smoke). Matrix affirmation proposed. |
| G676 | Search stale "email ready" | **DONE** | Exact phrase absent. Deferred-register clarification proposed. |
| G677 | Search stale "Google ready" | **DONE** | Exact phrase absent. GA/GSC config-shape ≠ ready; deferred-register clarification proposed. |
| G678 | Search stale "WordPress ready" | **DONE** | Exact phrase absent. Ambiguous “operator-ready” / “ready for WordPress” → proposals only (Lane 7/16 conflict). |
| G679 | Search stale "R2 ready" | **DONE** | Exact phrase absent. Deferred-register clarification proposed. |
| G680 | Search stale "image provider ready" | **DONE** | Exact phrase absent (stop-conditions forbid it). IMAGE_GENERATION_PROOF “Unit + integration proven” → Lane 8 proposal-only. |
| G681 | Search stale "SaaS ready" | **DONE** | Only forbidden / `saas_later` / `multiTenantSaasReady: false`. No affirmative claim. |
| G682 | Produce exact patch proposals | **DONE** | Written to `_g673_g684_proposed_main_doc_updates.md` |
| G683 | Apply non-shared safe patches | **DONE** | Applied 2 low-risk files (below). Main-owned + exclusive-lane files proposal-only. |
| G684 | Lane validation | **DONE** | Confirmed main-owned files untouched by this lane; `.cursor/settings.json` untouched; no commit. |

---

## Search method

Docs-wide case-insensitive ripgrep over `docs/` for:

- `production ready` / `production-ready` / `ready for production`
- `launch ready` / Puriva Launch PASS language
- `live integration proven` / `integration proven`
- `email ready` / Resend ready / transactional ready (affirmative)
- `Google ready` / GA/GSC ready / OAuth ready (affirmative)
- `WordPress ready` / WP ready (affirmative)
- `R2 ready` / storage ready (affirmative live)
- `image provider ready` / image generation ready (affirmative)
- `SaaS ready` / multi-tenant ready

Also scanned related overclaim patterns: `fully connected`, `staging proven` (as product claim without historical qualifier), `100%` local labels (kept when paired with deferred columns).

---

## Search results summary

### Affirmative overclaims (exact target phrases)

| Phrase | Affirmative hits in docs | Disposition |
|--------|--------------------------|-------------|
| production ready | **0** product claims | Keep forbidden lists; STATUS already **NO** |
| launch ready | **0** | Puriva gate **BLOCKED** |
| live integration proven | **0** exact | Soften “Knowledge integration proven” |
| email ready | **0** | Clarify deferred register |
| Google ready | **0** | Clarify deferred register |
| WordPress ready | **0** exact | Ambiguous nearby phrasing only |
| R2 ready | **0** | Clarify deferred register |
| image provider ready | **0** | Clarify IMAGE proof local tests |
| SaaS ready | **0** affirmative | Only `saas_later` / forbidden |

### Highest-risk ambiguous / stale claims

| # | File | Snippet / issue | Risk | Action |
|---|------|-----------------|------|--------|
| 1 | `docs/STATUS.md` | “Knowledge integration proven via `smoke:ai-knowledge-context`” | Medium — “proven” without “local” | Main proposal (G673) |
| 2 | `docs/operator/README.md` | Stale `cc40160` + “is ready for controlled…” | Medium — outdated SHA / soft ready | **Patched** |
| 3 | `docs/runbooks/PURIVA_LAUNCH_GATE.md` | SEC-B1 “FIXED (local, uncommitted)” | Medium — may be stale vs `66dcb74`; launch confusion | Main proposal (G674) |
| 4 | `docs/ai-delivery/client-onboarding-runbook.md` | “ready for controlled DCA-operated client work” | Medium — missing launch/prod negation | **Patched** |
| 5 | `docs/runbooks/IMAGE_GENERATION_PROOF.md` | “Unit + integration proven” (Phase B) | Medium — can read as provider ready | Proposal-only (Lane 8) |
| 6 | `docs/ai-delivery/WORDPRESS_PREPARED_DRAFT_FOUNDATION.md` | “ready for operator testing” | Low–Medium | Proposal-only (Lane 7) |
| 7 | `docs/operator/first-client-dry-run-checklist.md` | “what is ready for WordPress” | Low | Proposal-only (Lane 16) |
| 8 | `docs/operator/module-completion-matrix.md` | R2 “private upload/download proof exists” | Low | Proposal-only (Lane 16) |

### Intentional / safe occurrences (do not patch)

- Forbidden-phrase tables: `ENV_SHAPE_VS_LIVE_PROOF_LABELS.md`, `proof-state-vocabulary.md`, `integration-truth-badge-design.md`, `CLIENT_OPERATING_PACK_SAAS_LATER.md`, `G52_OWNER_DISPOSITION.md`
- “Not production-ready” / “Production readiness: NO” / “Puriva Launch: BLOCKED”
- Historical “Staging proven (G46d/G47)” with production frozen — keep as historical evidence, not new live-integration claim
- Module stage names like “Stage 8 - Production Ready” in promotion path docs (lifecycle vocabulary, not current product claim)
- `READY (local)` / `100% local/operator-ready` when paired with deferred live columns in STATUS

---

## Exact patches

### Applied (G683)

1. **`docs/operator/README.md`** — Current Operating Position refreshed to `66dcb74`, explicit Production **NO** / Puriva **BLOCKED** / live proofs not claimed.
2. **`docs/ai-delivery/client-onboarding-runbook.md`** — Local-only wording; explicit not production / not launch / not live-integration proven.

### Proposed for main (do not apply from this lane)

See full diffs in [`_g673_g684_proposed_main_doc_updates.md`](./_g673_g684_proposed_main_doc_updates.md):

- `docs/STATUS.md` — Knowledge local smoke wording
- `docs/operator/deferred-scope-register.md` — email / Google / R2 “not ready” clarifiers
- `docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md` — G673–G684 affirmation (no column flips)
- `docs/runbooks/PURIVA_LAUNCH_GATE.md` — SEC-B1 + WordPress verdict hygiene; image not-ready line
- `docs/operator/G708_NEXT_GATES.md` — note when created by Lane 20

### Proposal-only (other-lane exclusive / conflict)

- `IMAGE_GENERATION_PROOF.md`, `WORDPRESS_PREPARED_DRAFT_FOUNDATION.md`, first-client checklist, module-completion-matrix, security inventories, STORAGE/EMAIL/WP/IMAGE/CLIENT_PORTAL exclusive docs

---

## Files changed by this lane

| Path | Change type |
|------|-------------|
| `docs/operator/README.md` | Applied safe patch |
| `docs/ai-delivery/client-onboarding-runbook.md` | Applied safe patch |
| `docs/operator/_g673_g684_proposed_main_doc_updates.md` | Created (main proposals) |
| `docs/operator/G673_G684_STALE_CLAIM_SWEEP_CLOSEOUT.md` | Created (this file) |

**Not modified (ownership):** STATUS, deferred-scope-register, INTEGRATIONS_TRUTH_MATRIX, PURIVA_LAUNCH_GATE, G708_NEXT_GATES, `.cursor/settings.json`

---

## Validation (G684)

- Scan complete across `docs/`
- Main-owned files: **not edited** by this lane
- Applied patches: truth-label only; no code, schema, API, auth, secrets
- No commit / push / deploy
- Concurrent lane dirty tree observed (other lanes writing code/docs) — this lane limited to owned deliverables + 2 safe docs

---

## Mistakes

**0**

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**

1. Branch: `main` @ `66dcb74`
2. Files changed: 4 (2 applied + 2 created)
3. Commits: none
4. Validation: docs scan + ownership check
5. Manual QA: N/A (docs-only)
6. Blockers: none for this lane; main must integrate proposals
7. Remaining polish: Lane 20 G704 final stale-claim pass after exclusive docs land
8. Backend/API/auth/schema/VPS/deploy: **not touched**
