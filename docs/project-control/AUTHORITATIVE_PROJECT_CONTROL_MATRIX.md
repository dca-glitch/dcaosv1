# Authoritative Project Control Matrix

**Document role:** Owner-approved project-control source for nomenclature and capability status before the next staging cycle.

**Date:** 2026-07-13
**Workstream:** Production controlled deploy `57f9c52` + Puriva pack binding (admin/client live testing)

---

## 1. Authority and scope

| Item | Value |
|------|--------|
| Repo | `C:\dcaosv1` |
| Branch | `main` |
| Repo baseline (HEAD) | Prefer `docs/STATUS.md` — production runtime `57f9c52`; tip may be docs-only after that SHA |
| Staging API baseline (last full API artifact) | `57f9c52` (pack binding) / prior composition `632d9a9` |
| Staging web baseline | In-place sync into `/opt/dca/apps/dcaosv1/staging/web/dist` when UI changes |
| Production artifact | `/opt/dca/production-artifacts/57f9c52` · rollback image `app-dcaosv1-api:pre-57f9c52-20260713T050725Z` |
| Relation | Pack binding `Client.operatingPackKey`; production catch-up of 39 migrations applied 2026-07-13 |
| Production | DEPLOYED — `READY_FOR_CONTROLLED_LIVE_TESTING`; external providers owner-gated; Puriva full launch NOT claimed |
| Remote freshness | `origin/main` must match repo HEAD after RC push |

This document controls **nomenclature** and **status labels** for planning and execution before the next staging cycle. It does **not** replace technical runbooks (`STAGING_READINESS`, `PRODUCTION_DEPLOYMENT`, `PRODUCTION_ROLLBACK`, integration proof runbooks, or operator checklists).

**Static web deploy rule:** Never `rm -rf` + `mv` the Caddy-mounted `dist` directory (stale inode bind). Sync **into** the existing mount. Shared Caddy `--force-recreate` is a shared-infrastructure mutation — record `SHARED_PROXY_RESTART` / `SHARED_PROXY_RELOAD` separately from production app/API/DB mutation.

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

**Active closeout:** Workstreams 1–5 local + Workstream 6 controlled staging deploy `a8a74e6` COMPLETE; staging API runtime advanced through `c07df10` (OpenAI Images) to artifact `bd649d5` for WordPress dedicated one-draft proof (prior R2 cleanup support on `4cd6d58`). Workstream 7 Email = **STAGING PROVIDER ACCEPTANCE PROVEN**. AI-A Orchestrator = **CONFIG SHAPE PROVEN**. AI-B AI Delivery / OpenRouter path = **STAGING LIVE PROVEN**. R2 private storage exact object roundtrip = **STAGING LIVE PROVEN**. OpenAI Images staging one-image AI Policy path = **STAGING LIVE PROVEN**. WordPress dedicated staging one-draft path = **STAGING LIVE PROVEN** (bounded create-and-trash only). Next: GA/GSC → MI. Production remains FROZEN.

---

## 5. Capability status standard

Owner-approved five-level labels. Do **not** invent a competing status system.

