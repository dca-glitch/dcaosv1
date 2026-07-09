# Puriva Operating Pack v1 — Local/Admin Go/No-Go

**Status:** Local/admin-operational pack  
**Use for:** Closing the first-client operating pack before any client work starts  
**Scope:** Local/admin only. No deploy, VPS, staging, production, live provider, live WordPress publish, GA/GSC sync, or R2 IO.

**Canonical architecture:** Launch blockers, article/image workflow, monthly report flow, and feedback learning are defined in [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md). This runbook covers local/admin go/no-go only.

Related:

- [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md) — canonical launch blockers and workflows
- [`PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md`](./PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md)
- [`PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md`](./PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md)
- [`docs/operator/client-delivery-sop.md`](../operator/client-delivery-sop.md)
- [`docs/operator/first-client-next-actions.md`](../operator/first-client-next-actions.md)
- [`docs/ai-delivery/client-delivery-readiness.md`](../ai-delivery/client-delivery-readiness.md)

---

## 1) Owner / client approval checklist

Use this before any real Puriva client work starts.

| Area | Owner verifies | Client approves | Admin only | Blocks work |
|---|---|---|---|---|
| Client identity | Brand name, domain, service area, approval contacts | Confirmed account owner / approver | Record the working client profile | Unknown client identity |
| Services | Service list, focus services, excluded topics | Confirmed service priorities | Seed the brief / content plan | Unsupported services |
| Claims / compliance | Claims, contraindications, disclaimers, medical wording | Approves the intended scope | Keep raw notes internal | Unverified medical/legal claims |
| Contacts / route | Primary approver, medical reviewer, ops contact, escalation route | Confirms who can approve what | Map contacts to the workflow | No approval route |
| Brand / content prefs | Voice, language, tone, content goals | Confirms preferences | Apply them to briefs and drafts | Conflicting content direction |
| Assets / rights | Logos, images, screenshots, usage rights | Confirms what can be reused | Prepare asset notes / handoff | No asset rights or missing assets |
| Access decisions | WordPress, analytics, archive visibility | Confirms access decisions | Keep access gated and minimal | Live-access request without approval |

### What can proceed with admin approval only

- Create the monthly project.
- Build the brief and WorkflowBriefs seed.
- Move verified facts into AI Knowledge/context.
- Prepare the SEO plan, content drafts, image notes, and WordPress draft handoff.
- Prepare the monthly report and final-safe archive outputs.

### What blocks work

- Unverified clinic facts or unsupported claims.
- Any before/after, outcome-proof, guarantee, or certainty language that has not been separately approved.
- BPOM, license, partner, or hospital claims without current evidence.
- Missing approval contacts or unclear approval route.
- Missing asset rights or unclear source ownership.
- Live publish requests.
- Live provider, analytics, or bucket IO requests.
- Any request that would expose internal notes, provider details, or storage keys to the client.

---

## 2) Live integration decision matrix

| Integration | Local/admin v1 decision | What is allowed now | What is deferred | Next owner decision |
|---|---|---|---|---|
| Live AI provider | Deferred / decision needed | Local deterministic planning and draft support | Any live provider execution | Separate owner gate |
| WordPress publish | Draft-only now | Prepare WordPress draft payloads | Live publish | Separate approved block |
| GA/GSC | Deferred | None | Live sync / OAuth / reporting | Separate owner gate |
| R2 live IO | Deferred | None | Live bucket reads/writes | Separate owner gate |
| Payments / revenue | Out of scope | None | Billing, collection, revenue automation | Separate product block |

**Rule:** if a path needs a live integration, it is not part of Operating Pack v1.

---

## 3) Production / incident / rollback placeholder

This pack does **not** claim production readiness.
No environment proof has run for this pack.

Before any later production use, all of the following would need to exist:

- approved staging proof for the same path;
- backup and restore evidence;
- rollback evidence for the application path and any data changes;
- monitoring / alerting / incident contacts;
- maintenance window and owner approval;
- a confirmed stop condition for publish or sync failures.

### Stop conditions

Stop immediately if:

- the step requires staging or production;
- the step requires a live provider, live WordPress publish, GA/GSC, or R2;
- the rollback path is unclear;
- the approval route is unclear;
- the requested action would expose internal draft data to the client.

### Rollback evidence required later

- previous commit or image reference;
- config backup location;
- database restore point if any migration is involved;
- health-check proof after rollback;
- owner sign-off that the rollback succeeded.

---

## 4) Real client data packet checklist

Gather and verify these items before real client work starts:

- Puriva facts
- services
- claims
- contraindications / disclaimers
- approved contacts
- approval route
- brand / content preferences
- assets / logos / images
- WordPress access decision
- analytics access decision
- sensitive-topic review notes for Wegovy/semaglutide, stem cell, aesthetic procedures, Bali medical-tourism wording, and before/after policy

**Safe default:** if a field is missing, leave it out and keep it internal until verified.

---

## 5) Go / no-go pack for first client execution

| Gate | Local/admin pass condition |
|---|---|
| Local ready | Validate and the local Puriva E2E dry run pass |
| Client-data ready | Real client data packet is complete enough for drafting |
| Compliance ready | Verified facts, disclaimers, and claims are documented |
| Content ready | Brief, SEO plan, draft, and image notes are coherent |
| Review ready | Admin review can decide what becomes final |
| Final archive/report ready | Client-safe archive and final snapshot monthly report outputs are available |
| Not production-ready | Always true for this pack |

### Local go / no-go rule

- **Go** when the first six gates are pass and the work stays local/admin-only.
- **No-go** if any gate depends on production, staging, live provider use, or live publish.
- **No-go** if the draft plan still contains unverified outcome, license, partner, BPOM, or before/after claims.

---

## 6) Pack summary

This operating pack is the local/admin completion layer for Puriva v1.

It proves the first-client workflow is ready for controlled local execution, but it does not authorize production, staging, or live integrations.
