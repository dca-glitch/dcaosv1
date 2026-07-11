# Authoritative Project Control Matrix

**Document role:** Owner-approved project-control source for nomenclature and capability status before the next staging cycle.

**Date:** 2026-07-12
**Workstream:** WORKSTREAM 1A — docs-only project control reconciliation

---

## 1. Authority and scope

| Item | Value |
|------|--------|
| Repo | `C:\dcaosv1` |
| Branch | `main` |
| Repo baseline (HEAD) | `fac108be16e779fdbff0a2867b302679c8c4da6f` (`fac108b`) |
| Staging baseline / known-good artifact | `1b8d00db2f9d46ac6678abd576a02683ffa6d86c` (`1b8d00d`) |
| Relation | `fac108b` is a direct docs-only descendant of `1b8d00d` (`1b8d00d → fac108b`) |
| App/schema/tests/config between baselines | Identical (docs-only delta on `fac108b`) |
| Staging `1b8d00d` | PASS |
| Validate at baseline | PASS |
| Production | FROZEN |
| Remote freshness | Unverified |

This document controls **nomenclature** and **status labels** for planning and execution before the next staging cycle. It does **not** replace technical runbooks (`STAGING_READINESS`, `PRODUCTION_DEPLOYMENT`, `PRODUCTION_ROLLBACK`, integration proof runbooks, or operator checklists).

---

## 2. Numbering systems

Three implementation/planning systems plus historical G-gates. **Do not mix or substitute them.**

| System | Function | Scope | Source | Mixing rule |
|--------|----------|-------|--------|-------------|
| **BLOKI 1–13** | Functional implementation roadmap | Feature/auth/portal/briefs/notifications/WordPress/E2E delivery blocks | Owner-approved BLOK table (this matrix §3) | Never rename Workstreams or UI Fazy as BLOKI |
| **Fazy UI 1–13** | UI redesign roadmap | Dark Nebula / dense admin / design-system presentation work | UI direction docs (`docs/ui/*`, Dark Nebula product UI direction) | Never treat UI Fazy as functional BLOKI or snapshot Workstreams |
| **Workstreamy 1–9** | Pre-next-staging execution plan | Local hardening → staging live proofs → planning go/no-go | Owner-approved Workstream table (this matrix §4) | Never claim a Workstream “completes” a BLOK by number alone |
| **G-gates** | Historical gate ledger | Past pre-live / foundation / proof planning sequence (G49–G708+) | `docs/STATUS.md`, deferred-scope register, gate runbooks | Historical context only unless an owner gate re-activates a specific G-id |

---

## 3. Implementation BLOKI 1–13

| BLOK | Content | Status |
|------|---------|--------|
| 1 | Auth: ChangePasswordModal, CreateUserModal, ResetPasswordModal | COMPLETE |
| 2 | Puriva Client Portal: ArticleApprovalEditor, pending approvals, Resend notification foundation | COMPLETE |
| 3 | Fix 403: owner role for `admin@dca.local`, owner bypass in pending approvals | COMPLETE |
| 4 | createUser + clientId, ClientUserAccess in transaction, TeamView client selector | COMPLETE |
| 5 | Role-based UI, filterNavigationByRole, redirect client to `#/client-portal` | COMPLETE |
| 6 | Comprehensive test suite | COMPLETE |
| 7 | Content editing metadata, audit trail, ClientEdit; BLOK 7-UI design system foundation | COMPLETE |
| 8 | Brief model/API/UI, archive, monthly reports, client dashboard, brief-submitted notification foundation | COMPLETE |
| 9 | Google Docs UI frontend | DEFERRED — owner decision 2026-07-11 |
| 10 | Email notifications activation | ABSORBED INTO SNAPSHOT WORKSTREAMS |
| 11 | WordPress publish E2E verification | ABSORBED INTO SNAPSHOT WORKSTREAMS |
| 12 | Staging deployment | ABSORBED INTO SNAPSHOT WORKSTREAMS |
| 13 | Full Puriva E2E | ABSORBED INTO SNAPSHOT WORKSTREAMS |

**Note:** BLOKI 10–13 are **absorbed**, not cancelled.

---

## 4. Workstreams 1–9

