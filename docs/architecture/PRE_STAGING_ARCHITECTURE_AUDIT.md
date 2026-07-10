# PRE-STAGING Architecture Consistency Audit

**Status:** Audit record (pre-staging closure)  
**Date:** 2026-07-10  
**Branch context:** `main`  
**Audience:** Product owner, operators, implementers, AI agents  

**Scope:** Architecture consistency for Internal Agency OS first, Client Operating Packs (Puriva as first pack, not a fork), module entitlement/visibility, channel boundaries, module portfolio boundaries, duplicated helper families, and hotspot split candidates.

**Non-goals:** This document does not change STATUS, Integrations Truth Matrix, Puriva Launch Gate, or deferred-scope register. It does not authorize schema, API contract, auth, or deploy work.

**Canonical sources:**

- [`CLIENT_DOMAIN_OPERATING_MODEL.md`](./CLIENT_DOMAIN_OPERATING_MODEL.md)
- [`CLIENT_OPERATING_PACKS.md`](./CLIENT_OPERATING_PACKS.md)
- [`PURIVA_OPERATING_PACK_V1.md`](./PURIVA_OPERATING_PACK_V1.md)
- [`CLIENT_OPERATING_PACK_SAAS_LATER.md`](./CLIENT_OPERATING_PACK_SAAS_LATER.md)
- [`G52_OWNER_DISPOSITION.md`](./G52_OWNER_DISPOSITION.md)
- [`G217_G222_FUTURE_MODULE_CONTRACTS_CLOSEOUT.md`](./G217_G222_FUTURE_MODULE_CONTRACTS_CLOSEOUT.md)
- [`REVENUE_HUB_AI_RH0_OPERATING_MODEL.md`](./REVENUE_HUB_AI_RH0_OPERATING_MODEL.md)
- [`POD_AI_TOOLKIT_POD0_OPERATING_MODEL.md`](./POD_AI_TOOLKIT_POD0_OPERATING_MODEL.md)
- Proof-state vocabulary: [`../ux/proof-state-vocabulary.md`](../ux/proof-state-vocabulary.md)

---

## 1. Executive verdict

| Area | Verdict | Notes |
|------|---------|-------|
| Internal Agency OS first | **PASS (docs)** / **PARTIAL (top-level wording)** | Canonical architecture docs align; README / some UI audit docs still say “SaaS” as product framing |
| Puriva = Client Operating Pack, not fork | **PASS (model)** / **PARTIAL (runtime)** | `coreForkAllowed: false`; Puriva-named API modules are first-pack proof, not a Core fork |
| Generic vs pack-specific | **PARTIAL** | Pack constants exist; runtime still reaches Puriva modules by name |
| Module entitlement / visibility | **PARTIAL** | Matrix is config-only; nav/API enforcement not wired |
| Website/social now vs paid ads later | **PASS** | Paid ads blocked / `future_out_of_scope` consistently |
| AI Workflow / SEO / MI / Revenue / POD | **PARTIAL** | Contracts align; route/taxonomy map incomplete; RH readiness probe ahead of pack “future” label |
| Helper families | **PARTIAL** | Multiple truth/readiness vocabularies; proof-state helper now wired to admin readiness badges |
| Hotspot files | **Documented** | Mega-files remain; split plans exist for AI Delivery only |

**Overall Lane 10:** **PARTIAL** — no architectural blocker for local Puriva path; staging multi-client / entitlement enforcement remains open.

---

## 2. Truth labels — Agency OS first vs SaaS

### Canonical (keep)

- DCA OS Lite = **Internal Agency OS first**; SaaS-like productization is **later** (`saas_later`).
- Puriva Operating Pack v1 scaffolding is **not** multi-tenant SaaS readiness, self-serve onboarding, or productized billing.
- Production readiness remains **NO** until separate production gate clears (see G52-B disposition).

### Drift (document-only; proposed main-doc patches)

| Severity | Path | Finding |
|----------|------|---------|
| High | `README.md` | Opens as “Modular SaaS operating system” — conflicts with Agency OS first |
| Medium | `docs/ui-ux/V0_UI_UX_AUDIT_PACK.md` | “SaaS operations platform” / “Compact SaaS admin” framing |
| Low | Early `docs/PROJECT_CONTEXT.md` / `docs/ROADMAP.md` / foundation audit | Historical “SaaS foundation” language — add historical qualifier if touched |

**Code:** No affirmative “SaaS ready” product claim found in `apps/web` admin surfaces (benign keyword examples in MI excluded).

---

## 3. Puriva as Client Operating Pack (not a fork)

### Aligned

