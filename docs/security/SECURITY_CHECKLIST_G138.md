# G138 Security Checklist Refresh

**Superseded for post-G148 operator use by:** [`SECURITY_CHECKLIST_G223.md`](./SECURITY_CHECKLIST_G223.md). Keep this file as the G138 historical record.

**Status:** Docs-only security checklist refresh for DCA OS Lite G138. No live calls, no secret reads, no staging or production mutation, no commit, and no deploy were performed while producing this document.

**Scope:** Current local/admin MVP, staging-readiness posture, production-readiness posture, and Puriva Launch blockers. This checklist intentionally records evidence status; it does not move any blocker to PASS without recorded proof in the source-of-truth docs.

**Primary sources:** [`docs/STATUS.md`](../STATUS.md), `docs/operator/deferred-scope-register.md` (archived reference; see Git history), [`docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md), [`docs/runbooks/PURIVA_LAUNCH_GATE.md`](../runbooks/PURIVA_LAUNCH_GATE.md), [`docs/operator/OPERATOR_RUNBOOK.md`](../operator/OPERATOR_RUNBOOK.md), [`docs/operator/ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md), [`docs/audit/DEPLOYMENT_SECURITY_CHECKLIST.md`](../audit/DEPLOYMENT_SECURITY_CHECKLIST.md), and [`docs/security/SECURITY_BOUNDARY_AUDIT.md`](./SECURITY_BOUNDARY_AUDIT.md).

---

## 1. Ground Truth Snapshot

| Area | Current truth |
|---|---|
| Staging | G46d/G47 staging deploy/smoke/proof is recorded as PASS on artifact/API context `/opt/dca/staging-artifacts/5e1ea5a`; further staging/VPS/prod work requires fresh explicit owner approval. |
| Production | Production readiness remains **NO**. G49 public read-only probes passed, but formal G49 closure still needs the owner-approval sentence; G50 production deploy is not executed. |
| Puriva Launch | **BLOCKED** pending live proof gates and product workflow gates; local-only or config-shape evidence is not launch proof. |
| Live integrations | No integration has staging or production live proof in the integration truth matrix. OpenRouter has local-only controlled live proof; R2, GA/GSC, WordPress live draft, image generation, and email still require owner-approved proofs. |
| Secrets | Values must never be committed, printed, logged, or inferred. Docs should name variables only. |

---

## 2. Security Checklist

### 2.1 Repository and Change Control

- [x] Docs-only scope for G138; no app source, schema, backend, auth, package, or migration changes required.
- [x] Protected source-of-truth files are report-only for G139-G141 in this block: `docs/STATUS.md`, `docs/operator/deferred-scope-register.md`, `docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`, and `docs/runbooks/PURIVA_LAUNCH_GATE.md`.
- [x] No commit or push performed.
- [ ] Before any future commit: run `git diff --check`, review changed docs only, then obtain explicit commit approval.
- [ ] Before any future push: obtain separate explicit push approval.

### 2.2 Secrets and Environment Handling