| Status | Meaning |
|--------|---------|
| NOT IMPLEMENTED | No code |
| LOCAL FOUNDATION | Code or workflow exists locally; no live proof |
| CONFIG SHAPE PROVEN | Configuration or contract confirmed without live IO |
| STAGING PROVIDER ACCEPTANCE PROVEN | Staging provider accepted the request (e.g. Resend HTTP OK + message id + EmailLog); not inbox/webhook delivery |
| STAGING LIVE PROVEN | Real proof on staging including delivery/receipt where the capability requires it |
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
| AI Delivery | STAGING LIVE PROVEN | Staging `a8a74e6` AI-B 2026-07-12 (`DCA-AI-B-20260712T071332Z-5vytpl`): one bounded OpenRouter summary execute; workflow REVIEW; COMPLETED ledger `a37577de-…`; `liveProviderCalled=true`; gateway restored local | Production re-proof; broader workflows/client delivery not claimed; decomposition (WS3/WS4) | Soft — AI-B done; next WS7 = WordPress | Yes |
| AI Delivery bounded content-to-draft execution bridge | LOCAL IMPLEMENTED / FAKE-PROVIDER AND REAL-PRISMA PROVEN | Durable workflow ledger; staging-only five-command CLI; exact scope/manifest/cleanup guards; injectable real provider construction; isolated ephemeral loopback PostgreSQL CLI proof with fake OpenAI/R2/WordPress/email, concurrency, idempotency, manual approval boundary, ambiguity, and zero residual proof rows | Bridge staging deployment and connected live execution; real R2/image/draft/email proof; media attachment; client approval/email; production all not proven. Baseline `8a506c5` and additive migration are already on staging | No — staging execution remains separately owner-controlled | Yes |
| Orchestrator Lite | CONFIG SHAPE PROVEN | Staging `a8a74e6` AI-A preflight 2026-07-12 (`DCA-WS7-AI-A-20260712-064227`): admin registry/preview/dry-run; routing matrix; budget/material/override guards; `executionDeferred=true`; `liveProviderCalled=false`; live calls 0; cost $0; PREVIEW/BLOCKED ledger only | Plan→execute wiring; `STAGING LIVE PROVEN` not claimed | Soft — AI-A done; AI-B is AI Delivery path only | Yes |
| Notifications persistence (InAppNotification) | LOCAL FOUNDATION | Prisma model; migration `20260711115000_add_in_app_notifications`; service/controller/API; integration tests; frontend `NotificationPanel` | Full E2E notification workflow not closed; not launch-proven | No (migration already on staging) | Yes (launch) |
| In-app notification staging migration | APPLIED (staging fact; not a capability label) | Staging deploy `1b8d00d` applied migration | N/A | No | No |
| In-app notification UI foundation | LOCAL FOUNDATION | `NotificationPanel` and related UI | Client/admin inbox product completeness + live workflow | No | Yes |
| Live email / Resend send | STAGING PROVIDER ACCEPTANCE PROVEN | Staging `a8a74e6` one-send adapter-only `AI_DELIVERY_APPROVED` via `sendEmailNotification`; owner-controlled test inbox; EmailLog SENT + provider message id; sender `notifications.digitalcubeagency.net`; `EMAIL_LIVE_SEND_AUTHORIZED=false` / `sendingEnabled=false` restored | Inbox/webhook delivery not claimed; fan-out/client paths unproven; full E2E open | Soft — WS7 Email step done | Yes |
| Full notification E2E / launch proof | NOT closed | Persistence + UI foundation exist; email = provider acceptance only (not inbox E2E) | Event → inbox → email E2E on target env | Yes for launch claims | Yes |
| AI provider / OpenRouter | STAGING LIVE PROVEN (AI Delivery path only) | Staging `a8a74e6` AI-B: one OpenRouter call via AI Delivery execute → `AI_GATEWAY_V1` → `openrouter-text.service`; model `anthropic/claude-haiku-4.5`; COMPLETED ledger estimatedCostUsd `0.15` (`actualCostUsd=null`); restored `AI_TEXT_GATEWAY=local` | Production live not proven; Orchestrator plan→execute not proven; trusted invoice cost not proven | Soft — staging AI Delivery path done; next WS7 = WordPress | Yes |
| R2 / private storage | STAGING LIVE PROVEN | Staging artifact `4cd6d58` (`/opt/dca/staging-artifacts/4cd6d58`) 2026-07-12 marker `DCA-R2-20260712T081648Z-cc7ee7`: bucket `dcastaging`; one exact-key create → HEAD → signed read → DELETE → HEAD absence; sha256 `39b787cc…52a7`; 107 bytes `application/pdf`; `publicUrl=null` | Production R2 not proven; image/client-deliverable/public delivery not claimed | Soft — R2 done; OpenAI image one-image KEEP does not claim image-byte R2 persistence | Yes |
| Image provider | STAGING LIVE PROVEN (OpenAI one-image path only) | Staging artifact `c07df10` 2026-07-12 marker `DCA-IMG-OPENAI-20260712T102457Z-a08x91rb`: AI Policy → `image_single` → `ImageProviderAdapter` → `OpenAIImageAdapter` → OpenAI Images; provider=`openai` broker=`direct` model=`gpt-image-1` quality=`low` size=`1024x1024`; submit=1 output=1 retry=0 fallback=false; PNG 1213472 bytes sha256 `5892cadc…a82f`; COMPLETED ledger `e46ae5cd-…`; `liveProviderCalled=true`; estimatedCostUsd `0.10` (`actualCostUsd=null`); R2 persistence not applicable; live flags restored disabled; BFL requests=0 | Generic provider switching / three-image sets / regeneration / client approval / WordPress / production image not claimed; BFL successful generation remains NOT PROVEN | Soft — WS7 Image one-image done; next WS7 = WordPress | Yes |
| AI Policy / provider routing architecture | LOCAL FOUNDATION (docs alignment COMPLETE 2026-07-12) | Canonical layers + terminology in [`AI_POLICY_PROVIDER_ROUTING.md`](../architecture/AI_POLICY_PROVIDER_ROUTING.md); OpenRouter = preferred text broker/adapter, not universal boundary; direct image/audio adapters valid under AI Policy | Universal multi-provider switching / FLUX / image live / Orchestrator plan→execute **not** claimed | Soft — guides next image adapter block | Yes if claimed as fully implemented |
| WordPress | STAGING LIVE PROVEN (dedicated one-draft create-and-trash only) | Staging artifact `bd649d5` 2026-07-12 marker `DCA-WP-DRAFT-20260712T130503Z-8ecfacb2`: target `05ef12aa-…` on `purivastaging.digitalcubeagency.net`; auth identifier = WordPress user e-mail in `wordpressUsername` (len 17); App Password encrypted (len 29); `createWordPressDraft` → status `draft` post ID `6`; exact-ID trash; attempt TRASHED; retry=0; fallback=false; media=0; flags restored false; generic publish remains `WORDPRESS_LIVE_HTTP_FROZEN`; three prior AMBIGUOUS 401 attempts retained | General publication / image attach / production WordPress not claimed | Soft — WS7 WP one-draft done; next WS7 = GA/GSC | Yes |
| GA/GSC | LOCAL FOUNDATION | Snapshot-first / config helpers | OAuth + live sync proof | Yes for WS7 GA/GSC step | Yes |
| Market Intelligence | LOCAL FOUNDATION | Admin MI MVP local | Live ingestion / staging proof | Yes for WS7 MI step | Yes |
| Google Docs / Drive frontend | DEFERRED | BLOK 9 owner-deferred 2026-07-11 | Owner reactivation of BLOK 9 | No (explicitly deferred) | Yes if claimed as ready |
| Component system | LOCAL FOUNDATION — canonical decision COMPLETE; Wave 1 + **Modal Wave COMPLETE** | Public system: `apps/web/src/components/ui`; private foundation: `apps/web/src/design-system`; [`CANONICAL_COMPONENT_SYSTEM.md`](./CANONICAL_COMPONENT_SYSTEM.md); import-guard baseline **0**; canonical Modal = `ui/Modal` (DS adapter + portal); legacy `components/Modal` **deleted**; 23/23 page consumers migrated | Remaining: Card adapter; DS Modal `aria-describedby` / nested stack (gated) | Soft — later waves remain | Soft |
| Rollback / compatibility plan | ROLLBACK READY WITH CONDITIONS | Current staging `a8a74e6`; retained rollback API tag `staging-dcaosv1-staging-api:1b8d00d` + web backup `dist-before-a8a74e6-20260712-042923`; schema delta none; rollback rehearsal PASS (2026-07-12) | Owner-gated rollback only if needed; do not delete retained tags/backups | Soft | Yes |
| Docker non-root runtime | STAGING LIVE PROVEN | Exact commit `80569c68f94481b33dd0a3c2a5a3ec17b41e31cd`; local candidate image `Config.User=node`; local and staging runtime UID/GID `1000/1000`; staging API container recreated only; no permission or restart regressions; staging API/web/static asset/auth smoke PASS | Production non-root proof and production deploy remain separately owner-gated | No | Yes |
| Production | FROZEN | Staging PASS does not authorize production; artifact SHA / rollback target UNKNOWN | Turnstile/R2 rotation; G49/G50; explicit go/no-go | N/A (not staging) | Yes — frozen |

