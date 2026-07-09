# G53 Production Safety Plan

**Status:** Approved — planning only. Does **not** authorize implementation, VPS mutation, production deploy, or live integration enablement.

**Gate:** G53 — Production Safety Plan  
**Date approved:** 2026-07-09  
**Branch baseline:** `main` (G52-B docs baseline + G53 planning approval)  
**Source of truth:** [`docs/STATUS.md`](../STATUS.md)

Related:

- [`STAGING_READINESS.md`](./STAGING_READINESS.md) — staging proven; does not authorize production
- [`G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md`](./G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md) — environment proof approval pattern
- [`../operator/deferred-scope-register.md`](../operator/deferred-scope-register.md) — Puriva blockers vs still-deferred scope
- [`../operator/OPERATOR_RUNBOOK.md`](../operator/OPERATOR_RUNBOOK.md) — operator entry point

---

## 1. Gate decision

| Item | State |
|------|--------|
| G53 approved | **YES** — planning and documentation only |
| Authorizes implementation | **NO** |
| Authorizes production deploy | **NO** |
| Production readiness | **NO** |
| Production deploy frozen | **YES** — deferred until G49/G50 and explicit owner approval |
| Staging proven | **YES** — G46d/G47 PASS from prior gates |
| G49 dry-run executed | **NO** |
| G50 production deploy executed | **NO** |

G48 production readiness planning PASS and G53 production safety planning approval do **not** change production readiness to YES. Staging PASS does not authorize production deploy.

---

## 2. Production v1 principle

Production v1 for DCA OS Lite is **controlled agency operations**, not full automation.

| In scope for Production v1 | Out of scope for Production v1 |
|------------------------------|--------------------------------|
| Admin-controlled AI preparation and review | Autonomous agents or background AI runs without admin gate |
| Human approval before client-visible final material | Client-triggered or automatic publishing |
| Draft/handoff workflows (WordPress draft prep, not auto-publish) | WordPress auto-publish |
| Transactional workflow email when separately approved and proven | Marketing email campaigns |
| Single-tenant / first-client (Puriva) controlled delivery | Full SaaS onboarding or multi-tenant self-serve |
| Snapshot-first metrics and admin-reviewed reporting | Live GA/GSC sync without proof gates |
| Operator-run deploy gates with rollback evidence | Unattended or continuous deployment |

**Operator rule:** AI prepares; admin reviews and decides what becomes final. Clients see client-safe final material only.

---

## 3. Production readiness — NO

Production readiness remains **NO** as of G53 approval.

| Area | Production-ready | Notes |
|------|------------------|-------|
| Local/admin MVP workflows | Local-proven only | Does not transfer to production without live proof gates |
| Staging environment | Staging-proven | G46d/G47 PASS; HSTS warning remains |
| Production deploy | **NO** | Frozen; G49/G50 not executed |
| Live integrations | **NO** | AI provider, R2, GA/GSC, WP publish, transactional email — all gated |
| Puriva Launch | **Blocked** | Live proof gates required before launch (see deferred-scope register) |
| Incident/rollback execution | **NO** | Planning only; evidence required before any mutation |

Do not use ambiguous labels like "ready," "complete," or "production-ready" without precise scope (local vs staging vs production vs Puriva Launch).

---

## 4. Gate blockers (separate gates)

**Gate separation:** DCA OS Production v1 Gate and Puriva Client-Service Launch Gate are **independent**.

| Gate | Scope | Rule |
|------|-------|------|
| **A) DCA OS Production v1 Gate** | Production promotion safety (G49/G50 path) | Production v1 may become ready before Puriva Launch |
| **B) Puriva Client-Service Launch Gate** | Client delivery live proofs and product workflow gates (§4.2) | Puriva cannot launch until its own blockers are clean |

§4.1 blockers apply only to **(A)**. §4.2 blockers apply only to **(B)**. Do not mix the two lists.

### 4.1 DCA OS Production v1 blockers (safety and infrastructure)

These must be resolved or explicitly accepted with owner sign-off before any production mutation. Clearing §4.1 does **not** clear Puriva Launch.

| # | Blocker | Status | Next gate / action |
|---|---------|--------|-------------------|
| 1 | **HSTS / proxy security warning** | **Fixed in G54** — HSTS present on staging and production | Closed; backup and proof recorded in G54 completion note |
| 2 | **Rollback / restore evidence** | Not proven for production promotion | Backup/rollback procedure must be evidenced before G50 |
| 3 | **Env / secrets separation** | Not production-proven | Confirm staging credentials never in production; names-only inventory |
| 4 | **Credential storage** | Not production-proven | Server-side only; no secrets in repo or logs |
| 5 | **Tenant / client boundary** | Local/staging smoke-proven | Re-verify on target environment before production |
| 6 | **Integration truth matrix** | Config-shape only locally | Live provider, R2, GA/GSC, WP, email each need separate proof gates |
| 7 | **Controlled dry-run** | Not executed | **G49** before G50 |
| 8 | **Gate sequence** | G49 before G50 | G49 dry-run/read-only proof must pass before G50 deploy gate |

