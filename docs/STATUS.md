# DCA OS Lite — Status (Source of Truth)

**Last updated:** 2026-07-07 (G44 docs-only status alignment after G43 local re-check — current `main` at `a18dcc1`)
**Operator index:** [`docs/operator/OPERATOR_RUNBOOK.md`](./operator/OPERATOR_RUNBOOK.md)  
**Architecture map:** [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) § Current application map  
**Smoke matrix:** [`docs/runbooks/LOCAL_SMOKE_MATRIX.md`](./runbooks/LOCAL_SMOKE_MATRIX.md)  
**Staging gate:** [`docs/runbooks/STAGING_READINESS.md`](./runbooks/STAGING_READINESS.md)  
**Env inventory (names only):** [`docs/operator/ENV_READINESS_INVENTORY.md`](./operator/ENV_READINESS_INVENTORY.md)  
**Deferred scope:** [`docs/operator/deferred-scope-register.md`](./operator/deferred-scope-register.md)

---

## 1. Current branch / main status

| Item | State |
|------|--------|
| Branch | `main` synced with `origin/main` |
| Latest docs/local closeout commit | `a18dcc1` — `fix: clarify client monthly report copy`; G35 Phase B local smoke proof remains `217c11c`; G35 Phase C staging artifact source remains `5e1ea5a` |
| CI | Green through G38 `564e440`, G39 `691435c`, and G41 `a18dcc1`; G43 local re-check PASS |
| Working tree | Clean and synced with `origin/main` |
| Pre-staging local closeout (G35 Phase B) | **PASS** — full local pre-staging gate passed on `217c11c`; see §2.7 |
| Latest local pre-staging re-check (G43) | **PASS** — validate plus four focused local smokes passed on current `main`; no repo edits, commit/push/deploy, staging/VPS/prod; see §2.9 |
| Controlled refresh (G35 Phase C) | **PASS** — staging artifact refreshed from `5ee8389` to `5e1ea5a`; local validate PASS before artifact creation; staging API recreated; DB healthy; MVP smoke PASS; production untouched; see §2.8 |
| Production deploy | **None** — `system.digitalcubeagency.net` unchanged; production API/DB untouched during Phase C refresh |
| Staging deploy | **Phase C refresh COMPLETE on `5e1ea5a`.** Staging artifact, API, and web now current with commit `5e1ea5a`. Any further staging refresh/execution/migration requires fresh explicit owner approval. |
| Staging target (G1) | `staging.digitalcubeagency.net` exists and resolves to the same VPS as `system.digitalcubeagency.net`; staging responds with artifact context `/opt/dca/staging-artifacts/5e1ea5a`; health 200; web root 200 |
| Default AI execution | Local deterministic; live OpenRouter opt-in only |
| Work mode | Local-first on Windows PowerShell from `C:\dcaosv1` |

**Rule:** Merge to `main` does not authorize staging or production deploy. Explicit owner approval required before touching staging or production.

---

## 2. Latest closed blocks (Blocks 1–4)

| Block | Commit | Scope | CI |
|-------|--------|-------|-----|
| **1** — External integrations readiness | `136e93a` | Config-only readiness layer: `GET /api/v1/integrations/readiness`, `check:external-integrations-readiness`, `smoke:external-integrations-readiness:local`. No live calls, publish, sync, or bucket IO. | Green |
| **2** — Admin operations | `5308f19` | Read-only `GET /api/v1/admin/operations/summary`, dashboard Operational readiness panel, recovery runbook, `smoke:admin-operations:local`. | Green |
| **3** — UI density | `cc40160` | Dark-theme UI density consolidation for admin and client surfaces (CSS-only). No backend/schema/API/auth changes. | Green |
| **4** — Docs + operator runbook | `c7af674` | Consolidate STATUS, architecture map, smoke matrix, operator runbooks, env inventory, staging gate, deferred roadmap. Docs-only. | Green |
| **5A–5D-A** — Claude audit remediation | `2437c84` … `e54445f` | Admin tenant-read RBAC, fail-closed client boundary smokes, CI unit-test proof, cross-platform test globs, remote staging opt-in, bootstrap guard hardening. | Green |

Prior closeout baseline (still valid context): client approval happy-path `58db726`, production-readiness closeout pack `179dc04`.

### 2.1 Block 5D-B — pre-staging local closeout (2026-07-05)

**Result:** PASS with manual workaround. **Does not authorize G4 staging action or deploy.**

| Phase | Result | Proof (compact) |
|-------|--------|-----------------|
| 0 Preflight | PASS | `main` = `origin/main`; clean tree; `git diff --check` exit 0 |
| 1 No-service / local tests | PASS | `npm run validate`, `npm run test:unit`, `npm run test:integration`; syntax checks; guard tests |
| 1b Guard refusal proofs | PASS | Staging security baseline and bootstrap check both exit 1 with refusal text; no remote/DB execution |
| 2 Audit / Block 1–2 smokes | PASS | External integrations readiness; admin operations 16/16; client-role API boundary 48/48 |
| 3 Block A core smokes | PASS (manual fallback) | Puriva client portal boundary 153/153; remaining core smokes run individually — all PASS |

**Phase 3 manual core smokes (orchestrator fallback):** `smoke:ai-delivery-reviews`, `smoke:ai-seo-content-plan-pdf`, `smoke:ai-knowledge-context`, `smoke:client-portal-monthly-report:browser`, `smoke:monthly-report:browser`, `smoke:monthly-report:mi-context`. Final status: `PHASE3_MANUAL_CORE_PASS`.

**Audit remediation commits (5A–5D-A, on `main`):**

| Commit | Summary |
|--------|---------|
| `2437c84` | `fix(api): require admin role for internal tenant reads` |
| `8b084a2` | `test(smoke): fail closed on client boundary prerequisites` |
| `c26e241` | `test(ci): add unit test proof and remove integration false greens` |
| `acd8962` | `fix(api): use node test runner globs for cross-platform CI` |
| `5f37243` | `fix(smoke): require explicit opt-in for remote staging baseline` |
| `e54445f` | `fix(scripts): harden staging admin bootstrap guards` |

**Not performed during 5D-B:** staging/prod URLs, remote DB, bootstrap write, SSH/VPS/docker/DNS, deploy, commit, or push.

**Known issue:** `npm run smoke:staging-readiness:local` orchestrator can hang after Puriva smoke completes (local PowerShell/log/process handling). Manual fallback for remaining Block A core smokes succeeded. Before G4, fix orchestrator or explicitly accept the manual workaround — see [`STAGING_READINESS.md`](./runbooks/STAGING_READINESS.md).

**Next gate:** G4 staging action remains **blocked** until explicit owner approval. Local 5D-B PASS alone does not authorize staging infrastructure work or deploy.

---

### 2.2 G35 Phase C — controlled staging refresh proof (2026-07-07)

**Controlled refresh on commit `5e1ea5a`:** staging artifact refreshed from `5ee8389` to `5e1ea5a` (`docs: record staging discovery facts`). Local validation PASS before artifact creation. Staging API recreated; DB healthy (not recreated). Staging MVP smoke PASS. Production containers untouched. Full evidence recorded in §2.8.

