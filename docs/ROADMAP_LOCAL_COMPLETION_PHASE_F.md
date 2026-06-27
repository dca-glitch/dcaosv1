# Phase F — Local Completion Roadmap (Blocks 58–77)

**Status:** Active local closeout after Post-MVP Blocks 31–57  
**Branch convention:** `feature/local-closeout-blocks-58-77`  
**Scope:** Local-only. No VPS, staging, production deploy, live providers, or live-cost features.

**Prior closeout:** [`docs/runbooks/POST_MVP_BLOCK_57_LOCAL_REPO_FINAL_CLOSEOUT.md`](./runbooks/POST_MVP_BLOCK_57_LOCAL_REPO_FINAL_CLOSEOUT.md)

**Completion index:** [`docs/runbooks/PHASE_F_LOCAL_CLOSEOUT_INDEX.md`](./runbooks/PHASE_F_LOCAL_CLOSEOUT_INDEX.md)

Percentages in this document measure completion **within each area's approved local scope**, not the full long-term PRD vision.

---

## Excluded from Phase F (separate owner gates)

| Area | Reason |
|------|--------|
| Staging / VPS / deploy / production migrations | Live environment |
| OpenRouter live / AI cost execution | Live cost |
| Resend / real email sending | Live provider |
| Google OAuth / GA / GSC live sync | Live OAuth + API |
| Google Drive export with real service account | Live Google |
| WordPress publish to live Puriva | Live WP |
| Production R2 bucket on VPS | Live storage |
| Stripe / accounting integrations | Live payments |
| Client Portal Phase 2 (magic links, comments, approve) | Separate large block |
| Revenue Hub, POD, broad scraping | Future modules |

---

## Block map

### Level A — Architecture foundations (~95–97%)

| Block | Area | Target % | Goal | Layer |
|-------|------|----------|------|-------|
| **58** | Docs consistency | 98% | Unify % and labels (Portal, WP, MI, R2) across `STATUS_*`, `ROADMAP`, `README` | docs |
| **59** | Module middleware (Block 6) | 96% | Operator runbook: `dry_run` vs `enforce`, API restart; local enforce smoke with seed | docs + smoke |
| **60** | Client Hub + PublicationTarget | 97% / 95% | Edge-case UX: empty target, archived client, legacy WP read-only; extended browser smoke | frontend + smoke |
| **61** | Encrypted credentials (Block 4) | 88% | Operator checklist: master key locally, rotate procedure; probe in pre-staging | docs + smoke |

### Level B — Operational core (~88–92%)

| Block | Area | Target % | Goal | Layer |
|-------|------|----------|------|-------|
| **62** | Platform core | 92% | Settings/Team/Company Profile polish (Dark Nebula); no invite/reset UI | frontend |
| **63** | Monthly Reports | 92% | Compact pass UI + snapshot metrics UX; manual review checklist before archive | frontend + docs |
| **64** | WordPress handoff (Block 5, local) | 90% | Operator flow: draft prepared → PublicationLog → no auto-publish; smoke without `WORDPRESS_PUBLISH_ENABLED` | docs + smoke |
| **65** | Clients / Projects / Tasks | 88% | Filter consistency, monthly project flow, AI Delivery links; CRM regression smoke | frontend + smoke |
| **66** | AI Delivery | 88% | Operator summary + dead-end UX; deferred route copy aligned with register | frontend + docs |
| **67** | Market Intelligence | 86% | Compact pass (data-dense); handoff → AI Delivery regression smoke | frontend + smoke |

### Level C — Client path and finance (~78–85%)

| Block | Area | Target % | Goal | Layer |
|-------|------|----------|------|-------|
| **68** | Client Portal MVP polish | 100% features / UX gap | Shell review, empty/sparse/populated edge cases; no advanced actions | frontend + smoke |
| **69** | Finance | 82% | Second-tenant local fixture → full cross-tenant proof; upload/download sanity | test fixture + smoke |
| **70** | Audit / activity | 78% | Read-only event list (tenant, type filter); no destructive actions | frontend + smoke |

### Level D — Guarded integrations (~55–75%)

| Block | Area | Target % | Goal | Layer |
|-------|------|----------|------|-------|
| **71** | AI SEO + Content Production | 72–75% | Shell closeout: plan → draft → packaging → export handoff without Google live | frontend + docs |
| **72** | Google Drive export (planning) | 65% | `provider_disabled` + export-config contract only; no strict live gate | smoke + docs |
| **73** | R2 / private storage | 65% | Operator runbook: disabled guard, optional roundtrip; prod switch deferred | docs + smoke |
| **74** | AI provider (OpenRouter) | 55% | UI copy + planning config: deterministic default, opt-in clearly off | docs + smoke |
| **75** | Email / notifications (EN2 lite) | 35% | Read-only outbox + AuditLog event mapping; no Resend | backend + smoke |

### Level E — Phase closeout

| Block | Area | Goal | Layer |
|-------|------|------|-------|
| **76** | First-client practice run | Puriva end-to-end per `first-client-next-actions.md`; confusion log | process + docs |
| **77** | Phase F local closeout | `validate` + `smoke:pre-staging:local` + update `STATUS_COMPLETION` | validation |

---

## Canonical status labels

| Label | Meaning |
|-------|---------|
| **Done (local)** | Usable for approved local/admin MVP; smoke gates pass |
| **In progress** | Foundation exists; Phase F block targets remaining gap |
| **Deferred** | Intentionally inactive; separate owner gate |
| **Done (local) — UX polish** | Feature scope complete; operator UX refinement in Phase F |

### Key area labels (aligned Block 58)

| Area | % in scope | Status label |
|------|------------|--------------|
| Client Portal MVP (visibility) | **100%** | Done (local) — UX polish in Block 68 |
| Client Portal advanced actions | **0%** | Deferred (Phase 2) |
| WordPress publish + PublicationLog | **90%** | Done (local); live Puriva = owner gate |
| Market Intelligence | **86%** | Done (local); compact pass in Block 67 |
| Private storage (R2) | **65%** | In progress; local roundtrip smoke exists |
| Module middleware | **96%** | Done (local); staging `enforce` = owner gate |
| Encrypted credentials | **88%** | Done (local); prod master key = owner gate |

---

## Execution order

1. **58** → **59** → **60** → **61** (architecture + docs)
2. **62** → **63** (UI foundation)
3. **64** → **65** → **66** → **67** (operator delivery path)
4. **68** → **69** → **70** (client + finance + audit)
5. **71** → **72** → **73** → **74** → **75** (guarded integrations)
6. **76** → **77** (proof + closeout)

---

## After Phase F (requires live / owner)

1. Confirm or create a real **staging host** (not `system.digitalcubeagency.net` without reclassification).
2. VPS staging pack + migrations + `smoke:mvp:staging`.
3. Owner env gates: credential master key, R2 prod, OpenRouter, Google SA, WP publish.
4. Production deploy — separate approval.
