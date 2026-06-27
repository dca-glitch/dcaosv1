# DCA OS Lite — Project Completion Overview

**Status:** Planning and operator reference  
**Last updated:** 2026-06-26  
**Reference branch:** `feature/ai-delivery-project-brief-foundation` @ `7c2aeed`  
**Scope:** Approved local admin MVP + client/domain operating model (blocks 1–6). VPS/production intentionally excluded until separate approval.

Percentages measure completion **within each area's approved scope**, not the full long-term PRD vision.

Related documents:

- [`docs/operator/module-completion-matrix.md`](./operator/module-completion-matrix.md)
- [`docs/operator/deferred-scope-register.md`](./operator/deferred-scope-register.md)
- [`docs/STATUS.md`](./STATUS.md)
- [`docs/ROADMAP.md`](./ROADMAP.md)
- [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md)

---

## Overall summary

| Perspective | % | Meaning |
|-------------|---|---------|
| **Local admin MVP** (DCA operator, local dev) | **~76%** | Core modules work locally; validate/smoke largely pass |
| **Client/domain roadmap (blocks 1–6)** | **~82%** | Implemented locally; staging/prod = 0% |
| **Production readiness** (real clients, VPS) | **~38%** | Runbooks exist; deploy/migration deferred |
| **Full PRD vision** (future modules + automation) | **~28%** | Large portion intentionally deferred |

---

## Status legend

| Label | Meaning |
|-------|---------|
| **Done** | Usable for current approved local/admin MVP scope |
| **In progress** | Foundation exists; important pieces remain |
| **Deferred** | Intentionally not active; waiting for a separate approved block |

---

## Module and area matrix

| Area / module | % in scope | Status | Notes |
|---------------|------------|--------|-------|
| **Platform core** (auth, tenant, modules, CI, validate) | **90%** | Done | Login, tenant context, CI PASS |
| **Dark Nebula UI + data-dense admin** | **85%** | Done | Phase 1/2 closed; polish remains in MI/Portal/settings |
| **Clients (CRM)** | **88%** | Done | CRUD, filters, `clientKind`, website |
| **Client Hub + domain model (block 1)** | **92%** | Done | Hub UI, profile, local migration, Playwright smoke PASS |
| **PublicationTarget (block 2)** | **92%** | Done | CRUD per client; legacy tenant API deprecated with headers |
| **MI → clientId (block 3)** | **88%** | Done | FK, client picker UI, handoff; `clientId` parser fix applied |
| **Encrypted credentials (block 4)** | **72%** | In progress | API + AES-GCM; prod key and security review gate pending |
| **WordPress publish + PublicationLog (block 5)** | **58%** | In progress | Log + wiring; live publish requires env + credentials |
| **Module middleware (block 6)** | **68%** | In progress | `tenantModuleGuard` on routes; **enforce = off** |
| **Projects & Tasks** | **88%** | Done | Admin MVP closed |
| **AI Delivery** | **82%** | Done | Brief → deliverable → export → monthly report path |
| **Market Intelligence** | **74%** | In progress | Admin MVP + handoff; no recurring/automation |
| **Monthly Reports** | **78%** | Done | Admin + PDF + client archive FINAL-only |
| **Client Portal** | **45%** | In progress | Read-only archive only; no client actions |
| **Finance** | **80%** | Done | Invoices, bills, vendors, credit notes; `OWN_DOMAIN` invoice guard |
| **AI SEO + Content Production** | **62%** | In progress | Admin shell; no live Google integrations |
| **Private storage (R2)** | **50%** | In progress | Local proof; production bucket deferred |
| **Email / notifications** | **22%** | In progress | Backend foundation; no real sending |
| **Audit / activity** | **55%** | In progress | Writer + dashboard feed; no full audit UI |
| **AI provider (OpenRouter)** | **40%** | In progress | Guarded path; default remains deterministic local |
| **Operator docs & runbooks** | **88%** | Done | SOP, matrix, deferred register, staging procedure |
| **Tests / smoke** | **75%** | In progress | API smokes + `smoke:client-domain:browser`; staging smoke not run |
| **PR merge → main** | **0%** | In progress | PR #13 open; waiting on staging gate |
| **Staging / VPS deploy** | **5%** | Deferred | Documentation only; intentionally paused |
| **Production deploy** | **0%** | Deferred | Frozen |
| **Licensee tenant migration** (`OWN_DOMAIN` → separate tenant) | **0%** | Deferred | Future block |
| **Revenue Hub AI** | **0%** | Deferred | Future module |
| **POD AI Toolkit** | **0%** | Deferred | Future module |
| **Scraping / broad data collection** | **0%** | Deferred | Future module |
| **Client Portal MVP** (client-safe visibility for Puriva) | In progress | Required | See `docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md` |
| **Client Portal actions** (approve, comments, magic links) | **0%** | Phased after MVP visibility | See deferred scope register |
| **Live GA/GSC, Google OAuth** | **0%** | Deferred | Snapshot-first only today |
| **Live WordPress auto-publish (prod)** | **0%** | Deferred | Draft handoff yes; auto-publish no |
| **Stripe / payments / accounting integrations** | **0%** | Deferred | Finance = admin records |
| **Invite / password reset / role editing UI** | **0%** | Deferred | Security improvements deferred |

---

## Client/domain roadmap — blocks 1–6

| Block | Name | % | Status |
|-------|------|---|--------|
| 1 | Client foundation + `clientKind` | **92%** | Done |
| 2 | PublicationTarget | **92%** | Done |
| 3 | MI → `clientId` | **88%** | Done |
| 4 | Encrypted credentials | **72%** | In progress |
| 5 | Real WP publish + PublicationLog | **58%** | In progress |
| 6 | Module middleware | **68%** | In progress |
| *Future* | Licensee tenant migration | **0%** | Deferred |

**Average of blocks 1–6 (local): ~82%**

---

## Ready today vs waiting

### Ready for local operator work (~76% of operational product)

- CRM (Clients, Projects, Tasks)
- AI Delivery admin workflow
- Market Intelligence admin workflow
- Finance admin records
- Monthly Reports (admin + client-safe archive path)
- Client Portal (read-only)
- Client Hub (profile, publication targets, analytics shell)

### In progress — finish before production

- Publication/credentials/publish (blocks 4–5)
- Module enforcement (block 6, after tenant module seed on target)
- Deprecate legacy tenant WordPress config
- Staging validation + merge PR #13

### Intentionally deferred (not counted as missing bugs)

- VPS and production deploy
- Live external integrations (Google, WordPress auto-publish, email sending)
- Client approval workflows in portal
- Future modules (Revenue Hub, POD, scraping)
- Licensee tenant migration

---

## How to refresh this document

Update after:

1. A major block closes (schema + API + UI + smoke).
2. Staging or production promotion (separate approval).
3. A module moves from deferred → active in the deferred scope register.

Suggested validation before updating percentages:

```powershell
cd C:\dcaosv1
npm run validate
npm run smoke:local
npm run smoke:client-access:local
npm run smoke:client-domain:browser
```

Do not treat local smoke alone as production readiness.

---

## Change log

| Date | Change |
|------|--------|
| 2026-06-26 | Initial completion overview after client/domain operating model implementation and Playwright browser smoke |