**Staging DNS/infrastructure (read-only discovery, 2026-07-07):** `staging.digitalcubeagency.net` and `system.digitalcubeagency.net` both resolve to `167.233.42.59` / `2a01:4f8:1c18:cefe::1`; VPS hostname `DCA01`; Caddy has routes for both; staging and production have separate API/Postgres containers and loopback ports; both `/api/v1/health` endpoints return 200 with DB ready; staging web root 200 serving DCA OS v1 HTML; production web root 200 with different asset hashes. Staging compose context now confirmed at `/opt/dca/staging-artifacts/5e1ea5a`.

**Authoritative current state (2026-07-07 post-refresh):** G35 Phase C controlled refresh complete on commit `5e1ea5a`; staging artifact updated; staging API health 200; staging MVP smoke PASS; production containers untouched. Staging is now proven current with commit `5e1ea5a` (`docs: record staging discovery facts`). Future staging refresh/execution/migration/deploy requires fresh explicit owner approval. This docs reconciliation does not authorize further VPS, staging, production, deploy, DNS, migration, SSH, Docker, or Caddy action without explicit owner instruction.

**Original (pre-refresh, now superseded):** staging artifact `5ee8389` (see historical note below).

| Item | Current state (`5e1ea5a`) |
|------|---------------------------|
| Staging artifact context | `/opt/dca/staging-artifacts/5e1ea5a` |
| Staging API | `dcaosv1-staging-api` recreated; health 200 |
| Staging DB | `dcaosv1-staging-postgres` healthy; no migration run |
| Production API | `dcaosv1-api` untouched |
| Production DB | `dcaosv1-postgres` untouched |
| Staging web root | 200; serves DCA OS v1 assets |
| MVP smoke result | PASS — login/auth/modules/logout/token boundary |

**Historical note (pre-refresh `5ee8389`, 2026-07-05):**

Prior artifact `5ee8389` was deployed on 2026-07-05 with claimed Phase 8 Caddy web-root fix. Backups present at `/opt/dca/backups/docker-compose.yml.20260705-063309.bak`, `/opt/dca/backups/Caddyfile.20260705-063309.bak`, and `/opt/dca/apps/dcaosv1/staging/backups/pg-backup-staging-5ee8389-pre-migrate-20260705-043540.sql`. That state is now superseded by the controlled Phase C refresh to `5e1ea5a`.

### 2.3 G5 Puriva approval UX completion (2026-07-05)

**Result:** PASS — client portal approval UX closeout on `ec4c41c` (`polish(client): clarify Puriva approval UX`).

| Item | Evidence |
|------|----------|
| Changed area | Client portal approval UX |
| Validation | `git diff --check` PASS; `npm.cmd run -w @dca-os-v1/web check` PASS; browser QA PASS |
| CI | Green |
| Production / staging | Untouched |
| Working tree after push | Clean |
| Next block | Owner decision |

### 2.4 G6 Puriva launch cockpit completion (2026-07-05)

**Result:** PASS — G6 Wave 1 complete on `4eeac1e` (`feat(ops): add G6 Puriva launch cockpit and operating pack`).

| Item | Evidence |
|------|----------|
| Main additions | Puriva operational intake/compliance pack; admin daily operations cockpit; client portal wording/request-changes polish; SEO/content/asset/WordPress handoff docs tightening |
| Validation | `git diff --check` PASS; `npm.cmd run -w @dca-os-v1/web check` PASS; `npm.cmd run validate` PASS; browser QA PASS |
| CI | Green |
| Production / staging / VPS | Untouched |
| Working tree after push | Clean |
| Remaining warning-only item | Vite chunk-size warning during build only |
| Next block | Owner decision |

### 2.5 G6 Wave 2 compact delivery handoff lanes completion (2026-07-05)

**Result:** PASS — G6 Wave 2 complete on `95a92c9` (`polish(ops): compact delivery handoff lanes`).

| Item | Evidence |
|------|----------|
| Main additions | Compact AI Delivery lanes; WorkflowBriefs intake/compliance handoff clarity; SEO/content/WordPress draft-only handoff tightening; client-safe archive/report wording |
| Validation | Diff-only review PASS; earlier Wave 2 validation PASS (`git diff --check`, web check, full validate, browser QA) |
| CI | Green |
| Commit-script nuance | Local commit-script `npm.cmd run validate` later hit known Windows Prisma EPERM during `prisma:generate`; the script printed STOP, but the code commit/push still completed and CI green plus post-push verification superseded the local failure |
| Post-push verification | PASS — `main` synced with `origin/main`; remote `origin/main` points to `95a92c9`; working tree clean |
| Production / staging / VPS | Untouched |
| Remaining warning-only item | Vite chunk-size warning during build only; future PowerShell runner should stop commit/push when local validation fails |
| Next block | Owner decision |

### 2.6 G7 Block 2 Puriva operational data path completion (2026-07-05)

**Result:** PASS — Puriva intake now connects to AI Knowledge, WorkflowBriefs, SEO planning, and AI Delivery handoff on `8cb41e2` (`polish(ops): connect Puriva intake to delivery path`).

| Item | Evidence |
|------|----------|
| Main additions | Puriva intake now feeds AI Knowledge / WorkflowBriefs / SEO plan / AI Delivery handoff; WorkflowBriefs readiness cues are clearer; AI Knowledge operating links are clarified; SEO/content/WordPress draft-only handoff is aligned to verified Puriva context |
| Validation | Diff-only review PASS; web check PASS; full validate PASS; browser QA PASS (`smoke:workflow-brief-publication-handoff:browser`, `smoke:ai-delivery-workflow:browser`); additional handoff-align agent also passed `smoke:ai-delivery-reviews` after Prisma EPERM recovery |
| CI | Green |
| Push | PASS — `main` synced with `origin/main` after commit/push |
| Boundaries preserved | Admin-only / client-safe / draft-only boundaries preserved; no backend/schema/auth changes |
| Production / staging / VPS | Untouched |
| Next block | Owner decision |

### 2.7 G35 Phase B — browser smoke stabilization closeout (2026-07-07)

**Result:** PASS — local pre-staging gate closed on `217c11c` (`test: stabilize G35 Phase B browser smokes`).

| Item | Evidence |
|------|----------|
| Scope | Smoke/runner stabilization only in `scripts/smoke-auth-invite-boundary-browser-local.mjs`, `scripts/smoke-browser.ps1`, `scripts/smoke-client-portal-populated-delivery-browser-local.mjs`, `scripts/smoke-dashboard-data-backed-browser-local.mjs`, `scripts/smoke-mi-operator-browser-local.mjs`, `scripts/smoke-monthly-metrics-import-browser-local.mjs`, and `scripts/smoke-roles-permissions-browser-local.mjs` |
| CI | Green on `217c11c` |
| Local gate | `npm.cmd run smoke:pre-staging:local` PASS — local repo gate complete |
| Browser drift blockers | Resolved for the Phase B browser smoke set above |
| Prisma EPERM | Known local Windows lock issue; recover by stopping the locking Node process, removing the generated Prisma client, and rerunning validation/smoke once |
| Deploy state | No VPS, staging, or production deploy performed |
| Boundaries preserved | No app, backend, API, schema, auth, or business-logic changes |

