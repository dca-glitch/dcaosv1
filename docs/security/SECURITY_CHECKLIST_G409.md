# G409 Security Checklist — Code-to-Doc Alignment (G409–G428)

**Status:** Docs-only security checklist refresh for DCA OS Lite G409–G428 (Security / redaction / readiness / operator lane). No live calls, no secret reads, no staging or production mutation, no commit, and no deploy were performed while producing this document.

**Scope:** Align operator/security language with actual local/no-live foundations after G223–G228 and concurrent G229–G408 lane work. This checklist records evidence status; it does **not** move any Puriva Launch or production blocker to PASS without recorded target-environment proof.

**Supersedes for operator use:** Prefer this document over [`SECURITY_CHECKLIST_G223.md`](./SECURITY_CHECKLIST_G223.md) for post-G228 alignment. G223 and G138 remain historical.

**Primary sources:** [`docs/STATUS.md`](../STATUS.md), [`docs/operator/deferred-scope-register.md`](../operator/deferred-scope-register.md), [`docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md), [`docs/runbooks/PURIVA_LAUNCH_GATE.md`](../runbooks/PURIVA_LAUNCH_GATE.md), [`docs/security/SECURITY_BOUNDARY_AUDIT.md`](./SECURITY_BOUNDARY_AUDIT.md), [`docs/operator/ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md), [`docs/operator/TEST_SMOKE_INVENTORY.md`](../operator/TEST_SMOKE_INVENTORY.md), [`docs/operator/VALIDATION_COMMAND_GUARDS.md`](../operator/VALIDATION_COMMAND_GUARDS.md).

**Code inspection (light, read-only):** Client Portal FINAL/storage-key shaping in `apps/api/src/core/client-portal.runtime.ts`; client-portal error safety in `client-portal-error-safety.ts`; storage-key boundary helpers in `apps/api/src/storage/storage-key-boundary.ts`; storage error redaction in `storage-error-redaction.ts`; admin-vs-client storage field policy; WordPress credential redaction in `wordpress-credentials-redaction.ts`; SEC-H1 regression in `apps/api/tests/integration/sec-h1-storage-key-leak.integration.test.ts`; staging remote refuse in `scripts/smoke-staging-security-baseline.mjs`; R2 proof-stage `clientSafe` flags in `r2-proof-stage.ts`.

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

