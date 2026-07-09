# G52-B Owner Disposition — DCA OS Lite

**Status:** Approved (owner decision)  
**Date:** 2026-07-09  
**Scope:** Formal G52-B disposition after G52-A full-system audit acceptance  
**Audience:** Product owner, operators, implementers, AI agents  

**Related documents:**

- [`docs/STATUS.md`](../STATUS.md) — current gate snapshot (production readiness: **NO**)
- [`docs/runbooks/G53_PRODUCTION_SAFETY_PLAN.md`](../runbooks/G53_PRODUCTION_SAFETY_PLAN.md) — G53 production safety requirements (planning only)
- [`docs/architecture/CLIENT_OPERATING_PACKS.md`](./CLIENT_OPERATING_PACKS.md) — generic Client Operating Pack model
- [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](./PURIVA_OPERATING_PACK_V1.md) — Puriva Client-Service Launch requirements
- [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./CLIENT_DOMAIN_OPERATING_MODEL.md) — domain/client/tenant model

---

## 1. Gate status

| Gate | Status | Meaning |
|------|--------|---------|
| **G52-A** | **Accepted** | Full-system audit findings accepted as accurate baseline |
| **G52-B** | **Approved** | Owner disposition recorded in this document |
| **G53** | **Approved** | Production Safety Plan approved — **planning only**; does not authorize implementation or deploy |
| **Production readiness** | **NO** | Production deploy remains frozen/deferred |
| **G49 / G50** | **Not executed** | Dry-run and deploy gates not yet run |
| **Next logical gate** | **G54** | HSTS/proxy fix gate — not yet prepared or implemented |

---

## 2. Product direction

**Approved direction:**

> **DCA OS Lite = Internal Agency OS first, SaaS-like product later.**

DCA OS Lite is the operating system Digital Cube Agency uses to run client delivery internally. A future SaaS-like licensee/onboarding phase is a separate productization track — not the current readiness claim.

Do not describe DCA OS Lite as SaaS-ready, production-ready, or fully multi-tenant productized today.

---

## 3. Approved architecture stack

```text
DCA OS Core
  → Generic Modules
  → Workflow Templates
  → Module Entitlements
  → Compliance / Content / Image Profiles
  → Client Operating Packs
  → Client-safe Portal Surfaces
```

| Layer | Role | Client-specific? |
|-------|------|------------------|
| **DCA OS Core** | Auth, tenant, RBAC skeleton, module registry, audit, settings, shared runtime boundaries | No — remains generic |
| **Generic Modules** | AI Delivery, Workflow Briefs, Market Intelligence, Monthly Reports, Client Portal, Finance Lite, etc. | No — reusable engines |
| **Workflow Templates** | Reusable delivery patterns (article+image package, monthly report, SEO plan, etc.) | Template is generic; instance is configured per pack |
| **Module Entitlements** | Which modules a tenant/client workflow may use | Configured per tenant/pack |
| **Profiles** | Compliance, content/tone, image boundaries, report rules, dimension specs | Pack-owned configuration |
| **Client Operating Pack** | Named operating bundle for one client service line | Yes — behavior via config, not fork |
| **Client-safe Portal Surfaces** | What external client users may see and approve | Pack + profile governed |

Full pack model: [`CLIENT_OPERATING_PACKS.md`](./CLIENT_OPERATING_PACKS.md).

---

## 4. Puriva disposition

**Puriva (`puriva.id`) is the first Client Operating Pack.**

| Statement | Approved |
|-----------|----------|
| Puriva is a Client Operating Pack | **Yes** |
| Puriva is a codebase fork | **No** |
| Puriva is an architecture mistake | **No** |
| Puriva-specific behavior belongs in profiles/templates/entitlements | **Yes** |
| Core and generic modules must stay client-agnostic | **Yes** |

Puriva proves the pack model in production use. It does not justify hard-coding Puriva rules into Core or generic modules.