### 2.8 G35 Phase C — controlled staging refresh closeout (2026-07-07)

**Result:** PASS — controlled refresh of staging on `5e1ea5a` (`docs: record staging discovery facts`). **Base:** `217c11c` Phase B proof (`test: stabilize G35 Phase B browser smokes`). **Scope:** docs-only discovery, local validation, artifact creation/upload, controlled VPS artifact refresh, staging API recreation, admin bootstrap verification, and MVP smoke pass.

| Item | Evidence |
|------|----------|
| Artifact source commit | `5e1ea5a` (`docs: record staging discovery facts`) |
| Local pre-artifact validation | PASS — `npm.cmd run validate` clean before artifact creation |
| Artifact creation + upload | Local tar: `dcaosv1-5e1ea5a.tar` → remote temp `/tmp/dcaosv1-5e1ea5a.tar` → extracted to `/opt/dca/staging-artifacts/5e1ea5a` |
| Staging compose context update | `5ee8389` → `5e1ea5a` (verified `docker-compose.yml` points to new artifact) |
| Staging API recreation | Only `dcaosv1-staging-api` recreated with new artifact context; health 200 confirmed |
| Staging DB handling | `dcaosv1-staging-postgres` remained healthy (not recreated); no schema migration needed per `git diff 5ee8389..5e1ea5a` (no Prisma schema delta) |
| Prisma migrate deploy | Not performed — no pending migrations detected for staging DB |
| Admin bootstrap | Explicit DCA_BOOTSTRAP_DATABASE_TARGET=staging + DCA_BOOTSTRAP_CONFIRM_STAGING_ADMIN guard passed; secrets not printed |
| Staging MVP smoke | Login 200, auth/me 200, modules/current 200, logout 200, reused token 401 — PASS |
| Final post-proof | Staging health 200 with DB ready, staging web root 200, production health read-only 200, staging compose context confirmed at `5e1ea5a` |
| Production containers | `dcaosv1-api`, `dcaosv1-postgres` untouched; no production changes |
| Caddy / DNS / routing | Not modified during refresh |
| Deploy state | Controlled VPS artifact refresh only — no code push, no staging CI/migration deploy, no production touch |
| Boundaries preserved | Docs-only update + discovery facts recorded in STATUS.md §2.2; no runtime code changes, no schema changes, no secret exposure |

### 2.9 G38–G43 local/docs alignment closeout (2026-07-07)

**Result:** PASS for the latest docs/local alignment baseline on `main` at `a18dcc1`. **Does not authorize staging, VPS, production, deploy, migration, Docker, Caddy, or secrets work.** G35 Phase C remains the latest controlled staging refresh baseline; G43 is the latest local pre-staging re-check baseline.

| Gate | Commit / proof | Scope | Result |
|------|----------------|-------|--------|
| G38 | `564e440` | AI Delivery admin copy polish | CI green; no backend/API/auth/schema/VPS/deploy changes |
| G39 | `691435c` | Monthly Report admin copy polish | CI green; no backend/API/auth/schema/VPS/deploy changes |
| G41 | `a18dcc1` | Client Portal monthly report copy polish | CI green; no backend/API/auth/schema/VPS/deploy changes |
| G42 | Discovery only | Local closure/docs alignment discovery | No edits; no blockers |
| G43 | Local re-check | Pre-staging readiness re-check after copy polish | PASS; no repo edits; no commit/push/deploy/staging/VPS/prod |

**G43 proof recorded:**

- `npm.cmd run validate`: PASS
- `smoke:client-portal:populated-delivery:browser`: PASS
- `smoke:client-portal:edge-cases:browser`: PASS
- `smoke:client-portal:sparse-delivery:browser`: PASS
- `smoke:monthly-report:local`: PASS
- Final git status: clean/synced on `main`
- No repo edits, no commit, no push, no deploy, no staging/VPS/prod touch

**G43 runtime-order lesson:** for future runtime gates, stop local Node processes first, remove the generated Prisma client folder only if needed, run `npm.cmd run validate` before starting API/Web, then start API/Web only after validate passes and run smokes. This avoids Windows Prisma DLL locks and preserves real process-exit-code capture.

## 3. Module readiness (local admin-operated)

Percentages are **local MVP readiness**, not production-proven. See [`docs/STATUS_COMPLETION.md`](./STATUS_COMPLETION.md) for detail.