| Workstream | Location | Scope |
|------------|----------|-------|
| 1 | Local | Authoritative status matrix, security/dependency triage, component-system decision, rollback/compatibility plan |
| 2 | Local | Notification contracts, storage contracts, AI provider contracts, OAuth, WordPress contracts |
| 3 | Local | AI Delivery decomposition, shared UI states, design-system consolidation, code splitting |
| 4 | Local | Orchestrator Lite hardening, bounded MI v2, image workflow, reports, WordPress workflow |
| 5 | Local | Full validate, unit/integration tests, browser smokes, security regression, local UI/UX audit |
| 6 | VPS staging | Artifact upload, DB backup, migrations, API/web deploy, core health smoke |
| 7 | VPS staging | Live proofs: Email → AI → R2 → Image → WordPress → GA/GSC → MI |
| 8 | VPS staging | Puriva E2E, failure paths, runtime UI/UX audit, security audit, rollback rehearsal |
| 9 | Planning | Credential rotation, migration plan, explicit owner go/no-go |

**Active:** Workstream 1 (this reconciliation is Workstream 1A docs-only).

---

## 5. Capability status standard

Owner-approved five-level labels. Do **not** invent a competing status system.

| Status | Meaning |
|--------|---------|
| NOT IMPLEMENTED | No code |
| LOCAL FOUNDATION | Code or workflow exists locally; no live proof |
| CONFIG SHAPE PROVEN | Configuration or contract confirmed without live IO |
| STAGING LIVE PROVEN | Real proof on staging |
| PRODUCTION LIVE PROVEN | Real proof on production |

Applied migration or local unit/integration proof alone does **not** justify `STAGING LIVE PROVEN` or `PRODUCTION LIVE PROVEN`.

---

## 6. Current capability matrix

| Capability | Label | Evidence | Open condition | Blocks next staging? | Blocks production? |
|------------|-------|----------|----------------|----------------------|--------------------|
| Auth (modals / local admin auth path) | LOCAL FOUNDATION | BLOK 1 COMPLETE; local auth/smokes | Staging/prod auth + Turnstile cutover incomplete | No (local Workstreams first) | Yes |
| RBAC / role-based UI | LOCAL FOUNDATION | BLOKI 3–5 COMPLETE; client redirect / navigation filters | Target-env RBAC browser proof | No | Yes |
| Client Portal | LOCAL FOUNDATION | BLOK 2 COMPLETE; pending approvals / FINAL visibility | Staging/prod portal proof; broader collaboration deferred | No | Yes |
| Briefs | LOCAL FOUNDATION | BLOK 8 COMPLETE; model/API/UI | Target-env brief workflow proof | No | Yes |
| AI Delivery | LOCAL FOUNDATION | Local operator path + ledger foundations; local live AI text proof (G77b) is local-only | Staging/prod AI re-proof; decomposition (WS3/WS4) | Partially — local Workstreams 3–5 before next staging | Yes |
| Notifications persistence (InAppNotification) | LOCAL FOUNDATION | Prisma model; migration `20260711115000_add_in_app_notifications`; service/controller/API; integration tests; frontend `NotificationPanel` | Full E2E notification workflow not closed; not launch-proven | No (migration already on staging) | Yes (launch) |
| In-app notification staging migration | APPLIED (staging fact; not a capability label) | Staging deploy `1b8d00d` applied migration | N/A | No | No |
| In-app notification UI foundation | LOCAL FOUNDATION | `NotificationPanel` and related UI | Client/admin inbox product completeness + live workflow | No | Yes |
| Live email / Resend send | LOCAL FOUNDATION (send not staging-live-proven) | Outbox/no-send foundation; Resend wiring exists without staging live send proof | Staging live email proof | Yes for live-email claims in WS7 | Yes |
| Full notification E2E / launch proof | NOT closed | Persistence + UI foundation exist; live email not staging-live-proven | Event → inbox → email E2E on target env | Yes for launch claims | Yes |
| AI provider / OpenRouter | LOCAL FOUNDATION | Local live proof exists; staging/prod re-proof required | Staging live AI proof | Yes for WS7 AI step | Yes |
| R2 / private storage | LOCAL FOUNDATION | Disabled-safe / no-IO foundations | Real bucket IO on target env | Yes for WS7 R2 step | Yes |
| Image provider | LOCAL FOUNDATION | Compliance/helpers; provider selection OPEN | Provider choice + live generation proof | Yes for WS7 image step | Yes |
| WordPress | LOCAL FOUNDATION | Draft-prep / publish-freeze foundations | Live draft/publish proof per owner gate | Yes for WS7 WP step | Yes |
| GA/GSC | LOCAL FOUNDATION | Snapshot-first / config helpers | OAuth + live sync proof | Yes for WS7 GA/GSC step | Yes |
| Market Intelligence | LOCAL FOUNDATION | Admin MI MVP local | Live ingestion / staging proof | Yes for WS7 MI step | Yes |
| Google Docs / Drive frontend | DEFERRED | BLOK 9 owner-deferred 2026-07-11 | Owner reactivation of BLOK 9 | No (explicitly deferred) | Yes if claimed as ready |
| Component system | LOCAL FOUNDATION — decision OPEN | Three overlapping systems: `components`, `components/ui`, `design-system/components`; parallel Modal/Badge | Canonical system decision | Soft — WS1 item; should resolve before broad UI consolidation | Soft |
| Rollback / compatibility plan | OPEN | Runbooks exist (`PRODUCTION_ROLLBACK`, `PRODUCTION_DEPLOYMENT`, `STAGING_READINESS`, `G53_PRODUCTION_SAFETY_PLAN`); known-good staging artifact `1b8d00d` | Rollback rehearsal **not executed**; WS1 rollback/compatibility plan not COMPLETE | Soft — WS1 open item before next staging | Yes |
| Production | FROZEN | Staging PASS does not authorize production; artifact SHA / rollback target UNKNOWN | Turnstile/R2 rotation; G49/G50; explicit go/no-go | N/A (not staging) | Yes — frozen |