Puriva launch detail: [`PURIVA_OPERATING_PACK_V1.md`](./PURIVA_OPERATING_PACK_V1.md).  
Historical local/admin pack closeout (pre-G52): [`docs/runbooks/PURIVA_OPERATING_PACK_V1_GO_NO_GO.md`](../runbooks/PURIVA_OPERATING_PACK_V1_GO_NO_GO.md).

---

## 5. Core vs Client Pack boundary

**Core and generic modules own:**

- Data models and APIs for clients, projects, deliverables, reports, portal access
- Workflow engines, review states, export/handoff mechanics
- Tenant isolation, client-level portal boundaries, FINAL-only client visibility rules
- Integration *shapes* and disabled-safe defaults (not live proof)

**Client Operating Packs own:**

- Compliance and medical/aesthetic guardrails
- Content/tone and claims policy
- Image style, boundaries, and dimension profiles
- Workflow template selection and step rules (e.g. article + image package v1)
- Module entitlement set for that client service
- Client-safe surface mapping (what Puriva approvers see)
- AI task/risk classes and learning notes for that client
- Launch checklist and pack-specific live-proof requirements

**Rule:** If a change is only true for one client, it belongs in pack configuration (profiles, templates, entitlements, learning notes) — not a Core fork.

---

## 6. Gate separation (critical)

Two gates must not be conflated:

### 6.1 DCA OS Production v1 Gate

**Question:** Can the platform safely run in a controlled production environment for agency operations?

- Governs: deploy safety, env separation, rollback, proxy/HSTS, credential storage, integration truth labeling, dry-run proof
- Documented in: [`G53_PRODUCTION_SAFETY_PLAN.md`](../runbooks/G53_PRODUCTION_SAFETY_PLAN.md), [`docs/STATUS.md`](../STATUS.md) §2.12, §7
- **Current answer: NO** (deploy frozen/deferred)

### 6.2 Puriva Client-Service Launch Gate

**Question:** Can Puriva be actively served end-to-end through the system with required live proofs and UX workflows?

- Governs: GA/GSC live proof, R2 live proof, live AI text, image generation proof, transactional notifications, approval UX, pack workflows, compliance profiles
- Documented in: [`PURIVA_OPERATING_PACK_V1.md`](./PURIVA_OPERATING_PACK_V1.md)
- **Current answer: BLOCKED** — pending live proofs and pack workflow gates

**Ordering rule:**

- DCA OS Production v1 may become ready **before** Puriva Launch.
- Puriva **cannot** launch until Puriva-specific blockers are clean — even if Production v1 progresses.

---

## 7. Production blockers (DCA OS Production v1)

Summary — detail in G53 and STATUS.md:

1. Explicit owner approval for production deploy (G50)
2. G49 production deploy dry-run / read-only proof before any mutation
3. HSTS/proxy security warning (G54) — fix or explicit owner deferral
4. Backup and rollback evidence before production mutation
5. Production/staging env and secrets separation confirmed
6. Schema/migration safety confirmed for promoted artifact
7. Integration truth matrix: live AI, WordPress publish, R2 IO, GA/GSC, email sending remain gated unless separately approved and proven
8. Credential encryption and tenant/client boundary confidence
9. Controlled agency operations only — not full automation

**G48 planning PASS does not authorize production deploy.** Staging proof (G46d, G47) does not authorize production deploy.

---

## 8. Puriva Launch blockers (summary)

Puriva cannot launch until these are clean. Full list and workflows: [`PURIVA_OPERATING_PACK_V1.md`](./PURIVA_OPERATING_PACK_V1.md).