- [x] Operator docs and inventories use **env names only** (see [`ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md) and [`SECRETS_REDACTION_INVENTORY.md`](./SECRETS_REDACTION_INVENTORY.md)).
- [x] G409 did not read `.env`, `.env.local`, VPS env files, or credential stores.
- [x] Local admin password convention remains `$env:AUTH_SEED_TEST_PASSWORD` only when authenticated smokes actually run; never print the value.
- [x] WordPress credential redaction helpers exist (`wordpress-credentials-redaction.ts`) with unit coverage.
- [x] Storage error redaction strips R2 secret-like fragments (`storage-error-redaction.ts`).
- [ ] **Gap (honest):** There is still no single shared `redactSecret()` logger sanitizer under `apps/api/src`. Redaction is practiced via narrow selects, omitted fields, domain helpers, and operator log review.
- [ ] Future staging/prod proof logs must be scrubbed of passwords, tokens, cookies, session hashes, full `DATABASE_URL`, and provider secrets before any share.

### 2.2 Storage keys hidden (SEC-H1 alignment)

- [x] Client Portal monthly-report and deliverable shaping uses `hasDocument` and intentionally excludes raw `storageKey` from client-facing payloads.
- [x] SEC-H1 integration regression exists: `sec-h1-storage-key-leak.integration.test.ts`.
- [x] Shared boundary helpers: `storage-key-boundary.ts`, serializer boundary unit tests, `admin-vs-client-storage-field-policy.ts`.
- [x] R2 proof-stage contract marks client-safe vs non-client-safe stages (`r2-proof-stage.ts` `clientSafe` flags).
- [ ] Target-environment re-verification of storage-key non-exposure remains required before any production claim.
- [ ] Real R2 bucket IO / signed-URL proof against a target bucket remains **deferred** (local disabled-safe only).

Inventory: [`STORAGE_KEY_REDACTION_INVENTORY.md`](./STORAGE_KEY_REDACTION_INVENTORY.md).

### 2.3 Client FINAL-only / client boundary surfaces

- [x] Client Portal monthly reports are gated to `status === "FINAL"` and non-archived.
- [x] `CLIENT_PORTAL_FORBIDDEN_PAYLOAD_KEYS` documents forbidden client keys (storageKey, provider metadata, costs, workflow runs, admin notes, etc.).
- [x] Local Client Portal leak hardening and FINAL guards are recorded as local foundations; staging/production Client Portal proof remains **BLOCKED**.
- [ ] Staging/production browser QA of FINAL-only and approval UX remains deferred.

Inventory: [`CLIENT_BOUNDARY_INVENTORY.md`](./CLIENT_BOUNDARY_INVENTORY.md).

### 2.4 Provider metadata and error redaction

- [x] Client-portal error safety strips stack traces, storage keys, and provider/workflow markers (`client-portal-error-safety.ts`).
- [x] Image generation client-safe helpers forbid prompt/provider/storageKey fields (`isFreeOfInternalOnlyFields`).
- [x] WordPress credential metadata redacts to host + presence flags only.
- [ ] Centralized provider-metadata redaction across all admin audit logs is not claimed; review proof logs before share.

Inventories: [`PROVIDER_METADATA_REDACTION_INVENTORY.md`](./PROVIDER_METADATA_REDACTION_INVENTORY.md), [`ERROR_REDACTION_INVENTORY.md`](./ERROR_REDACTION_INVENTORY.md).

### 2.5 Live proof gates (no overclaim)

- [x] No live provider calls were made for G409–G428.
- [x] Docs must distinguish: local unit/smoke proof ≠ staging proof ≠ production proof ≠ Puriva Launch.
- [x] Env-shape / config-shape readiness ≠ live proof (see [`ENV_SHAPE_VS_LIVE_PROOF_LABELS.md`](./ENV_SHAPE_VS_LIVE_PROOF_LABELS.md)).
- [ ] Any live proof requires explicit owner approval **before** the session starts, plus separate approvals for commit/push/deploy where applicable.

### 2.6 Production freeze

- [x] Production readiness remains **NO**.
- [x] G50 production deploy is not executed and not authorized by G409–G428 docs work.
- [x] Production deploy, production migration, production env changes, production Caddy/container work, and production live integrations remain forbidden without separate explicit owner approval.
- [x] MVP staging smoke allowlist excludes production host (`system.digitalcubeagency.net` is not a smoke target in `smoke-mvp-local.mjs`).
- [ ] Before G50: rollback/restore evidence, env separation, credential storage proof, tenant/client boundary re-proof, and updated integration truth.

Sweep: [`PRODUCTION_FREEZE_SWEEP.md`](./PRODUCTION_FREEZE_SWEEP.md).

### 2.7 Staging guard

- [x] `smoke:staging-security-baseline` refuses by default unless `DCA_SMOKE_REMOTE_TARGET=staging`.
- [x] `smoke:mvp:staging` requires explicit `MVP_SMOKE_API_BASE_URL`, HTTPS, and allowlisted staging host only.
- [x] Staging bootstrap remains mutation-capable and must require staging target guards + owner approval before write mode.
- [ ] Any further staging refresh, migration, bootstrap, VPS, Docker, Caddy, DNS, or remote smoke requires **fresh** explicit owner approval (historical PASS is not standing authorization).

Sweep: [`STAGING_GUARD_SWEEP.md`](./STAGING_GUARD_SWEEP.md).

### 2.8 Repository and change control

- [x] G409–G428 lane is docs + inventories (+ optional tiny safe unit tests); protected main-owned files are proposal-only (see temp proposed-main-docs file).
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

## 4. Related operator / security docs in this lane

| Doc | Gate |
|---|---|
| [`SECURITY_CHECKLIST_G409.md`](./SECURITY_CHECKLIST_G409.md) | G409 |
| [`SECRETS_REDACTION_INVENTORY.md`](./SECRETS_REDACTION_INVENTORY.md) | G410 |
| [`STORAGE_KEY_REDACTION_INVENTORY.md`](./STORAGE_KEY_REDACTION_INVENTORY.md) | G411 |
| [`CLIENT_BOUNDARY_INVENTORY.md`](./CLIENT_BOUNDARY_INVENTORY.md) | G412 |
| [`PROVIDER_METADATA_REDACTION_INVENTORY.md`](./PROVIDER_METADATA_REDACTION_INVENTORY.md) | G413 |
| [`ERROR_REDACTION_INVENTORY.md`](./ERROR_REDACTION_INVENTORY.md) | G414 |
| [`ENV_SHAPE_VS_LIVE_PROOF_LABELS.md`](./ENV_SHAPE_VS_LIVE_PROOF_LABELS.md) | G415 |
| [`PRODUCTION_FREEZE_SWEEP.md`](./PRODUCTION_FREEZE_SWEEP.md) | G416 |
| [`STAGING_GUARD_SWEEP.md`](./STAGING_GUARD_SWEEP.md) | G417 |
| [`VALIDATION_COMMAND_GUARDS.md`](../operator/VALIDATION_COMMAND_GUARDS.md) | G418 |
| [`TEST_SMOKE_INVENTORY.md`](../operator/TEST_SMOKE_INVENTORY.md) | G419 |
| [`OPERATOR_RUNBOOK.md`](../operator/OPERATOR_RUNBOOK.md) | G420 |
| [`NO_LIVE_PROOF_CATALOGUE.md`](../operator/NO_LIVE_PROOF_CATALOGUE.md) | G421 |
| [`LIVE_PROOF_APPROVAL_CHECKLIST.md`](../operator/LIVE_PROOF_APPROVAL_CHECKLIST.md) | G422 |
| [`OWNER_GATE_CHECKLIST.md`](../operator/OWNER_GATE_CHECKLIST.md) | G423 |
| [`LOCAL_ONLY_PROOF_TAXONOMY.md`](../operator/LOCAL_ONLY_PROOF_TAXONOMY.md) | G424 |
| [`G409_NEXT_GATES.md`](../operator/G409_NEXT_GATES.md) | G425 (lane roadmap notes; L12 owns final next-50) |

---

## 5. GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**

Backend/API/auth/schema/VPS/deploy touched: **no** (tiny unit test addition only if present under storage helpers).
Live proofs claimed: **no**.
Puriva Launch: remains **BLOCKED**.
Production readiness: remains **NO**.