| Module / area | Local readiness | Safe for admin now | Not production-proven |
|---------------|-----------------|--------------------|------------------------|
| **Core platform** (auth, tenant, modules, RBAC) | **100% local-skeleton + proven-RBAC** | Core app foundation skeleton: auth structure protected by check:auth-skeleton, login/logout routes scaffold (501 Not Implemented where intended), session persistence BLOCKED (SESSION_DB_RUNTIME_BLOCKED), permission/module enforcement skeleton-only and not wired. Operator/admin RBAC proven: tenant switch, module entitlements UI, admin login, ClientUserAccess grant/revoke, client-level isolation, admin settings. Client access boundary proven: client portal projects hidden before grant/visible after (smoke:client-access:local), FINAL-only reporting, unrelated-client blocking | Session persistence deferred; full auth endpoints deferred; permission/module enforcement deferred; invite/reset flows, Turnstile on staging, OAuth/OIDC/MFA remain deferred |
| **AI Delivery** | **100% local/operator-ready** | Full local operator sequence: project/month → brief/context handoff → workflow run visibility → content plan → content drafts → reviews → package → deliverables → WordPress draft-prep handoff → monthly report/client-safe archive handoff | Live AI provider, live WP publish, live GA/GSC, live R2 IO, Google Docs live export, staging/environment proof, production readiness |
| **Workflow Briefs / context composition** | **100% local/operator-ready** | Intake → submit → approved KB/context → MI/SEO runs → production plan → drafts → AI Delivery handoff; AI SEO lives inside Workflow Briefs | Knowledge picker (6C-v2) and per-brief audit (6D) remain deferred; live provider, staging proof, and production readiness stay deferred |
| **AI Knowledge / Context layer** | **100% local/operator-safe** | Approved-only context path, tenant/client/project isolation, injection sanitization, missing-context warnings, safe snapshot metadata, and WorkflowBriefs context usage are smoke-proven | Vector search, live provider execution, staging proof, production readiness, live WordPress, live GA/GSC, and live R2 remain deferred |
| **AI SEO planning + content drafts** | **100% local/operator-ready** | WorkflowBriefs MI/SEO outputs → production/content plan → content objectives → draft generation/review → PDF/export handoff status → AI Delivery handoff are locally smoke-proven for admin/operator use | Live crawling, GSC/GA sync, live provider execution, Google Docs live export, live R2 IO, live WordPress, staging/environment proof, production readiness |
| **Market Intelligence** | **100% local/operator-ready + client-safe** | Admin MI workflow: projects, sources, research runs, insights, handoffs; AI Delivery integration. Client-facing MI summary: read-only delivery-summary endpoint (approved/READY/APPLIED handoffs only, no internal fields) | Live AI, scraping |
| **Monthly Reports** | **100% local/client-safe handoff** | Admin CRUD, PDF, approved metrics snapshots, MI context, and client FINAL-only archive/report handoff are smoke-proven for the approved local scope | Live GA/GSC sync, client metrics automation, staging/environment proof, production readiness |
| **Client Portal read-only/archive** | **100% local/client-safe** | Read-only archive, FINAL monthly reports, pending approvals happy-path, approval/report polish, and boundary smokes are complete for the approved local/client-safe scope | Magic links, public share links, full comments, staging/environment proof, production readiness |
| **Private storage disabled-safe foundation** | **100% local-safe** | R2-disabled mode is expected and safe locally; upload/download-reference helpers are guarded, return `R2_STORAGE_NOT_CONFIGURED` when config is absent, and do not persist storage references without required R2 config | Live R2 real-bucket proof, staging/env proof, and production storage readiness remain deferred |
| **Deliverable handling** | **100% local/operator-client-safe** | Admin/operator deliverables support upload/download-reference/open, ready/revision/accept/archive/restore, reviews, WordPress draft prep, Google Docs export handoff, monthly report document handoff, generated PDF storage, and client FINAL-only visibility with safe `downloadReference`/`exportUrl` shapes | Live R2 real-bucket proof, live Google export/OAuth, live WordPress publish, staging/env proof, and production readiness remain deferred |
| **WordPress draft-prep handoff** | **100% local/operator-ready** | Draft preparation and operator handoff are complete for the approved local/admin workflow | Live publish, client-triggered publish, staging/environment proof, production readiness |
| **WordPress disabled-safe publish gate** | **100% local-safe** | Publish gate metadata and disabled-safe smokes prove local default safety when publish is not enabled | Live publish, client-triggered publish, staging/environment proof, production readiness |
| **Puriva Operating Pack v1** | **100% local/admin-operational pack** | Local/admin-operational closeout complete | Production readiness remains deferred (~60–65% baseline); live provider, live WordPress publish, GA/GSC, R2 live IO, production deploy, and incident/rollback execution stay deferred |
| **Admin cockpit / daily operations** | **100% local/admin-operational** | Ready now / Needs review / Blocked-waiting queues, discoverable first-client path, complete handoffs into WorkflowBriefs, AI Delivery, Monthly Reports preview, Client Portal archive preview, Market Intelligence, and Finance Lite, explicit deferred/gated labeling | Environment proof, deployment, and live execution remain gated |
| **External integrations readiness** | Block 1 closed | Config-shape checks only | Live provider, WP, R2 IO, GA/GSC sync |
| **Admin operations / recovery** | Block 2 closed | Dashboard panel, operations summary API, recovery hints | Durable closeout store (manual run only) |
| **Finance Lite admin foundation** | **100% local/admin-safe foundation** | Admin finance records are smoke-proven for vendors/services/bills/invoices/credit notes/recurring/ledger boundaries where implemented; finance admin browser and ledger smokes passed for local operator use | Real payment collection, Stripe/payment provider proof, bank feeds, tax/legal/accounting production claims, production invoicing readiness |
| **Audit/activity feed foundation** | **100% local/operator-safe foundation** | `AuditLog`/event feed/dashboard recent activity/operator visibility are smoke-proven locally through audit activity and dashboard audit feed browser gates | SIEM/security audit, compliance-grade audit log, production monitoring, durable incident observability stack |
| **Email/outbox disabled-safe foundation** | **100% local-safe foundation** | Read-only tenant-scoped outbox/local notification records are smoke-proven; local provider remains non-sending and reports `SKIPPED` without provider delivery | Real sending, SMTP/provider proof, background queues, deliverability, production notification readiness |
| **UI / UX polish (Dark Nebula / dense admin)** | **100% local/admin-readable baseline** | Compact Dark Nebula admin/client readability and density baseline is closed for current local surfaces | Full design-system migration, full redesign, staging/environment proof, production readiness |

---

## 4. Current local readiness state

**Safe to run locally (admin-operated, no deploy):**

- `npm.cmd run validate` — prisma generate + check + build all workspaces
- `npm.cmd run smoke:external-integrations-readiness:local` — config shape only
- `npm.cmd run smoke:admin-operations:local` — admin summary + client boundary
- `node scripts/smoke-client-approval-happy-path-local.mjs` — when `AUTH_SEED_TEST_PASSWORD` set
- `npm.cmd run smoke:staging-readiness:local` — Block A focused subset
- `npm.cmd run smoke:production-readiness:local` — broad closeout (long; restarts API)

**Required local env (names only):** `DATABASE_URL`, `AUTH_SEED_TEST_PASSWORD` for authenticated smokes. See [`ENV_READINESS_INVENTORY.md`](./operator/ENV_READINESS_INVENTORY.md).

**Typical local integration statuses (Block 1):**

| Category | Typical status | Meaning |
|----------|----------------|---------|
| AI provider | `configured_shape_ok` (gateway `local`) | Deterministic default |
| WordPress | `disabled` | Publish not enabled |
| R2 | `disabled` | Bucket env absent |
| GA/GSC | `disabled` | Sync not enabled |

---

## 5. What is safe / admin-operated now

- Local login/logout (auth skeleton-only; real auth endpoints return 501 where intended; session persistence BLOCKED), tenant context/switch, module entitlements UI, owner/admin RBAC (proven locally)
- Client-level access isolation (ClientUserAccess grant/revoke, client portal boundaries, FINAL-only reporting) smoke-proven
- AI Delivery deterministic workflow chain (local gateway default)
- AI Knowledge / Context layer (approved-only context path, tenant/client/project isolation, injection sanitization, safe snapshot metadata, WorkflowBriefs context usage)
- Market Intelligence admin MVP (findings, summaries, handoffs, delivery bridge) + client-facing MI read-only summary (approved handoffs only, delivery-summary endpoint)
- Monthly report admin lifecycle + client FINAL-only portal archive
- Client portal read-only archive, monthly reports, approval happy-path (when seeded)
- Admin daily operations cockpit with separated ready/review/blocked lanes
- AI SEO planning + content draft flow inside WorkflowBriefs and AI Delivery: MI/SEO report → production plan → content objectives → drafts → review/polish → package/export handoff
- Content plan PDF export + private storage handoff status (admin; local R2-disabled behavior is safe and does not expose `storageKey`)
- Private storage disabled-safe foundation: local-safe only. R2 requires `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`; when absent, guarded paths return `R2_STORAGE_NOT_CONFIGURED` instead of persisting references. Signed download-reference behavior is documented as a safe helper surface, not live bucket proof.
- Deliverable handling: local/operator-client-safe. Admin upload/download-reference handoffs and monthly report document/PDF handoffs keep `storageKey` internal; Client Portal receives only FINAL, non-archived client-safe records with `downloadReference` and intentional admin-provided `exportUrl`, never raw storage keys or internal notes.
- WordPress **draft preparation** with publish gate disabled by default
- External integrations **readiness inspection** (no live calls)
- Admin operations summary and recovery hints on dashboard
- Finance Lite admin foundation: local/admin-safe finance records and ledger visibility (vendors/services/bills/invoices/credit notes/recurring/ledger as implemented and smoke-proven); no payment collection, Stripe, bank feeds, tax/legal/accounting production claim, or production invoicing readiness.
- Audit/activity feed foundation: local/operator-safe `AuditLog` events, dashboard recent activity feed, and admin operations visibility are smoke-proven; no SIEM, compliance-grade audit, production monitoring, or durable observability stack.
- Email/outbox disabled-safe foundation: read-only tenant-scoped outbox and local notification log behavior are smoke-proven; local mode does not send real email and does not prove provider/SMTP, queues, deliverability, or production notification readiness.