| Category | Blocker |
|----------|---------|
| **Live integrations** | GA/GSC live proof; R2/storage live proof; live AI text proof |
| **AI governance** | AI Model Research Gate; AI Model Policy |
| **Image** | Image generation provider research; image generation staging proof; image profile/boundaries; image dimension profile |
| **Notifications** | Transactional notification proof (in-system + email) |
| **UX / ops** | Client Portal approval UX; task-oriented admin UX; admin operating checklist |
| **Profiles** | Medical compliance profile; content/tone profile |
| **Workflows** | Puriva Article + Image Package Workflow v1; Puriva Monthly Report Flow v1 |
| **Learning** | Basic feedback learning layer; admin-visible learning notes/preferences |
| **Handoff** | WordPress draft/handoff readiness; integration health visibility |

---

## 9. Approved policies (AI, image, notification, report, feedback)

### 9.1 AI policy

- AI prepares; **admin reviews and decides** what becomes final
- Live AI execution requires separate research gate, model policy, and staging/live proof
- Local deterministic execution is the current safe default
- AI cannot invent metrics in monthly reports
- Compliance boundaries cannot be weakened by learning or regeneration
- No autonomous agents or uncontrolled provider execution

### 9.2 Image policy

- Image generation follows pack image profile and boundaries
- Reject reason required for admin and client image rejection
- Regenerate only rejected images unless full package rejected
- Upscale only after approval
- Social preview derived from hero; admin final check required (not separate client approval)
- WordPress draft/handoff only after final package approval

### 9.3 Notification policy

- Puriva notifications are **transactional workflow notifications** (approvals, report delivery, admin alerts) — not marketing automation
- Requires in-system + email proof before Puriva Launch
- Marketing/bulk email, SMS, WhatsApp remain deferred

### 9.4 Monthly report policy

- Metrics/trends from GA/GSC or other approved source of truth only
- AI may generate narrative/insights after metrics are sourced
- Admin reviews, may reject/revise narrative with reason, approves final report
- Client receives **final report only** — no client approval, reject, comments, or request-changes flow
- FINAL status required for Client Portal visibility (unchanged Core rule)

### 9.5 Feedback learning policy

- Per-client first; admin-only learning notes
- Covers articles, images, and monthly report narrative feedback
- Reject reason required; immediate regeneration may use feedback
- Long-term preference only after repeated pattern or admin approval
- Compliance boundaries cannot be weakened
- Advanced learning analytics/dashboard deferred

Workflow detail: [`PURIVA_OPERATING_PACK_V1.md`](./PURIVA_OPERATING_PACK_V1.md).

---

## 10. Approved roadmap tracks

Three parallel tracks — do not merge gates across tracks:

| Track | Purpose | Current state |
|-------|---------|---------------|
| **Production Safety** | G54 → G49 → G50; HSTS, rollback, env, dry-run | G53 approved (planning); deploy **NO** |
| **Live Integration Proof** | R2, GA/GSC, live AI, image gen, transactional email — staging proof before client launch | Not proven for Puriva Launch |
| **Client Operating Pack / Productization** | Pack profiles, workflows, portal UX, learning layer; second client as modularity proof later | Puriva pack v1 in progress; launch **BLOCKED** |

**Still deferred beyond Production v1 and Puriva Launch:**

- Autonomous agents / background jobs
- WordPress auto-publish (draft/handoff required for Puriva Launch)
- Full SaaS onboarding and licensee self-service
- Second-client modularity proof (future validation of pack model)
- Advanced learning dashboard, A/B testing, multi-provider image optimization
- Full DB-backed custom roles UI (blocker before scaling/SaaS phase, not limited Production v1 if boundaries safe)

---

## 11. RBAC stance (G52-B + G53 alignment)

- Limited Production v1 for controlled agency ops may proceed when tenant/client boundaries are safe — **full DB-backed custom roles UI is not required for that limited scope**
- Full RBAC enforcement and custom roles UI become blockers before scaling or SaaS-like productization
- Client portal remains FINAL-only and client-safe; no internal workflow exposure

---

## 12. Changelog

| Date | Change |
|------|--------|
| 2026-07-09 | G52-B owner disposition recorded: product direction, architecture stack, Puriva as first pack, gate separation, blockers, policies, roadmap tracks |
