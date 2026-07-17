# G223 Security Checklist — Code-to-Doc Alignment

**Operator note (G409):** Prefer [`SECURITY_CHECKLIST_G409.md`](./SECURITY_CHECKLIST_G409.md) for post-G228 security/operator alignment. This G223 document remains historical.

**Status:** Docs-only security checklist refresh for DCA OS Lite G223. No live calls, no secret reads, no staging or production mutation, no commit, and no deploy were performed while producing this document.

**Scope:** Align operator/security language with actual local/no-live foundations after G89–G148 (and concurrent G149–G222 lane work). This checklist records evidence status; it does **not** move any Puriva Launch or production blocker to PASS without recorded target-environment proof.

**Supersedes for operator use:** Prefer this document over [`SECURITY_CHECKLIST_G138.md`](./SECURITY_CHECKLIST_G138.md) for post-G148 alignment. G138 remains historical.

**Primary sources:** [`docs/STATUS.md`](../STATUS.md), [`docs/operator/deferred-scope-register.md`](../operator/deferred-scope-register.md), [`docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md), [`docs/runbooks/PURIVA_LAUNCH_GATE.md`](../runbooks/PURIVA_LAUNCH_GATE.md), [`docs/security/SECURITY_BOUNDARY_AUDIT.md`](./SECURITY_BOUNDARY_AUDIT.md), [`docs/operator/ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md), [`docs/operator/TEST_SMOKE_INVENTORY.md`](../operator/TEST_SMOKE_INVENTORY.md), [`docs/operator/VALIDATION_COMMAND_GUARDS.md`](../operator/VALIDATION_COMMAND_GUARDS.md).

**Code inspection (light, read-only):** Client Portal FINAL/storage-key shaping in `apps/api/src/core/client-portal.runtime.ts`; SEC-H1 regression in `apps/api/tests/integration/sec-h1-storage-key-leak.integration.test.ts`; staging remote refuse in `scripts/smoke-staging-security-baseline.mjs`; staging host allowlist (production excluded) in `scripts/smoke-mvp-local.mjs`; R2 proof-stage `clientSafe` flags in `apps/api/src/storage/r2-proof-stage.ts`.

---

## 1. Ground Truth Snapshot

| Area | Current truth |
|---|---|
| Staging | Historical G46d/G47 PASS on artifact/API context `/opt/dca/staging-artifacts/5e1ea5a` only. Further staging/VPS work needs fresh explicit owner approval. |
| Production | Production readiness remains **NO**. G49 public read-only probes PASS; formal G49 closure still needs owner-approval sentence; G50 not executed. |
| Puriva Launch | **BLOCKED** until real target-environment proofs and product workflow gates close. Local/no-IO foundations are not launch proof. |
| Live integrations | Staging/production columns remain **Not proven** in the integrations truth matrix. Local controlled OpenRouter proof exists (G77b); R2 real bucket, live email, live GA/GSC, live WordPress draft, live image provider remain deferred. |
| Secrets | Values must never be committed, printed, logged, or inferred. Docs name variables only. `.cursor/settings.json` is untracked (`??`) and must stay out of commits. |

---

## 2. Security Checklist (aligned to code)

### 2.1 Secrets redaction and environment handling