---

## 7. Current dependency findings

**Source:** Vite remediation closeout (commit `95af080`) + Workstream 1 Point 1 confirmation at `250e958` (2026-07-12) + **re-verification 2026-07-13** at `main` `622b1ed`.
**Fix status:** Vite high finding **CLOSED / RESOLVED**. No `npm audit fix` / `--force` was used. No further Vite upgrade required on this triage.

### Audit summary (post-remediation; re-verified 2026-07-13)

| Metric | Value |
|--------|--------|
| Critical | 0 |
| High | 0 (Vite high finding remediated via Vite `6.4.3`; GHSA-fx2h-pf6j-xcff absent from current `npm audit`) |
| Moderate | 4 remaining transitive (`uuid` → `gaxios` / `googleapis-common` / `googleapis`) — **not** claimed closed here |
| Low / info | not claimed here |

### Vite remediation (Point 1 — COMPLETE; re-verified 2026-07-13)

| Field | Value |
|-------|--------|
| Advisory | `GHSA-fx2h-pf6j-xcff` / `CVE-2026-53571` — Windows Vite **dev server** `server.fs.deny` bypass |
| Affected range | `vite` `<=6.4.2` (also other majors; not installed here) |
| Patched (6.x) | `6.4.3` |
| Package | `vite` (direct dependency of `@dca-os-v1/web`, exact pin) |
| Declared / installed | Vite `6.4.3` only (single lockfile copy; `npm ls vite --all` → no duplicates) |
| Remediation commit | `95af080` |
| Classification | **RESOLVED** — patched version installed; high advisory absent; validate PASS on re-check |
| Staging / production applicability | **NOT_AFFECTED** for static Caddy `dist` + API-only container (Linux; no Vite HTTP server). Local Windows `vite`/`dev:web` was the in-scope surface and is patched. |
| Staging redeploy for this finding | **NOT_REQUIRED** (no dependency change on re-triage; exploit path is not staging/prod static serve) |
| Not claimed | Production exploit history rewritten; moderate `uuid`/googleapis findings closed; all dependency risk closed |