### 4.2 Puriva Client-Service Launch blockers (live proof required)

Separate from §4.1. Puriva cannot launch until these are closed with evidence.

See [`deferred-scope-register.md`](../operator/deferred-scope-register.md) § Puriva Launch blockers. Summary:

- R2 real-bucket proof
- GA/GSC live sync proof
- Live AI provider proof
- AI Model Research and AI Model Policy gates
- Image generation proof
- Transactional notifications proof (workflow email, not marketing)
- Client Portal approval UX, task-oriented admin UX, Article+Image workflow, Monthly Report flow, feedback learning — product gates before launch

WordPress **draft/handoff** is required for Puriva Launch; WordPress **auto-publish** remains deferred.

---

## 5. RBAC stance

| Context | Stance |
|---------|--------|
| **Production v1 (limited, single-client/agency ops)** | Current RBAC (owner/admin vs client, ClientUserAccess, tenant boundaries) is **not a blocker** for limited Production v1 **if** tenant/client boundaries remain safe and smoke-proven on the target environment |
| **Scaling / SaaS / multi-client self-serve** | Full DB-backed custom roles UI, project-specific grants, invite/reset flows — **blockers** until separate approved blocks |
| **Destructive actions** | Tenant/user destructive actions remain deferred |

RBAC maturity does not substitute for live integration proof, deploy safety, or Puriva Launch gates.

---

## 6. What G53 does not authorize

- Production deploy or production API/DB mutation
- VPS, Docker, Caddy, DNS, or migration execution
- G54 HSTS/proxy fix implementation (next safety blocker — planning reference only)
- G49 dry-run or G50 deploy execution
- Live OpenRouter / AI provider HTTP execution
- Live WordPress publish
- Live R2 bucket IO
- GA/GSC OAuth or live metrics sync
- Real email/SMS/WhatsApp sending
- Code, schema, or package changes

---

## 7. Next gates (ordered reference)

| Gate | Purpose | G53 authorizes execution |
|------|---------|--------------------------|
| **G54** | HSTS/proxy fix — next production safety blocker | **NO** — do not prepare or implement fix under G53 |
| R2 proof | Real-bucket storage proof | Separate approval |
| GA/GSC proof | Live analytics sync proof | Separate approval |
| AI Model Research | Model selection research gate | Separate approval |
| AI Model Policy | Approved model/policy documentation | Separate approval |
| Live AI proof | OpenRouter or approved provider execution proof | Separate approval |
| Image generation proof | Image gen provider/workflow proof | Separate approval |
| Transactional notifications proof | Workflow email delivery proof (not marketing) | Separate approval |
| **G49** | Production deploy dry-run / read-only proof | **NO** — not yet executed |
| **G50** | Production deploy gate (explicit owner approval) | **NO** — not yet executed |

Puriva Launch remains **blocked** until the live proof gates above and product workflow gates are closed with evidence.

---

## 8. Roadmap tracks (G53 alignment)

| Track | G53 state |
|-------|-----------|
| **Production Safety** | G53 approved (this document); G54 HSTS/proxy next |
| **Live Integration Proof** | Not started for production; staging config-shape only |
| **Client Operating Pack / Productization** | Local/admin-operational; Puriva Launch blocked pending proof gates |

---

## 9. Operator checklist (read-only)

Before requesting any future production gate:

1. Read [`docs/STATUS.md`](../STATUS.md) and this document.
2. Confirm production readiness is still **NO**.
3. Confirm G49/G50 have not been executed unless new evidence exists.
4. Confirm no live integrations are enabled without separate approval.
5. Confirm HSTS/proxy status — G54 is next safety blocker.
6. Confirm Puriva Launch blockers in deferred-scope register.
7. Obtain explicit owner approval for the specific gate (G49, G50, or live proof).

---

## 10. Historical context

- **G48:** Production readiness planning PASS — sealed checklist; production deploy ready NO.
- **G52-B:** Docs baseline reconciliation (planning).
- **G53:** Production safety plan approved — planning only; supersedes any implied production-ready language from earlier gates.

## G54 HSTS/proxy fix completion (2026-07-09)

**Result:** PASS — HSTS/proxy fix applied on VPS.

**Scope:** Caddy/proxy only. No app deploy, no API/DB/schema/source changes, no migrations, no production app deployment.

**Changed runtime file:** `/opt/dca/caddy/Caddyfile`

**Backup:** `/opt/dca/backups/Caddyfile.G54-HSTS.20260709-073546.bak`

**Reload scope:** `dca-caddy` only.

**Proof:**

- `https://staging.digitalcubeagency.net` returned HTTP/2 200 with `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `https://system.digitalcubeagency.net` returned HTTP/2 200 with `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- staging `/api/v1/health` returned OK with database ready
- production `/api/v1/health` returned OK with database ready

**Warning:** Caddy emitted a formatting warning only. `caddy validate` passed. No formatting-only change was applied during G54 to keep scope minimal.

**Remaining production status:** Production readiness remains **NO**. G54 clears the HSTS/proxy blocker only. G49 dry-run and G50 production deploy are still **not executed** and require separate owner approval.