- Pack model: Core + generic modules + pack configuration (`CLIENT_OPERATING_PACKS.md`).
- Shared catalog: `packages/shared/src/client-operating-packs.ts` — `coreForkAllowed: false`, `ClientOperatingPackKey = "puriva"` only (expected for v1).
- Puriva does **not** duplicate auth/tenant/portal Core models.

### First-pack hardcoding (accepted for v1; abstraction later)

| Severity | Area | Finding | Fix type |
|----------|------|---------|----------|
| Medium | `apps/api/src/core/puriva-*.ts` | Puriva delivery scaffolds named in API core | Pack resolver later |
| High | `coreController` orchestrator registry | Always returns Puriva policy/boundary index | Generic registry when second pack approved |
| Medium | `external-integration-boundary.ts` | `operatingPackKey: "puriva"`, `purivaBlockers` | Parameterize by pack key |
| Medium | AI model routing | `AiRoutingClientProfile = "puriva"` | Profile keyed by pack |
| Medium | `client-portal.runtime.ts` | Imports Puriva manual metrics | Pack adapter later |

**Rule for agents:** Do not treat Puriva-named modules as permission to fork Core. Prefer pack adapters over client-named Core services when a second pack is approved.

---

## 4. Generic vs client-specific pack boundaries

| Severity | Finding | Fix type |
|----------|---------|----------|
| High | Pack config is pure constants; no runtime `Client` → `packKey` → entitled behavior bridge | Approved block later |
| Medium | Puriva MI helpers live in API (`puriva-market-intelligence.ts`); generic MI helpers in shared/API MI modules | Document placement; optional re-export |
| Medium | Content/image profiles still largely runbook/document truth vs structured DB | Deferred per pack docs §14 |
| Medium | Portal monthly metrics path Puriva-coupled | Pack abstraction later |

---

## 5. Module entitlement / visibility

### Config truth (Puriva pack)

Client-visible pack modules (config): `monthly-reports`, `client-portal`, `image-generation` (enabled/partial).  
`revenue-hub`, `pod-toolkit` = `future`, not client-visible.

### Runtime gaps

| Severity | Finding |
|----------|---------|
| High | Entitlement helpers (`isClientVisiblePackSurface`, etc.) are **config-only** — not enforced in nav/API |
| High | `module-access.resolver.ts` is a skeleton (`ok: false` pattern) — not wired |
| High | Web `navigation-filter.ts` is **role-based**, not pack-entitlement-based |
| High | **Taxonomy mismatch:** pack keys (`ai-workflow`, `ai-seo`, …) ≠ tenant module keys (`ai-delivery`, `market-intelligence`, …) ≠ UI routes |
| Medium | `TENANT_MODULE_ENFORCEMENT` defaults **off** |
| Medium | Admin routes outside pack matrix: `ai-operations`, `workflow-briefs`, `admin-daily-cockpit` |

### Proposed pack ↔ route map (documentation only)

| Pack / logical module | Tenant / registry theme | Primary UI routes |
|-----------------------|-------------------------|-------------------|
| `ai-workflow` | AI Delivery + ops | `#/ai-delivery`, `#/ai-operations`, `#/workflow-briefs`, `#/admin-daily-cockpit` |
| `ai-seo` | Inside AI Delivery | AI Delivery workspace (no separate hash) |
| `market-intelligence` | Market Intelligence | `#/ai-market-intelligence` |
| `monthly-reports` | Reports | Admin: AI Delivery modal; Client: `#/monthly-reports` / portal archive |
| `client-portal` | Portal | `#/client-portal`, `#/archive`, approvals |
| `wordpress-draft` | Publication handoff | Client Hub + AI Delivery draft-only flow |
| `image-generation` | Image package | AI Delivery / portal approval |
| `revenue-hub` | Future (RH0) | Preview / readiness probe only — not activated |
| `pod-toolkit` | Future (POD0) | Catalog template only — no UI route |

---

## 6. Website / social (current) vs paid ads (future)

| Verdict | Evidence |
|---------|----------|
| **PASS** | Pack `paidAdsScope: "future_out_of_scope"`; routing blocks `paid_ads`; workflow templates state website/social only |

**Medium drift:** Channel vocabulary differs across layers (`website` \| `social` vs `social_media` vs profile `socialMedia`). Normalization exists in routing; prefer a shared channel enum later.

---

## 7. AI Workflow / SEO / Market Intel / Revenue / POD boundaries

| Module | Boundary status |
|--------|-----------------|
| AI Workflow | Spans multiple admin routes; “AI Workflow” vs “AI Delivery” naming drift in UI |
| AI SEO | Pack admin-only; implemented inside AI Delivery — OK if mapping documented |
| Market Intelligence | Generic + Puriva pack-layer helpers; entitlement admin-only — aligned |
| Revenue Hub | Pack `future`; RH0 contracts only; **AI Delivery revenue-chain readiness fetch is ahead of pack label** — document / gate later |
| POD Toolkit | Pack `future`; POD0 docs-only; no UI routes — aligned |