**Rules:** Do not run `npm audit fix` / `--force`. Do not claim moderate findings remediated until separately triaged. Do not treat Vite remediation as a staging deploy authorization.

---

## 8. Open decisions

| Decision | Status |
|----------|--------|
| Canonical component system (`components/ui` public + `design-system` private) | **COMPLETE** — see [`CANONICAL_COMPONENT_SYSTEM.md`](./CANONICAL_COMPONENT_SYSTEM.md); Wave 1 + Modal Wave COMPLETE |
| Wave 0 component import guard | **COMPLETE** (`250e958`; historical freeze 108; **current frozen baseline = 0** after Modal Wave) |
| Orchestrator proof position in mandatory live-proof sequence | **COMPLETE decision** — `HYBRID — PREFLIGHT + EMBEDDED LIVE PROOF`. **AI-A staging preflight KEEP (2026-07-12):** Orchestrator = `CONFIG SHAPE PROVEN`. **Cannot** reach `STAGING LIVE PROVEN` until plan→execute is wired. **AI-B KEEP (2026-07-12):** AI Delivery OpenRouter path = `STAGING LIVE PROVEN` (not Orchestrator live). **R2 KEEP (2026-07-12):** private-storage exact object roundtrip = `STAGING LIVE PROVEN`. **OpenAI Images KEEP (2026-07-12):** staging one-image AI Policy path = `STAGING LIVE PROVEN` (one bounded neutral image only). **WordPress KEEP (2026-07-12):** dedicated staging one-draft create-and-trash = `STAGING LIVE PROVEN` on `bd649d5`. Next live integration gate = GA/GSC. |
| Rollback / compatibility plan | **COMPLETE** — verdict `ROLLBACK READY WITH CONDITIONS`; known-good target `1b8d00d` |
| Rollback rehearsal | **OPEN** — separately gated; **not executed** |
| SHA-tagged retained staging API image (`staging-dcaosv1-staging-api:1b8d00d`) | **OPEN** until staging safeguard phase |
| Image provider selection | **COMPLETE (2026-07-12 pivot + staging one-image KEEP)** — active primary=`openai`, model=`gpt-image-1`, adapter=`OpenAIImageAdapter`; BFL/`flux-2-pro` preserved inactive; staging one-image live proven on `c07df10`; broader image workflows still OPEN |
| AI Policy / provider routing architecture alignment | **COMPLETE** (docs-only 2026-07-12) — prohibits parallel modality routing systems; does not implement adapters |
| Production artifact SHA and rollback target | UNKNOWN / OPEN (production FROZEN; staging target remains `1b8d00d`) |
| Staging credential availability for next live proofs | OPEN |
| Production Turnstile and R2 credential rotation execution | OPEN — DEFERRED (Phase B/C) |
---

