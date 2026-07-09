# Client Operating Packs — DCA OS Lite

**Status:** Approved (owner decision, G52-B)  
**Date:** 2026-07-09  
**Scope:** Generic model for client-specific operating configuration without forking Core or modules  
**Audience:** Product owner, operators, implementers, AI agents  

**Related documents:**

- [`G52_OWNER_DISPOSITION.md`](./G52_OWNER_DISPOSITION.md) — formal G52-B disposition and gate separation
- [`PURIVA_OPERATING_PACK_V1.md`](./PURIVA_OPERATING_PACK_V1.md) — first pack instance (Puriva)
- [`CLIENT_DOMAIN_OPERATING_MODEL.md`](./CLIENT_DOMAIN_OPERATING_MODEL.md) — domain/client/tenant data model
- [`../ARCHITECTURE.md`](../ARCHITECTURE.md) — platform layers and application map

---

## 1. What a Client Operating Pack is

A **Client Operating Pack** is **not a fork** of DCA OS Core or generic modules.

It is a **named operating bundle** that configures how generic platform capabilities behave for one client service line — using profiles, templates, rules, entitlements, and client-safe surfaces.

```text
Client record (domain / agency client)
  └── Client Operating Pack
        ├── Compliance profile
        ├── Content / tone profile
        ├── Image profile (style, boundaries, dimensions)
        ├── Report rules
        ├── Workflow templates (selected instances)
        ├── Module entitlements
        ├── AI task / risk classes
        ├── Client-safe portal surface map
        ├── Operating checklist
        └── Learning notes (admin-visible)
```

---

## 2. What a pack is not

| Misconception | Correct model |
|---------------|---------------|
| Separate codebase or fork | Same Core + modules; pack is configuration layer |
| Architecture mistake or one-off hack | Intended extension point for client-specific ops |
| Replacement for `Client` entity | Pack hangs off an existing `Client` record |
| SaaS tenant product | Internal agency operating bundle first; productization later |
| Permission to bypass Core safety rules | Pack must still obey FINAL-only portal, tenant isolation, credential boundaries |

---

## 3. Architecture placement

```text
DCA OS Core                    ← generic platform (auth, tenant, audit, module registry)
  → Generic Modules            ← reusable engines (AI Delivery, MI, Reports, Portal, …)
  → Workflow Templates         ← reusable step patterns
  → Module Entitlements        ← which modules this pack may use
  → Profiles                   ← compliance, content, image, report rules
  → Client Operating Pack      ← named bundle for one client service line
  → Client-safe Portal Surfaces ← what external users see and may approve
```

**Core remains generic.**  
**Modules remain generic.**  
**Client-specific behavior comes from configuration/profile/template layers** — not from hard-coding client names into Core services.

---

## 4. Pack components (generic model)

| Component | Purpose |
|-----------|---------|
| **Compliance profile** | Claims, disclaimers, medical/aesthetic guardrails, prohibited language |
| **Content / tone profile** | Voice, language, audience, excluded topics |
| **Image profile** | Style, boundaries, dimension specs, rejection/regeneration rules |
| **Report rules** | Metric sources, narrative policy, client visibility rules |
| **Workflow templates** | e.g. Article + Image Package v1, Monthly Report Flow v1 |
| **Module entitlements** | Enabled modules for this pack's delivery scope |
| **AI task / risk classes** | Which AI tasks are allowed, human-review requirements |
| **Client-safe portal surfaces** | Approvals, archive, reports — mapped per pack |
| **Operating checklist** | Admin go/no-go and launch requirements |
| **Learning notes** | Admin-only per-client preferences from feedback (not client-visible) |

---

## 5. Core vs pack responsibility split

### Core and generic modules own

- Client, project, deliverable, report, and portal access models
- Workflow state machines, review transitions, export/handoff mechanics
- Tenant and client-level isolation
- Disabled-safe integration defaults and readiness inspection
- FINAL-only client visibility enforcement

### Packs own