- [x] Operator docs and inventories use **env names only** (see [`ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md)).
- [x] G223 did not read `.env`, `.env.local`, VPS env files, or credential stores.
- [x] Local admin password convention remains `$env:AUTH_SEED_TEST_PASSWORD` only when authenticated smokes actually run; never print the value.
- [ ] **Gap (honest):** There is no single shared `redactSecret()` utility found under `apps/api/src` during light inspection. Redaction is practiced via narrow selects, omitted fields, and operator log review — not a centralized logger sanitizer. Future proof logs must still be reviewed before sharing.
- [ ] Future staging/prod proof logs must be scrubbed of passwords, tokens, cookies, session hashes, full `DATABASE_URL`, and provider secrets before any share.

### 2.2 Storage keys hidden (SEC-H1 alignment)

- [x] Client Portal monthly-report and deliverable shaping uses `hasDocument` and intentionally excludes raw `storageKey` from client-facing payloads (`client-portal.runtime.ts` comments + mapping).
- [x] SEC-H1 integration regression exists: `sec-h1-storage-key-leak.integration.test.ts` asserts admin/client AI Delivery JSON must not include `"storageKey"`; download-reference handlers are the audited exception.
- [x] R2 proof-stage contract marks client-safe vs non-client-safe stages (`r2-proof-stage.ts` `clientSafe` flags).
- [ ] Target-environment re-verification of storage-key non-exposure remains required before any production claim.
- [ ] Real R2 bucket IO / signed-URL proof against a target bucket remains **deferred** (local disabled-safe only).

### 2.3 Client FINAL-only surfaces

- [x] Client Portal monthly reports are gated to `status === "FINAL"` and non-archived (`isClientPortalFinalMonthlyReportStatus` / visibility helpers).
- [x] Local Client Portal leak hardening and FINAL guards are recorded as local foundations (G120–G122); staging/production Client Portal proof remains **BLOCKED** (G123).
- [x] Client-visible surfaces must remain final/client-safe only: no raw prompts, workflow runs, internal notes, costs, credentials, tenant IDs, technical logs, or storage internals.
- [ ] Staging/production browser QA of FINAL-only and approval UX remains deferred.

### 2.4 Live proof gates (no overclaim)

- [x] No live provider calls were made for G223.
- [x] Docs must distinguish: local unit/smoke proof ≠ staging proof ≠ production proof ≠ Puriva Launch.
- [x] OpenRouter: local controlled live proof only (G77b); staging/production live AI re-proof still required for launch.
- [x] R2, GA/GSC, WordPress live draft, email send, image provider: local/no-IO or config-shape foundations only unless a separate owner-approved proof is recorded.
- [ ] Any live proof requires explicit owner approval **before** the session starts, plus separate approvals for commit/push/deploy where applicable.

### 2.5 Production freeze

- [x] Production readiness remains **NO**.
- [x] G50 production deploy is not executed and not authorized by G223–G227 docs work.
- [x] Production deploy, production migration, production env changes, production Caddy/container work, and production live integrations remain forbidden without separate explicit owner approval.
- [x] MVP staging smoke allowlist excludes production host (`system.digitalcubeagency.net` is not a smoke target in `smoke-mvp-local.mjs`).
- [ ] Before G50: rollback/restore evidence, env separation, credential storage proof, tenant/client boundary re-proof, and updated integration truth.

### 2.6 Staging guard

- [x] `smoke:staging-security-baseline` refuses by default unless `DCA_SMOKE_REMOTE_TARGET=staging` (guard unit coverage in `smoke-staging-security-baseline.guard.test.mjs`).
- [x] `smoke:mvp:staging` requires explicit `MVP_SMOKE_API_BASE_URL`, HTTPS, and allowlisted staging host only.
- [x] Staging bootstrap remains mutation-capable and must require staging target guards + owner approval before write mode.
- [ ] Any further staging refresh, migration, bootstrap, VPS, Docker, Caddy, DNS, or remote smoke requires **fresh** explicit owner approval (historical PASS is not standing authorization).

### 2.7 Repository and change control

- [x] G223–G227 lane is docs-only for this subagent; protected main-owned files are proposal-only at the time; the temporary proposal scratch file was later deleted during documentation consolidation.
- [x] No commit or push performed by this lane.
- [x] `.cursor/settings.json` observed untracked; do not `git add` it.
- [ ] Before any future commit: `git diff --check`, review changed docs/source only, explicit commit approval.
- [ ] Before any future push: separate explicit push approval.

---

## 3. Staging / Production / Launch Truth Sweep

1. **Staging truth:** Proven at the previously recorded artifact and smoke baseline only. Not a standing authorization for refresh, live providers, or VPS work.
2. **Production truth:** Reachable with historical health/HSTS evidence; readiness still **NO**; G49 not formally closed; G50 not executed.
3. **Puriva Launch truth:** Remains **BLOCKED** even if production deploy later becomes possible. Launch needs its own live proof gates.
4. **Integration truth:** Config-shape and local proofs must not be rewritten as staging/production live proof.

---

## 4. Related operator docs refreshed in this lane

| Doc | Gate |
|---|---|
| [`TEST_SMOKE_INVENTORY.md`](../operator/TEST_SMOKE_INVENTORY.md) | G224 |
| [`VALIDATION_COMMAND_GUARDS.md`](../operator/VALIDATION_COMMAND_GUARDS.md) | G225 |
| [`G227_NEXT_30_GATES.md`](../operator/G227_NEXT_30_GATES.md) | G227 |
| `temporary proposal scratch file (deleted during later consolidation)` | G226 + main-doc proposals |

---

## 5. GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**

Backend/API/auth/schema/VPS/deploy touched: **no**.
Live proofs claimed: **no**.
Puriva Launch: remains **BLOCKED**.