**Admin rule:** AI prepares; admin reviews and decides what becomes final. Clients see client-safe final material only.

---

## 6. What is not production-proven

- **Auth/session:** Session persistence (BLOCKED/deferred), real auth endpoints (skeleton-only, return 501), permission/module access enforcement (skeleton-only, not wired), invite/reset flows, Turnstile on staging, OAuth/OIDC, MFA, magic links
- Staging deploy on `staging.digitalcubeagency.net`
- Production deploy on `system.digitalcubeagency.net`
- Live OpenRouter / AI provider HTTP execution
- Live WordPress publish to any host
- Live R2 real-bucket proof, staging/env proof, and production storage readiness
- GA4 / GSC OAuth and live metrics sync
- Scraping / crawling ingestion
- Background queues / autonomous agents
- Real email provider sending / SMTP provider proof / background queues / deliverability
- Client-facing curated Market Intelligence view
- Revenue Hub, POD AI Toolkit, Finance payment/provider/bank-feed integrations
- Public / share approval links

---

## 7. Staging / production — G35 Phase C refresh complete

| Target | URL | Status |
|--------|-----|--------|
| Production | `system.digitalcubeagency.net` | Live VPS; untouched; API/DB unchanged during Phase C refresh |
| Staging (G1) | `staging.digitalcubeagency.net` | Controlled refresh complete on `5e1ea5a`; artifact context `/opt/dca/staging-artifacts/5e1ea5a`; API health 200; web root 200; MVP smoke PASS; see §2.8. G43 local re-check PASS does not authorize further staging action. |
| Deploy proof | — | **Phase C refresh PASS** — staging artifact, API, and web updated from `5ee8389` to `5e1ea5a`; local validation passed before artifact creation; no code push; no production touch; no further staging action approved without explicit owner instruction |

Phase C refresh included: local pre-artifact validation, artifact creation/upload, controlled VPS artifact swap, staging API recreation, admin bootstrap verification, and MVP smoke pass. Production containers untouched. No `.env` files read or printed. No further staging action authorized without explicit owner approval in writing.

---

## 8. Pre-staging gates & G35 Phase C refresh completion

**Phase C refresh (commit `5e1ea5a`) is now COMPLETE.** The following gates must pass before **requesting** any **future** staging work:

| # | Gate | Current status |
|---|------|--------|
| 1 | Blocks 1–4 + audit remediation complete; CI green | ✓ PASS — SHA `e54445f` or later; CI green on `main` |
| 2 | **Claude full-code audit remediation** | ✓ PASS — Commits `2437c84`–`e54445f` on `main`; 5D-B local closeout PASS |
| 3 | Validate PASS | ✓ PASS — `npm.cmd run validate` PASS before Phase C artifact creation |
| 4 | Required local smokes PASS | ✓ PASS — Block A core smokes PASS (5D-B manual fallback); Block 1–2 smokes PASS |
| 5 | Working tree clean | ✓ PASS — No uncommitted runtime changes |
| 6 | `main` synced | ✓ PASS — `main` = `origin/main` |
| 7 | No live calls | ✓ PASS — No publish, sync, crawl, or live provider during gate |
| 8 | Phase C refresh proof | ✓ PASS — Controlled refresh complete on `5e1ea5a`; local validation before artifact; staging API recreated; MVP smoke PASS; production untouched (see §2.8) |
| 9 | Latest local re-check | ✓ PASS — G43 validate + four focused local smokes PASS on `main` at `a18dcc1`; no repo edits, no commit/push/deploy/staging/VPS/prod (see §2.9) |
| 10 | Owner approval for future work | **Requires new explicit approval** — Phase C refresh and G43 local re-check are complete; any further staging action requires fresh owner instruction |

Full pack: [`docs/runbooks/STAGING_READINESS.md`](./runbooks/STAGING_READINESS.md). One-command local gate: `npm.cmd run smoke:pre-staging:local`.

---

## 9. Deferred / future roadmap

| Item | Status |
|------|--------|
| Staging deploy proof | **Phase C refresh COMPLETE** — G35 Phase C controlled refresh on `5e1ea5a` PASS; staging artifact, API, web, and MVP smoke verified; production untouched (see §2.2, §2.8); G43 local re-check PASS does not change deferred status; further staging refresh/execution requires fresh explicit owner approval |
| Production deploy proof | Deferred — frozen |
| Live AI provider / OpenRouter execution | Deferred — opt-in only |
| Live WordPress publish | Deferred — draft prep only |
| Live R2 real-bucket proof | Deferred — explicit env approval required; no bucket IO in local closeout; no staging/prod storage readiness claim |
| GA/GSC live sync | Deferred — snapshot-first metrics |
| Scraping / crawling ingestion | Deferred |
| Autonomous agents / background queues | Deferred |
| Client-facing curated MI view | Deferred |
| Revenue Hub | Deferred — [`REVENUE_HUB_AI_RH0_OPERATING_MODEL.md`](./architecture/REVENUE_HUB_AI_RH0_OPERATING_MODEL.md) |
| POD AI Toolkit | Deferred — [`POD_AI_TOOLKIT_POD0_OPERATING_MODEL.md`](./architecture/POD_AI_TOOLKIT_POD0_OPERATING_MODEL.md) |
| Payments / Stripe / bank feeds | Deferred |
| Hard deliverable gates | Deferred |
| Richer client collaboration / comments | Deferred |
| Public / share links | Deferred |
| WorkflowBriefs knowledge picker (6C-v2) | Deferred |
| `AiContextSnapshot` per-brief audit (6D) | Deferred |
| `ClientMonthlyBrief` deprecation | Deferred — legacy intake active |

Full register: [`docs/operator/deferred-scope-register.md`](./operator/deferred-scope-register.md).

---

## 10. Route map (client vs admin)

| Route | Surface | Notes |
|-------|---------|-------|
| `#/client-portal` | Client | Canonical archive + monthly reports |
| `#/monthly-reports` | Client | Alias → same as `#/client-portal` |
| `#/archive` | Client | Archive hub |
| `#/client-portal/pending-approvals` | Client | Pending approvals list |
| `#/client-portal/briefs` | Client | Legacy `ClientMonthlyBrief` intake |
| `#/client-portal/deliverables/:id/approve` | Client | `ArticleApprovalEditor` |
| `#/ai-delivery` | Admin | AI Delivery workspace |
| `#/workflow-briefs` | Admin / client | Admin full; client "Production Plan Review" |
| Dashboard → Operational readiness | Admin | Block 2 summary |