- Which workflow template runs for this client
- Profile values and pack-specific rules
- Which modules are entitled for this delivery
- Pack launch blockers and live-proof checklist
- Pack-specific learning notes and preference accumulation
- Client-safe surface configuration (within Core boundary rules)

**Test:** If removing the pack config would make the behavior undefined for *all* clients, it likely belongs in Core or a generic module. If it is only true for Puriva (or one client), it belongs in the pack layer.

---

## 6. Workflow templates

Workflow templates are **reusable patterns** stored generically; a pack **selects and configures** them.

Examples (Puriva v1):

- Article + Image Package Workflow v1
- Monthly Report Flow v1

Templates define step order, approval gates, regeneration rules, and handoff points. The pack binds template + profiles + entitlements to a `Client` record.

Detail: [`PURIVA_OPERATING_PACK_V1.md`](./PURIVA_OPERATING_PACK_V1.md).

---

## 7. Profiles (compliance, content, image)

Profiles are the primary mechanism for client-specific behavior without code forks.

| Profile type | Configures |
|--------------|------------|
| **Compliance** | Allowed claims, required disclaimers, medical/aesthetic constraints |
| **Content / tone** | Voice, terminology, sensitive-topic handling |
| **Image** | Style, subject boundaries, dimensions, upscale/social-preview rules |
| **Report** | Approved metric sources, narrative constraints, notification behavior |

Profiles may start as documented operator checklists and evolve toward structured configuration as implementation blocks are approved.

---

## 8. AI task / risk classes

Packs classify AI-assisted work by risk and required human gates:

| Class | Typical handling |
|-------|------------------|
| Low-risk drafting | Admin review before client visibility |
| Medical/aesthetic content | Compliance profile + admin + client approval |
| Image generation | Profile-bound generation; reject/regenerate loops |
| Report narrative | Metrics from approved sources; admin final approval only |
| Publishing handoff | Draft/handoff only until live publish separately approved |

Risk classes are pack-defined; enforcement mechanics remain in generic modules.

---

## 9. Learning notes

Feedback learning is **per-client first** and **admin-only**:

- Reject reasons feed immediate regeneration where approved
- Repeated patterns may become long-term preferences only after admin approval
- Compliance boundaries **cannot** be weakened by learning
- Advanced analytics and client-visible learning remain deferred

---

## 10. First pack: Puriva

**Puriva is the first Client Operating Pack** — not a prototype fork.

- Client record: `puriva.id` (`AGENCY_CLIENT` in DCA LLC tenant)
- Pack: Puriva Operating Pack v1
- Proves: profiles + templates + entitlements + portal surfaces for beauty/clinic SEO/content delivery

Historical note: local/admin operating pack closeout predates G52-B — see [`docs/runbooks/PURIVA_OPERATING_PACK_V1_GO_NO_GO.md`](../runbooks/PURIVA_OPERATING_PACK_V1_GO_NO_GO.md). That document describes **local/admin readiness**, not Puriva Client-Service Launch.

Launch requirements: [`PURIVA_OPERATING_PACK_V1.md`](./PURIVA_OPERATING_PACK_V1.md).

---

## 11. Second client = modularity proof

Adding a second client (e.g. another `AGENCY_CLIENT` or future domain) should require:

- New or cloned pack configuration — not new Core forks
- Different compliance/content/image profiles
- Possibly different workflow template selection
- Possibly different module entitlements

Success criterion: second client validates that Core and modules stayed generic and only pack layers changed.

Second-client proof is a **future productization track item** — not required for Puriva Launch or limited Production v1.

---

## 12. Relationship to domain operating model

The approved domain model ([`CLIENT_DOMAIN_OPERATING_MODEL.md`](./CLIENT_DOMAIN_OPERATING_MODEL.md)) defines:

- Each domain = one `Client` record
- Tenant, publication, finance, and portal boundaries

Client Operating Packs sit **above** the `Client` operational hub — they define **how DCA operates delivery** for that client, not how domains are stored.

---

## 13. Changelog

| Date | Change |
|------|--------|
| 2026-07-09 | Generic Client Operating Pack model approved (G52-B); Puriva documented as first pack |