## 9. Current execution boundary

| Boundary | State |
|----------|--------|
| Workstream 1 Points 1–4 | **COMPLETE** at repo HEAD `250e958` |
| Active next local Workstreams | **2–5** (integration contracts → architecture/UI → workflow hardening → full local validation) |
| Commit / push / deploy | **No approval** unless owner grants separately |
| Staging mutation | **No deploy** — last proven artifact remains `1b8d00d`; safeguard backups/tags only when separately authorized |
| Production mutation | **No** — production FROZEN |
| Next staging artifact | **Does not exist yet** |
| Live provider calls in local Workstreams 2–5 | **No** (except explicitly gated live proofs later) |
| Orchestrator plan→execute live wiring | **Not authorized** by WS1 closeout |

## 10. Workstream 1 point ledger

| Point | Result | Evidence |
|-------|--------|----------|
| 1 — Vite security remediation | **COMPLETE** | Vite `6.4.3`; high finding closed; validate PASS; commit `95af080` |
| 2 — Canonical component system decision | **COMPLETE** | Public: `apps/web/src/components/ui`; private: `apps/web/src/design-system` |
| Wave 0 — import guard | **COMPLETE** | Commit `250e958`; historical freeze 108; current baseline **0** (Modal Wave); new violations = 0 |
| Wave 1 — first consolidation slice | **COMPLETE** | Canonical doc; ui barrel Tabs/compound Table/ActivityItem; unused root Empty/Error/Loading/StatusNotice deleted |
| Modal Wave | **COMPLETE** (this workstream) | `ui/Modal` = DS adapter + portal; 23/23 consumers on `components/ui`; legacy `components/Modal` deleted |
| 3 — Rollback / compatibility plan | **COMPLETE** (rehearsal separately gated) | Verdict `ROLLBACK READY WITH CONDITIONS`; target `1b8d00d`; schema delta none |
| 4 — Orchestrator proof decision | **COMPLETE** | `HYBRID — PREFLIGHT + EMBEDDED LIVE PROOF`; Orchestrator stays `LOCAL FOUNDATION` |

**Not marked complete:** rollback rehearsal; SHA-tagged retained API image (pre-safeguard); Waves 1–5 UI migration; Orchestrator `STAGING LIVE PROVEN`.

Related operator docs:

- [`docs/STATUS.md`](../STATUS.md)
- [`docs/architecture/AI_POLICY_PROVIDER_ROUTING.md`](../architecture/AI_POLICY_PROVIDER_ROUTING.md) — AI Policy / provider routing architecture (authoritative alignment)
- [`docs/architecture/AI_MODEL_POLICY.md`](../architecture/AI_MODEL_POLICY.md) — provider/model selection policy
- [`docs/operator/deferred-scope-register.md`](../operator/deferred-scope-register.md)
- [`docs/runbooks/STAGING_READINESS.md`](../runbooks/STAGING_READINESS.md)