- [x] Secret values are not required for this docs block.
- [x] `.env`, `.env.local`, credential files, VPS env files, and production secrets were not read.
- [x] Environment references use names only, consistent with [`ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md).
- [ ] Future staging/prod proof logs must be reviewed before sharing to ensure no passwords, tokens, cookies, session hashes, or full `DATABASE_URL` values appear.

### 2.3 Authentication and Access

- [x] Local admin convention remains `admin@dca.local`; password must come from `$env:AUTH_SEED_TEST_PASSWORD` only when smokes are actually run.
- [x] No auth runtime behavior, Turnstile behavior, password reset, invite flow, session policy, tenant access, or RBAC code was changed.
- [ ] Client-facing production use remains blocked until launch/security gates are explicitly closed.
- [ ] Password reset, invite flow, project-specific client grants, role editing UI, and destructive user/tenant actions remain deferred unless separately scoped.

### 2.4 Tenant and Client Boundaries

- [x] Client-visible surfaces must remain final/client-safe only: no raw prompts, workflow runs, internal notes, costs, credentials, tenant IDs, technical logs, or storage internals.
- [x] Current launch gate still flags security prerequisites: SEC-B1 must be committed/validated before G50 and SEC-H1 should close before production G50.
- [ ] Target-environment tenant/client boundary re-verification is still required before any production claim.
- [ ] Client Portal approval UX is local/admin-operated MVP only until staging/browser proof is recorded.

### 2.5 Integrations and Live Call Boundaries

- [x] No live provider calls were made for this checklist.
- [x] OpenRouter live proof is local-only; staging/production live proof remains blocked.
- [x] R2 is disabled-safe locally; real bucket proof remains blocked.
- [x] GA/GSC is config-shape only; OAuth consent, token storage, refresh logic, and live sync are not proven.
- [x] WordPress draft-prep is local/operator-ready; live draft proof is planned but not executed; auto-publish remains deferred.
- [x] Email/outbox is no-send/local proof only; in-system notifications and live transactional email proof remain blocked.
- [x] Image generation has scaffold/disabled-safe planning; no live image provider is selected or proven.

### 2.6 Staging Readiness Security

- [x] Staging has historical PASS evidence, including explicit remote target guards for staging smoke scripts.
- [x] Any further staging refresh, migration, bootstrap, VPS, Docker, Caddy, DNS, or remote smoke execution requires fresh explicit owner approval.
- [ ] Staging bootstrap remains mutation-capable and must require `DCA_BOOTSTRAP_DATABASE_TARGET=staging`, approved staging `DATABASE_URL`, and write confirmation before any write mode.
- [ ] Staging env separation must be rechecked before any new staging execution block.

### 2.7 Production Readiness Security

- [x] Production readiness remains **NO**.
- [x] G49 public read-only probes are recorded as PASS, but formal G49 closure remains incomplete without the owner sentence.
- [x] G50 production deploy remains not executed and not authorized.
- [x] Production deploy, production migration, production env changes, production Caddy/container work, and production live integrations remain forbidden without separate explicit owner approval.
- [ ] Before G50, require rollback/restore evidence, env separation proof, credential storage proof, target tenant/client boundary proof, and updated integration truth.

---

## 3. Staging / Production Truth Sweep Notes

1. **Staging truth:** Staging is proven at the previously recorded artifact and smoke baseline only. It is not a standing authorization to refresh staging, run migrations, bootstrap admin data, call live providers, or perform VPS work.
2. **Production truth:** Production is reachable and has historical health/HSTS proof, but production readiness is still **NO**. G49 is not formally closed and G50 is not executed.
3. **Puriva Launch truth:** Puriva Launch remains blocked even if production deployment later becomes possible. Launch needs its own live proof gates and product workflow proof.
4. **Integration truth:** Config-shape and local proofs must not be rewritten as staging/production live proof. Each environment proof needs fresh, owner-approved evidence.

---

## 4. G139-G141 Report-Only Patch Notes

These notes are for the main agent. This block did **not** edit the protected files named below.

### Proposed `INTEGRATIONS_TRUTH_MATRIX.md` Patch

- Add a post-G138 note confirming the security checklist refresh found no integration row that should change from "Not proven" for staging or production.
- Clarify that G138 was docs-only and made no live provider calls, no R2 IO, no OAuth/sync, no WordPress HTTP call, no email send, no staging/prod probe, and no deploy.
- If SEC-B1/SEC-H1 wording is refreshed elsewhere, keep it as security prerequisite context only; do not represent it as integration proof.

### Proposed `STATUS.md` Patch

- Add a G138-G144 docs row: security checklist refreshed, test/smoke inventory generated from package scripts, validation command guards documented, operator runbook refreshed.
- Preserve current truth: staging proven historically; production readiness **NO**; G49 public probes PASS but formal closure pending owner sentence; G50 not executed; Puriva Launch blocked.
- State that G139-G141 were report-only proposals and protected docs were not edited by this subagent.

### Proposed Staging/Production Truth Patch

- Add a short truth-sweep note under the relevant staging/production section: "No new live calls, staging mutation, production mutation, VPS action, deploy, commit, or push occurred during G138-G144."
- Keep future staging and production action gated by explicit owner approval.