Client-only users: `#/client-portal` and granted routes only; admin routes blocked.

---

## Historical foundations (abbreviated)

The following remain true; detail preserved in linked docs and git history.

- Repository/workspace, validation, CI, Dark Nebula UI direction, data-dense admin UI phase 1/2.
- AI Delivery project/brief/workflow/deliverables/reviews/export/handoff foundation.
- AI Gateway v1 + AI Operations Console v1 (local deterministic default).
- Market Intelligence Mega Blocks 1–3; AI Delivery Revenue Engine Layer 1; Delivery Handoff Layer 2.
- Production Readiness closeout pack; Client Approval happy-path hardening.
- Blocks 1–3 (external integrations readiness, admin operations, UI density) on `main`.
- **Block 5A–5D-A (Claude audit remediation):** closed on `main` — admin tenant RBAC, fail-closed boundary smokes, CI unit tests, cross-platform globs, remote staging opt-in, bootstrap guards (`2437c84`–`e54445f`).
- **Block 5D-B (pre-staging local closeout):** PASS with manual orchestrator workaround; G4 still blocked.
- Client Access Admin UI; EN2 audit writer foundation; security headers + rate limiting.
- AI SEO Blocks 3B–3G, 4A–4G, 5A, 6A–6C-v1; Knowledge integration proven via `smoke:ai-knowledge-context`.
- G7 Block 2 Puriva operational data path: verified intake now feeds AI Knowledge, WorkflowBriefs,
  SEO planning, and AI Delivery handoff with admin-only/client-safe boundaries preserved.
- Phase F roadmap: [`docs/ROADMAP_LOCAL_COMPLETION_PHASE_F.md`](./ROADMAP_LOCAL_COMPLETION_PHASE_F.md).
- Completion matrix: [`docs/STATUS_COMPLETION.md`](./STATUS_COMPLETION.md).

## Current constraints

- Work is local-first on Windows PowerShell.
- No commit, push, deploy, VPS, or production action unless explicitly approved after review.
- ChatGPT controls scope; Codex/Copilot executes sealed tasks.
- Client Portal MVP required for Puriva; advanced portal features phased.
- AI Delivery defaults to local deterministic execution.
- Production/VPS frozen unless explicitly approved.

## AI SEO / Content Plan closure

AI SEO admin-operated MVP shell is in place and locally hardened for verified intake, approved KB/context, content-objective flow, compliance checkpoints, and draft-only handoff. Live crawling, Google OAuth / GSC sync, autonomous SEO agents, and production deploy remain deferred. No environment proof has run. See §9 and [`deferred-scope-register.md`](./operator/deferred-scope-register.md).

## AI SEO hardening closeout

AI SEO Module Hardening XL is documented in commit `1a132f9` (`docs: harden Puriva AI SEO operating path`) and pushed to `main`. The SEO operator path is hardened for verified intake, approved KB/context, content-objective flow, compliance checkpoints, WordPress draft-only handoff, AI Delivery bridge, and client-safe archive/report boundaries. Review PASS, `git diff --check` PASS, docs-only, and push successful. No backend/API/schema/auth changes, no scripts changed, no UI touched, no environment/VPS/production touched, no live integrations, no production readiness claim, no environment proof claim, and no medical/legal certainty were introduced.

Owner decision remains required for any future environment proof; Sonnet is required for future environment execution. Safe local/product hardening may continue.

## G7 Block 2 closeout

Puriva intake now flows through AI Knowledge, WorkflowBriefs, SEO planning, and AI Delivery handoff with verified-context / admin-only / draft-only boundaries intact. The closeout landed in commit `8cb41e2` (`polish(ops): connect Puriva intake to delivery path`) and passed diff-only review, web check, full validate, browser QA, and push. Production, staging, VPS, backend/API/schema/auth, and live provider / WordPress / GA/GSC / R2 paths were untouched.

## G8 local Puriva E2E closeout

Local Puriva E2E operator dry-run proof is now documented in commit `a380bb2` (`test(ops): add Puriva local E2E dry-run proof`). The local operator path is proven end to end: Puriva intake/compliance → AI Knowledge/context → WorkflowBriefs → SEO plan → content/compliance → image/asset handoff → WordPress prepared draft → client-safe monthly report/archive → client approval happy path. Browser smoke labels were aligned to the real UI (`Pending Reviews`, `Request Changes`, `Approve for publication`). Production, staging, VPS, backend/API/schema/auth, and live provider / WordPress / GA/GSC / R2 paths were untouched.

## G9 Puriva Operating Pack v1 closeout

Puriva Operating Pack v1 closeout is now documented in commit `b2e0287` (`docs: close Puriva operating pack v1`) and pushed to `main`. The local/admin operating pack is complete for the approved scope: intake/compliance source of truth, owner/client approval checklist, AI Knowledge/context handoff, WorkflowBriefs handoff, SEO/content production gate, WordPress prepared draft-only handoff, client-safe approval/archive/report path, local E2E proof, real client data packet checklist, and go/no-go checklist. It is local/admin-operational only and does **not** authorize production, staging, VPS, live provider, live WordPress publish, GA/GSC, or R2 work. Production/staging/VPS were untouched in this closeout.

## G9 environment proof approval gate

The G9 environment proof approval gate is now documented in commit `3fc779f` (`docs: add G9 environment proof approval gate`) and pushed to `main`. The gate is planning-only / approval-only, records the exact owner approval sentence, requires Sonnet for actual execution, and keeps production limited to health-check only in any future proof. No environment execution happened, no environment proof has run, and no production readiness is claimed. Backup/rollback evidence is required before any mutating action; live provider, live WordPress publish, GA/GSC, and R2 live IO remain deferred.

## G10 Client Portal approval/report polish closeout

Client Portal approval/report polish is documented in commit `b8319f9` (`polish(client): clarify approval and report surfaces`) and pushed to `main`. Client-facing approval wording, monthly report wording, final archive/deliverables wording, empty/error/loading states, and docs/smoke assertions were tightened. Review verdict was KEEP; `git diff --check`, web check, full validate, and browser/local QA all passed; `main` finished clean and synced with `origin/main`. No backend/API/schema/auth changes, no environment/VPS/production touch, no live integrations, no production readiness claim, and no medical/legal certainty were introduced. Owner approval remains required before any future environment work, and Sonnet remains required for any future environment execution.

## G11 Admin cockpit / daily operations polish closeout

Admin cockpit / daily operations polish is documented in commit `831175980a87736faefbdbdbedafdbbdf9d97419` (`polish(ops): clarify daily operations cockpit`) and pushed to `main`. The cockpit now separates Ready now / Needs review / Blocked-waiting and keeps the Puriva path compact; operator docs were aligned to match that flow. Review verdict was KEEP; `git diff --check`, web check, full validate, and admin/AI operations smokes all passed; `main` finished clean and synced with `origin/main`. No backend/API/schema/auth changes, no environment/VPS/production touch, no live integrations, no new API/persisted fields, no production readiness claim, and no environment proof claim were introduced. Owner approval remains required before any future environment work, and Sonnet remains required for any future environment execution.