---

## 7. Current dependency findings

**Source:** Current `npm audit` confirmation recorded 2026-07-12 (Workstream 1A).
**Fix status:** NOT FIXED. No automatic fix applied. No owner approval for upgrade in this workstream.

### Audit summary

| Metric | Value |
|--------|--------|
| Critical | 0 |
| High | 1 |
| Moderate | 5 |
| Low / info | not claimed here |

### High finding

| Field | Value |
|-------|--------|
| Package | `vite` (direct dependency) |
| Severity | high |
| Affected range | `<=6.4.2` |
| Repo build version | Vite `5.4.21` |
| Suggested automatic fix | Vite `8.1.4` (major upgrade) |
| Advisory set includes | `GHSA-fx2h-pf6j-xcff` (among others in advisory set) |
| Classification | Confirmed dependency finding — **OPEN — BOUNDED TRIAGE REQUIRED** |
| Not claimed | Production exploit without separate triage; fixed; safe to ignore |

### Moderate findings

| Package | Severity |
|---------|----------|
| `esbuild` | moderate |
| `gaxios` | moderate |
| `googleapis` | moderate |
| `googleapis-common` | moderate |
| `uuid` | moderate |

**Rules:** Do not run `npm audit fix` / major Vite upgrade without a separate bounded triage gate. Do not claim these findings remediated in STATUS or this matrix until triage closes them.

---

## 8. Open decisions

| Decision | Status |
|----------|--------|
| Canonical component system (`components` vs `components/ui` vs `design-system`) | OPEN |
| Separate Orchestrator proof position in mandatory live-proof sequence | OPEN DECISION |
| Rollback / compatibility plan completion (incl. rehearsal) | OPEN — rehearsal not executed |
| Image provider selection | OPEN |
| Production artifact SHA and rollback target | UNKNOWN / OPEN |
| Staging credential availability for next live proofs | OPEN |
| Production Turnstile and R2 credential rotation execution | OPEN — DEFERRED (Phase B/C) |

---

## 9. Current execution boundary

| Boundary | State |
|----------|--------|
| Active Workstream | **1** (1A docs-only reconciliation in progress / complete as docs) |
| Commit / push / deploy | **No approval** |
| Staging mutation | **No** — last proven artifact remains `1b8d00d` |
| Production mutation | **No** — production FROZEN |
| Next staging artifact | **Does not exist yet** |
| Live provider calls in this workstream | **No** |
| Dependency upgrades in this workstream | **No** |

Related operator docs:

- [`docs/STATUS.md`](../STATUS.md)
- [`docs/operator/deferred-scope-register.md`](../operator/deferred-scope-register.md)
- [`docs/runbooks/STAGING_READINESS.md`](../runbooks/STAGING_READINESS.md)