---

## 8. Duplicated helper families

| Family | Location | Notes |
|--------|----------|-------|
| Proof-state (admin UI) | `apps/web/src/lib/proof-state-labels.ts` | Canonical admin labels; now used by `AdminOperationsPanel` readiness badges |
| Integration readiness API | `configured_shape_ok` / `disabled` / `missing_config` | Maps to proof-state `config_shape_ok` for display only |
| AI routing truth labels | shared + API routing truth modules | Separate from proof-state — keep indexed, do not merge casually |
| Storage / R2 truth labels | storage proof modules | Separate evidence family |
| StatusBadge stacks | `components/ui/StatusBadge`, design-system Badge, legacy Badge | Design-system migration rules apply; no broad rewrite in this audit |

**Vocabulary rule (pre-staging):**

| Concept | Prefer |
|---------|--------|
| Config shape validated | `Config shape OK` / `configured_shape_ok` (API) → never unqualified **Ready** |
| Live provider proven | Only after recorded staging/production proof — never imply from shape OK |
| Local practice | `Local only` / `Local OK` — ≠ launch ready |
| Blocked | Explicit blocker |
| Deferred | Allowed adjacent phrase; not the same as blocked |
| Draft prepared | Local/draft handoff — ≠ published |
| Image candidate | Preview / candidate — ≠ final accepted |

---

## 9. Large / hotspot file split candidates

### `apps/web` (approximate)

| ~Lines | File | Notes |
|--------|------|-------|
| ~6,000 | `pages/ai-delivery/AiDeliveryPage.tsx` | Primary hotspot — see `docs/ui/AI_DELIVERY_HOTSPOT_SPLIT_PLAN.md` |
| ~4,800 | `App.tsx` | Routing + data wiring monolith — **do not rewrite in leaf UI passes** |
| ~2,900 | `pages/clients/ClientHubPage.tsx` | Split candidate |
| ~2,500 | `pages/client-portal/ClientPortalPage.tsx` | Split candidate |
| ~2,200 | `pages/WorkflowBriefsPage.tsx` | Not in hotspot docs yet |
| ~1,700 | `pages/ai-delivery/MonthlyReportPanel.tsx` | Secondary hotspot |

### `apps/api` (approximate)

| ~Lines | File | Notes |
|--------|------|-------|
| ~13,000 | `core/core.runtime.ts` | Largest file — outside UI hotspot plans |
| ~3,400 | `controllers/coreController.ts` | Controller monolith |
| ~3,000 | `core/workflow-brief-ai.execution.ts` | Split candidate |
| ~2,800 | `core/client-publication.runtime.ts` | Split candidate |

**Pre-staging rule:** Prefer leaf copy/label fixes over hotspot extractionsits unless an approved split block is open.

---

## 10. Small local inconsistencies fixed in this closure pass

Documented for parent agent (UI lanes 11–13); architecture impact is display-only:

- Admin integration readiness badges: `configured_shape_ok` → **Config shape OK** (not **Ready**)
- Orchestrator panel: unqualified **Ready** / **Live** softened to local/config-safe labels
- WordPress publish result: distinguish `draft_prepared` / `provider_disabled` / `published`
- Client portal: safer error fallback, client-safe status labels, release-package wording, Workflow Briefs client empty states + hide AI Run Status for clients

No design-system, App.tsx routing, or shell changes in this audit pass.

---

## 11. Proposed main-doc patches (text only — do not apply here)

1. **`README.md`:** Replace “Modular SaaS operating system” with “Internal Agency OS (DCA OS Lite) — SaaS-like productization later.”
2. **`docs/ui-ux/V0_UI_UX_AUDIT_PACK.md`:** Replace “SaaS operations platform” with “agency operations platform” / “compact admin” where product framing is meant.
3. **`docs/STATUS.md` (owner-owned):** Optional cross-link to this audit under G429–G448 / pre-staging architecture; do not claim entitlement enforcement complete.
4. **Integrations Truth Matrix / Puriva Launch Gate (owner-owned):** Optional note that UI now labels `configured_shape_ok` as Config shape OK — matrix semantics unchanged.

---

## 12. Gate

**GATE: KEEP** | agent: yes | budget: medium | mistakes: 0  

- Backend/API/schema/auth/VPS/deploy: **not modified by this audit document**  
- No commit / push / deploy from this lane  
- Entitlement enforcement and Puriva pack abstraction remain **deferred** until an approved block