## G12 local/product final polish closeout

Combined local/product final polish is documented in commit `5f3701f` (`polish(ops): finalize local product handoffs`) and pushed to `main`. AI Delivery review/package wording, monthly report wording around approved snapshots and FINAL visibility, WorkflowBriefs intake → verified facts → approved KB/context → brief → SEO/content plan wording, and the local/product next-options selector were clarified. Review verdict was KEEP; `git diff --check`, web check, full validate, and browser/local QA all passed; `main` finished clean and synced with `origin/main`. No backend/API/schema/auth changes, no environment/VPS/production touch, no live integrations, no new API/persisted fields, no production readiness claim, and no environment proof claim were introduced. Owner approval remains required before any future environment work, and Sonnet remains required for any future environment execution.

## G13 local business modules polish closeout

Bounded local business modules polish and finance smoke-fix work is documented in commit `cbe9311` (`polish(ops): tighten business module surfaces`) and pushed to `main`. UI density polish was applied to existing local/admin business surfaces; Finance Lite labels/actions were clarified; Market Intelligence labels/actions were clarified; Revenue Hub remained preview-label copy only in `App.tsx`; and the finance-ledger smoke was fixed by aligning token extraction and payloads with the existing login/fixture shape. Review verdict was KEEP; `git diff --check`, `npm.cmd run -w @dca-os-v1/web check`, `npm.cmd run validate`, finance admin browser, finance ledger local, Market Intelligence, and admin operations smokes all passed; `main` finished clean and synced with `origin/main`. No backend/API/schema/auth changes, no environment/VPS/production touch, no live integrations, no new API/persisted fields, no production readiness claim, and no environment proof claim were introduced. Owner approval remains required before any future environment work, and Sonnet remains required for any future environment execution.

## G14 AI Gateway foundation local hardening closeout

A discovery-first review of the AI Gateway v1 foundation (`apps/api/src/core/ai-gateway-v1.service.ts`, `apps/api/src/config/ai-provider.config.ts`, `apps/api/src/services/openrouter-text.service.ts`, and WorkflowBriefs execution wiring) confirmed the existing local contract already meets the target safety bar: explicit safe results for both the disabled gateway path and the not-configured/opt-in-local path, no live provider call by default, no secret values ever returned or logged (verified by direct code inspection — `openrouter-text.service.ts` only returns generic HTTP-status/timeout messages), and no gateway/model/provider audit fields reachable from the client portal (confirmed by a zero-match grep of `client-portal.runtime.ts` for gateway/audit/execution-log fields). No code changes were required or made. Proof for this closeout: `npm.cmd run validate` PASS (including `check:ai-provider-config` 19/19 and `check:external-integrations-readiness` 25/25, both already part of the standard validate chain), and a fresh run of `npm.cmd run smoke:openrouter-guarded:local` (12/12 PASS) confirming the planning-config endpoint hides secrets, reports safe booleans/enums only, and that WorkflowBriefs/AI Delivery execution stays on the local deterministic gateway by default. This closeout documents AI Gateway **foundation** maturity only — it does not claim live OpenRouter provider readiness, staging readiness, or production readiness. Live provider execution, staging proof, real provider-secret/config proof, and cost/rate-limit proof all remain deferred. No backend contract changed, no schema/auth/RBAC change was made, no environment/VPS/production was touched, and no live provider/WordPress/GA-GSC/R2 call was made. Owner approval remains required before any future environment work, and Sonnet remains required for any future environment execution.

## G15 Admin operations shell 100% local/admin-operational closeout

`AdminDailyOperationsCockpit.tsx` (`#/admin-daily-cockpit`) is now complete as the local operator home. Added: a "Start here — first client" panel that discoverably links into the first-client practice path (cross-referencing `docs/operator/first-client-next-actions.md`); a "Handoffs" panel with direct navigation into all six required surfaces — Workflow Briefs / AI SEO plan, AI Delivery workspace, Monthly Reports (client-safe preview), Client Portal archive (client-safe preview), Market Intelligence, and Finance Lite (Invoices) — plus the existing AI Operations console link; and a "Deferred / gated (not active locally)" panel that explicitly labels staging deploy/environment proof, production deploy/readiness, live AI provider execution, live WordPress publish, GA/GSC live sync, and R2 live bucket IO as out of scope. The existing Ready now / Needs review / Blocked-waiting queues and Daily path sequence were preserved unchanged. A new focused browser smoke, `smoke:admin-daily-cockpit:browser` (`scripts/smoke-admin-daily-cockpit-browser-local.mjs`, wired into `package.json`), proves the shell renders, all handoff buttons are present and three representative ones (Workflow Briefs, Market Intelligence, Finance Lite) navigate to the correct destination heading, all deferred/gated labels are present, and no secret-like values appear in the rendered DOM — 28/28 PASS. `git diff --check`, `npm.cmd run -w @dca-os-v1/web check`, `npm.cmd run validate` (after one documented Prisma EPERM recovery), the existing `smoke:admin-operations:local` (16/16 PASS), and the new cockpit browser smoke all passed. This closeout is scoped to **100% local/admin-operational** shell completeness only — it does not claim staging readiness, production readiness, environment proof, or any live provider/WordPress/GA-GSC/R2 capability, all of which remain explicitly deferred and gated behind separate owner approval. No backend/API/schema/auth/RBAC changes were made; the only non-doc/non-UI change was one additive `package.json` script line wiring the new smoke. Owner approval remains required before any future environment work, and Sonnet remains required for any future environment execution.

## G16 Client Portal read-only surfaces + Monthly Reports local/client-safe closeout

Client Portal read-only surfaces and Monthly Reports final handoff are now documented as complete for the approved local scope. The existing browser smokes `smoke:client-portal-monthly-report:browser` and `smoke:client-portal:browser` already prove the boundary: FINAL-only monthly reports are visible, DRAFT / ADMIN_REVIEW / ARCHIVED reports stay hidden, and forbidden fields such as `storageKey`, `adminSummaryNotes`, `tenantId`, `workflowRunId`, `prompt`, `draftBody`, `reviewNotes`, `provider`, `model`, `gateway`, and `cost` stay out of the rendered portal and API response. This closeout records Monthly Reports as **100% local/client-safe handoff** while keeping live GA/GSC, live provider execution, live WordPress, R2 live IO, staging, and production explicitly deferred. No backend/API/schema/auth changes were made, no environment/VPS/production work was touched, and no code changes were required for this docs-only closeout.

## G17 WorkflowBriefs / context composition 100% local/operator-ready closeout

WorkflowBriefs is now documented as the local/operator-ready context-composition surface for the first-client path. The approved local sequence is explicit in UI/docs: create brief → complete verified facts → submit brief → run AI/local deterministic reports → review MI/SEO outputs → generate production plan → send/approve → handoff into AI Delivery. The page is labeled `Workflow Briefs` for admins and `Production Plan Review` for client-facing review, and the existing smokes (`smoke:workflow-brief-publication-handoff:browser`, `smoke:ai-seo-content-plan-pdf`, `smoke:ai-knowledge-context`) already prove the local deterministic path, submit-before-run-ai prerequisite, and AI Delivery handoff boundary. No live provider, WordPress, GA/GSC, R2, staging, production, backend/API/schema/auth, or environment work was touched.

