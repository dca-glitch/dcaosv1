# G56 — Double-Scope Pre-Live Completion Mega Block

**Status:** Local PASS (pre-live groundwork)
**Date:** 2026-07-09
**Baseline:** G55 `1519b7f` — AI Orchestrator Lite skeleton
**Production deploy:** Frozen — not authorized
**Live providers:** Disabled-safe — not enabled

---

## Mission

Expand G55 orchestration foundation across AI contracts, guards, admin UX, workflow planning, client boundaries, docs, QA, and staging readiness — without live provider integration or production deploy.

---

## Megablock completion matrix

| Block | Goal | Outcome |
|-------|------|---------|
| 1 | G55 CI & baseline reconciliation | PASS — main clean, `1519b7f`, CI green |
| 2 | Orchestrator contract review | PASS — shared contracts extended; prompt template versioning added |
| 3 | Provider registry completion | PASS — all roles mapped; dedicated unit tests; no-live invariant |
| 4 | Material policy guard | PASS — expanded tests; medical/SaaS/before-after rules verified |
| 5 | Budget guard | PASS — under/near/over/kill-switch tests; DB ledger deferred |
| 6 | Audit metadata hardening | PASS — prompt template version wired; liveProviderCalled false |
| 7 | Material routing preview API | PASS — existing endpoints; smoke added |
| 8 | Orchestrator registry smoke | PASS — `smoke:ai-orchestrator-lite:local` |
| 9 | Prompt template versioning | PASS — registry service + shared contract |
| 10 | AI kill switch invariant | PASS — `ai-kill-switch.service.ts` + tests |
| 11 | Admin UI registry panel | PASS — `AiOrchestratorLitePanel` in dashboard |
| 12 | Admin UI routing preview | PASS — sample preview in same panel |
| 13 | Admin UI budget preview | PASS — Puriva $100 cap + remaining budget visible |
| 14 | Workflow execution adapter | PASS — planning skeleton only; no live execution |
| 15 | AI Delivery status alignment | PASS — existing review-ready/final rules unchanged |
| 16 | WorkflowBriefs context integration | PASS — adapter blocks unapproved brief |
| 17 | Research pack integration plan | PASS — shared contract `ai-research-pack.ts` |
| 18 | SEO planning pack | PASS — shared contract `ai-seo-planning-pack.ts` |
| 19 | Content draft batch planning | PASS — shared contract `ai-content-draft-batch.ts` |
| 20 | Compliance review fixtures | PASS — deterministic local fixtures + tests |
| 21 | Client portal final-only | PASS — existing boundary smoke authoritative |
| 22 | Admin/client boundary smoke | PASS — orchestrator routes added to boundary smoke |
| 23 | Auth/RBAC guard review | PASS — admin-only routes unchanged; boundary smoke expanded |
| 24 | Monthly reports agent readiness | PASS — docs note; GA/GSC live deferred |
| 25 | GA/GSC disabled-safe proof | PASS — existing readiness layer; live proof deferred |
| 26 | WordPress handoff safety | PASS — no auto-publish; existing guards unchanged |
| 27 | Storage/R2 disabled-safe | PASS — existing boundary smokes authoritative |
| 28 | Before/after retention contract | PASS — `ai-before-after-retention.ts`; cleanup job deferred |
| 29 | Email/notification no-send | PASS — notification event types; no-send default |
| 30 | Finance Lite / SaaS boundary | PASS — docs note in material classification |
| 31 | Puriva operating pack table | PASS — STATUS + Puriva docs updated |
| 32 | Production readiness gate | PASS — deploy frozen; blockers listed |
| 33 | Staging readiness next-gate | PASS — plan documented; no staging mutation |
| 34 | HSTS/security register | PASS — G54 closed; no new proxy changes |
| 35 | QA matrix expansion | PASS — LOCAL_SMOKE_MATRIX updated |
| 36 | Smoke script review | PASS — orchestrator smoke added; gaps documented |
| 37 | Deferred scope register | PASS — G56 outcomes recorded |
| 38 | STATUS.md completion table | PASS — component table updated |
| 39 | Final validation & safety proof | See validation section below |
| 40 | Final diff review, commit, push | See closeout section below |

---

## Key additions

### Code

- Shared contracts: prompt template, before/after retention, compliance fixtures, research pack, SEO planning, content draft batch, notification events
- Services: prompt template registry, kill switch, workflow adapter skeleton, compliance fixtures
- Tests: provider registry, material policy, budget guard, kill switch, prompt template registry
- Admin UI: `AiOrchestratorLitePanel` (registry + preview + budget)
- Smoke: `smoke:ai-orchestrator-lite:local`
- Boundary: orchestrator routes in `smoke-client-role-api-boundary-local.mjs`

### API endpoints (unchanged from G55)

- `GET /api/v1/ai-orchestrator-lite/registry` — admin only
- `POST /api/v1/ai-orchestrator-lite/material-routing-preview` — admin only, preview only

---

## Validation commands

```powershell
cd C:\dcaosv1
npm.cmd run validate
npm.cmd run test:unit --workspace=@dca-os-v1/api
npm.cmd run smoke:ai-provider-config:local
npm.cmd run smoke:ai-orchestrator-lite:local
npm.cmd run smoke:puriva-client-portal-boundary:local
```

Stop on validate failure. Do not run smokes after failed validate.

---

## Deferred after G56

- DB-persisted AI budget spend ledger
- Admin editable provider settings UI
- Live provider staging proof per role
- Image generation / vision QA live proof
- Live email / R2 / WordPress / GA-GSC proof
- Orchestrator wired into workflow execution adapter (live path)
- Production deploy (G50)
- Before/after destructive cleanup job (dry-run default when implemented)

---

## Safety proof

| Check | Status |
|-------|--------|
| Live AI calls | none |
| Image generation live | not triggered |
| Email send | not triggered |
| R2 live | not touched |
| WordPress live | not touched |
| GA/GSC live | not touched |
| Payment provider live | not touched |
| Production deploy | not performed |
| Secrets in diff/log | none |

---

## Kill switch behavior

Default env and registry state:

- `AI_TEXT_GATEWAY` defaults to `local` (not live OpenRouter)
- `IMAGE_GENERATION_ENABLED` defaults false
- All orchestrator registry placeholders disabled except `local_deterministic` and `manual_stock_default`
- Preview endpoints set `liveProviderCalled: false`
- Kill switch service asserts no registry live providers enabled

See `apps/api/src/core/ai-kill-switch.service.ts`.