## G19 AI SEO planning + content drafts 100% local/operator-ready closeout

AI SEO planning + content drafts are complete for the approved local/admin operator scope. AI SEO lives in two operator surfaces: WorkflowBriefs for intake/context composition, MI/SEO outputs, production plan generation, content-objective seeding, draft generation, package/release preparation, and draft-only publication handoff; and AI Delivery for the monthly content plan, content drafts, review/polish records, PDF/export handoff status, deliverables, and monthly report/client-safe archive handoff. The local sequence is explicit: MI/SEO report → production/content plan → content objectives → drafts → review/polish → package/export handoff → AI Delivery handoff.

Existing local smoke proof remains valid for this closeout: `smoke:ai-seo-content-plan-pdf` proves admin-only content plan PDF/export behavior, safe local `R2_STORAGE_NOT_CONFIGURED` handling when R2 is disabled, download-reference shape, auth guards, and no `storageKey` exposure; `smoke:workflow-brief-publication-handoff:browser` proves the WorkflowBriefs plan/draft/package/draft-only handoff path without live publish actions; `smoke:ai-delivery-workflow:browser` proves the AI Delivery workflow/content plan shell and local deterministic gateway context; `smoke:ai-delivery-reviews` covers content plan approval, content draft generation/review state, packaging, R2-disabled upload safety, and generated content draft persistence. This is local/operator-ready only and does **not** claim live crawling, live GSC/GA sync, live provider execution, Google Docs live export, live R2 IO, live WordPress, staging/environment proof, production readiness, medical/legal/license certainty, or before-after claims. No environment, VPS, staging, production, backend/API/schema/auth, provider/runtime, or secret changes were made.

## G20 AI Delivery workflow 100% local/operator-ready closeout

AI Delivery is now documented as the complete local/admin operator execution surface for the approved scope. The full local sequence is explicit: monthly project → brief/context handoff from WorkflowBriefs → workflow run visibility → content plan → content drafts → reviews → package → deliverables → WordPress draft-prep handoff → monthly report → client-safe archive handoff. This closeout records the dependencies already completed — WorkflowBriefs/context composition (100% local/operator-ready), AI Knowledge/Context layer (100% local/operator-safe), AI SEO planning + content drafts (100% local/operator-ready), Monthly Reports + Client Portal read-only (100% local/client-safe), and the admin operations shell (100% local/admin-operational) — and confirms the client-safe boundary: no workflow runs, jobs, prompts, draft bodies, review notes, provider/model/gateway/audit/cost metadata, `storageKey`, or non-final reports reach Client Portal.

Existing local smoke proof remains valid for this closeout: `smoke:ai-delivery-workflow:browser`, `smoke:ai-delivery-reviews`, `smoke:workflow-brief-publication-handoff:browser`, `smoke:client-portal-monthly-report:browser`, `smoke:client-portal:browser`, and `smoke:ai-seo-content-plan-pdf`. This is local/operator-ready only and does **not** claim live AI provider execution, live WordPress publish, live GA/GSC sync, live R2 IO, Google Docs live export, staging/environment proof, or production readiness. No backend/API/schema/auth changes, no environment/VPS/production touch, and no live integrations were introduced; this was a discovery-first, docs-only closeout — no code changes were required because the existing operator UI and API contract already satisfied the target sequence and boundaries.

## G23 Private storage / deliverable handling docs-only closeout

Private storage disabled-safe foundation is now recorded as **100% local-safe**. The documented service surface exposes disabled/private-r2 status, a guarded upload helper, and a 300-second signed download-reference helper. R2 configuration requires `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`; absent config is expected locally and returns guarded `R2_STORAGE_NOT_CONFIGURED` instead of persisting storage references. Supported private storage rules remain limited to scoped storage keys for pdf/png/jpeg/webp up to 5 MB, private PUT, and signed GET reference behavior when explicitly configured.

Deliverable handling is now recorded as **100% local/operator-client-safe**. AI Delivery deliverables support admin upload/download-reference/open, ready/revision/accept/archive/restore, reviews, WordPress draft prep, Google Docs export handoff, and client FINAL visibility. Monthly report handoff supports admin upload, admin download-reference, generated PDF storage, and client FINAL-only download-reference. Client Portal excludes `storageKey`, internal notes, `contentDraftId`, `articleImageId`, and `tenantId`; client download endpoints return `downloadReference` only. `exportUrl` remains intentionally client-visible only as a safe admin-provided external handoff link.

Existing proof coverage remains local-only: `smoke:r2-byte-roundtrip:local` for disabled-safe/local guarded storage behavior, `smoke:ai-delivery-reviews`, `smoke:monthly-report:local`, `smoke:ai-seo-content-plan-pdf`, and existing client-portal/monthly-report smokes where referenced above. Live R2 real-bucket proof remains **deferred** and requires explicit env approval. This closeout does not run bucket IO, does not claim staging/env proof, does not claim production storage readiness, and does not change storage/security/API/backend behavior.

## G26 Finance Lite + audit/activity + email/outbox local foundation closeout

Finance Lite admin foundation is recorded as **100% local/admin-safe foundation** for the current approved local operator scope. Existing focused smoke proof passed: `smoke:finance-admin:browser` confirmed the Invoices and Bills admin shells/API reachability, and `smoke:finance-ledger:local` confirmed local admin creation and ledger summaries for client/project revenue/cost events, finance integrity, and monthly PDF generation with no-storage local handling. This proves admin finance records and ledger visibility for implemented vendors/services/bills/invoices/credit notes/recurring/ledger boundaries only; it does **not** prove real payment collection, Stripe/payment provider behavior, bank feeds, tax/legal/accounting production correctness, or production invoicing readiness.

Audit/activity feed foundation is recorded as **100% local/operator-safe foundation**. Existing focused smoke proof passed: `smoke:audit-activity:browser` confirmed audit logs API reachability and Dashboard Recent Activity rendering, and `smoke:dashboard:audit-feed:browser` confirmed tenant-scoped events render in the dashboard feed with formatted action and actor context. This proves local operator visibility over existing `AuditLog`/event feed/dashboard activity behavior only; it does **not** claim SIEM/security audit completeness, compliance-grade audit logging, production monitoring, or a durable incident observability stack.

Email/outbox disabled-safe foundation is recorded as **100% local-safe foundation**. Existing focused smoke proof passed: `smoke:email-outbox:local` confirmed the read-only tenant-scoped outbox, secret-safe response shape, local non-sending provider status, no exposed Resend key, and `SKIPPED` non-delivery records for local notification events. Optional `smoke:admin-operations:local` also passed for operator visibility and admin/client boundary proof. This proves local disabled/outbox behavior only; it does **not** claim real sending, SMTP/provider proof, background queues, deliverability, or production notification readiness.

## Next options after local/product polish

- Stop and wait for owner decision.
- If approved later, use the Sonnet-only prompt in `docs/runbooks/G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md`.
- If desired, continue deeper local/product UI polish only.
